import {loadShader, Material, Primitive, Topology, Vertex, Texture, Cubemap, UBO, mth} from "./primitive.js";
import {Target} from "./target.js";
import {Timer} from "./timer.js";

export {Material, Primitive, Topology, Vertex, Texture, Cubemap, UBO, mth};

export class System {
  renderQueue;
  gl;
  camera;
  cameraUBO;

  target;
  fsPrimitive = null;

  units;  // unit list
  timer;  // timer
  lastUnitID = 0;

  currentObjectID = 0;

  constructor() {
    // WebGL initialization
    let canvas = document.getElementById("canvas");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let gl = canvas.getContext("webgl2");
    if (gl == null) {
      throw Error("Can't initialize WebGL2");
    }

    let extensions = ["EXT_color_buffer_float", "OES_texture_float_linear"];
    for (let i = 0; i < extensions.length; i++)
      if (gl.getExtension(extensions[i]) == null)
        throw Error(`"${extensions[i]}" extension required`);

    this.gl = gl;

    gl.enable(WebGL2RenderingContext.DEPTH_TEST);
    gl.depthFunc(WebGL2RenderingContext.LEQUAL);

    this.renderQueue = [];
    this.camera = new mth.Camera();

    this.cameraUBO = new UBO(this.gl);

    this.camera.resize(new mth.Size(canvas.width, canvas.height));

    // targets setup
    let size = new mth.Size(canvas.width, canvas.height);
    this.target = new Target(gl, 1);

    this.target.resize(size);
    Target.default(gl).resize(size);

    // resize handling
    window.onresize = () => {
      let resolution = new mth.Size(window.innerWidth, window.innerHeight);

      canvas.width = resolution.w;
      canvas.height = resolution.h;

      this.camera.resize(resolution);
      this.target.resize(resolution);
      Target.default(gl).resize(resolution);
    };

    this.units = {};
    this.timer = new Timer();
  } /* constructor */

  drawPrimitive(primitive, transform = mth.Mat4.identity()) {
    this.renderQueue.push({
      primitive: primitive,
      transform: transform,
      id:        this.currentObjectID
    });
  } /* drawPrimitive */

  createTexture() {
    return new Texture(this.gl, Texture.UNSIGNED_BYTE, 4);
  } /* createTexture */

  createCubemap() {
    return new Cubemap(this.gl);
  } /* createCubemap */

  createUniformBuffer() {
    return new UBO(this.gl);
  } /* createUniformBuffer */

  async createShader(path) {
    return loadShader(this.gl, path);
  } /* createShader */

  async createMaterial(shader) {
    if (typeof(shader) == "string") {
      return new Material(this.gl, await loadShader(this.gl, shader));
    } else {
      return new Material(this.gl, shader);
    }
  } /* createMaterial */

  createPrimitive(topology, material) {
    return Primitive.fromTopology(this.gl, topology, material);
  } /* createPrimitive */

  async start() {
    if (this.fsPrimitive == null) {
      this.fsPrimitive = await this.createPrimitive(Topology.square(), await this.createMaterial("./shaders/target"));
      this.fsPrimitive.material.textures = this.target.attachments;
    }
  } /* start */
  
  end() {
    // rendering in target
    let gl = this.gl;

    this.target.bind();

    let cameraInfo = new Float32Array(36);

    for (let i = 0; i < 16; i++) {
      cameraInfo[i + 16] = this.camera.viewProj.m[i];
    }
    cameraInfo[32] = this.camera.loc.x;
    cameraInfo[33] = this.camera.loc.y;
    cameraInfo[34] = this.camera.loc.z;
    cameraInfo[35] = 0; // ID of object

    for (let i = 0, count = this.renderQueue.length; i < count; i++) {
      let prim = this.renderQueue[i].primitive;
      let trans = this.renderQueue[i].transform;

      for (let i = 0; i < 16; i++) {
        cameraInfo[i] = trans.m[i];
      }
      cameraInfo[35] = this.renderQueue[i].id;

      this.cameraUBO.writeData(cameraInfo);

      prim.draw(this.cameraUBO);
    }

    // flush render queue
    this.renderQueue = [];

    // rendering to screen framebuffer
    Target.default(gl).bind();
    this.fsPrimitive.draw(this.cameraUBO);
  } /* end */


  static isPromise = function(v) {
    return v => typeof(v) === "object" && typeof v.then === "function";
  } /* isPromise */

  async addUnit(createFunction) {
    let val = createFunction(this);

    if (System.isPromise(val)) {
      val = await val;
    }

    val.systemId = this.lastUnitID++;
    this.units[val.systemId] = val;

    return val;
  } /* addUnit */

  getUnitByID(id) {
    return this.units[id];
  } /* getUnitByID */

  run() {
    let system = this;

    const run = async function() {
      system.timer.response();

      await system.start();

      for (const id in system.units) {
        let unit = system.units[id];

        system.currentObjectID = unit.systemId;
        unit.response(system);
      }

      system.end();

      window.requestAnimationFrame(run);
    };

    window.requestAnimationFrame(run);
  } /* run */
} /* Render */

/* render.js */