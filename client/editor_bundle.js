function shaderModuleFromSource(gl, type, source) {
  if (source == null) {
    return null;
  }

  let shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  let res = gl.getShaderInfoLog(shader);
  if (res != null && res.length > 0)
    console.error(`Shader module compilation error: ${res}`);

  return shader;
} /* shaderModuleFromSource */

function shaderFromSource(gl, vertSource, fragSource) {
  let modules = [
    shaderModuleFromSource(gl, gl.VERTEX_SHADER, vertSource),
    shaderModuleFromSource(gl, gl.FRAGMENT_SHADER, fragSource),
  ];
  let program = gl.createProgram();

  for (let i = 0; i < modules.length; i++) {
    if (modules[i] != null) {
      gl.attachShader(program, modules[i]);
    }
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.error(`Shader linking error: ${gl.getProgramInfoLog(program)}`);

  return program;
} /* shaderFromSource */

async function loadShader(gl, path) {
  return shaderFromSource(gl,
    await fetch(path + ".vert?" + Math.random().toString()).then(response => response.ok ? response.text() : null),
    await fetch(path + ".frag?" + Math.random().toString()).then(response => response.ok ? response.text() : null),
  );
} /* loadShader */

class Vec3 {
  x;
  y;
  z;

  constructor(nx, ny, nz) {
    this.x = nx;
    this.y = ny;
    this.z = nz;
  } /* constructor */

  copy() {
    return new Vec3(this.x, this.y, this.z);
  } /* copy */

  add(m2) {
    return new Vec3(this.x + m2.x, this.y + m2.y, this.z + m2.z);
  } /* add */

  sub(m2) {
    return new Vec3(this.x - m2.x, this.y - m2.y, this.z - m2.z);
  } /* sub */

  mul(m2) {
    if (typeof(m2) == "Vec3")
      return new Vec3(this.x * m2.x, this.y * m2.y, this.z * m2.z);
    else
      return new Vec3(this.x * m2,   this.y * m2,   this.z * m2  );
  } /* mul */

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  } /* length */

  distance(m2) {
    let
      dx = this.x - m2.x,
      dy = this.y - m2.y,
      dz = this.z - m2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  } /* distance */

  dot(m2) {
    return this.x * m2.x + this.y * m2.y + this.z * m2.z;
  } /* dot */

  cross(othv) {
    return new Vec3(
      this.y * othv.z - othv.y * this.z,
      this.z * othv.x - othv.z * this.x,
      this.x * othv.y - othv.x * this.y
    );
  } /* cross */

  normalize() {
    let len = this.length();

    return new Vec3(this.x / len, this.y / len, this.z / len);
  } /* normalize */

  static fromSpherical(azimuth, elevation, radius = 1) {
    return new Vec3(
      radius * Math.sin(elevation) * Math.cos(azimuth),
      radius * Math.cos(elevation),
      radius * Math.sin(elevation) * Math.sin(azimuth)
    );
  } /* sphericalToCartesian */

  static fromObject(object) {
    return new Vec3(object.x, object.y, object.z);
  } /* fromObject */
} /* Vec3 */

class Vec2 {
  x;
  y;

  constructor(nx, ny) {
    this.x = nx;
    this.y = ny;
  } /* constructor */

  copy() {
    return new Vec2();
  }

  add(m2) {
    return new Vec2(this.x + m2.x, this.y + m2.y);
  } /* add */

  sub(m2) {
    return new Vec2(this.x - m2.x, this.y - m2.y);
  } /* sub */

  mul(m2) {
    if (typeof(m2) == "Vec2")
      return new Vec2(this.x * m2.x, this.y * m2.y);
    else
      return new Vec2(this.x * m2,   this.y * m2);
  } /* mul */

  length2() {
    return this.x * this.x + this.y * this;  } /* length2 */

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  } /* length */

  dot(m2) {
    return this.x * m2.x + this.y * m2.y;
  } /* dot */

  cross(othv) {
    return this.x * othv.y - othv.x * this.y;
  } /* cross */

  normalize() {
    let len = this.length();

    return new Vec2(this.x / len, this.y / len);
  } /* normalize */

  neg() {
    return new Vec2(-this.x, -this.y);
  } /* neg */

  left() {
    return new Vec2(-this.y, this.x);
  } /* right */

  right() {
    return new Vec2(this.y, -this.x);
  } /* right */
} /* Vec2 */

class Size {
  w;
  h;

  constructor(w, h) {
    this.w = w;
    this.h = h;
  } /* constructor */

  copy() {
    return new Size(this.w, this.h);
  } /* copy */
} /* Size */

class Mat4 {
  m;

  constructor(v00, v01, v02, v03,
              v10, v11, v12, v13,
              v20, v21, v22, v23,
              v30, v31, v32, v33) {
    this.m = [
      v00, v01, v02, v03,
      v10, v11, v12, v13,
      v20, v21, v22, v23,
      v30, v31, v32, v33
    ];
  } /* constructor */

  copy() {
    return new Mat4(
      this.m[ 0], this.m[ 1], this.m[ 2], this.m[ 3],
      this.m[ 4], this.m[ 5], this.m[ 6], this.m[ 7],
      this.m[ 8], this.m[ 9], this.m[10], this.m[11],
      this.m[12], this.m[13], this.m[14], this.m[15],
    );
  } /* copy */

  transformPoint(v)
  {
    return new Vec3(
      v.x * this.m[ 0] + v.y * this.m[ 4] + v.z * this.m[ 8] + this.m[12],
      v.x * this.m[ 1] + v.y * this.m[ 5] + v.z * this.m[ 9] + this.m[13],
      v.x * this.m[ 2] + v.y * this.m[ 6] + v.z * this.m[10] + this.m[14]
    );
  } /* transformPoint */

  transform4x4(v)
  {
    let w = v.x * this.m[3] + v.y * this.m[7] + v.z * this.m[11] + this.m[15];
  
    return new Vec3(
      (v.x * this.m[ 0] + v.y * this.m[ 4] + v.z * this.m[ 8] + this.m[12]) / w,
      (v.x * this.m[ 1] + v.y * this.m[ 5] + v.z * this.m[ 9] + this.m[13]) / w,
      (v.x * this.m[ 2] + v.y * this.m[ 6] + v.z * this.m[10] + this.m[14]) / w
    );
  } /* transform4x4 */

  transpose() {
    return new Mat4(
      this.m[ 0], this.m[ 4], this.m[ 8], this.m[12],
      this.m[ 1], this.m[ 5], this.m[ 9], this.m[13],
      this.m[ 2], this.m[ 6], this.m[10], this.m[14],
      this.m[ 3], this.m[ 7], this.m[11], this.m[15]
    );
  } /* transpose */

  mul(m2) {
    return new Mat4(
      this.m[ 0] * m2.m[ 0] + this.m[ 1] * m2.m[ 4] + this.m[ 2] * m2.m[ 8] + this.m[ 3] * m2.m[12],
      this.m[ 0] * m2.m[ 1] + this.m[ 1] * m2.m[ 5] + this.m[ 2] * m2.m[ 9] + this.m[ 3] * m2.m[13],
      this.m[ 0] * m2.m[ 2] + this.m[ 1] * m2.m[ 6] + this.m[ 2] * m2.m[10] + this.m[ 3] * m2.m[14],
      this.m[ 0] * m2.m[ 3] + this.m[ 1] * m2.m[ 7] + this.m[ 2] * m2.m[11] + this.m[ 3] * m2.m[15],

      this.m[ 4] * m2.m[ 0] + this.m[ 5] * m2.m[ 4] + this.m[ 6] * m2.m[ 8] + this.m[ 7] * m2.m[12],
      this.m[ 4] * m2.m[ 1] + this.m[ 5] * m2.m[ 5] + this.m[ 6] * m2.m[ 9] + this.m[ 7] * m2.m[13],
      this.m[ 4] * m2.m[ 2] + this.m[ 5] * m2.m[ 6] + this.m[ 6] * m2.m[10] + this.m[ 7] * m2.m[14],
      this.m[ 4] * m2.m[ 3] + this.m[ 5] * m2.m[ 7] + this.m[ 6] * m2.m[11] + this.m[ 7] * m2.m[15],

      this.m[ 8] * m2.m[ 0] + this.m[ 9] * m2.m[ 4] + this.m[10] * m2.m[ 8] + this.m[11] * m2.m[12],
      this.m[ 8] * m2.m[ 1] + this.m[ 9] * m2.m[ 5] + this.m[10] * m2.m[ 9] + this.m[11] * m2.m[13],
      this.m[ 8] * m2.m[ 2] + this.m[ 9] * m2.m[ 6] + this.m[10] * m2.m[10] + this.m[11] * m2.m[14],
      this.m[ 8] * m2.m[ 3] + this.m[ 9] * m2.m[ 7] + this.m[10] * m2.m[11] + this.m[11] * m2.m[15],

      this.m[12] * m2.m[ 0] + this.m[13] * m2.m[ 4] + this.m[14] * m2.m[ 8] + this.m[15] * m2.m[12],
      this.m[12] * m2.m[ 1] + this.m[13] * m2.m[ 5] + this.m[14] * m2.m[ 9] + this.m[15] * m2.m[13],
      this.m[12] * m2.m[ 2] + this.m[13] * m2.m[ 6] + this.m[14] * m2.m[10] + this.m[15] * m2.m[14],
      this.m[12] * m2.m[ 3] + this.m[13] * m2.m[ 7] + this.m[14] * m2.m[11] + this.m[15] * m2.m[15],
    );
  } /* mul */

  static identity() {
    return new Mat4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  } /* identity */

  static scale(s) {
    return new Mat4(
      s.x, 0,   0,   0,
      0,   s.y, 0,   0,
      0,   0,   s.z, 0,
      0,   0,   0,   1
    );
  } /* scale */

  static translate(t) {
    return new Mat4(
      1,   0,   0,   0,
      0,   1,   0,   0,
      0,   0,   1,   0,
      t.x, t.y, t.z, 1
    );
  } /* translate */

  static rotateX(angle) {
    let s = Math.sin(angle), c = Math.cos(angle);

    return new Mat4(
      1, 0, 0, 0,
      0, c, s, 0,
      0,-s, c, 0,
      0, 0, 0, 1
    );
  } /* rotateX */

  static rotateY(angle) {
    let s = Math.sin(angle), c = Math.cos(angle);

    return new Mat4(
      c, 0,-s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    );
  } /* rotateY */

  static rotateZ(angle) {
    let s = Math.sin(angle), c = Math.cos(angle);

    return new Mat4(
      c, s, 0, 0,
     -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  } /* rotateZ */

  static rotate(angle, axis) {
    let v = axis.normalize();
    let s = Math.sin(angle), c = Math.cos(angle);

    return new Mat4(
      v.x * v.x * (1 - c) + c,         v.x * v.y * (1 - c) - v.z * s,   v.x * v.z * (1 - c) + v.y * s,   0,
      v.y * v.x * (1 - c) + v.z * s,   v.y * v.y * (1 - c) + c,         v.y * v.z * (1 - c) - v.x * s,   0,
      v.z * v.x * (1 - c) - v.y * s,   v.z * v.y * (1 - c) + v.x * s,   v.z * v.z * (1 - c) + c,         0,
      0,                               0,                               0,                               1
    );
  } /* rotate */

  static view(loc, at, up) {
    let
      dir = at.sub(loc).normalize(),
      rgh = dir.cross(up).normalize(),
      tup = rgh.cross(dir);

    return new Mat4(
      rgh.x,         tup.x,         -dir.x,       0,
      rgh.y,         tup.y,         -dir.y,       0,
      rgh.z,         tup.z,         -dir.z,       0,
      -loc.dot(rgh), -loc.dot(tup), loc.dot(dir), 1
    );
  } /* view */

  static frustum(left, right, bottom, top, near, far) {
    return new Mat4(
      2 * near / (right - left),       0,                               0,                              0,
      0,                               2 * near / (top - bottom),       0,                              0,
      (right + left) / (right - left), (top + bottom) / (top - bottom), (near + far) / (near - far),   -1,
      0,                               0,                               2 * near * far / (near - far),  0
    );
  } /* frustum */
} /* Mat4 */

class Camera {
  // camera projection shape params
  projSize = new Size(0.01, 0.01);
  correctedProjSize = new Size(0.01, 0.01);
  near = 0.01;
  far = 8192;

  // current screen resolution
  screenSize;

  // camera location
  loc;
  at;
  dir;
  up;
  right;

  // camera projection matrices
  view;
  proj;
  viewProj;

  constructor() {
    this.proj = Mat4.identity();
    this.set(new Vec3(0, 0, -1), new Vec3(0, 0, 0), new Vec3(0, 1, 0));
    this.resize(new Size(30, 30));
  } /* constructor */

  projSet(newNear, newFar, newProjSize) {
    this.projSize = newProjSize.copy();
    this.near = newNear;
    this.far = newFar;
    this.correctedProjSize = this.projSize.copy();

    if (this.screenSize.w > this.screenSize.h) {
      this.correctedProjSize.w *= this.screenSize.w / this.screenSize.h;
    } else {
      this.correctedProjSize.h *= this.screenSize.h / this.screenSize.w;
    }

    this.proj = Mat4.frustum(
      -this.correctedProjSize.w / 2, this.correctedProjSize.w / 2,
      -this.correctedProjSize.h / 2, this.correctedProjSize.h / 2,
      this.near, this.far
    );
    this.viewProj = this.view.mul(this.proj);
  } /* projSet */

  resize(newScreenSize) {
    this.screenSize = newScreenSize.copy();
    this.projSet(this.near, this.far, this.projSize);
  } /* resize */

  set(loc, at, up) {
    this.view = Mat4.view(loc, at, up);
    this.viewProj = this.view.mul(this.proj);

    this.loc = loc.copy();
    this.at = at.copy();

    this.right = new Vec3(this.view.m[ 0], this.view.m[ 4], this.view.m[ 8]);
    this.up    = new Vec3(this.view.m[ 1], this.view.m[ 5], this.view.m[ 9]);
    this.dir   = new Vec3(this.view.m[ 2], this.view.m[ 6], this.view.m[10]).mul(-1);
  } /* set */
} /* Camera */

/* format decoding function */
function getFormat(componentType, componentCount) {
  const fmts = [WebGL2RenderingContext.RED, WebGL2RenderingContext.RG, WebGL2RenderingContext.RGB, WebGL2RenderingContext.RGBA];
  switch (componentType) {
    case Texture.FLOAT:
      const floatInternals = [WebGL2RenderingContext.R32F, WebGL2RenderingContext.RG32F, WebGL2RenderingContext.RGB32F, WebGL2RenderingContext.RGBA32F];
      return {
        format: fmts[componentCount - 1],
        internal: floatInternals[componentCount - 1],
        componentType: WebGL2RenderingContext.FLOAT,
      };

    case Texture.UNSIGNED_BYTE:
      const byteInternals = [WebGL2RenderingContext.R8, WebGL2RenderingContext.RG8, WebGL2RenderingContext.RGB8, WebGL2RenderingContext.RGBA8];
      return {
        format: fmts[componentCount - 1],
        internal: byteInternals[componentCount - 1],
        componentType: WebGL2RenderingContext.UNSIGNED_BYTE,
      };

    case Texture.DEPTH:
      return {
        format: WebGL2RenderingContext.DEPTH_COMPONENT,
        internal: WebGL2RenderingContext.DEPTH_COMPONENT32F,
        componentType: WebGL2RenderingContext.FLOAT,
      };

    default:
      // minimal format possible
      return {
        format: WebGL2RenderingContext.RED,
        internal: WebGL2RenderingContext.R8,
        componentType: WebGL2RenderingContext.UNSIGNED_BYTE,
      };
  }
} /* getFormat */

class Texture {
  #gl;
  #format;
  size;
  id;

  static FLOAT         = 0;
  static UNSIGNED_BYTE = 1;
  static DEPTH         = 2;

  constructor(gl, componentType = Texture.FLOAT, componentCount = 1) {
    this.gl = gl;
    this.size = new Size(1, 1);
    this.id = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.id);

    this.format = getFormat(componentType, componentCount);
    // put empty image data
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format.internal, 1, 1, 0, this.format.format, this.format.componentType, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  } /* constructor */

  
  static defaultCheckerTexture = null;
  static defaultChecker(gl) {
    if (Texture.defaultCheckerTexture === null) {
      Texture.defaultCheckerTexture = new Texture(gl, Texture.UNSIGNED_BYTE, 4);
  
      gl.bindTexture(gl.TEXTURE_2D, Texture.defaultCheckerTexture.id);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0x00, 0xFF, 0x00, 0xFF]));

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    return Texture.defaultCheckerTexture;
  } /* defaultChecker */

  defaultChecker(data) {
    this.gl.bindTexture(gl.TEXTURE_2D, this.id);
    this.gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
      0x00, 0xFF, 0x00, 0xFF,
      0x00, 0x00, 0x00, 0xFF,
      0x00, 0x00, 0x00, 0xFF,
      0x00, 0xFF, 0x00, 0xFF,
    ]));
  }

  load(path) {
    return new Promise((resolve, reject) => {
      let image = new Image();

      image.src = path;
      image.onload = () => { 
        this.fromImage(image);
        resolve();
      };
    });
  } /* load */

  fromImage(image) {
    let gl = this.gl;

    this.size.w = image.width;
    this.size.h = image.height;
    gl.bindTexture(gl.TEXTURE_2D, this.id);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format.internal, this.format.format, this.format.componentType, image);
  } /* fromImage */

  bind(program, index = 0) {
    let gl = this.gl;

    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, this.id);

    let location = gl.getUniformLocation(program, `Texture${index}`);
    gl.uniform1i(location, index);
  } /* bind */

  resize(size) {
    let gl = this.gl;
    this.size = size.copy();

    gl.texImage2D(gl.TEXTURE_2D, 0, this.format.internal, this.size.w, this.size.h, 0, this.format.format, this.format.componentType, null);
  } /* resize */
} /* Texture */

const faceDescriptions = [
  {target: WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X, text: "+X", path: "posX"},
  {target: WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X, text: "-X", path: "negX"},
  {target: WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y, text: "+Y", path: "posY"},
  {target: WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y, text: "-Y", path: "negY"},
  {target: WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z, text: "+Z", path: "posZ"},
  {target: WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z, text: "-Z", path: "negZ"},
];

class Cubemap {
  #gl;
  id;

  constructor(gl) {
    this.gl = gl;

    let ctx = document.createElement("canvas").getContext("2d");

    ctx.canvas.width = 128;
    ctx.canvas.height = 128;

    function drawFace(text) {
      const {width, height} = ctx.canvas;

      ctx.fillStyle = '#CCC';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${width * 0.5}px consolas`;
      ctx.textAlign = 'center';
      ctx.textBaseLine = 'middle';
      ctx.fillStyle = '#333';

      ctx.fillText(text, width / 2, height / 2);
    }

    this.id = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);

    for (let descr of faceDescriptions) {
      drawFace(descr.text);

      gl.texImage2D(descr.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
    }
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  
    ctx.canvas.remove();
  } /* constructor */

  load(path) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);

    for (let descr of faceDescriptions) {
      new Image();

      gl.texImage2D(descr.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
    }
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  } /* load */

  bind(program, index = 0) {
    let gl = this.gl;

    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);

    let location = gl.getUniformLocation(program, `Texture${index}`);
    gl.uniform1i(location, index);
  } /* bind */
} /* Cubemap */

class UBO {
  gl;
  buffer;
  isEmpty = true;

  constructor(gl) {
    this.gl = gl;
    this.buffer = gl.createBuffer();
  } /* constructor */

  writeData(dataAsFloatArray) {
    this.isEmpty = false;
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.buffer);
    this.gl.bufferData(this.gl.UNIFORM_BUFFER, dataAsFloatArray, this.gl.STATIC_DRAW);
  } /* writeData */

  bind(shader, bindingPoint, bufferName) {
    let gl = this.gl;

    if (!this.isEmpty) {
      let location = gl.getUniformBlockIndex(shader, bufferName);

      if (location != gl.INVALID_INDEX) {
        gl.uniformBlockBinding(shader, location, bindingPoint);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, this.buffer);
      }
    }
  } /* bind */
} /* UBO */

class Material {
  uboNameOnShader = "";
  gl;
  ubo = null;    // object buffer
  textures = []; // array of textures
  shader;        // shader pointer

  constructor(gl, shader) {
    this.gl = gl;
    this.shader = shader;
  } /* constructor */

  apply() {
    let gl = this.gl;

    gl.useProgram(this.shader);

    if (this.ubo != null)
      this.ubo.bind(this.shader, 0, this.uboNameOnShader);
    for (let i = 0; i < this.textures.length; i++)
      this.textures[i].bind(this.shader, i);
  } /* apply */

  unboundTextures() {
    let gl = this.gl;

    for (let i = 0; i < this.textures.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  } /* unboundTextures */
} /* Material */

class Vertex {
  p;
  t;
  n;

  constructor(position, texcoord, normal) {
    this.p = position;
    this.t = texcoord;
    this.n = normal;
  } /* constructor */

  static fromCoord(px, py, pz, pu = 0, pv = 0, pnx = 0, pny = 0, pnz = 1) {
    return new Vertex(new Vec3(px, py, pz), new Vec2(pu, pv), new Vec3(pnx, pny, pnz));
  } /* fromCoord */

  static fromVectors(p, t = new Vec2(0, 0), n = new Vec3(1, 1, 1)) {
    return new Vertex(p.copy(), t.copy(), n.copy());
  } /* fromVectors */
}
class Topology {
  vtx;
  idx;
  type = Topology.TRIANGLES;

  static LINES          = WebGL2RenderingContext.LINES;
  static LINE_STRIP     = WebGL2RenderingContext.LINE_STRIP;
  static LINE_LOOP      = WebGL2RenderingContext.LINE_LOOP;

  static POINTS         = WebGL2RenderingContext.POINTS;

  static TRIANGLES      = WebGL2RenderingContext.TRIANGLES;
  static TRIANGLE_STRIP = WebGL2RenderingContext.TRIANGLE_STRIP;
  static TRIANGLE_FAN   = WebGL2RenderingContext.TRIANGLE_FAN;

  constructor(nvtx = [], nidx = null) {
    this.vtx = nvtx;
    this.idx = nidx;
  } /* constructor */

  static geometryTypeToGL(geometryType) {
    return geometryType;
  } /* geometryTypeToGL */

  static square() {
    let tpl = new Topology([
      Vertex.fromCoord(-1, -1, 0, 0, 0),
      Vertex.fromCoord(-1,  1, 0, 0, 1),
      Vertex.fromCoord( 1, -1, 0, 1, 0),
      Vertex.fromCoord( 1,  1, 0, 1, 1)
    ], [0, 1, 2, 3]);
    tpl.type = Topology.TRIANGLE_STRIP;
    return tpl;
  } /* theTriangle */

  static #planeIndexed(width = 30, height = 30) {
    let tpl = new Topology();

    tpl.type = Topology.TRIANGLE_STRIP;
    tpl.vtx = [];
    tpl.idx = [];

    let i = 0;
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width; x++) {
        tpl.idx[i++] = y * width + x;
        tpl.idx[i++] = (y + 1) * width + x;
      }
      tpl.idx[i++] = -1;
    }

    return tpl;
  } /* planeIndexed */

  static plane(width = 30, height = 30) {
    let tpl = Topology.#planeIndexed(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tpl.vtx[y * width + x] = Vertex.fromCoord(
          x, 0, y,
          x / (width - 1), y / (height - 1),
          0, 1, 0
        );
      }
    }

    return tpl;
  } /* plane */

  static cone(size = 30) {
    let tpl = new Topology([], []);

    tpl.vtx.push(Vertex.fromCoord(0, 1, 0));
    for (let i = 0; i < size; i++) {
      let a = i / (size - 1) * Math.PI * 2;

      tpl.vtx.push(Vertex.fromCoord(Math.cos(a), 0, Math.sin(a)));

      tpl.idx.push(i % size + 1);
      tpl.idx.push(0);
      tpl.idx.push((i + 1) % size + 1);
    }

    return tpl;
  } /* cone */

  static cylinder(size=30) {
    let tpl = new Topology([]);
    tpl.type = this.TRIANGLE_STRIP;

    for (let i = 0; i <= size; i++) {
      let a = i / (size - 2) * Math.PI * 2;
      let ca = Math.cos(a), sa = Math.sin(a);

      tpl.vtx.push(Vertex.fromCoord(ca, 0, sa));
      tpl.vtx.push(Vertex.fromCoord(ca, 1, sa));
    }

    return tpl;
  } /* cylinder */

  static sphere(radius = 1, width = 30, height = 30) {
    let tpl = Topology.#planeIndexed(width, height);

    for (let y = 0; y < height; y++) {
      let theta = Math.PI * y / (height - 1);
      let stheta = Math.sin(theta);
      let ctheta = Math.cos(theta);

      for (let x = 0; x < width; x++) {
        let phi = 2 * Math.PI * x / (width - 1);

        let nx = stheta * Math.sin(phi);
        let ny = ctheta;
        let nz = stheta * Math.cos(phi);

        tpl.vtx[y * width + x] = Vertex.fromCoord(
          radius * nx, radius * ny, radius * nz,
          x / (width - 1), y / (height - 1),
          nx, ny, nz
        );
      }
    }

    return tpl;
  } /* sphere */

  static async model_obj(path) {
    let tpl = new Topology();
    tpl.vtx = [];
    tpl.type = Topology.TRIANGLES;

    const src = await fetch(path).then(response => response.text());
    let lines = src.split("\n");
    let positions = [];
    let texCoords = [];
    let normals = [];

    for (let li = 0, lineCount = lines.length; li < lineCount; li++) {
      let segments = lines[li].split(" ");

      switch (segments[0]) {
        case "v":
          positions.push(new Vec3(
            parseFloat(segments[1]),
            parseFloat(segments[2]),
            parseFloat(segments[3])
          ));
          break;

        case "vt":
          texCoords.push(new Vec2(
            parseFloat(segments[1]),
            parseFloat(segments[2])
          ));
          break;

        case "vn":
          normals.push(new Vec3(
            parseFloat(segments[1]),
            parseFloat(segments[2]),
            parseFloat(segments[3])
          ));
          break;

        case "f":
          {
            let vtd = segments[1].split("/");
            let i0 = parseInt(vtd[0]), i1 = parseInt(vtd[1]), i2 = parseInt(vtd[2]);

            tpl.vtx.push(new Vertex(
              Number.isNaN(i0) ? new Vec3(0, 0, 0) : positions[i0 - 1],
              Number.isNaN(i1) ? new Vec2(0, 0) : texCoords[i1 - 1],
              Number.isNaN(i2) ? new Vec3(0, 0, 0) : normals[i2 - 1]
            ));
          }
          {
            let vtd = segments[2].split("/");
            let i0 = parseInt(vtd[0]), i1 = parseInt(vtd[1]), i2 = parseInt(vtd[2]);

            tpl.vtx.push(new Vertex(
              Number.isNaN(i0) ? new Vec3(0, 0, 0) : positions[i0 - 1],
              Number.isNaN(i1) ? new Vec2(0, 0) : texCoords[i1 - 1],
              Number.isNaN(i2) ? new Vec3(0, 0, 0) : normals[i2 - 1]
            ));
          }
          {
            let vtd = segments[3].split("/");
            let i0 = parseInt(vtd[0]), i1 = parseInt(vtd[1]), i2 = parseInt(vtd[2]);

            tpl.vtx.push(new Vertex(
              Number.isNaN(i0) ? new Vec3(0, 0, 0) : positions[i0 - 1],
              Number.isNaN(i1) ? new Vec2(0, 0) : texCoords[i1 - 1],
              Number.isNaN(i2) ? new Vec3(0, 0, 0) : normals[i2 - 1]
            ));
          }
        break;
      }
    }

    return tpl;
  } /* model_obj */

  getVerticesAsFloatArray() {
    let res_array = new Float32Array(this.vtx.length * 8);
    let i = 0;
    let mi = this.vtx.length * 8;

    while(i < mi) {
      let vt = this.vtx[i >> 3];
  
      res_array[i++] = vt.p.x;
      res_array[i++] = vt.p.y;
      res_array[i++] = vt.p.z;

      res_array[i++] = vt.t.x;
      res_array[i++] = vt.t.y;

      res_array[i++] = vt.n.x;
      res_array[i++] = vt.n.y;
      res_array[i++] = vt.n.z;
    }

    return res_array;
  } /* getVerticesAsFloatArray */

  getIndicesAsUintArray() {
    return new Uint32Array(this.idx);
  } /* getIndicesAsUintArray */
} /* Topology */

class EmptyPrimitive {
  gl;
  material;
  geometryType = Topology.TRIANGLES;
  vertexCount = 4;

  constructor(glContext, vertexCount = 4, geometryType = Topology.TRIANGLES, material = null) {
    this.gl = glContext;
    this.vertexCount = vertexCount;
    this.geometryType = geometryType;
    this.material = material;
  } /* constructor */

  draw(cameraBuffer = null) {
    this.material.apply();
    if (cameraBuffer != null) {
      cameraBuffer.bind(this.material.shader, 1, "cameraBuffer");
    }
    this.gl.drawArrays(Topology.geometryTypeToGL(this.geometryType), 0, this.vertexCount);
  } /* draw */

  static drawFromParams(gl, vertexCount, geometryType, material, cameraBuffer = null) {
    material.apply();

    if (cameraBuffer != null) {
      cameraBuffer.bind(material.shader, 1, "cameraBuffer");
    }
    gl.drawArrays(Topology.geometryTypeToGL(geometryType), 0, vertexCount);
  } /* drawFromParams */
} /* EmptyPrimitive */

class Primitive {
  gl;
  vertexArrayObject = null;
  indexBuffer = null;
  vertexBuffer = null;
  vertexNumber = 0;
  indexNumber = 0;
  geometryType = Topology.TRIANGLES;
  material = null;

  constructor(glContext) {
    this.gl = glContext;
  } /* constructor */

  draw(cameraBuffer = null) {
    let gl = this.gl;

    this.material.apply();

    if (cameraBuffer != null) {
      cameraBuffer.bind(this.material.shader, 1, "cameraBuffer");
    }

    gl.bindVertexArray(this.vertexArrayObject);
    if (this.indexBuffer != null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(Topology.geometryTypeToGL(this.geometryType), this.indexNumber, gl.UNSIGNED_INT, 0);
    } else {
      gl.drawArrays(Topology.geometryTypeToGL(this.geometryType), 0, this.vertexNumber);
    }
  } /* draw */

  cloneWithNewMaterial(material = null) {
    if (material === null) {
      material = this.material;
    }

    let gl = this.gl;
    let prim = new Primitive(gl);

    prim.material = material;

    prim.vertexBuffer = this.vertexBuffer;
    prim.vertexCount = this.vertexCount;

    prim.vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(prim.vertexArrayObject);

    gl.bindBuffer(gl.ARRAY_BUFFER, prim.vertexBuffer);

    // Map vertex layout
    let positionLocation = gl.getAttribLocation(prim.material.shader, "inPosition");
    if (positionLocation != -1) {
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 8 * 4, 0);
      gl.enableVertexAttribArray(positionLocation);
    }

    let texCoordLocation = gl.getAttribLocation(prim.material.shader, "inTexCoord");
    if (texCoordLocation != -1) {
      gl.vertexAttribPointer(texCoordLocation, 3, gl.FLOAT, false, 8 * 4, 3 * 4);
      gl.enableVertexAttribArray(texCoordLocation);
    }

    let normalLocation = gl.getAttribLocation(prim.material.shader, "inNormal");
    if (normalLocation != -1) {
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 8 * 4, 5 * 4);
      gl.enableVertexAttribArray(normalLocation);
    }

    prim.indexBuffer = this.indexBuffer;
    prim.indexCount = this.indexCount;
  } /* cloneWithNewMaterial */

  static async fromTopology(gl, tpl, material) {
    let prim = new Primitive(gl);
    prim.material = material;

    prim.geometryType = tpl.type;

    // Create vertex array
    prim.vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(prim.vertexArrayObject);

    // Write vertex buffer
    prim.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, prim.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tpl.getVerticesAsFloatArray(), gl.STATIC_DRAW);
    prim.vertexNumber = tpl.vtx.length;

    // Map vertex layout
    let positionLocation = gl.getAttribLocation(prim.material.shader, "inPosition");
    if (positionLocation != -1) {
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 8 * 4, 0);
      gl.enableVertexAttribArray(positionLocation);
    }

    let texCoordLocation = gl.getAttribLocation(prim.material.shader, "inTexCoord");
    if (texCoordLocation != -1) {
      gl.vertexAttribPointer(texCoordLocation, 3, gl.FLOAT, false, 8 * 4, 3 * 4);
      gl.enableVertexAttribArray(texCoordLocation);
    }

    let normalLocation = gl.getAttribLocation(prim.material.shader, "inNormal");
    if (normalLocation != -1) {
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 8 * 4, 5 * 4);
      gl.enableVertexAttribArray(normalLocation);
    }

    // Create index buffer
    if (tpl.idx == null) {
      prim.indexBuffer = null;
      prim.indexNumber = 0;
    } else {
      prim.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, prim.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tpl.getIndicesAsUintArray(), gl.STATIC_DRAW);
      prim.indexNumber = tpl.idx.length;
    }

    return prim;
  } /* fromArray */
}

let currentTarget = null;
let fetcherTarget = null;

class Target {
  #gl;
  FBO;
  attachments = [];
  size;
  depth;
  drawBuffers;

  constructor(gl, attachmentCount) {
    this.size = new Size(800, 600);
    this.gl = gl;
    this.FBO = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO);

    // create target textures
    this.drawBuffers = [];
    for (let i = 0; i < attachmentCount; i++) {
      this.attachments[i] = new Texture(gl, Texture.FLOAT, 4);
      this.drawBuffers.push(gl.COLOR_ATTACHMENT0 + i);
    }
    gl.drawBuffers(this.drawBuffers);

    for (let i = 0; i < attachmentCount; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.attachments[i].id);
      this.attachments[i].resize(this.size);
  
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, this.attachments[i].id, 0);
    }
    this.depth = new Texture(gl, Texture.DEPTH);
    this.depth.resize(this.size);
    gl.bindTexture(gl.TEXTURE_2D, this.depth.id);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth.id, 0);

    // console.log(`Framebuffer status: ${decodeFramebufferStatus(gl.checkFramebufferStatus(gl.FRAMEBUFFER))}`);
  } /* constructor */

  getAttachmentValue(att, x, y) {
    let gl = this.gl;

    if (fetcherTarget == null) {
      fetcherTarget = gl.createFramebuffer();
    }
    let dst = new Float32Array(4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fetcherTarget);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.attachments[att].id, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
      gl.readPixels(x, this.attachments[att].size.h - y, 1, 1, gl.RGBA, gl.FLOAT, dst);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, currentTarget);

    return dst;
  } /* getAttachmentPixel */

  resize(size) {
    let gl = this.gl;

    this.size = size.copy();
    this.FBO = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO);

    // create target textures
    let drawBuffers = [];
    for (let i = 0; i < this.attachments.length; i++) {
      this.attachments[i] = new Texture(gl, Texture.FLOAT, 4);
      drawBuffers.push(gl.COLOR_ATTACHMENT0 + i);
    }
    gl.drawBuffers(drawBuffers);

    for (let i = 0; i < this.attachments.length; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.attachments[i].id);
      this.attachments[i].resize(this.size);
  
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, this.attachments[i].id, 0);
    }
    this.depth = new Texture(gl, Texture.DEPTH);
    this.depth.resize(this.size);
    gl.bindTexture(gl.TEXTURE_2D, this.depth.id);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth.id, 0);

    // console.log(`Framebuffer status: ${decodeFramebufferStatus(gl.checkFramebufferStatus(gl.FRAMEBUFFER))}`);
  } /* resize */

  bind() {
    let gl = this.gl;

    currentTarget = this.FBO;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO);
    gl.drawBuffers(this.drawBuffers);

    for (let i = 0; i < this.attachments.length; i++)
    gl.clearBufferfv(gl.COLOR, i, [0.00, 0.00, 0.00, 0.00]);
    gl.clearBufferfv(gl.DEPTH, 0, [1]);
    gl.viewport(0, 0, this.size.w, this.size.h);
  } /* bind */

  static defaultFramebuffer = {
    size: new Size(800, 600),
    gl: null,

    resize(size) {
      Target.defaultFramebuffer.size = size.copy();
    }, /* resize */

    bind() {
      let gl = Target.defaultFramebuffer.gl;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, Target.defaultFramebuffer.size.w, Target.defaultFramebuffer.size.h);
      gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT);
      gl.clearColor(0.30, 0.47, 0.80, 1.00);

      currentTarget = null;
    }
  }; /* defaultFramebuffer */

  enableDrawBuffer(buffer) {
    this.drawBuffers[buffer] = WebGL2RenderingContext.COLOR_ATTACHMENT0 + buffer;

    if (currentTarget === this.FBO) {
      this.gl.drawBuffers(this.drawBuffers);
    }
  } /* enableDrawBuffer */

  disableDrawBuffer(buffer) {
    this.drawBuffers[buffer] = WebGL2RenderingContext.NONE;

    if (currentTarget === this.FBO) {
      this.gl.drawBuffers(this.drawBuffers);
    }
  } /* disableDrawBuffer */

  static default(gl) {
    Target.defaultFramebuffer.gl = gl;
    return Target.defaultFramebuffer;
  } /* default */
} /* Target */

/* target.js */

function getTime() {
  return Date.now() / 1000.0;
}

class Timer {
  fpsPrevUpdateTime = 0.00;
  startTime;
  fpsCounter = 0.00;
  pauseCollector = 0.00;
  isPaused = false;

  fpsDeltaTime = 3.00;
  fps = undefined;

  time = 0.00;
  globalTime;
  
  deltaTime = 0.00;
  globalDeltaTime = 0.00;

  constructor() {
    this.startTime = getTime();

    this.globalTime = this.startTime;
  } /* constructor */

  response() {
    let newGlobalTime = getTime();

    this.globalDeltaTime = newGlobalTime - this.globalTime;
    this.globalTime = newGlobalTime;

    if (this.isPaused) {
      this.deltaTime = 0.00;
      this.pauseCollector += this.globalDeltaTime;
    } else {
      this.time = this.globalTime - this.startTime - this.pauseCollector;
      this.deltaTime = this.globalDeltaTime;
    }

    this.fpsCounter++;
    if (this.globalTime - this.fpsPrevUpdateTime >= this.fpsDeltaTime) {
      this.fps = this.fpsCounter / (this.globalTime - this.fpsPrevUpdateTime);

      this.fpsPrevUpdateTime = this.globalTime;
      this.fpsCounter = 0;
    }
  } /* response */
} /* Timer */

/* timer.js */

const mat4Identity = Mat4.identity();

class System {
  renderQueue;
  markerRenderQueue;
  gl;
  camera;
  cameraUBO;

  target;
  fsMaterial = null;

  units;  // unit list
  timer;  // timer
  lastUnitID = 0;

  currentObjectID = 0;
  renderParams = {};

  addRenderParameter(GLenum, paramName, initialValue = true) {
    let value = !initialValue;
    let gl = this.gl;

    Object.defineProperty(this.renderParams, paramName, {
      configurable: false,
      get() {
        return value;
      }, /* get */

      set(newValue) {
        if (newValue === value) {
          return;
        }

        if (newValue) {
          gl.enable(GLenum);
        } else {
          gl.disable(GLenum);
        }
        value = newValue;
      } /* set */
    }); /* property definition */
    this.renderParams[paramName] = initialValue;
  } /* addRenderParameter */

  constructor() {
    // WebGL initialization
    let canvas = document.getElementById("canvas");
    this.canvas = canvas;

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

    this.addRenderParameter(WebGL2RenderingContext.DEPTH_TEST, "depthTest", true);
    this.addRenderParameter(WebGL2RenderingContext.CULL_FACE, "cullFace", false);

    gl.depthFunc(WebGL2RenderingContext.LEQUAL);
    // gl.enable(WebGL2RenderingContext.CULL_FACE);

    // gl.cullFace(WebGL2RenderingContext.BACK);

    this.renderQueue = [];
    this.markerRenderQueue = [];
    this.camera = new Camera();

    this.cameraUBO = new UBO(this.gl);

    this.camera.resize(new Size(canvas.width, canvas.height));

    // targets setup
    let size = new Size(canvas.width, canvas.height);
    this.target = new Target(gl, 2);

    this.target.resize(size);
    Target.default(gl).resize(size);

    // resize handling
    window.onresize = () => {
      let resolution = new Size(window.innerWidth, window.innerHeight);

      canvas.width = resolution.w;
      canvas.height = resolution.h;

      this.camera.resize(resolution);
      this.target.resize(resolution);
      Target.default(gl).resize(resolution);
    };

    this.units = {};
    this.timer = new Timer();
  } /* constructor */

  static identity = Mat4.identity();

  drawPrimitive(primitive, transform = mat4Identity) {
    this.renderQueue.push({
      primitive: primitive,
      transform: transform,
      id:        this.currentObjectID
    });
  } /* drawPrimitive */

  drawMarkerPrimitive(primitive, transform = mat4Identity) {
    this.markerRenderQueue.push({
      primitive: primitive,
      transform: transform,
      id:        this.currentObjectID
    });
  } /* drawMarkerPrimitive */

  createTexture(path = null) {
    if (path === null) {
      return new Texture(this.gl, Texture.UNSIGNED_BYTE, 4);
    } else {
      let tex = new Texture(this.gl, Texture.UNSIGNED_BYTE, 4);
      tex.load(path);

      return tex;
    }
  } /* createTexture */

  getDefaultTexture() {
    return Texture.defaultChecker(this.gl);
  } /* getDefaultTexture */

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

  createEmptyPrimitive(vertexCount, topologyType, material) {
    return new EmptyPrimitive(this.gl, vertexCount, topologyType, material);
  } /* createEmptyPrimitive */

  start() {
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

    this.target.disableDrawBuffer(1);
    for (let i = 0, count = this.markerRenderQueue.length; i < count; i++) {
      let prim = this.markerRenderQueue[i].primitive;
      let trans = this.markerRenderQueue[i].transform;
      
      for (let i = 0; i < 16; i++) {
        cameraInfo[i] = trans.m[i];
      }
      cameraInfo[35] = this.markerRenderQueue[i].id;

      this.cameraUBO.writeData(cameraInfo);
      prim.draw(this.cameraUBO);
    }
    this.target.enableDrawBuffer(1);

    // flush render queue
    this.renderQueue = [];
    this.markerRenderQueue = [];

    // rendering to screen framebuffer
    Target.default(gl).bind();
    EmptyPrimitive.drawFromParams(this.gl, 4, Topology.TRIANGLE_STRIP, this.fsMaterial, this.cameraUBO);
    this.fsMaterial.unboundTextures();

    gl.finish();
  } /* end */

  // genious function, but it works!
  static async unpackPromise(v) {
    return v;
  } /* unpackPromise */

  async addUnit(createFunction, ...args) {
    let val = await System.unpackPromise(createFunction(this, ...args));

    val.systemId = this.lastUnitID++;
    if (val.init != undefined) {
      await System.unpackPromise(val.init(this));
    }
    this.units[val.systemId] = val;

    return val;
  } /* addUnit */

  getUnitByID(id) {
    return this.units[id];
  } /* getUnitByID */

  getUnitByCoord(x, y) {
    let id = Math.round(this.target.getAttachmentValue(0, x, y)[3]);

    return this.units[id];
  } /* getUnitByMouseLocation */

  getPositionByCoord(x, y) {
    let arr = this.target.getAttachmentValue(1, x, y);

    return new Vec3(arr[0], arr[1], arr[2]);
  } /* getPositionByCoord */

  async run() {
    // initialize fullscreen material
    this.fsMaterial = await this.createMaterial("./shaders/target");
    this.fsMaterial.textures = this.target.attachments;

    let system = this;

    const run = async function() {
      system.timer.response();

      system.start();

      for (const id in system.units) {
        let unit = system.units[id];

        system.currentObjectID = unit.systemId;
        unit.response(system);

        if (unit.doSuicide === true) {
          if (unit.close !== undefined) {
            unit.close(system);
          }
          delete system.units[id];
        }
      }

      system.end();

      window.requestAnimationFrame(run);
    };

    window.requestAnimationFrame(run);
  } /* run */
} /* Render */

/* render.js */

class Arcball {
    // camera unit
    static create() {
    const up = new Vec3(0, 1, 0);
    let loc = new Vec3(30, 30, 30), at = new Vec3(0, 0, 0);
    let radius = at.sub(loc).length();

    let camera = {
      response(system) {
        system.camera.set(loc, at, up);
      } /* response */
    };
    
    const onMouseMove = function(event) {
      if (event.altKey || event.shiftKey) {
        return;
      }

      if ((event.buttons & 1) == 1) { // rotate
        let direction = loc.sub(at);

        // turn direction to polar coordinate system
        radius = direction.length();
        let
          azimuth  = Math.sign(direction.z) * Math.acos(direction.x / Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
          elevator = Math.acos(direction.y / direction.length());

          // rotate direction
          azimuth  += event.movementX / 200.0;
        elevator -= event.movementY / 200.0;
        
        elevator = Math.min(Math.max(elevator, 0.01), Math.PI);
        
        // restore direction
        direction.x = radius * Math.sin(elevator) * Math.cos(azimuth);
        direction.y = radius * Math.cos(elevator);
        direction.z = radius * Math.sin(elevator) * Math.sin(azimuth);

        loc = at.add(direction);
      }
      
      if ((event.buttons & 2) == 2) { // move
        let dir = at.sub(loc).normalize();
        let rgh = dir.cross(up).normalize();
        let tup = rgh.cross(dir);
        
        let delta = rgh.mul(-event.movementX * radius / 300.0).add(tup.mul(event.movementY * radius / 300.0));
        loc = loc.add(delta);
        at = at.add(delta);
      }
    };

    const onWheel = function(event) {
      let delta = event.deltaY / 5000.0;

      loc = loc.sub(at.sub(loc).mul(delta));
    };
    
    let canvas = document.getElementById("canvas");
    
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel);
    
    return camera;
  }
} /* Arcball */

/* camera_controller.js */

let bannerShader = null;

class Banner {
  static async create(system, bannerContent, position, height = 0) {
    if (bannerShader === null) {
      bannerShader = await system.createShader("./shaders/banner");
    }

    let content = bannerContent;
    let infoPrim, mtl;
    let unit = await system.addUnit(() => {
      return {
        show: true,
        type: "banner",
        pos: position.copy(),
        height: height,

        async init(system) {
          mtl = await system.createMaterial(bannerShader);
          mtl.ubo = system.createUniformBuffer();
          mtl.uboNameOnShader = "bannerBuffer";

          infoPrim = system.createEmptyPrimitive(4, Topology.TRIANGLE_STRIP, mtl);

          mtl.textures.push(system.createTexture());
        }, /* init */

        response(system) {
          if (unit.show) {
            let up = system.camera.up;
            let rgh = system.camera.right.mul(content.length / 3.0);
            let pos = unit.pos;
            let data = new Float32Array([
              up.x,  up.y,  up.z,  1,
              rgh.x, rgh.y, rgh.z, 1,
              pos.x, pos.y, pos.z, unit.height
            ]);

            mtl.ubo.writeData(data);
            system.drawMarkerPrimitive(infoPrim);
          }
        } /* response */
      };
    });

    Object.defineProperty(unit, "content", {
      get: function() {
        console.log(content);
        return content;
      },

      set: function(newContent) {
        let tex = mtl.textures[0];

        let ctx = document.createElement("canvas").getContext("2d");

        ctx.canvas.width = 40 * newContent.length;
        ctx.canvas.height = 120;
  
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = `${ctx.canvas.height * 0.5}px consolas`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = '#FFFFFF';
        
        ctx.fillText(newContent, ctx.canvas.width / 2, ctx.canvas.height / 2);
        tex.fromImage(ctx.canvas);
        ctx.canvas.remove();

        content = newContent;
      } /* set */
    });
    unit.content = content;

    return unit;
  } /* addBanner */
} /* Banner */

/* banner.js */

class Skysphere {
  static async create(system, filePath = null) {
    let mtl, tex, prim, sphere;
    let slideStartTime = 0.0, slideDuration = 0, slideRotation;
    let doSlide = false;

    return sphere = {
      type: "skysphere",
      name: "",
      texture: null,
      rotation: 0,

      async init(system) {
        mtl = await system.createMaterial("./shaders/skysphere");

        tex = await system.createTexture(filePath);

        mtl.textures.push(tex);
        mtl.ubo = system.createUniformBuffer();
        mtl.uboNameOnShader = "projectionInfo";

        prim = await system.createEmptyPrimitive(4, Topology.TRIANGLE_STRIP, mtl);

        sphere.texture = tex;
        sphere.name = `skysphere#${filePath}`;
      }, /* init */

      // sliding to another skysphere function
      async slide(newTexturePath, newTextureRotation, duration = 0.33) {
        return new Promise(async (resolve, reject) => {
          // add new texture
          let newTexture = await system.createTexture();
          await newTexture.load(newTexturePath);
          mtl.textures.push(newTexture);
  
          slideStartTime = null;
          slideDuration = duration;
          slideRotation = newTextureRotation;
          doSlide = true;

          setTimeout(() => {
            console.log("slide end");
            mtl.textures.shift();
            doSlide = false;
            sphere.rotation = slideRotation;

            resolve();
          }, duration * 1000.0);
        });
      }, /* slide */

      response(system) {
        // 'perspective-correct' direction vectors
        let dir = system.camera.dir.mul(system.camera.near);
        let rgh = system.camera.right.mul(system.camera.correctedProjSize.w);
        let tup = system.camera.up.mul(system.camera.correctedProjSize.h);

        if (doSlide) {
          if (slideStartTime === null) {
            slideStartTime = system.timer.time;
          }

          let slideCoefficent = (system.timer.time - slideStartTime) / slideDuration;

          mtl.ubo.writeData(new Float32Array([
            dir.x, dir.y, dir.z, 1.0,
            rgh.x, rgh.y, rgh.z, slideCoefficent,
            tup.x, tup.y, tup.z,
            sphere.rotation,
            slideRotation
          ]));
        } else {
          mtl.ubo.writeData(new Float32Array([
            dir.x, dir.y, dir.z, 0,
            rgh.x, rgh.y, rgh.z, 0,
            tup.x, tup.y, tup.z,
            sphere.rotation,
            0
          ]));
        }


        system.drawMarkerPrimitive(prim);
      } /* response */
    }; /* _this */
  } /* create */
} /* Skysphere */

/* skysphere.js */

const PACKET_TYPES = Object.create(null); // no Map = no polyfill
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
const PACKET_TYPES_REVERSE = Object.create(null);
Object.keys(PACKET_TYPES).forEach(key => {
    PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
const ERROR_PACKET = { type: "error", data: "parser error" };

const withNativeBlob$1 = typeof Blob === "function" ||
    (typeof Blob !== "undefined" &&
        Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
const withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
// ArrayBuffer.isView method is not defined in IE10
const isView$1 = obj => {
    return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj && obj.buffer instanceof ArrayBuffer;
};
const encodePacket = ({ type, data }, supportsBinary, callback) => {
    if (withNativeBlob$1 && data instanceof Blob) {
        if (supportsBinary) {
            return callback(data);
        }
        else {
            return encodeBlobAsBase64(data, callback);
        }
    }
    else if (withNativeArrayBuffer$2 &&
        (data instanceof ArrayBuffer || isView$1(data))) {
        if (supportsBinary) {
            return callback(data);
        }
        else {
            return encodeBlobAsBase64(new Blob([data]), callback);
        }
    }
    // plain string
    return callback(PACKET_TYPES[type] + (data || ""));
};
const encodeBlobAsBase64 = (data, callback) => {
    const fileReader = new FileReader();
    fileReader.onload = function () {
        const content = fileReader.result.split(",")[1];
        callback("b" + (content || ""));
    };
    return fileReader.readAsDataURL(data);
};
function toArray(data) {
    if (data instanceof Uint8Array) {
        return data;
    }
    else if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
    }
    else {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
}
let TEXT_ENCODER;
function encodePacketToBinary(packet, callback) {
    if (withNativeBlob$1 && packet.data instanceof Blob) {
        return packet.data
            .arrayBuffer()
            .then(toArray)
            .then(callback);
    }
    else if (withNativeArrayBuffer$2 &&
        (packet.data instanceof ArrayBuffer || isView$1(packet.data))) {
        return callback(toArray(packet.data));
    }
    encodePacket(packet, false, encoded => {
        if (!TEXT_ENCODER) {
            TEXT_ENCODER = new TextEncoder();
        }
        callback(TEXT_ENCODER.encode(encoded));
    });
}

// imported from https://github.com/socketio/base64-arraybuffer
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// Use a lookup table to find the index.
const lookup$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup$1[chars.charCodeAt(i)] = i;
}
const decode$1 = (base64) => {
    let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }
    const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
        encoded1 = lookup$1[base64.charCodeAt(i)];
        encoded2 = lookup$1[base64.charCodeAt(i + 1)];
        encoded3 = lookup$1[base64.charCodeAt(i + 2)];
        encoded4 = lookup$1[base64.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
};

const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
const decodePacket = (encodedPacket, binaryType) => {
    if (typeof encodedPacket !== "string") {
        return {
            type: "message",
            data: mapBinary(encodedPacket, binaryType)
        };
    }
    const type = encodedPacket.charAt(0);
    if (type === "b") {
        return {
            type: "message",
            data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
        };
    }
    const packetType = PACKET_TYPES_REVERSE[type];
    if (!packetType) {
        return ERROR_PACKET;
    }
    return encodedPacket.length > 1
        ? {
            type: PACKET_TYPES_REVERSE[type],
            data: encodedPacket.substring(1)
        }
        : {
            type: PACKET_TYPES_REVERSE[type]
        };
};
const decodeBase64Packet = (data, binaryType) => {
    if (withNativeArrayBuffer$1) {
        const decoded = decode$1(data);
        return mapBinary(decoded, binaryType);
    }
    else {
        return { base64: true, data }; // fallback for old browsers
    }
};
const mapBinary = (data, binaryType) => {
    switch (binaryType) {
        case "blob":
            if (data instanceof Blob) {
                // from WebSocket + binaryType "blob"
                return data;
            }
            else {
                // from HTTP long-polling or WebTransport
                return new Blob([data]);
            }
        case "arraybuffer":
        default:
            if (data instanceof ArrayBuffer) {
                // from HTTP long-polling (base64) or WebSocket + binaryType "arraybuffer"
                return data;
            }
            else {
                // from WebTransport (Uint8Array)
                return data.buffer;
            }
    }
};

const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
const encodePayload = (packets, callback) => {
    // some packets may be added to the array while encoding, so the initial length must be saved
    const length = packets.length;
    const encodedPackets = new Array(length);
    let count = 0;
    packets.forEach((packet, i) => {
        // force base64 encoding for binary packets
        encodePacket(packet, false, encodedPacket => {
            encodedPackets[i] = encodedPacket;
            if (++count === length) {
                callback(encodedPackets.join(SEPARATOR));
            }
        });
    });
};
const decodePayload = (encodedPayload, binaryType) => {
    const encodedPackets = encodedPayload.split(SEPARATOR);
    const packets = [];
    for (let i = 0; i < encodedPackets.length; i++) {
        const decodedPacket = decodePacket(encodedPackets[i], binaryType);
        packets.push(decodedPacket);
        if (decodedPacket.type === "error") {
            break;
        }
    }
    return packets;
};
let TEXT_DECODER;
function decodePacketFromBinary(data, isBinary, binaryType) {
    if (!TEXT_DECODER) {
        // lazily created for compatibility with old browser platforms
        TEXT_DECODER = new TextDecoder();
    }
    // 48 === "0".charCodeAt(0) (OPEN packet type)
    // 54 === "6".charCodeAt(0) (NOOP packet type)
    const isPlainBinary = isBinary || data[0] < 48 || data[0] > 54;
    return decodePacket(isPlainBinary ? data : TEXT_DECODER.decode(data), binaryType);
}
const protocol$1 = 4;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }

  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};

  var args = new Array(arguments.length - 1)
    , callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

// alias used for reserved events (protected method)
Emitter.prototype.emitReserved = Emitter.prototype.emit;

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

const globalThisShim = (() => {
    if (typeof self !== "undefined") {
        return self;
    }
    else if (typeof window !== "undefined") {
        return window;
    }
    else {
        return Function("return this")();
    }
})();

function pick(obj, ...attr) {
    return attr.reduce((acc, k) => {
        if (obj.hasOwnProperty(k)) {
            acc[k] = obj[k];
        }
        return acc;
    }, {});
}
// Keep a reference to the real timeout functions so they can be used when overridden
const NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
const NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
        obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
        obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
    }
    else {
        obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
        obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
    }
}
// base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
const BASE64_OVERHEAD = 1.33;
// we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
function byteLength(obj) {
    if (typeof obj === "string") {
        return utf8Length(obj);
    }
    // arraybuffer or blob
    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
}
function utf8Length(str) {
    let c = 0, length = 0;
    for (let i = 0, l = str.length; i < l; i++) {
        c = str.charCodeAt(i);
        if (c < 0x80) {
            length += 1;
        }
        else if (c < 0x800) {
            length += 2;
        }
        else if (c < 0xd800 || c >= 0xe000) {
            length += 3;
        }
        else {
            i++;
            length += 4;
        }
    }
    return length;
}

// imported from https://github.com/galkn/querystring
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */
function encode$1(obj) {
    let str = '';
    for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
            if (str.length)
                str += '&';
            str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
    }
    return str;
}
/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */
function decode(qs) {
    let qry = {};
    let pairs = qs.split('&');
    for (let i = 0, l = pairs.length; i < l; i++) {
        let pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
}

class TransportError extends Error {
    constructor(reason, description, context) {
        super(reason);
        this.description = description;
        this.context = context;
        this.type = "TransportError";
    }
}
class Transport extends Emitter {
    /**
     * Transport abstract constructor.
     *
     * @param {Object} opts - options
     * @protected
     */
    constructor(opts) {
        super();
        this.writable = false;
        installTimerFunctions(this, opts);
        this.opts = opts;
        this.query = opts.query;
        this.socket = opts.socket;
    }
    /**
     * Emits an error.
     *
     * @param {String} reason
     * @param description
     * @param context - the error context
     * @return {Transport} for chaining
     * @protected
     */
    onError(reason, description, context) {
        super.emitReserved("error", new TransportError(reason, description, context));
        return this;
    }
    /**
     * Opens the transport.
     */
    open() {
        this.readyState = "opening";
        this.doOpen();
        return this;
    }
    /**
     * Closes the transport.
     */
    close() {
        if (this.readyState === "opening" || this.readyState === "open") {
            this.doClose();
            this.onClose();
        }
        return this;
    }
    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     */
    send(packets) {
        if (this.readyState === "open") {
            this.write(packets);
        }
    }
    /**
     * Called upon open
     *
     * @protected
     */
    onOpen() {
        this.readyState = "open";
        this.writable = true;
        super.emitReserved("open");
    }
    /**
     * Called with data.
     *
     * @param {String} data
     * @protected
     */
    onData(data) {
        const packet = decodePacket(data, this.socket.binaryType);
        this.onPacket(packet);
    }
    /**
     * Called with a decoded packet.
     *
     * @protected
     */
    onPacket(packet) {
        super.emitReserved("packet", packet);
    }
    /**
     * Called upon close.
     *
     * @protected
     */
    onClose(details) {
        this.readyState = "closed";
        super.emitReserved("close", details);
    }
    /**
     * Pauses the transport, in order not to lose packets during an upgrade.
     *
     * @param onPause
     */
    pause(onPause) { }
    createUri(schema, query = {}) {
        return (schema +
            "://" +
            this._hostname() +
            this._port() +
            this.opts.path +
            this._query(query));
    }
    _hostname() {
        const hostname = this.opts.hostname;
        return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
    }
    _port() {
        if (this.opts.port &&
            ((this.opts.secure && Number(this.opts.port !== 443)) ||
                (!this.opts.secure && Number(this.opts.port) !== 80))) {
            return ":" + this.opts.port;
        }
        else {
            return "";
        }
    }
    _query(query) {
        const encodedQuery = encode$1(query);
        return encodedQuery.length ? "?" + encodedQuery : "";
    }
}

// imported from https://github.com/unshiftio/yeast
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''), length = 64, map = {};
let seed = 0, i = 0, prev;
/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
function encode(num) {
    let encoded = '';
    do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
    } while (num > 0);
    return encoded;
}
/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
function yeast() {
    const now = encode(+new Date());
    if (now !== prev)
        return seed = 0, prev = now;
    return now + '.' + encode(seed++);
}
//
// Map each character to its index.
//
for (; i < length; i++)
    map[alphabet[i]] = i;

// imported from https://github.com/component/has-cors
let value = false;
try {
    value = typeof XMLHttpRequest !== 'undefined' &&
        'withCredentials' in new XMLHttpRequest();
}
catch (err) {
    // if XMLHttp support is disabled in IE then it will throw
    // when trying to create
}
const hasCORS = value;

// browser shim for xmlhttprequest module
function XHR(opts) {
    const xdomain = opts.xdomain;
    // XMLHttpRequest can be disabled on IE
    try {
        if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
            return new XMLHttpRequest();
        }
    }
    catch (e) { }
    if (!xdomain) {
        try {
            return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
        }
        catch (e) { }
    }
}
function createCookieJar() { }

function empty() { }
const hasXHR2 = (function () {
    const xhr = new XHR({
        xdomain: false,
    });
    return null != xhr.responseType;
})();
class Polling extends Transport {
    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @package
     */
    constructor(opts) {
        super(opts);
        this.polling = false;
        if (typeof location !== "undefined") {
            const isSSL = "https:" === location.protocol;
            let port = location.port;
            // some user agents have empty `location.port`
            if (!port) {
                port = isSSL ? "443" : "80";
            }
            this.xd =
                (typeof location !== "undefined" &&
                    opts.hostname !== location.hostname) ||
                    port !== opts.port;
        }
        /**
         * XHR supports binary
         */
        const forceBase64 = opts && opts.forceBase64;
        this.supportsBinary = hasXHR2 && !forceBase64;
        if (this.opts.withCredentials) {
            this.cookieJar = createCookieJar();
        }
    }
    get name() {
        return "polling";
    }
    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @protected
     */
    doOpen() {
        this.poll();
    }
    /**
     * Pauses polling.
     *
     * @param {Function} onPause - callback upon buffers are flushed and transport is paused
     * @package
     */
    pause(onPause) {
        this.readyState = "pausing";
        const pause = () => {
            this.readyState = "paused";
            onPause();
        };
        if (this.polling || !this.writable) {
            let total = 0;
            if (this.polling) {
                total++;
                this.once("pollComplete", function () {
                    --total || pause();
                });
            }
            if (!this.writable) {
                total++;
                this.once("drain", function () {
                    --total || pause();
                });
            }
        }
        else {
            pause();
        }
    }
    /**
     * Starts polling cycle.
     *
     * @private
     */
    poll() {
        this.polling = true;
        this.doPoll();
        this.emitReserved("poll");
    }
    /**
     * Overloads onData to detect payloads.
     *
     * @protected
     */
    onData(data) {
        const callback = (packet) => {
            // if its the first message we consider the transport open
            if ("opening" === this.readyState && packet.type === "open") {
                this.onOpen();
            }
            // if its a close packet, we close the ongoing requests
            if ("close" === packet.type) {
                this.onClose({ description: "transport closed by the server" });
                return false;
            }
            // otherwise bypass onData and handle the message
            this.onPacket(packet);
        };
        // decode payload
        decodePayload(data, this.socket.binaryType).forEach(callback);
        // if an event did not trigger closing
        if ("closed" !== this.readyState) {
            // if we got data we're not polling
            this.polling = false;
            this.emitReserved("pollComplete");
            if ("open" === this.readyState) {
                this.poll();
            }
        }
    }
    /**
     * For polling, send a close packet.
     *
     * @protected
     */
    doClose() {
        const close = () => {
            this.write([{ type: "close" }]);
        };
        if ("open" === this.readyState) {
            close();
        }
        else {
            // in case we're trying to close while
            // handshaking is in progress (GH-164)
            this.once("open", close);
        }
    }
    /**
     * Writes a packets payload.
     *
     * @param {Array} packets - data packets
     * @protected
     */
    write(packets) {
        this.writable = false;
        encodePayload(packets, (data) => {
            this.doWrite(data, () => {
                this.writable = true;
                this.emitReserved("drain");
            });
        });
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
        const schema = this.opts.secure ? "https" : "http";
        const query = this.query || {};
        // cache busting is forced
        if (false !== this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast();
        }
        if (!this.supportsBinary && !query.sid) {
            query.b64 = 1;
        }
        return this.createUri(schema, query);
    }
    /**
     * Creates a request.
     *
     * @param {String} method
     * @private
     */
    request(opts = {}) {
        Object.assign(opts, { xd: this.xd, cookieJar: this.cookieJar }, this.opts);
        return new Request(this.uri(), opts);
    }
    /**
     * Sends data.
     *
     * @param {String} data to send.
     * @param {Function} called upon flush.
     * @private
     */
    doWrite(data, fn) {
        const req = this.request({
            method: "POST",
            data: data,
        });
        req.on("success", fn);
        req.on("error", (xhrStatus, context) => {
            this.onError("xhr post error", xhrStatus, context);
        });
    }
    /**
     * Starts a poll cycle.
     *
     * @private
     */
    doPoll() {
        const req = this.request();
        req.on("data", this.onData.bind(this));
        req.on("error", (xhrStatus, context) => {
            this.onError("xhr poll error", xhrStatus, context);
        });
        this.pollXhr = req;
    }
}
class Request extends Emitter {
    /**
     * Request constructor
     *
     * @param {Object} options
     * @package
     */
    constructor(uri, opts) {
        super();
        installTimerFunctions(this, opts);
        this.opts = opts;
        this.method = opts.method || "GET";
        this.uri = uri;
        this.data = undefined !== opts.data ? opts.data : null;
        this.create();
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @private
     */
    create() {
        var _a;
        const opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
        opts.xdomain = !!this.opts.xd;
        const xhr = (this.xhr = new XHR(opts));
        try {
            xhr.open(this.method, this.uri, true);
            try {
                if (this.opts.extraHeaders) {
                    xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                    for (let i in this.opts.extraHeaders) {
                        if (this.opts.extraHeaders.hasOwnProperty(i)) {
                            xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                        }
                    }
                }
            }
            catch (e) { }
            if ("POST" === this.method) {
                try {
                    xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                }
                catch (e) { }
            }
            try {
                xhr.setRequestHeader("Accept", "*/*");
            }
            catch (e) { }
            (_a = this.opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
            // ie6 check
            if ("withCredentials" in xhr) {
                xhr.withCredentials = this.opts.withCredentials;
            }
            if (this.opts.requestTimeout) {
                xhr.timeout = this.opts.requestTimeout;
            }
            xhr.onreadystatechange = () => {
                var _a;
                if (xhr.readyState === 3) {
                    (_a = this.opts.cookieJar) === null || _a === void 0 ? void 0 : _a.parseCookies(xhr);
                }
                if (4 !== xhr.readyState)
                    return;
                if (200 === xhr.status || 1223 === xhr.status) {
                    this.onLoad();
                }
                else {
                    // make sure the `error` event handler that's user-set
                    // does not throw in the same tick and gets caught here
                    this.setTimeoutFn(() => {
                        this.onError(typeof xhr.status === "number" ? xhr.status : 0);
                    }, 0);
                }
            };
            xhr.send(this.data);
        }
        catch (e) {
            // Need to defer since .create() is called directly from the constructor
            // and thus the 'error' event can only be only bound *after* this exception
            // occurs.  Therefore, also, we cannot throw here at all.
            this.setTimeoutFn(() => {
                this.onError(e);
            }, 0);
            return;
        }
        if (typeof document !== "undefined") {
            this.index = Request.requestsCount++;
            Request.requests[this.index] = this;
        }
    }
    /**
     * Called upon error.
     *
     * @private
     */
    onError(err) {
        this.emitReserved("error", err, this.xhr);
        this.cleanup(true);
    }
    /**
     * Cleans up house.
     *
     * @private
     */
    cleanup(fromError) {
        if ("undefined" === typeof this.xhr || null === this.xhr) {
            return;
        }
        this.xhr.onreadystatechange = empty;
        if (fromError) {
            try {
                this.xhr.abort();
            }
            catch (e) { }
        }
        if (typeof document !== "undefined") {
            delete Request.requests[this.index];
        }
        this.xhr = null;
    }
    /**
     * Called upon load.
     *
     * @private
     */
    onLoad() {
        const data = this.xhr.responseText;
        if (data !== null) {
            this.emitReserved("data", data);
            this.emitReserved("success");
            this.cleanup();
        }
    }
    /**
     * Aborts the request.
     *
     * @package
     */
    abort() {
        this.cleanup();
    }
}
Request.requestsCount = 0;
Request.requests = {};
/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */
if (typeof document !== "undefined") {
    // @ts-ignore
    if (typeof attachEvent === "function") {
        // @ts-ignore
        attachEvent("onunload", unloadHandler);
    }
    else if (typeof addEventListener === "function") {
        const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
    }
}
function unloadHandler() {
    for (let i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
            Request.requests[i].abort();
        }
    }
}

const nextTick = (() => {
    const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
    if (isPromiseAvailable) {
        return (cb) => Promise.resolve().then(cb);
    }
    else {
        return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
    }
})();
const WebSocket = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
const usingBrowserWebSocket = true;
const defaultBinaryType = "arraybuffer";

// detect ReactNative environment
const isReactNative = typeof navigator !== "undefined" &&
    typeof navigator.product === "string" &&
    navigator.product.toLowerCase() === "reactnative";
class WS extends Transport {
    /**
     * WebSocket transport constructor.
     *
     * @param {Object} opts - connection options
     * @protected
     */
    constructor(opts) {
        super(opts);
        this.supportsBinary = !opts.forceBase64;
    }
    get name() {
        return "websocket";
    }
    doOpen() {
        if (!this.check()) {
            // let probe timeout
            return;
        }
        const uri = this.uri();
        const protocols = this.opts.protocols;
        // React Native only supports the 'headers' option, and will print a warning if anything else is passed
        const opts = isReactNative
            ? {}
            : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
        if (this.opts.extraHeaders) {
            opts.headers = this.opts.extraHeaders;
        }
        try {
            this.ws =
                usingBrowserWebSocket && !isReactNative
                    ? protocols
                        ? new WebSocket(uri, protocols)
                        : new WebSocket(uri)
                    : new WebSocket(uri, protocols, opts);
        }
        catch (err) {
            return this.emitReserved("error", err);
        }
        this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
        this.addEventListeners();
    }
    /**
     * Adds event listeners to the socket
     *
     * @private
     */
    addEventListeners() {
        this.ws.onopen = () => {
            if (this.opts.autoUnref) {
                this.ws._socket.unref();
            }
            this.onOpen();
        };
        this.ws.onclose = (closeEvent) => this.onClose({
            description: "websocket connection closed",
            context: closeEvent,
        });
        this.ws.onmessage = (ev) => this.onData(ev.data);
        this.ws.onerror = (e) => this.onError("websocket error", e);
    }
    write(packets) {
        this.writable = false;
        // encodePacket efficient as it uses WS framing
        // no need for encodePayload
        for (let i = 0; i < packets.length; i++) {
            const packet = packets[i];
            const lastPacket = i === packets.length - 1;
            encodePacket(packet, this.supportsBinary, (data) => {
                // always create a new object (GH-437)
                const opts = {};
                // Sometimes the websocket has already been closed but the browser didn't
                // have a chance of informing us about it yet, in that case send will
                // throw an error
                try {
                    if (usingBrowserWebSocket) {
                        // TypeError is thrown when passing the second argument on Safari
                        this.ws.send(data);
                    }
                }
                catch (e) {
                }
                if (lastPacket) {
                    // fake drain
                    // defer to next tick to allow Socket to clear writeBuffer
                    nextTick(() => {
                        this.writable = true;
                        this.emitReserved("drain");
                    }, this.setTimeoutFn);
                }
            });
        }
    }
    doClose() {
        if (typeof this.ws !== "undefined") {
            this.ws.close();
            this.ws = null;
        }
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
        const schema = this.opts.secure ? "wss" : "ws";
        const query = this.query || {};
        // append timestamp to URI
        if (this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast();
        }
        // communicate binary support capabilities
        if (!this.supportsBinary) {
            query.b64 = 1;
        }
        return this.createUri(schema, query);
    }
    /**
     * Feature detection for WebSocket.
     *
     * @return {Boolean} whether this transport is available.
     * @private
     */
    check() {
        return !!WebSocket;
    }
}

function shouldIncludeBinaryHeader(packet, encoded) {
    // 48 === "0".charCodeAt(0) (OPEN packet type)
    // 54 === "6".charCodeAt(0) (NOOP packet type)
    return (packet.type === "message" &&
        typeof packet.data !== "string" &&
        encoded[0] >= 48 &&
        encoded[0] <= 54);
}
class WT extends Transport {
    get name() {
        return "webtransport";
    }
    doOpen() {
        // @ts-ignore
        if (typeof WebTransport !== "function") {
            return;
        }
        // @ts-ignore
        this.transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
        this.transport.closed.then(() => this.onClose());
        // note: we could have used async/await, but that would require some additional polyfills
        this.transport.ready.then(() => {
            this.transport.createBidirectionalStream().then((stream) => {
                const reader = stream.readable.getReader();
                this.writer = stream.writable.getWriter();
                let binaryFlag;
                const read = () => {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            return;
                        }
                        if (!binaryFlag && value.byteLength === 1 && value[0] === 54) {
                            binaryFlag = true;
                        }
                        else {
                            // TODO expose binarytype
                            this.onPacket(decodePacketFromBinary(value, binaryFlag, "arraybuffer"));
                            binaryFlag = false;
                        }
                        read();
                    });
                };
                read();
                const handshake = this.query.sid ? `0{"sid":"${this.query.sid}"}` : "0";
                this.writer
                    .write(new TextEncoder().encode(handshake))
                    .then(() => this.onOpen());
            });
        });
    }
    write(packets) {
        this.writable = false;
        for (let i = 0; i < packets.length; i++) {
            const packet = packets[i];
            const lastPacket = i === packets.length - 1;
            encodePacketToBinary(packet, (data) => {
                if (shouldIncludeBinaryHeader(packet, data)) {
                    this.writer.write(Uint8Array.of(54));
                }
                this.writer.write(data).then(() => {
                    if (lastPacket) {
                        nextTick(() => {
                            this.writable = true;
                            this.emitReserved("drain");
                        }, this.setTimeoutFn);
                    }
                });
            });
        }
    }
    doClose() {
        var _a;
        (_a = this.transport) === null || _a === void 0 ? void 0 : _a.close();
    }
}

const transports = {
    websocket: WS,
    webtransport: WT,
    polling: Polling,
};

// imported from https://github.com/galkn/parseuri
/**
 * Parses a URI
 *
 * Note: we could also have used the built-in URL object, but it isn't supported on all platforms.
 *
 * See:
 * - https://developer.mozilla.org/en-US/docs/Web/API/URL
 * - https://caniuse.com/url
 * - https://www.rfc-editor.org/rfc/rfc3986#appendix-B
 *
 * History of the parse() method:
 * - first commit: https://github.com/socketio/socket.io-client/commit/4ee1d5d94b3906a9c052b459f1a818b15f38f91c
 * - export into its own module: https://github.com/socketio/engine.io-client/commit/de2c561e4564efeb78f1bdb1ba39ef81b2822cb3
 * - reimport: https://github.com/socketio/engine.io-client/commit/df32277c3f6d622eec5ed09f493cae3f3391d242
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */
const re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
const parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];
function parse(str) {
    const src = str, b = str.indexOf('['), e = str.indexOf(']');
    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }
    let m = re.exec(str || ''), uri = {}, i = 14;
    while (i--) {
        uri[parts[i]] = m[i] || '';
    }
    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }
    uri.pathNames = pathNames(uri, uri['path']);
    uri.queryKey = queryKey(uri, uri['query']);
    return uri;
}
function pathNames(obj, path) {
    const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
    if (path.slice(0, 1) == '/' || path.length === 0) {
        names.splice(0, 1);
    }
    if (path.slice(-1) == '/') {
        names.splice(names.length - 1, 1);
    }
    return names;
}
function queryKey(uri, query) {
    const data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
        if ($1) {
            data[$1] = $2;
        }
    });
    return data;
}

let Socket$1 = class Socket extends Emitter {
    /**
     * Socket constructor.
     *
     * @param {String|Object} uri - uri or options
     * @param {Object} opts - options
     */
    constructor(uri, opts = {}) {
        super();
        this.writeBuffer = [];
        if (uri && "object" === typeof uri) {
            opts = uri;
            uri = null;
        }
        if (uri) {
            uri = parse(uri);
            opts.hostname = uri.host;
            opts.secure = uri.protocol === "https" || uri.protocol === "wss";
            opts.port = uri.port;
            if (uri.query)
                opts.query = uri.query;
        }
        else if (opts.host) {
            opts.hostname = parse(opts.host).host;
        }
        installTimerFunctions(this, opts);
        this.secure =
            null != opts.secure
                ? opts.secure
                : typeof location !== "undefined" && "https:" === location.protocol;
        if (opts.hostname && !opts.port) {
            // if no port is specified manually, use the protocol default
            opts.port = this.secure ? "443" : "80";
        }
        this.hostname =
            opts.hostname ||
                (typeof location !== "undefined" ? location.hostname : "localhost");
        this.port =
            opts.port ||
                (typeof location !== "undefined" && location.port
                    ? location.port
                    : this.secure
                        ? "443"
                        : "80");
        this.transports = opts.transports || [
            "polling",
            "websocket",
            "webtransport",
        ];
        this.writeBuffer = [];
        this.prevBufferLen = 0;
        this.opts = Object.assign({
            path: "/engine.io",
            agent: false,
            withCredentials: false,
            upgrade: true,
            timestampParam: "t",
            rememberUpgrade: false,
            addTrailingSlash: true,
            rejectUnauthorized: true,
            perMessageDeflate: {
                threshold: 1024,
            },
            transportOptions: {},
            closeOnBeforeunload: true,
        }, opts);
        this.opts.path =
            this.opts.path.replace(/\/$/, "") +
                (this.opts.addTrailingSlash ? "/" : "");
        if (typeof this.opts.query === "string") {
            this.opts.query = decode(this.opts.query);
        }
        // set on handshake
        this.id = null;
        this.upgrades = null;
        this.pingInterval = null;
        this.pingTimeout = null;
        // set on heartbeat
        this.pingTimeoutTimer = null;
        if (typeof addEventListener === "function") {
            if (this.opts.closeOnBeforeunload) {
                // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
                // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
                // closed/reloaded)
                this.beforeunloadEventListener = () => {
                    if (this.transport) {
                        // silently close the transport
                        this.transport.removeAllListeners();
                        this.transport.close();
                    }
                };
                addEventListener("beforeunload", this.beforeunloadEventListener, false);
            }
            if (this.hostname !== "localhost") {
                this.offlineEventListener = () => {
                    this.onClose("transport close", {
                        description: "network connection lost",
                    });
                };
                addEventListener("offline", this.offlineEventListener, false);
            }
        }
        this.open();
    }
    /**
     * Creates transport of the given type.
     *
     * @param {String} name - transport name
     * @return {Transport}
     * @private
     */
    createTransport(name) {
        const query = Object.assign({}, this.opts.query);
        // append engine.io protocol identifier
        query.EIO = protocol$1;
        // transport name
        query.transport = name;
        // session id if we already have one
        if (this.id)
            query.sid = this.id;
        const opts = Object.assign({}, this.opts.transportOptions[name], this.opts, {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port,
        });
        return new transports[name](opts);
    }
    /**
     * Initializes transport to use and starts probe.
     *
     * @private
     */
    open() {
        let transport;
        if (this.opts.rememberUpgrade &&
            Socket.priorWebsocketSuccess &&
            this.transports.indexOf("websocket") !== -1) {
            transport = "websocket";
        }
        else if (0 === this.transports.length) {
            // Emit error on next tick so it can be listened to
            this.setTimeoutFn(() => {
                this.emitReserved("error", "No transports available");
            }, 0);
            return;
        }
        else {
            transport = this.transports[0];
        }
        this.readyState = "opening";
        // Retry with the next transport if the transport is disabled (jsonp: false)
        try {
            transport = this.createTransport(transport);
        }
        catch (e) {
            this.transports.shift();
            this.open();
            return;
        }
        transport.open();
        this.setTransport(transport);
    }
    /**
     * Sets the current transport. Disables the existing one (if any).
     *
     * @private
     */
    setTransport(transport) {
        if (this.transport) {
            this.transport.removeAllListeners();
        }
        // set up transport
        this.transport = transport;
        // set up transport listeners
        transport
            .on("drain", this.onDrain.bind(this))
            .on("packet", this.onPacket.bind(this))
            .on("error", this.onError.bind(this))
            .on("close", (reason) => this.onClose("transport close", reason));
    }
    /**
     * Probes a transport.
     *
     * @param {String} name - transport name
     * @private
     */
    probe(name) {
        let transport = this.createTransport(name);
        let failed = false;
        Socket.priorWebsocketSuccess = false;
        const onTransportOpen = () => {
            if (failed)
                return;
            transport.send([{ type: "ping", data: "probe" }]);
            transport.once("packet", (msg) => {
                if (failed)
                    return;
                if ("pong" === msg.type && "probe" === msg.data) {
                    this.upgrading = true;
                    this.emitReserved("upgrading", transport);
                    if (!transport)
                        return;
                    Socket.priorWebsocketSuccess = "websocket" === transport.name;
                    this.transport.pause(() => {
                        if (failed)
                            return;
                        if ("closed" === this.readyState)
                            return;
                        cleanup();
                        this.setTransport(transport);
                        transport.send([{ type: "upgrade" }]);
                        this.emitReserved("upgrade", transport);
                        transport = null;
                        this.upgrading = false;
                        this.flush();
                    });
                }
                else {
                    const err = new Error("probe error");
                    // @ts-ignore
                    err.transport = transport.name;
                    this.emitReserved("upgradeError", err);
                }
            });
        };
        function freezeTransport() {
            if (failed)
                return;
            // Any callback called by transport should be ignored since now
            failed = true;
            cleanup();
            transport.close();
            transport = null;
        }
        // Handle any error that happens while probing
        const onerror = (err) => {
            const error = new Error("probe error: " + err);
            // @ts-ignore
            error.transport = transport.name;
            freezeTransport();
            this.emitReserved("upgradeError", error);
        };
        function onTransportClose() {
            onerror("transport closed");
        }
        // When the socket is closed while we're probing
        function onclose() {
            onerror("socket closed");
        }
        // When the socket is upgraded while we're probing
        function onupgrade(to) {
            if (transport && to.name !== transport.name) {
                freezeTransport();
            }
        }
        // Remove all listeners on the transport and on self
        const cleanup = () => {
            transport.removeListener("open", onTransportOpen);
            transport.removeListener("error", onerror);
            transport.removeListener("close", onTransportClose);
            this.off("close", onclose);
            this.off("upgrading", onupgrade);
        };
        transport.once("open", onTransportOpen);
        transport.once("error", onerror);
        transport.once("close", onTransportClose);
        this.once("close", onclose);
        this.once("upgrading", onupgrade);
        if (this.upgrades.indexOf("webtransport") !== -1 &&
            name !== "webtransport") {
            // favor WebTransport
            this.setTimeoutFn(() => {
                if (!failed) {
                    transport.open();
                }
            }, 200);
        }
        else {
            transport.open();
        }
    }
    /**
     * Called when connection is deemed open.
     *
     * @private
     */
    onOpen() {
        this.readyState = "open";
        Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
        this.emitReserved("open");
        this.flush();
        // we check for `readyState` in case an `open`
        // listener already closed the socket
        if ("open" === this.readyState && this.opts.upgrade) {
            let i = 0;
            const l = this.upgrades.length;
            for (; i < l; i++) {
                this.probe(this.upgrades[i]);
            }
        }
    }
    /**
     * Handles a packet.
     *
     * @private
     */
    onPacket(packet) {
        if ("opening" === this.readyState ||
            "open" === this.readyState ||
            "closing" === this.readyState) {
            this.emitReserved("packet", packet);
            // Socket is live - any packet counts
            this.emitReserved("heartbeat");
            switch (packet.type) {
                case "open":
                    this.onHandshake(JSON.parse(packet.data));
                    break;
                case "ping":
                    this.resetPingTimeout();
                    this.sendPacket("pong");
                    this.emitReserved("ping");
                    this.emitReserved("pong");
                    break;
                case "error":
                    const err = new Error("server error");
                    // @ts-ignore
                    err.code = packet.data;
                    this.onError(err);
                    break;
                case "message":
                    this.emitReserved("data", packet.data);
                    this.emitReserved("message", packet.data);
                    break;
            }
        }
    }
    /**
     * Called upon handshake completion.
     *
     * @param {Object} data - handshake obj
     * @private
     */
    onHandshake(data) {
        this.emitReserved("handshake", data);
        this.id = data.sid;
        this.transport.query.sid = data.sid;
        this.upgrades = this.filterUpgrades(data.upgrades);
        this.pingInterval = data.pingInterval;
        this.pingTimeout = data.pingTimeout;
        this.maxPayload = data.maxPayload;
        this.onOpen();
        // In case open handler closes socket
        if ("closed" === this.readyState)
            return;
        this.resetPingTimeout();
    }
    /**
     * Sets and resets ping timeout timer based on server pings.
     *
     * @private
     */
    resetPingTimeout() {
        this.clearTimeoutFn(this.pingTimeoutTimer);
        this.pingTimeoutTimer = this.setTimeoutFn(() => {
            this.onClose("ping timeout");
        }, this.pingInterval + this.pingTimeout);
        if (this.opts.autoUnref) {
            this.pingTimeoutTimer.unref();
        }
    }
    /**
     * Called on `drain` event
     *
     * @private
     */
    onDrain() {
        this.writeBuffer.splice(0, this.prevBufferLen);
        // setting prevBufferLen = 0 is very important
        // for example, when upgrading, upgrade packet is sent over,
        // and a nonzero prevBufferLen could cause problems on `drain`
        this.prevBufferLen = 0;
        if (0 === this.writeBuffer.length) {
            this.emitReserved("drain");
        }
        else {
            this.flush();
        }
    }
    /**
     * Flush write buffers.
     *
     * @private
     */
    flush() {
        if ("closed" !== this.readyState &&
            this.transport.writable &&
            !this.upgrading &&
            this.writeBuffer.length) {
            const packets = this.getWritablePackets();
            this.transport.send(packets);
            // keep track of current length of writeBuffer
            // splice writeBuffer and callbackBuffer on `drain`
            this.prevBufferLen = packets.length;
            this.emitReserved("flush");
        }
    }
    /**
     * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
     * long-polling)
     *
     * @private
     */
    getWritablePackets() {
        const shouldCheckPayloadSize = this.maxPayload &&
            this.transport.name === "polling" &&
            this.writeBuffer.length > 1;
        if (!shouldCheckPayloadSize) {
            return this.writeBuffer;
        }
        let payloadSize = 1; // first packet type
        for (let i = 0; i < this.writeBuffer.length; i++) {
            const data = this.writeBuffer[i].data;
            if (data) {
                payloadSize += byteLength(data);
            }
            if (i > 0 && payloadSize > this.maxPayload) {
                return this.writeBuffer.slice(0, i);
            }
            payloadSize += 2; // separator + packet type
        }
        return this.writeBuffer;
    }
    /**
     * Sends a message.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} callback function.
     * @return {Socket} for chaining.
     */
    write(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
    }
    send(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
    }
    /**
     * Sends a packet.
     *
     * @param {String} type: packet type.
     * @param {String} data.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @private
     */
    sendPacket(type, data, options, fn) {
        if ("function" === typeof data) {
            fn = data;
            data = undefined;
        }
        if ("function" === typeof options) {
            fn = options;
            options = null;
        }
        if ("closing" === this.readyState || "closed" === this.readyState) {
            return;
        }
        options = options || {};
        options.compress = false !== options.compress;
        const packet = {
            type: type,
            data: data,
            options: options,
        };
        this.emitReserved("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (fn)
            this.once("flush", fn);
        this.flush();
    }
    /**
     * Closes the connection.
     */
    close() {
        const close = () => {
            this.onClose("forced close");
            this.transport.close();
        };
        const cleanupAndClose = () => {
            this.off("upgrade", cleanupAndClose);
            this.off("upgradeError", cleanupAndClose);
            close();
        };
        const waitForUpgrade = () => {
            // wait for upgrade to finish since we can't send packets while pausing a transport
            this.once("upgrade", cleanupAndClose);
            this.once("upgradeError", cleanupAndClose);
        };
        if ("opening" === this.readyState || "open" === this.readyState) {
            this.readyState = "closing";
            if (this.writeBuffer.length) {
                this.once("drain", () => {
                    if (this.upgrading) {
                        waitForUpgrade();
                    }
                    else {
                        close();
                    }
                });
            }
            else if (this.upgrading) {
                waitForUpgrade();
            }
            else {
                close();
            }
        }
        return this;
    }
    /**
     * Called upon transport error
     *
     * @private
     */
    onError(err) {
        Socket.priorWebsocketSuccess = false;
        this.emitReserved("error", err);
        this.onClose("transport error", err);
    }
    /**
     * Called upon transport close.
     *
     * @private
     */
    onClose(reason, description) {
        if ("opening" === this.readyState ||
            "open" === this.readyState ||
            "closing" === this.readyState) {
            // clear timers
            this.clearTimeoutFn(this.pingTimeoutTimer);
            // stop event from firing again for transport
            this.transport.removeAllListeners("close");
            // ensure transport won't stay open
            this.transport.close();
            // ignore further transport communication
            this.transport.removeAllListeners();
            if (typeof removeEventListener === "function") {
                removeEventListener("beforeunload", this.beforeunloadEventListener, false);
                removeEventListener("offline", this.offlineEventListener, false);
            }
            // set ready state
            this.readyState = "closed";
            // clear session id
            this.id = null;
            // emit close event
            this.emitReserved("close", reason, description);
            // clean buffers after, so users can still
            // grab the buffers on `close` event
            this.writeBuffer = [];
            this.prevBufferLen = 0;
        }
    }
    /**
     * Filters upgrades, returning only those matching client transports.
     *
     * @param {Array} upgrades - server upgrades
     * @private
     */
    filterUpgrades(upgrades) {
        const filteredUpgrades = [];
        let i = 0;
        const j = upgrades.length;
        for (; i < j; i++) {
            if (~this.transports.indexOf(upgrades[i]))
                filteredUpgrades.push(upgrades[i]);
        }
        return filteredUpgrades;
    }
};
Socket$1.protocol = protocol$1;

/**
 * URL parser.
 *
 * @param uri - url
 * @param path - the request path of the connection
 * @param loc - An object meant to mimic window.location.
 *        Defaults to window.location.
 * @public
 */
function url(uri, path = "", loc) {
    let obj = uri;
    // default to window.location
    loc = loc || (typeof location !== "undefined" && location);
    if (null == uri)
        uri = loc.protocol + "//" + loc.host;
    // relative path support
    if (typeof uri === "string") {
        if ("/" === uri.charAt(0)) {
            if ("/" === uri.charAt(1)) {
                uri = loc.protocol + uri;
            }
            else {
                uri = loc.host + uri;
            }
        }
        if (!/^(https?|wss?):\/\//.test(uri)) {
            if ("undefined" !== typeof loc) {
                uri = loc.protocol + "//" + uri;
            }
            else {
                uri = "https://" + uri;
            }
        }
        // parse
        obj = parse(uri);
    }
    // make sure we treat `localhost:80` and `localhost` equally
    if (!obj.port) {
        if (/^(http|ws)$/.test(obj.protocol)) {
            obj.port = "80";
        }
        else if (/^(http|ws)s$/.test(obj.protocol)) {
            obj.port = "443";
        }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    // define unique id
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    // define href
    obj.href =
        obj.protocol +
            "://" +
            host +
            (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
}

const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const isView = (obj) => {
    return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj.buffer instanceof ArrayBuffer;
};
const toString = Object.prototype.toString;
const withNativeBlob = typeof Blob === "function" ||
    (typeof Blob !== "undefined" &&
        toString.call(Blob) === "[object BlobConstructor]");
const withNativeFile = typeof File === "function" ||
    (typeof File !== "undefined" &&
        toString.call(File) === "[object FileConstructor]");
/**
 * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
 *
 * @private
 */
function isBinary(obj) {
    return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
        (withNativeBlob && obj instanceof Blob) ||
        (withNativeFile && obj instanceof File));
}
function hasBinary(obj, toJSON) {
    if (!obj || typeof obj !== "object") {
        return false;
    }
    if (Array.isArray(obj)) {
        for (let i = 0, l = obj.length; i < l; i++) {
            if (hasBinary(obj[i])) {
                return true;
            }
        }
        return false;
    }
    if (isBinary(obj)) {
        return true;
    }
    if (obj.toJSON &&
        typeof obj.toJSON === "function" &&
        arguments.length === 1) {
        return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
            return true;
        }
    }
    return false;
}

/**
 * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @public
 */
function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length; // number of binary 'attachments'
    return { packet: pack, buffers: buffers };
}
function _deconstructPacket(data, buffers) {
    if (!data)
        return data;
    if (isBinary(data)) {
        const placeholder = { _placeholder: true, num: buffers.length };
        buffers.push(data);
        return placeholder;
    }
    else if (Array.isArray(data)) {
        const newData = new Array(data.length);
        for (let i = 0; i < data.length; i++) {
            newData[i] = _deconstructPacket(data[i], buffers);
        }
        return newData;
    }
    else if (typeof data === "object" && !(data instanceof Date)) {
        const newData = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newData[key] = _deconstructPacket(data[key], buffers);
            }
        }
        return newData;
    }
    return data;
}
/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @public
 */
function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    delete packet.attachments; // no longer useful
    return packet;
}
function _reconstructPacket(data, buffers) {
    if (!data)
        return data;
    if (data && data._placeholder === true) {
        const isIndexValid = typeof data.num === "number" &&
            data.num >= 0 &&
            data.num < buffers.length;
        if (isIndexValid) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else {
            throw new Error("illegal attachments");
        }
    }
    else if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            data[i] = _reconstructPacket(data[i], buffers);
        }
    }
    else if (typeof data === "object") {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                data[key] = _reconstructPacket(data[key], buffers);
            }
        }
    }
    return data;
}

/**
 * These strings must not be used as event names, as they have a special meaning.
 */
const RESERVED_EVENTS$1 = [
    "connect",
    "connect_error",
    "disconnect",
    "disconnecting",
    "newListener",
    "removeListener", // used by the Node.js EventEmitter
];
/**
 * Protocol version.
 *
 * @public
 */
const protocol = 5;
var PacketType;
(function (PacketType) {
    PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
    PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType[PacketType["EVENT"] = 2] = "EVENT";
    PacketType[PacketType["ACK"] = 3] = "ACK";
    PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType || (PacketType = {}));
/**
 * A socket.io Encoder instance
 */
class Encoder {
    /**
     * Encoder constructor
     *
     * @param {function} replacer - custom replacer to pass down to JSON.parse
     */
    constructor(replacer) {
        this.replacer = replacer;
    }
    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     */
    encode(obj) {
        if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
            if (hasBinary(obj)) {
                return this.encodeAsBinary({
                    type: obj.type === PacketType.EVENT
                        ? PacketType.BINARY_EVENT
                        : PacketType.BINARY_ACK,
                    nsp: obj.nsp,
                    data: obj.data,
                    id: obj.id,
                });
            }
        }
        return [this.encodeAsString(obj)];
    }
    /**
     * Encode packet as string.
     */
    encodeAsString(obj) {
        // first is type
        let str = "" + obj.type;
        // attachments if we have them
        if (obj.type === PacketType.BINARY_EVENT ||
            obj.type === PacketType.BINARY_ACK) {
            str += obj.attachments + "-";
        }
        // if we have a namespace other than `/`
        // we append it followed by a comma `,`
        if (obj.nsp && "/" !== obj.nsp) {
            str += obj.nsp + ",";
        }
        // immediately followed by the id
        if (null != obj.id) {
            str += obj.id;
        }
        // json data
        if (null != obj.data) {
            str += JSON.stringify(obj.data, this.replacer);
        }
        return str;
    }
    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     */
    encodeAsBinary(obj) {
        const deconstruction = deconstructPacket(obj);
        const pack = this.encodeAsString(deconstruction.packet);
        const buffers = deconstruction.buffers;
        buffers.unshift(pack); // add packet info to beginning of data list
        return buffers; // write all the buffers
    }
}
// see https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
function isObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
}
/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 */
class Decoder extends Emitter {
    /**
     * Decoder constructor
     *
     * @param {function} reviver - custom reviver to pass down to JSON.stringify
     */
    constructor(reviver) {
        super();
        this.reviver = reviver;
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */
    add(obj) {
        let packet;
        if (typeof obj === "string") {
            if (this.reconstructor) {
                throw new Error("got plaintext data when reconstructing a packet");
            }
            packet = this.decodeString(obj);
            const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
            if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
                packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
                // binary packet's json
                this.reconstructor = new BinaryReconstructor(packet);
                // no attachments, labeled binary but no binary data to follow
                if (packet.attachments === 0) {
                    super.emitReserved("decoded", packet);
                }
            }
            else {
                // non-binary full packet
                super.emitReserved("decoded", packet);
            }
        }
        else if (isBinary(obj) || obj.base64) {
            // raw binary data
            if (!this.reconstructor) {
                throw new Error("got binary data when not reconstructing a packet");
            }
            else {
                packet = this.reconstructor.takeBinaryData(obj);
                if (packet) {
                    // received final buffer
                    this.reconstructor = null;
                    super.emitReserved("decoded", packet);
                }
            }
        }
        else {
            throw new Error("Unknown type: " + obj);
        }
    }
    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     */
    decodeString(str) {
        let i = 0;
        // look up type
        const p = {
            type: Number(str.charAt(0)),
        };
        if (PacketType[p.type] === undefined) {
            throw new Error("unknown packet type " + p.type);
        }
        // look up attachments if type binary
        if (p.type === PacketType.BINARY_EVENT ||
            p.type === PacketType.BINARY_ACK) {
            const start = i + 1;
            while (str.charAt(++i) !== "-" && i != str.length) { }
            const buf = str.substring(start, i);
            if (buf != Number(buf) || str.charAt(i) !== "-") {
                throw new Error("Illegal attachments");
            }
            p.attachments = Number(buf);
        }
        // look up namespace (if any)
        if ("/" === str.charAt(i + 1)) {
            const start = i + 1;
            while (++i) {
                const c = str.charAt(i);
                if ("," === c)
                    break;
                if (i === str.length)
                    break;
            }
            p.nsp = str.substring(start, i);
        }
        else {
            p.nsp = "/";
        }
        // look up id
        const next = str.charAt(i + 1);
        if ("" !== next && Number(next) == next) {
            const start = i + 1;
            while (++i) {
                const c = str.charAt(i);
                if (null == c || Number(c) != c) {
                    --i;
                    break;
                }
                if (i === str.length)
                    break;
            }
            p.id = Number(str.substring(start, i + 1));
        }
        // look up json data
        if (str.charAt(++i)) {
            const payload = this.tryParse(str.substr(i));
            if (Decoder.isPayloadValid(p.type, payload)) {
                p.data = payload;
            }
            else {
                throw new Error("invalid payload");
            }
        }
        return p;
    }
    tryParse(str) {
        try {
            return JSON.parse(str, this.reviver);
        }
        catch (e) {
            return false;
        }
    }
    static isPayloadValid(type, payload) {
        switch (type) {
            case PacketType.CONNECT:
                return isObject(payload);
            case PacketType.DISCONNECT:
                return payload === undefined;
            case PacketType.CONNECT_ERROR:
                return typeof payload === "string" || isObject(payload);
            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
                return (Array.isArray(payload) &&
                    (typeof payload[0] === "number" ||
                        (typeof payload[0] === "string" &&
                            RESERVED_EVENTS$1.indexOf(payload[0]) === -1)));
            case PacketType.ACK:
            case PacketType.BINARY_ACK:
                return Array.isArray(payload);
        }
    }
    /**
     * Deallocates a parser's resources
     */
    destroy() {
        if (this.reconstructor) {
            this.reconstructor.finishedReconstruction();
            this.reconstructor = null;
        }
    }
}
/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 */
class BinaryReconstructor {
    constructor(packet) {
        this.packet = packet;
        this.buffers = [];
        this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */
    takeBinaryData(binData) {
        this.buffers.push(binData);
        if (this.buffers.length === this.reconPack.attachments) {
            // done with buffer list
            const packet = reconstructPacket(this.reconPack, this.buffers);
            this.finishedReconstruction();
            return packet;
        }
        return null;
    }
    /**
     * Cleans up binary packet reconstruction variables.
     */
    finishedReconstruction() {
        this.reconPack = null;
        this.buffers = [];
    }
}

var parser = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Decoder: Decoder,
  Encoder: Encoder,
  get PacketType () { return PacketType; },
  protocol: protocol
});

function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
        obj.off(ev, fn);
    };
}

/**
 * Internal events.
 * These events can't be emitted by the user.
 */
const RESERVED_EVENTS = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1,
});
/**
 * A Socket is the fundamental class for interacting with the server.
 *
 * A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
 *
 * @example
 * const socket = io();
 *
 * socket.on("connect", () => {
 *   console.log("connected");
 * });
 *
 * // send an event to the server
 * socket.emit("foo", "bar");
 *
 * socket.on("foobar", () => {
 *   // an event was received from the server
 * });
 *
 * // upon disconnection
 * socket.on("disconnect", (reason) => {
 *   console.log(`disconnected due to ${reason}`);
 * });
 */
class Socket extends Emitter {
    /**
     * `Socket` constructor.
     */
    constructor(io, nsp, opts) {
        super();
        /**
         * Whether the socket is currently connected to the server.
         *
         * @example
         * const socket = io();
         *
         * socket.on("connect", () => {
         *   console.log(socket.connected); // true
         * });
         *
         * socket.on("disconnect", () => {
         *   console.log(socket.connected); // false
         * });
         */
        this.connected = false;
        /**
         * Whether the connection state was recovered after a temporary disconnection. In that case, any missed packets will
         * be transmitted by the server.
         */
        this.recovered = false;
        /**
         * Buffer for packets received before the CONNECT packet
         */
        this.receiveBuffer = [];
        /**
         * Buffer for packets that will be sent once the socket is connected
         */
        this.sendBuffer = [];
        /**
         * The queue of packets to be sent with retry in case of failure.
         *
         * Packets are sent one by one, each waiting for the server acknowledgement, in order to guarantee the delivery order.
         * @private
         */
        this._queue = [];
        /**
         * A sequence to generate the ID of the {@link QueuedPacket}.
         * @private
         */
        this._queueSeq = 0;
        this.ids = 0;
        this.acks = {};
        this.flags = {};
        this.io = io;
        this.nsp = nsp;
        if (opts && opts.auth) {
            this.auth = opts.auth;
        }
        this._opts = Object.assign({}, opts);
        if (this.io._autoConnect)
            this.open();
    }
    /**
     * Whether the socket is currently disconnected
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.disconnected); // false
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.disconnected); // true
     * });
     */
    get disconnected() {
        return !this.connected;
    }
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    subEvents() {
        if (this.subs)
            return;
        const io = this.io;
        this.subs = [
            on(io, "open", this.onopen.bind(this)),
            on(io, "packet", this.onpacket.bind(this)),
            on(io, "error", this.onerror.bind(this)),
            on(io, "close", this.onclose.bind(this)),
        ];
    }
    /**
     * Whether the Socket will try to reconnect when its Manager connects or reconnects.
     *
     * @example
     * const socket = io();
     *
     * console.log(socket.active); // true
     *
     * socket.on("disconnect", (reason) => {
     *   if (reason === "io server disconnect") {
     *     // the disconnection was initiated by the server, you need to manually reconnect
     *     console.log(socket.active); // false
     *   }
     *   // else the socket will automatically try to reconnect
     *   console.log(socket.active); // true
     * });
     */
    get active() {
        return !!this.subs;
    }
    /**
     * "Opens" the socket.
     *
     * @example
     * const socket = io({
     *   autoConnect: false
     * });
     *
     * socket.connect();
     */
    connect() {
        if (this.connected)
            return this;
        this.subEvents();
        if (!this.io["_reconnecting"])
            this.io.open(); // ensure open
        if ("open" === this.io._readyState)
            this.onopen();
        return this;
    }
    /**
     * Alias for {@link connect()}.
     */
    open() {
        return this.connect();
    }
    /**
     * Sends a `message` event.
     *
     * This method mimics the WebSocket.send() method.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
     *
     * @example
     * socket.send("hello");
     *
     * // this is equivalent to
     * socket.emit("message", "hello");
     *
     * @return self
     */
    send(...args) {
        args.unshift("message");
        this.emit.apply(this, args);
        return this;
    }
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @example
     * socket.emit("hello", "world");
     *
     * // all serializable datastructures are supported (no need to call JSON.stringify)
     * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
     *
     * // with an acknowledgement from the server
     * socket.emit("hello", "world", (val) => {
     *   // ...
     * });
     *
     * @return self
     */
    emit(ev, ...args) {
        if (RESERVED_EVENTS.hasOwnProperty(ev)) {
            throw new Error('"' + ev.toString() + '" is a reserved event name');
        }
        args.unshift(ev);
        if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
            this._addToQueue(args);
            return this;
        }
        const packet = {
            type: PacketType.EVENT,
            data: args,
        };
        packet.options = {};
        packet.options.compress = this.flags.compress !== false;
        // event ack callback
        if ("function" === typeof args[args.length - 1]) {
            const id = this.ids++;
            const ack = args.pop();
            this._registerAckCallback(id, ack);
            packet.id = id;
        }
        const isTransportWritable = this.io.engine &&
            this.io.engine.transport &&
            this.io.engine.transport.writable;
        const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
        if (discardPacket) ;
        else if (this.connected) {
            this.notifyOutgoingListeners(packet);
            this.packet(packet);
        }
        else {
            this.sendBuffer.push(packet);
        }
        this.flags = {};
        return this;
    }
    /**
     * @private
     */
    _registerAckCallback(id, ack) {
        var _a;
        const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
        if (timeout === undefined) {
            this.acks[id] = ack;
            return;
        }
        // @ts-ignore
        const timer = this.io.setTimeoutFn(() => {
            delete this.acks[id];
            for (let i = 0; i < this.sendBuffer.length; i++) {
                if (this.sendBuffer[i].id === id) {
                    this.sendBuffer.splice(i, 1);
                }
            }
            ack.call(this, new Error("operation has timed out"));
        }, timeout);
        this.acks[id] = (...args) => {
            // @ts-ignore
            this.io.clearTimeoutFn(timer);
            ack.apply(this, [null, ...args]);
        };
    }
    /**
     * Emits an event and waits for an acknowledgement
     *
     * @example
     * // without timeout
     * const response = await socket.emitWithAck("hello", "world");
     *
     * // with a specific timeout
     * try {
     *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
     * } catch (err) {
     *   // the server did not acknowledge the event in the given delay
     * }
     *
     * @return a Promise that will be fulfilled when the server acknowledges the event
     */
    emitWithAck(ev, ...args) {
        // the timeout flag is optional
        const withErr = this.flags.timeout !== undefined || this._opts.ackTimeout !== undefined;
        return new Promise((resolve, reject) => {
            args.push((arg1, arg2) => {
                if (withErr) {
                    return arg1 ? reject(arg1) : resolve(arg2);
                }
                else {
                    return resolve(arg1);
                }
            });
            this.emit(ev, ...args);
        });
    }
    /**
     * Add the packet to the queue.
     * @param args
     * @private
     */
    _addToQueue(args) {
        let ack;
        if (typeof args[args.length - 1] === "function") {
            ack = args.pop();
        }
        const packet = {
            id: this._queueSeq++,
            tryCount: 0,
            pending: false,
            args,
            flags: Object.assign({ fromQueue: true }, this.flags),
        };
        args.push((err, ...responseArgs) => {
            if (packet !== this._queue[0]) {
                // the packet has already been acknowledged
                return;
            }
            const hasError = err !== null;
            if (hasError) {
                if (packet.tryCount > this._opts.retries) {
                    this._queue.shift();
                    if (ack) {
                        ack(err);
                    }
                }
            }
            else {
                this._queue.shift();
                if (ack) {
                    ack(null, ...responseArgs);
                }
            }
            packet.pending = false;
            return this._drainQueue();
        });
        this._queue.push(packet);
        this._drainQueue();
    }
    /**
     * Send the first packet of the queue, and wait for an acknowledgement from the server.
     * @param force - whether to resend a packet that has not been acknowledged yet
     *
     * @private
     */
    _drainQueue(force = false) {
        if (!this.connected || this._queue.length === 0) {
            return;
        }
        const packet = this._queue[0];
        if (packet.pending && !force) {
            return;
        }
        packet.pending = true;
        packet.tryCount++;
        this.flags = packet.flags;
        this.emit.apply(this, packet.args);
    }
    /**
     * Sends a packet.
     *
     * @param packet
     * @private
     */
    packet(packet) {
        packet.nsp = this.nsp;
        this.io._packet(packet);
    }
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    onopen() {
        if (typeof this.auth == "function") {
            this.auth((data) => {
                this._sendConnectPacket(data);
            });
        }
        else {
            this._sendConnectPacket(this.auth);
        }
    }
    /**
     * Sends a CONNECT packet to initiate the Socket.IO session.
     *
     * @param data
     * @private
     */
    _sendConnectPacket(data) {
        this.packet({
            type: PacketType.CONNECT,
            data: this._pid
                ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data)
                : data,
        });
    }
    /**
     * Called upon engine or manager `error`.
     *
     * @param err
     * @private
     */
    onerror(err) {
        if (!this.connected) {
            this.emitReserved("connect_error", err);
        }
    }
    /**
     * Called upon engine `close`.
     *
     * @param reason
     * @param description
     * @private
     */
    onclose(reason, description) {
        this.connected = false;
        delete this.id;
        this.emitReserved("disconnect", reason, description);
    }
    /**
     * Called with socket packet.
     *
     * @param packet
     * @private
     */
    onpacket(packet) {
        const sameNamespace = packet.nsp === this.nsp;
        if (!sameNamespace)
            return;
        switch (packet.type) {
            case PacketType.CONNECT:
                if (packet.data && packet.data.sid) {
                    this.onconnect(packet.data.sid, packet.data.pid);
                }
                else {
                    this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                }
                break;
            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
                this.onevent(packet);
                break;
            case PacketType.ACK:
            case PacketType.BINARY_ACK:
                this.onack(packet);
                break;
            case PacketType.DISCONNECT:
                this.ondisconnect();
                break;
            case PacketType.CONNECT_ERROR:
                this.destroy();
                const err = new Error(packet.data.message);
                // @ts-ignore
                err.data = packet.data.data;
                this.emitReserved("connect_error", err);
                break;
        }
    }
    /**
     * Called upon a server event.
     *
     * @param packet
     * @private
     */
    onevent(packet) {
        const args = packet.data || [];
        if (null != packet.id) {
            args.push(this.ack(packet.id));
        }
        if (this.connected) {
            this.emitEvent(args);
        }
        else {
            this.receiveBuffer.push(Object.freeze(args));
        }
    }
    emitEvent(args) {
        if (this._anyListeners && this._anyListeners.length) {
            const listeners = this._anyListeners.slice();
            for (const listener of listeners) {
                listener.apply(this, args);
            }
        }
        super.emit.apply(this, args);
        if (this._pid && args.length && typeof args[args.length - 1] === "string") {
            this._lastOffset = args[args.length - 1];
        }
    }
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    ack(id) {
        const self = this;
        let sent = false;
        return function (...args) {
            // prevent double callbacks
            if (sent)
                return;
            sent = true;
            self.packet({
                type: PacketType.ACK,
                id: id,
                data: args,
            });
        };
    }
    /**
     * Called upon a server acknowlegement.
     *
     * @param packet
     * @private
     */
    onack(packet) {
        const ack = this.acks[packet.id];
        if ("function" === typeof ack) {
            ack.apply(this, packet.data);
            delete this.acks[packet.id];
        }
    }
    /**
     * Called upon server connect.
     *
     * @private
     */
    onconnect(id, pid) {
        this.id = id;
        this.recovered = pid && this._pid === pid;
        this._pid = pid; // defined only if connection state recovery is enabled
        this.connected = true;
        this.emitBuffered();
        this.emitReserved("connect");
        this._drainQueue(true);
    }
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    emitBuffered() {
        this.receiveBuffer.forEach((args) => this.emitEvent(args));
        this.receiveBuffer = [];
        this.sendBuffer.forEach((packet) => {
            this.notifyOutgoingListeners(packet);
            this.packet(packet);
        });
        this.sendBuffer = [];
    }
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    ondisconnect() {
        this.destroy();
        this.onclose("io server disconnect");
    }
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    destroy() {
        if (this.subs) {
            // clean subscriptions to avoid reconnections
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs = undefined;
        }
        this.io["_destroy"](this);
    }
    /**
     * Disconnects the socket manually. In that case, the socket will not try to reconnect.
     *
     * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
     *
     * @example
     * const socket = io();
     *
     * socket.on("disconnect", (reason) => {
     *   // console.log(reason); prints "io client disconnect"
     * });
     *
     * socket.disconnect();
     *
     * @return self
     */
    disconnect() {
        if (this.connected) {
            this.packet({ type: PacketType.DISCONNECT });
        }
        // remove socket from pool
        this.destroy();
        if (this.connected) {
            // fire events
            this.onclose("io client disconnect");
        }
        return this;
    }
    /**
     * Alias for {@link disconnect()}.
     *
     * @return self
     */
    close() {
        return this.disconnect();
    }
    /**
     * Sets the compress flag.
     *
     * @example
     * socket.compress(false).emit("hello");
     *
     * @param compress - if `true`, compresses the sending data
     * @return self
     */
    compress(compress) {
        this.flags.compress = compress;
        return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @example
     * socket.volatile.emit("hello"); // the server may or may not receive it
     *
     * @returns self
     */
    get volatile() {
        this.flags.volatile = true;
        return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
     * given number of milliseconds have elapsed without an acknowledgement from the server:
     *
     * @example
     * socket.timeout(5000).emit("my-event", (err) => {
     *   if (err) {
     *     // the server did not acknowledge the event in the given delay
     *   }
     * });
     *
     * @returns self
     */
    timeout(timeout) {
        this.flags.timeout = timeout;
        return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @example
     * socket.onAny((event, ...args) => {
     *   console.log(`got ${event}`);
     * });
     *
     * @param listener
     */
    onAny(listener) {
        this._anyListeners = this._anyListeners || [];
        this._anyListeners.push(listener);
        return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @example
     * socket.prependAny((event, ...args) => {
     *   console.log(`got event ${event}`);
     * });
     *
     * @param listener
     */
    prependAny(listener) {
        this._anyListeners = this._anyListeners || [];
        this._anyListeners.unshift(listener);
        return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`got event ${event}`);
     * }
     *
     * socket.onAny(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAny(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAny();
     *
     * @param listener
     */
    offAny(listener) {
        if (!this._anyListeners) {
            return this;
        }
        if (listener) {
            const listeners = this._anyListeners;
            for (let i = 0; i < listeners.length; i++) {
                if (listener === listeners[i]) {
                    listeners.splice(i, 1);
                    return this;
                }
            }
        }
        else {
            this._anyListeners = [];
        }
        return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAny() {
        return this._anyListeners || [];
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.onAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    onAnyOutgoing(listener) {
        this._anyOutgoingListeners = this._anyOutgoingListeners || [];
        this._anyOutgoingListeners.push(listener);
        return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.prependAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    prependAnyOutgoing(listener) {
        this._anyOutgoingListeners = this._anyOutgoingListeners || [];
        this._anyOutgoingListeners.unshift(listener);
        return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`sent event ${event}`);
     * }
     *
     * socket.onAnyOutgoing(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAnyOutgoing(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAnyOutgoing();
     *
     * @param [listener] - the catch-all listener (optional)
     */
    offAnyOutgoing(listener) {
        if (!this._anyOutgoingListeners) {
            return this;
        }
        if (listener) {
            const listeners = this._anyOutgoingListeners;
            for (let i = 0; i < listeners.length; i++) {
                if (listener === listeners[i]) {
                    listeners.splice(i, 1);
                    return this;
                }
            }
        }
        else {
            this._anyOutgoingListeners = [];
        }
        return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAnyOutgoing() {
        return this._anyOutgoingListeners || [];
    }
    /**
     * Notify the listeners for each packet sent
     *
     * @param packet
     *
     * @private
     */
    notifyOutgoingListeners(packet) {
        if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
            const listeners = this._anyOutgoingListeners.slice();
            for (const listener of listeners) {
                listener.apply(this, packet.data);
            }
        }
    }
}

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */
function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 10000;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
}
/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */
Backoff.prototype.duration = function () {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);
    if (this.jitter) {
        var rand = Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }
    return Math.min(ms, this.max) | 0;
};
/**
 * Reset the number of attempts.
 *
 * @api public
 */
Backoff.prototype.reset = function () {
    this.attempts = 0;
};
/**
 * Set the minimum duration
 *
 * @api public
 */
Backoff.prototype.setMin = function (min) {
    this.ms = min;
};
/**
 * Set the maximum duration
 *
 * @api public
 */
Backoff.prototype.setMax = function (max) {
    this.max = max;
};
/**
 * Set the jitter
 *
 * @api public
 */
Backoff.prototype.setJitter = function (jitter) {
    this.jitter = jitter;
};

class Manager extends Emitter {
    constructor(uri, opts) {
        var _a;
        super();
        this.nsps = {};
        this.subs = [];
        if (uri && "object" === typeof uri) {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        opts.path = opts.path || "/socket.io";
        this.opts = opts;
        installTimerFunctions(this, opts);
        this.reconnection(opts.reconnection !== false);
        this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
        this.reconnectionDelay(opts.reconnectionDelay || 1000);
        this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
        this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
        this.backoff = new Backoff({
            min: this.reconnectionDelay(),
            max: this.reconnectionDelayMax(),
            jitter: this.randomizationFactor(),
        });
        this.timeout(null == opts.timeout ? 20000 : opts.timeout);
        this._readyState = "closed";
        this.uri = uri;
        const _parser = opts.parser || parser;
        this.encoder = new _parser.Encoder();
        this.decoder = new _parser.Decoder();
        this._autoConnect = opts.autoConnect !== false;
        if (this._autoConnect)
            this.open();
    }
    reconnection(v) {
        if (!arguments.length)
            return this._reconnection;
        this._reconnection = !!v;
        return this;
    }
    reconnectionAttempts(v) {
        if (v === undefined)
            return this._reconnectionAttempts;
        this._reconnectionAttempts = v;
        return this;
    }
    reconnectionDelay(v) {
        var _a;
        if (v === undefined)
            return this._reconnectionDelay;
        this._reconnectionDelay = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
        return this;
    }
    randomizationFactor(v) {
        var _a;
        if (v === undefined)
            return this._randomizationFactor;
        this._randomizationFactor = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
        return this;
    }
    reconnectionDelayMax(v) {
        var _a;
        if (v === undefined)
            return this._reconnectionDelayMax;
        this._reconnectionDelayMax = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
        return this;
    }
    timeout(v) {
        if (!arguments.length)
            return this._timeout;
        this._timeout = v;
        return this;
    }
    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @private
     */
    maybeReconnectOnOpen() {
        // Only try to reconnect if it's the first time we're connecting
        if (!this._reconnecting &&
            this._reconnection &&
            this.backoff.attempts === 0) {
            // keeps reconnection from firing twice for the same reconnection loop
            this.reconnect();
        }
    }
    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} fn - optional, callback
     * @return self
     * @public
     */
    open(fn) {
        if (~this._readyState.indexOf("open"))
            return this;
        this.engine = new Socket$1(this.uri, this.opts);
        const socket = this.engine;
        const self = this;
        this._readyState = "opening";
        this.skipReconnect = false;
        // emit `open`
        const openSubDestroy = on(socket, "open", function () {
            self.onopen();
            fn && fn();
        });
        const onError = (err) => {
            this.cleanup();
            this._readyState = "closed";
            this.emitReserved("error", err);
            if (fn) {
                fn(err);
            }
            else {
                // Only do this if there is no fn to handle the error
                this.maybeReconnectOnOpen();
            }
        };
        // emit `error`
        const errorSub = on(socket, "error", onError);
        if (false !== this._timeout) {
            const timeout = this._timeout;
            // set timer
            const timer = this.setTimeoutFn(() => {
                openSubDestroy();
                onError(new Error("timeout"));
                socket.close();
            }, timeout);
            if (this.opts.autoUnref) {
                timer.unref();
            }
            this.subs.push(() => {
                this.clearTimeoutFn(timer);
            });
        }
        this.subs.push(openSubDestroy);
        this.subs.push(errorSub);
        return this;
    }
    /**
     * Alias for open()
     *
     * @return self
     * @public
     */
    connect(fn) {
        return this.open(fn);
    }
    /**
     * Called upon transport open.
     *
     * @private
     */
    onopen() {
        // clear old subs
        this.cleanup();
        // mark as open
        this._readyState = "open";
        this.emitReserved("open");
        // add new subs
        const socket = this.engine;
        this.subs.push(on(socket, "ping", this.onping.bind(this)), on(socket, "data", this.ondata.bind(this)), on(socket, "error", this.onerror.bind(this)), on(socket, "close", this.onclose.bind(this)), on(this.decoder, "decoded", this.ondecoded.bind(this)));
    }
    /**
     * Called upon a ping.
     *
     * @private
     */
    onping() {
        this.emitReserved("ping");
    }
    /**
     * Called with data.
     *
     * @private
     */
    ondata(data) {
        try {
            this.decoder.add(data);
        }
        catch (e) {
            this.onclose("parse error", e);
        }
    }
    /**
     * Called when parser fully decodes a packet.
     *
     * @private
     */
    ondecoded(packet) {
        // the nextTick call prevents an exception in a user-provided event listener from triggering a disconnection due to a "parse error"
        nextTick(() => {
            this.emitReserved("packet", packet);
        }, this.setTimeoutFn);
    }
    /**
     * Called upon socket error.
     *
     * @private
     */
    onerror(err) {
        this.emitReserved("error", err);
    }
    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @public
     */
    socket(nsp, opts) {
        let socket = this.nsps[nsp];
        if (!socket) {
            socket = new Socket(this, nsp, opts);
            this.nsps[nsp] = socket;
        }
        else if (this._autoConnect && !socket.active) {
            socket.connect();
        }
        return socket;
    }
    /**
     * Called upon a socket close.
     *
     * @param socket
     * @private
     */
    _destroy(socket) {
        const nsps = Object.keys(this.nsps);
        for (const nsp of nsps) {
            const socket = this.nsps[nsp];
            if (socket.active) {
                return;
            }
        }
        this._close();
    }
    /**
     * Writes a packet.
     *
     * @param packet
     * @private
     */
    _packet(packet) {
        const encodedPackets = this.encoder.encode(packet);
        for (let i = 0; i < encodedPackets.length; i++) {
            this.engine.write(encodedPackets[i], packet.options);
        }
    }
    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @private
     */
    cleanup() {
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs.length = 0;
        this.decoder.destroy();
    }
    /**
     * Close the current socket.
     *
     * @private
     */
    _close() {
        this.skipReconnect = true;
        this._reconnecting = false;
        this.onclose("forced close");
        if (this.engine)
            this.engine.close();
    }
    /**
     * Alias for close()
     *
     * @private
     */
    disconnect() {
        return this._close();
    }
    /**
     * Called upon engine close.
     *
     * @private
     */
    onclose(reason, description) {
        this.cleanup();
        this.backoff.reset();
        this._readyState = "closed";
        this.emitReserved("close", reason, description);
        if (this._reconnection && !this.skipReconnect) {
            this.reconnect();
        }
    }
    /**
     * Attempt a reconnection.
     *
     * @private
     */
    reconnect() {
        if (this._reconnecting || this.skipReconnect)
            return this;
        const self = this;
        if (this.backoff.attempts >= this._reconnectionAttempts) {
            this.backoff.reset();
            this.emitReserved("reconnect_failed");
            this._reconnecting = false;
        }
        else {
            const delay = this.backoff.duration();
            this._reconnecting = true;
            const timer = this.setTimeoutFn(() => {
                if (self.skipReconnect)
                    return;
                this.emitReserved("reconnect_attempt", self.backoff.attempts);
                // check again for the case socket closed in above events
                if (self.skipReconnect)
                    return;
                self.open((err) => {
                    if (err) {
                        self._reconnecting = false;
                        self.reconnect();
                        this.emitReserved("reconnect_error", err);
                    }
                    else {
                        self.onreconnect();
                    }
                });
            }, delay);
            if (this.opts.autoUnref) {
                timer.unref();
            }
            this.subs.push(() => {
                this.clearTimeoutFn(timer);
            });
        }
    }
    /**
     * Called upon successful reconnect.
     *
     * @private
     */
    onreconnect() {
        const attempt = this.backoff.attempts;
        this._reconnecting = false;
        this.backoff.reset();
        this.emitReserved("reconnect", attempt);
    }
}

/**
 * Managers cache.
 */
const cache = {};
function lookup(uri, opts) {
    if (typeof uri === "object") {
        opts = uri;
        uri = undefined;
    }
    opts = opts || {};
    const parsed = url(uri, opts.path || "/socket.io");
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache[id] && path in cache[id]["nsps"];
    const newConnection = opts.forceNew ||
        opts["force new connection"] ||
        false === opts.multiplex ||
        sameNamespace;
    let io;
    if (newConnection) {
        io = new Manager(source, opts);
    }
    else {
        if (!cache[id]) {
            cache[id] = new Manager(source, opts);
        }
        io = cache[id];
    }
    if (parsed.query && !opts.query) {
        opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
}
// so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
// namespace (e.g. `io.connect(...)`), for backward compatibility
Object.assign(lookup, {
    Manager,
    Socket,
    io: lookup,
    connect: lookup,
});

//import FileSaver from "file-saver";

class URI {
  id; // id in Uint8Array!!!

  toStr() {
    if (this.id != undefined)
      return "[" + this.id.toString() + "]";
  }

  fromStr( str ) {
    this.id = new Uint8Array(JSON.parse(str));
  }

  static fromArray( inA ) {
    let outA = [];
    for (let i = 0; i < inA.length; i++)
      outA[i] = new URI(inA[i]);
    return outA;
  }

  constructor( data ) {
    // console.log("URI in:");
    // console.log(data);
    if (typeof(data) == 'string')
      this.fromStr(data);
    else if (data instanceof ArrayBuffer)
      this.id = new Uint8Array(data);
    else if (data instanceof Uint8Array)
      this.id = data;
    else
    {
      console.log("WRONG URI TYPEL:");
      console.log(data);
    }
  }
}

class Connection {
  socket;

  getNodeRes;
  getAllNodesRes;
  addNodeRes;
  delNodeRes;
  connectNodesRes;
  disconnectNodesRes;
  setDefNodeURIRes;
  getDefNodeURIRes;

  constructor() {
    console.log("Connected with server");

    this.socket = lookup();

    this.socket.on("connect", () => {
      console.log("SOCKET ID: " + this.socket.id);

    });
  }

  async send( req, ...args ) {
    return new Promise((resolve) => {
      this.socket.emit(req, ...args, (response) => {
        console.log("TEST OUT:");
        console.log(response);
        resolve(response);
      });
    });
  }

  async ping( value ) {
    return this.send("ping", value);
  }

  async getNode( uri ) {
    return this.send("getNodeReq", uri.id);
  }

  async addNode( data ) {
    return new URI(await this.send("addNodeReq", data));
  }

  async updateNode( uri, data ) {
    return this.send("updateNodeReq", uri.id, data);
  }

  async getAllNodes() {
    return URI.fromArray( await this.send("getAllNodesReq"));
  }

  async getAllConnections() {
    let cA = await this.send("getAllConnectionsReq");

    let outA = [];

    for (let i = 0; i < cA.length; i++)
      outA[i] = [new URI(cA[i].id1), new URI(cA[i].id2)];
    return outA;
  }

  async getAllNodesData() {
    return this.send("getAllNodesDataReq");
  }

  async delNode( node ) {
    return this.send("delNodeReq", node);
  }

  async connectNodes( uri1, uri2 ) {
    return this.send("connectNodesReq", [uri1.id, uri2.id]);
  }

  async getNodeConnections( uri ) {
    let cA = await this.send("getNodeConnectionsReq", uri.id);

    let outA = [];
    
    for (let i = 0; i < cA.length; i++)
      outA[i] = [new URI(cA[i].id1), new URI(cA[i].id2)];
    return outA;
  }

  async getNeighbours( uri ) {
    return URI.fromArray(await this.send("getNeighboursReq", uri.id));
  }

  async disconnectNodes( uri1, uri2 ) {
    return this.send("disconnectNodesReq", [uri1.id, uri2.id]);
  }

  async setDefNodeURI( uri ) {
    return this.send("setDefNodeURIReq", uri.id);
  }

  async getDefNodeURI() {
    return new URI(await this.send("getDefNodeURIReq"));
  }

  async clearDB() {
    return this.send("clearDBReq");
  }

  async getDB() {
    return this.send("getDBReq");
  }

  async saveDB( outFileName ) {
    let dbText = JSON.stringify(await this.getDB());
  
    var a = document.createElement('a');
    var file = new Blob([dbText], {type: "text/plain;charset=utf-8"});
    a.href = URL.createObjectURL(file);
    a.download = outFileName;
    a.click();
    return dbText;
  }

  async loadDB( db ) {
    return this.send("loadDBReq", db);
  }

  async addDB( db ) {
    return this.send("addDataReq", db);
  }
  
  
} /* Connection */

// system imports

let system = new System();
let server = new Connection();

// add necessary
system.addUnit(Arcball.create);
system.addUnit(Skysphere.create, "./bin/imgs/lakhta.png");


// add base construction
let floorBase = 0.0;
let floorHeight = 4.5;
let cuttingHeight;

let cuttingHeightElement = document.getElementById("baseConstructionCuttingHeight");
cuttingHeight = floorBase + cuttingHeightElement.value * floorHeight;

let baseConstructionMaterial = await system.createMaterial("./shaders/baseConstruction");
cuttingHeightElement.addEventListener("input", () => {
  cuttingHeight = floorBase + cuttingHeightElement.value * floorHeight;
  baseConstructionMaterial.ubo.writeData(new Float32Array([cuttingHeight]));
});

// displays basic construction
await system.addUnit(async function() {
  let buildingModel = await system.createPrimitive(
    await Topology.model_obj("./bin/models/PML30_simple.obj"),
    baseConstructionMaterial
  );

  baseConstructionMaterial.uboNameOnShader = "materialUBO";
  baseConstructionMaterial.ubo = system.createUniformBuffer();

  // initialization
  baseConstructionMaterial.ubo.writeData(new Float32Array([cuttingHeight]));

  return {
    type: "baseConstruction",
    response(system) {
      system.drawPrimitive(buildingModel);
    } /* response */
  };
}); /* baseConstructionDisplayer */

// node and connection units collection
let nodes = {};
let connections = {};


let nodePrim = await system.createPrimitive(Topology.sphere(0.2), await system.createMaterial("./shaders/point_sphere")); // primitive of any node displayed

// creates new node
async function createNode(location, oldName = null, oldSkysphere = null, addedOnServer = false, oldnodeURI = null) {
  // check if new node is possible to be placed
  if (!addedOnServer) {
    for (let oldNode of Object.values(nodes)) {
      if (location.distance(oldNode.pos) <= 0.3) {
        return null;
      }
    }
  }

  let transform = Mat4.translate(location);

  let position = location.copy();
  let unit = await system.addUnit(function() {
    return {
      skysphere: {
        rotation: 0,
      },

      type: "node",
      response(system) {
        if (location.y <= cuttingHeight) {
          system.drawMarkerPrimitive(nodePrim, transform);
        }
      }, /* response */
    };
  });

  // position property
  Object.defineProperty(unit, "pos", {
    get: function() {
      return position;
    }, /* get */

    set: function(newPosition) {
      // check if node is possible to move here
      for (const value of Object.values(nodes)) {
        if (value !== unit &&  value.pos.distance(newPosition) <= 0.3) {
          return false;
        }
      }

      // place node
      position = newPosition.copy();
      transform = Mat4.translate(position);
      unit.banner.pos = position.add(new Vec3(0, 2, 0));
      updateConnectionTransforms(unit);

      // update server data
      server.updateNode(unit.nodeURI, {position: position});
    } /* set */
  });

  // name property
  let name = oldName;
  Object.defineProperty(unit, "name", {
    get: function() {
      return name;
    }, /* get */

    set: function(newName) {
      unit.banner.content = newName;
      name = newName;
      // update server data

      server.updateNode(unit.nodeURI, {name: name});
    } /* set */
  });

  let skyspherePath;
  if (oldSkysphere !== null) {
    skyspherePath = oldSkysphere.path;
    unit.skysphere.rotation = oldSkysphere.rotation;
  }

  // skysphere.path property
  Object.defineProperty(unit.skysphere, "path", {
    get: function() {
      return skyspherePath;
    }, /* get */

    set: function(newSkyspherePath) {
      skyspherePath = newSkyspherePath;

      // update server data
      server.updateNode(unit.nodeURI, {
        skysphere: {
          path: skyspherePath,
          rotation: unit.skysphere.rotation,
        }
      });
    } /* set */
  });

  // get node id
  if (addedOnServer) {
    unit.nodeURI = oldnodeURI;
  } else {
    unit.nodeURI = await server.addNode({
      name: unit.name,
      position: position,
      skysphere: {
        path: unit.skysphere.path,
        rotation: unit.skysphere.rotation
      }
    });
  }

  // add name if it's undefined
  if (name === null) {
    name = `node#${unit.nodeURI}`;
  }

  unit.banner = await Banner.create(system, name, location, 2);
  unit.banner.show = false;

  nodes[unit.nodeURI.toStr()] = unit;
  unit.banner.nodeURI = unit.nodeURI;

  return unit;
} /* createNode */

// destroy node
function destroyNode(node) {
  breakNodeConnections(node);
  node.doSuicide = true;
  node.banner.doSuicide = true;
  server.delNode(node.nodeURI);

  delete nodes[node.nodeURI];
} /* destroyNode */


let connectionPrimitive = await system.createPrimitive(Topology.cylinder(), await system.createMaterial("./shaders/connection"));
let connectionUniqueID = 0;
async function createConnection(firstNode, secondNode, addedOnServer = false) {
  // check if connection is possible
  if (firstNode === secondNode) {
    console.error("can't connect node with node itself");
    return null;
  }
  for (const index in connections) {
    let connection = connections[index];

    if (firstNode === connection.first && secondNode === connection.second ||
        firstNode === connection.second && secondNode === connection.first) {
      console.error(`connection {${firstNode.name}, ${secondNode.name}} already exists`);
      return connection;
    }
  }

  let transform = Mat4.identity();


  // Working with backend
  if (!addedOnServer) {
    if (!(await server.connectNodes(firstNode.nodeURI, secondNode.nodeURI))) {
      return null;
    }
  }

  let unit = await system.addUnit(function() {
    return {
      first: firstNode,
      second: secondNode,
      type: "connection",
      connectionID: connectionUniqueID++,

      updateTransform() {
        let dir = unit.second.pos.sub(unit.first.pos);
        let dist = dir.length();
        dir = dir.mul(1.0 / dist);
        let elevation = Math.acos(dir.y);

        transform = Mat4.scale(new Vec3(0.1, dist, 0.1)).mul(Mat4.rotate(elevation, new Vec3(-dir.z, 0, dir.x))).mul(Mat4.translate(unit.first.pos));
      }, /* updateTransform */

      response(system) {
        if (firstNode.pos.y <= cuttingHeight || secondNode.pos.y <= cuttingHeight) {
          system.drawMarkerPrimitive(connectionPrimitive, transform);
        }
      } /* response */
    };
  });
  unit.updateTransform();

  connections[unit.connectionID] = unit;

  return unit;
} /* createConnection */


function destroyConnection(connection) {
  connection.doSuicide = true;
  console.log(connection.first.nodeURI.toStr(), connection.second.nodeURI.toStr());
  server.disconnectNodes(connection.first.nodeURI, connection.second.nodeURI);
  delete connections[connection.connectionID];
} /* destroyConnection */


// update transform matrices of all connections with node.
function updateConnectionTransforms(node = null) {
  for (const value of Object.values(connections)) {
    if (value.first === node || value.second === node) {
      value.updateTransform();
    }
  }
} /* updateConnectionTransforms */


// delete all connections with specified node
function breakNodeConnections(node = null) {
  let keyList = [];
  for (const [key, value] of Object.entries(connections)) {
    if (value.first === node || value.second === node) {
      value.doSuicide = true;
      keyList.push(key);
    }
  }

  for (let key of keyList) {
    destroyConnection(connections[key]);
  }
} /* breakNodeConnections */


// load previous session nodes and connections
async function addServerData() {
  let serverNodeURIs = await server.getAllNodes();
  let serverNodes = await server.getAllNodesData();

  for (let i = 0, count = serverNodes.length; i < count; i++) {
    let serverNode = serverNodes[i];
    await createNode(Vec3.fromObject(serverNode.position), serverNode.name, serverNode.skysphere, true, serverNodeURIs[i]);
  }
  // let serverNodeURIs = await server.getAllNodes();
  // for (let serverNodeURI of serverNodeURIs) {
  //   let serverNode = await server.getNode(serverNodeURI);
  //   await createNode(mth.Vec3.fromObject(serverNode.position), serverNode.name, serverNode.skysphere, true, serverNodeURI);
  // }

  // same shit, but with nice sth
  let serverConnections = await server.getAllConnections();

  for (let connection of serverConnections) {
    createConnection(nodes[connection[0].toStr()], nodes[connection[1].toStr()], true);
  }
} /* addServerData */
await addServerData();

// adding node
system.canvas.addEventListener("mousedown", (event) => {
  if ((event.buttons & 1) === 1 && event.altKey) {
    let unit = system.getUnitByCoord(event.clientX, event.clientY);
  
    if (unit !== undefined && unit.type === "baseConstruction") {
      createNode(system.getPositionByCoord(event.clientX, event.clientY));
    }
  }
}); /* event system.canvas:"mousedown" */

let eventPair = null;

// adding connection between nodes
system.canvas.addEventListener("mousedown", (event) => {
  if ((event.buttons & 2) === 2 && !event.shiftKey && event.altKey) {
    let pointEvent = {
      x: event.clientX,
      y: event.clientY
    };

    let unit = system.getUnitByCoord(pointEvent.x, pointEvent.y);

    if (unit !== undefined && unit.type === "node") {
  
      pointEvent.unit = unit;
  
      if (eventPair === null) {
        eventPair = {
          first: pointEvent,
          second: null
        };
        eventPair.first.bannerPromise = Banner.create(system, "First element", unit.pos, 4);
      } else {
        eventPair.second = pointEvent;
  
        // erase banner
        eventPair.first.bannerPromise.then(banner => banner.doSuicide = true);
        // refuse connection with invalid banner
        if (eventPair.first.unit.doSuicide) {
          eventPair = null;
          return;
        }
  
        createConnection(eventPair.first.unit, eventPair.second.unit);
  
        eventPair = null;
      }
    }
    pointEvent = null;
  }
}); /* event system.canvas:"mousedown" */



// UI handling

let nodeParameters = document.getElementById("nodeParameters");
let nodeInputParameters = {
  nodeURI: document.getElementById("nodeURI"),
  nodeName: document.getElementById("nodeName"),
  skyspherePath: document.getElementById("skyspherePath"),
  makeDefault: document.getElementById("makeDefault"),
  deleteNode: document.getElementById("deleteNode")
}; /* nodeInputParameters */

let connectionParameters = document.getElementById("connectionParameters");
let connectionInputParameters = {
  nodesURI: document.getElementById("connectionNodesURI"),
  deleteConnection: document.getElementById("deleteConnection")
}; /* connectionInputParameters */

// node pointing unit
let doMoveNode = true;
let activeContentShowNode = null;
let activeContentShowConnection = null;

// current unit selector
let activeBannerShowUnit = null;
system.canvas.addEventListener("mousemove", (event) => {
  let unit = system.getUnitByCoord(event.clientX, event.clientY);

  if (unit === activeBannerShowUnit) {
    return;
  }

  if (unit !== undefined && unit.type === "banner") {
    return;
  }

  if (activeBannerShowUnit !== null) {
    activeBannerShowUnit.banner.show = false;
    activeBannerShowUnit = null;
  }

  if (unit !== undefined && unit.type === "node") {
    unit.banner.show = true;
    activeBannerShowUnit = unit;
  }
});

// unit name shower
system.canvas.addEventListener("mousedown", (event) => {
  if ((event.buttons & 1) !== 1 || event.ctrlKey) {
    return;
  }

  let unit = system.getUnitByCoord(event.clientX, event.clientY);

  nodeInputParameters.nodeURI.innerText = "";
  nodeInputParameters.nodeName.value = "";
  nodeInputParameters.skyspherePath.value = "";

  activeContentShowNode = null;
  activeContentShowConnection = null;
  doMoveNode = false;

  if (unit === undefined) {
    return;
  }

  if (unit.type === "node") {
    nodeParameters.removeAttribute("hidden");
    connectionParameters.setAttribute("hidden", "");

    nodeInputParameters.nodeURI.innerText = unit.nodeURI.toStr();
    nodeInputParameters.nodeName.value = unit.name;
    nodeInputParameters.skyspherePath.value = unit.skysphere.path;

    activeContentShowNode = unit;
    if (event.shiftKey) {
      doMoveNode = true;
    }
  } else if (unit.type === "connection") {
    connectionInputParameters.nodesURI.innerText = `${unit.first.nodeURI.toStr()} - ${unit.second.nodeURI.toStr()}`;

    nodeParameters.setAttribute("hidden", "");
    connectionParameters.removeAttribute("hidden");

    activeContentShowConnection = unit;
  } else {
    nodeParameters.setAttribute("hidden", "");
    connectionParameters.setAttribute("hidden", "");
  }
}); /* event system.canvas:"mousedown" */


system.canvas.addEventListener("mouseup", (event) => {
  doMoveNode = false;
}); /* event system.canvas:"mouseup" */

// node movement handler
system.canvas.addEventListener("mousemove", (event) => {
  if (activeContentShowNode !== null && doMoveNode) {
    let position = system.getPositionByCoord(event.clientX, event.clientY);

    if (position.x !== position.y && position.y !== position.z) {
      activeContentShowNode.pos = position;
    } else {
      doMoveNode = false;
    }
  }
}); /* event system.canvas:"mousemove" */

nodeInputParameters.nodeName.addEventListener("change", () => {
  if (activeContentShowNode !== null) {
    activeContentShowNode.name = nodeInputParameters.nodeName.value;
  }
}); /* event nodeInputParameters.nodeName:"change" */

nodeInputParameters.skyspherePath.addEventListener("change", () => {
  if (activeContentShowNode !== null) {
    activeContentShowNode.skysphere.path = nodeInputParameters.skyspherePath.value;
  }
}); /* event nodeInputParameters.skyspherePath:"change" */

nodeInputParameters.makeDefault.addEventListener("click", () => {
  if (activeContentShowNode !== null) {
    server.setDefNodeURI(activeContentShowNode.nodeURI).then(() => {console.log(`new default node: ${activeContentShowNode.name}`);});
  }
}); /* event nodeInputParameters.makeDefault:"click" */

nodeInputParameters.deleteNode.addEventListener("click", () => {
  if (activeContentShowNode !== null) {
    destroyNode(activeContentShowNode);
    activeContentShowNode = null;
  }
}); /* event nodeInputParameters.deleteNode:"click" */

connectionInputParameters.deleteConnection.addEventListener("click", () => {
  if (activeContentShowConnection !== null) {
    destroyConnection(activeContentShowConnection);
    activeContentShowConnection = null;
  }
}); /* event connectionInputParameters.deleteConnection:"click" */

// preview mode redirecting button
document.getElementById("toPreview").addEventListener("click", () => {
  window.location.href = "./viewer.html";
}); /* event document.getElementById("preview"):"click" */

// start system
system.run();

/* main.js */

export { Connection, URI };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yX2J1bmRsZS5qcyIsInNvdXJjZXMiOlsic3JjL3N5c3RlbS9zaGFkZXIuanMiLCJzcmMvc3lzdGVtL210aC5qcyIsInNyYy9zeXN0ZW0vdGV4dHVyZS5qcyIsInNyYy9zeXN0ZW0vdWJvLmpzIiwic3JjL3N5c3RlbS9tYXRlcmlhbC5qcyIsInNyYy9zeXN0ZW0vcHJpbWl0aXZlLmpzIiwic3JjL3N5c3RlbS90YXJnZXQuanMiLCJzcmMvc3lzdGVtL3RpbWVyLmpzIiwic3JjL3N5c3RlbS9zeXN0ZW0uanMiLCJzcmMvY2FtZXJhX2NvbnRyb2xsZXIuanMiLCJzcmMvYmFubmVyLmpzIiwic3JjL3NreXNwaGVyZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9jb21tb25zLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2VuY29kZVBhY2tldC5icm93c2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2NvbnRyaWIvYmFzZTY0LWFycmF5YnVmZmVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2RlY29kZVBhY2tldC5icm93c2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL0Bzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXIvaW5kZXgubWpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL2dsb2JhbFRoaXMuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS91dGlsLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL2NvbnRyaWIvcGFyc2Vxcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnQuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi95ZWFzdC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9jb250cmliL2hhcy1jb3JzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMveG1saHR0cHJlcXVlc3QuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3BvbGxpbmcuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy93ZWJzb2NrZXQtY29uc3RydWN0b3IuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3dlYnNvY2tldC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3dlYnRyYW5zcG9ydC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL2NvbnRyaWIvcGFyc2V1cmkuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vc29ja2V0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1jbGllbnQvYnVpbGQvZXNtL3VybC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tcGFyc2VyL2J1aWxkL2VzbS9pcy1iaW5hcnkuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLXBhcnNlci9idWlsZC9lc20vYmluYXJ5LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1wYXJzZXIvYnVpbGQvZXNtL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1jbGllbnQvYnVpbGQvZXNtL29uLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1jbGllbnQvYnVpbGQvZXNtL3NvY2tldC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9jb250cmliL2JhY2tvMi5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9tYW5hZ2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1jbGllbnQvYnVpbGQvZXNtL2luZGV4LmpzIiwic3JjL25vZGVzLmpzIiwic3JjL2VkaXRvcl9tYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIHNoYWRlck1vZHVsZUZyb21Tb3VyY2UoZ2wsIHR5cGUsIHNvdXJjZSkge1xyXG4gIGlmIChzb3VyY2UgPT0gbnVsbCkge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICBsZXQgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpO1xyXG5cclxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xyXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuXHJcbiAgbGV0IHJlcyA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKTtcclxuICBpZiAocmVzICE9IG51bGwgJiYgcmVzLmxlbmd0aCA+IDApXHJcbiAgICBjb25zb2xlLmVycm9yKGBTaGFkZXIgbW9kdWxlIGNvbXBpbGF0aW9uIGVycm9yOiAke3Jlc31gKTtcclxuXHJcbiAgcmV0dXJuIHNoYWRlcjtcclxufSAvKiBzaGFkZXJNb2R1bGVGcm9tU291cmNlICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hhZGVyRnJvbVNvdXJjZShnbCwgdmVydFNvdXJjZSwgZnJhZ1NvdXJjZSkge1xyXG4gIGxldCBtb2R1bGVzID0gW1xyXG4gICAgc2hhZGVyTW9kdWxlRnJvbVNvdXJjZShnbCwgZ2wuVkVSVEVYX1NIQURFUiwgdmVydFNvdXJjZSksXHJcbiAgICBzaGFkZXJNb2R1bGVGcm9tU291cmNlKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIGZyYWdTb3VyY2UpLFxyXG4gIF07XHJcbiAgbGV0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbW9kdWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgaWYgKG1vZHVsZXNbaV0gIT0gbnVsbCkge1xyXG4gICAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgbW9kdWxlc1tpXSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcclxuXHJcbiAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSlcclxuICAgIGNvbnNvbGUuZXJyb3IoYFNoYWRlciBsaW5raW5nIGVycm9yOiAke2dsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pfWApO1xyXG5cclxuICByZXR1cm4gcHJvZ3JhbTtcclxufSAvKiBzaGFkZXJGcm9tU291cmNlICovXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFNoYWRlcihnbCwgcGF0aCkge1xyXG4gIHJldHVybiBzaGFkZXJGcm9tU291cmNlKGdsLFxyXG4gICAgYXdhaXQgZmV0Y2gocGF0aCArIFwiLnZlcnQ/XCIgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkpLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2Uub2sgPyByZXNwb25zZS50ZXh0KCkgOiBudWxsKSxcclxuICAgIGF3YWl0IGZldGNoKHBhdGggKyBcIi5mcmFnP1wiICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygpKS50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLm9rID8gcmVzcG9uc2UudGV4dCgpIDogbnVsbCksXHJcbiAgKTtcclxufSAvKiBsb2FkU2hhZGVyICovIiwiZXhwb3J0IGNsYXNzIFZlYzMge1xyXG4gIHg7XHJcbiAgeTtcclxuICB6O1xyXG5cclxuICBjb25zdHJ1Y3RvcihueCwgbnksIG56KSB7XHJcbiAgICB0aGlzLnggPSBueDtcclxuICAgIHRoaXMueSA9IG55O1xyXG4gICAgdGhpcy56ID0gbno7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBjb3B5KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMzKHRoaXMueCwgdGhpcy55LCB0aGlzLnopO1xyXG4gIH0gLyogY29weSAqL1xyXG5cclxuICBhZGQobTIpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyh0aGlzLnggKyBtMi54LCB0aGlzLnkgKyBtMi55LCB0aGlzLnogKyBtMi56KTtcclxuICB9IC8qIGFkZCAqL1xyXG5cclxuICBzdWIobTIpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyh0aGlzLnggLSBtMi54LCB0aGlzLnkgLSBtMi55LCB0aGlzLnogLSBtMi56KTtcclxuICB9IC8qIHN1YiAqL1xyXG5cclxuICBtdWwobTIpIHtcclxuICAgIGlmICh0eXBlb2YobTIpID09IFwiVmVjM1wiKVxyXG4gICAgICByZXR1cm4gbmV3IFZlYzModGhpcy54ICogbTIueCwgdGhpcy55ICogbTIueSwgdGhpcy56ICogbTIueik7XHJcbiAgICBlbHNlXHJcbiAgICAgIHJldHVybiBuZXcgVmVjMyh0aGlzLnggKiBtMiwgICB0aGlzLnkgKiBtMiwgICB0aGlzLnogKiBtMiAgKTtcclxuICB9IC8qIG11bCAqL1xyXG5cclxuICBsZW5ndGgoKSB7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueik7XHJcbiAgfSAvKiBsZW5ndGggKi9cclxuXHJcbiAgZGlzdGFuY2UobTIpIHtcclxuICAgIGxldFxyXG4gICAgICBkeCA9IHRoaXMueCAtIG0yLngsXHJcbiAgICAgIGR5ID0gdGhpcy55IC0gbTIueSxcclxuICAgICAgZHogPSB0aGlzLnogLSBtMi56O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHopO1xyXG4gIH0gLyogZGlzdGFuY2UgKi9cclxuXHJcbiAgZG90KG0yKSB7XHJcbiAgICByZXR1cm4gdGhpcy54ICogbTIueCArIHRoaXMueSAqIG0yLnkgKyB0aGlzLnogKiBtMi56O1xyXG4gIH0gLyogZG90ICovXHJcblxyXG4gIGNyb3NzKG90aHYpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyhcclxuICAgICAgdGhpcy55ICogb3Rodi56IC0gb3Rodi55ICogdGhpcy56LFxyXG4gICAgICB0aGlzLnogKiBvdGh2LnggLSBvdGh2LnogKiB0aGlzLngsXHJcbiAgICAgIHRoaXMueCAqIG90aHYueSAtIG90aHYueCAqIHRoaXMueVxyXG4gICAgKTtcclxuICB9IC8qIGNyb3NzICovXHJcblxyXG4gIG5vcm1hbGl6ZSgpIHtcclxuICAgIGxldCBsZW4gPSB0aGlzLmxlbmd0aCgpO1xyXG5cclxuICAgIHJldHVybiBuZXcgVmVjMyh0aGlzLnggLyBsZW4sIHRoaXMueSAvIGxlbiwgdGhpcy56IC8gbGVuKTtcclxuICB9IC8qIG5vcm1hbGl6ZSAqL1xyXG5cclxuICBzdGF0aWMgZnJvbVNwaGVyaWNhbChhemltdXRoLCBlbGV2YXRpb24sIHJhZGl1cyA9IDEpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyhcclxuICAgICAgcmFkaXVzICogTWF0aC5zaW4oZWxldmF0aW9uKSAqIE1hdGguY29zKGF6aW11dGgpLFxyXG4gICAgICByYWRpdXMgKiBNYXRoLmNvcyhlbGV2YXRpb24pLFxyXG4gICAgICByYWRpdXMgKiBNYXRoLnNpbihlbGV2YXRpb24pICogTWF0aC5zaW4oYXppbXV0aClcclxuICAgICk7XHJcbiAgfSAvKiBzcGhlcmljYWxUb0NhcnRlc2lhbiAqL1xyXG5cclxuICBzdGF0aWMgZnJvbU9iamVjdChvYmplY3QpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyhvYmplY3QueCwgb2JqZWN0LnksIG9iamVjdC56KTtcclxuICB9IC8qIGZyb21PYmplY3QgKi9cclxufSAvKiBWZWMzICovXHJcblxyXG5leHBvcnQgY2xhc3MgVmVjMiB7XHJcbiAgeDtcclxuICB5O1xyXG5cclxuICBjb25zdHJ1Y3RvcihueCwgbnkpIHtcclxuICAgIHRoaXMueCA9IG54O1xyXG4gICAgdGhpcy55ID0gbnk7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBjb3B5KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMyKCk7XHJcbiAgfVxyXG5cclxuICBhZGQobTIpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKyBtMi54LCB0aGlzLnkgKyBtMi55KTtcclxuICB9IC8qIGFkZCAqL1xyXG5cclxuICBzdWIobTIpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggLSBtMi54LCB0aGlzLnkgLSBtMi55KTtcclxuICB9IC8qIHN1YiAqL1xyXG5cclxuICBtdWwobTIpIHtcclxuICAgIGlmICh0eXBlb2YobTIpID09IFwiVmVjMlwiKVxyXG4gICAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54ICogbTIueCwgdGhpcy55ICogbTIueSk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKiBtMiwgICB0aGlzLnkgKiBtMik7XHJcbiAgfSAvKiBtdWwgKi9cclxuXHJcbiAgbGVuZ3RoMigpIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzO3lcclxuICB9IC8qIGxlbmd0aDIgKi9cclxuXHJcbiAgbGVuZ3RoKCkge1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xyXG4gIH0gLyogbGVuZ3RoICovXHJcblxyXG4gIGRvdChtMikge1xyXG4gICAgcmV0dXJuIHRoaXMueCAqIG0yLnggKyB0aGlzLnkgKiBtMi55O1xyXG4gIH0gLyogZG90ICovXHJcblxyXG4gIGNyb3NzKG90aHYpIHtcclxuICAgIHJldHVybiB0aGlzLnggKiBvdGh2LnkgLSBvdGh2LnggKiB0aGlzLnk7XHJcbiAgfSAvKiBjcm9zcyAqL1xyXG5cclxuICBub3JtYWxpemUoKSB7XHJcbiAgICBsZXQgbGVuID0gdGhpcy5sZW5ndGgoKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54IC8gbGVuLCB0aGlzLnkgLyBsZW4pO1xyXG4gIH0gLyogbm9ybWFsaXplICovXHJcblxyXG4gIG5lZygpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMigtdGhpcy54LCAtdGhpcy55KTtcclxuICB9IC8qIG5lZyAqL1xyXG5cclxuICBsZWZ0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMyKC10aGlzLnksIHRoaXMueCk7XHJcbiAgfSAvKiByaWdodCAqL1xyXG5cclxuICByaWdodCgpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnksIC10aGlzLngpO1xyXG4gIH0gLyogcmlnaHQgKi9cclxufSAvKiBWZWMyICovXHJcblxyXG5leHBvcnQgY2xhc3MgU2l6ZSB7XHJcbiAgdztcclxuICBoO1xyXG5cclxuICBjb25zdHJ1Y3Rvcih3LCBoKSB7XHJcbiAgICB0aGlzLncgPSB3O1xyXG4gICAgdGhpcy5oID0gaDtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIGNvcHkoKSB7XHJcbiAgICByZXR1cm4gbmV3IFNpemUodGhpcy53LCB0aGlzLmgpO1xyXG4gIH0gLyogY29weSAqL1xyXG59IC8qIFNpemUgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBNYXQ0IHtcclxuICBtO1xyXG5cclxuICBjb25zdHJ1Y3Rvcih2MDAsIHYwMSwgdjAyLCB2MDMsXHJcbiAgICAgICAgICAgICAgdjEwLCB2MTEsIHYxMiwgdjEzLFxyXG4gICAgICAgICAgICAgIHYyMCwgdjIxLCB2MjIsIHYyMyxcclxuICAgICAgICAgICAgICB2MzAsIHYzMSwgdjMyLCB2MzMpIHtcclxuICAgIHRoaXMubSA9IFtcclxuICAgICAgdjAwLCB2MDEsIHYwMiwgdjAzLFxyXG4gICAgICB2MTAsIHYxMSwgdjEyLCB2MTMsXHJcbiAgICAgIHYyMCwgdjIxLCB2MjIsIHYyMyxcclxuICAgICAgdjMwLCB2MzEsIHYzMiwgdjMzXHJcbiAgICBdO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgY29weSgpIHtcclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgdGhpcy5tWyAwXSwgdGhpcy5tWyAxXSwgdGhpcy5tWyAyXSwgdGhpcy5tWyAzXSxcclxuICAgICAgdGhpcy5tWyA0XSwgdGhpcy5tWyA1XSwgdGhpcy5tWyA2XSwgdGhpcy5tWyA3XSxcclxuICAgICAgdGhpcy5tWyA4XSwgdGhpcy5tWyA5XSwgdGhpcy5tWzEwXSwgdGhpcy5tWzExXSxcclxuICAgICAgdGhpcy5tWzEyXSwgdGhpcy5tWzEzXSwgdGhpcy5tWzE0XSwgdGhpcy5tWzE1XSxcclxuICAgICk7XHJcbiAgfSAvKiBjb3B5ICovXHJcblxyXG4gIHRyYW5zZm9ybVBvaW50KHYpXHJcbiAge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMzKFxyXG4gICAgICB2LnggKiB0aGlzLm1bIDBdICsgdi55ICogdGhpcy5tWyA0XSArIHYueiAqIHRoaXMubVsgOF0gKyB0aGlzLm1bMTJdLFxyXG4gICAgICB2LnggKiB0aGlzLm1bIDFdICsgdi55ICogdGhpcy5tWyA1XSArIHYueiAqIHRoaXMubVsgOV0gKyB0aGlzLm1bMTNdLFxyXG4gICAgICB2LnggKiB0aGlzLm1bIDJdICsgdi55ICogdGhpcy5tWyA2XSArIHYueiAqIHRoaXMubVsxMF0gKyB0aGlzLm1bMTRdXHJcbiAgICApO1xyXG4gIH0gLyogdHJhbnNmb3JtUG9pbnQgKi9cclxuXHJcbiAgdHJhbnNmb3JtNHg0KHYpXHJcbiAge1xyXG4gICAgbGV0IHcgPSB2LnggKiB0aGlzLm1bM10gKyB2LnkgKiB0aGlzLm1bN10gKyB2LnogKiB0aGlzLm1bMTFdICsgdGhpcy5tWzE1XTtcclxuICBcclxuICAgIHJldHVybiBuZXcgVmVjMyhcclxuICAgICAgKHYueCAqIHRoaXMubVsgMF0gKyB2LnkgKiB0aGlzLm1bIDRdICsgdi56ICogdGhpcy5tWyA4XSArIHRoaXMubVsxMl0pIC8gdyxcclxuICAgICAgKHYueCAqIHRoaXMubVsgMV0gKyB2LnkgKiB0aGlzLm1bIDVdICsgdi56ICogdGhpcy5tWyA5XSArIHRoaXMubVsxM10pIC8gdyxcclxuICAgICAgKHYueCAqIHRoaXMubVsgMl0gKyB2LnkgKiB0aGlzLm1bIDZdICsgdi56ICogdGhpcy5tWzEwXSArIHRoaXMubVsxNF0pIC8gd1xyXG4gICAgKTtcclxuICB9IC8qIHRyYW5zZm9ybTR4NCAqL1xyXG5cclxuICB0cmFuc3Bvc2UoKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHRoaXMubVsgMF0sIHRoaXMubVsgNF0sIHRoaXMubVsgOF0sIHRoaXMubVsxMl0sXHJcbiAgICAgIHRoaXMubVsgMV0sIHRoaXMubVsgNV0sIHRoaXMubVsgOV0sIHRoaXMubVsxM10sXHJcbiAgICAgIHRoaXMubVsgMl0sIHRoaXMubVsgNl0sIHRoaXMubVsxMF0sIHRoaXMubVsxNF0sXHJcbiAgICAgIHRoaXMubVsgM10sIHRoaXMubVsgN10sIHRoaXMubVsxMV0sIHRoaXMubVsxNV1cclxuICAgICk7XHJcbiAgfSAvKiB0cmFuc3Bvc2UgKi9cclxuXHJcbiAgbXVsKG0yKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHRoaXMubVsgMF0gKiBtMi5tWyAwXSArIHRoaXMubVsgMV0gKiBtMi5tWyA0XSArIHRoaXMubVsgMl0gKiBtMi5tWyA4XSArIHRoaXMubVsgM10gKiBtMi5tWzEyXSxcclxuICAgICAgdGhpcy5tWyAwXSAqIG0yLm1bIDFdICsgdGhpcy5tWyAxXSAqIG0yLm1bIDVdICsgdGhpcy5tWyAyXSAqIG0yLm1bIDldICsgdGhpcy5tWyAzXSAqIG0yLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bIDBdICogbTIubVsgMl0gKyB0aGlzLm1bIDFdICogbTIubVsgNl0gKyB0aGlzLm1bIDJdICogbTIubVsxMF0gKyB0aGlzLm1bIDNdICogbTIubVsxNF0sXHJcbiAgICAgIHRoaXMubVsgMF0gKiBtMi5tWyAzXSArIHRoaXMubVsgMV0gKiBtMi5tWyA3XSArIHRoaXMubVsgMl0gKiBtMi5tWzExXSArIHRoaXMubVsgM10gKiBtMi5tWzE1XSxcclxuXHJcbiAgICAgIHRoaXMubVsgNF0gKiBtMi5tWyAwXSArIHRoaXMubVsgNV0gKiBtMi5tWyA0XSArIHRoaXMubVsgNl0gKiBtMi5tWyA4XSArIHRoaXMubVsgN10gKiBtMi5tWzEyXSxcclxuICAgICAgdGhpcy5tWyA0XSAqIG0yLm1bIDFdICsgdGhpcy5tWyA1XSAqIG0yLm1bIDVdICsgdGhpcy5tWyA2XSAqIG0yLm1bIDldICsgdGhpcy5tWyA3XSAqIG0yLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bIDRdICogbTIubVsgMl0gKyB0aGlzLm1bIDVdICogbTIubVsgNl0gKyB0aGlzLm1bIDZdICogbTIubVsxMF0gKyB0aGlzLm1bIDddICogbTIubVsxNF0sXHJcbiAgICAgIHRoaXMubVsgNF0gKiBtMi5tWyAzXSArIHRoaXMubVsgNV0gKiBtMi5tWyA3XSArIHRoaXMubVsgNl0gKiBtMi5tWzExXSArIHRoaXMubVsgN10gKiBtMi5tWzE1XSxcclxuXHJcbiAgICAgIHRoaXMubVsgOF0gKiBtMi5tWyAwXSArIHRoaXMubVsgOV0gKiBtMi5tWyA0XSArIHRoaXMubVsxMF0gKiBtMi5tWyA4XSArIHRoaXMubVsxMV0gKiBtMi5tWzEyXSxcclxuICAgICAgdGhpcy5tWyA4XSAqIG0yLm1bIDFdICsgdGhpcy5tWyA5XSAqIG0yLm1bIDVdICsgdGhpcy5tWzEwXSAqIG0yLm1bIDldICsgdGhpcy5tWzExXSAqIG0yLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bIDhdICogbTIubVsgMl0gKyB0aGlzLm1bIDldICogbTIubVsgNl0gKyB0aGlzLm1bMTBdICogbTIubVsxMF0gKyB0aGlzLm1bMTFdICogbTIubVsxNF0sXHJcbiAgICAgIHRoaXMubVsgOF0gKiBtMi5tWyAzXSArIHRoaXMubVsgOV0gKiBtMi5tWyA3XSArIHRoaXMubVsxMF0gKiBtMi5tWzExXSArIHRoaXMubVsxMV0gKiBtMi5tWzE1XSxcclxuXHJcbiAgICAgIHRoaXMubVsxMl0gKiBtMi5tWyAwXSArIHRoaXMubVsxM10gKiBtMi5tWyA0XSArIHRoaXMubVsxNF0gKiBtMi5tWyA4XSArIHRoaXMubVsxNV0gKiBtMi5tWzEyXSxcclxuICAgICAgdGhpcy5tWzEyXSAqIG0yLm1bIDFdICsgdGhpcy5tWzEzXSAqIG0yLm1bIDVdICsgdGhpcy5tWzE0XSAqIG0yLm1bIDldICsgdGhpcy5tWzE1XSAqIG0yLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bMTJdICogbTIubVsgMl0gKyB0aGlzLm1bMTNdICogbTIubVsgNl0gKyB0aGlzLm1bMTRdICogbTIubVsxMF0gKyB0aGlzLm1bMTVdICogbTIubVsxNF0sXHJcbiAgICAgIHRoaXMubVsxMl0gKiBtMi5tWyAzXSArIHRoaXMubVsxM10gKiBtMi5tWyA3XSArIHRoaXMubVsxNF0gKiBtMi5tWzExXSArIHRoaXMubVsxNV0gKiBtMi5tWzE1XSxcclxuICAgICk7XHJcbiAgfSAvKiBtdWwgKi9cclxuXHJcbiAgc3RhdGljIGlkZW50aXR5KCkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICAxLCAwLCAwLCAwLFxyXG4gICAgICAwLCAxLCAwLCAwLFxyXG4gICAgICAwLCAwLCAxLCAwLFxyXG4gICAgICAwLCAwLCAwLCAxXHJcbiAgICApO1xyXG4gIH0gLyogaWRlbnRpdHkgKi9cclxuXHJcbiAgc3RhdGljIHNjYWxlKHMpIHtcclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgcy54LCAwLCAgIDAsICAgMCxcclxuICAgICAgMCwgICBzLnksIDAsICAgMCxcclxuICAgICAgMCwgICAwLCAgIHMueiwgMCxcclxuICAgICAgMCwgICAwLCAgIDAsICAgMVxyXG4gICAgKTtcclxuICB9IC8qIHNjYWxlICovXHJcblxyXG4gIHN0YXRpYyB0cmFuc2xhdGUodCkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICAxLCAgIDAsICAgMCwgICAwLFxyXG4gICAgICAwLCAgIDEsICAgMCwgICAwLFxyXG4gICAgICAwLCAgIDAsICAgMSwgICAwLFxyXG4gICAgICB0LngsIHQueSwgdC56LCAxXHJcbiAgICApO1xyXG4gIH0gLyogdHJhbnNsYXRlICovXHJcblxyXG4gIHN0YXRpYyByb3RhdGVYKGFuZ2xlKSB7XHJcbiAgICBsZXQgcyA9IE1hdGguc2luKGFuZ2xlKSwgYyA9IE1hdGguY29zKGFuZ2xlKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIDEsIDAsIDAsIDAsXHJcbiAgICAgIDAsIGMsIHMsIDAsXHJcbiAgICAgIDAsLXMsIGMsIDAsXHJcbiAgICAgIDAsIDAsIDAsIDFcclxuICAgICk7XHJcbiAgfSAvKiByb3RhdGVYICovXHJcblxyXG4gIHN0YXRpYyByb3RhdGVZKGFuZ2xlKSB7XHJcbiAgICBsZXQgcyA9IE1hdGguc2luKGFuZ2xlKSwgYyA9IE1hdGguY29zKGFuZ2xlKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIGMsIDAsLXMsIDAsXHJcbiAgICAgIDAsIDEsIDAsIDAsXHJcbiAgICAgIHMsIDAsIGMsIDAsXHJcbiAgICAgIDAsIDAsIDAsIDFcclxuICAgICk7XHJcbiAgfSAvKiByb3RhdGVZICovXHJcblxyXG4gIHN0YXRpYyByb3RhdGVaKGFuZ2xlKSB7XHJcbiAgICBsZXQgcyA9IE1hdGguc2luKGFuZ2xlKSwgYyA9IE1hdGguY29zKGFuZ2xlKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIGMsIHMsIDAsIDAsXHJcbiAgICAgLXMsIGMsIDAsIDAsXHJcbiAgICAgIDAsIDAsIDEsIDAsXHJcbiAgICAgIDAsIDAsIDAsIDFcclxuICAgICk7XHJcbiAgfSAvKiByb3RhdGVaICovXHJcblxyXG4gIHN0YXRpYyByb3RhdGUoYW5nbGUsIGF4aXMpIHtcclxuICAgIGxldCB2ID0gYXhpcy5ub3JtYWxpemUoKTtcclxuICAgIGxldCBzID0gTWF0aC5zaW4oYW5nbGUpLCBjID0gTWF0aC5jb3MoYW5nbGUpO1xyXG5cclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgdi54ICogdi54ICogKDEgLSBjKSArIGMsICAgICAgICAgdi54ICogdi55ICogKDEgLSBjKSAtIHYueiAqIHMsICAgdi54ICogdi56ICogKDEgLSBjKSArIHYueSAqIHMsICAgMCxcclxuICAgICAgdi55ICogdi54ICogKDEgLSBjKSArIHYueiAqIHMsICAgdi55ICogdi55ICogKDEgLSBjKSArIGMsICAgICAgICAgdi55ICogdi56ICogKDEgLSBjKSAtIHYueCAqIHMsICAgMCxcclxuICAgICAgdi56ICogdi54ICogKDEgLSBjKSAtIHYueSAqIHMsICAgdi56ICogdi55ICogKDEgLSBjKSArIHYueCAqIHMsICAgdi56ICogdi56ICogKDEgLSBjKSArIGMsICAgICAgICAgMCxcclxuICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMVxyXG4gICAgKTtcclxuICB9IC8qIHJvdGF0ZSAqL1xyXG5cclxuICBzdGF0aWMgdmlldyhsb2MsIGF0LCB1cCkge1xyXG4gICAgbGV0XHJcbiAgICAgIGRpciA9IGF0LnN1Yihsb2MpLm5vcm1hbGl6ZSgpLFxyXG4gICAgICByZ2ggPSBkaXIuY3Jvc3ModXApLm5vcm1hbGl6ZSgpLFxyXG4gICAgICB0dXAgPSByZ2guY3Jvc3MoZGlyKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHJnaC54LCAgICAgICAgIHR1cC54LCAgICAgICAgIC1kaXIueCwgICAgICAgMCxcclxuICAgICAgcmdoLnksICAgICAgICAgdHVwLnksICAgICAgICAgLWRpci55LCAgICAgICAwLFxyXG4gICAgICByZ2gueiwgICAgICAgICB0dXAueiwgICAgICAgICAtZGlyLnosICAgICAgIDAsXHJcbiAgICAgIC1sb2MuZG90KHJnaCksIC1sb2MuZG90KHR1cCksIGxvYy5kb3QoZGlyKSwgMVxyXG4gICAgKTtcclxuICB9IC8qIHZpZXcgKi9cclxuXHJcbiAgc3RhdGljIGZydXN0dW0obGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgMiAqIG5lYXIgLyAocmlnaHQgLSBsZWZ0KSwgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLFxyXG4gICAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyICogbmVhciAvICh0b3AgLSBib3R0b20pLCAgICAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXHJcbiAgICAgIChyaWdodCArIGxlZnQpIC8gKHJpZ2h0IC0gbGVmdCksICh0b3AgKyBib3R0b20pIC8gKHRvcCAtIGJvdHRvbSksIChuZWFyICsgZmFyKSAvIChuZWFyIC0gZmFyKSwgICAtMSxcclxuICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMiAqIG5lYXIgKiBmYXIgLyAobmVhciAtIGZhciksICAwXHJcbiAgICApO1xyXG4gIH0gLyogZnJ1c3R1bSAqL1xyXG59IC8qIE1hdDQgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBDYW1lcmEge1xyXG4gIC8vIGNhbWVyYSBwcm9qZWN0aW9uIHNoYXBlIHBhcmFtc1xyXG4gIHByb2pTaXplID0gbmV3IFNpemUoMC4wMSwgMC4wMSk7XHJcbiAgY29ycmVjdGVkUHJvalNpemUgPSBuZXcgU2l6ZSgwLjAxLCAwLjAxKTtcclxuICBuZWFyID0gMC4wMTtcclxuICBmYXIgPSA4MTkyO1xyXG5cclxuICAvLyBjdXJyZW50IHNjcmVlbiByZXNvbHV0aW9uXHJcbiAgc2NyZWVuU2l6ZTtcclxuXHJcbiAgLy8gY2FtZXJhIGxvY2F0aW9uXHJcbiAgbG9jO1xyXG4gIGF0O1xyXG4gIGRpcjtcclxuICB1cDtcclxuICByaWdodDtcclxuXHJcbiAgLy8gY2FtZXJhIHByb2plY3Rpb24gbWF0cmljZXNcclxuICB2aWV3O1xyXG4gIHByb2o7XHJcbiAgdmlld1Byb2o7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5wcm9qID0gTWF0NC5pZGVudGl0eSgpO1xyXG4gICAgdGhpcy5zZXQobmV3IFZlYzMoMCwgMCwgLTEpLCBuZXcgVmVjMygwLCAwLCAwKSwgbmV3IFZlYzMoMCwgMSwgMCkpO1xyXG4gICAgdGhpcy5yZXNpemUobmV3IFNpemUoMzAsIDMwKSk7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBwcm9qU2V0KG5ld05lYXIsIG5ld0ZhciwgbmV3UHJvalNpemUpIHtcclxuICAgIHRoaXMucHJvalNpemUgPSBuZXdQcm9qU2l6ZS5jb3B5KCk7XHJcbiAgICB0aGlzLm5lYXIgPSBuZXdOZWFyO1xyXG4gICAgdGhpcy5mYXIgPSBuZXdGYXI7XHJcbiAgICB0aGlzLmNvcnJlY3RlZFByb2pTaXplID0gdGhpcy5wcm9qU2l6ZS5jb3B5KCk7XHJcblxyXG4gICAgaWYgKHRoaXMuc2NyZWVuU2l6ZS53ID4gdGhpcy5zY3JlZW5TaXplLmgpIHtcclxuICAgICAgdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS53ICo9IHRoaXMuc2NyZWVuU2l6ZS53IC8gdGhpcy5zY3JlZW5TaXplLmg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmNvcnJlY3RlZFByb2pTaXplLmggKj0gdGhpcy5zY3JlZW5TaXplLmggLyB0aGlzLnNjcmVlblNpemUudztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnByb2ogPSBNYXQ0LmZydXN0dW0oXHJcbiAgICAgIC10aGlzLmNvcnJlY3RlZFByb2pTaXplLncgLyAyLCB0aGlzLmNvcnJlY3RlZFByb2pTaXplLncgLyAyLFxyXG4gICAgICAtdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS5oIC8gMiwgdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS5oIC8gMixcclxuICAgICAgdGhpcy5uZWFyLCB0aGlzLmZhclxyXG4gICAgKTtcclxuICAgIHRoaXMudmlld1Byb2ogPSB0aGlzLnZpZXcubXVsKHRoaXMucHJvaik7XHJcbiAgfSAvKiBwcm9qU2V0ICovXHJcblxyXG4gIHJlc2l6ZShuZXdTY3JlZW5TaXplKSB7XHJcbiAgICB0aGlzLnNjcmVlblNpemUgPSBuZXdTY3JlZW5TaXplLmNvcHkoKTtcclxuICAgIHRoaXMucHJvalNldCh0aGlzLm5lYXIsIHRoaXMuZmFyLCB0aGlzLnByb2pTaXplKTtcclxuICB9IC8qIHJlc2l6ZSAqL1xyXG5cclxuICBzZXQobG9jLCBhdCwgdXApIHtcclxuICAgIHRoaXMudmlldyA9IE1hdDQudmlldyhsb2MsIGF0LCB1cCk7XHJcbiAgICB0aGlzLnZpZXdQcm9qID0gdGhpcy52aWV3Lm11bCh0aGlzLnByb2opO1xyXG5cclxuICAgIHRoaXMubG9jID0gbG9jLmNvcHkoKTtcclxuICAgIHRoaXMuYXQgPSBhdC5jb3B5KCk7XHJcblxyXG4gICAgdGhpcy5yaWdodCA9IG5ldyBWZWMzKHRoaXMudmlldy5tWyAwXSwgdGhpcy52aWV3Lm1bIDRdLCB0aGlzLnZpZXcubVsgOF0pO1xyXG4gICAgdGhpcy51cCAgICA9IG5ldyBWZWMzKHRoaXMudmlldy5tWyAxXSwgdGhpcy52aWV3Lm1bIDVdLCB0aGlzLnZpZXcubVsgOV0pO1xyXG4gICAgdGhpcy5kaXIgICA9IG5ldyBWZWMzKHRoaXMudmlldy5tWyAyXSwgdGhpcy52aWV3Lm1bIDZdLCB0aGlzLnZpZXcubVsxMF0pLm11bCgtMSk7XHJcbiAgfSAvKiBzZXQgKi9cclxufSAvKiBDYW1lcmEgKi8iLCJpbXBvcnQgKiBhcyBtdGggZnJvbSBcIi4vbXRoLmpzXCI7XHJcblxyXG4vKiBmb3JtYXQgZGVjb2RpbmcgZnVuY3Rpb24gKi9cclxuZnVuY3Rpb24gZ2V0Rm9ybWF0KGNvbXBvbmVudFR5cGUsIGNvbXBvbmVudENvdW50KSB7XHJcbiAgY29uc3QgZm10cyA9IFtXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlJFRCwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SRywgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SR0IsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCQV07XHJcbiAgc3dpdGNoIChjb21wb25lbnRUeXBlKSB7XHJcbiAgICBjYXNlIFRleHR1cmUuRkxPQVQ6XHJcbiAgICAgIGNvbnN0IGZsb2F0SW50ZXJuYWxzID0gW1dlYkdMMlJlbmRlcmluZ0NvbnRleHQuUjMyRiwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SRzMyRiwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SR0IzMkYsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCQTMyRl07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybWF0OiBmbXRzW2NvbXBvbmVudENvdW50IC0gMV0sXHJcbiAgICAgICAgaW50ZXJuYWw6IGZsb2F0SW50ZXJuYWxzW2NvbXBvbmVudENvdW50IC0gMV0sXHJcbiAgICAgICAgY29tcG9uZW50VHlwZTogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5GTE9BVCxcclxuICAgICAgfTtcclxuXHJcbiAgICBjYXNlIFRleHR1cmUuVU5TSUdORURfQllURTpcclxuICAgICAgY29uc3QgYnl0ZUludGVybmFscyA9IFtXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlI4LCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlJHOCwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SR0I4LCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlJHQkE4XTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBmb3JtYXQ6IGZtdHNbY29tcG9uZW50Q291bnQgLSAxXSxcclxuICAgICAgICBpbnRlcm5hbDogYnl0ZUludGVybmFsc1tjb21wb25lbnRDb3VudCAtIDFdLFxyXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVU5TSUdORURfQllURSxcclxuICAgICAgfTtcclxuXHJcbiAgICBjYXNlIFRleHR1cmUuREVQVEg6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybWF0OiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkRFUFRIX0NPTVBPTkVOVCxcclxuICAgICAgICBpbnRlcm5hbDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5ERVBUSF9DT01QT05FTlQzMkYsXHJcbiAgICAgICAgY29tcG9uZW50VHlwZTogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5GTE9BVCxcclxuICAgICAgfTtcclxuXHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICAvLyBtaW5pbWFsIGZvcm1hdCBwb3NzaWJsZVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1hdDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SRUQsXHJcbiAgICAgICAgaW50ZXJuYWw6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUjgsXHJcbiAgICAgICAgY29tcG9uZW50VHlwZTogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5VTlNJR05FRF9CWVRFLFxyXG4gICAgICB9O1xyXG4gIH1cclxufSAvKiBnZXRGb3JtYXQgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBUZXh0dXJlIHtcclxuICAjZ2w7XHJcbiAgI2Zvcm1hdDtcclxuICBzaXplO1xyXG4gIGlkO1xyXG5cclxuICBzdGF0aWMgRkxPQVQgICAgICAgICA9IDA7XHJcbiAgc3RhdGljIFVOU0lHTkVEX0JZVEUgPSAxO1xyXG4gIHN0YXRpYyBERVBUSCAgICAgICAgID0gMjtcclxuXHJcbiAgY29uc3RydWN0b3IoZ2wsIGNvbXBvbmVudFR5cGUgPSBUZXh0dXJlLkZMT0FULCBjb21wb25lbnRDb3VudCA9IDEpIHtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuICAgIHRoaXMuc2l6ZSA9IG5ldyBtdGguU2l6ZSgxLCAxKTtcclxuICAgIHRoaXMuaWQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmlkKTtcclxuXHJcbiAgICB0aGlzLmZvcm1hdCA9IGdldEZvcm1hdChjb21wb25lbnRUeXBlLCBjb21wb25lbnRDb3VudCk7XHJcbiAgICAvLyBwdXQgZW1wdHkgaW1hZ2UgZGF0YVxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdC5pbnRlcm5hbCwgMSwgMSwgMCwgdGhpcy5mb3JtYXQuZm9ybWF0LCB0aGlzLmZvcm1hdC5jb21wb25lbnRUeXBlLCBudWxsKTtcclxuXHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuXHJcbiAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfQUxJR05NRU5ULCAxKTtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIFxyXG4gIHN0YXRpYyBkZWZhdWx0Q2hlY2tlclRleHR1cmUgPSBudWxsO1xyXG4gIHN0YXRpYyBkZWZhdWx0Q2hlY2tlcihnbCkge1xyXG4gICAgaWYgKFRleHR1cmUuZGVmYXVsdENoZWNrZXJUZXh0dXJlID09PSBudWxsKSB7XHJcbiAgICAgIFRleHR1cmUuZGVmYXVsdENoZWNrZXJUZXh0dXJlID0gbmV3IFRleHR1cmUoZ2wsIFRleHR1cmUuVU5TSUdORURfQllURSwgNCk7XHJcbiAgXHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIFRleHR1cmUuZGVmYXVsdENoZWNrZXJUZXh0dXJlLmlkKTtcclxuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBOCwgMSwgMSwgMCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgbmV3IFVpbnQ4QXJyYXkoWzB4MDAsIDB4RkYsIDB4MDAsIDB4RkZdKSk7XHJcblxyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVGV4dHVyZS5kZWZhdWx0Q2hlY2tlclRleHR1cmU7XHJcbiAgfSAvKiBkZWZhdWx0Q2hlY2tlciAqL1xyXG5cclxuICBkZWZhdWx0Q2hlY2tlcihkYXRhKSB7XHJcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xyXG4gICAgdGhpcy5nbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIDIsIDIsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KFtcclxuICAgICAgMHgwMCwgMHhGRiwgMHgwMCwgMHhGRixcclxuICAgICAgMHgwMCwgMHgwMCwgMHgwMCwgMHhGRixcclxuICAgICAgMHgwMCwgMHgwMCwgMHgwMCwgMHhGRixcclxuICAgICAgMHgwMCwgMHhGRiwgMHgwMCwgMHhGRixcclxuICAgIF0pKTtcclxuICB9XHJcblxyXG4gIGxvYWQocGF0aCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgbGV0IGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgICBpbWFnZS5zcmMgPSBwYXRoO1xyXG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7IFxyXG4gICAgICAgIHRoaXMuZnJvbUltYWdlKGltYWdlKTtcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9IC8qIGxvYWQgKi9cclxuXHJcbiAgZnJvbUltYWdlKGltYWdlKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIHRoaXMuc2l6ZS53ID0gaW1hZ2Uud2lkdGg7XHJcbiAgICB0aGlzLnNpemUuaCA9IGltYWdlLmhlaWdodDtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdC5pbnRlcm5hbCwgdGhpcy5mb3JtYXQuZm9ybWF0LCB0aGlzLmZvcm1hdC5jb21wb25lbnRUeXBlLCBpbWFnZSk7XHJcbiAgfSAvKiBmcm9tSW1hZ2UgKi9cclxuXHJcbiAgYmluZChwcm9ncmFtLCBpbmRleCA9IDApIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xyXG5cclxuICAgIGxldCBsb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBgVGV4dHVyZSR7aW5kZXh9YCk7XHJcbiAgICBnbC51bmlmb3JtMWkobG9jYXRpb24sIGluZGV4KTtcclxuICB9IC8qIGJpbmQgKi9cclxuXHJcbiAgcmVzaXplKHNpemUpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcbiAgICB0aGlzLnNpemUgPSBzaXplLmNvcHkoKTtcclxuXHJcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZm9ybWF0LmludGVybmFsLCB0aGlzLnNpemUudywgdGhpcy5zaXplLmgsIDAsIHRoaXMuZm9ybWF0LmZvcm1hdCwgdGhpcy5mb3JtYXQuY29tcG9uZW50VHlwZSwgbnVsbCk7XHJcbiAgfSAvKiByZXNpemUgKi9cclxufSAvKiBUZXh0dXJlICovXHJcblxyXG5jb25zdCBmYWNlRGVzY3JpcHRpb25zID0gW1xyXG4gIHt0YXJnZXQ6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCB0ZXh0OiBcIitYXCIsIHBhdGg6IFwicG9zWFwifSxcclxuICB7dGFyZ2V0OiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCwgdGV4dDogXCItWFwiLCBwYXRoOiBcIm5lZ1hcIn0sXHJcbiAge3RhcmdldDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksIHRleHQ6IFwiK1lcIiwgcGF0aDogXCJwb3NZXCJ9LFxyXG4gIHt0YXJnZXQ6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCB0ZXh0OiBcIi1ZXCIsIHBhdGg6IFwibmVnWVwifSxcclxuICB7dGFyZ2V0OiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgdGV4dDogXCIrWlwiLCBwYXRoOiBcInBvc1pcIn0sXHJcbiAge3RhcmdldDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osIHRleHQ6IFwiLVpcIiwgcGF0aDogXCJuZWdaXCJ9LFxyXG5dO1xyXG5cclxuZXhwb3J0IGNsYXNzIEN1YmVtYXAge1xyXG4gICNnbDtcclxuICBpZDtcclxuXHJcbiAgY29uc3RydWN0b3IoZ2wpIHtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuXHJcbiAgICBsZXQgY3R4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKS5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgY3R4LmNhbnZhcy53aWR0aCA9IDEyODtcclxuICAgIGN0eC5jYW52YXMuaGVpZ2h0ID0gMTI4O1xyXG5cclxuICAgIGZ1bmN0aW9uIGRyYXdGYWNlKHRleHQpIHtcclxuICAgICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gY3R4LmNhbnZhcztcclxuXHJcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnI0NDQyc7XHJcbiAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgY3R4LmZvbnQgPSBgJHt3aWR0aCAqIDAuNX1weCBjb25zb2xhc2A7XHJcbiAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcclxuICAgICAgY3R4LnRleHRCYXNlTGluZSA9ICdtaWRkbGUnO1xyXG4gICAgICBjdHguZmlsbFN0eWxlID0gJyMzMzMnO1xyXG5cclxuICAgICAgY3R4LmZpbGxUZXh0KHRleHQsIHdpZHRoIC8gMiwgaGVpZ2h0IC8gMik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pZCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIHRoaXMuaWQpO1xyXG5cclxuICAgIGZvciAobGV0IGRlc2NyIG9mIGZhY2VEZXNjcmlwdGlvbnMpIHtcclxuICAgICAgZHJhd0ZhY2UoZGVzY3IudGV4dCk7XHJcblxyXG4gICAgICBnbC50ZXhJbWFnZTJEKGRlc2NyLnRhcmdldCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgY3R4LmNhbnZhcyk7XHJcbiAgICB9XHJcbiAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFX0NVQkVfTUFQKTtcclxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVJfTUlQTUFQX0xJTkVBUik7XHJcbiAgXHJcbiAgICBjdHguY2FudmFzLnJlbW92ZSgpO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgbG9hZChwYXRoKSB7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLmlkKTtcclxuXHJcbiAgICBmb3IgKGxldCBkZXNjciBvZiBmYWNlRGVzY3JpcHRpb25zKSB7XHJcbiAgICAgIGxldCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgICAgZ2wudGV4SW1hZ2UyRChkZXNjci50YXJnZXQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGN0eC5jYW52YXMpO1xyXG4gICAgfVxyXG4gICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSX01JUE1BUF9MSU5FQVIpO1xyXG4gIH0gLyogbG9hZCAqL1xyXG5cclxuICBiaW5kKHByb2dyYW0sIGluZGV4ID0gMCkge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaW5kZXgpO1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgdGhpcy5pZCk7XHJcblxyXG4gICAgbGV0IGxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIGBUZXh0dXJlJHtpbmRleH1gKTtcclxuICAgIGdsLnVuaWZvcm0xaShsb2NhdGlvbiwgaW5kZXgpO1xyXG4gIH0gLyogYmluZCAqL1xyXG59IC8qIEN1YmVtYXAgKi8iLCJleHBvcnQgY2xhc3MgVUJPIHtcclxuICBnbDtcclxuICBidWZmZXI7XHJcbiAgaXNFbXB0eSA9IHRydWU7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGdsKSB7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICB0aGlzLmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgd3JpdGVEYXRhKGRhdGFBc0Zsb2F0QXJyYXkpIHtcclxuICAgIHRoaXMuaXNFbXB0eSA9IGZhbHNlO1xyXG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuVU5JRk9STV9CVUZGRVIsIHRoaXMuYnVmZmVyKTtcclxuICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLlVOSUZPUk1fQlVGRkVSLCBkYXRhQXNGbG9hdEFycmF5LCB0aGlzLmdsLlNUQVRJQ19EUkFXKTtcclxuICB9IC8qIHdyaXRlRGF0YSAqL1xyXG5cclxuICBiaW5kKHNoYWRlciwgYmluZGluZ1BvaW50LCBidWZmZXJOYW1lKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIGlmICghdGhpcy5pc0VtcHR5KSB7XHJcbiAgICAgIGxldCBsb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1CbG9ja0luZGV4KHNoYWRlciwgYnVmZmVyTmFtZSk7XHJcblxyXG4gICAgICBpZiAobG9jYXRpb24gIT0gZ2wuSU5WQUxJRF9JTkRFWCkge1xyXG4gICAgICAgIGdsLnVuaWZvcm1CbG9ja0JpbmRpbmcoc2hhZGVyLCBsb2NhdGlvbiwgYmluZGluZ1BvaW50KTtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyQmFzZShnbC5VTklGT1JNX0JVRkZFUiwgYmluZGluZ1BvaW50LCB0aGlzLmJ1ZmZlcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IC8qIGJpbmQgKi9cclxufSAvKiBVQk8gKi8iLCJpbXBvcnQge2xvYWRTaGFkZXJ9IGZyb20gXCIuL3NoYWRlci5qc1wiO1xyXG5pbXBvcnQge1RleHR1cmUsIEN1YmVtYXB9IGZyb20gXCIuL3RleHR1cmUuanNcIjtcclxuaW1wb3J0IHtVQk99IGZyb20gXCIuL3Viby5qc1wiO1xyXG5leHBvcnQge1RleHR1cmUsIEN1YmVtYXAsIFVCTywgbG9hZFNoYWRlcn07XHJcblxyXG5leHBvcnQgY2xhc3MgTWF0ZXJpYWwge1xyXG4gIHVib05hbWVPblNoYWRlciA9IFwiXCI7XHJcbiAgZ2w7XHJcbiAgdWJvID0gbnVsbDsgICAgLy8gb2JqZWN0IGJ1ZmZlclxyXG4gIHRleHR1cmVzID0gW107IC8vIGFycmF5IG9mIHRleHR1cmVzXHJcbiAgc2hhZGVyOyAgICAgICAgLy8gc2hhZGVyIHBvaW50ZXJcclxuXHJcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlcikge1xyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgdGhpcy5zaGFkZXIgPSBzaGFkZXI7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBhcHBseSgpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgZ2wudXNlUHJvZ3JhbSh0aGlzLnNoYWRlcik7XHJcblxyXG4gICAgaWYgKHRoaXMudWJvICE9IG51bGwpXHJcbiAgICAgIHRoaXMudWJvLmJpbmQodGhpcy5zaGFkZXIsIDAsIHRoaXMudWJvTmFtZU9uU2hhZGVyKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0dXJlcy5sZW5ndGg7IGkrKylcclxuICAgICAgdGhpcy50ZXh0dXJlc1tpXS5iaW5kKHRoaXMuc2hhZGVyLCBpKTtcclxuICB9IC8qIGFwcGx5ICovXHJcblxyXG4gIHVuYm91bmRUZXh0dXJlcygpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRleHR1cmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpKTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICB9XHJcbiAgfSAvKiB1bmJvdW5kVGV4dHVyZXMgKi9cclxufSAvKiBNYXRlcmlhbCAqLyIsImltcG9ydCB7bG9hZFNoYWRlcn0gZnJvbSBcIi4vc2hhZGVyLmpzXCI7XHJcbmltcG9ydCB7TWF0ZXJpYWwsIFRleHR1cmUsIEN1YmVtYXAsIFVCT30gZnJvbSBcIi4vbWF0ZXJpYWwuanNcIjtcclxuaW1wb3J0ICogYXMgbXRoIGZyb20gXCIuL210aC5qc1wiO1xyXG5cclxuZXhwb3J0IHtsb2FkU2hhZGVyLCBNYXRlcmlhbCwgVGV4dHVyZSwgQ3ViZW1hcCwgVUJPLCBtdGh9O1xyXG5cclxuZXhwb3J0IGNsYXNzIFZlcnRleCB7XHJcbiAgcDtcclxuICB0O1xyXG4gIG47XHJcblxyXG4gIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCB0ZXhjb29yZCwgbm9ybWFsKSB7XHJcbiAgICB0aGlzLnAgPSBwb3NpdGlvbjtcclxuICAgIHRoaXMudCA9IHRleGNvb3JkO1xyXG4gICAgdGhpcy5uID0gbm9ybWFsO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgc3RhdGljIGZyb21Db29yZChweCwgcHksIHB6LCBwdSA9IDAsIHB2ID0gMCwgcG54ID0gMCwgcG55ID0gMCwgcG56ID0gMSkge1xyXG4gICAgcmV0dXJuIG5ldyBWZXJ0ZXgobmV3IG10aC5WZWMzKHB4LCBweSwgcHopLCBuZXcgbXRoLlZlYzIocHUsIHB2KSwgbmV3IG10aC5WZWMzKHBueCwgcG55LCBwbnopKTtcclxuICB9IC8qIGZyb21Db29yZCAqL1xyXG5cclxuICBzdGF0aWMgZnJvbVZlY3RvcnMocCwgdCA9IG5ldyBtdGguVmVjMigwLCAwKSwgbiA9IG5ldyBtdGguVmVjMygxLCAxLCAxKSkge1xyXG4gICAgcmV0dXJuIG5ldyBWZXJ0ZXgocC5jb3B5KCksIHQuY29weSgpLCBuLmNvcHkoKSk7XHJcbiAgfSAvKiBmcm9tVmVjdG9ycyAqL1xyXG59OyAvKiBWZXJ0ZXggKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBUb3BvbG9neSB7XHJcbiAgdnR4O1xyXG4gIGlkeDtcclxuICB0eXBlID0gVG9wb2xvZ3kuVFJJQU5HTEVTO1xyXG5cclxuICBzdGF0aWMgTElORVMgICAgICAgICAgPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkxJTkVTO1xyXG4gIHN0YXRpYyBMSU5FX1NUUklQICAgICA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuTElORV9TVFJJUDtcclxuICBzdGF0aWMgTElORV9MT09QICAgICAgPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkxJTkVfTE9PUDtcclxuXHJcbiAgc3RhdGljIFBPSU5UUyAgICAgICAgID0gV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5QT0lOVFM7XHJcblxyXG4gIHN0YXRpYyBUUklBTkdMRVMgICAgICA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVFJJQU5HTEVTO1xyXG4gIHN0YXRpYyBUUklBTkdMRV9TVFJJUCA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVFJJQU5HTEVfU1RSSVA7XHJcbiAgc3RhdGljIFRSSUFOR0xFX0ZBTiAgID0gV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5UUklBTkdMRV9GQU47XHJcblxyXG4gIGNvbnN0cnVjdG9yKG52dHggPSBbXSwgbmlkeCA9IG51bGwpIHtcclxuICAgIHRoaXMudnR4ID0gbnZ0eDtcclxuICAgIHRoaXMuaWR4ID0gbmlkeDtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIHN0YXRpYyBnZW9tZXRyeVR5cGVUb0dMKGdlb21ldHJ5VHlwZSkge1xyXG4gICAgcmV0dXJuIGdlb21ldHJ5VHlwZTtcclxuICB9IC8qIGdlb21ldHJ5VHlwZVRvR0wgKi9cclxuXHJcbiAgc3RhdGljIHNxdWFyZSgpIHtcclxuICAgIGxldCB0cGwgPSBuZXcgVG9wb2xvZ3koW1xyXG4gICAgICBWZXJ0ZXguZnJvbUNvb3JkKC0xLCAtMSwgMCwgMCwgMCksXHJcbiAgICAgIFZlcnRleC5mcm9tQ29vcmQoLTEsICAxLCAwLCAwLCAxKSxcclxuICAgICAgVmVydGV4LmZyb21Db29yZCggMSwgLTEsIDAsIDEsIDApLFxyXG4gICAgICBWZXJ0ZXguZnJvbUNvb3JkKCAxLCAgMSwgMCwgMSwgMSlcclxuICAgIF0sIFswLCAxLCAyLCAzXSk7XHJcbiAgICB0cGwudHlwZSA9IFRvcG9sb2d5LlRSSUFOR0xFX1NUUklQO1xyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIHRoZVRyaWFuZ2xlICovXHJcblxyXG4gIHN0YXRpYyAjcGxhbmVJbmRleGVkKHdpZHRoID0gMzAsIGhlaWdodCA9IDMwKSB7XHJcbiAgICBsZXQgdHBsID0gbmV3IFRvcG9sb2d5KCk7XHJcblxyXG4gICAgdHBsLnR5cGUgPSBUb3BvbG9neS5UUklBTkdMRV9TVFJJUDtcclxuICAgIHRwbC52dHggPSBbXTtcclxuICAgIHRwbC5pZHggPSBbXTtcclxuXHJcbiAgICBsZXQgaSA9IDA7XHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodCAtIDE7IHkrKykge1xyXG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICB0cGwuaWR4W2krK10gPSB5ICogd2lkdGggKyB4O1xyXG4gICAgICAgIHRwbC5pZHhbaSsrXSA9ICh5ICsgMSkgKiB3aWR0aCArIHg7XHJcbiAgICAgIH1cclxuICAgICAgdHBsLmlkeFtpKytdID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIHBsYW5lSW5kZXhlZCAqL1xyXG5cclxuICBzdGF0aWMgcGxhbmUod2lkdGggPSAzMCwgaGVpZ2h0ID0gMzApIHtcclxuICAgIGxldCB0cGwgPSBUb3BvbG9neS4jcGxhbmVJbmRleGVkKHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgdHBsLnZ0eFt5ICogd2lkdGggKyB4XSA9IFZlcnRleC5mcm9tQ29vcmQoXHJcbiAgICAgICAgICB4LCAwLCB5LFxyXG4gICAgICAgICAgeCAvICh3aWR0aCAtIDEpLCB5IC8gKGhlaWdodCAtIDEpLFxyXG4gICAgICAgICAgMCwgMSwgMFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHBsO1xyXG4gIH0gLyogcGxhbmUgKi9cclxuXHJcbiAgc3RhdGljIGNvbmUoc2l6ZSA9IDMwKSB7XHJcbiAgICBsZXQgdHBsID0gbmV3IFRvcG9sb2d5KFtdLCBbXSk7XHJcblxyXG4gICAgdHBsLnZ0eC5wdXNoKFZlcnRleC5mcm9tQ29vcmQoMCwgMSwgMCkpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcclxuICAgICAgbGV0IGEgPSBpIC8gKHNpemUgLSAxKSAqIE1hdGguUEkgKiAyO1xyXG5cclxuICAgICAgdHBsLnZ0eC5wdXNoKFZlcnRleC5mcm9tQ29vcmQoTWF0aC5jb3MoYSksIDAsIE1hdGguc2luKGEpKSk7XHJcblxyXG4gICAgICB0cGwuaWR4LnB1c2goaSAlIHNpemUgKyAxKTtcclxuICAgICAgdHBsLmlkeC5wdXNoKDApO1xyXG4gICAgICB0cGwuaWR4LnB1c2goKGkgKyAxKSAlIHNpemUgKyAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHBsO1xyXG4gIH0gLyogY29uZSAqL1xyXG5cclxuICBzdGF0aWMgY3lsaW5kZXIoc2l6ZT0zMCkge1xyXG4gICAgbGV0IHRwbCA9IG5ldyBUb3BvbG9neShbXSk7XHJcbiAgICB0cGwudHlwZSA9IHRoaXMuVFJJQU5HTEVfU1RSSVA7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gc2l6ZTsgaSsrKSB7XHJcbiAgICAgIGxldCBhID0gaSAvIChzaXplIC0gMikgKiBNYXRoLlBJICogMjtcclxuICAgICAgbGV0IGNhID0gTWF0aC5jb3MoYSksIHNhID0gTWF0aC5zaW4oYSk7XHJcblxyXG4gICAgICB0cGwudnR4LnB1c2goVmVydGV4LmZyb21Db29yZChjYSwgMCwgc2EpKTtcclxuICAgICAgdHBsLnZ0eC5wdXNoKFZlcnRleC5mcm9tQ29vcmQoY2EsIDEsIHNhKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIGN5bGluZGVyICovXHJcblxyXG4gIHN0YXRpYyBzcGhlcmUocmFkaXVzID0gMSwgd2lkdGggPSAzMCwgaGVpZ2h0ID0gMzApIHtcclxuICAgIGxldCB0cGwgPSBUb3BvbG9neS4jcGxhbmVJbmRleGVkKHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgbGV0IHRoZXRhID0gTWF0aC5QSSAqIHkgLyAoaGVpZ2h0IC0gMSk7XHJcbiAgICAgIGxldCBzdGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XHJcbiAgICAgIGxldCBjdGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XHJcblxyXG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICBsZXQgcGhpID0gMiAqIE1hdGguUEkgKiB4IC8gKHdpZHRoIC0gMSk7XHJcblxyXG4gICAgICAgIGxldCBueCA9IHN0aGV0YSAqIE1hdGguc2luKHBoaSk7XHJcbiAgICAgICAgbGV0IG55ID0gY3RoZXRhO1xyXG4gICAgICAgIGxldCBueiA9IHN0aGV0YSAqIE1hdGguY29zKHBoaSk7XHJcblxyXG4gICAgICAgIHRwbC52dHhbeSAqIHdpZHRoICsgeF0gPSBWZXJ0ZXguZnJvbUNvb3JkKFxyXG4gICAgICAgICAgcmFkaXVzICogbngsIHJhZGl1cyAqIG55LCByYWRpdXMgKiBueixcclxuICAgICAgICAgIHggLyAod2lkdGggLSAxKSwgeSAvIChoZWlnaHQgLSAxKSxcclxuICAgICAgICAgIG54LCBueSwgbnpcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIHNwaGVyZSAqL1xyXG5cclxuICBzdGF0aWMgYXN5bmMgbW9kZWxfb2JqKHBhdGgpIHtcclxuICAgIGxldCB0cGwgPSBuZXcgVG9wb2xvZ3koKTtcclxuICAgIHRwbC52dHggPSBbXTtcclxuICAgIHRwbC50eXBlID0gVG9wb2xvZ3kuVFJJQU5HTEVTO1xyXG5cclxuICAgIGNvbnN0IHNyYyA9IGF3YWl0IGZldGNoKHBhdGgpLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UudGV4dCgpKTtcclxuICAgIGxldCBsaW5lcyA9IHNyYy5zcGxpdChcIlxcblwiKTtcclxuICAgIGxldCBwb3NpdGlvbnMgPSBbXTtcclxuICAgIGxldCB0ZXhDb29yZHMgPSBbXTtcclxuICAgIGxldCBub3JtYWxzID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgbGkgPSAwLCBsaW5lQ291bnQgPSBsaW5lcy5sZW5ndGg7IGxpIDwgbGluZUNvdW50OyBsaSsrKSB7XHJcbiAgICAgIGxldCBzZWdtZW50cyA9IGxpbmVzW2xpXS5zcGxpdChcIiBcIik7XHJcblxyXG4gICAgICBzd2l0Y2ggKHNlZ21lbnRzWzBdKSB7XHJcbiAgICAgICAgY2FzZSBcInZcIjpcclxuICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKG5ldyBtdGguVmVjMyhcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChzZWdtZW50c1sxXSksXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoc2VnbWVudHNbMl0pLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzNdKVxyXG4gICAgICAgICAgKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSBcInZ0XCI6XHJcbiAgICAgICAgICB0ZXhDb29yZHMucHVzaChuZXcgbXRoLlZlYzIoXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoc2VnbWVudHNbMV0pLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzJdKVxyXG4gICAgICAgICAgKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSBcInZuXCI6XHJcbiAgICAgICAgICBub3JtYWxzLnB1c2gobmV3IG10aC5WZWMzKFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzFdKSxcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChzZWdtZW50c1syXSksXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoc2VnbWVudHNbM10pXHJcbiAgICAgICAgICApKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICBjYXNlIFwiZlwiOlxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdnRkID0gc2VnbWVudHNbMV0uc3BsaXQoXCIvXCIpO1xyXG4gICAgICAgICAgICBsZXQgaTAgPSBwYXJzZUludCh2dGRbMF0pLCBpMSA9IHBhcnNlSW50KHZ0ZFsxXSksIGkyID0gcGFyc2VJbnQodnRkWzJdKTtcclxuXHJcbiAgICAgICAgICAgIHRwbC52dHgucHVzaChuZXcgVmVydGV4KFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMCkgPyBuZXcgbXRoLlZlYzMoMCwgMCwgMCkgOiBwb3NpdGlvbnNbaTAgLSAxXSxcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTEpID8gbmV3IG10aC5WZWMyKDAsIDApIDogdGV4Q29vcmRzW2kxIC0gMV0sXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkyKSA/IG5ldyBtdGguVmVjMygwLCAwLCAwKSA6IG5vcm1hbHNbaTIgLSAxXVxyXG4gICAgICAgICAgICApKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZ0ZCA9IHNlZ21lbnRzWzJdLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgbGV0IGkwID0gcGFyc2VJbnQodnRkWzBdKSwgaTEgPSBwYXJzZUludCh2dGRbMV0pLCBpMiA9IHBhcnNlSW50KHZ0ZFsyXSk7XHJcblxyXG4gICAgICAgICAgICB0cGwudnR4LnB1c2gobmV3IFZlcnRleChcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTApID8gbmV3IG10aC5WZWMzKDAsIDAsIDApIDogcG9zaXRpb25zW2kwIC0gMV0sXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkxKSA/IG5ldyBtdGguVmVjMigwLCAwKSA6IHRleENvb3Jkc1tpMSAtIDFdLFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMikgPyBuZXcgbXRoLlZlYzMoMCwgMCwgMCkgOiBub3JtYWxzW2kyIC0gMV1cclxuICAgICAgICAgICAgKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB2dGQgPSBzZWdtZW50c1szXS5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgIGxldCBpMCA9IHBhcnNlSW50KHZ0ZFswXSksIGkxID0gcGFyc2VJbnQodnRkWzFdKSwgaTIgPSBwYXJzZUludCh2dGRbMl0pO1xyXG5cclxuICAgICAgICAgICAgdHBsLnZ0eC5wdXNoKG5ldyBWZXJ0ZXgoXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkwKSA/IG5ldyBtdGguVmVjMygwLCAwLCAwKSA6IHBvc2l0aW9uc1tpMCAtIDFdLFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMSkgPyBuZXcgbXRoLlZlYzIoMCwgMCkgOiB0ZXhDb29yZHNbaTEgLSAxXSxcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTIpID8gbmV3IG10aC5WZWMzKDAsIDAsIDApIDogbm9ybWFsc1tpMiAtIDFdXHJcbiAgICAgICAgICAgICkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIG1vZGVsX29iaiAqL1xyXG5cclxuICBnZXRWZXJ0aWNlc0FzRmxvYXRBcnJheSgpIHtcclxuICAgIGxldCByZXNfYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMudnR4Lmxlbmd0aCAqIDgpO1xyXG4gICAgbGV0IGkgPSAwO1xyXG4gICAgbGV0IG1pID0gdGhpcy52dHgubGVuZ3RoICogODtcclxuXHJcbiAgICB3aGlsZShpIDwgbWkpIHtcclxuICAgICAgbGV0IHZ0ID0gdGhpcy52dHhbaSA+PiAzXTtcclxuICBcclxuICAgICAgcmVzX2FycmF5W2krK10gPSB2dC5wLng7XHJcbiAgICAgIHJlc19hcnJheVtpKytdID0gdnQucC55O1xyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0LnAuejtcclxuXHJcbiAgICAgIHJlc19hcnJheVtpKytdID0gdnQudC54O1xyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0LnQueTtcclxuXHJcbiAgICAgIHJlc19hcnJheVtpKytdID0gdnQubi54O1xyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0Lm4ueTtcclxuICAgICAgcmVzX2FycmF5W2krK10gPSB2dC5uLno7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc19hcnJheTtcclxuICB9IC8qIGdldFZlcnRpY2VzQXNGbG9hdEFycmF5ICovXHJcblxyXG4gIGdldEluZGljZXNBc1VpbnRBcnJheSgpIHtcclxuICAgIHJldHVybiBuZXcgVWludDMyQXJyYXkodGhpcy5pZHgpO1xyXG4gIH0gLyogZ2V0SW5kaWNlc0FzVWludEFycmF5ICovXHJcbn0gLyogVG9wb2xvZ3kgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBFbXB0eVByaW1pdGl2ZSB7XHJcbiAgZ2w7XHJcbiAgbWF0ZXJpYWw7XHJcbiAgZ2VvbWV0cnlUeXBlID0gVG9wb2xvZ3kuVFJJQU5HTEVTO1xyXG4gIHZlcnRleENvdW50ID0gNDtcclxuXHJcbiAgY29uc3RydWN0b3IoZ2xDb250ZXh0LCB2ZXJ0ZXhDb3VudCA9IDQsIGdlb21ldHJ5VHlwZSA9IFRvcG9sb2d5LlRSSUFOR0xFUywgbWF0ZXJpYWwgPSBudWxsKSB7XHJcbiAgICB0aGlzLmdsID0gZ2xDb250ZXh0O1xyXG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xyXG4gICAgdGhpcy5nZW9tZXRyeVR5cGUgPSBnZW9tZXRyeVR5cGU7XHJcbiAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBkcmF3KGNhbWVyYUJ1ZmZlciA9IG51bGwpIHtcclxuICAgIHRoaXMubWF0ZXJpYWwuYXBwbHkoKTtcclxuICAgIGlmIChjYW1lcmFCdWZmZXIgIT0gbnVsbCkge1xyXG4gICAgICBjYW1lcmFCdWZmZXIuYmluZCh0aGlzLm1hdGVyaWFsLnNoYWRlciwgMSwgXCJjYW1lcmFCdWZmZXJcIik7XHJcbiAgICB9XHJcbiAgICB0aGlzLmdsLmRyYXdBcnJheXMoVG9wb2xvZ3kuZ2VvbWV0cnlUeXBlVG9HTCh0aGlzLmdlb21ldHJ5VHlwZSksIDAsIHRoaXMudmVydGV4Q291bnQpO1xyXG4gIH0gLyogZHJhdyAqL1xyXG5cclxuICBzdGF0aWMgZHJhd0Zyb21QYXJhbXMoZ2wsIHZlcnRleENvdW50LCBnZW9tZXRyeVR5cGUsIG1hdGVyaWFsLCBjYW1lcmFCdWZmZXIgPSBudWxsKSB7XHJcbiAgICBtYXRlcmlhbC5hcHBseSgpO1xyXG5cclxuICAgIGlmIChjYW1lcmFCdWZmZXIgIT0gbnVsbCkge1xyXG4gICAgICBjYW1lcmFCdWZmZXIuYmluZChtYXRlcmlhbC5zaGFkZXIsIDEsIFwiY2FtZXJhQnVmZmVyXCIpO1xyXG4gICAgfVxyXG4gICAgZ2wuZHJhd0FycmF5cyhUb3BvbG9neS5nZW9tZXRyeVR5cGVUb0dMKGdlb21ldHJ5VHlwZSksIDAsIHZlcnRleENvdW50KTtcclxuICB9IC8qIGRyYXdGcm9tUGFyYW1zICovXHJcbn0gLyogRW1wdHlQcmltaXRpdmUgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBQcmltaXRpdmUge1xyXG4gIGdsO1xyXG4gIHZlcnRleEFycmF5T2JqZWN0ID0gbnVsbDtcclxuICBpbmRleEJ1ZmZlciA9IG51bGw7XHJcbiAgdmVydGV4QnVmZmVyID0gbnVsbDtcclxuICB2ZXJ0ZXhOdW1iZXIgPSAwO1xyXG4gIGluZGV4TnVtYmVyID0gMDtcclxuICBnZW9tZXRyeVR5cGUgPSBUb3BvbG9neS5UUklBTkdMRVM7XHJcbiAgbWF0ZXJpYWwgPSBudWxsO1xyXG5cclxuICBjb25zdHJ1Y3RvcihnbENvbnRleHQpIHtcclxuICAgIHRoaXMuZ2wgPSBnbENvbnRleHQ7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBkcmF3KGNhbWVyYUJ1ZmZlciA9IG51bGwpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgdGhpcy5tYXRlcmlhbC5hcHBseSgpO1xyXG5cclxuICAgIGlmIChjYW1lcmFCdWZmZXIgIT0gbnVsbCkge1xyXG4gICAgICBjYW1lcmFCdWZmZXIuYmluZCh0aGlzLm1hdGVyaWFsLnNoYWRlciwgMSwgXCJjYW1lcmFCdWZmZXJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2wuYmluZFZlcnRleEFycmF5KHRoaXMudmVydGV4QXJyYXlPYmplY3QpO1xyXG4gICAgaWYgKHRoaXMuaW5kZXhCdWZmZXIgIT0gbnVsbCkge1xyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyKTtcclxuICAgICAgZ2wuZHJhd0VsZW1lbnRzKFRvcG9sb2d5Lmdlb21ldHJ5VHlwZVRvR0wodGhpcy5nZW9tZXRyeVR5cGUpLCB0aGlzLmluZGV4TnVtYmVyLCBnbC5VTlNJR05FRF9JTlQsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZ2wuZHJhd0FycmF5cyhUb3BvbG9neS5nZW9tZXRyeVR5cGVUb0dMKHRoaXMuZ2VvbWV0cnlUeXBlKSwgMCwgdGhpcy52ZXJ0ZXhOdW1iZXIpO1xyXG4gICAgfVxyXG4gIH0gLyogZHJhdyAqL1xyXG5cclxuICBjbG9uZVdpdGhOZXdNYXRlcmlhbChtYXRlcmlhbCA9IG51bGwpIHtcclxuICAgIGlmIChtYXRlcmlhbCA9PT0gbnVsbCkge1xyXG4gICAgICBtYXRlcmlhbCA9IHRoaXMubWF0ZXJpYWw7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuICAgIGxldCBwcmltID0gbmV3IFByaW1pdGl2ZShnbCk7XHJcblxyXG4gICAgcHJpbS5tYXRlcmlhbCA9IG1hdGVyaWFsO1xyXG5cclxuICAgIHByaW0udmVydGV4QnVmZmVyID0gdGhpcy52ZXJ0ZXhCdWZmZXI7XHJcbiAgICBwcmltLnZlcnRleENvdW50ID0gdGhpcy52ZXJ0ZXhDb3VudDtcclxuXHJcbiAgICBwcmltLnZlcnRleEFycmF5T2JqZWN0ID0gZ2wuY3JlYXRlVmVydGV4QXJyYXkoKTtcclxuICAgIGdsLmJpbmRWZXJ0ZXhBcnJheShwcmltLnZlcnRleEFycmF5T2JqZWN0KTtcclxuXHJcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcHJpbS52ZXJ0ZXhCdWZmZXIpO1xyXG5cclxuICAgIC8vIE1hcCB2ZXJ0ZXggbGF5b3V0XHJcbiAgICBsZXQgcG9zaXRpb25Mb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByaW0ubWF0ZXJpYWwuc2hhZGVyLCBcImluUG9zaXRpb25cIik7XHJcbiAgICBpZiAocG9zaXRpb25Mb2NhdGlvbiAhPSAtMSkge1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHBvc2l0aW9uTG9jYXRpb24sIDMsIGdsLkZMT0FULCBmYWxzZSwgOCAqIDQsIDApO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShwb3NpdGlvbkxvY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgdGV4Q29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByaW0ubWF0ZXJpYWwuc2hhZGVyLCBcImluVGV4Q29vcmRcIik7XHJcbiAgICBpZiAodGV4Q29vcmRMb2NhdGlvbiAhPSAtMSkge1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRleENvb3JkTG9jYXRpb24sIDMsIGdsLkZMT0FULCBmYWxzZSwgOCAqIDQsIDMgKiA0KTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGV4Q29vcmRMb2NhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG5vcm1hbExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJpbS5tYXRlcmlhbC5zaGFkZXIsIFwiaW5Ob3JtYWxcIik7XHJcbiAgICBpZiAobm9ybWFsTG9jYXRpb24gIT0gLTEpIHtcclxuICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihub3JtYWxMb2NhdGlvbiwgMywgZ2wuRkxPQVQsIGZhbHNlLCA4ICogNCwgNSAqIDQpO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShub3JtYWxMb2NhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpbS5pbmRleEJ1ZmZlciA9IHRoaXMuaW5kZXhCdWZmZXI7XHJcbiAgICBwcmltLmluZGV4Q291bnQgPSB0aGlzLmluZGV4Q291bnQ7XHJcbiAgfSAvKiBjbG9uZVdpdGhOZXdNYXRlcmlhbCAqL1xyXG5cclxuICBzdGF0aWMgYXN5bmMgZnJvbVRvcG9sb2d5KGdsLCB0cGwsIG1hdGVyaWFsKSB7XHJcbiAgICBsZXQgcHJpbSA9IG5ldyBQcmltaXRpdmUoZ2wpO1xyXG4gICAgcHJpbS5tYXRlcmlhbCA9IG1hdGVyaWFsO1xyXG5cclxuICAgIHByaW0uZ2VvbWV0cnlUeXBlID0gdHBsLnR5cGU7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHZlcnRleCBhcnJheVxyXG4gICAgcHJpbS52ZXJ0ZXhBcnJheU9iamVjdCA9IGdsLmNyZWF0ZVZlcnRleEFycmF5KCk7XHJcbiAgICBnbC5iaW5kVmVydGV4QXJyYXkocHJpbS52ZXJ0ZXhBcnJheU9iamVjdCk7XHJcblxyXG4gICAgLy8gV3JpdGUgdmVydGV4IGJ1ZmZlclxyXG4gICAgcHJpbS52ZXJ0ZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBwcmltLnZlcnRleEJ1ZmZlcik7XHJcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdHBsLmdldFZlcnRpY2VzQXNGbG9hdEFycmF5KCksIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgIHByaW0udmVydGV4TnVtYmVyID0gdHBsLnZ0eC5sZW5ndGg7XHJcblxyXG4gICAgLy8gTWFwIHZlcnRleCBsYXlvdXRcclxuICAgIGxldCBwb3NpdGlvbkxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJpbS5tYXRlcmlhbC5zaGFkZXIsIFwiaW5Qb3NpdGlvblwiKTtcclxuICAgIGlmIChwb3NpdGlvbkxvY2F0aW9uICE9IC0xKSB7XHJcbiAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocG9zaXRpb25Mb2NhdGlvbiwgMywgZ2wuRkxPQVQsIGZhbHNlLCA4ICogNCwgMCk7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHBvc2l0aW9uTG9jYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCB0ZXhDb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJpbS5tYXRlcmlhbC5zaGFkZXIsIFwiaW5UZXhDb29yZFwiKTtcclxuICAgIGlmICh0ZXhDb29yZExvY2F0aW9uICE9IC0xKSB7XHJcbiAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGV4Q29vcmRMb2NhdGlvbiwgMywgZ2wuRkxPQVQsIGZhbHNlLCA4ICogNCwgMyAqIDQpO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0ZXhDb29yZExvY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgbm9ybWFsTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmltLm1hdGVyaWFsLnNoYWRlciwgXCJpbk5vcm1hbFwiKTtcclxuICAgIGlmIChub3JtYWxMb2NhdGlvbiAhPSAtMSkge1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKG5vcm1hbExvY2F0aW9uLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDggKiA0LCA1ICogNCk7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KG5vcm1hbExvY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgaW5kZXggYnVmZmVyXHJcbiAgICBpZiAodHBsLmlkeCA9PSBudWxsKSB7XHJcbiAgICAgIHByaW0uaW5kZXhCdWZmZXIgPSBudWxsO1xyXG4gICAgICBwcmltLmluZGV4TnVtYmVyID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHByaW0uaW5kZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgcHJpbS5pbmRleEJ1ZmZlcik7XHJcbiAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRwbC5nZXRJbmRpY2VzQXNVaW50QXJyYXkoKSwgZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgICBwcmltLmluZGV4TnVtYmVyID0gdHBsLmlkeC5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHByaW07XHJcbiAgfSAvKiBmcm9tQXJyYXkgKi9cclxufTsgLyogUHJpbWl0aXZlICovXHJcbiIsImltcG9ydCAqIGFzIG10aCBmcm9tIFwiLi9tdGguanNcIjtcclxuaW1wb3J0IHtUZXh0dXJlfSBmcm9tIFwiLi90ZXh0dXJlLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBkZWNvZGVGcmFtZWJ1ZmZlclN0YXR1cyhzdGF0dXMpIHtcclxuICBzd2l0Y2ggKHN0YXR1cykge1xyXG4gICAgY2FzZSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkZSQU1FQlVGRkVSX0NPTVBMRVRFOiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJjb21wbGV0ZVwiO1xyXG4gICAgY2FzZSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVDogICAgICAgICByZXR1cm4gXCJpbmNvbXBsZXRlIGF0dGFjaG1lbnRcIjtcclxuICAgIGNhc2UgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlM6ICAgICAgICAgcmV0dXJuIFwiaGVpZ2h0IGFuZCB3aWR0aCBvZiBhdHRhY2htZW50IGFyZW4ndCBzYW1lXCI7XHJcbiAgICBjYXNlIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlQ6IHJldHVybiBcImF0dGFjaG1lbnQgbWlzc2luZ1wiO1xyXG4gICAgY2FzZSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkZSQU1FQlVGRkVSX1VOU1VQUE9SVEVEOiAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJhdHRhY2htZW50IGZvcm1hdCBpc24ndCBzdXBwb3J0ZWRcIjtcclxuICB9XHJcbn0gLyogZGVjb2RlRnJhbWVidWZmZXJTdGF0dXMgKi9cclxuXHJcbmxldCBjdXJyZW50VGFyZ2V0ID0gbnVsbDtcclxubGV0IGZldGNoZXJUYXJnZXQgPSBudWxsO1xyXG5cclxuZXhwb3J0IGNsYXNzIFRhcmdldCB7XHJcbiAgI2dsO1xyXG4gIEZCTztcclxuICBhdHRhY2htZW50cyA9IFtdO1xyXG4gIHNpemU7XHJcbiAgZGVwdGg7XHJcbiAgZHJhd0J1ZmZlcnM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGdsLCBhdHRhY2htZW50Q291bnQpIHtcclxuICAgIHRoaXMuc2l6ZSA9IG5ldyBtdGguU2l6ZSg4MDAsIDYwMCk7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICB0aGlzLkZCTyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XHJcblxyXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLkZCTyk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHRhcmdldCB0ZXh0dXJlc1xyXG4gICAgdGhpcy5kcmF3QnVmZmVycyA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRhY2htZW50Q291bnQ7IGkrKykge1xyXG4gICAgICB0aGlzLmF0dGFjaG1lbnRzW2ldID0gbmV3IFRleHR1cmUoZ2wsIFRleHR1cmUuRkxPQVQsIDQpO1xyXG4gICAgICB0aGlzLmRyYXdCdWZmZXJzLnB1c2goZ2wuQ09MT1JfQVRUQUNITUVOVDAgKyBpKTtcclxuICAgIH1cclxuICAgIGdsLmRyYXdCdWZmZXJzKHRoaXMuZHJhd0J1ZmZlcnMpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0YWNobWVudENvdW50OyBpKyspIHtcclxuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5hdHRhY2htZW50c1tpXS5pZCk7XHJcbiAgICAgIHRoaXMuYXR0YWNobWVudHNbaV0ucmVzaXplKHRoaXMuc2l6ZSk7XHJcbiAgXHJcbiAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCArIGksIGdsLlRFWFRVUkVfMkQsIHRoaXMuYXR0YWNobWVudHNbaV0uaWQsIDApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kZXB0aCA9IG5ldyBUZXh0dXJlKGdsLCBUZXh0dXJlLkRFUFRIKTtcclxuICAgIHRoaXMuZGVwdGgucmVzaXplKHRoaXMuc2l6ZSk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmRlcHRoLmlkKTtcclxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5URVhUVVJFXzJELCB0aGlzLmRlcHRoLmlkLCAwKTtcclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyhgRnJhbWVidWZmZXIgc3RhdHVzOiAke2RlY29kZUZyYW1lYnVmZmVyU3RhdHVzKGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpKX1gKTtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIGdldEF0dGFjaG1lbnRWYWx1ZShhdHQsIHgsIHkpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgaWYgKGZldGNoZXJUYXJnZXQgPT0gbnVsbCkge1xyXG4gICAgICBmZXRjaGVyVGFyZ2V0ID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcclxuICAgIH1cclxuICAgIGxldCBkc3QgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xyXG5cclxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmV0Y2hlclRhcmdldCk7XHJcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHRoaXMuYXR0YWNobWVudHNbYXR0XS5pZCwgMCk7XHJcbiAgICBpZiAoZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUikgPT0gZ2wuRlJBTUVCVUZGRVJfQ09NUExFVEUpIHtcclxuICAgICAgZ2wucmVhZFBpeGVscyh4LCB0aGlzLmF0dGFjaG1lbnRzW2F0dF0uc2l6ZS5oIC0geSwgMSwgMSwgZ2wuUkdCQSwgZ2wuRkxPQVQsIGRzdCk7XHJcbiAgICB9XHJcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGN1cnJlbnRUYXJnZXQpO1xyXG5cclxuICAgIHJldHVybiBkc3Q7XHJcbiAgfSAvKiBnZXRBdHRhY2htZW50UGl4ZWwgKi9cclxuXHJcbiAgcmVzaXplKHNpemUpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgdGhpcy5zaXplID0gc2l6ZS5jb3B5KCk7XHJcbiAgICB0aGlzLkZCTyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XHJcblxyXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLkZCTyk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHRhcmdldCB0ZXh0dXJlc1xyXG4gICAgbGV0IGRyYXdCdWZmZXJzID0gW107XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXR0YWNobWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdGhpcy5hdHRhY2htZW50c1tpXSA9IG5ldyBUZXh0dXJlKGdsLCBUZXh0dXJlLkZMT0FULCA0KTtcclxuICAgICAgZHJhd0J1ZmZlcnMucHVzaChnbC5DT0xPUl9BVFRBQ0hNRU5UMCArIGkpO1xyXG4gICAgfVxyXG4gICAgZ2wuZHJhd0J1ZmZlcnMoZHJhd0J1ZmZlcnMpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hdHRhY2htZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmF0dGFjaG1lbnRzW2ldLmlkKTtcclxuICAgICAgdGhpcy5hdHRhY2htZW50c1tpXS5yZXNpemUodGhpcy5zaXplKTtcclxuICBcclxuICAgICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwICsgaSwgZ2wuVEVYVFVSRV8yRCwgdGhpcy5hdHRhY2htZW50c1tpXS5pZCwgMCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRlcHRoID0gbmV3IFRleHR1cmUoZ2wsIFRleHR1cmUuREVQVEgpO1xyXG4gICAgdGhpcy5kZXB0aC5yZXNpemUodGhpcy5zaXplKTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuZGVwdGguaWQpO1xyXG4gICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkRFUFRIX0FUVEFDSE1FTlQsIGdsLlRFWFRVUkVfMkQsIHRoaXMuZGVwdGguaWQsIDApO1xyXG5cclxuICAgIC8vIGNvbnNvbGUubG9nKGBGcmFtZWJ1ZmZlciBzdGF0dXM6ICR7ZGVjb2RlRnJhbWVidWZmZXJTdGF0dXMoZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUikpfWApO1xyXG4gIH0gLyogcmVzaXplICovXHJcblxyXG4gIGJpbmQoKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIGN1cnJlbnRUYXJnZXQgPSB0aGlzLkZCTztcclxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgdGhpcy5GQk8pO1xyXG4gICAgZ2wuZHJhd0J1ZmZlcnModGhpcy5kcmF3QnVmZmVycyk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dGFjaG1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgZ2wuY2xlYXJCdWZmZXJmdihnbC5DT0xPUiwgaSwgWzAuMDAsIDAuMDAsIDAuMDAsIDAuMDBdKTtcclxuICAgIGdsLmNsZWFyQnVmZmVyZnYoZ2wuREVQVEgsIDAsIFsxXSk7XHJcbiAgICBnbC52aWV3cG9ydCgwLCAwLCB0aGlzLnNpemUudywgdGhpcy5zaXplLmgpO1xyXG4gIH0gLyogYmluZCAqL1xyXG5cclxuICBzdGF0aWMgZGVmYXVsdEZyYW1lYnVmZmVyID0ge1xyXG4gICAgc2l6ZTogbmV3IG10aC5TaXplKDgwMCwgNjAwKSxcclxuICAgIGdsOiBudWxsLFxyXG5cclxuICAgIHJlc2l6ZShzaXplKSB7XHJcbiAgICAgIFRhcmdldC5kZWZhdWx0RnJhbWVidWZmZXIuc2l6ZSA9IHNpemUuY29weSgpO1xyXG4gICAgfSwgLyogcmVzaXplICovXHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgbGV0IGdsID0gVGFyZ2V0LmRlZmF1bHRGcmFtZWJ1ZmZlci5nbDtcclxuXHJcbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcbiAgICAgIGdsLnZpZXdwb3J0KDAsIDAsIFRhcmdldC5kZWZhdWx0RnJhbWVidWZmZXIuc2l6ZS53LCBUYXJnZXQuZGVmYXVsdEZyYW1lYnVmZmVyLnNpemUuaCk7XHJcbiAgICAgIGdsLmNsZWFyKFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuQ09MT1JfQlVGRkVSX0JJVCB8IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuREVQVEhfQlVGRkVSX0JJVCk7XHJcbiAgICAgIGdsLmNsZWFyQ29sb3IoMC4zMCwgMC40NywgMC44MCwgMS4wMCk7XHJcblxyXG4gICAgICBjdXJyZW50VGFyZ2V0ID0gbnVsbDtcclxuICAgIH1cclxuICB9OyAvKiBkZWZhdWx0RnJhbWVidWZmZXIgKi9cclxuXHJcbiAgZW5hYmxlRHJhd0J1ZmZlcihidWZmZXIpIHtcclxuICAgIHRoaXMuZHJhd0J1ZmZlcnNbYnVmZmVyXSA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuQ09MT1JfQVRUQUNITUVOVDAgKyBidWZmZXI7XHJcblxyXG4gICAgaWYgKGN1cnJlbnRUYXJnZXQgPT09IHRoaXMuRkJPKSB7XHJcbiAgICAgIHRoaXMuZ2wuZHJhd0J1ZmZlcnModGhpcy5kcmF3QnVmZmVycyk7XHJcbiAgICB9XHJcbiAgfSAvKiBlbmFibGVEcmF3QnVmZmVyICovXHJcblxyXG4gIGRpc2FibGVEcmF3QnVmZmVyKGJ1ZmZlcikge1xyXG4gICAgdGhpcy5kcmF3QnVmZmVyc1tidWZmZXJdID0gV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5OT05FO1xyXG5cclxuICAgIGlmIChjdXJyZW50VGFyZ2V0ID09PSB0aGlzLkZCTykge1xyXG4gICAgICB0aGlzLmdsLmRyYXdCdWZmZXJzKHRoaXMuZHJhd0J1ZmZlcnMpO1xyXG4gICAgfVxyXG4gIH0gLyogZGlzYWJsZURyYXdCdWZmZXIgKi9cclxuXHJcbiAgc3RhdGljIGRlZmF1bHQoZ2wpIHtcclxuICAgIFRhcmdldC5kZWZhdWx0RnJhbWVidWZmZXIuZ2wgPSBnbDtcclxuICAgIHJldHVybiBUYXJnZXQuZGVmYXVsdEZyYW1lYnVmZmVyO1xyXG4gIH0gLyogZGVmYXVsdCAqL1xyXG59IC8qIFRhcmdldCAqL1xyXG5cclxuLyogdGFyZ2V0LmpzICovIiwiZnVuY3Rpb24gZ2V0VGltZSgpIHtcclxuICByZXR1cm4gRGF0ZS5ub3coKSAvIDEwMDAuMDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRpbWVyIHtcclxuICBmcHNQcmV2VXBkYXRlVGltZSA9IDAuMDA7XHJcbiAgc3RhcnRUaW1lO1xyXG4gIGZwc0NvdW50ZXIgPSAwLjAwO1xyXG4gIHBhdXNlQ29sbGVjdG9yID0gMC4wMDtcclxuICBpc1BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICBmcHNEZWx0YVRpbWUgPSAzLjAwO1xyXG4gIGZwcyA9IHVuZGVmaW5lZDtcclxuXHJcbiAgdGltZSA9IDAuMDA7XHJcbiAgZ2xvYmFsVGltZTtcclxuICBcclxuICBkZWx0YVRpbWUgPSAwLjAwO1xyXG4gIGdsb2JhbERlbHRhVGltZSA9IDAuMDA7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5zdGFydFRpbWUgPSBnZXRUaW1lKCk7XHJcblxyXG4gICAgdGhpcy5nbG9iYWxUaW1lID0gdGhpcy5zdGFydFRpbWU7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICByZXNwb25zZSgpIHtcclxuICAgIGxldCBuZXdHbG9iYWxUaW1lID0gZ2V0VGltZSgpO1xyXG5cclxuICAgIHRoaXMuZ2xvYmFsRGVsdGFUaW1lID0gbmV3R2xvYmFsVGltZSAtIHRoaXMuZ2xvYmFsVGltZTtcclxuICAgIHRoaXMuZ2xvYmFsVGltZSA9IG5ld0dsb2JhbFRpbWU7XHJcblxyXG4gICAgaWYgKHRoaXMuaXNQYXVzZWQpIHtcclxuICAgICAgdGhpcy5kZWx0YVRpbWUgPSAwLjAwO1xyXG4gICAgICB0aGlzLnBhdXNlQ29sbGVjdG9yICs9IHRoaXMuZ2xvYmFsRGVsdGFUaW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy50aW1lID0gdGhpcy5nbG9iYWxUaW1lIC0gdGhpcy5zdGFydFRpbWUgLSB0aGlzLnBhdXNlQ29sbGVjdG9yO1xyXG4gICAgICB0aGlzLmRlbHRhVGltZSA9IHRoaXMuZ2xvYmFsRGVsdGFUaW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZnBzQ291bnRlcisrO1xyXG4gICAgaWYgKHRoaXMuZ2xvYmFsVGltZSAtIHRoaXMuZnBzUHJldlVwZGF0ZVRpbWUgPj0gdGhpcy5mcHNEZWx0YVRpbWUpIHtcclxuICAgICAgdGhpcy5mcHMgPSB0aGlzLmZwc0NvdW50ZXIgLyAodGhpcy5nbG9iYWxUaW1lIC0gdGhpcy5mcHNQcmV2VXBkYXRlVGltZSk7XHJcblxyXG4gICAgICB0aGlzLmZwc1ByZXZVcGRhdGVUaW1lID0gdGhpcy5nbG9iYWxUaW1lO1xyXG4gICAgICB0aGlzLmZwc0NvdW50ZXIgPSAwO1xyXG4gICAgfVxyXG4gIH0gLyogcmVzcG9uc2UgKi9cclxufSAvKiBUaW1lciAqL1xyXG5cclxuLyogdGltZXIuanMgKi8iLCJpbXBvcnQge2xvYWRTaGFkZXIsIE1hdGVyaWFsLCBQcmltaXRpdmUsIEVtcHR5UHJpbWl0aXZlLCBUb3BvbG9neSwgVmVydGV4LCBUZXh0dXJlLCBDdWJlbWFwLCBVQk8sIG10aH0gZnJvbSBcIi4vcHJpbWl0aXZlLmpzXCI7XHJcbmltcG9ydCB7VGFyZ2V0fSBmcm9tIFwiLi90YXJnZXQuanNcIjtcclxuaW1wb3J0IHtUaW1lcn0gZnJvbSBcIi4vdGltZXIuanNcIjtcclxuXHJcbmV4cG9ydCB7TWF0ZXJpYWwsIFByaW1pdGl2ZSwgRW1wdHlQcmltaXRpdmUsIFRvcG9sb2d5LCBWZXJ0ZXgsIFRleHR1cmUsIEN1YmVtYXAsIFVCTywgbXRofTtcclxuXHJcbmNvbnN0IG1hdDRJZGVudGl0eSA9IG10aC5NYXQ0LmlkZW50aXR5KCk7XHJcblxyXG5leHBvcnQgY2xhc3MgU3lzdGVtIHtcclxuICByZW5kZXJRdWV1ZTtcclxuICBtYXJrZXJSZW5kZXJRdWV1ZTtcclxuICBnbDtcclxuICBjYW1lcmE7XHJcbiAgY2FtZXJhVUJPO1xyXG5cclxuICB0YXJnZXQ7XHJcbiAgZnNNYXRlcmlhbCA9IG51bGw7XHJcblxyXG4gIHVuaXRzOyAgLy8gdW5pdCBsaXN0XHJcbiAgdGltZXI7ICAvLyB0aW1lclxyXG4gIGxhc3RVbml0SUQgPSAwO1xyXG5cclxuICBjdXJyZW50T2JqZWN0SUQgPSAwO1xyXG4gIHJlbmRlclBhcmFtcyA9IHt9O1xyXG5cclxuICBhZGRSZW5kZXJQYXJhbWV0ZXIoR0xlbnVtLCBwYXJhbU5hbWUsIGluaXRpYWxWYWx1ZSA9IHRydWUpIHtcclxuICAgIGxldCB2YWx1ZSA9ICFpbml0aWFsVmFsdWU7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnJlbmRlclBhcmFtcywgcGFyYW1OYW1lLCB7XHJcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXHJcbiAgICAgIGdldCgpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgIH0sIC8qIGdldCAqL1xyXG5cclxuICAgICAgc2V0KG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB2YWx1ZSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICBnbC5lbmFibGUoR0xlbnVtKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZ2wuZGlzYWJsZShHTGVudW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICB9IC8qIHNldCAqL1xyXG4gICAgfSk7IC8qIHByb3BlcnR5IGRlZmluaXRpb24gKi9cclxuICAgIHRoaXMucmVuZGVyUGFyYW1zW3BhcmFtTmFtZV0gPSBpbml0aWFsVmFsdWU7XHJcbiAgfSAvKiBhZGRSZW5kZXJQYXJhbWV0ZXIgKi9cclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAvLyBXZWJHTCBpbml0aWFsaXphdGlvblxyXG4gICAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG4gICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcblxyXG4gICAgY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgbGV0IGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7XHJcbiAgICBpZiAoZ2wgPT0gbnVsbCkge1xyXG4gICAgICB0aHJvdyBFcnJvcihcIkNhbid0IGluaXRpYWxpemUgV2ViR0wyXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBleHRlbnNpb25zID0gW1wiRVhUX2NvbG9yX2J1ZmZlcl9mbG9hdFwiLCBcIk9FU190ZXh0dXJlX2Zsb2F0X2xpbmVhclwiXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKylcclxuICAgICAgaWYgKGdsLmdldEV4dGVuc2lvbihleHRlbnNpb25zW2ldKSA9PSBudWxsKVxyXG4gICAgICAgIHRocm93IEVycm9yKGBcIiR7ZXh0ZW5zaW9uc1tpXX1cIiBleHRlbnNpb24gcmVxdWlyZWRgKTtcclxuXHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcblxyXG4gICAgdGhpcy5hZGRSZW5kZXJQYXJhbWV0ZXIoV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5ERVBUSF9URVNULCBcImRlcHRoVGVzdFwiLCB0cnVlKTtcclxuICAgIHRoaXMuYWRkUmVuZGVyUGFyYW1ldGVyKFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuQ1VMTF9GQUNFLCBcImN1bGxGYWNlXCIsIGZhbHNlKTtcclxuXHJcbiAgICBnbC5kZXB0aEZ1bmMoV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5MRVFVQUwpO1xyXG4gICAgLy8gZ2wuZW5hYmxlKFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuQ1VMTF9GQUNFKTtcclxuXHJcbiAgICAvLyBnbC5jdWxsRmFjZShXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkJBQ0spO1xyXG5cclxuICAgIHRoaXMucmVuZGVyUXVldWUgPSBbXTtcclxuICAgIHRoaXMubWFya2VyUmVuZGVyUXVldWUgPSBbXTtcclxuICAgIHRoaXMuY2FtZXJhID0gbmV3IG10aC5DYW1lcmEoKTtcclxuXHJcbiAgICB0aGlzLmNhbWVyYVVCTyA9IG5ldyBVQk8odGhpcy5nbCk7XHJcblxyXG4gICAgdGhpcy5jYW1lcmEucmVzaXplKG5ldyBtdGguU2l6ZShjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpKTtcclxuXHJcbiAgICAvLyB0YXJnZXRzIHNldHVwXHJcbiAgICBsZXQgc2l6ZSA9IG5ldyBtdGguU2l6ZShjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgdGhpcy50YXJnZXQgPSBuZXcgVGFyZ2V0KGdsLCAyKTtcclxuXHJcbiAgICB0aGlzLnRhcmdldC5yZXNpemUoc2l6ZSk7XHJcbiAgICBUYXJnZXQuZGVmYXVsdChnbCkucmVzaXplKHNpemUpO1xyXG5cclxuICAgIC8vIHJlc2l6ZSBoYW5kbGluZ1xyXG4gICAgd2luZG93Lm9ucmVzaXplID0gKCkgPT4ge1xyXG4gICAgICBsZXQgcmVzb2x1dGlvbiA9IG5ldyBtdGguU2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcclxuXHJcbiAgICAgIGNhbnZhcy53aWR0aCA9IHJlc29sdXRpb24udztcclxuICAgICAgY2FudmFzLmhlaWdodCA9IHJlc29sdXRpb24uaDtcclxuXHJcbiAgICAgIHRoaXMuY2FtZXJhLnJlc2l6ZShyZXNvbHV0aW9uKTtcclxuICAgICAgdGhpcy50YXJnZXQucmVzaXplKHJlc29sdXRpb24pO1xyXG4gICAgICBUYXJnZXQuZGVmYXVsdChnbCkucmVzaXplKHJlc29sdXRpb24pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVuaXRzID0ge307XHJcbiAgICB0aGlzLnRpbWVyID0gbmV3IFRpbWVyKCk7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBzdGF0aWMgaWRlbnRpdHkgPSBtdGguTWF0NC5pZGVudGl0eSgpO1xyXG5cclxuICBkcmF3UHJpbWl0aXZlKHByaW1pdGl2ZSwgdHJhbnNmb3JtID0gbWF0NElkZW50aXR5KSB7XHJcbiAgICB0aGlzLnJlbmRlclF1ZXVlLnB1c2goe1xyXG4gICAgICBwcmltaXRpdmU6IHByaW1pdGl2ZSxcclxuICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm0sXHJcbiAgICAgIGlkOiAgICAgICAgdGhpcy5jdXJyZW50T2JqZWN0SURcclxuICAgIH0pO1xyXG4gIH0gLyogZHJhd1ByaW1pdGl2ZSAqL1xyXG5cclxuICBkcmF3TWFya2VyUHJpbWl0aXZlKHByaW1pdGl2ZSwgdHJhbnNmb3JtID0gbWF0NElkZW50aXR5KSB7XHJcbiAgICB0aGlzLm1hcmtlclJlbmRlclF1ZXVlLnB1c2goe1xyXG4gICAgICBwcmltaXRpdmU6IHByaW1pdGl2ZSxcclxuICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm0sXHJcbiAgICAgIGlkOiAgICAgICAgdGhpcy5jdXJyZW50T2JqZWN0SURcclxuICAgIH0pO1xyXG4gIH0gLyogZHJhd01hcmtlclByaW1pdGl2ZSAqL1xyXG5cclxuICBjcmVhdGVUZXh0dXJlKHBhdGggPSBudWxsKSB7XHJcbiAgICBpZiAocGF0aCA9PT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gbmV3IFRleHR1cmUodGhpcy5nbCwgVGV4dHVyZS5VTlNJR05FRF9CWVRFLCA0KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxldCB0ZXggPSBuZXcgVGV4dHVyZSh0aGlzLmdsLCBUZXh0dXJlLlVOU0lHTkVEX0JZVEUsIDQpO1xyXG4gICAgICB0ZXgubG9hZChwYXRoKTtcclxuXHJcbiAgICAgIHJldHVybiB0ZXg7XHJcbiAgICB9XHJcbiAgfSAvKiBjcmVhdGVUZXh0dXJlICovXHJcblxyXG4gIGdldERlZmF1bHRUZXh0dXJlKCkge1xyXG4gICAgcmV0dXJuIFRleHR1cmUuZGVmYXVsdENoZWNrZXIodGhpcy5nbCk7XHJcbiAgfSAvKiBnZXREZWZhdWx0VGV4dHVyZSAqL1xyXG5cclxuICBjcmVhdGVDdWJlbWFwKCkge1xyXG4gICAgcmV0dXJuIG5ldyBDdWJlbWFwKHRoaXMuZ2wpO1xyXG4gIH0gLyogY3JlYXRlQ3ViZW1hcCAqL1xyXG5cclxuICBjcmVhdGVVbmlmb3JtQnVmZmVyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBVQk8odGhpcy5nbCk7XHJcbiAgfSAvKiBjcmVhdGVVbmlmb3JtQnVmZmVyICovXHJcblxyXG4gIGFzeW5jIGNyZWF0ZVNoYWRlcihwYXRoKSB7XHJcbiAgICByZXR1cm4gbG9hZFNoYWRlcih0aGlzLmdsLCBwYXRoKTtcclxuICB9IC8qIGNyZWF0ZVNoYWRlciAqL1xyXG5cclxuICBhc3luYyBjcmVhdGVNYXRlcmlhbChzaGFkZXIpIHtcclxuICAgIGlmICh0eXBlb2Yoc2hhZGVyKSA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHJldHVybiBuZXcgTWF0ZXJpYWwodGhpcy5nbCwgYXdhaXQgbG9hZFNoYWRlcih0aGlzLmdsLCBzaGFkZXIpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBuZXcgTWF0ZXJpYWwodGhpcy5nbCwgc2hhZGVyKTtcclxuICAgIH1cclxuICB9IC8qIGNyZWF0ZU1hdGVyaWFsICovXHJcblxyXG4gIGNyZWF0ZVByaW1pdGl2ZSh0b3BvbG9neSwgbWF0ZXJpYWwpIHtcclxuICAgIHJldHVybiBQcmltaXRpdmUuZnJvbVRvcG9sb2d5KHRoaXMuZ2wsIHRvcG9sb2d5LCBtYXRlcmlhbCk7XHJcbiAgfSAvKiBjcmVhdGVQcmltaXRpdmUgKi9cclxuXHJcbiAgY3JlYXRlRW1wdHlQcmltaXRpdmUodmVydGV4Q291bnQsIHRvcG9sb2d5VHlwZSwgbWF0ZXJpYWwpIHtcclxuICAgIHJldHVybiBuZXcgRW1wdHlQcmltaXRpdmUodGhpcy5nbCwgdmVydGV4Q291bnQsIHRvcG9sb2d5VHlwZSwgbWF0ZXJpYWwpO1xyXG4gIH0gLyogY3JlYXRlRW1wdHlQcmltaXRpdmUgKi9cclxuXHJcbiAgc3RhcnQoKSB7XHJcbiAgfSAvKiBzdGFydCAqL1xyXG5cclxuICBlbmQoKSB7XHJcbiAgICAvLyByZW5kZXJpbmcgaW4gdGFyZ2V0XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIHRoaXMudGFyZ2V0LmJpbmQoKTtcclxuXHJcbiAgICBsZXQgY2FtZXJhSW5mbyA9IG5ldyBGbG9hdDMyQXJyYXkoMzYpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xyXG4gICAgICBjYW1lcmFJbmZvW2kgKyAxNl0gPSB0aGlzLmNhbWVyYS52aWV3UHJvai5tW2ldO1xyXG4gICAgfVxyXG4gICAgY2FtZXJhSW5mb1szMl0gPSB0aGlzLmNhbWVyYS5sb2MueDtcclxuICAgIGNhbWVyYUluZm9bMzNdID0gdGhpcy5jYW1lcmEubG9jLnk7XHJcbiAgICBjYW1lcmFJbmZvWzM0XSA9IHRoaXMuY2FtZXJhLmxvYy56O1xyXG4gICAgY2FtZXJhSW5mb1szNV0gPSAwOyAvLyBJRCBvZiBvYmplY3RcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMCwgY291bnQgPSB0aGlzLnJlbmRlclF1ZXVlLmxlbmd0aDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgbGV0IHByaW0gPSB0aGlzLnJlbmRlclF1ZXVlW2ldLnByaW1pdGl2ZTtcclxuICAgICAgbGV0IHRyYW5zID0gdGhpcy5yZW5kZXJRdWV1ZVtpXS50cmFuc2Zvcm07XHJcbiAgICAgIFxyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcclxuICAgICAgICBjYW1lcmFJbmZvW2ldID0gdHJhbnMubVtpXTtcclxuICAgICAgfVxyXG4gICAgICBjYW1lcmFJbmZvWzM1XSA9IHRoaXMucmVuZGVyUXVldWVbaV0uaWQ7XHJcbiAgICAgIHRoaXMuY2FtZXJhVUJPLndyaXRlRGF0YShjYW1lcmFJbmZvKTtcclxuICAgICAgcHJpbS5kcmF3KHRoaXMuY2FtZXJhVUJPKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRhcmdldC5kaXNhYmxlRHJhd0J1ZmZlcigxKTtcclxuICAgIGZvciAobGV0IGkgPSAwLCBjb3VudCA9IHRoaXMubWFya2VyUmVuZGVyUXVldWUubGVuZ3RoOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICBsZXQgcHJpbSA9IHRoaXMubWFya2VyUmVuZGVyUXVldWVbaV0ucHJpbWl0aXZlO1xyXG4gICAgICBsZXQgdHJhbnMgPSB0aGlzLm1hcmtlclJlbmRlclF1ZXVlW2ldLnRyYW5zZm9ybTtcclxuICAgICAgXHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xyXG4gICAgICAgIGNhbWVyYUluZm9baV0gPSB0cmFucy5tW2ldO1xyXG4gICAgICB9XHJcbiAgICAgIGNhbWVyYUluZm9bMzVdID0gdGhpcy5tYXJrZXJSZW5kZXJRdWV1ZVtpXS5pZDtcclxuXHJcbiAgICAgIHRoaXMuY2FtZXJhVUJPLndyaXRlRGF0YShjYW1lcmFJbmZvKTtcclxuICAgICAgcHJpbS5kcmF3KHRoaXMuY2FtZXJhVUJPKTtcclxuICAgIH1cclxuICAgIHRoaXMudGFyZ2V0LmVuYWJsZURyYXdCdWZmZXIoMSk7XHJcblxyXG4gICAgLy8gZmx1c2ggcmVuZGVyIHF1ZXVlXHJcbiAgICB0aGlzLnJlbmRlclF1ZXVlID0gW107XHJcbiAgICB0aGlzLm1hcmtlclJlbmRlclF1ZXVlID0gW107XHJcblxyXG4gICAgLy8gcmVuZGVyaW5nIHRvIHNjcmVlbiBmcmFtZWJ1ZmZlclxyXG4gICAgVGFyZ2V0LmRlZmF1bHQoZ2wpLmJpbmQoKTtcclxuICAgIEVtcHR5UHJpbWl0aXZlLmRyYXdGcm9tUGFyYW1zKHRoaXMuZ2wsIDQsIFRvcG9sb2d5LlRSSUFOR0xFX1NUUklQLCB0aGlzLmZzTWF0ZXJpYWwsIHRoaXMuY2FtZXJhVUJPKTtcclxuICAgIHRoaXMuZnNNYXRlcmlhbC51bmJvdW5kVGV4dHVyZXMoKTtcclxuXHJcbiAgICBnbC5maW5pc2goKTtcclxuICB9IC8qIGVuZCAqL1xyXG5cclxuICAvLyBnZW5pb3VzIGZ1bmN0aW9uLCBidXQgaXQgd29ya3MhXHJcbiAgc3RhdGljIGFzeW5jIHVucGFja1Byb21pc2Uodikge1xyXG4gICAgcmV0dXJuIHY7XHJcbiAgfSAvKiB1bnBhY2tQcm9taXNlICovXHJcblxyXG4gIGFzeW5jIGFkZFVuaXQoY3JlYXRlRnVuY3Rpb24sIC4uLmFyZ3MpIHtcclxuICAgIGxldCB2YWwgPSBhd2FpdCBTeXN0ZW0udW5wYWNrUHJvbWlzZShjcmVhdGVGdW5jdGlvbih0aGlzLCAuLi5hcmdzKSk7XHJcblxyXG4gICAgdmFsLnN5c3RlbUlkID0gdGhpcy5sYXN0VW5pdElEKys7XHJcbiAgICBpZiAodmFsLmluaXQgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IFN5c3RlbS51bnBhY2tQcm9taXNlKHZhbC5pbml0KHRoaXMpKTtcclxuICAgIH1cclxuICAgIHRoaXMudW5pdHNbdmFsLnN5c3RlbUlkXSA9IHZhbDtcclxuXHJcbiAgICByZXR1cm4gdmFsO1xyXG4gIH0gLyogYWRkVW5pdCAqL1xyXG5cclxuICBnZXRVbml0QnlJRChpZCkge1xyXG4gICAgcmV0dXJuIHRoaXMudW5pdHNbaWRdO1xyXG4gIH0gLyogZ2V0VW5pdEJ5SUQgKi9cclxuXHJcbiAgZ2V0VW5pdEJ5Q29vcmQoeCwgeSkge1xyXG4gICAgbGV0IGlkID0gTWF0aC5yb3VuZCh0aGlzLnRhcmdldC5nZXRBdHRhY2htZW50VmFsdWUoMCwgeCwgeSlbM10pO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnVuaXRzW2lkXTtcclxuICB9IC8qIGdldFVuaXRCeU1vdXNlTG9jYXRpb24gKi9cclxuXHJcbiAgZ2V0UG9zaXRpb25CeUNvb3JkKHgsIHkpIHtcclxuICAgIGxldCBhcnIgPSB0aGlzLnRhcmdldC5nZXRBdHRhY2htZW50VmFsdWUoMSwgeCwgeSk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBtdGguVmVjMyhhcnJbMF0sIGFyclsxXSwgYXJyWzJdKTtcclxuICB9IC8qIGdldFBvc2l0aW9uQnlDb29yZCAqL1xyXG5cclxuICBhc3luYyBydW4oKSB7XHJcbiAgICAvLyBpbml0aWFsaXplIGZ1bGxzY3JlZW4gbWF0ZXJpYWxcclxuICAgIHRoaXMuZnNNYXRlcmlhbCA9IGF3YWl0IHRoaXMuY3JlYXRlTWF0ZXJpYWwoXCIuL3NoYWRlcnMvdGFyZ2V0XCIpO1xyXG4gICAgdGhpcy5mc01hdGVyaWFsLnRleHR1cmVzID0gdGhpcy50YXJnZXQuYXR0YWNobWVudHM7XHJcblxyXG4gICAgbGV0IHN5c3RlbSA9IHRoaXM7XHJcblxyXG4gICAgY29uc3QgcnVuID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHN5c3RlbS50aW1lci5yZXNwb25zZSgpO1xyXG5cclxuICAgICAgc3lzdGVtLnN0YXJ0KCk7XHJcblxyXG4gICAgICBmb3IgKGNvbnN0IGlkIGluIHN5c3RlbS51bml0cykge1xyXG4gICAgICAgIGxldCB1bml0ID0gc3lzdGVtLnVuaXRzW2lkXTtcclxuXHJcbiAgICAgICAgc3lzdGVtLmN1cnJlbnRPYmplY3RJRCA9IHVuaXQuc3lzdGVtSWQ7XHJcbiAgICAgICAgdW5pdC5yZXNwb25zZShzeXN0ZW0pO1xyXG5cclxuICAgICAgICBpZiAodW5pdC5kb1N1aWNpZGUgPT09IHRydWUpIHtcclxuICAgICAgICAgIGlmICh1bml0LmNsb3NlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdW5pdC5jbG9zZShzeXN0ZW0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZGVsZXRlIHN5c3RlbS51bml0c1tpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBzeXN0ZW0uZW5kKCk7XHJcblxyXG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJ1bik7XHJcbiAgICB9O1xyXG5cclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocnVuKTtcclxuICB9IC8qIHJ1biAqL1xyXG59IC8qIFJlbmRlciAqL1xyXG5cclxuLyogcmVuZGVyLmpzICovIiwiaW1wb3J0ICogYXMgbXRoIGZyb20gXCIuL3N5c3RlbS9tdGguanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBBcmNiYWxsIHtcclxuICAgIC8vIGNhbWVyYSB1bml0XHJcbiAgICBzdGF0aWMgY3JlYXRlKCkge1xyXG4gICAgY29uc3QgdXAgPSBuZXcgbXRoLlZlYzMoMCwgMSwgMCk7XHJcbiAgICBsZXQgbG9jID0gbmV3IG10aC5WZWMzKDMwLCAzMCwgMzApLCBhdCA9IG5ldyBtdGguVmVjMygwLCAwLCAwKTtcclxuICAgIGxldCByYWRpdXMgPSBhdC5zdWIobG9jKS5sZW5ndGgoKTtcclxuXHJcbiAgICBsZXQgY2FtZXJhID0ge1xyXG4gICAgICByZXNwb25zZShzeXN0ZW0pIHtcclxuICAgICAgICBzeXN0ZW0uY2FtZXJhLnNldChsb2MsIGF0LCB1cCk7XHJcbiAgICAgIH0gLyogcmVzcG9uc2UgKi9cclxuICAgIH07XHJcbiAgICBcclxuICAgIGNvbnN0IG9uTW91c2VNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKGV2ZW50LmFsdEtleSB8fCBldmVudC5zaGlmdEtleSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKChldmVudC5idXR0b25zICYgMSkgPT0gMSkgeyAvLyByb3RhdGVcclxuICAgICAgICBsZXQgZGlyZWN0aW9uID0gbG9jLnN1YihhdCk7XHJcblxyXG4gICAgICAgIC8vIHR1cm4gZGlyZWN0aW9uIHRvIHBvbGFyIGNvb3JkaW5hdGUgc3lzdGVtXHJcbiAgICAgICAgcmFkaXVzID0gZGlyZWN0aW9uLmxlbmd0aCgpO1xyXG4gICAgICAgIGxldFxyXG4gICAgICAgICAgYXppbXV0aCAgPSBNYXRoLnNpZ24oZGlyZWN0aW9uLnopICogTWF0aC5hY29zKGRpcmVjdGlvbi54IC8gTWF0aC5zcXJ0KGRpcmVjdGlvbi54ICogZGlyZWN0aW9uLnggKyBkaXJlY3Rpb24ueiAqIGRpcmVjdGlvbi56KSksXHJcbiAgICAgICAgICBlbGV2YXRvciA9IE1hdGguYWNvcyhkaXJlY3Rpb24ueSAvIGRpcmVjdGlvbi5sZW5ndGgoKSk7XHJcblxyXG4gICAgICAgICAgLy8gcm90YXRlIGRpcmVjdGlvblxyXG4gICAgICAgICAgYXppbXV0aCAgKz0gZXZlbnQubW92ZW1lbnRYIC8gMjAwLjA7XHJcbiAgICAgICAgZWxldmF0b3IgLT0gZXZlbnQubW92ZW1lbnRZIC8gMjAwLjA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxldmF0b3IgPSBNYXRoLm1pbihNYXRoLm1heChlbGV2YXRvciwgMC4wMSksIE1hdGguUEkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHJlc3RvcmUgZGlyZWN0aW9uXHJcbiAgICAgICAgZGlyZWN0aW9uLnggPSByYWRpdXMgKiBNYXRoLnNpbihlbGV2YXRvcikgKiBNYXRoLmNvcyhhemltdXRoKTtcclxuICAgICAgICBkaXJlY3Rpb24ueSA9IHJhZGl1cyAqIE1hdGguY29zKGVsZXZhdG9yKTtcclxuICAgICAgICBkaXJlY3Rpb24ueiA9IHJhZGl1cyAqIE1hdGguc2luKGVsZXZhdG9yKSAqIE1hdGguc2luKGF6aW11dGgpO1xyXG5cclxuICAgICAgICBsb2MgPSBhdC5hZGQoZGlyZWN0aW9uKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgaWYgKChldmVudC5idXR0b25zICYgMikgPT0gMikgeyAvLyBtb3ZlXHJcbiAgICAgICAgbGV0IGRpciA9IGF0LnN1Yihsb2MpLm5vcm1hbGl6ZSgpO1xyXG4gICAgICAgIGxldCByZ2ggPSBkaXIuY3Jvc3ModXApLm5vcm1hbGl6ZSgpO1xyXG4gICAgICAgIGxldCB0dXAgPSByZ2guY3Jvc3MoZGlyKTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgZGVsdGEgPSByZ2gubXVsKC1ldmVudC5tb3ZlbWVudFggKiByYWRpdXMgLyAzMDAuMCkuYWRkKHR1cC5tdWwoZXZlbnQubW92ZW1lbnRZICogcmFkaXVzIC8gMzAwLjApKTtcclxuICAgICAgICBsb2MgPSBsb2MuYWRkKGRlbHRhKTtcclxuICAgICAgICBhdCA9IGF0LmFkZChkZWx0YSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgY29uc3Qgb25XaGVlbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIGxldCBkZWx0YSA9IGV2ZW50LmRlbHRhWSAvIDUwMDAuMDtcclxuXHJcbiAgICAgIGxvYyA9IGxvYy5zdWIoYXQuc3ViKGxvYykubXVsKGRlbHRhKSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcbiAgICBcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgb25XaGVlbCk7XHJcbiAgICBcclxuICAgIHJldHVybiBjYW1lcmE7XHJcbiAgfVxyXG59IC8qIEFyY2JhbGwgKi9cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUm90YXRvciB7XHJcbiAgLy8gY2FtZXJhIHVuaXRcclxuICBzdGF0aWMgY3JlYXRlKCkge1xyXG4gICAgY29uc3QgdXAgPSBuZXcgbXRoLlZlYzMoMCwgMSwgMCk7XHJcbiAgICBsZXQgcmFkaXVzID0gMTtcclxuXHJcbiAgICBsZXQgY2FtZXJhID0ge1xyXG4gICAgICBsb2M6IG5ldyBtdGguVmVjMygzMCwgMzAsIDMwKSxcclxuICAgICAgYXQ6IG5ldyBtdGguVmVjMygwLCAwLCAwKSxcclxuICAgICAgcHJvalNpemU6IDEsXHJcbiAgICAgIHJlc3BvbnNlKHN5c3RlbSkge1xyXG4gICAgICAgIHN5c3RlbS5jYW1lcmEuc2V0KGNhbWVyYS5sb2MsIGNhbWVyYS5hdCwgdXApO1xyXG4gICAgICAgIHN5c3RlbS5jYW1lcmEucHJvalNldCgxLCAxMDAsIG5ldyBtdGguU2l6ZShjYW1lcmEucHJvalNpemUsIGNhbWVyYS5wcm9qU2l6ZSkpO1xyXG4gICAgICB9IC8qIHJlc3BvbnNlICovXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IG9uTW91c2VNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKChldmVudC5idXR0b25zICYgMSkgPT0gMSkgeyAvLyByb3RhdGVcclxuICAgICAgICBsZXQgZGlyZWN0aW9uID0gY2FtZXJhLmxvYy5zdWIoY2FtZXJhLmF0KTtcclxuXHJcbiAgICAgICAgLy8gdHVybiBkaXJlY3Rpb24gdG8gcG9sYXIgY29vcmRpbmF0ZSBzeXN0ZW1cclxuICAgICAgICByYWRpdXMgPSBkaXJlY3Rpb24ubGVuZ3RoKCk7XHJcbiAgICAgICAgbGV0XHJcbiAgICAgICAgICBhemltdXRoICA9IE1hdGguc2lnbihkaXJlY3Rpb24ueikgKiBNYXRoLmFjb3MoZGlyZWN0aW9uLnggLyBNYXRoLnNxcnQoZGlyZWN0aW9uLnggKiBkaXJlY3Rpb24ueCArIGRpcmVjdGlvbi56ICogZGlyZWN0aW9uLnopKSxcclxuICAgICAgICAgIGVsZXZhdG9yID0gTWF0aC5hY29zKGRpcmVjdGlvbi55IC8gZGlyZWN0aW9uLmxlbmd0aCgpKTtcclxuXHJcbiAgICAgICAgLy8gcm90YXRlIGRpcmVjdGlvblxyXG4gICAgICAgIGF6aW11dGggIC09IGV2ZW50Lm1vdmVtZW50WCAvIDIwMC4wO1xyXG4gICAgICAgIGVsZXZhdG9yICs9IGV2ZW50Lm1vdmVtZW50WSAvIDIwMC4wO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsZXZhdG9yID0gTWF0aC5taW4oTWF0aC5tYXgoZWxldmF0b3IsIDAuMDEpLCBNYXRoLlBJKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyByZXN0b3JlIGRpcmVjdGlvblxyXG4gICAgICAgIGRpcmVjdGlvbi54ID0gcmFkaXVzICogTWF0aC5zaW4oZWxldmF0b3IpICogTWF0aC5jb3MoYXppbXV0aCk7XHJcbiAgICAgICAgZGlyZWN0aW9uLnkgPSByYWRpdXMgKiBNYXRoLmNvcyhlbGV2YXRvcik7XHJcbiAgICAgICAgZGlyZWN0aW9uLnogPSByYWRpdXMgKiBNYXRoLnNpbihlbGV2YXRvcikgKiBNYXRoLnNpbihhemltdXRoKTtcclxuXHJcbiAgICAgICAgY2FtZXJhLmxvYyA9IGNhbWVyYS5hdC5hZGQoZGlyZWN0aW9uKTtcclxuICAgICAgfVxyXG4gICAgfTsgLyogb25Nb3VzZU1vdmUgKi9cclxuXHJcbiAgICBjb25zdCBjbGFtcCA9IChudW1iZXIsIG1pbkJvcmRlciwgbWF4Qm9yZGVyKSA9PiB7XHJcbiAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChudW1iZXIsIG1pbkJvcmRlciksIG1heEJvcmRlcik7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IG9uV2hlZWwgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBsZXQgZGVsdGEgPSBldmVudC5kZWx0YVkgLyA3MDAuMDtcclxuXHJcbiAgICAgIGNhbWVyYS5wcm9qU2l6ZSArPSBjYW1lcmEucHJvalNpemUgKiBkZWx0YTtcclxuICAgICAgY2FtZXJhLnByb2pTaXplID0gY2xhbXAoY2FtZXJhLnByb2pTaXplLCAwLjEsIDEpO1xyXG4gICAgfTsgLyogb25XaGVlbCAqL1xyXG5cclxuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuXHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvbk1vdXNlTW92ZSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIG9uV2hlZWwpO1xyXG5cclxuICAgIHJldHVybiBjYW1lcmE7XHJcbiAgfSAvKiBjcmVhdGUgKi9cclxufSAvKiBBcmNiYWxsICovXHJcblxyXG4vKiBjYW1lcmFfY29udHJvbGxlci5qcyAqLyIsImltcG9ydCAqIGFzIHJuZCBmcm9tIFwiLi9zeXN0ZW0vc3lzdGVtLmpzXCI7XHJcblxyXG5sZXQgYmFubmVyU2hhZGVyID0gbnVsbDtcclxuXHJcbmV4cG9ydCBjbGFzcyBCYW5uZXIge1xyXG4gIHN0YXRpYyBhc3luYyBjcmVhdGUoc3lzdGVtLCBiYW5uZXJDb250ZW50LCBwb3NpdGlvbiwgaGVpZ2h0ID0gMCkge1xyXG4gICAgaWYgKGJhbm5lclNoYWRlciA9PT0gbnVsbCkge1xyXG4gICAgICBiYW5uZXJTaGFkZXIgPSBhd2FpdCBzeXN0ZW0uY3JlYXRlU2hhZGVyKFwiLi9zaGFkZXJzL2Jhbm5lclwiKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY29udGVudCA9IGJhbm5lckNvbnRlbnQ7XHJcbiAgICBsZXQgaW5mb1ByaW0sIG10bDtcclxuICAgIGxldCB1bml0ID0gYXdhaXQgc3lzdGVtLmFkZFVuaXQoKCkgPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHNob3c6IHRydWUsXHJcbiAgICAgICAgdHlwZTogXCJiYW5uZXJcIixcclxuICAgICAgICBwb3M6IHBvc2l0aW9uLmNvcHkoKSxcclxuICAgICAgICBoZWlnaHQ6IGhlaWdodCxcclxuXHJcbiAgICAgICAgYXN5bmMgaW5pdChzeXN0ZW0pIHtcclxuICAgICAgICAgIG10bCA9IGF3YWl0IHN5c3RlbS5jcmVhdGVNYXRlcmlhbChiYW5uZXJTaGFkZXIpO1xyXG4gICAgICAgICAgbXRsLnVibyA9IHN5c3RlbS5jcmVhdGVVbmlmb3JtQnVmZmVyKCk7XHJcbiAgICAgICAgICBtdGwudWJvTmFtZU9uU2hhZGVyID0gXCJiYW5uZXJCdWZmZXJcIjtcclxuXHJcbiAgICAgICAgICBpbmZvUHJpbSA9IHN5c3RlbS5jcmVhdGVFbXB0eVByaW1pdGl2ZSg0LCBybmQuVG9wb2xvZ3kuVFJJQU5HTEVfU1RSSVAsIG10bCk7XHJcblxyXG4gICAgICAgICAgbXRsLnRleHR1cmVzLnB1c2goc3lzdGVtLmNyZWF0ZVRleHR1cmUoKSk7XHJcbiAgICAgICAgfSwgLyogaW5pdCAqL1xyXG5cclxuICAgICAgICByZXNwb25zZShzeXN0ZW0pIHtcclxuICAgICAgICAgIGlmICh1bml0LnNob3cpIHtcclxuICAgICAgICAgICAgbGV0IHVwID0gc3lzdGVtLmNhbWVyYS51cDtcclxuICAgICAgICAgICAgbGV0IHJnaCA9IHN5c3RlbS5jYW1lcmEucmlnaHQubXVsKGNvbnRlbnQubGVuZ3RoIC8gMy4wKTtcclxuICAgICAgICAgICAgbGV0IHBvcyA9IHVuaXQucG9zO1xyXG4gICAgICAgICAgICBsZXQgZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gICAgICAgICAgICAgIHVwLngsICB1cC55LCAgdXAueiwgIDEsXHJcbiAgICAgICAgICAgICAgcmdoLngsIHJnaC55LCByZ2gueiwgMSxcclxuICAgICAgICAgICAgICBwb3MueCwgcG9zLnksIHBvcy56LCB1bml0LmhlaWdodFxyXG4gICAgICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgICAgIG10bC51Ym8ud3JpdGVEYXRhKGRhdGEpO1xyXG4gICAgICAgICAgICBzeXN0ZW0uZHJhd01hcmtlclByaW1pdGl2ZShpbmZvUHJpbSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSAvKiByZXNwb25zZSAqL1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHVuaXQsIFwiY29udGVudFwiLCB7XHJcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coY29udGVudCk7XHJcbiAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBzZXQ6IGZ1bmN0aW9uKG5ld0NvbnRlbnQpIHtcclxuICAgICAgICBsZXQgdGV4ID0gbXRsLnRleHR1cmVzWzBdO1xyXG5cclxuICAgICAgICBsZXQgY3R4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKS5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgICAgIGN0eC5jYW52YXMud2lkdGggPSA0MCAqIG5ld0NvbnRlbnQubGVuZ3RoO1xyXG4gICAgICAgIGN0eC5jYW52YXMuaGVpZ2h0ID0gMTIwO1xyXG4gIFxyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSAnIzAwMDAwMCc7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGN0eC5jYW52YXMud2lkdGgsIGN0eC5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICBjdHguZm9udCA9IGAke2N0eC5jYW52YXMuaGVpZ2h0ICogMC41fXB4IGNvbnNvbGFzYDtcclxuICAgICAgICBjdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICBjdHgudGV4dEJhc2VsaW5lID0gXCJtaWRkbGVcIjtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gJyNGRkZGRkYnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN0eC5maWxsVGV4dChuZXdDb250ZW50LCBjdHguY2FudmFzLndpZHRoIC8gMiwgY3R4LmNhbnZhcy5oZWlnaHQgLyAyKTtcclxuICAgICAgICB0ZXguZnJvbUltYWdlKGN0eC5jYW52YXMpO1xyXG4gICAgICAgIGN0eC5jYW52YXMucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIGNvbnRlbnQgPSBuZXdDb250ZW50O1xyXG4gICAgICB9IC8qIHNldCAqL1xyXG4gICAgfSk7XHJcbiAgICB1bml0LmNvbnRlbnQgPSBjb250ZW50O1xyXG5cclxuICAgIHJldHVybiB1bml0O1xyXG4gIH0gLyogYWRkQmFubmVyICovXHJcbn0gLyogQmFubmVyICovXHJcblxyXG4vKiBiYW5uZXIuanMgKi8iLCJpbXBvcnQgKiBhcyBybmQgZnJvbSBcIi4vc3lzdGVtL3N5c3RlbS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNreXNwaGVyZSB7XHJcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZShzeXN0ZW0sIGZpbGVQYXRoID0gbnVsbCkge1xyXG4gICAgbGV0IG10bCwgdGV4LCBwcmltLCBzcGhlcmU7XHJcbiAgICBsZXQgc2xpZGVTdGFydFRpbWUgPSAwLjAsIHNsaWRlRHVyYXRpb24gPSAwLCBzbGlkZVJvdGF0aW9uO1xyXG4gICAgbGV0IGRvU2xpZGUgPSBmYWxzZTtcclxuXHJcbiAgICByZXR1cm4gc3BoZXJlID0ge1xyXG4gICAgICB0eXBlOiBcInNreXNwaGVyZVwiLFxyXG4gICAgICBuYW1lOiBcIlwiLFxyXG4gICAgICB0ZXh0dXJlOiBudWxsLFxyXG4gICAgICByb3RhdGlvbjogMCxcclxuXHJcbiAgICAgIGFzeW5jIGluaXQoc3lzdGVtKSB7XHJcbiAgICAgICAgbXRsID0gYXdhaXQgc3lzdGVtLmNyZWF0ZU1hdGVyaWFsKFwiLi9zaGFkZXJzL3NreXNwaGVyZVwiKTtcclxuXHJcbiAgICAgICAgdGV4ID0gYXdhaXQgc3lzdGVtLmNyZWF0ZVRleHR1cmUoZmlsZVBhdGgpO1xyXG5cclxuICAgICAgICBtdGwudGV4dHVyZXMucHVzaCh0ZXgpO1xyXG4gICAgICAgIG10bC51Ym8gPSBzeXN0ZW0uY3JlYXRlVW5pZm9ybUJ1ZmZlcigpO1xyXG4gICAgICAgIG10bC51Ym9OYW1lT25TaGFkZXIgPSBcInByb2plY3Rpb25JbmZvXCI7XHJcblxyXG4gICAgICAgIHByaW0gPSBhd2FpdCBzeXN0ZW0uY3JlYXRlRW1wdHlQcmltaXRpdmUoNCwgcm5kLlRvcG9sb2d5LlRSSUFOR0xFX1NUUklQLCBtdGwpO1xyXG5cclxuICAgICAgICBzcGhlcmUudGV4dHVyZSA9IHRleDtcclxuICAgICAgICBzcGhlcmUubmFtZSA9IGBza3lzcGhlcmUjJHtmaWxlUGF0aH1gO1xyXG4gICAgICB9LCAvKiBpbml0ICovXHJcblxyXG4gICAgICAvLyBzbGlkaW5nIHRvIGFub3RoZXIgc2t5c3BoZXJlIGZ1bmN0aW9uXHJcbiAgICAgIGFzeW5jIHNsaWRlKG5ld1RleHR1cmVQYXRoLCBuZXdUZXh0dXJlUm90YXRpb24sIGR1cmF0aW9uID0gMC4zMykge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAvLyBhZGQgbmV3IHRleHR1cmVcclxuICAgICAgICAgIGxldCBuZXdUZXh0dXJlID0gYXdhaXQgc3lzdGVtLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgICAgIGF3YWl0IG5ld1RleHR1cmUubG9hZChuZXdUZXh0dXJlUGF0aCk7XHJcbiAgICAgICAgICBtdGwudGV4dHVyZXMucHVzaChuZXdUZXh0dXJlKTtcclxuICBcclxuICAgICAgICAgIHNsaWRlU3RhcnRUaW1lID0gbnVsbDtcclxuICAgICAgICAgIHNsaWRlRHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICAgICAgICAgIHNsaWRlUm90YXRpb24gPSBuZXdUZXh0dXJlUm90YXRpb247XHJcbiAgICAgICAgICBkb1NsaWRlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzbGlkZSBlbmRcIik7XHJcbiAgICAgICAgICAgIG10bC50ZXh0dXJlcy5zaGlmdCgpO1xyXG4gICAgICAgICAgICBkb1NsaWRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHNwaGVyZS5yb3RhdGlvbiA9IHNsaWRlUm90YXRpb247XHJcblxyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9LCBkdXJhdGlvbiAqIDEwMDAuMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sIC8qIHNsaWRlICovXHJcblxyXG4gICAgICByZXNwb25zZShzeXN0ZW0pIHtcclxuICAgICAgICAvLyAncGVyc3BlY3RpdmUtY29ycmVjdCcgZGlyZWN0aW9uIHZlY3RvcnNcclxuICAgICAgICBsZXQgZGlyID0gc3lzdGVtLmNhbWVyYS5kaXIubXVsKHN5c3RlbS5jYW1lcmEubmVhcik7XHJcbiAgICAgICAgbGV0IHJnaCA9IHN5c3RlbS5jYW1lcmEucmlnaHQubXVsKHN5c3RlbS5jYW1lcmEuY29ycmVjdGVkUHJvalNpemUudyk7XHJcbiAgICAgICAgbGV0IHR1cCA9IHN5c3RlbS5jYW1lcmEudXAubXVsKHN5c3RlbS5jYW1lcmEuY29ycmVjdGVkUHJvalNpemUuaCk7XHJcblxyXG4gICAgICAgIGlmIChkb1NsaWRlKSB7XHJcbiAgICAgICAgICBpZiAoc2xpZGVTdGFydFRpbWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgc2xpZGVTdGFydFRpbWUgPSBzeXN0ZW0udGltZXIudGltZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgc2xpZGVDb2VmZmljZW50ID0gKHN5c3RlbS50aW1lci50aW1lIC0gc2xpZGVTdGFydFRpbWUpIC8gc2xpZGVEdXJhdGlvbjtcclxuXHJcbiAgICAgICAgICBtdGwudWJvLndyaXRlRGF0YShuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgZGlyLngsIGRpci55LCBkaXIueiwgMS4wLFxyXG4gICAgICAgICAgICByZ2gueCwgcmdoLnksIHJnaC56LCBzbGlkZUNvZWZmaWNlbnQsXHJcbiAgICAgICAgICAgIHR1cC54LCB0dXAueSwgdHVwLnosXHJcbiAgICAgICAgICAgIHNwaGVyZS5yb3RhdGlvbixcclxuICAgICAgICAgICAgc2xpZGVSb3RhdGlvblxyXG4gICAgICAgICAgXSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBtdGwudWJvLndyaXRlRGF0YShuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgZGlyLngsIGRpci55LCBkaXIueiwgMCxcclxuICAgICAgICAgICAgcmdoLngsIHJnaC55LCByZ2gueiwgMCxcclxuICAgICAgICAgICAgdHVwLngsIHR1cC55LCB0dXAueixcclxuICAgICAgICAgICAgc3BoZXJlLnJvdGF0aW9uLFxyXG4gICAgICAgICAgICAwXHJcbiAgICAgICAgICBdKSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgc3lzdGVtLmRyYXdNYXJrZXJQcmltaXRpdmUocHJpbSk7XHJcbiAgICAgIH0gLyogcmVzcG9uc2UgKi9cclxuICAgIH07IC8qIF90aGlzICovXHJcbiAgfSAvKiBjcmVhdGUgKi9cclxufSAvKiBTa3lzcGhlcmUgKi9cclxuXHJcbi8qIHNreXNwaGVyZS5qcyAqLyIsImNvbnN0IFBBQ0tFVF9UWVBFUyA9IE9iamVjdC5jcmVhdGUobnVsbCk7IC8vIG5vIE1hcCA9IG5vIHBvbHlmaWxsXG5QQUNLRVRfVFlQRVNbXCJvcGVuXCJdID0gXCIwXCI7XG5QQUNLRVRfVFlQRVNbXCJjbG9zZVwiXSA9IFwiMVwiO1xuUEFDS0VUX1RZUEVTW1wicGluZ1wiXSA9IFwiMlwiO1xuUEFDS0VUX1RZUEVTW1wicG9uZ1wiXSA9IFwiM1wiO1xuUEFDS0VUX1RZUEVTW1wibWVzc2FnZVwiXSA9IFwiNFwiO1xuUEFDS0VUX1RZUEVTW1widXBncmFkZVwiXSA9IFwiNVwiO1xuUEFDS0VUX1RZUEVTW1wibm9vcFwiXSA9IFwiNlwiO1xuY29uc3QgUEFDS0VUX1RZUEVTX1JFVkVSU0UgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuT2JqZWN0LmtleXMoUEFDS0VUX1RZUEVTKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgUEFDS0VUX1RZUEVTX1JFVkVSU0VbUEFDS0VUX1RZUEVTW2tleV1dID0ga2V5O1xufSk7XG5jb25zdCBFUlJPUl9QQUNLRVQgPSB7IHR5cGU6IFwiZXJyb3JcIiwgZGF0YTogXCJwYXJzZXIgZXJyb3JcIiB9O1xuZXhwb3J0IHsgUEFDS0VUX1RZUEVTLCBQQUNLRVRfVFlQRVNfUkVWRVJTRSwgRVJST1JfUEFDS0VUIH07XG4iLCJpbXBvcnQgeyBQQUNLRVRfVFlQRVMgfSBmcm9tIFwiLi9jb21tb25zLmpzXCI7XG5jb25zdCB3aXRoTmF0aXZlQmxvYiA9IHR5cGVvZiBCbG9iID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEJsb2IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKEJsb2IpID09PSBcIltvYmplY3QgQmxvYkNvbnN0cnVjdG9yXVwiKTtcbmNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuLy8gQXJyYXlCdWZmZXIuaXNWaWV3IG1ldGhvZCBpcyBub3QgZGVmaW5lZCBpbiBJRTEwXG5jb25zdCBpc1ZpZXcgPSBvYmogPT4ge1xuICAgIHJldHVybiB0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBBcnJheUJ1ZmZlci5pc1ZpZXcob2JqKVxuICAgICAgICA6IG9iaiAmJiBvYmouYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG59O1xuY29uc3QgZW5jb2RlUGFja2V0ID0gKHsgdHlwZSwgZGF0YSB9LCBzdXBwb3J0c0JpbmFyeSwgY2FsbGJhY2spID0+IHtcbiAgICBpZiAod2l0aE5hdGl2ZUJsb2IgJiYgZGF0YSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgaWYgKHN1cHBvcnRzQmluYXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQmxvYkFzQmFzZTY0KGRhdGEsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh3aXRoTmF0aXZlQXJyYXlCdWZmZXIgJiZcbiAgICAgICAgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBpc1ZpZXcoZGF0YSkpKSB7XG4gICAgICAgIGlmIChzdXBwb3J0c0JpbmFyeSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZUJsb2JBc0Jhc2U2NChuZXcgQmxvYihbZGF0YV0pLCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcGxhaW4gc3RyaW5nXG4gICAgcmV0dXJuIGNhbGxiYWNrKFBBQ0tFVF9UWVBFU1t0eXBlXSArIChkYXRhIHx8IFwiXCIpKTtcbn07XG5jb25zdCBlbmNvZGVCbG9iQXNCYXNlNjQgPSAoZGF0YSwgY2FsbGJhY2spID0+IHtcbiAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGZpbGVSZWFkZXIucmVzdWx0LnNwbGl0KFwiLFwiKVsxXTtcbiAgICAgICAgY2FsbGJhY2soXCJiXCIgKyAoY29udGVudCB8fCBcIlwiKSk7XG4gICAgfTtcbiAgICByZXR1cm4gZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGRhdGEpO1xufTtcbmZ1bmN0aW9uIHRvQXJyYXkoZGF0YSkge1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShkYXRhKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShkYXRhLmJ1ZmZlciwgZGF0YS5ieXRlT2Zmc2V0LCBkYXRhLmJ5dGVMZW5ndGgpO1xuICAgIH1cbn1cbmxldCBURVhUX0VOQ09ERVI7XG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUGFja2V0VG9CaW5hcnkocGFja2V0LCBjYWxsYmFjaykge1xuICAgIGlmICh3aXRoTmF0aXZlQmxvYiAmJiBwYWNrZXQuZGF0YSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgcmV0dXJuIHBhY2tldC5kYXRhXG4gICAgICAgICAgICAuYXJyYXlCdWZmZXIoKVxuICAgICAgICAgICAgLnRoZW4odG9BcnJheSlcbiAgICAgICAgICAgIC50aGVuKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgZWxzZSBpZiAod2l0aE5hdGl2ZUFycmF5QnVmZmVyICYmXG4gICAgICAgIChwYWNrZXQuZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGlzVmlldyhwYWNrZXQuZGF0YSkpKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh0b0FycmF5KHBhY2tldC5kYXRhKSk7XG4gICAgfVxuICAgIGVuY29kZVBhY2tldChwYWNrZXQsIGZhbHNlLCBlbmNvZGVkID0+IHtcbiAgICAgICAgaWYgKCFURVhUX0VOQ09ERVIpIHtcbiAgICAgICAgICAgIFRFWFRfRU5DT0RFUiA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKFRFWFRfRU5DT0RFUi5lbmNvZGUoZW5jb2RlZCkpO1xuICAgIH0pO1xufVxuZXhwb3J0IHsgZW5jb2RlUGFja2V0IH07XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NrZXRpby9iYXNlNjQtYXJyYXlidWZmZXJcbmNvbnN0IGNoYXJzID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuLy8gVXNlIGEgbG9va3VwIHRhYmxlIHRvIGZpbmQgdGhlIGluZGV4LlxuY29uc3QgbG9va3VwID0gdHlwZW9mIFVpbnQ4QXJyYXkgPT09ICd1bmRlZmluZWQnID8gW10gOiBuZXcgVWludDhBcnJheSgyNTYpO1xuZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFycy5sZW5ndGg7IGkrKykge1xuICAgIGxvb2t1cFtjaGFycy5jaGFyQ29kZUF0KGkpXSA9IGk7XG59XG5leHBvcnQgY29uc3QgZW5jb2RlID0gKGFycmF5YnVmZmVyKSA9PiB7XG4gICAgbGV0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpLCBpLCBsZW4gPSBieXRlcy5sZW5ndGgsIGJhc2U2NCA9ICcnO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gMykge1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaV0gPj4gMl07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2ldICYgMykgPDwgNCkgfCAoYnl0ZXNbaSArIDFdID4+IDQpXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaSArIDFdICYgMTUpIDw8IDIpIHwgKGJ5dGVzW2kgKyAyXSA+PiA2KV07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpICsgMl0gJiA2M107XG4gICAgfVxuICAgIGlmIChsZW4gJSAzID09PSAyKSB7XG4gICAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDEpICsgJz0nO1xuICAgIH1cbiAgICBlbHNlIGlmIChsZW4gJSAzID09PSAxKSB7XG4gICAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDIpICsgJz09JztcbiAgICB9XG4gICAgcmV0dXJuIGJhc2U2NDtcbn07XG5leHBvcnQgY29uc3QgZGVjb2RlID0gKGJhc2U2NCkgPT4ge1xuICAgIGxldCBidWZmZXJMZW5ndGggPSBiYXNlNjQubGVuZ3RoICogMC43NSwgbGVuID0gYmFzZTY0Lmxlbmd0aCwgaSwgcCA9IDAsIGVuY29kZWQxLCBlbmNvZGVkMiwgZW5jb2RlZDMsIGVuY29kZWQ0O1xuICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDFdID09PSAnPScpIHtcbiAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG4gICAgICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDJdID09PSAnPScpIHtcbiAgICAgICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGFycmF5YnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmZlckxlbmd0aCksIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgICAgICBlbmNvZGVkMSA9IGxvb2t1cFtiYXNlNjQuY2hhckNvZGVBdChpKV07XG4gICAgICAgIGVuY29kZWQyID0gbG9va3VwW2Jhc2U2NC5jaGFyQ29kZUF0KGkgKyAxKV07XG4gICAgICAgIGVuY29kZWQzID0gbG9va3VwW2Jhc2U2NC5jaGFyQ29kZUF0KGkgKyAyKV07XG4gICAgICAgIGVuY29kZWQ0ID0gbG9va3VwW2Jhc2U2NC5jaGFyQ29kZUF0KGkgKyAzKV07XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoZW5jb2RlZDEgPDwgMikgfCAoZW5jb2RlZDIgPj4gNCk7XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoKGVuY29kZWQyICYgMTUpIDw8IDQpIHwgKGVuY29kZWQzID4+IDIpO1xuICAgICAgICBieXRlc1twKytdID0gKChlbmNvZGVkMyAmIDMpIDw8IDYpIHwgKGVuY29kZWQ0ICYgNjMpO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXlidWZmZXI7XG59O1xuIiwiaW1wb3J0IHsgRVJST1JfUEFDS0VULCBQQUNLRVRfVFlQRVNfUkVWRVJTRSB9IGZyb20gXCIuL2NvbW1vbnMuanNcIjtcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gXCIuL2NvbnRyaWIvYmFzZTY0LWFycmF5YnVmZmVyLmpzXCI7XG5jb25zdCB3aXRoTmF0aXZlQXJyYXlCdWZmZXIgPSB0eXBlb2YgQXJyYXlCdWZmZXIgPT09IFwiZnVuY3Rpb25cIjtcbmV4cG9ydCBjb25zdCBkZWNvZGVQYWNrZXQgPSAoZW5jb2RlZFBhY2tldCwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIGlmICh0eXBlb2YgZW5jb2RlZFBhY2tldCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICBkYXRhOiBtYXBCaW5hcnkoZW5jb2RlZFBhY2tldCwgYmluYXJ5VHlwZSlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgdHlwZSA9IGVuY29kZWRQYWNrZXQuY2hhckF0KDApO1xuICAgIGlmICh0eXBlID09PSBcImJcIikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICBkYXRhOiBkZWNvZGVCYXNlNjRQYWNrZXQoZW5jb2RlZFBhY2tldC5zdWJzdHJpbmcoMSksIGJpbmFyeVR5cGUpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHBhY2tldFR5cGUgPSBQQUNLRVRfVFlQRVNfUkVWRVJTRVt0eXBlXTtcbiAgICBpZiAoIXBhY2tldFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIEVSUk9SX1BBQ0tFVDtcbiAgICB9XG4gICAgcmV0dXJuIGVuY29kZWRQYWNrZXQubGVuZ3RoID4gMVxuICAgICAgICA/IHtcbiAgICAgICAgICAgIHR5cGU6IFBBQ0tFVF9UWVBFU19SRVZFUlNFW3R5cGVdLFxuICAgICAgICAgICAgZGF0YTogZW5jb2RlZFBhY2tldC5zdWJzdHJpbmcoMSlcbiAgICAgICAgfVxuICAgICAgICA6IHtcbiAgICAgICAgICAgIHR5cGU6IFBBQ0tFVF9UWVBFU19SRVZFUlNFW3R5cGVdXG4gICAgICAgIH07XG59O1xuY29uc3QgZGVjb2RlQmFzZTY0UGFja2V0ID0gKGRhdGEsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBpZiAod2l0aE5hdGl2ZUFycmF5QnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IGRlY29kZWQgPSBkZWNvZGUoZGF0YSk7XG4gICAgICAgIHJldHVybiBtYXBCaW5hcnkoZGVjb2RlZCwgYmluYXJ5VHlwZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4geyBiYXNlNjQ6IHRydWUsIGRhdGEgfTsgLy8gZmFsbGJhY2sgZm9yIG9sZCBicm93c2Vyc1xuICAgIH1cbn07XG5jb25zdCBtYXBCaW5hcnkgPSAoZGF0YSwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIHN3aXRjaCAoYmluYXJ5VHlwZSkge1xuICAgICAgICBjYXNlIFwiYmxvYlwiOlxuICAgICAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgICAgICAgICAgLy8gZnJvbSBXZWJTb2NrZXQgKyBiaW5hcnlUeXBlIFwiYmxvYlwiXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIEhUVFAgbG9uZy1wb2xsaW5nIG9yIFdlYlRyYW5zcG9ydFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYihbZGF0YV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYXJyYXlidWZmZXJcIjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIEhUVFAgbG9uZy1wb2xsaW5nIChiYXNlNjQpIG9yIFdlYlNvY2tldCArIGJpbmFyeVR5cGUgXCJhcnJheWJ1ZmZlclwiXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIFdlYlRyYW5zcG9ydCAoVWludDhBcnJheSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5idWZmZXI7XG4gICAgICAgICAgICB9XG4gICAgfVxufTtcbiIsImltcG9ydCB7IGVuY29kZVBhY2tldCwgZW5jb2RlUGFja2V0VG9CaW5hcnkgfSBmcm9tIFwiLi9lbmNvZGVQYWNrZXQuanNcIjtcbmltcG9ydCB7IGRlY29kZVBhY2tldCB9IGZyb20gXCIuL2RlY29kZVBhY2tldC5qc1wiO1xuY29uc3QgU0VQQVJBVE9SID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMCk7IC8vIHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9EZWxpbWl0ZXIjQVNDSUlfZGVsaW1pdGVkX3RleHRcbmNvbnN0IGVuY29kZVBheWxvYWQgPSAocGFja2V0cywgY2FsbGJhY2spID0+IHtcbiAgICAvLyBzb21lIHBhY2tldHMgbWF5IGJlIGFkZGVkIHRvIHRoZSBhcnJheSB3aGlsZSBlbmNvZGluZywgc28gdGhlIGluaXRpYWwgbGVuZ3RoIG11c3QgYmUgc2F2ZWRcbiAgICBjb25zdCBsZW5ndGggPSBwYWNrZXRzLmxlbmd0aDtcbiAgICBjb25zdCBlbmNvZGVkUGFja2V0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgcGFja2V0cy5mb3JFYWNoKChwYWNrZXQsIGkpID0+IHtcbiAgICAgICAgLy8gZm9yY2UgYmFzZTY0IGVuY29kaW5nIGZvciBiaW5hcnkgcGFja2V0c1xuICAgICAgICBlbmNvZGVQYWNrZXQocGFja2V0LCBmYWxzZSwgZW5jb2RlZFBhY2tldCA9PiB7XG4gICAgICAgICAgICBlbmNvZGVkUGFja2V0c1tpXSA9IGVuY29kZWRQYWNrZXQ7XG4gICAgICAgICAgICBpZiAoKytjb3VudCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZW5jb2RlZFBhY2tldHMuam9pbihTRVBBUkFUT1IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuY29uc3QgZGVjb2RlUGF5bG9hZCA9IChlbmNvZGVkUGF5bG9hZCwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIGNvbnN0IGVuY29kZWRQYWNrZXRzID0gZW5jb2RlZFBheWxvYWQuc3BsaXQoU0VQQVJBVE9SKTtcbiAgICBjb25zdCBwYWNrZXRzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVkUGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkZWNvZGVkUGFja2V0ID0gZGVjb2RlUGFja2V0KGVuY29kZWRQYWNrZXRzW2ldLCBiaW5hcnlUeXBlKTtcbiAgICAgICAgcGFja2V0cy5wdXNoKGRlY29kZWRQYWNrZXQpO1xuICAgICAgICBpZiAoZGVjb2RlZFBhY2tldC50eXBlID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYWNrZXRzO1xufTtcbmxldCBURVhUX0RFQ09ERVI7XG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlUGFja2V0RnJvbUJpbmFyeShkYXRhLCBpc0JpbmFyeSwgYmluYXJ5VHlwZSkge1xuICAgIGlmICghVEVYVF9ERUNPREVSKSB7XG4gICAgICAgIC8vIGxhemlseSBjcmVhdGVkIGZvciBjb21wYXRpYmlsaXR5IHdpdGggb2xkIGJyb3dzZXIgcGxhdGZvcm1zXG4gICAgICAgIFRFWFRfREVDT0RFUiA9IG5ldyBUZXh0RGVjb2RlcigpO1xuICAgIH1cbiAgICAvLyA0OCA9PT0gXCIwXCIuY2hhckNvZGVBdCgwKSAoT1BFTiBwYWNrZXQgdHlwZSlcbiAgICAvLyA1NCA9PT0gXCI2XCIuY2hhckNvZGVBdCgwKSAoTk9PUCBwYWNrZXQgdHlwZSlcbiAgICBjb25zdCBpc1BsYWluQmluYXJ5ID0gaXNCaW5hcnkgfHwgZGF0YVswXSA8IDQ4IHx8IGRhdGFbMF0gPiA1NDtcbiAgICByZXR1cm4gZGVjb2RlUGFja2V0KGlzUGxhaW5CaW5hcnkgPyBkYXRhIDogVEVYVF9ERUNPREVSLmRlY29kZShkYXRhKSwgYmluYXJ5VHlwZSk7XG59XG5leHBvcnQgY29uc3QgcHJvdG9jb2wgPSA0O1xuZXhwb3J0IHsgZW5jb2RlUGFja2V0LCBlbmNvZGVQYWNrZXRUb0JpbmFyeSwgZW5jb2RlUGF5bG9hZCwgZGVjb2RlUGFja2V0LCBkZWNvZGVQYXlsb2FkIH07XG4iLCIvKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIEVtaXR0ZXIob2JqKSB7XG4gIGlmIChvYmopIHJldHVybiBtaXhpbihvYmopO1xufVxuXG4vKipcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub24gPVxuRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgKHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdKVxuICAgIC5wdXNoKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgZnVuY3Rpb24gb24oKSB7XG4gICAgdGhpcy5vZmYoZXZlbnQsIG9uKTtcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgb24uZm4gPSBmbjtcbiAgdGhpcy5vbihldmVudCwgb24pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICAvLyBhbGxcbiAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBjYjtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYiA9IGNhbGxiYWNrc1tpXTtcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlbW92ZSBldmVudCBzcGVjaWZpYyBhcnJheXMgZm9yIGV2ZW50IHR5cGVzIHRoYXQgbm9cbiAgLy8gb25lIGlzIHN1YnNjcmliZWQgZm9yIHRvIGF2b2lkIG1lbW9yeSBsZWFrLlxuICBpZiAoY2FsbGJhY2tzLmxlbmd0aCA9PT0gMCkge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVtaXQgYGV2ZW50YCB3aXRoIHRoZSBnaXZlbiBhcmdzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtNaXhlZH0gLi4uXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSlcbiAgICAsIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG5cbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgfVxuXG4gIGlmIChjYWxsYmFja3MpIHtcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gYWxpYXMgdXNlZCBmb3IgcmVzZXJ2ZWQgZXZlbnRzIChwcm90ZWN0ZWQgbWV0aG9kKVxuRW1pdHRlci5wcm90b3R5cGUuZW1pdFJlc2VydmVkID0gRW1pdHRlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBSZXR1cm4gYXJyYXkgb2YgY2FsbGJhY2tzIGZvciBgZXZlbnRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICByZXR1cm4gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSB8fCBbXTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhpcyBlbWl0dGVyIGhhcyBgZXZlbnRgIGhhbmRsZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICByZXR1cm4gISEgdGhpcy5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aDtcbn07XG4iLCJleHBvcnQgY29uc3QgZ2xvYmFsVGhpc1NoaW0gPSAoKCkgPT4ge1xuICAgIGlmICh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKTtcbiAgICB9XG59KSgpO1xuIiwiaW1wb3J0IHsgZ2xvYmFsVGhpc1NoaW0gYXMgZ2xvYmFsVGhpcyB9IGZyb20gXCIuL2dsb2JhbFRoaXMuanNcIjtcbmV4cG9ydCBmdW5jdGlvbiBwaWNrKG9iaiwgLi4uYXR0cikge1xuICAgIHJldHVybiBhdHRyLnJlZHVjZSgoYWNjLCBrKSA9PiB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgIGFjY1trXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9KTtcbn1cbi8vIEtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIHJlYWwgdGltZW91dCBmdW5jdGlvbnMgc28gdGhleSBjYW4gYmUgdXNlZCB3aGVuIG92ZXJyaWRkZW5cbmNvbnN0IE5BVElWRV9TRVRfVElNRU9VVCA9IGdsb2JhbFRoaXMuc2V0VGltZW91dDtcbmNvbnN0IE5BVElWRV9DTEVBUl9USU1FT1VUID0gZ2xvYmFsVGhpcy5jbGVhclRpbWVvdXQ7XG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbFRpbWVyRnVuY3Rpb25zKG9iaiwgb3B0cykge1xuICAgIGlmIChvcHRzLnVzZU5hdGl2ZVRpbWVycykge1xuICAgICAgICBvYmouc2V0VGltZW91dEZuID0gTkFUSVZFX1NFVF9USU1FT1VULmJpbmQoZ2xvYmFsVGhpcyk7XG4gICAgICAgIG9iai5jbGVhclRpbWVvdXRGbiA9IE5BVElWRV9DTEVBUl9USU1FT1VULmJpbmQoZ2xvYmFsVGhpcyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBvYmouc2V0VGltZW91dEZuID0gZ2xvYmFsVGhpcy5zZXRUaW1lb3V0LmJpbmQoZ2xvYmFsVGhpcyk7XG4gICAgICAgIG9iai5jbGVhclRpbWVvdXRGbiA9IGdsb2JhbFRoaXMuY2xlYXJUaW1lb3V0LmJpbmQoZ2xvYmFsVGhpcyk7XG4gICAgfVxufVxuLy8gYmFzZTY0IGVuY29kZWQgYnVmZmVycyBhcmUgYWJvdXQgMzMlIGJpZ2dlciAoaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0KVxuY29uc3QgQkFTRTY0X09WRVJIRUFEID0gMS4zMztcbi8vIHdlIGNvdWxkIGFsc28gaGF2ZSB1c2VkIGBuZXcgQmxvYihbb2JqXSkuc2l6ZWAsIGJ1dCBpdCBpc24ndCBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnQgZnVuY3Rpb24gYnl0ZUxlbmd0aChvYmopIHtcbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gdXRmOExlbmd0aChvYmopO1xuICAgIH1cbiAgICAvLyBhcnJheWJ1ZmZlciBvciBibG9iXG4gICAgcmV0dXJuIE1hdGguY2VpbCgob2JqLmJ5dGVMZW5ndGggfHwgb2JqLnNpemUpICogQkFTRTY0X09WRVJIRUFEKTtcbn1cbmZ1bmN0aW9uIHV0ZjhMZW5ndGgoc3RyKSB7XG4gICAgbGV0IGMgPSAwLCBsZW5ndGggPSAwO1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gc3RyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGlmIChjIDwgMHg4MCkge1xuICAgICAgICAgICAgbGVuZ3RoICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyA8IDB4ODAwKSB7XG4gICAgICAgICAgICBsZW5ndGggKz0gMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjIDwgMHhkODAwIHx8IGMgPj0gMHhlMDAwKSB7XG4gICAgICAgICAgICBsZW5ndGggKz0gMztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIGxlbmd0aCArPSA0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsZW5ndGg7XG59XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9nYWxrbi9xdWVyeXN0cmluZ1xuLyoqXG4gKiBDb21waWxlcyBhIHF1ZXJ5c3RyaW5nXG4gKiBSZXR1cm5zIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgb2JqZWN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZShvYmopIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcmJztcbiAgICAgICAgICAgIHN0ciArPSBlbmNvZGVVUklDb21wb25lbnQoaSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuLyoqXG4gKiBQYXJzZXMgYSBzaW1wbGUgcXVlcnlzdHJpbmcgaW50byBhbiBvYmplY3RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlKHFzKSB7XG4gICAgbGV0IHFyeSA9IHt9O1xuICAgIGxldCBwYWlycyA9IHFzLnNwbGl0KCcmJyk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBwYWlycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbGV0IHBhaXIgPSBwYWlyc1tpXS5zcGxpdCgnPScpO1xuICAgICAgICBxcnlbZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIHFyeTtcbn1cbiIsImltcG9ydCB7IGRlY29kZVBhY2tldCB9IGZyb20gXCJlbmdpbmUuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IGluc3RhbGxUaW1lckZ1bmN0aW9ucyB9IGZyb20gXCIuL3V0aWwuanNcIjtcbmltcG9ydCB7IGVuY29kZSB9IGZyb20gXCIuL2NvbnRyaWIvcGFyc2Vxcy5qc1wiO1xuY2xhc3MgVHJhbnNwb3J0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IocmVhc29uLCBkZXNjcmlwdGlvbiwgY29udGV4dCkge1xuICAgICAgICBzdXBlcihyZWFzb24pO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMudHlwZSA9IFwiVHJhbnNwb3J0RXJyb3JcIjtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgVHJhbnNwb3J0IGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogVHJhbnNwb3J0IGFic3RyYWN0IGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy53cml0YWJsZSA9IGZhbHNlO1xuICAgICAgICBpbnN0YWxsVGltZXJGdW5jdGlvbnModGhpcywgb3B0cyk7XG4gICAgICAgIHRoaXMub3B0cyA9IG9wdHM7XG4gICAgICAgIHRoaXMucXVlcnkgPSBvcHRzLnF1ZXJ5O1xuICAgICAgICB0aGlzLnNvY2tldCA9IG9wdHMuc29ja2V0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbWl0cyBhbiBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByZWFzb25cbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb25cbiAgICAgKiBAcGFyYW0gY29udGV4dCAtIHRoZSBlcnJvciBjb250ZXh0XG4gICAgICogQHJldHVybiB7VHJhbnNwb3J0fSBmb3IgY2hhaW5pbmdcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25FcnJvcihyZWFzb24sIGRlc2NyaXB0aW9uLCBjb250ZXh0KSB7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIG5ldyBUcmFuc3BvcnRFcnJvcihyZWFzb24sIGRlc2NyaXB0aW9uLCBjb250ZXh0KSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBPcGVucyB0aGUgdHJhbnNwb3J0LlxuICAgICAqL1xuICAgIG9wZW4oKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICB0aGlzLmRvT3BlbigpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2VzIHRoZSB0cmFuc3BvcnQuXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlbmluZ1wiIHx8IHRoaXMucmVhZHlTdGF0ZSA9PT0gXCJvcGVuXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZG9DbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIG11bHRpcGxlIHBhY2tldHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYWNrZXRzXG4gICAgICovXG4gICAgc2VuZChwYWNrZXRzKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlblwiKSB7XG4gICAgICAgICAgICB0aGlzLndyaXRlKHBhY2tldHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpcyBtaWdodCBoYXBwZW4gaWYgdGhlIHRyYW5zcG9ydCB3YXMgc2lsZW50bHkgY2xvc2VkIGluIHRoZSBiZWZvcmV1bmxvYWQgZXZlbnQgaGFuZGxlclxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIG9wZW5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvbk9wZW4oKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlblwiO1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uRGF0YShkYXRhKSB7XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IGRlY29kZVBhY2tldChkYXRhLCB0aGlzLnNvY2tldC5iaW5hcnlUeXBlKTtcbiAgICAgICAgdGhpcy5vblBhY2tldChwYWNrZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2l0aCBhIGRlY29kZWQgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uUGFja2V0KHBhY2tldCkge1xuICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJwYWNrZXRcIiwgcGFja2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gY2xvc2UuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25DbG9zZShkZXRhaWxzKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImNsb3NlXCIsIGRldGFpbHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXVzZXMgdGhlIHRyYW5zcG9ydCwgaW4gb3JkZXIgbm90IHRvIGxvc2UgcGFja2V0cyBkdXJpbmcgYW4gdXBncmFkZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvblBhdXNlXG4gICAgICovXG4gICAgcGF1c2Uob25QYXVzZSkgeyB9XG4gICAgY3JlYXRlVXJpKHNjaGVtYSwgcXVlcnkgPSB7fSkge1xuICAgICAgICByZXR1cm4gKHNjaGVtYSArXG4gICAgICAgICAgICBcIjovL1wiICtcbiAgICAgICAgICAgIHRoaXMuX2hvc3RuYW1lKCkgK1xuICAgICAgICAgICAgdGhpcy5fcG9ydCgpICtcbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoICtcbiAgICAgICAgICAgIHRoaXMuX3F1ZXJ5KHF1ZXJ5KSk7XG4gICAgfVxuICAgIF9ob3N0bmFtZSgpIHtcbiAgICAgICAgY29uc3QgaG9zdG5hbWUgPSB0aGlzLm9wdHMuaG9zdG5hbWU7XG4gICAgICAgIHJldHVybiBob3N0bmFtZS5pbmRleE9mKFwiOlwiKSA9PT0gLTEgPyBob3N0bmFtZSA6IFwiW1wiICsgaG9zdG5hbWUgKyBcIl1cIjtcbiAgICB9XG4gICAgX3BvcnQoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMucG9ydCAmJlxuICAgICAgICAgICAgKCh0aGlzLm9wdHMuc2VjdXJlICYmIE51bWJlcih0aGlzLm9wdHMucG9ydCAhPT0gNDQzKSkgfHxcbiAgICAgICAgICAgICAgICAoIXRoaXMub3B0cy5zZWN1cmUgJiYgTnVtYmVyKHRoaXMub3B0cy5wb3J0KSAhPT0gODApKSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiOlwiICsgdGhpcy5vcHRzLnBvcnQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfcXVlcnkocXVlcnkpIHtcbiAgICAgICAgY29uc3QgZW5jb2RlZFF1ZXJ5ID0gZW5jb2RlKHF1ZXJ5KTtcbiAgICAgICAgcmV0dXJuIGVuY29kZWRRdWVyeS5sZW5ndGggPyBcIj9cIiArIGVuY29kZWRRdWVyeSA6IFwiXCI7XG4gICAgfVxufVxuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vdW5zaGlmdGlvL3llYXN0XG4ndXNlIHN0cmljdCc7XG5jb25zdCBhbHBoYWJldCA9ICcwMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ei1fJy5zcGxpdCgnJyksIGxlbmd0aCA9IDY0LCBtYXAgPSB7fTtcbmxldCBzZWVkID0gMCwgaSA9IDAsIHByZXY7XG4vKipcbiAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHNwZWNpZmllZCBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBudW1iZXIuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKG51bSkge1xuICAgIGxldCBlbmNvZGVkID0gJyc7XG4gICAgZG8ge1xuICAgICAgICBlbmNvZGVkID0gYWxwaGFiZXRbbnVtICUgbGVuZ3RoXSArIGVuY29kZWQ7XG4gICAgICAgIG51bSA9IE1hdGguZmxvb3IobnVtIC8gbGVuZ3RoKTtcbiAgICB9IHdoaWxlIChudW0gPiAwKTtcbiAgICByZXR1cm4gZW5jb2RlZDtcbn1cbi8qKlxuICogUmV0dXJuIHRoZSBpbnRlZ2VyIHZhbHVlIHNwZWNpZmllZCBieSB0aGUgZ2l2ZW4gc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBjb252ZXJ0LlxuICogQHJldHVybnMge051bWJlcn0gVGhlIGludGVnZXIgdmFsdWUgcmVwcmVzZW50ZWQgYnkgdGhlIHN0cmluZy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUoc3RyKSB7XG4gICAgbGV0IGRlY29kZWQgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVjb2RlZCA9IGRlY29kZWQgKiBsZW5ndGggKyBtYXBbc3RyLmNoYXJBdChpKV07XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVkO1xufVxuLyoqXG4gKiBZZWFzdDogQSB0aW55IGdyb3dpbmcgaWQgZ2VuZXJhdG9yLlxuICpcbiAqIEByZXR1cm5zIHtTdHJpbmd9IEEgdW5pcXVlIGlkLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHllYXN0KCkge1xuICAgIGNvbnN0IG5vdyA9IGVuY29kZSgrbmV3IERhdGUoKSk7XG4gICAgaWYgKG5vdyAhPT0gcHJldilcbiAgICAgICAgcmV0dXJuIHNlZWQgPSAwLCBwcmV2ID0gbm93O1xuICAgIHJldHVybiBub3cgKyAnLicgKyBlbmNvZGUoc2VlZCsrKTtcbn1cbi8vXG4vLyBNYXAgZWFjaCBjaGFyYWN0ZXIgdG8gaXRzIGluZGV4LlxuLy9cbmZvciAoOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgbWFwW2FscGhhYmV0W2ldXSA9IGk7XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9jb21wb25lbnQvaGFzLWNvcnNcbmxldCB2YWx1ZSA9IGZhbHNlO1xudHJ5IHtcbiAgICB2YWx1ZSA9IHR5cGVvZiBYTUxIdHRwUmVxdWVzdCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgJ3dpdGhDcmVkZW50aWFscycgaW4gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG59XG5jYXRjaCAoZXJyKSB7XG4gICAgLy8gaWYgWE1MSHR0cCBzdXBwb3J0IGlzIGRpc2FibGVkIGluIElFIHRoZW4gaXQgd2lsbCB0aHJvd1xuICAgIC8vIHdoZW4gdHJ5aW5nIHRvIGNyZWF0ZVxufVxuZXhwb3J0IGNvbnN0IGhhc0NPUlMgPSB2YWx1ZTtcbiIsIi8vIGJyb3dzZXIgc2hpbSBmb3IgeG1saHR0cHJlcXVlc3QgbW9kdWxlXG5pbXBvcnQgeyBoYXNDT1JTIH0gZnJvbSBcIi4uL2NvbnRyaWIvaGFzLWNvcnMuanNcIjtcbmltcG9ydCB7IGdsb2JhbFRoaXNTaGltIGFzIGdsb2JhbFRoaXMgfSBmcm9tIFwiLi4vZ2xvYmFsVGhpcy5qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIFhIUihvcHRzKSB7XG4gICAgY29uc3QgeGRvbWFpbiA9IG9wdHMueGRvbWFpbjtcbiAgICAvLyBYTUxIdHRwUmVxdWVzdCBjYW4gYmUgZGlzYWJsZWQgb24gSUVcbiAgICB0cnkge1xuICAgICAgICBpZiAoXCJ1bmRlZmluZWRcIiAhPT0gdHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICYmICgheGRvbWFpbiB8fCBoYXNDT1JTKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChlKSB7IH1cbiAgICBpZiAoIXhkb21haW4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZ2xvYmFsVGhpc1tbXCJBY3RpdmVcIl0uY29uY2F0KFwiT2JqZWN0XCIpLmpvaW4oXCJYXCIpXShcIk1pY3Jvc29mdC5YTUxIVFRQXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29va2llSmFyKCkgeyB9XG4iLCJpbXBvcnQgeyBUcmFuc3BvcnQgfSBmcm9tIFwiLi4vdHJhbnNwb3J0LmpzXCI7XG5pbXBvcnQgeyB5ZWFzdCB9IGZyb20gXCIuLi9jb250cmliL3llYXN0LmpzXCI7XG5pbXBvcnQgeyBlbmNvZGVQYXlsb2FkLCBkZWNvZGVQYXlsb2FkIH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbmltcG9ydCB7IGNyZWF0ZUNvb2tpZUphciwgWEhSIGFzIFhNTEh0dHBSZXF1ZXN0LCB9IGZyb20gXCIuL3htbGh0dHByZXF1ZXN0LmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IGluc3RhbGxUaW1lckZ1bmN0aW9ucywgcGljayB9IGZyb20gXCIuLi91dGlsLmpzXCI7XG5pbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzIH0gZnJvbSBcIi4uL2dsb2JhbFRoaXMuanNcIjtcbmZ1bmN0aW9uIGVtcHR5KCkgeyB9XG5jb25zdCBoYXNYSFIyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3Qoe1xuICAgICAgICB4ZG9tYWluOiBmYWxzZSxcbiAgICB9KTtcbiAgICByZXR1cm4gbnVsbCAhPSB4aHIucmVzcG9uc2VUeXBlO1xufSkoKTtcbmV4cG9ydCBjbGFzcyBQb2xsaW5nIGV4dGVuZHMgVHJhbnNwb3J0IHtcbiAgICAvKipcbiAgICAgKiBYSFIgUG9sbGluZyBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gICAgICogQHBhY2thZ2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHN1cGVyKG9wdHMpO1xuICAgICAgICB0aGlzLnBvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgY29uc3QgaXNTU0wgPSBcImh0dHBzOlwiID09PSBsb2NhdGlvbi5wcm90b2NvbDtcbiAgICAgICAgICAgIGxldCBwb3J0ID0gbG9jYXRpb24ucG9ydDtcbiAgICAgICAgICAgIC8vIHNvbWUgdXNlciBhZ2VudHMgaGF2ZSBlbXB0eSBgbG9jYXRpb24ucG9ydGBcbiAgICAgICAgICAgIGlmICghcG9ydCkge1xuICAgICAgICAgICAgICAgIHBvcnQgPSBpc1NTTCA/IFwiNDQzXCIgOiBcIjgwXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnhkID1cbiAgICAgICAgICAgICAgICAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICAgICAgICAgIG9wdHMuaG9zdG5hbWUgIT09IGxvY2F0aW9uLmhvc3RuYW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICBwb3J0ICE9PSBvcHRzLnBvcnQ7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFhIUiBzdXBwb3J0cyBiaW5hcnlcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGZvcmNlQmFzZTY0ID0gb3B0cyAmJiBvcHRzLmZvcmNlQmFzZTY0O1xuICAgICAgICB0aGlzLnN1cHBvcnRzQmluYXJ5ID0gaGFzWEhSMiAmJiAhZm9yY2VCYXNlNjQ7XG4gICAgICAgIGlmICh0aGlzLm9wdHMud2l0aENyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLmNvb2tpZUphciA9IGNyZWF0ZUNvb2tpZUphcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gXCJwb2xsaW5nXCI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE9wZW5zIHRoZSBzb2NrZXQgKHRyaWdnZXJzIHBvbGxpbmcpLiBXZSB3cml0ZSBhIFBJTkcgbWVzc2FnZSB0byBkZXRlcm1pbmVcbiAgICAgKiB3aGVuIHRoZSB0cmFuc3BvcnQgaXMgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBkb09wZW4oKSB7XG4gICAgICAgIHRoaXMucG9sbCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXVzZXMgcG9sbGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uUGF1c2UgLSBjYWxsYmFjayB1cG9uIGJ1ZmZlcnMgYXJlIGZsdXNoZWQgYW5kIHRyYW5zcG9ydCBpcyBwYXVzZWRcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIHBhdXNlKG9uUGF1c2UpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJwYXVzaW5nXCI7XG4gICAgICAgIGNvbnN0IHBhdXNlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJwYXVzZWRcIjtcbiAgICAgICAgICAgIG9uUGF1c2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMucG9sbGluZyB8fCAhdGhpcy53cml0YWJsZSkge1xuICAgICAgICAgICAgbGV0IHRvdGFsID0gMDtcbiAgICAgICAgICAgIGlmICh0aGlzLnBvbGxpbmcpIHtcbiAgICAgICAgICAgICAgICB0b3RhbCsrO1xuICAgICAgICAgICAgICAgIHRoaXMub25jZShcInBvbGxDb21wbGV0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC0tdG90YWwgfHwgcGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy53cml0YWJsZSkge1xuICAgICAgICAgICAgICAgIHRvdGFsKys7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwiZHJhaW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAtLXRvdGFsIHx8IHBhdXNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXVzZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBwb2xsaW5nIGN5Y2xlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwb2xsKCkge1xuICAgICAgICB0aGlzLnBvbGxpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmRvUG9sbCgpO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBvbGxcIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE92ZXJsb2FkcyBvbkRhdGEgdG8gZGV0ZWN0IHBheWxvYWRzLlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uRGF0YShkYXRhKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrID0gKHBhY2tldCkgPT4ge1xuICAgICAgICAgICAgLy8gaWYgaXRzIHRoZSBmaXJzdCBtZXNzYWdlIHdlIGNvbnNpZGVyIHRoZSB0cmFuc3BvcnQgb3BlblxuICAgICAgICAgICAgaWYgKFwib3BlbmluZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgJiYgcGFja2V0LnR5cGUgPT09IFwib3BlblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbk9wZW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIGl0cyBhIGNsb3NlIHBhY2tldCwgd2UgY2xvc2UgdGhlIG9uZ29pbmcgcmVxdWVzdHNcbiAgICAgICAgICAgIGlmIChcImNsb3NlXCIgPT09IHBhY2tldC50eXBlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkNsb3NlKHsgZGVzY3JpcHRpb246IFwidHJhbnNwb3J0IGNsb3NlZCBieSB0aGUgc2VydmVyXCIgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGJ5cGFzcyBvbkRhdGEgYW5kIGhhbmRsZSB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgdGhpcy5vblBhY2tldChwYWNrZXQpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBkZWNvZGUgcGF5bG9hZFxuICAgICAgICBkZWNvZGVQYXlsb2FkKGRhdGEsIHRoaXMuc29ja2V0LmJpbmFyeVR5cGUpLmZvckVhY2goY2FsbGJhY2spO1xuICAgICAgICAvLyBpZiBhbiBldmVudCBkaWQgbm90IHRyaWdnZXIgY2xvc2luZ1xuICAgICAgICBpZiAoXCJjbG9zZWRcIiAhPT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAvLyBpZiB3ZSBnb3QgZGF0YSB3ZSdyZSBub3QgcG9sbGluZ1xuICAgICAgICAgICAgdGhpcy5wb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBvbGxDb21wbGV0ZVwiKTtcbiAgICAgICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2xsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBGb3IgcG9sbGluZywgc2VuZCBhIGNsb3NlIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBkb0Nsb3NlKCkge1xuICAgICAgICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMud3JpdGUoW3sgdHlwZTogXCJjbG9zZVwiIH1dKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpbiBjYXNlIHdlJ3JlIHRyeWluZyB0byBjbG9zZSB3aGlsZVxuICAgICAgICAgICAgLy8gaGFuZHNoYWtpbmcgaXMgaW4gcHJvZ3Jlc3MgKEdILTE2NClcbiAgICAgICAgICAgIHRoaXMub25jZShcIm9wZW5cIiwgY2xvc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyaXRlcyBhIHBhY2tldHMgcGF5bG9hZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhY2tldHMgLSBkYXRhIHBhY2tldHNcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgd3JpdGUocGFja2V0cykge1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIGVuY29kZVBheWxvYWQocGFja2V0cywgKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZG9Xcml0ZShkYXRhLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy53cml0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIHVyaSBmb3IgY29ubmVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdXJpKCkge1xuICAgICAgICBjb25zdCBzY2hlbWEgPSB0aGlzLm9wdHMuc2VjdXJlID8gXCJodHRwc1wiIDogXCJodHRwXCI7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5xdWVyeSB8fCB7fTtcbiAgICAgICAgLy8gY2FjaGUgYnVzdGluZyBpcyBmb3JjZWRcbiAgICAgICAgaWYgKGZhbHNlICE9PSB0aGlzLm9wdHMudGltZXN0YW1wUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIHF1ZXJ5W3RoaXMub3B0cy50aW1lc3RhbXBQYXJhbV0gPSB5ZWFzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5zdXBwb3J0c0JpbmFyeSAmJiAhcXVlcnkuc2lkKSB7XG4gICAgICAgICAgICBxdWVyeS5iNjQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVVyaShzY2hlbWEsIHF1ZXJ5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICByZXF1ZXN0KG9wdHMgPSB7fSkge1xuICAgICAgICBPYmplY3QuYXNzaWduKG9wdHMsIHsgeGQ6IHRoaXMueGQsIGNvb2tpZUphcjogdGhpcy5jb29raWVKYXIgfSwgdGhpcy5vcHRzKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMudXJpKCksIG9wdHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGRhdGEgdG8gc2VuZC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsZWQgdXBvbiBmbHVzaC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGRvV3JpdGUoZGF0YSwgZm4pIHtcbiAgICAgICAgY29uc3QgcmVxID0gdGhpcy5yZXF1ZXN0KHtcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICB9KTtcbiAgICAgICAgcmVxLm9uKFwic3VjY2Vzc1wiLCBmbik7XG4gICAgICAgIHJlcS5vbihcImVycm9yXCIsICh4aHJTdGF0dXMsIGNvbnRleHQpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihcInhociBwb3N0IGVycm9yXCIsIHhoclN0YXR1cywgY29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdGFydHMgYSBwb2xsIGN5Y2xlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkb1BvbGwoKSB7XG4gICAgICAgIGNvbnN0IHJlcSA9IHRoaXMucmVxdWVzdCgpO1xuICAgICAgICByZXEub24oXCJkYXRhXCIsIHRoaXMub25EYXRhLmJpbmQodGhpcykpO1xuICAgICAgICByZXEub24oXCJlcnJvclwiLCAoeGhyU3RhdHVzLCBjb250ZXh0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoXCJ4aHIgcG9sbCBlcnJvclwiLCB4aHJTdGF0dXMsIGNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wb2xsWGhyID0gcmVxO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0IGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHVyaSwgb3B0cykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBpbnN0YWxsVGltZXJGdW5jdGlvbnModGhpcywgb3B0cyk7XG4gICAgICAgIHRoaXMub3B0cyA9IG9wdHM7XG4gICAgICAgIHRoaXMubWV0aG9kID0gb3B0cy5tZXRob2QgfHwgXCJHRVRcIjtcbiAgICAgICAgdGhpcy51cmkgPSB1cmk7XG4gICAgICAgIHRoaXMuZGF0YSA9IHVuZGVmaW5lZCAhPT0gb3B0cy5kYXRhID8gb3B0cy5kYXRhIDogbnVsbDtcbiAgICAgICAgdGhpcy5jcmVhdGUoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgWEhSIG9iamVjdCBhbmQgc2VuZHMgdGhlIHJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGNyZWF0ZSgpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBjb25zdCBvcHRzID0gcGljayh0aGlzLm9wdHMsIFwiYWdlbnRcIiwgXCJwZnhcIiwgXCJrZXlcIiwgXCJwYXNzcGhyYXNlXCIsIFwiY2VydFwiLCBcImNhXCIsIFwiY2lwaGVyc1wiLCBcInJlamVjdFVuYXV0aG9yaXplZFwiLCBcImF1dG9VbnJlZlwiKTtcbiAgICAgICAgb3B0cy54ZG9tYWluID0gISF0aGlzLm9wdHMueGQ7XG4gICAgICAgIGNvbnN0IHhociA9ICh0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdChvcHRzKSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB4aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy51cmksIHRydWUpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc2V0RGlzYWJsZUhlYWRlckNoZWNrICYmIHhoci5zZXREaXNhYmxlSGVhZGVyQ2hlY2sodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgaW4gdGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5leHRyYUhlYWRlcnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihpLCB0aGlzLm9wdHMuZXh0cmFIZWFkZXJzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgIGlmIChcIlBPU1RcIiA9PT0gdGhpcy5tZXRob2QpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcInRleHQvcGxhaW47Y2hhcnNldD1VVEYtOFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcIiovKlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgIChfYSA9IHRoaXMub3B0cy5jb29raWVKYXIpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5hZGRDb29raWVzKHhocik7XG4gICAgICAgICAgICAvLyBpZTYgY2hlY2tcbiAgICAgICAgICAgIGlmIChcIndpdGhDcmVkZW50aWFsc1wiIGluIHhocikge1xuICAgICAgICAgICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0aGlzLm9wdHMud2l0aENyZWRlbnRpYWxzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5yZXF1ZXN0VGltZW91dCkge1xuICAgICAgICAgICAgICAgIHhoci50aW1lb3V0ID0gdGhpcy5vcHRzLnJlcXVlc3RUaW1lb3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIChfYSA9IHRoaXMub3B0cy5jb29raWVKYXIpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5wYXJzZUNvb2tpZXMoeGhyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKDQgIT09IHhoci5yZWFkeVN0YXRlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKDIwMCA9PT0geGhyLnN0YXR1cyB8fCAxMjIzID09PSB4aHIuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25Mb2FkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIGBlcnJvcmAgZXZlbnQgaGFuZGxlciB0aGF0J3MgdXNlci1zZXRcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9lcyBub3QgdGhyb3cgaW4gdGhlIHNhbWUgdGljayBhbmQgZ2V0cyBjYXVnaHQgaGVyZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IodHlwZW9mIHhoci5zdGF0dXMgPT09IFwibnVtYmVyXCIgPyB4aHIuc3RhdHVzIDogMCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB4aHIuc2VuZCh0aGlzLmRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOZWVkIHRvIGRlZmVyIHNpbmNlIC5jcmVhdGUoKSBpcyBjYWxsZWQgZGlyZWN0bHkgZnJvbSB0aGUgY29uc3RydWN0b3JcbiAgICAgICAgICAgIC8vIGFuZCB0aHVzIHRoZSAnZXJyb3InIGV2ZW50IGNhbiBvbmx5IGJlIG9ubHkgYm91bmQgKmFmdGVyKiB0aGlzIGV4Y2VwdGlvblxuICAgICAgICAgICAgLy8gb2NjdXJzLiAgVGhlcmVmb3JlLCBhbHNvLCB3ZSBjYW5ub3QgdGhyb3cgaGVyZSBhdCBhbGwuXG4gICAgICAgICAgICB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGUpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhpcy5pbmRleCA9IFJlcXVlc3QucmVxdWVzdHNDb3VudCsrO1xuICAgICAgICAgICAgUmVxdWVzdC5yZXF1ZXN0c1t0aGlzLmluZGV4XSA9IHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uRXJyb3IoZXJyKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyLCB0aGlzLnhocik7XG4gICAgICAgIHRoaXMuY2xlYW51cCh0cnVlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xlYW5zIHVwIGhvdXNlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjbGVhbnVwKGZyb21FcnJvcikge1xuICAgICAgICBpZiAoXCJ1bmRlZmluZWRcIiA9PT0gdHlwZW9mIHRoaXMueGhyIHx8IG51bGwgPT09IHRoaXMueGhyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZW1wdHk7XG4gICAgICAgIGlmIChmcm9tRXJyb3IpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy54aHIuYWJvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBkZWxldGUgUmVxdWVzdC5yZXF1ZXN0c1t0aGlzLmluZGV4XTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnhociA9IG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGxvYWQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uTG9hZCgpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMueGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgaWYgKGRhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZGF0YVwiLCBkYXRhKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwic3VjY2Vzc1wiKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFib3J0cyB0aGUgcmVxdWVzdC5cbiAgICAgKlxuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgYWJvcnQoKSB7XG4gICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgIH1cbn1cblJlcXVlc3QucmVxdWVzdHNDb3VudCA9IDA7XG5SZXF1ZXN0LnJlcXVlc3RzID0ge307XG4vKipcbiAqIEFib3J0cyBwZW5kaW5nIHJlcXVlc3RzIHdoZW4gdW5sb2FkaW5nIHRoZSB3aW5kb3cuIFRoaXMgaXMgbmVlZGVkIHRvIHByZXZlbnRcbiAqIG1lbW9yeSBsZWFrcyAoZS5nLiB3aGVuIHVzaW5nIElFKSBhbmQgdG8gZW5zdXJlIHRoYXQgbm8gc3B1cmlvdXMgZXJyb3IgaXNcbiAqIGVtaXR0ZWQuXG4gKi9cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKHR5cGVvZiBhdHRhY2hFdmVudCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgYXR0YWNoRXZlbnQoXCJvbnVubG9hZFwiLCB1bmxvYWRIYW5kbGVyKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGFkZEV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjb25zdCB0ZXJtaW5hdGlvbkV2ZW50ID0gXCJvbnBhZ2VoaWRlXCIgaW4gZ2xvYmFsVGhpcyA/IFwicGFnZWhpZGVcIiA6IFwidW5sb2FkXCI7XG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXIodGVybWluYXRpb25FdmVudCwgdW5sb2FkSGFuZGxlciwgZmFsc2UpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVubG9hZEhhbmRsZXIoKSB7XG4gICAgZm9yIChsZXQgaSBpbiBSZXF1ZXN0LnJlcXVlc3RzKSB7XG4gICAgICAgIGlmIChSZXF1ZXN0LnJlcXVlc3RzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBSZXF1ZXN0LnJlcXVlc3RzW2ldLmFib3J0KCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzIH0gZnJvbSBcIi4uL2dsb2JhbFRoaXMuanNcIjtcbmV4cG9ydCBjb25zdCBuZXh0VGljayA9ICgoKSA9PiB7XG4gICAgY29uc3QgaXNQcm9taXNlQXZhaWxhYmxlID0gdHlwZW9mIFByb21pc2UgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgUHJvbWlzZS5yZXNvbHZlID09PSBcImZ1bmN0aW9uXCI7XG4gICAgaWYgKGlzUHJvbWlzZUF2YWlsYWJsZSkge1xuICAgICAgICByZXR1cm4gKGNiKSA9PiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGNiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiAoY2IsIHNldFRpbWVvdXRGbikgPT4gc2V0VGltZW91dEZuKGNiLCAwKTtcbiAgICB9XG59KSgpO1xuZXhwb3J0IGNvbnN0IFdlYlNvY2tldCA9IGdsb2JhbFRoaXMuV2ViU29ja2V0IHx8IGdsb2JhbFRoaXMuTW96V2ViU29ja2V0O1xuZXhwb3J0IGNvbnN0IHVzaW5nQnJvd3NlcldlYlNvY2tldCA9IHRydWU7XG5leHBvcnQgY29uc3QgZGVmYXVsdEJpbmFyeVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4iLCJpbXBvcnQgeyBUcmFuc3BvcnQgfSBmcm9tIFwiLi4vdHJhbnNwb3J0LmpzXCI7XG5pbXBvcnQgeyB5ZWFzdCB9IGZyb20gXCIuLi9jb250cmliL3llYXN0LmpzXCI7XG5pbXBvcnQgeyBwaWNrIH0gZnJvbSBcIi4uL3V0aWwuanNcIjtcbmltcG9ydCB7IGRlZmF1bHRCaW5hcnlUeXBlLCBuZXh0VGljaywgdXNpbmdCcm93c2VyV2ViU29ja2V0LCBXZWJTb2NrZXQsIH0gZnJvbSBcIi4vd2Vic29ja2V0LWNvbnN0cnVjdG9yLmpzXCI7XG5pbXBvcnQgeyBlbmNvZGVQYWNrZXQgfSBmcm9tIFwiZW5naW5lLmlvLXBhcnNlclwiO1xuLy8gZGV0ZWN0IFJlYWN0TmF0aXZlIGVudmlyb25tZW50XG5jb25zdCBpc1JlYWN0TmF0aXZlID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIHR5cGVvZiBuYXZpZ2F0b3IucHJvZHVjdCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIG5hdmlnYXRvci5wcm9kdWN0LnRvTG93ZXJDYXNlKCkgPT09IFwicmVhY3RuYXRpdmVcIjtcbmV4cG9ydCBjbGFzcyBXUyBleHRlbmRzIFRyYW5zcG9ydCB7XG4gICAgLyoqXG4gICAgICogV2ViU29ja2V0IHRyYW5zcG9ydCBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gY29ubmVjdGlvbiBvcHRpb25zXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIob3B0cyk7XG4gICAgICAgIHRoaXMuc3VwcG9ydHNCaW5hcnkgPSAhb3B0cy5mb3JjZUJhc2U2NDtcbiAgICB9XG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiBcIndlYnNvY2tldFwiO1xuICAgIH1cbiAgICBkb09wZW4oKSB7XG4gICAgICAgIGlmICghdGhpcy5jaGVjaygpKSB7XG4gICAgICAgICAgICAvLyBsZXQgcHJvYmUgdGltZW91dFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVyaSA9IHRoaXMudXJpKCk7XG4gICAgICAgIGNvbnN0IHByb3RvY29scyA9IHRoaXMub3B0cy5wcm90b2NvbHM7XG4gICAgICAgIC8vIFJlYWN0IE5hdGl2ZSBvbmx5IHN1cHBvcnRzIHRoZSAnaGVhZGVycycgb3B0aW9uLCBhbmQgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgYW55dGhpbmcgZWxzZSBpcyBwYXNzZWRcbiAgICAgICAgY29uc3Qgb3B0cyA9IGlzUmVhY3ROYXRpdmVcbiAgICAgICAgICAgID8ge31cbiAgICAgICAgICAgIDogcGljayh0aGlzLm9wdHMsIFwiYWdlbnRcIiwgXCJwZXJNZXNzYWdlRGVmbGF0ZVwiLCBcInBmeFwiLCBcImtleVwiLCBcInBhc3NwaHJhc2VcIiwgXCJjZXJ0XCIsIFwiY2FcIiwgXCJjaXBoZXJzXCIsIFwicmVqZWN0VW5hdXRob3JpemVkXCIsIFwibG9jYWxBZGRyZXNzXCIsIFwicHJvdG9jb2xWZXJzaW9uXCIsIFwib3JpZ2luXCIsIFwibWF4UGF5bG9hZFwiLCBcImZhbWlseVwiLCBcImNoZWNrU2VydmVySWRlbnRpdHlcIik7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuZXh0cmFIZWFkZXJzKSB7XG4gICAgICAgICAgICBvcHRzLmhlYWRlcnMgPSB0aGlzLm9wdHMuZXh0cmFIZWFkZXJzO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLndzID1cbiAgICAgICAgICAgICAgICB1c2luZ0Jyb3dzZXJXZWJTb2NrZXQgJiYgIWlzUmVhY3ROYXRpdmVcbiAgICAgICAgICAgICAgICAgICAgPyBwcm90b2NvbHNcbiAgICAgICAgICAgICAgICAgICAgICAgID8gbmV3IFdlYlNvY2tldCh1cmksIHByb3RvY29scylcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IFdlYlNvY2tldCh1cmkpXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IFdlYlNvY2tldCh1cmksIHByb3RvY29scywgb3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndzLmJpbmFyeVR5cGUgPSB0aGlzLnNvY2tldC5iaW5hcnlUeXBlIHx8IGRlZmF1bHRCaW5hcnlUeXBlO1xuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBzb2NrZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgYWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMud3Mub25vcGVuID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndzLl9zb2NrZXQudW5yZWYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMub25PcGVuKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMud3Mub25jbG9zZSA9IChjbG9zZUV2ZW50KSA9PiB0aGlzLm9uQ2xvc2Uoe1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwid2Vic29ja2V0IGNvbm5lY3Rpb24gY2xvc2VkXCIsXG4gICAgICAgICAgICBjb250ZXh0OiBjbG9zZUV2ZW50LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy53cy5vbm1lc3NhZ2UgPSAoZXYpID0+IHRoaXMub25EYXRhKGV2LmRhdGEpO1xuICAgICAgICB0aGlzLndzLm9uZXJyb3IgPSAoZSkgPT4gdGhpcy5vbkVycm9yKFwid2Vic29ja2V0IGVycm9yXCIsIGUpO1xuICAgIH1cbiAgICB3cml0ZShwYWNrZXRzKSB7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZW5jb2RlUGFja2V0IGVmZmljaWVudCBhcyBpdCB1c2VzIFdTIGZyYW1pbmdcbiAgICAgICAgLy8gbm8gbmVlZCBmb3IgZW5jb2RlUGF5bG9hZFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2tldCA9IHBhY2tldHNbaV07XG4gICAgICAgICAgICBjb25zdCBsYXN0UGFja2V0ID0gaSA9PT0gcGFja2V0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgZW5jb2RlUGFja2V0KHBhY2tldCwgdGhpcy5zdXBwb3J0c0JpbmFyeSwgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBhbHdheXMgY3JlYXRlIGEgbmV3IG9iamVjdCAoR0gtNDM3KVxuICAgICAgICAgICAgICAgIGNvbnN0IG9wdHMgPSB7fTtcbiAgICAgICAgICAgICAgICBpZiAoIXVzaW5nQnJvd3NlcldlYlNvY2tldCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFja2V0Lm9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29tcHJlc3MgPSBwYWNrZXQub3B0aW9ucy5jb21wcmVzcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLnBlck1lc3NhZ2VEZWZsYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3RyaW5nXCIgPT09IHR5cGVvZiBkYXRhID8gQnVmZmVyLmJ5dGVMZW5ndGgoZGF0YSkgOiBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsZW4gPCB0aGlzLm9wdHMucGVyTWVzc2FnZURlZmxhdGUudGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5jb21wcmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFNvbWV0aW1lcyB0aGUgd2Vic29ja2V0IGhhcyBhbHJlYWR5IGJlZW4gY2xvc2VkIGJ1dCB0aGUgYnJvd3NlciBkaWRuJ3RcbiAgICAgICAgICAgICAgICAvLyBoYXZlIGEgY2hhbmNlIG9mIGluZm9ybWluZyB1cyBhYm91dCBpdCB5ZXQsIGluIHRoYXQgY2FzZSBzZW5kIHdpbGxcbiAgICAgICAgICAgICAgICAvLyB0aHJvdyBhbiBlcnJvclxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2luZ0Jyb3dzZXJXZWJTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFR5cGVFcnJvciBpcyB0aHJvd24gd2hlbiBwYXNzaW5nIHRoZSBzZWNvbmQgYXJndW1lbnQgb24gU2FmYXJpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndzLnNlbmQoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndzLnNlbmQoZGF0YSwgb3B0cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RQYWNrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmFrZSBkcmFpblxuICAgICAgICAgICAgICAgICAgICAvLyBkZWZlciB0byBuZXh0IHRpY2sgdG8gYWxsb3cgU29ja2V0IHRvIGNsZWFyIHdyaXRlQnVmZmVyXG4gICAgICAgICAgICAgICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcy5zZXRUaW1lb3V0Rm4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRvQ2xvc2UoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy53cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy53cyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIHVyaSBmb3IgY29ubmVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdXJpKCkge1xuICAgICAgICBjb25zdCBzY2hlbWEgPSB0aGlzLm9wdHMuc2VjdXJlID8gXCJ3c3NcIiA6IFwid3NcIjtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJ5IHx8IHt9O1xuICAgICAgICAvLyBhcHBlbmQgdGltZXN0YW1wIHRvIFVSSVxuICAgICAgICBpZiAodGhpcy5vcHRzLnRpbWVzdGFtcFJlcXVlc3RzKSB7XG4gICAgICAgICAgICBxdWVyeVt0aGlzLm9wdHMudGltZXN0YW1wUGFyYW1dID0geWVhc3QoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb21tdW5pY2F0ZSBiaW5hcnkgc3VwcG9ydCBjYXBhYmlsaXRpZXNcbiAgICAgICAgaWYgKCF0aGlzLnN1cHBvcnRzQmluYXJ5KSB7XG4gICAgICAgICAgICBxdWVyeS5iNjQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVVyaShzY2hlbWEsIHF1ZXJ5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRmVhdHVyZSBkZXRlY3Rpb24gZm9yIFdlYlNvY2tldC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgdGhpcyB0cmFuc3BvcnQgaXMgYXZhaWxhYmxlLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY2hlY2soKSB7XG4gICAgICAgIHJldHVybiAhIVdlYlNvY2tldDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBUcmFuc3BvcnQgfSBmcm9tIFwiLi4vdHJhbnNwb3J0LmpzXCI7XG5pbXBvcnQgeyBuZXh0VGljayB9IGZyb20gXCIuL3dlYnNvY2tldC1jb25zdHJ1Y3Rvci5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlUGFja2V0VG9CaW5hcnksIGRlY29kZVBhY2tldEZyb21CaW5hcnksIH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbmZ1bmN0aW9uIHNob3VsZEluY2x1ZGVCaW5hcnlIZWFkZXIocGFja2V0LCBlbmNvZGVkKSB7XG4gICAgLy8gNDggPT09IFwiMFwiLmNoYXJDb2RlQXQoMCkgKE9QRU4gcGFja2V0IHR5cGUpXG4gICAgLy8gNTQgPT09IFwiNlwiLmNoYXJDb2RlQXQoMCkgKE5PT1AgcGFja2V0IHR5cGUpXG4gICAgcmV0dXJuIChwYWNrZXQudHlwZSA9PT0gXCJtZXNzYWdlXCIgJiZcbiAgICAgICAgdHlwZW9mIHBhY2tldC5kYXRhICE9PSBcInN0cmluZ1wiICYmXG4gICAgICAgIGVuY29kZWRbMF0gPj0gNDggJiZcbiAgICAgICAgZW5jb2RlZFswXSA8PSA1NCk7XG59XG5leHBvcnQgY2xhc3MgV1QgZXh0ZW5kcyBUcmFuc3BvcnQge1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gXCJ3ZWJ0cmFuc3BvcnRcIjtcbiAgICB9XG4gICAgZG9PcGVuKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmICh0eXBlb2YgV2ViVHJhbnNwb3J0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHRoaXMudHJhbnNwb3J0ID0gbmV3IFdlYlRyYW5zcG9ydCh0aGlzLmNyZWF0ZVVyaShcImh0dHBzXCIpLCB0aGlzLm9wdHMudHJhbnNwb3J0T3B0aW9uc1t0aGlzLm5hbWVdKTtcbiAgICAgICAgdGhpcy50cmFuc3BvcnQuY2xvc2VkLnRoZW4oKCkgPT4gdGhpcy5vbkNsb3NlKCkpO1xuICAgICAgICAvLyBub3RlOiB3ZSBjb3VsZCBoYXZlIHVzZWQgYXN5bmMvYXdhaXQsIGJ1dCB0aGF0IHdvdWxkIHJlcXVpcmUgc29tZSBhZGRpdGlvbmFsIHBvbHlmaWxsc1xuICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZWFkeS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNyZWF0ZUJpZGlyZWN0aW9uYWxTdHJlYW0oKS50aGVuKChzdHJlYW0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZWFkZXIgPSBzdHJlYW0ucmVhZGFibGUuZ2V0UmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy53cml0ZXIgPSBzdHJlYW0ud3JpdGFibGUuZ2V0V3JpdGVyKCk7XG4gICAgICAgICAgICAgICAgbGV0IGJpbmFyeUZsYWc7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVhZGVyLnJlYWQoKS50aGVuKCh7IGRvbmUsIHZhbHVlIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFiaW5hcnlGbGFnICYmIHZhbHVlLmJ5dGVMZW5ndGggPT09IDEgJiYgdmFsdWVbMF0gPT09IDU0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluYXJ5RmxhZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIGV4cG9zZSBiaW5hcnl0eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vblBhY2tldChkZWNvZGVQYWNrZXRGcm9tQmluYXJ5KHZhbHVlLCBiaW5hcnlGbGFnLCBcImFycmF5YnVmZmVyXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaW5hcnlGbGFnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZWFkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRzaGFrZSA9IHRoaXMucXVlcnkuc2lkID8gYDB7XCJzaWRcIjpcIiR7dGhpcy5xdWVyeS5zaWR9XCJ9YCA6IFwiMFwiO1xuICAgICAgICAgICAgICAgIHRoaXMud3JpdGVyXG4gICAgICAgICAgICAgICAgICAgIC53cml0ZShuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoaGFuZHNoYWtlKSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5vbk9wZW4oKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHdyaXRlKHBhY2tldHMpIHtcbiAgICAgICAgdGhpcy53cml0YWJsZSA9IGZhbHNlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2tldCA9IHBhY2tldHNbaV07XG4gICAgICAgICAgICBjb25zdCBsYXN0UGFja2V0ID0gaSA9PT0gcGFja2V0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgZW5jb2RlUGFja2V0VG9CaW5hcnkocGFja2V0LCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRJbmNsdWRlQmluYXJ5SGVhZGVyKHBhY2tldCwgZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53cml0ZXIud3JpdGUoVWludDhBcnJheS5vZig1NCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLndyaXRlci53cml0ZShkYXRhKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RQYWNrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRyYWluXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgdGhpcy5zZXRUaW1lb3V0Rm4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkb0Nsb3NlKCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIChfYSA9IHRoaXMudHJhbnNwb3J0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuY2xvc2UoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBQb2xsaW5nIH0gZnJvbSBcIi4vcG9sbGluZy5qc1wiO1xuaW1wb3J0IHsgV1MgfSBmcm9tIFwiLi93ZWJzb2NrZXQuanNcIjtcbmltcG9ydCB7IFdUIH0gZnJvbSBcIi4vd2VidHJhbnNwb3J0LmpzXCI7XG5leHBvcnQgY29uc3QgdHJhbnNwb3J0cyA9IHtcbiAgICB3ZWJzb2NrZXQ6IFdTLFxuICAgIHdlYnRyYW5zcG9ydDogV1QsXG4gICAgcG9sbGluZzogUG9sbGluZyxcbn07XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9nYWxrbi9wYXJzZXVyaVxuLyoqXG4gKiBQYXJzZXMgYSBVUklcbiAqXG4gKiBOb3RlOiB3ZSBjb3VsZCBhbHNvIGhhdmUgdXNlZCB0aGUgYnVpbHQtaW4gVVJMIG9iamVjdCwgYnV0IGl0IGlzbid0IHN1cHBvcnRlZCBvbiBhbGwgcGxhdGZvcm1zLlxuICpcbiAqIFNlZTpcbiAqIC0gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1VSTFxuICogLSBodHRwczovL2Nhbml1c2UuY29tL3VybFxuICogLSBodHRwczovL3d3dy5yZmMtZWRpdG9yLm9yZy9yZmMvcmZjMzk4NiNhcHBlbmRpeC1CXG4gKlxuICogSGlzdG9yeSBvZiB0aGUgcGFyc2UoKSBtZXRob2Q6XG4gKiAtIGZpcnN0IGNvbW1pdDogaHR0cHM6Ly9naXRodWIuY29tL3NvY2tldGlvL3NvY2tldC5pby1jbGllbnQvY29tbWl0LzRlZTFkNWQ5NGIzOTA2YTljMDUyYjQ1OWYxYTgxOGIxNWYzOGY5MWNcbiAqIC0gZXhwb3J0IGludG8gaXRzIG93biBtb2R1bGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NrZXRpby9lbmdpbmUuaW8tY2xpZW50L2NvbW1pdC9kZTJjNTYxZTQ1NjRlZmViNzhmMWJkYjFiYTM5ZWY4MWIyODIyY2IzXG4gKiAtIHJlaW1wb3J0OiBodHRwczovL2dpdGh1Yi5jb20vc29ja2V0aW8vZW5naW5lLmlvLWNsaWVudC9jb21taXQvZGYzMjI3N2MzZjZkNjIyZWVjNWVkMDlmNDkzY2FlM2YzMzkxZDI0MlxuICpcbiAqIEBhdXRob3IgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+IChNSVQgbGljZW5zZSlcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5jb25zdCByZSA9IC9eKD86KD8hW146QFxcLz8jXSs6W146QFxcL10qQCkoaHR0cHxodHRwc3x3c3x3c3MpOlxcL1xcLyk/KCg/OigoW146QFxcLz8jXSopKD86OihbXjpAXFwvPyNdKikpPyk/QCk/KCg/OlthLWYwLTldezAsNH06KXsyLDd9W2EtZjAtOV17MCw0fXxbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvO1xuY29uc3QgcGFydHMgPSBbXG4gICAgJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdhbmNob3InXG5dO1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICAgIGNvbnN0IHNyYyA9IHN0ciwgYiA9IHN0ci5pbmRleE9mKCdbJyksIGUgPSBzdHIuaW5kZXhPZignXScpO1xuICAgIGlmIChiICE9IC0xICYmIGUgIT0gLTEpIHtcbiAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCBiKSArIHN0ci5zdWJzdHJpbmcoYiwgZSkucmVwbGFjZSgvOi9nLCAnOycpICsgc3RyLnN1YnN0cmluZyhlLCBzdHIubGVuZ3RoKTtcbiAgICB9XG4gICAgbGV0IG0gPSByZS5leGVjKHN0ciB8fCAnJyksIHVyaSA9IHt9LCBpID0gMTQ7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICB1cmlbcGFydHNbaV1dID0gbVtpXSB8fCAnJztcbiAgICB9XG4gICAgaWYgKGIgIT0gLTEgJiYgZSAhPSAtMSkge1xuICAgICAgICB1cmkuc291cmNlID0gc3JjO1xuICAgICAgICB1cmkuaG9zdCA9IHVyaS5ob3N0LnN1YnN0cmluZygxLCB1cmkuaG9zdC5sZW5ndGggLSAxKS5yZXBsYWNlKC87L2csICc6Jyk7XG4gICAgICAgIHVyaS5hdXRob3JpdHkgPSB1cmkuYXV0aG9yaXR5LnJlcGxhY2UoJ1snLCAnJykucmVwbGFjZSgnXScsICcnKS5yZXBsYWNlKC87L2csICc6Jyk7XG4gICAgICAgIHVyaS5pcHY2dXJpID0gdHJ1ZTtcbiAgICB9XG4gICAgdXJpLnBhdGhOYW1lcyA9IHBhdGhOYW1lcyh1cmksIHVyaVsncGF0aCddKTtcbiAgICB1cmkucXVlcnlLZXkgPSBxdWVyeUtleSh1cmksIHVyaVsncXVlcnknXSk7XG4gICAgcmV0dXJuIHVyaTtcbn1cbmZ1bmN0aW9uIHBhdGhOYW1lcyhvYmosIHBhdGgpIHtcbiAgICBjb25zdCByZWd4ID0gL1xcL3syLDl9L2csIG5hbWVzID0gcGF0aC5yZXBsYWNlKHJlZ3gsIFwiL1wiKS5zcGxpdChcIi9cIik7XG4gICAgaWYgKHBhdGguc2xpY2UoMCwgMSkgPT0gJy8nIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG5hbWVzLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgaWYgKHBhdGguc2xpY2UoLTEpID09ICcvJykge1xuICAgICAgICBuYW1lcy5zcGxpY2UobmFtZXMubGVuZ3RoIC0gMSwgMSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcztcbn1cbmZ1bmN0aW9uIHF1ZXJ5S2V5KHVyaSwgcXVlcnkpIHtcbiAgICBjb25zdCBkYXRhID0ge307XG4gICAgcXVlcnkucmVwbGFjZSgvKD86XnwmKShbXiY9XSopPT8oW14mXSopL2csIGZ1bmN0aW9uICgkMCwgJDEsICQyKSB7XG4gICAgICAgIGlmICgkMSkge1xuICAgICAgICAgICAgZGF0YVskMV0gPSAkMjtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkYXRhO1xufVxuIiwiaW1wb3J0IHsgdHJhbnNwb3J0cyB9IGZyb20gXCIuL3RyYW5zcG9ydHMvaW5kZXguanNcIjtcbmltcG9ydCB7IGluc3RhbGxUaW1lckZ1bmN0aW9ucywgYnl0ZUxlbmd0aCB9IGZyb20gXCIuL3V0aWwuanNcIjtcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gXCIuL2NvbnRyaWIvcGFyc2Vxcy5qc1wiO1xuaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi9jb250cmliL3BhcnNldXJpLmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IHByb3RvY29sIH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbmV4cG9ydCBjbGFzcyBTb2NrZXQgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBTb2NrZXQgY29uc3RydWN0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHVyaSAtIHVyaSBvciBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodXJpLCBvcHRzID0ge30pIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlciA9IFtdO1xuICAgICAgICBpZiAodXJpICYmIFwib2JqZWN0XCIgPT09IHR5cGVvZiB1cmkpIHtcbiAgICAgICAgICAgIG9wdHMgPSB1cmk7XG4gICAgICAgICAgICB1cmkgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cmkpIHtcbiAgICAgICAgICAgIHVyaSA9IHBhcnNlKHVyaSk7XG4gICAgICAgICAgICBvcHRzLmhvc3RuYW1lID0gdXJpLmhvc3Q7XG4gICAgICAgICAgICBvcHRzLnNlY3VyZSA9IHVyaS5wcm90b2NvbCA9PT0gXCJodHRwc1wiIHx8IHVyaS5wcm90b2NvbCA9PT0gXCJ3c3NcIjtcbiAgICAgICAgICAgIG9wdHMucG9ydCA9IHVyaS5wb3J0O1xuICAgICAgICAgICAgaWYgKHVyaS5xdWVyeSlcbiAgICAgICAgICAgICAgICBvcHRzLnF1ZXJ5ID0gdXJpLnF1ZXJ5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdHMuaG9zdCkge1xuICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSA9IHBhcnNlKG9wdHMuaG9zdCkuaG9zdDtcbiAgICAgICAgfVxuICAgICAgICBpbnN0YWxsVGltZXJGdW5jdGlvbnModGhpcywgb3B0cyk7XG4gICAgICAgIHRoaXMuc2VjdXJlID1cbiAgICAgICAgICAgIG51bGwgIT0gb3B0cy5zZWN1cmVcbiAgICAgICAgICAgICAgICA/IG9wdHMuc2VjdXJlXG4gICAgICAgICAgICAgICAgOiB0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgXCJodHRwczpcIiA9PT0gbG9jYXRpb24ucHJvdG9jb2w7XG4gICAgICAgIGlmIChvcHRzLmhvc3RuYW1lICYmICFvcHRzLnBvcnQpIHtcbiAgICAgICAgICAgIC8vIGlmIG5vIHBvcnQgaXMgc3BlY2lmaWVkIG1hbnVhbGx5LCB1c2UgdGhlIHByb3RvY29sIGRlZmF1bHRcbiAgICAgICAgICAgIG9wdHMucG9ydCA9IHRoaXMuc2VjdXJlID8gXCI0NDNcIiA6IFwiODBcIjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhvc3RuYW1lID1cbiAgICAgICAgICAgIG9wdHMuaG9zdG5hbWUgfHxcbiAgICAgICAgICAgICAgICAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiID8gbG9jYXRpb24uaG9zdG5hbWUgOiBcImxvY2FsaG9zdFwiKTtcbiAgICAgICAgdGhpcy5wb3J0ID1cbiAgICAgICAgICAgIG9wdHMucG9ydCB8fFxuICAgICAgICAgICAgICAgICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgbG9jYXRpb24ucG9ydFxuICAgICAgICAgICAgICAgICAgICA/IGxvY2F0aW9uLnBvcnRcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLnNlY3VyZVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBcIjQ0M1wiXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFwiODBcIik7XG4gICAgICAgIHRoaXMudHJhbnNwb3J0cyA9IG9wdHMudHJhbnNwb3J0cyB8fCBbXG4gICAgICAgICAgICBcInBvbGxpbmdcIixcbiAgICAgICAgICAgIFwid2Vic29ja2V0XCIsXG4gICAgICAgICAgICBcIndlYnRyYW5zcG9ydFwiLFxuICAgICAgICBdO1xuICAgICAgICB0aGlzLndyaXRlQnVmZmVyID0gW107XG4gICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IDA7XG4gICAgICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF0aDogXCIvZW5naW5lLmlvXCIsXG4gICAgICAgICAgICBhZ2VudDogZmFsc2UsXG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IGZhbHNlLFxuICAgICAgICAgICAgdXBncmFkZTogdHJ1ZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcFBhcmFtOiBcInRcIixcbiAgICAgICAgICAgIHJlbWVtYmVyVXBncmFkZTogZmFsc2UsXG4gICAgICAgICAgICBhZGRUcmFpbGluZ1NsYXNoOiB0cnVlLFxuICAgICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0cnVlLFxuICAgICAgICAgICAgcGVyTWVzc2FnZURlZmxhdGU6IHtcbiAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDEwMjQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNwb3J0T3B0aW9uczoge30sXG4gICAgICAgICAgICBjbG9zZU9uQmVmb3JldW5sb2FkOiB0cnVlLFxuICAgICAgICB9LCBvcHRzKTtcbiAgICAgICAgdGhpcy5vcHRzLnBhdGggPVxuICAgICAgICAgICAgdGhpcy5vcHRzLnBhdGgucmVwbGFjZSgvXFwvJC8sIFwiXCIpICtcbiAgICAgICAgICAgICAgICAodGhpcy5vcHRzLmFkZFRyYWlsaW5nU2xhc2ggPyBcIi9cIiA6IFwiXCIpO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0cy5xdWVyeSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5vcHRzLnF1ZXJ5ID0gZGVjb2RlKHRoaXMub3B0cy5xdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IG9uIGhhbmRzaGFrZVxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51cGdyYWRlcyA9IG51bGw7XG4gICAgICAgIHRoaXMucGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgdGhpcy5waW5nVGltZW91dCA9IG51bGw7XG4gICAgICAgIC8vIHNldCBvbiBoZWFydGJlYXRcbiAgICAgICAgdGhpcy5waW5nVGltZW91dFRpbWVyID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBhZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuY2xvc2VPbkJlZm9yZXVubG9hZCkge1xuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggY2xvc2VzIHRoZSBjb25uZWN0aW9uIHdoZW4gdGhlIFwiYmVmb3JldW5sb2FkXCIgZXZlbnQgaXMgZW1pdHRlZCBidXQgbm90IENocm9tZS4gVGhpcyBldmVudCBsaXN0ZW5lclxuICAgICAgICAgICAgICAgIC8vIGVuc3VyZXMgZXZlcnkgYnJvd3NlciBiZWhhdmVzIHRoZSBzYW1lIChubyBcImRpc2Nvbm5lY3RcIiBldmVudCBhdCB0aGUgU29ja2V0LklPIGxldmVsIHdoZW4gdGhlIHBhZ2UgaXNcbiAgICAgICAgICAgICAgICAvLyBjbG9zZWQvcmVsb2FkZWQpXG4gICAgICAgICAgICAgICAgdGhpcy5iZWZvcmV1bmxvYWRFdmVudExpc3RlbmVyID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFuc3BvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbGVudGx5IGNsb3NlIHRoZSB0cmFuc3BvcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcihcImJlZm9yZXVubG9hZFwiLCB0aGlzLmJlZm9yZXVubG9hZEV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmhvc3RuYW1lICE9PSBcImxvY2FsaG9zdFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmZsaW5lRXZlbnRMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkNsb3NlKFwidHJhbnNwb3J0IGNsb3NlXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIm5ldHdvcmsgY29ubmVjdGlvbiBsb3N0XCIsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcihcIm9mZmxpbmVcIiwgdGhpcy5vZmZsaW5lRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRyYW5zcG9ydCBvZiB0aGUgZ2l2ZW4gdHlwZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gdHJhbnNwb3J0IG5hbWVcbiAgICAgKiBAcmV0dXJuIHtUcmFuc3BvcnR9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjcmVhdGVUcmFuc3BvcnQobmFtZSkge1xuICAgICAgICBjb25zdCBxdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMub3B0cy5xdWVyeSk7XG4gICAgICAgIC8vIGFwcGVuZCBlbmdpbmUuaW8gcHJvdG9jb2wgaWRlbnRpZmllclxuICAgICAgICBxdWVyeS5FSU8gPSBwcm90b2NvbDtcbiAgICAgICAgLy8gdHJhbnNwb3J0IG5hbWVcbiAgICAgICAgcXVlcnkudHJhbnNwb3J0ID0gbmFtZTtcbiAgICAgICAgLy8gc2Vzc2lvbiBpZCBpZiB3ZSBhbHJlYWR5IGhhdmUgb25lXG4gICAgICAgIGlmICh0aGlzLmlkKVxuICAgICAgICAgICAgcXVlcnkuc2lkID0gdGhpcy5pZDtcbiAgICAgICAgY29uc3Qgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMub3B0cy50cmFuc3BvcnRPcHRpb25zW25hbWVdLCB0aGlzLm9wdHMsIHtcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgc29ja2V0OiB0aGlzLFxuICAgICAgICAgICAgaG9zdG5hbWU6IHRoaXMuaG9zdG5hbWUsXG4gICAgICAgICAgICBzZWN1cmU6IHRoaXMuc2VjdXJlLFxuICAgICAgICAgICAgcG9ydDogdGhpcy5wb3J0LFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyB0cmFuc3BvcnRzW25hbWVdKG9wdHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0cmFuc3BvcnQgdG8gdXNlIGFuZCBzdGFydHMgcHJvYmUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9wZW4oKSB7XG4gICAgICAgIGxldCB0cmFuc3BvcnQ7XG4gICAgICAgIGlmICh0aGlzLm9wdHMucmVtZW1iZXJVcGdyYWRlICYmXG4gICAgICAgICAgICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzICYmXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydHMuaW5kZXhPZihcIndlYnNvY2tldFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRyYW5zcG9ydCA9IFwid2Vic29ja2V0XCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoMCA9PT0gdGhpcy50cmFuc3BvcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gRW1pdCBlcnJvciBvbiBuZXh0IHRpY2sgc28gaXQgY2FuIGJlIGxpc3RlbmVkIHRvXG4gICAgICAgICAgICB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBcIk5vIHRyYW5zcG9ydHMgYXZhaWxhYmxlXCIpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSB0aGlzLnRyYW5zcG9ydHNbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJvcGVuaW5nXCI7XG4gICAgICAgIC8vIFJldHJ5IHdpdGggdGhlIG5leHQgdHJhbnNwb3J0IGlmIHRoZSB0cmFuc3BvcnQgaXMgZGlzYWJsZWQgKGpzb25wOiBmYWxzZSlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydCA9IHRoaXMuY3JlYXRlVHJhbnNwb3J0KHRyYW5zcG9ydCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0cy5zaGlmdCgpO1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJhbnNwb3J0Lm9wZW4oKTtcbiAgICAgICAgdGhpcy5zZXRUcmFuc3BvcnQodHJhbnNwb3J0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB0cmFuc3BvcnQuIERpc2FibGVzIHRoZSBleGlzdGluZyBvbmUgKGlmIGFueSkuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHNldFRyYW5zcG9ydCh0cmFuc3BvcnQpIHtcbiAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzZXQgdXAgdHJhbnNwb3J0XG4gICAgICAgIHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xuICAgICAgICAvLyBzZXQgdXAgdHJhbnNwb3J0IGxpc3RlbmVyc1xuICAgICAgICB0cmFuc3BvcnRcbiAgICAgICAgICAgIC5vbihcImRyYWluXCIsIHRoaXMub25EcmFpbi5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgLm9uKFwicGFja2V0XCIsIHRoaXMub25QYWNrZXQuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcImVycm9yXCIsIHRoaXMub25FcnJvci5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgLm9uKFwiY2xvc2VcIiwgKHJlYXNvbikgPT4gdGhpcy5vbkNsb3NlKFwidHJhbnNwb3J0IGNsb3NlXCIsIHJlYXNvbikpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm9iZXMgYSB0cmFuc3BvcnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRyYW5zcG9ydCBuYW1lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcm9iZShuYW1lKSB7XG4gICAgICAgIGxldCB0cmFuc3BvcnQgPSB0aGlzLmNyZWF0ZVRyYW5zcG9ydChuYW1lKTtcbiAgICAgICAgbGV0IGZhaWxlZCA9IGZhbHNlO1xuICAgICAgICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IG9uVHJhbnNwb3J0T3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgdHJhbnNwb3J0LnNlbmQoW3sgdHlwZTogXCJwaW5nXCIsIGRhdGE6IFwicHJvYmVcIiB9XSk7XG4gICAgICAgICAgICB0cmFuc3BvcnQub25jZShcInBhY2tldFwiLCAobXNnKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZhaWxlZClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChcInBvbmdcIiA9PT0gbXNnLnR5cGUgJiYgXCJwcm9iZVwiID09PSBtc2cuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZ3JhZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkaW5nXCIsIHRyYW5zcG9ydCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHJhbnNwb3J0KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzID0gXCJ3ZWJzb2NrZXRcIiA9PT0gdHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnBhdXNlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFwiY2xvc2VkXCIgPT09IHRoaXMucmVhZHlTdGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRyYW5zcG9ydCh0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0LnNlbmQoW3sgdHlwZTogXCJ1cGdyYWRlXCIgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJ1cGdyYWRlXCIsIHRyYW5zcG9ydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGdyYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoXCJwcm9iZSBlcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBlcnIudHJhbnNwb3J0ID0gdHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkZUVycm9yXCIsIGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGZ1bmN0aW9uIGZyZWV6ZVRyYW5zcG9ydCgpIHtcbiAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgLy8gQW55IGNhbGxiYWNrIGNhbGxlZCBieSB0cmFuc3BvcnQgc2hvdWxkIGJlIGlnbm9yZWQgc2luY2Ugbm93XG4gICAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgdHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSBhbnkgZXJyb3IgdGhhdCBoYXBwZW5zIHdoaWxlIHByb2JpbmdcbiAgICAgICAgY29uc3Qgb25lcnJvciA9IChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKFwicHJvYmUgZXJyb3I6IFwiICsgZXJyKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGVycm9yLnRyYW5zcG9ydCA9IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgZnJlZXplVHJhbnNwb3J0KCk7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGVFcnJvclwiLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIGZ1bmN0aW9uIG9uVHJhbnNwb3J0Q2xvc2UoKSB7XG4gICAgICAgICAgICBvbmVycm9yKFwidHJhbnNwb3J0IGNsb3NlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGVuIHRoZSBzb2NrZXQgaXMgY2xvc2VkIHdoaWxlIHdlJ3JlIHByb2JpbmdcbiAgICAgICAgZnVuY3Rpb24gb25jbG9zZSgpIHtcbiAgICAgICAgICAgIG9uZXJyb3IoXCJzb2NrZXQgY2xvc2VkXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdoZW4gdGhlIHNvY2tldCBpcyB1cGdyYWRlZCB3aGlsZSB3ZSdyZSBwcm9iaW5nXG4gICAgICAgIGZ1bmN0aW9uIG9udXBncmFkZSh0bykge1xuICAgICAgICAgICAgaWYgKHRyYW5zcG9ydCAmJiB0by5uYW1lICE9PSB0cmFuc3BvcnQubmFtZSkge1xuICAgICAgICAgICAgICAgIGZyZWV6ZVRyYW5zcG9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9uIHRoZSB0cmFuc3BvcnQgYW5kIG9uIHNlbGZcbiAgICAgICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcIm9wZW5cIiwgb25UcmFuc3BvcnRPcGVuKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIG9uZXJyb3IpO1xuICAgICAgICAgICAgdHJhbnNwb3J0LnJlbW92ZUxpc3RlbmVyKFwiY2xvc2VcIiwgb25UcmFuc3BvcnRDbG9zZSk7XG4gICAgICAgICAgICB0aGlzLm9mZihcImNsb3NlXCIsIG9uY2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJ1cGdyYWRpbmdcIiwgb251cGdyYWRlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJhbnNwb3J0Lm9uY2UoXCJvcGVuXCIsIG9uVHJhbnNwb3J0T3Blbik7XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwiZXJyb3JcIiwgb25lcnJvcik7XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwiY2xvc2VcIiwgb25UcmFuc3BvcnRDbG9zZSk7XG4gICAgICAgIHRoaXMub25jZShcImNsb3NlXCIsIG9uY2xvc2UpO1xuICAgICAgICB0aGlzLm9uY2UoXCJ1cGdyYWRpbmdcIiwgb251cGdyYWRlKTtcbiAgICAgICAgaWYgKHRoaXMudXBncmFkZXMuaW5kZXhPZihcIndlYnRyYW5zcG9ydFwiKSAhPT0gLTEgJiZcbiAgICAgICAgICAgIG5hbWUgIT09IFwid2VidHJhbnNwb3J0XCIpIHtcbiAgICAgICAgICAgIC8vIGZhdm9yIFdlYlRyYW5zcG9ydFxuICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZmFpbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydC5vcGVuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5vcGVuKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gY29ubmVjdGlvbiBpcyBkZWVtZWQgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25PcGVuKCkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcIm9wZW5cIjtcbiAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IFwid2Vic29ja2V0XCIgPT09IHRoaXMudHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICAgICAgdGhpcy5mbHVzaCgpO1xuICAgICAgICAvLyB3ZSBjaGVjayBmb3IgYHJlYWR5U3RhdGVgIGluIGNhc2UgYW4gYG9wZW5gXG4gICAgICAgIC8vIGxpc3RlbmVyIGFscmVhZHkgY2xvc2VkIHRoZSBzb2NrZXRcbiAgICAgICAgaWYgKFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUgJiYgdGhpcy5vcHRzLnVwZ3JhZGUpIHtcbiAgICAgICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgICAgIGNvbnN0IGwgPSB0aGlzLnVwZ3JhZGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9iZSh0aGlzLnVwZ3JhZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvblBhY2tldChwYWNrZXQpIHtcbiAgICAgICAgaWYgKFwib3BlbmluZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgfHxcbiAgICAgICAgICAgIFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUgfHxcbiAgICAgICAgICAgIFwiY2xvc2luZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGFja2V0XCIsIHBhY2tldCk7XG4gICAgICAgICAgICAvLyBTb2NrZXQgaXMgbGl2ZSAtIGFueSBwYWNrZXQgY291bnRzXG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImhlYXJ0YmVhdFwiKTtcbiAgICAgICAgICAgIHN3aXRjaCAocGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwib3BlblwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uSGFuZHNoYWtlKEpTT04ucGFyc2UocGFja2V0LmRhdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcInBpbmdcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNldFBpbmdUaW1lb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZFBhY2tldChcInBvbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGluZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwb25nXCIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKFwic2VydmVyIGVycm9yXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGVyci5jb2RlID0gcGFja2V0LmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwibWVzc2FnZVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRhdGFcIiwgcGFja2V0LmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcIm1lc3NhZ2VcIiwgcGFja2V0LmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBoYW5kc2hha2UgY29tcGxldGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gaGFuZHNoYWtlIG9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25IYW5kc2hha2UoZGF0YSkge1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImhhbmRzaGFrZVwiLCBkYXRhKTtcbiAgICAgICAgdGhpcy5pZCA9IGRhdGEuc2lkO1xuICAgICAgICB0aGlzLnRyYW5zcG9ydC5xdWVyeS5zaWQgPSBkYXRhLnNpZDtcbiAgICAgICAgdGhpcy51cGdyYWRlcyA9IHRoaXMuZmlsdGVyVXBncmFkZXMoZGF0YS51cGdyYWRlcyk7XG4gICAgICAgIHRoaXMucGluZ0ludGVydmFsID0gZGF0YS5waW5nSW50ZXJ2YWw7XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXQgPSBkYXRhLnBpbmdUaW1lb3V0O1xuICAgICAgICB0aGlzLm1heFBheWxvYWQgPSBkYXRhLm1heFBheWxvYWQ7XG4gICAgICAgIHRoaXMub25PcGVuKCk7XG4gICAgICAgIC8vIEluIGNhc2Ugb3BlbiBoYW5kbGVyIGNsb3NlcyBzb2NrZXRcbiAgICAgICAgaWYgKFwiY2xvc2VkXCIgPT09IHRoaXMucmVhZHlTdGF0ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5yZXNldFBpbmdUaW1lb3V0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgYW5kIHJlc2V0cyBwaW5nIHRpbWVvdXQgdGltZXIgYmFzZWQgb24gc2VydmVyIHBpbmdzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICByZXNldFBpbmdUaW1lb3V0KCkge1xuICAgICAgICB0aGlzLmNsZWFyVGltZW91dEZuKHRoaXMucGluZ1RpbWVvdXRUaW1lcik7XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXRUaW1lciA9IHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25DbG9zZShcInBpbmcgdGltZW91dFwiKTtcbiAgICAgICAgfSwgdGhpcy5waW5nSW50ZXJ2YWwgKyB0aGlzLnBpbmdUaW1lb3V0KTtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgIHRoaXMucGluZ1RpbWVvdXRUaW1lci51bnJlZigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCBvbiBgZHJhaW5gIGV2ZW50XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uRHJhaW4oKSB7XG4gICAgICAgIHRoaXMud3JpdGVCdWZmZXIuc3BsaWNlKDAsIHRoaXMucHJldkJ1ZmZlckxlbik7XG4gICAgICAgIC8vIHNldHRpbmcgcHJldkJ1ZmZlckxlbiA9IDAgaXMgdmVyeSBpbXBvcnRhbnRcbiAgICAgICAgLy8gZm9yIGV4YW1wbGUsIHdoZW4gdXBncmFkaW5nLCB1cGdyYWRlIHBhY2tldCBpcyBzZW50IG92ZXIsXG4gICAgICAgIC8vIGFuZCBhIG5vbnplcm8gcHJldkJ1ZmZlckxlbiBjb3VsZCBjYXVzZSBwcm9ibGVtcyBvbiBgZHJhaW5gXG4gICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IDA7XG4gICAgICAgIGlmICgwID09PSB0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBGbHVzaCB3cml0ZSBidWZmZXJzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBmbHVzaCgpIHtcbiAgICAgICAgaWYgKFwiY2xvc2VkXCIgIT09IHRoaXMucmVhZHlTdGF0ZSAmJlxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQud3JpdGFibGUgJiZcbiAgICAgICAgICAgICF0aGlzLnVwZ3JhZGluZyAmJlxuICAgICAgICAgICAgdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2tldHMgPSB0aGlzLmdldFdyaXRhYmxlUGFja2V0cygpO1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQuc2VuZChwYWNrZXRzKTtcbiAgICAgICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgY3VycmVudCBsZW5ndGggb2Ygd3JpdGVCdWZmZXJcbiAgICAgICAgICAgIC8vIHNwbGljZSB3cml0ZUJ1ZmZlciBhbmQgY2FsbGJhY2tCdWZmZXIgb24gYGRyYWluYFxuICAgICAgICAgICAgdGhpcy5wcmV2QnVmZmVyTGVuID0gcGFja2V0cy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImZsdXNoXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGUgZW5jb2RlZCBzaXplIG9mIHRoZSB3cml0ZUJ1ZmZlciBpcyBiZWxvdyB0aGUgbWF4UGF5bG9hZCB2YWx1ZSBzZW50IGJ5IHRoZSBzZXJ2ZXIgKG9ubHkgZm9yIEhUVFBcbiAgICAgKiBsb25nLXBvbGxpbmcpXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldFdyaXRhYmxlUGFja2V0cygpIHtcbiAgICAgICAgY29uc3Qgc2hvdWxkQ2hlY2tQYXlsb2FkU2l6ZSA9IHRoaXMubWF4UGF5bG9hZCAmJlxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQubmFtZSA9PT0gXCJwb2xsaW5nXCIgJiZcbiAgICAgICAgICAgIHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoID4gMTtcbiAgICAgICAgaWYgKCFzaG91bGRDaGVja1BheWxvYWRTaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cml0ZUJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcGF5bG9hZFNpemUgPSAxOyAvLyBmaXJzdCBwYWNrZXQgdHlwZVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLndyaXRlQnVmZmVyW2ldLmRhdGE7XG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIHBheWxvYWRTaXplICs9IGJ5dGVMZW5ndGgoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA+IDAgJiYgcGF5bG9hZFNpemUgPiB0aGlzLm1heFBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53cml0ZUJ1ZmZlci5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBheWxvYWRTaXplICs9IDI7IC8vIHNlcGFyYXRvciArIHBhY2tldCB0eXBlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVCdWZmZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgLSBtZXNzYWdlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqIEByZXR1cm4ge1NvY2tldH0gZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHdyaXRlKG1zZywgb3B0aW9ucywgZm4pIHtcbiAgICAgICAgdGhpcy5zZW5kUGFja2V0KFwibWVzc2FnZVwiLCBtc2csIG9wdGlvbnMsIGZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHNlbmQobXNnLCBvcHRpb25zLCBmbikge1xuICAgICAgICB0aGlzLnNlbmRQYWNrZXQoXCJtZXNzYWdlXCIsIG1zZywgb3B0aW9ucywgZm4pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZTogcGFja2V0IHR5cGUuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGRhdGEuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gLSBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHNlbmRQYWNrZXQodHlwZSwgZGF0YSwgb3B0aW9ucywgZm4pIHtcbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGRhdGEpIHtcbiAgICAgICAgICAgIGZuID0gZGF0YTtcbiAgICAgICAgICAgIGRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGZuID0gb3B0aW9ucztcbiAgICAgICAgICAgIG9wdGlvbnMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImNsb3NpbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8IFwiY2xvc2VkXCIgPT09IHRoaXMucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBvcHRpb25zLmNvbXByZXNzID0gZmFsc2UgIT09IG9wdGlvbnMuY29tcHJlc3M7XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwYWNrZXRDcmVhdGVcIiwgcGFja2V0KTtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlci5wdXNoKHBhY2tldCk7XG4gICAgICAgIGlmIChmbilcbiAgICAgICAgICAgIHRoaXMub25jZShcImZsdXNoXCIsIGZuKTtcbiAgICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgdGhlIGNvbm5lY3Rpb24uXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IGNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlKFwiZm9yY2VkIGNsb3NlXCIpO1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQuY2xvc2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgY2xlYW51cEFuZENsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJ1cGdyYWRlXCIsIGNsZWFudXBBbmRDbG9zZSk7XG4gICAgICAgICAgICB0aGlzLm9mZihcInVwZ3JhZGVFcnJvclwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgd2FpdEZvclVwZ3JhZGUgPSAoKSA9PiB7XG4gICAgICAgICAgICAvLyB3YWl0IGZvciB1cGdyYWRlIHRvIGZpbmlzaCBzaW5jZSB3ZSBjYW4ndCBzZW5kIHBhY2tldHMgd2hpbGUgcGF1c2luZyBhIHRyYW5zcG9ydFxuICAgICAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkZVwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkZUVycm9yXCIsIGNsZWFudXBBbmRDbG9zZSk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChcIm9wZW5pbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8IFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwiY2xvc2luZ1wiO1xuICAgICAgICAgICAgaWYgKHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwiZHJhaW5cIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy51cGdyYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhaXRGb3JVcGdyYWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnVwZ3JhZGluZykge1xuICAgICAgICAgICAgICAgIHdhaXRGb3JVcGdyYWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiB0cmFuc3BvcnQgZXJyb3JcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25FcnJvcihlcnIpIHtcbiAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgICAgIHRoaXMub25DbG9zZShcInRyYW5zcG9ydCBlcnJvclwiLCBlcnIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiB0cmFuc3BvcnQgY2xvc2UuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uQ2xvc2UocmVhc29uLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBpZiAoXCJvcGVuaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fFxuICAgICAgICAgICAgXCJvcGVuXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fFxuICAgICAgICAgICAgXCJjbG9zaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgdGltZXJzXG4gICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dEZuKHRoaXMucGluZ1RpbWVvdXRUaW1lcik7XG4gICAgICAgICAgICAvLyBzdG9wIGV2ZW50IGZyb20gZmlyaW5nIGFnYWluIGZvciB0cmFuc3BvcnRcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnJlbW92ZUFsbExpc3RlbmVycyhcImNsb3NlXCIpO1xuICAgICAgICAgICAgLy8gZW5zdXJlIHRyYW5zcG9ydCB3b24ndCBzdGF5IG9wZW5cbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICAvLyBpZ25vcmUgZnVydGhlciB0cmFuc3BvcnQgY29tbXVuaWNhdGlvblxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlbW92ZUV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJiZWZvcmV1bmxvYWRcIiwgdGhpcy5iZWZvcmV1bmxvYWRFdmVudExpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm9mZmxpbmVcIiwgdGhpcy5vZmZsaW5lRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0IHJlYWR5IHN0YXRlXG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICAgICAgLy8gY2xlYXIgc2Vzc2lvbiBpZFxuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICAvLyBlbWl0IGNsb3NlIGV2ZW50XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNsb3NlXCIsIHJlYXNvbiwgZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgLy8gY2xlYW4gYnVmZmVycyBhZnRlciwgc28gdXNlcnMgY2FuIHN0aWxsXG4gICAgICAgICAgICAvLyBncmFiIHRoZSBidWZmZXJzIG9uIGBjbG9zZWAgZXZlbnRcbiAgICAgICAgICAgIHRoaXMud3JpdGVCdWZmZXIgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRmlsdGVycyB1cGdyYWRlcywgcmV0dXJuaW5nIG9ubHkgdGhvc2UgbWF0Y2hpbmcgY2xpZW50IHRyYW5zcG9ydHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSB1cGdyYWRlcyAtIHNlcnZlciB1cGdyYWRlc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZmlsdGVyVXBncmFkZXModXBncmFkZXMpIHtcbiAgICAgICAgY29uc3QgZmlsdGVyZWRVcGdyYWRlcyA9IFtdO1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIGNvbnN0IGogPSB1cGdyYWRlcy5sZW5ndGg7XG4gICAgICAgIGZvciAoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICBpZiAofnRoaXMudHJhbnNwb3J0cy5pbmRleE9mKHVwZ3JhZGVzW2ldKSlcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFVwZ3JhZGVzLnB1c2godXBncmFkZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWx0ZXJlZFVwZ3JhZGVzO1xuICAgIH1cbn1cblNvY2tldC5wcm90b2NvbCA9IHByb3RvY29sO1xuIiwiaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiZW5naW5lLmlvLWNsaWVudFwiO1xuLyoqXG4gKiBVUkwgcGFyc2VyLlxuICpcbiAqIEBwYXJhbSB1cmkgLSB1cmxcbiAqIEBwYXJhbSBwYXRoIC0gdGhlIHJlcXVlc3QgcGF0aCBvZiB0aGUgY29ubmVjdGlvblxuICogQHBhcmFtIGxvYyAtIEFuIG9iamVjdCBtZWFudCB0byBtaW1pYyB3aW5kb3cubG9jYXRpb24uXG4gKiAgICAgICAgRGVmYXVsdHMgdG8gd2luZG93LmxvY2F0aW9uLlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXJsKHVyaSwgcGF0aCA9IFwiXCIsIGxvYykge1xuICAgIGxldCBvYmogPSB1cmk7XG4gICAgLy8gZGVmYXVsdCB0byB3aW5kb3cubG9jYXRpb25cbiAgICBsb2MgPSBsb2MgfHwgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBsb2NhdGlvbik7XG4gICAgaWYgKG51bGwgPT0gdXJpKVxuICAgICAgICB1cmkgPSBsb2MucHJvdG9jb2wgKyBcIi8vXCIgKyBsb2MuaG9zdDtcbiAgICAvLyByZWxhdGl2ZSBwYXRoIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIHVyaSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAoXCIvXCIgPT09IHVyaS5jaGFyQXQoMCkpIHtcbiAgICAgICAgICAgIGlmIChcIi9cIiA9PT0gdXJpLmNoYXJBdCgxKSkge1xuICAgICAgICAgICAgICAgIHVyaSA9IGxvYy5wcm90b2NvbCArIHVyaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVyaSA9IGxvYy5ob3N0ICsgdXJpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghL14oaHR0cHM/fHdzcz8pOlxcL1xcLy8udGVzdCh1cmkpKSB7XG4gICAgICAgICAgICBpZiAoXCJ1bmRlZmluZWRcIiAhPT0gdHlwZW9mIGxvYykge1xuICAgICAgICAgICAgICAgIHVyaSA9IGxvYy5wcm90b2NvbCArIFwiLy9cIiArIHVyaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVyaSA9IFwiaHR0cHM6Ly9cIiArIHVyaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBwYXJzZVxuICAgICAgICBvYmogPSBwYXJzZSh1cmkpO1xuICAgIH1cbiAgICAvLyBtYWtlIHN1cmUgd2UgdHJlYXQgYGxvY2FsaG9zdDo4MGAgYW5kIGBsb2NhbGhvc3RgIGVxdWFsbHlcbiAgICBpZiAoIW9iai5wb3J0KSB7XG4gICAgICAgIGlmICgvXihodHRwfHdzKSQvLnRlc3Qob2JqLnByb3RvY29sKSkge1xuICAgICAgICAgICAgb2JqLnBvcnQgPSBcIjgwXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14oaHR0cHx3cylzJC8udGVzdChvYmoucHJvdG9jb2wpKSB7XG4gICAgICAgICAgICBvYmoucG9ydCA9IFwiNDQzXCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgb2JqLnBhdGggPSBvYmoucGF0aCB8fCBcIi9cIjtcbiAgICBjb25zdCBpcHY2ID0gb2JqLmhvc3QuaW5kZXhPZihcIjpcIikgIT09IC0xO1xuICAgIGNvbnN0IGhvc3QgPSBpcHY2ID8gXCJbXCIgKyBvYmouaG9zdCArIFwiXVwiIDogb2JqLmhvc3Q7XG4gICAgLy8gZGVmaW5lIHVuaXF1ZSBpZFxuICAgIG9iai5pZCA9IG9iai5wcm90b2NvbCArIFwiOi8vXCIgKyBob3N0ICsgXCI6XCIgKyBvYmoucG9ydCArIHBhdGg7XG4gICAgLy8gZGVmaW5lIGhyZWZcbiAgICBvYmouaHJlZiA9XG4gICAgICAgIG9iai5wcm90b2NvbCArXG4gICAgICAgICAgICBcIjovL1wiICtcbiAgICAgICAgICAgIGhvc3QgK1xuICAgICAgICAgICAgKGxvYyAmJiBsb2MucG9ydCA9PT0gb2JqLnBvcnQgPyBcIlwiIDogXCI6XCIgKyBvYmoucG9ydCk7XG4gICAgcmV0dXJuIG9iajtcbn1cbiIsImNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuY29uc3QgaXNWaWV3ID0gKG9iaikgPT4ge1xuICAgIHJldHVybiB0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBBcnJheUJ1ZmZlci5pc1ZpZXcob2JqKVxuICAgICAgICA6IG9iai5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcjtcbn07XG5jb25zdCB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5jb25zdCB3aXRoTmF0aXZlQmxvYiA9IHR5cGVvZiBCbG9iID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEJsb2IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgdG9TdHJpbmcuY2FsbChCbG9iKSA9PT0gXCJbb2JqZWN0IEJsb2JDb25zdHJ1Y3Rvcl1cIik7XG5jb25zdCB3aXRoTmF0aXZlRmlsZSA9IHR5cGVvZiBGaWxlID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEZpbGUgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgdG9TdHJpbmcuY2FsbChGaWxlKSA9PT0gXCJbb2JqZWN0IEZpbGVDb25zdHJ1Y3Rvcl1cIik7XG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiBvYmogaXMgYSBCdWZmZXIsIGFuIEFycmF5QnVmZmVyLCBhIEJsb2Igb3IgYSBGaWxlLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0JpbmFyeShvYmopIHtcbiAgICByZXR1cm4gKCh3aXRoTmF0aXZlQXJyYXlCdWZmZXIgJiYgKG9iaiBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGlzVmlldyhvYmopKSkgfHxcbiAgICAgICAgKHdpdGhOYXRpdmVCbG9iICYmIG9iaiBpbnN0YW5jZW9mIEJsb2IpIHx8XG4gICAgICAgICh3aXRoTmF0aXZlRmlsZSAmJiBvYmogaW5zdGFuY2VvZiBGaWxlKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gaGFzQmluYXJ5KG9iaiwgdG9KU09OKSB7XG4gICAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaGFzQmluYXJ5KG9ialtpXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpc0JpbmFyeShvYmopKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAob2JqLnRvSlNPTiAmJlxuICAgICAgICB0eXBlb2Ygb2JqLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgIGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGhhc0JpbmFyeShvYmoudG9KU09OKCksIHRydWUpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkgJiYgaGFzQmluYXJ5KG9ialtrZXldKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuIiwiaW1wb3J0IHsgaXNCaW5hcnkgfSBmcm9tIFwiLi9pcy1iaW5hcnkuanNcIjtcbi8qKlxuICogUmVwbGFjZXMgZXZlcnkgQnVmZmVyIHwgQXJyYXlCdWZmZXIgfCBCbG9iIHwgRmlsZSBpbiBwYWNrZXQgd2l0aCBhIG51bWJlcmVkIHBsYWNlaG9sZGVyLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXQgLSBzb2NrZXQuaW8gZXZlbnQgcGFja2V0XG4gKiBAcmV0dXJuIHtPYmplY3R9IHdpdGggZGVjb25zdHJ1Y3RlZCBwYWNrZXQgYW5kIGxpc3Qgb2YgYnVmZmVyc1xuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb25zdHJ1Y3RQYWNrZXQocGFja2V0KSB7XG4gICAgY29uc3QgYnVmZmVycyA9IFtdO1xuICAgIGNvbnN0IHBhY2tldERhdGEgPSBwYWNrZXQuZGF0YTtcbiAgICBjb25zdCBwYWNrID0gcGFja2V0O1xuICAgIHBhY2suZGF0YSA9IF9kZWNvbnN0cnVjdFBhY2tldChwYWNrZXREYXRhLCBidWZmZXJzKTtcbiAgICBwYWNrLmF0dGFjaG1lbnRzID0gYnVmZmVycy5sZW5ndGg7IC8vIG51bWJlciBvZiBiaW5hcnkgJ2F0dGFjaG1lbnRzJ1xuICAgIHJldHVybiB7IHBhY2tldDogcGFjaywgYnVmZmVyczogYnVmZmVycyB9O1xufVxuZnVuY3Rpb24gX2RlY29uc3RydWN0UGFja2V0KGRhdGEsIGJ1ZmZlcnMpIHtcbiAgICBpZiAoIWRhdGEpXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIGlmIChpc0JpbmFyeShkYXRhKSkge1xuICAgICAgICBjb25zdCBwbGFjZWhvbGRlciA9IHsgX3BsYWNlaG9sZGVyOiB0cnVlLCBudW06IGJ1ZmZlcnMubGVuZ3RoIH07XG4gICAgICAgIGJ1ZmZlcnMucHVzaChkYXRhKTtcbiAgICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICAgIH1cbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgIGNvbnN0IG5ld0RhdGEgPSBuZXcgQXJyYXkoZGF0YS5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5ld0RhdGFbaV0gPSBfZGVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtpXSwgYnVmZmVycyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld0RhdGE7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiICYmICEoZGF0YSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICAgIGNvbnN0IG5ld0RhdGEgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgbmV3RGF0YVtrZXldID0gX2RlY29uc3RydWN0UGFja2V0KGRhdGFba2V5XSwgYnVmZmVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld0RhdGE7XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xufVxuLyoqXG4gKiBSZWNvbnN0cnVjdHMgYSBiaW5hcnkgcGFja2V0IGZyb20gaXRzIHBsYWNlaG9sZGVyIHBhY2tldCBhbmQgYnVmZmVyc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXQgLSBldmVudCBwYWNrZXQgd2l0aCBwbGFjZWhvbGRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGJ1ZmZlcnMgLSBiaW5hcnkgYnVmZmVycyB0byBwdXQgaW4gcGxhY2Vob2xkZXIgcG9zaXRpb25zXG4gKiBAcmV0dXJuIHtPYmplY3R9IHJlY29uc3RydWN0ZWQgcGFja2V0XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNvbnN0cnVjdFBhY2tldChwYWNrZXQsIGJ1ZmZlcnMpIHtcbiAgICBwYWNrZXQuZGF0YSA9IF9yZWNvbnN0cnVjdFBhY2tldChwYWNrZXQuZGF0YSwgYnVmZmVycyk7XG4gICAgZGVsZXRlIHBhY2tldC5hdHRhY2htZW50czsgLy8gbm8gbG9uZ2VyIHVzZWZ1bFxuICAgIHJldHVybiBwYWNrZXQ7XG59XG5mdW5jdGlvbiBfcmVjb25zdHJ1Y3RQYWNrZXQoZGF0YSwgYnVmZmVycykge1xuICAgIGlmICghZGF0YSlcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgaWYgKGRhdGEgJiYgZGF0YS5fcGxhY2Vob2xkZXIgPT09IHRydWUpIHtcbiAgICAgICAgY29uc3QgaXNJbmRleFZhbGlkID0gdHlwZW9mIGRhdGEubnVtID09PSBcIm51bWJlclwiICYmXG4gICAgICAgICAgICBkYXRhLm51bSA+PSAwICYmXG4gICAgICAgICAgICBkYXRhLm51bSA8IGJ1ZmZlcnMubGVuZ3RoO1xuICAgICAgICBpZiAoaXNJbmRleFZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gYnVmZmVyc1tkYXRhLm51bV07IC8vIGFwcHJvcHJpYXRlIGJ1ZmZlciAoc2hvdWxkIGJlIG5hdHVyYWwgb3JkZXIgYW55d2F5KVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaWxsZWdhbCBhdHRhY2htZW50c1wiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZGF0YVtpXSA9IF9yZWNvbnN0cnVjdFBhY2tldChkYXRhW2ldLCBidWZmZXJzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGtleSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhW2tleV0gPSBfcmVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtrZXldLCBidWZmZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbn1cbiIsImltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgZGVjb25zdHJ1Y3RQYWNrZXQsIHJlY29uc3RydWN0UGFja2V0IH0gZnJvbSBcIi4vYmluYXJ5LmpzXCI7XG5pbXBvcnQgeyBpc0JpbmFyeSwgaGFzQmluYXJ5IH0gZnJvbSBcIi4vaXMtYmluYXJ5LmpzXCI7XG4vKipcbiAqIFRoZXNlIHN0cmluZ3MgbXVzdCBub3QgYmUgdXNlZCBhcyBldmVudCBuYW1lcywgYXMgdGhleSBoYXZlIGEgc3BlY2lhbCBtZWFuaW5nLlxuICovXG5jb25zdCBSRVNFUlZFRF9FVkVOVFMgPSBbXG4gICAgXCJjb25uZWN0XCIsXG4gICAgXCJjb25uZWN0X2Vycm9yXCIsXG4gICAgXCJkaXNjb25uZWN0XCIsXG4gICAgXCJkaXNjb25uZWN0aW5nXCIsXG4gICAgXCJuZXdMaXN0ZW5lclwiLFxuICAgIFwicmVtb3ZlTGlzdGVuZXJcIiwgLy8gdXNlZCBieSB0aGUgTm9kZS5qcyBFdmVudEVtaXR0ZXJcbl07XG4vKipcbiAqIFByb3RvY29sIHZlcnNpb24uXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgcHJvdG9jb2wgPSA1O1xuZXhwb3J0IHZhciBQYWNrZXRUeXBlO1xuKGZ1bmN0aW9uIChQYWNrZXRUeXBlKSB7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQ09OTkVDVFwiXSA9IDBdID0gXCJDT05ORUNUXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiRElTQ09OTkVDVFwiXSA9IDFdID0gXCJESVNDT05ORUNUXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiRVZFTlRcIl0gPSAyXSA9IFwiRVZFTlRcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJBQ0tcIl0gPSAzXSA9IFwiQUNLXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQ09OTkVDVF9FUlJPUlwiXSA9IDRdID0gXCJDT05ORUNUX0VSUk9SXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQklOQVJZX0VWRU5UXCJdID0gNV0gPSBcIkJJTkFSWV9FVkVOVFwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkJJTkFSWV9BQ0tcIl0gPSA2XSA9IFwiQklOQVJZX0FDS1wiO1xufSkoUGFja2V0VHlwZSB8fCAoUGFja2V0VHlwZSA9IHt9KSk7XG4vKipcbiAqIEEgc29ja2V0LmlvIEVuY29kZXIgaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGNsYXNzIEVuY29kZXIge1xuICAgIC8qKlxuICAgICAqIEVuY29kZXIgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlcGxhY2VyIC0gY3VzdG9tIHJlcGxhY2VyIHRvIHBhc3MgZG93biB0byBKU09OLnBhcnNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocmVwbGFjZXIpIHtcbiAgICAgICAgdGhpcy5yZXBsYWNlciA9IHJlcGxhY2VyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNvZGUgYSBwYWNrZXQgYXMgYSBzaW5nbGUgc3RyaW5nIGlmIG5vbi1iaW5hcnksIG9yIGFzIGFcbiAgICAgKiBidWZmZXIgc2VxdWVuY2UsIGRlcGVuZGluZyBvbiBwYWNrZXQgdHlwZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogLSBwYWNrZXQgb2JqZWN0XG4gICAgICovXG4gICAgZW5jb2RlKG9iaikge1xuICAgICAgICBpZiAob2JqLnR5cGUgPT09IFBhY2tldFR5cGUuRVZFTlQgfHwgb2JqLnR5cGUgPT09IFBhY2tldFR5cGUuQUNLKSB7XG4gICAgICAgICAgICBpZiAoaGFzQmluYXJ5KG9iaikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lbmNvZGVBc0JpbmFyeSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG9iai50eXBlID09PSBQYWNrZXRUeXBlLkVWRU5UXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFBhY2tldFR5cGUuQklOQVJZX0FDSyxcbiAgICAgICAgICAgICAgICAgICAgbnNwOiBvYmoubnNwLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBvYmouZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IG9iai5pZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3RoaXMuZW5jb2RlQXNTdHJpbmcob2JqKV07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZSBwYWNrZXQgYXMgc3RyaW5nLlxuICAgICAqL1xuICAgIGVuY29kZUFzU3RyaW5nKG9iaikge1xuICAgICAgICAvLyBmaXJzdCBpcyB0eXBlXG4gICAgICAgIGxldCBzdHIgPSBcIlwiICsgb2JqLnR5cGU7XG4gICAgICAgIC8vIGF0dGFjaG1lbnRzIGlmIHdlIGhhdmUgdGhlbVxuICAgICAgICBpZiAob2JqLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UIHx8XG4gICAgICAgICAgICBvYmoudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfQUNLKSB7XG4gICAgICAgICAgICBzdHIgKz0gb2JqLmF0dGFjaG1lbnRzICsgXCItXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgd2UgaGF2ZSBhIG5hbWVzcGFjZSBvdGhlciB0aGFuIGAvYFxuICAgICAgICAvLyB3ZSBhcHBlbmQgaXQgZm9sbG93ZWQgYnkgYSBjb21tYSBgLGBcbiAgICAgICAgaWYgKG9iai5uc3AgJiYgXCIvXCIgIT09IG9iai5uc3ApIHtcbiAgICAgICAgICAgIHN0ciArPSBvYmoubnNwICsgXCIsXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW1tZWRpYXRlbHkgZm9sbG93ZWQgYnkgdGhlIGlkXG4gICAgICAgIGlmIChudWxsICE9IG9iai5pZCkge1xuICAgICAgICAgICAgc3RyICs9IG9iai5pZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBqc29uIGRhdGFcbiAgICAgICAgaWYgKG51bGwgIT0gb2JqLmRhdGEpIHtcbiAgICAgICAgICAgIHN0ciArPSBKU09OLnN0cmluZ2lmeShvYmouZGF0YSwgdGhpcy5yZXBsYWNlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlIHBhY2tldCBhcyAnYnVmZmVyIHNlcXVlbmNlJyBieSByZW1vdmluZyBibG9icywgYW5kXG4gICAgICogZGVjb25zdHJ1Y3RpbmcgcGFja2V0IGludG8gb2JqZWN0IHdpdGggcGxhY2Vob2xkZXJzIGFuZFxuICAgICAqIGEgbGlzdCBvZiBidWZmZXJzLlxuICAgICAqL1xuICAgIGVuY29kZUFzQmluYXJ5KG9iaikge1xuICAgICAgICBjb25zdCBkZWNvbnN0cnVjdGlvbiA9IGRlY29uc3RydWN0UGFja2V0KG9iaik7XG4gICAgICAgIGNvbnN0IHBhY2sgPSB0aGlzLmVuY29kZUFzU3RyaW5nKGRlY29uc3RydWN0aW9uLnBhY2tldCk7XG4gICAgICAgIGNvbnN0IGJ1ZmZlcnMgPSBkZWNvbnN0cnVjdGlvbi5idWZmZXJzO1xuICAgICAgICBidWZmZXJzLnVuc2hpZnQocGFjayk7IC8vIGFkZCBwYWNrZXQgaW5mbyB0byBiZWdpbm5pbmcgb2YgZGF0YSBsaXN0XG4gICAgICAgIHJldHVybiBidWZmZXJzOyAvLyB3cml0ZSBhbGwgdGhlIGJ1ZmZlcnNcbiAgICB9XG59XG4vLyBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODUxMTI4MS9jaGVjay1pZi1hLXZhbHVlLWlzLWFuLW9iamVjdC1pbi1qYXZhc2NyaXB0XG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBcIltvYmplY3QgT2JqZWN0XVwiO1xufVxuLyoqXG4gKiBBIHNvY2tldC5pbyBEZWNvZGVyIGluc3RhbmNlXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBkZWNvZGVyXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNvZGVyIGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogRGVjb2RlciBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmV2aXZlciAtIGN1c3RvbSByZXZpdmVyIHRvIHBhc3MgZG93biB0byBKU09OLnN0cmluZ2lmeVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHJldml2ZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZXZpdmVyID0gcmV2aXZlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBhbiBlbmNvZGVkIHBhY2tldCBzdHJpbmcgaW50byBwYWNrZXQgSlNPTi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmogLSBlbmNvZGVkIHBhY2tldFxuICAgICAqL1xuICAgIGFkZChvYmopIHtcbiAgICAgICAgbGV0IHBhY2tldDtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnb3QgcGxhaW50ZXh0IGRhdGEgd2hlbiByZWNvbnN0cnVjdGluZyBhIHBhY2tldFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhY2tldCA9IHRoaXMuZGVjb2RlU3RyaW5nKG9iaik7XG4gICAgICAgICAgICBjb25zdCBpc0JpbmFyeUV2ZW50ID0gcGFja2V0LnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UO1xuICAgICAgICAgICAgaWYgKGlzQmluYXJ5RXZlbnQgfHwgcGFja2V0LnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0FDSykge1xuICAgICAgICAgICAgICAgIHBhY2tldC50eXBlID0gaXNCaW5hcnlFdmVudCA/IFBhY2tldFR5cGUuRVZFTlQgOiBQYWNrZXRUeXBlLkFDSztcbiAgICAgICAgICAgICAgICAvLyBiaW5hcnkgcGFja2V0J3MganNvblxuICAgICAgICAgICAgICAgIHRoaXMucmVjb25zdHJ1Y3RvciA9IG5ldyBCaW5hcnlSZWNvbnN0cnVjdG9yKHBhY2tldCk7XG4gICAgICAgICAgICAgICAgLy8gbm8gYXR0YWNobWVudHMsIGxhYmVsZWQgYmluYXJ5IGJ1dCBubyBiaW5hcnkgZGF0YSB0byBmb2xsb3dcbiAgICAgICAgICAgICAgICBpZiAocGFja2V0LmF0dGFjaG1lbnRzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImRlY29kZWRcIiwgcGFja2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBub24tYmluYXJ5IGZ1bGwgcGFja2V0XG4gICAgICAgICAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwiZGVjb2RlZFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQmluYXJ5KG9iaikgfHwgb2JqLmJhc2U2NCkge1xuICAgICAgICAgICAgLy8gcmF3IGJpbmFyeSBkYXRhXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImdvdCBiaW5hcnkgZGF0YSB3aGVuIG5vdCByZWNvbnN0cnVjdGluZyBhIHBhY2tldFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhY2tldCA9IHRoaXMucmVjb25zdHJ1Y3Rvci50YWtlQmluYXJ5RGF0YShvYmopO1xuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVjZWl2ZWQgZmluYWwgYnVmZmVyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVjb25zdHJ1Y3RvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImRlY29kZWRcIiwgcGFja2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHR5cGU6IFwiICsgb2JqKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWNvZGUgYSBwYWNrZXQgU3RyaW5nIChKU09OIGRhdGEpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBwYWNrZXRcbiAgICAgKi9cbiAgICBkZWNvZGVTdHJpbmcoc3RyKSB7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgLy8gbG9vayB1cCB0eXBlXG4gICAgICAgIGNvbnN0IHAgPSB7XG4gICAgICAgICAgICB0eXBlOiBOdW1iZXIoc3RyLmNoYXJBdCgwKSksXG4gICAgICAgIH07XG4gICAgICAgIGlmIChQYWNrZXRUeXBlW3AudHlwZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBwYWNrZXQgdHlwZSBcIiArIHAudHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbG9vayB1cCBhdHRhY2htZW50cyBpZiB0eXBlIGJpbmFyeVxuICAgICAgICBpZiAocC50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVCB8fFxuICAgICAgICAgICAgcC50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9BQ0spIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgICB3aGlsZSAoc3RyLmNoYXJBdCgrK2kpICE9PSBcIi1cIiAmJiBpICE9IHN0ci5sZW5ndGgpIHsgfVxuICAgICAgICAgICAgY29uc3QgYnVmID0gc3RyLnN1YnN0cmluZyhzdGFydCwgaSk7XG4gICAgICAgICAgICBpZiAoYnVmICE9IE51bWJlcihidWYpIHx8IHN0ci5jaGFyQXQoaSkgIT09IFwiLVwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSWxsZWdhbCBhdHRhY2htZW50c1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHAuYXR0YWNobWVudHMgPSBOdW1iZXIoYnVmKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb29rIHVwIG5hbWVzcGFjZSAoaWYgYW55KVxuICAgICAgICBpZiAoXCIvXCIgPT09IHN0ci5jaGFyQXQoaSArIDEpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgd2hpbGUgKCsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGMgPSBzdHIuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgIGlmIChcIixcIiA9PT0gYylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcC5uc3AgPSBzdHIuc3Vic3RyaW5nKHN0YXJ0LCBpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHAubnNwID0gXCIvXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbG9vayB1cCBpZFxuICAgICAgICBjb25zdCBuZXh0ID0gc3RyLmNoYXJBdChpICsgMSk7XG4gICAgICAgIGlmIChcIlwiICE9PSBuZXh0ICYmIE51bWJlcihuZXh0KSA9PSBuZXh0KSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgd2hpbGUgKCsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGMgPSBzdHIuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgIGlmIChudWxsID09IGMgfHwgTnVtYmVyKGMpICE9IGMpIHtcbiAgICAgICAgICAgICAgICAgICAgLS1pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcC5pZCA9IE51bWJlcihzdHIuc3Vic3RyaW5nKHN0YXJ0LCBpICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvb2sgdXAganNvbiBkYXRhXG4gICAgICAgIGlmIChzdHIuY2hhckF0KCsraSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSB0aGlzLnRyeVBhcnNlKHN0ci5zdWJzdHIoaSkpO1xuICAgICAgICAgICAgaWYgKERlY29kZXIuaXNQYXlsb2FkVmFsaWQocC50eXBlLCBwYXlsb2FkKSkge1xuICAgICAgICAgICAgICAgIHAuZGF0YSA9IHBheWxvYWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHBheWxvYWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuICAgIHRyeVBhcnNlKHN0cikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uoc3RyLCB0aGlzLnJldml2ZXIpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGlzUGF5bG9hZFZhbGlkKHR5cGUsIHBheWxvYWQpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNPYmplY3QocGF5bG9hZCk7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRElTQ09OTkVDVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF5bG9hZCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkNPTk5FQ1RfRVJST1I6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiIHx8IGlzT2JqZWN0KHBheWxvYWQpO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkVWRU5UOlxuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gKEFycmF5LmlzQXJyYXkocGF5bG9hZCkgJiZcbiAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiBwYXlsb2FkWzBdID09PSBcIm51bWJlclwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAodHlwZW9mIHBheWxvYWRbMF0gPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSRVNFUlZFRF9FVkVOVFMuaW5kZXhPZihwYXlsb2FkWzBdKSA9PT0gLTEpKSk7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQUNLOlxuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkJJTkFSWV9BQ0s6XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocGF5bG9hZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVhbGxvY2F0ZXMgYSBwYXJzZXIncyByZXNvdXJjZXNcbiAgICAgKi9cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5yZWNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IuZmluaXNoZWRSZWNvbnN0cnVjdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5yZWNvbnN0cnVjdG9yID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8qKlxuICogQSBtYW5hZ2VyIG9mIGEgYmluYXJ5IGV2ZW50J3MgJ2J1ZmZlciBzZXF1ZW5jZScuIFNob3VsZFxuICogYmUgY29uc3RydWN0ZWQgd2hlbmV2ZXIgYSBwYWNrZXQgb2YgdHlwZSBCSU5BUllfRVZFTlQgaXNcbiAqIGRlY29kZWQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldFxuICogQHJldHVybiB7QmluYXJ5UmVjb25zdHJ1Y3Rvcn0gaW5pdGlhbGl6ZWQgcmVjb25zdHJ1Y3RvclxuICovXG5jbGFzcyBCaW5hcnlSZWNvbnN0cnVjdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihwYWNrZXQpIHtcbiAgICAgICAgdGhpcy5wYWNrZXQgPSBwYWNrZXQ7XG4gICAgICAgIHRoaXMuYnVmZmVycyA9IFtdO1xuICAgICAgICB0aGlzLnJlY29uUGFjayA9IHBhY2tldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIGJpbmFyeSBkYXRhIHJlY2VpdmVkIGZyb20gY29ubmVjdGlvblxuICAgICAqIGFmdGVyIGEgQklOQVJZX0VWRU5UIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QnVmZmVyIHwgQXJyYXlCdWZmZXJ9IGJpbkRhdGEgLSB0aGUgcmF3IGJpbmFyeSBkYXRhIHJlY2VpdmVkXG4gICAgICogQHJldHVybiB7bnVsbCB8IE9iamVjdH0gcmV0dXJucyBudWxsIGlmIG1vcmUgYmluYXJ5IGRhdGEgaXMgZXhwZWN0ZWQgb3JcbiAgICAgKiAgIGEgcmVjb25zdHJ1Y3RlZCBwYWNrZXQgb2JqZWN0IGlmIGFsbCBidWZmZXJzIGhhdmUgYmVlbiByZWNlaXZlZC5cbiAgICAgKi9cbiAgICB0YWtlQmluYXJ5RGF0YShiaW5EYXRhKSB7XG4gICAgICAgIHRoaXMuYnVmZmVycy5wdXNoKGJpbkRhdGEpO1xuICAgICAgICBpZiAodGhpcy5idWZmZXJzLmxlbmd0aCA9PT0gdGhpcy5yZWNvblBhY2suYXR0YWNobWVudHMpIHtcbiAgICAgICAgICAgIC8vIGRvbmUgd2l0aCBidWZmZXIgbGlzdFxuICAgICAgICAgICAgY29uc3QgcGFja2V0ID0gcmVjb25zdHJ1Y3RQYWNrZXQodGhpcy5yZWNvblBhY2ssIHRoaXMuYnVmZmVycyk7XG4gICAgICAgICAgICB0aGlzLmZpbmlzaGVkUmVjb25zdHJ1Y3Rpb24oKTtcbiAgICAgICAgICAgIHJldHVybiBwYWNrZXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFucyB1cCBiaW5hcnkgcGFja2V0IHJlY29uc3RydWN0aW9uIHZhcmlhYmxlcy5cbiAgICAgKi9cbiAgICBmaW5pc2hlZFJlY29uc3RydWN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlY29uUGFjayA9IG51bGw7XG4gICAgICAgIHRoaXMuYnVmZmVycyA9IFtdO1xuICAgIH1cbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBvbihvYmosIGV2LCBmbikge1xuICAgIG9iai5vbihldiwgZm4pO1xuICAgIHJldHVybiBmdW5jdGlvbiBzdWJEZXN0cm95KCkge1xuICAgICAgICBvYmoub2ZmKGV2LCBmbik7XG4gICAgfTtcbn1cbiIsImltcG9ydCB7IFBhY2tldFR5cGUgfSBmcm9tIFwic29ja2V0LmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgb24gfSBmcm9tIFwiLi9vbi5qc1wiO1xuaW1wb3J0IHsgRW1pdHRlciwgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuLyoqXG4gKiBJbnRlcm5hbCBldmVudHMuXG4gKiBUaGVzZSBldmVudHMgY2FuJ3QgYmUgZW1pdHRlZCBieSB0aGUgdXNlci5cbiAqL1xuY29uc3QgUkVTRVJWRURfRVZFTlRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgY29ubmVjdDogMSxcbiAgICBjb25uZWN0X2Vycm9yOiAxLFxuICAgIGRpc2Nvbm5lY3Q6IDEsXG4gICAgZGlzY29ubmVjdGluZzogMSxcbiAgICAvLyBFdmVudEVtaXR0ZXIgcmVzZXJ2ZWQgZXZlbnRzOiBodHRwczovL25vZGVqcy5vcmcvYXBpL2V2ZW50cy5odG1sI2V2ZW50c19ldmVudF9uZXdsaXN0ZW5lclxuICAgIG5ld0xpc3RlbmVyOiAxLFxuICAgIHJlbW92ZUxpc3RlbmVyOiAxLFxufSk7XG4vKipcbiAqIEEgU29ja2V0IGlzIHRoZSBmdW5kYW1lbnRhbCBjbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCB0aGUgc2VydmVyLlxuICpcbiAqIEEgU29ja2V0IGJlbG9uZ3MgdG8gYSBjZXJ0YWluIE5hbWVzcGFjZSAoYnkgZGVmYXVsdCAvKSBhbmQgdXNlcyBhbiB1bmRlcmx5aW5nIHtAbGluayBNYW5hZ2VyfSB0byBjb21tdW5pY2F0ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAqXG4gKiBzb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcbiAqICAgY29uc29sZS5sb2coXCJjb25uZWN0ZWRcIik7XG4gKiB9KTtcbiAqXG4gKiAvLyBzZW5kIGFuIGV2ZW50IHRvIHRoZSBzZXJ2ZXJcbiAqIHNvY2tldC5lbWl0KFwiZm9vXCIsIFwiYmFyXCIpO1xuICpcbiAqIHNvY2tldC5vbihcImZvb2JhclwiLCAoKSA9PiB7XG4gKiAgIC8vIGFuIGV2ZW50IHdhcyByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXJcbiAqIH0pO1xuICpcbiAqIC8vIHVwb24gZGlzY29ubmVjdGlvblxuICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAocmVhc29uKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKGBkaXNjb25uZWN0ZWQgZHVlIHRvICR7cmVhc29ufWApO1xuICogfSk7XG4gKi9cbmV4cG9ydCBjbGFzcyBTb2NrZXQgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBgU29ja2V0YCBjb25zdHJ1Y3Rvci5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihpbywgbnNwLCBvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBzb2NrZXQgaXMgY3VycmVudGx5IGNvbm5lY3RlZCB0byB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAgICAgKlxuICAgICAgICAgKiBzb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcbiAgICAgICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuY29ubmVjdGVkKTsgLy8gdHJ1ZVxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmNvbm5lY3RlZCk7IC8vIGZhbHNlXG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIGNvbm5lY3Rpb24gc3RhdGUgd2FzIHJlY292ZXJlZCBhZnRlciBhIHRlbXBvcmFyeSBkaXNjb25uZWN0aW9uLiBJbiB0aGF0IGNhc2UsIGFueSBtaXNzZWQgcGFja2V0cyB3aWxsXG4gICAgICAgICAqIGJlIHRyYW5zbWl0dGVkIGJ5IHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlY292ZXJlZCA9IGZhbHNlO1xuICAgICAgICAvKipcbiAgICAgICAgICogQnVmZmVyIGZvciBwYWNrZXRzIHJlY2VpdmVkIGJlZm9yZSB0aGUgQ09OTkVDVCBwYWNrZXRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlciA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgICogQnVmZmVyIGZvciBwYWNrZXRzIHRoYXQgd2lsbCBiZSBzZW50IG9uY2UgdGhlIHNvY2tldCBpcyBjb25uZWN0ZWRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VuZEJ1ZmZlciA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHF1ZXVlIG9mIHBhY2tldHMgdG8gYmUgc2VudCB3aXRoIHJldHJ5IGluIGNhc2Ugb2YgZmFpbHVyZS5cbiAgICAgICAgICpcbiAgICAgICAgICogUGFja2V0cyBhcmUgc2VudCBvbmUgYnkgb25lLCBlYWNoIHdhaXRpbmcgZm9yIHRoZSBzZXJ2ZXIgYWNrbm93bGVkZ2VtZW50LCBpbiBvcmRlciB0byBndWFyYW50ZWUgdGhlIGRlbGl2ZXJ5IG9yZGVyLlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgc2VxdWVuY2UgdG8gZ2VuZXJhdGUgdGhlIElEIG9mIHRoZSB7QGxpbmsgUXVldWVkUGFja2V0fS5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3F1ZXVlU2VxID0gMDtcbiAgICAgICAgdGhpcy5pZHMgPSAwO1xuICAgICAgICB0aGlzLmFja3MgPSB7fTtcbiAgICAgICAgdGhpcy5mbGFncyA9IHt9O1xuICAgICAgICB0aGlzLmlvID0gaW87XG4gICAgICAgIHRoaXMubnNwID0gbnNwO1xuICAgICAgICBpZiAob3B0cyAmJiBvcHRzLmF1dGgpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0aCA9IG9wdHMuYXV0aDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cyk7XG4gICAgICAgIGlmICh0aGlzLmlvLl9hdXRvQ29ubmVjdClcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBzb2NrZXQgaXMgY3VycmVudGx5IGRpc2Nvbm5lY3RlZFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuZGlzY29ubmVjdGVkKTsgLy8gZmFsc2VcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmRpc2Nvbm5lY3RlZCk7IC8vIHRydWVcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBnZXQgZGlzY29ubmVjdGVkKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuY29ubmVjdGVkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmUgdG8gb3BlbiwgY2xvc2UgYW5kIHBhY2tldCBldmVudHNcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3ViRXZlbnRzKCkge1xuICAgICAgICBpZiAodGhpcy5zdWJzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBpbyA9IHRoaXMuaW87XG4gICAgICAgIHRoaXMuc3VicyA9IFtcbiAgICAgICAgICAgIG9uKGlvLCBcIm9wZW5cIiwgdGhpcy5vbm9wZW4uYmluZCh0aGlzKSksXG4gICAgICAgICAgICBvbihpbywgXCJwYWNrZXRcIiwgdGhpcy5vbnBhY2tldC5iaW5kKHRoaXMpKSxcbiAgICAgICAgICAgIG9uKGlvLCBcImVycm9yXCIsIHRoaXMub25lcnJvci5iaW5kKHRoaXMpKSxcbiAgICAgICAgICAgIG9uKGlvLCBcImNsb3NlXCIsIHRoaXMub25jbG9zZS5iaW5kKHRoaXMpKSxcbiAgICAgICAgXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgU29ja2V0IHdpbGwgdHJ5IHRvIHJlY29ubmVjdCB3aGVuIGl0cyBNYW5hZ2VyIGNvbm5lY3RzIG9yIHJlY29ubmVjdHMuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gICAgICpcbiAgICAgKiBjb25zb2xlLmxvZyhzb2NrZXQuYWN0aXZlKTsgLy8gdHJ1ZVxuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAocmVhc29uKSA9PiB7XG4gICAgICogICBpZiAocmVhc29uID09PSBcImlvIHNlcnZlciBkaXNjb25uZWN0XCIpIHtcbiAgICAgKiAgICAgLy8gdGhlIGRpc2Nvbm5lY3Rpb24gd2FzIGluaXRpYXRlZCBieSB0aGUgc2VydmVyLCB5b3UgbmVlZCB0byBtYW51YWxseSByZWNvbm5lY3RcbiAgICAgKiAgICAgY29uc29sZS5sb2coc29ja2V0LmFjdGl2ZSk7IC8vIGZhbHNlXG4gICAgICogICB9XG4gICAgICogICAvLyBlbHNlIHRoZSBzb2NrZXQgd2lsbCBhdXRvbWF0aWNhbGx5IHRyeSB0byByZWNvbm5lY3RcbiAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5hY3RpdmUpOyAvLyB0cnVlXG4gICAgICogfSk7XG4gICAgICovXG4gICAgZ2V0IGFjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zdWJzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBcIk9wZW5zXCIgdGhlIHNvY2tldC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc29ja2V0ID0gaW8oe1xuICAgICAqICAgYXV0b0Nvbm5lY3Q6IGZhbHNlXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQuY29ubmVjdCgpO1xuICAgICAqL1xuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB0aGlzLnN1YkV2ZW50cygpO1xuICAgICAgICBpZiAoIXRoaXMuaW9bXCJfcmVjb25uZWN0aW5nXCJdKVxuICAgICAgICAgICAgdGhpcy5pby5vcGVuKCk7IC8vIGVuc3VyZSBvcGVuXG4gICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5pby5fcmVhZHlTdGF0ZSlcbiAgICAgICAgICAgIHRoaXMub25vcGVuKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3Ige0BsaW5rIGNvbm5lY3QoKX0uXG4gICAgICovXG4gICAgb3BlbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIGBtZXNzYWdlYCBldmVudC5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIG1pbWljcyB0aGUgV2ViU29ja2V0LnNlbmQoKSBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJTb2NrZXQvc2VuZFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQuc2VuZChcImhlbGxvXCIpO1xuICAgICAqXG4gICAgICogLy8gdGhpcyBpcyBlcXVpdmFsZW50IHRvXG4gICAgICogc29ja2V0LmVtaXQoXCJtZXNzYWdlXCIsIFwiaGVsbG9cIik7XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBzZW5kKC4uLmFyZ3MpIHtcbiAgICAgICAgYXJncy51bnNoaWZ0KFwibWVzc2FnZVwiKTtcbiAgICAgICAgdGhpcy5lbWl0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgYGVtaXRgLlxuICAgICAqIElmIHRoZSBldmVudCBpcyBpbiBgZXZlbnRzYCwgaXQncyBlbWl0dGVkIG5vcm1hbGx5LlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQuZW1pdChcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICpcbiAgICAgKiAvLyBhbGwgc2VyaWFsaXphYmxlIGRhdGFzdHJ1Y3R1cmVzIGFyZSBzdXBwb3J0ZWQgKG5vIG5lZWQgdG8gY2FsbCBKU09OLnN0cmluZ2lmeSlcbiAgICAgKiBzb2NrZXQuZW1pdChcImhlbGxvXCIsIDEsIFwiMlwiLCB7IDM6IFtcIjRcIl0sIDU6IFVpbnQ4QXJyYXkuZnJvbShbNl0pIH0pO1xuICAgICAqXG4gICAgICogLy8gd2l0aCBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbSB0aGUgc2VydmVyXG4gICAgICogc29ja2V0LmVtaXQoXCJoZWxsb1wiLCBcIndvcmxkXCIsICh2YWwpID0+IHtcbiAgICAgKiAgIC8vIC4uLlxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgZW1pdChldiwgLi4uYXJncykge1xuICAgICAgICBpZiAoUkVTRVJWRURfRVZFTlRTLmhhc093blByb3BlcnR5KGV2KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBldi50b1N0cmluZygpICsgJ1wiIGlzIGEgcmVzZXJ2ZWQgZXZlbnQgbmFtZScpO1xuICAgICAgICB9XG4gICAgICAgIGFyZ3MudW5zaGlmdChldik7XG4gICAgICAgIGlmICh0aGlzLl9vcHRzLnJldHJpZXMgJiYgIXRoaXMuZmxhZ3MuZnJvbVF1ZXVlICYmICF0aGlzLmZsYWdzLnZvbGF0aWxlKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRUb1F1ZXVlKGFyZ3MpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgICAgICAgdHlwZTogUGFja2V0VHlwZS5FVkVOVCxcbiAgICAgICAgICAgIGRhdGE6IGFyZ3MsXG4gICAgICAgIH07XG4gICAgICAgIHBhY2tldC5vcHRpb25zID0ge307XG4gICAgICAgIHBhY2tldC5vcHRpb25zLmNvbXByZXNzID0gdGhpcy5mbGFncy5jb21wcmVzcyAhPT0gZmFsc2U7XG4gICAgICAgIC8vIGV2ZW50IGFjayBjYWxsYmFja1xuICAgICAgICBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHRoaXMuaWRzKys7XG4gICAgICAgICAgICBjb25zdCBhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJBY2tDYWxsYmFjayhpZCwgYWNrKTtcbiAgICAgICAgICAgIHBhY2tldC5pZCA9IGlkO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlzVHJhbnNwb3J0V3JpdGFibGUgPSB0aGlzLmlvLmVuZ2luZSAmJlxuICAgICAgICAgICAgdGhpcy5pby5lbmdpbmUudHJhbnNwb3J0ICYmXG4gICAgICAgICAgICB0aGlzLmlvLmVuZ2luZS50cmFuc3BvcnQud3JpdGFibGU7XG4gICAgICAgIGNvbnN0IGRpc2NhcmRQYWNrZXQgPSB0aGlzLmZsYWdzLnZvbGF0aWxlICYmICghaXNUcmFuc3BvcnRXcml0YWJsZSB8fCAhdGhpcy5jb25uZWN0ZWQpO1xuICAgICAgICBpZiAoZGlzY2FyZFBhY2tldCkge1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLm5vdGlmeU91dGdvaW5nTGlzdGVuZXJzKHBhY2tldCk7XG4gICAgICAgICAgICB0aGlzLnBhY2tldChwYWNrZXQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZW5kQnVmZmVyLnB1c2gocGFja2V0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZsYWdzID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZWdpc3RlckFja0NhbGxiYWNrKGlkLCBhY2spIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKF9hID0gdGhpcy5mbGFncy50aW1lb3V0KSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiB0aGlzLl9vcHRzLmFja1RpbWVvdXQ7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWNrc1tpZF0gPSBhY2s7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aW1lciA9IHRoaXMuaW8uc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmFja3NbaWRdO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNlbmRCdWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZW5kQnVmZmVyW2ldLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRCdWZmZXIuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFjay5jYWxsKHRoaXMsIG5ldyBFcnJvcihcIm9wZXJhdGlvbiBoYXMgdGltZWQgb3V0XCIpKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHRoaXMuYWNrc1tpZF0gPSAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGhpcy5pby5jbGVhclRpbWVvdXRGbih0aW1lcik7XG4gICAgICAgICAgICBhY2suYXBwbHkodGhpcywgW251bGwsIC4uLmFyZ3NdKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gZXZlbnQgYW5kIHdhaXRzIGZvciBhbiBhY2tub3dsZWRnZW1lbnRcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gd2l0aG91dCB0aW1lb3V0XG4gICAgICogY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzb2NrZXQuZW1pdFdpdGhBY2soXCJoZWxsb1wiLCBcIndvcmxkXCIpO1xuICAgICAqXG4gICAgICogLy8gd2l0aCBhIHNwZWNpZmljIHRpbWVvdXRcbiAgICAgKiB0cnkge1xuICAgICAqICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzb2NrZXQudGltZW91dCgxMDAwKS5lbWl0V2l0aEFjayhcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICogfSBjYXRjaCAoZXJyKSB7XG4gICAgICogICAvLyB0aGUgc2VydmVyIGRpZCBub3QgYWNrbm93bGVkZ2UgdGhlIGV2ZW50IGluIHRoZSBnaXZlbiBkZWxheVxuICAgICAqIH1cbiAgICAgKlxuICAgICAqIEByZXR1cm4gYSBQcm9taXNlIHRoYXQgd2lsbCBiZSBmdWxmaWxsZWQgd2hlbiB0aGUgc2VydmVyIGFja25vd2xlZGdlcyB0aGUgZXZlbnRcbiAgICAgKi9cbiAgICBlbWl0V2l0aEFjayhldiwgLi4uYXJncykge1xuICAgICAgICAvLyB0aGUgdGltZW91dCBmbGFnIGlzIG9wdGlvbmFsXG4gICAgICAgIGNvbnN0IHdpdGhFcnIgPSB0aGlzLmZsYWdzLnRpbWVvdXQgIT09IHVuZGVmaW5lZCB8fCB0aGlzLl9vcHRzLmFja1RpbWVvdXQgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGFyZ3MucHVzaCgoYXJnMSwgYXJnMikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh3aXRoRXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmcxID8gcmVqZWN0KGFyZzEpIDogcmVzb2x2ZShhcmcyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGFyZzEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5lbWl0KGV2LCAuLi5hcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZCB0aGUgcGFja2V0IHRvIHRoZSBxdWV1ZS5cbiAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZFRvUXVldWUoYXJncykge1xuICAgICAgICBsZXQgYWNrO1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9xdWV1ZVNlcSsrLFxuICAgICAgICAgICAgdHJ5Q291bnQ6IDAsXG4gICAgICAgICAgICBwZW5kaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICBmbGFnczogT2JqZWN0LmFzc2lnbih7IGZyb21RdWV1ZTogdHJ1ZSB9LCB0aGlzLmZsYWdzKSxcbiAgICAgICAgfTtcbiAgICAgICAgYXJncy5wdXNoKChlcnIsIC4uLnJlc3BvbnNlQXJncykgPT4ge1xuICAgICAgICAgICAgaWYgKHBhY2tldCAhPT0gdGhpcy5fcXVldWVbMF0pIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgcGFja2V0IGhhcyBhbHJlYWR5IGJlZW4gYWNrbm93bGVkZ2VkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaGFzRXJyb3IgPSBlcnIgIT09IG51bGw7XG4gICAgICAgICAgICBpZiAoaGFzRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFja2V0LnRyeUNvdW50ID4gdGhpcy5fb3B0cy5yZXRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBpZiAoYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjayhudWxsLCAuLi5yZXNwb25zZUFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhY2tldC5wZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZHJhaW5RdWV1ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChwYWNrZXQpO1xuICAgICAgICB0aGlzLl9kcmFpblF1ZXVlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmQgdGhlIGZpcnN0IHBhY2tldCBvZiB0aGUgcXVldWUsIGFuZCB3YWl0IGZvciBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbSB0aGUgc2VydmVyLlxuICAgICAqIEBwYXJhbSBmb3JjZSAtIHdoZXRoZXIgdG8gcmVzZW5kIGEgcGFja2V0IHRoYXQgaGFzIG5vdCBiZWVuIGFja25vd2xlZGdlZCB5ZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RyYWluUXVldWUoZm9yY2UgPSBmYWxzZSkge1xuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdGVkIHx8IHRoaXMuX3F1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHRoaXMuX3F1ZXVlWzBdO1xuICAgICAgICBpZiAocGFja2V0LnBlbmRpbmcgJiYgIWZvcmNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFja2V0LnBlbmRpbmcgPSB0cnVlO1xuICAgICAgICBwYWNrZXQudHJ5Q291bnQrKztcbiAgICAgICAgdGhpcy5mbGFncyA9IHBhY2tldC5mbGFncztcbiAgICAgICAgdGhpcy5lbWl0LmFwcGx5KHRoaXMsIHBhY2tldC5hcmdzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwYWNrZXQocGFja2V0KSB7XG4gICAgICAgIHBhY2tldC5uc3AgPSB0aGlzLm5zcDtcbiAgICAgICAgdGhpcy5pby5fcGFja2V0KHBhY2tldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBgb3BlbmAuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ub3BlbigpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmF1dGggPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLmF1dGgoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZW5kQ29ubmVjdFBhY2tldChkYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2VuZENvbm5lY3RQYWNrZXQodGhpcy5hdXRoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIENPTk5FQ1QgcGFja2V0IHRvIGluaXRpYXRlIHRoZSBTb2NrZXQuSU8gc2Vzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2VuZENvbm5lY3RQYWNrZXQoZGF0YSkge1xuICAgICAgICB0aGlzLnBhY2tldCh7XG4gICAgICAgICAgICB0eXBlOiBQYWNrZXRUeXBlLkNPTk5FQ1QsXG4gICAgICAgICAgICBkYXRhOiB0aGlzLl9waWRcbiAgICAgICAgICAgICAgICA/IE9iamVjdC5hc3NpZ24oeyBwaWQ6IHRoaXMuX3BpZCwgb2Zmc2V0OiB0aGlzLl9sYXN0T2Zmc2V0IH0sIGRhdGEpXG4gICAgICAgICAgICAgICAgOiBkYXRhLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZW5naW5lIG9yIG1hbmFnZXIgYGVycm9yYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZXJyb3IoZXJyKSB7XG4gICAgICAgIGlmICghdGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY29ubmVjdF9lcnJvclwiLCBlcnIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBgY2xvc2VgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlYXNvblxuICAgICAqIEBwYXJhbSBkZXNjcmlwdGlvblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25jbG9zZShyZWFzb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmlkO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRpc2Nvbm5lY3RcIiwgcmVhc29uLCBkZXNjcmlwdGlvbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aXRoIHNvY2tldCBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnBhY2tldChwYWNrZXQpIHtcbiAgICAgICAgY29uc3Qgc2FtZU5hbWVzcGFjZSA9IHBhY2tldC5uc3AgPT09IHRoaXMubnNwO1xuICAgICAgICBpZiAoIXNhbWVOYW1lc3BhY2UpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHN3aXRjaCAocGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUOlxuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQuZGF0YSAmJiBwYWNrZXQuZGF0YS5zaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmNvbm5lY3QocGFja2V0LmRhdGEuc2lkLCBwYWNrZXQuZGF0YS5waWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0X2Vycm9yXCIsIG5ldyBFcnJvcihcIkl0IHNlZW1zIHlvdSBhcmUgdHJ5aW5nIHRvIHJlYWNoIGEgU29ja2V0LklPIHNlcnZlciBpbiB2Mi54IHdpdGggYSB2My54IGNsaWVudCwgYnV0IHRoZXkgYXJlIG5vdCBjb21wYXRpYmxlIChtb3JlIGluZm9ybWF0aW9uIGhlcmU6IGh0dHBzOi8vc29ja2V0LmlvL2RvY3MvdjMvbWlncmF0aW5nLWZyb20tMi14LXRvLTMtMC8pXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRVZFTlQ6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0VWRU5UOlxuICAgICAgICAgICAgICAgIHRoaXMub25ldmVudChwYWNrZXQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkFDSzpcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5CSU5BUllfQUNLOlxuICAgICAgICAgICAgICAgIHRoaXMub25hY2socGFja2V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5ESVNDT05ORUNUOlxuICAgICAgICAgICAgICAgIHRoaXMub25kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVF9FUlJPUjpcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IocGFja2V0LmRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGVyci5kYXRhID0gcGFja2V0LmRhdGEuZGF0YTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNvbm5lY3RfZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNlcnZlciBldmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZXZlbnQocGFja2V0KSB7XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBwYWNrZXQuZGF0YSB8fCBbXTtcbiAgICAgICAgaWYgKG51bGwgIT0gcGFja2V0LmlkKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2godGhpcy5hY2socGFja2V0LmlkKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRFdmVudChhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlci5wdXNoKE9iamVjdC5mcmVlemUoYXJncykpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVtaXRFdmVudChhcmdzKSB7XG4gICAgICAgIGlmICh0aGlzLl9hbnlMaXN0ZW5lcnMgJiYgdGhpcy5fYW55TGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55TGlzdGVuZXJzLnNsaWNlKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN1cGVyLmVtaXQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIGlmICh0aGlzLl9waWQgJiYgYXJncy5sZW5ndGggJiYgdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5fbGFzdE9mZnNldCA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm9kdWNlcyBhbiBhY2sgY2FsbGJhY2sgdG8gZW1pdCB3aXRoIGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBhY2soaWQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGxldCBzZW50ID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgICAgLy8gcHJldmVudCBkb3VibGUgY2FsbGJhY2tzXG4gICAgICAgICAgICBpZiAoc2VudClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBzZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIHNlbGYucGFja2V0KHtcbiAgICAgICAgICAgICAgICB0eXBlOiBQYWNrZXRUeXBlLkFDSyxcbiAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgZGF0YTogYXJncyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNlcnZlciBhY2tub3dsZWdlbWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uYWNrKHBhY2tldCkge1xuICAgICAgICBjb25zdCBhY2sgPSB0aGlzLmFja3NbcGFja2V0LmlkXTtcbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGFjaykge1xuICAgICAgICAgICAgYWNrLmFwcGx5KHRoaXMsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmFja3NbcGFja2V0LmlkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzZXJ2ZXIgY29ubmVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25jb25uZWN0KGlkLCBwaWQpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnJlY292ZXJlZCA9IHBpZCAmJiB0aGlzLl9waWQgPT09IHBpZDtcbiAgICAgICAgdGhpcy5fcGlkID0gcGlkOyAvLyBkZWZpbmVkIG9ubHkgaWYgY29ubmVjdGlvbiBzdGF0ZSByZWNvdmVyeSBpcyBlbmFibGVkXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0QnVmZmVyZWQoKTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0XCIpO1xuICAgICAgICB0aGlzLl9kcmFpblF1ZXVlKHRydWUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbWl0IGJ1ZmZlcmVkIGV2ZW50cyAocmVjZWl2ZWQgYW5kIGVtaXR0ZWQpLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBlbWl0QnVmZmVyZWQoKSB7XG4gICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlci5mb3JFYWNoKChhcmdzKSA9PiB0aGlzLmVtaXRFdmVudChhcmdzKSk7XG4gICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLnNlbmRCdWZmZXIuZm9yRWFjaCgocGFja2V0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm5vdGlmeU91dGdvaW5nTGlzdGVuZXJzKHBhY2tldCk7XG4gICAgICAgICAgICB0aGlzLnBhY2tldChwYWNrZXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZW5kQnVmZmVyID0gW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHNlcnZlciBkaXNjb25uZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLm9uY2xvc2UoXCJpbyBzZXJ2ZXIgZGlzY29ubmVjdFwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZm9yY2VkIGNsaWVudC9zZXJ2ZXIgc2lkZSBkaXNjb25uZWN0aW9ucyxcbiAgICAgKiB0aGlzIG1ldGhvZCBlbnN1cmVzIHRoZSBtYW5hZ2VyIHN0b3BzIHRyYWNraW5nIHVzIGFuZFxuICAgICAqIHRoYXQgcmVjb25uZWN0aW9ucyBkb24ndCBnZXQgdHJpZ2dlcmVkIGZvciB0aGlzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5zdWJzKSB7XG4gICAgICAgICAgICAvLyBjbGVhbiBzdWJzY3JpcHRpb25zIHRvIGF2b2lkIHJlY29ubmVjdGlvbnNcbiAgICAgICAgICAgIHRoaXMuc3Vicy5mb3JFYWNoKChzdWJEZXN0cm95KSA9PiBzdWJEZXN0cm95KCkpO1xuICAgICAgICAgICAgdGhpcy5zdWJzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW9bXCJfZGVzdHJveVwiXSh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGlzY29ubmVjdHMgdGhlIHNvY2tldCBtYW51YWxseS4gSW4gdGhhdCBjYXNlLCB0aGUgc29ja2V0IHdpbGwgbm90IHRyeSB0byByZWNvbm5lY3QuXG4gICAgICpcbiAgICAgKiBJZiB0aGlzIGlzIHRoZSBsYXN0IGFjdGl2ZSBTb2NrZXQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBNYW5hZ2VyfSwgdGhlIGxvdy1sZXZlbCBjb25uZWN0aW9uIHdpbGwgYmUgY2xvc2VkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAocmVhc29uKSA9PiB7XG4gICAgICogICAvLyBjb25zb2xlLmxvZyhyZWFzb24pOyBwcmludHMgXCJpbyBjbGllbnQgZGlzY29ubmVjdFwiXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQuZGlzY29ubmVjdCgpO1xuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhY2tldCh7IHR5cGU6IFBhY2tldFR5cGUuRElTQ09OTkVDVCB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgc29ja2V0IGZyb20gcG9vbFxuICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAvLyBmaXJlIGV2ZW50c1xuICAgICAgICAgICAgdGhpcy5vbmNsb3NlKFwiaW8gY2xpZW50IGRpc2Nvbm5lY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFsaWFzIGZvciB7QGxpbmsgZGlzY29ubmVjdCgpfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIGNsb3NlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGNvbXByZXNzIGZsYWcuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5jb21wcmVzcyhmYWxzZSkuZW1pdChcImhlbGxvXCIpO1xuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXByZXNzIC0gaWYgYHRydWVgLCBjb21wcmVzc2VzIHRoZSBzZW5kaW5nIGRhdGFcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBjb21wcmVzcyhjb21wcmVzcykge1xuICAgICAgICB0aGlzLmZsYWdzLmNvbXByZXNzID0gY29tcHJlc3M7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgbW9kaWZpZXIgZm9yIGEgc3Vic2VxdWVudCBldmVudCBlbWlzc2lvbiB0aGF0IHRoZSBldmVudCBtZXNzYWdlIHdpbGwgYmUgZHJvcHBlZCB3aGVuIHRoaXMgc29ja2V0IGlzIG5vdFxuICAgICAqIHJlYWR5IHRvIHNlbmQgbWVzc2FnZXMuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC52b2xhdGlsZS5lbWl0KFwiaGVsbG9cIik7IC8vIHRoZSBzZXJ2ZXIgbWF5IG9yIG1heSBub3QgcmVjZWl2ZSBpdFxuICAgICAqXG4gICAgICogQHJldHVybnMgc2VsZlxuICAgICAqL1xuICAgIGdldCB2b2xhdGlsZSgpIHtcbiAgICAgICAgdGhpcy5mbGFncy52b2xhdGlsZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgbW9kaWZpZXIgZm9yIGEgc3Vic2VxdWVudCBldmVudCBlbWlzc2lvbiB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCB3aXRoIGFuIGVycm9yIHdoZW4gdGhlXG4gICAgICogZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQgd2l0aG91dCBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbSB0aGUgc2VydmVyOlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQudGltZW91dCg1MDAwKS5lbWl0KFwibXktZXZlbnRcIiwgKGVycikgPT4ge1xuICAgICAqICAgaWYgKGVycikge1xuICAgICAqICAgICAvLyB0aGUgc2VydmVyIGRpZCBub3QgYWNrbm93bGVkZ2UgdGhlIGV2ZW50IGluIHRoZSBnaXZlbiBkZWxheVxuICAgICAqICAgfVxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHJldHVybnMgc2VsZlxuICAgICAqL1xuICAgIHRpbWVvdXQodGltZW91dCkge1xuICAgICAgICB0aGlzLmZsYWdzLnRpbWVvdXQgPSB0aW1lb3V0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLiBUaGUgZXZlbnQgbmFtZSBpcyBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZVxuICAgICAqIGNhbGxiYWNrLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQub25BbnkoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgZ290ICR7ZXZlbnR9YCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBvbkFueShsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay4gVGhlIGxpc3RlbmVyIGlzIGFkZGVkIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnByZXBlbmRBbnkoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgZ290IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcmVwZW5kQW55KGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycyA9IHRoaXMuX2FueUxpc3RlbmVycyB8fCBbXTtcbiAgICAgICAgdGhpcy5fYW55TGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IGNhdGNoQWxsTGlzdGVuZXIgPSAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBnb3QgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBzb2NrZXQub25BbnkoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyByZW1vdmUgYSBzcGVjaWZpYyBsaXN0ZW5lclxuICAgICAqIHNvY2tldC5vZmZBbnkoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyBvciByZW1vdmUgYWxsIGxpc3RlbmVyc1xuICAgICAqIHNvY2tldC5vZmZBbnkoKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIG9mZkFueShsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMuX2FueUxpc3RlbmVycykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciA9PT0gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FueUxpc3RlbmVycyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0aGF0IGFyZSBsaXN0ZW5pbmcgZm9yIGFueSBldmVudCB0aGF0IGlzIHNwZWNpZmllZC4gVGhpcyBhcnJheSBjYW4gYmUgbWFuaXB1bGF0ZWQsXG4gICAgICogZS5nLiB0byByZW1vdmUgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIGxpc3RlbmVyc0FueSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FueUxpc3RlbmVycyB8fCBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLiBUaGUgZXZlbnQgbmFtZSBpcyBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZVxuICAgICAqIGNhbGxiYWNrLlxuICAgICAqXG4gICAgICogTm90ZTogYWNrbm93bGVkZ2VtZW50cyBzZW50IHRvIHRoZSBzZXJ2ZXIgYXJlIG5vdCBpbmNsdWRlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0Lm9uQW55T3V0Z29pbmcoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgc2VudCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgb25BbnlPdXRnb2luZyhsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay4gVGhlIGxpc3RlbmVyIGlzIGFkZGVkIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheS5cbiAgICAgKlxuICAgICAqIE5vdGU6IGFja25vd2xlZGdlbWVudHMgc2VudCB0byB0aGUgc2VydmVyIGFyZSBub3QgaW5jbHVkZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5wcmVwZW5kQW55T3V0Z29pbmcoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgc2VudCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgcHJlcGVuZEFueU91dGdvaW5nKGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzID0gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IGNhdGNoQWxsTGlzdGVuZXIgPSAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBzZW50IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfVxuICAgICAqXG4gICAgICogc29ja2V0Lm9uQW55T3V0Z29pbmcoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyByZW1vdmUgYSBzcGVjaWZpYyBsaXN0ZW5lclxuICAgICAqIHNvY2tldC5vZmZBbnlPdXRnb2luZyhjYXRjaEFsbExpc3RlbmVyKTtcbiAgICAgKlxuICAgICAqIC8vIG9yIHJlbW92ZSBhbGwgbGlzdGVuZXJzXG4gICAgICogc29ja2V0Lm9mZkFueU91dGdvaW5nKCk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gW2xpc3RlbmVyXSAtIHRoZSBjYXRjaC1hbGwgbGlzdGVuZXIgKG9wdGlvbmFsKVxuICAgICAqL1xuICAgIG9mZkFueU91dGdvaW5nKGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaXN0ZW5lcikge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciA9PT0gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRoYXQgYXJlIGxpc3RlbmluZyBmb3IgYW55IGV2ZW50IHRoYXQgaXMgc3BlY2lmaWVkLiBUaGlzIGFycmF5IGNhbiBiZSBtYW5pcHVsYXRlZCxcbiAgICAgKiBlLmcuIHRvIHJlbW92ZSBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgbGlzdGVuZXJzQW55T3V0Z29pbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyB8fCBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTm90aWZ5IHRoZSBsaXN0ZW5lcnMgZm9yIGVhY2ggcGFja2V0IHNlbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgbm90aWZ5T3V0Z29pbmdMaXN0ZW5lcnMocGFja2V0KSB7XG4gICAgICAgIGlmICh0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyAmJiB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzLnNsaWNlKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8qKlxuICogSW5pdGlhbGl6ZSBiYWNrb2ZmIHRpbWVyIHdpdGggYG9wdHNgLlxuICpcbiAqIC0gYG1pbmAgaW5pdGlhbCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcyBbMTAwXVxuICogLSBgbWF4YCBtYXggdGltZW91dCBbMTAwMDBdXG4gKiAtIGBqaXR0ZXJgIFswXVxuICogLSBgZmFjdG9yYCBbMl1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEJhY2tvZmYob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgIHRoaXMubXMgPSBvcHRzLm1pbiB8fCAxMDA7XG4gICAgdGhpcy5tYXggPSBvcHRzLm1heCB8fCAxMDAwMDtcbiAgICB0aGlzLmZhY3RvciA9IG9wdHMuZmFjdG9yIHx8IDI7XG4gICAgdGhpcy5qaXR0ZXIgPSBvcHRzLmppdHRlciA+IDAgJiYgb3B0cy5qaXR0ZXIgPD0gMSA/IG9wdHMuaml0dGVyIDogMDtcbiAgICB0aGlzLmF0dGVtcHRzID0gMDtcbn1cbi8qKlxuICogUmV0dXJuIHRoZSBiYWNrb2ZmIGR1cmF0aW9uLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLmR1cmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtcyA9IHRoaXMubXMgKiBNYXRoLnBvdyh0aGlzLmZhY3RvciwgdGhpcy5hdHRlbXB0cysrKTtcbiAgICBpZiAodGhpcy5qaXR0ZXIpIHtcbiAgICAgICAgdmFyIHJhbmQgPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB2YXIgZGV2aWF0aW9uID0gTWF0aC5mbG9vcihyYW5kICogdGhpcy5qaXR0ZXIgKiBtcyk7XG4gICAgICAgIG1zID0gKE1hdGguZmxvb3IocmFuZCAqIDEwKSAmIDEpID09IDAgPyBtcyAtIGRldmlhdGlvbiA6IG1zICsgZGV2aWF0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5taW4obXMsIHRoaXMubWF4KSB8IDA7XG59O1xuLyoqXG4gKiBSZXNldCB0aGUgbnVtYmVyIG9mIGF0dGVtcHRzLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYXR0ZW1wdHMgPSAwO1xufTtcbi8qKlxuICogU2V0IHRoZSBtaW5pbXVtIGR1cmF0aW9uXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuQmFja29mZi5wcm90b3R5cGUuc2V0TWluID0gZnVuY3Rpb24gKG1pbikge1xuICAgIHRoaXMubXMgPSBtaW47XG59O1xuLyoqXG4gKiBTZXQgdGhlIG1heGltdW0gZHVyYXRpb25cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRNYXggPSBmdW5jdGlvbiAobWF4KSB7XG4gICAgdGhpcy5tYXggPSBtYXg7XG59O1xuLyoqXG4gKiBTZXQgdGhlIGppdHRlclxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnNldEppdHRlciA9IGZ1bmN0aW9uIChqaXR0ZXIpIHtcbiAgICB0aGlzLmppdHRlciA9IGppdHRlcjtcbn07XG4iLCJpbXBvcnQgeyBTb2NrZXQgYXMgRW5naW5lLCBpbnN0YWxsVGltZXJGdW5jdGlvbnMsIG5leHRUaWNrLCB9IGZyb20gXCJlbmdpbmUuaW8tY2xpZW50XCI7XG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tIFwiLi9zb2NrZXQuanNcIjtcbmltcG9ydCAqIGFzIHBhcnNlciBmcm9tIFwic29ja2V0LmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgb24gfSBmcm9tIFwiLi9vbi5qc1wiO1xuaW1wb3J0IHsgQmFja29mZiB9IGZyb20gXCIuL2NvbnRyaWIvYmFja28yLmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyLCB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG5leHBvcnQgY2xhc3MgTWFuYWdlciBleHRlbmRzIEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKHVyaSwgb3B0cykge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubnNwcyA9IHt9O1xuICAgICAgICB0aGlzLnN1YnMgPSBbXTtcbiAgICAgICAgaWYgKHVyaSAmJiBcIm9iamVjdFwiID09PSB0eXBlb2YgdXJpKSB7XG4gICAgICAgICAgICBvcHRzID0gdXJpO1xuICAgICAgICAgICAgdXJpID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgICAgICBvcHRzLnBhdGggPSBvcHRzLnBhdGggfHwgXCIvc29ja2V0LmlvXCI7XG4gICAgICAgIHRoaXMub3B0cyA9IG9wdHM7XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb24ob3B0cy5yZWNvbm5lY3Rpb24gIT09IGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cyhvcHRzLnJlY29ubmVjdGlvbkF0dGVtcHRzIHx8IEluZmluaXR5KTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25EZWxheShvcHRzLnJlY29ubmVjdGlvbkRlbGF5IHx8IDEwMDApO1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkRlbGF5TWF4KG9wdHMucmVjb25uZWN0aW9uRGVsYXlNYXggfHwgNTAwMCk7XG4gICAgICAgIHRoaXMucmFuZG9taXphdGlvbkZhY3RvcigoX2EgPSBvcHRzLnJhbmRvbWl6YXRpb25GYWN0b3IpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IDAuNSk7XG4gICAgICAgIHRoaXMuYmFja29mZiA9IG5ldyBCYWNrb2ZmKHtcbiAgICAgICAgICAgIG1pbjogdGhpcy5yZWNvbm5lY3Rpb25EZWxheSgpLFxuICAgICAgICAgICAgbWF4OiB0aGlzLnJlY29ubmVjdGlvbkRlbGF5TWF4KCksXG4gICAgICAgICAgICBqaXR0ZXI6IHRoaXMucmFuZG9taXphdGlvbkZhY3RvcigpLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy50aW1lb3V0KG51bGwgPT0gb3B0cy50aW1lb3V0ID8gMjAwMDAgOiBvcHRzLnRpbWVvdXQpO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgdGhpcy51cmkgPSB1cmk7XG4gICAgICAgIGNvbnN0IF9wYXJzZXIgPSBvcHRzLnBhcnNlciB8fCBwYXJzZXI7XG4gICAgICAgIHRoaXMuZW5jb2RlciA9IG5ldyBfcGFyc2VyLkVuY29kZXIoKTtcbiAgICAgICAgdGhpcy5kZWNvZGVyID0gbmV3IF9wYXJzZXIuRGVjb2RlcigpO1xuICAgICAgICB0aGlzLl9hdXRvQ29ubmVjdCA9IG9wdHMuYXV0b0Nvbm5lY3QgIT09IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5fYXV0b0Nvbm5lY3QpXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uKHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29ubmVjdGlvbjtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0gISF2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uQXR0ZW1wdHModikge1xuICAgICAgICBpZiAodiA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29ubmVjdGlvbkF0dGVtcHRzO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb25BdHRlbXB0cyA9IHY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZWNvbm5lY3Rpb25EZWxheSh2KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb25EZWxheTtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uRGVsYXkgPSB2O1xuICAgICAgICAoX2EgPSB0aGlzLmJhY2tvZmYpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5zZXRNaW4odik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByYW5kb21pemF0aW9uRmFjdG9yKHYpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBpZiAodiA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JhbmRvbWl6YXRpb25GYWN0b3I7XG4gICAgICAgIHRoaXMuX3JhbmRvbWl6YXRpb25GYWN0b3IgPSB2O1xuICAgICAgICAoX2EgPSB0aGlzLmJhY2tvZmYpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5zZXRKaXR0ZXIodik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZWNvbm5lY3Rpb25EZWxheU1heCh2KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb25EZWxheU1heDtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uRGVsYXlNYXggPSB2O1xuICAgICAgICAoX2EgPSB0aGlzLmJhY2tvZmYpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5zZXRNYXgodik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB0aW1lb3V0KHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RpbWVvdXQ7XG4gICAgICAgIHRoaXMuX3RpbWVvdXQgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RhcnRzIHRyeWluZyB0byByZWNvbm5lY3QgaWYgcmVjb25uZWN0aW9uIGlzIGVuYWJsZWQgYW5kIHdlIGhhdmUgbm90XG4gICAgICogc3RhcnRlZCByZWNvbm5lY3RpbmcgeWV0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG1heWJlUmVjb25uZWN0T25PcGVuKCkge1xuICAgICAgICAvLyBPbmx5IHRyeSB0byByZWNvbm5lY3QgaWYgaXQncyB0aGUgZmlyc3QgdGltZSB3ZSdyZSBjb25uZWN0aW5nXG4gICAgICAgIGlmICghdGhpcy5fcmVjb25uZWN0aW5nICYmXG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gJiZcbiAgICAgICAgICAgIHRoaXMuYmFja29mZi5hdHRlbXB0cyA9PT0gMCkge1xuICAgICAgICAgICAgLy8ga2VlcHMgcmVjb25uZWN0aW9uIGZyb20gZmlyaW5nIHR3aWNlIGZvciB0aGUgc2FtZSByZWNvbm5lY3Rpb24gbG9vcFxuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBjdXJyZW50IHRyYW5zcG9ydCBgc29ja2V0YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIC0gb3B0aW9uYWwsIGNhbGxiYWNrXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIG9wZW4oZm4pIHtcbiAgICAgICAgaWYgKH50aGlzLl9yZWFkeVN0YXRlLmluZGV4T2YoXCJvcGVuXCIpKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIHRoaXMuZW5naW5lID0gbmV3IEVuZ2luZSh0aGlzLnVyaSwgdGhpcy5vcHRzKTtcbiAgICAgICAgY29uc3Qgc29ja2V0ID0gdGhpcy5lbmdpbmU7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJvcGVuaW5nXCI7XG4gICAgICAgIHRoaXMuc2tpcFJlY29ubmVjdCA9IGZhbHNlO1xuICAgICAgICAvLyBlbWl0IGBvcGVuYFxuICAgICAgICBjb25zdCBvcGVuU3ViRGVzdHJveSA9IG9uKHNvY2tldCwgXCJvcGVuXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYub25vcGVuKCk7XG4gICAgICAgICAgICBmbiAmJiBmbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgb25FcnJvciA9IChlcnIpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbihlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gT25seSBkbyB0aGlzIGlmIHRoZXJlIGlzIG5vIGZuIHRvIGhhbmRsZSB0aGUgZXJyb3JcbiAgICAgICAgICAgICAgICB0aGlzLm1heWJlUmVjb25uZWN0T25PcGVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIGVtaXQgYGVycm9yYFxuICAgICAgICBjb25zdCBlcnJvclN1YiA9IG9uKHNvY2tldCwgXCJlcnJvclwiLCBvbkVycm9yKTtcbiAgICAgICAgaWYgKGZhbHNlICE9PSB0aGlzLl90aW1lb3V0KSB7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gdGhpcy5fdGltZW91dDtcbiAgICAgICAgICAgIC8vIHNldCB0aW1lclxuICAgICAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgb3BlblN1YkRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBvbkVycm9yKG5ldyBFcnJvcihcInRpbWVvdXRcIikpO1xuICAgICAgICAgICAgICAgIHNvY2tldC5jbG9zZSgpO1xuICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLmF1dG9VbnJlZikge1xuICAgICAgICAgICAgICAgIHRpbWVyLnVucmVmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN1YnMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRGbih0aW1lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN1YnMucHVzaChvcGVuU3ViRGVzdHJveSk7XG4gICAgICAgIHRoaXMuc3Vicy5wdXNoKGVycm9yU3ViKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFsaWFzIGZvciBvcGVuKClcbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBjb25uZWN0KGZuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wZW4oZm4pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiB0cmFuc3BvcnQgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25vcGVuKCkge1xuICAgICAgICAvLyBjbGVhciBvbGQgc3Vic1xuICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgLy8gbWFyayBhcyBvcGVuXG4gICAgICAgIHRoaXMuX3JlYWR5U3RhdGUgPSBcIm9wZW5cIjtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJvcGVuXCIpO1xuICAgICAgICAvLyBhZGQgbmV3IHN1YnNcbiAgICAgICAgY29uc3Qgc29ja2V0ID0gdGhpcy5lbmdpbmU7XG4gICAgICAgIHRoaXMuc3Vicy5wdXNoKG9uKHNvY2tldCwgXCJwaW5nXCIsIHRoaXMub25waW5nLmJpbmQodGhpcykpLCBvbihzb2NrZXQsIFwiZGF0YVwiLCB0aGlzLm9uZGF0YS5iaW5kKHRoaXMpKSwgb24oc29ja2V0LCBcImVycm9yXCIsIHRoaXMub25lcnJvci5iaW5kKHRoaXMpKSwgb24oc29ja2V0LCBcImNsb3NlXCIsIHRoaXMub25jbG9zZS5iaW5kKHRoaXMpKSwgb24odGhpcy5kZWNvZGVyLCBcImRlY29kZWRcIiwgdGhpcy5vbmRlY29kZWQuYmluZCh0aGlzKSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHBpbmcuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ucGluZygpIHtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwaW5nXCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2l0aCBkYXRhLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmRhdGEoZGF0YSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5kZWNvZGVyLmFkZChkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5vbmNsb3NlKFwicGFyc2UgZXJyb3JcIiwgZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gcGFyc2VyIGZ1bGx5IGRlY29kZXMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZGVjb2RlZChwYWNrZXQpIHtcbiAgICAgICAgLy8gdGhlIG5leHRUaWNrIGNhbGwgcHJldmVudHMgYW4gZXhjZXB0aW9uIGluIGEgdXNlci1wcm92aWRlZCBldmVudCBsaXN0ZW5lciBmcm9tIHRyaWdnZXJpbmcgYSBkaXNjb25uZWN0aW9uIGR1ZSB0byBhIFwicGFyc2UgZXJyb3JcIlxuICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBhY2tldFwiLCBwYWNrZXQpO1xuICAgICAgICB9LCB0aGlzLnNldFRpbWVvdXRGbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHNvY2tldCBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25lcnJvcihlcnIpIHtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IHNvY2tldCBmb3IgdGhlIGdpdmVuIGBuc3BgLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U29ja2V0fVxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBzb2NrZXQobnNwLCBvcHRzKSB7XG4gICAgICAgIGxldCBzb2NrZXQgPSB0aGlzLm5zcHNbbnNwXTtcbiAgICAgICAgaWYgKCFzb2NrZXQpIHtcbiAgICAgICAgICAgIHNvY2tldCA9IG5ldyBTb2NrZXQodGhpcywgbnNwLCBvcHRzKTtcbiAgICAgICAgICAgIHRoaXMubnNwc1tuc3BdID0gc29ja2V0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX2F1dG9Db25uZWN0ICYmICFzb2NrZXQuYWN0aXZlKSB7XG4gICAgICAgICAgICBzb2NrZXQuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzb2NrZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGEgc29ja2V0IGNsb3NlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNvY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Rlc3Ryb3koc29ja2V0KSB7XG4gICAgICAgIGNvbnN0IG5zcHMgPSBPYmplY3Qua2V5cyh0aGlzLm5zcHMpO1xuICAgICAgICBmb3IgKGNvbnN0IG5zcCBvZiBuc3BzKSB7XG4gICAgICAgICAgICBjb25zdCBzb2NrZXQgPSB0aGlzLm5zcHNbbnNwXTtcbiAgICAgICAgICAgIGlmIChzb2NrZXQuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Nsb3NlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyaXRlcyBhIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wYWNrZXQocGFja2V0KSB7XG4gICAgICAgIGNvbnN0IGVuY29kZWRQYWNrZXRzID0gdGhpcy5lbmNvZGVyLmVuY29kZShwYWNrZXQpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY29kZWRQYWNrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmVuZ2luZS53cml0ZShlbmNvZGVkUGFja2V0c1tpXSwgcGFja2V0Lm9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFuIHVwIHRyYW5zcG9ydCBzdWJzY3JpcHRpb25zIGFuZCBwYWNrZXQgYnVmZmVyLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjbGVhbnVwKCkge1xuICAgICAgICB0aGlzLnN1YnMuZm9yRWFjaCgoc3ViRGVzdHJveSkgPT4gc3ViRGVzdHJveSgpKTtcbiAgICAgICAgdGhpcy5zdWJzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZGVjb2Rlci5kZXN0cm95KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlIHRoZSBjdXJyZW50IHNvY2tldC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nsb3NlKCkge1xuICAgICAgICB0aGlzLnNraXBSZWNvbm5lY3QgPSB0cnVlO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbmNsb3NlKFwiZm9yY2VkIGNsb3NlXCIpO1xuICAgICAgICBpZiAodGhpcy5lbmdpbmUpXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS5jbG9zZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3IgY2xvc2UoKVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2xvc2UoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZW5naW5lIGNsb3NlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmNsb3NlKHJlYXNvbiwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjbG9zZVwiLCByZWFzb24sIGRlc2NyaXB0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbiAmJiAhdGhpcy5za2lwUmVjb25uZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnJlY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEF0dGVtcHQgYSByZWNvbm5lY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHJlY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGluZyB8fCB0aGlzLnNraXBSZWNvbm5lY3QpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLmJhY2tvZmYuYXR0ZW1wdHMgPj0gdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHMpIHtcbiAgICAgICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJyZWNvbm5lY3RfZmFpbGVkXCIpO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZWxheSA9IHRoaXMuYmFja29mZi5kdXJhdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVyID0gdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNraXBSZWNvbm5lY3QpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdF9hdHRlbXB0XCIsIHNlbGYuYmFja29mZi5hdHRlbXB0cyk7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgYWdhaW4gZm9yIHRoZSBjYXNlIHNvY2tldCBjbG9zZWQgaW4gYWJvdmUgZXZlbnRzXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuc2tpcFJlY29ubmVjdClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHNlbGYub3BlbigoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicmVjb25uZWN0X2Vycm9yXCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9ucmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICAgICAgdGltZXIudW5yZWYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3Vicy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dEZuKHRpbWVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHN1Y2Nlc3NmdWwgcmVjb25uZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnJlY29ubmVjdCgpIHtcbiAgICAgICAgY29uc3QgYXR0ZW1wdCA9IHRoaXMuYmFja29mZi5hdHRlbXB0cztcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdFwiLCBhdHRlbXB0KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyB1cmwgfSBmcm9tIFwiLi91cmwuanNcIjtcbmltcG9ydCB7IE1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyLmpzXCI7XG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tIFwiLi9zb2NrZXQuanNcIjtcbi8qKlxuICogTWFuYWdlcnMgY2FjaGUuXG4gKi9cbmNvbnN0IGNhY2hlID0ge307XG5mdW5jdGlvbiBsb29rdXAodXJpLCBvcHRzKSB7XG4gICAgaWYgKHR5cGVvZiB1cmkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgb3B0cyA9IHVyaTtcbiAgICAgICAgdXJpID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICBjb25zdCBwYXJzZWQgPSB1cmwodXJpLCBvcHRzLnBhdGggfHwgXCIvc29ja2V0LmlvXCIpO1xuICAgIGNvbnN0IHNvdXJjZSA9IHBhcnNlZC5zb3VyY2U7XG4gICAgY29uc3QgaWQgPSBwYXJzZWQuaWQ7XG4gICAgY29uc3QgcGF0aCA9IHBhcnNlZC5wYXRoO1xuICAgIGNvbnN0IHNhbWVOYW1lc3BhY2UgPSBjYWNoZVtpZF0gJiYgcGF0aCBpbiBjYWNoZVtpZF1bXCJuc3BzXCJdO1xuICAgIGNvbnN0IG5ld0Nvbm5lY3Rpb24gPSBvcHRzLmZvcmNlTmV3IHx8XG4gICAgICAgIG9wdHNbXCJmb3JjZSBuZXcgY29ubmVjdGlvblwiXSB8fFxuICAgICAgICBmYWxzZSA9PT0gb3B0cy5tdWx0aXBsZXggfHxcbiAgICAgICAgc2FtZU5hbWVzcGFjZTtcbiAgICBsZXQgaW87XG4gICAgaWYgKG5ld0Nvbm5lY3Rpb24pIHtcbiAgICAgICAgaW8gPSBuZXcgTWFuYWdlcihzb3VyY2UsIG9wdHMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKCFjYWNoZVtpZF0pIHtcbiAgICAgICAgICAgIGNhY2hlW2lkXSA9IG5ldyBNYW5hZ2VyKHNvdXJjZSwgb3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgaW8gPSBjYWNoZVtpZF07XG4gICAgfVxuICAgIGlmIChwYXJzZWQucXVlcnkgJiYgIW9wdHMucXVlcnkpIHtcbiAgICAgICAgb3B0cy5xdWVyeSA9IHBhcnNlZC5xdWVyeUtleTtcbiAgICB9XG4gICAgcmV0dXJuIGlvLnNvY2tldChwYXJzZWQucGF0aCwgb3B0cyk7XG59XG4vLyBzbyB0aGF0IFwibG9va3VwXCIgY2FuIGJlIHVzZWQgYm90aCBhcyBhIGZ1bmN0aW9uIChlLmcuIGBpbyguLi4pYCkgYW5kIGFzIGFcbi8vIG5hbWVzcGFjZSAoZS5nLiBgaW8uY29ubmVjdCguLi4pYCksIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5PYmplY3QuYXNzaWduKGxvb2t1cCwge1xuICAgIE1hbmFnZXIsXG4gICAgU29ja2V0LFxuICAgIGlvOiBsb29rdXAsXG4gICAgY29ubmVjdDogbG9va3VwLFxufSk7XG4vKipcbiAqIFByb3RvY29sIHZlcnNpb24uXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgeyBwcm90b2NvbCB9IGZyb20gXCJzb2NrZXQuaW8tcGFyc2VyXCI7XG4vKipcbiAqIEV4cG9zZSBjb25zdHJ1Y3RvcnMgZm9yIHN0YW5kYWxvbmUgYnVpbGQuXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgeyBNYW5hZ2VyLCBTb2NrZXQsIGxvb2t1cCBhcyBpbywgbG9va3VwIGFzIGNvbm5lY3QsIGxvb2t1cCBhcyBkZWZhdWx0LCB9O1xuIiwiaW1wb3J0IHsgaW8gfSBmcm9tIFwic29ja2V0LmlvLWNsaWVudFwiO1xyXG4vL2ltcG9ydCBGaWxlU2F2ZXIgZnJvbSBcImZpbGUtc2F2ZXJcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBVUkkge1xyXG4gIGlkOyAvLyBpZCBpbiBVaW50OEFycmF5ISEhXHJcblxyXG4gIHRvU3RyKCkge1xyXG4gICAgaWYgKHRoaXMuaWQgIT0gdW5kZWZpbmVkKVxyXG4gICAgICByZXR1cm4gXCJbXCIgKyB0aGlzLmlkLnRvU3RyaW5nKCkgKyBcIl1cIjtcclxuICB9XHJcblxyXG4gIGZyb21TdHIoIHN0ciApIHtcclxuICAgIHRoaXMuaWQgPSBuZXcgVWludDhBcnJheShKU09OLnBhcnNlKHN0cikpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGZyb21BcnJheSggaW5BICkge1xyXG4gICAgbGV0IG91dEEgPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5BLmxlbmd0aDsgaSsrKVxyXG4gICAgICBvdXRBW2ldID0gbmV3IFVSSShpbkFbaV0pO1xyXG4gICAgcmV0dXJuIG91dEE7XHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvciggZGF0YSApIHtcclxuICAgIC8vIGNvbnNvbGUubG9nKFwiVVJJIGluOlwiKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgaWYgKHR5cGVvZihkYXRhKSA9PSAnc3RyaW5nJylcclxuICAgICAgdGhpcy5mcm9tU3RyKGRhdGEpO1xyXG4gICAgZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKVxyXG4gICAgICB0aGlzLmlkID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSk7XHJcbiAgICBlbHNlIGlmIChkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSlcclxuICAgICAgdGhpcy5pZCA9IGRhdGE7XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiV1JPTkcgVVJJIFRZUEVMOlwiKTtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29ubmVjdGlvbiB7XHJcbiAgc29ja2V0O1xyXG5cclxuICBnZXROb2RlUmVzO1xyXG4gIGdldEFsbE5vZGVzUmVzO1xyXG4gIGFkZE5vZGVSZXM7XHJcbiAgZGVsTm9kZVJlcztcclxuICBjb25uZWN0Tm9kZXNSZXM7XHJcbiAgZGlzY29ubmVjdE5vZGVzUmVzO1xyXG4gIHNldERlZk5vZGVVUklSZXM7XHJcbiAgZ2V0RGVmTm9kZVVSSVJlcztcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RlZCB3aXRoIHNlcnZlclwiKTtcclxuXHJcbiAgICB0aGlzLnNvY2tldCA9IGlvKCk7XHJcblxyXG4gICAgdGhpcy5zb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcclxuICAgICAgY29uc29sZS5sb2coXCJTT0NLRVQgSUQ6IFwiICsgdGhpcy5zb2NrZXQuaWQpO1xyXG5cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgc2VuZCggcmVxLCAuLi5hcmdzICkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIHRoaXMuc29ja2V0LmVtaXQocmVxLCAuLi5hcmdzLCAocmVzcG9uc2UpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRFU1QgT1VUOlwiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBwaW5nKCB2YWx1ZSApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJwaW5nXCIsIHZhbHVlKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldE5vZGUoIHVyaSApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJnZXROb2RlUmVxXCIsIHVyaS5pZCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBhZGROb2RlKCBkYXRhICkge1xyXG4gICAgcmV0dXJuIG5ldyBVUkkoYXdhaXQgdGhpcy5zZW5kKFwiYWRkTm9kZVJlcVwiLCBkYXRhKSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyB1cGRhdGVOb2RlKCB1cmksIGRhdGEgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwidXBkYXRlTm9kZVJlcVwiLCB1cmkuaWQsIGRhdGEpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0QWxsTm9kZXMoKSB7XHJcbiAgICByZXR1cm4gVVJJLmZyb21BcnJheSggYXdhaXQgdGhpcy5zZW5kKFwiZ2V0QWxsTm9kZXNSZXFcIikpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0QWxsQ29ubmVjdGlvbnMoKSB7XHJcbiAgICBsZXQgY0EgPSBhd2FpdCB0aGlzLnNlbmQoXCJnZXRBbGxDb25uZWN0aW9uc1JlcVwiKTtcclxuXHJcbiAgICBsZXQgb3V0QSA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY0EubGVuZ3RoOyBpKyspXHJcbiAgICAgIG91dEFbaV0gPSBbbmV3IFVSSShjQVtpXS5pZDEpLCBuZXcgVVJJKGNBW2ldLmlkMildO1xyXG4gICAgcmV0dXJuIG91dEE7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRBbGxOb2Rlc0RhdGEoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiZ2V0QWxsTm9kZXNEYXRhUmVxXCIpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZGVsTm9kZSggbm9kZSApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJkZWxOb2RlUmVxXCIsIG5vZGUpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgY29ubmVjdE5vZGVzKCB1cmkxLCB1cmkyICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImNvbm5lY3ROb2Rlc1JlcVwiLCBbdXJpMS5pZCwgdXJpMi5pZF0pO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0Tm9kZUNvbm5lY3Rpb25zKCB1cmkgKSB7XHJcbiAgICBsZXQgY0EgPSBhd2FpdCB0aGlzLnNlbmQoXCJnZXROb2RlQ29ubmVjdGlvbnNSZXFcIiwgdXJpLmlkKTtcclxuXHJcbiAgICBsZXQgb3V0QSA9IFtdO1xyXG4gICAgXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNBLmxlbmd0aDsgaSsrKVxyXG4gICAgICBvdXRBW2ldID0gW25ldyBVUkkoY0FbaV0uaWQxKSwgbmV3IFVSSShjQVtpXS5pZDIpXTtcclxuICAgIHJldHVybiBvdXRBO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0TmVpZ2hib3VycyggdXJpICkge1xyXG4gICAgcmV0dXJuIFVSSS5mcm9tQXJyYXkoYXdhaXQgdGhpcy5zZW5kKFwiZ2V0TmVpZ2hib3Vyc1JlcVwiLCB1cmkuaWQpKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGRpc2Nvbm5lY3ROb2RlcyggdXJpMSwgdXJpMiApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJkaXNjb25uZWN0Tm9kZXNSZXFcIiwgW3VyaTEuaWQsIHVyaTIuaWRdKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHNldERlZk5vZGVVUkkoIHVyaSApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJzZXREZWZOb2RlVVJJUmVxXCIsIHVyaS5pZCk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXREZWZOb2RlVVJJKCkge1xyXG4gICAgcmV0dXJuIG5ldyBVUkkoYXdhaXQgdGhpcy5zZW5kKFwiZ2V0RGVmTm9kZVVSSVJlcVwiKSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBjbGVhckRCKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImNsZWFyREJSZXFcIik7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXREQigpIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJnZXREQlJlcVwiKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHNhdmVEQiggb3V0RmlsZU5hbWUgKSB7XHJcbiAgICBsZXQgZGJUZXh0ID0gSlNPTi5zdHJpbmdpZnkoYXdhaXQgdGhpcy5nZXREQigpKTtcclxuICBcclxuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgdmFyIGZpbGUgPSBuZXcgQmxvYihbZGJUZXh0XSwge3R5cGU6IFwidGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04XCJ9KTtcclxuICAgIGEuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XHJcbiAgICBhLmRvd25sb2FkID0gb3V0RmlsZU5hbWU7XHJcbiAgICBhLmNsaWNrKCk7XHJcbiAgICByZXR1cm4gZGJUZXh0O1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgbG9hZERCKCBkYiApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJsb2FkREJSZXFcIiwgZGIpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgYWRkREIoIGRiICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImFkZERhdGFSZXFcIiwgZGIpO1xyXG4gIH1cclxuICBcclxuICBcclxufSAvKiBDb25uZWN0aW9uICovXHJcbiIsIi8vIHN5c3RlbSBpbXBvcnRzXHJcbmltcG9ydCAqIGFzIHJuZCBmcm9tIFwiLi9zeXN0ZW0vc3lzdGVtLmpzXCI7XHJcbmltcG9ydCAqIGFzIG10aCBmcm9tIFwiLi9zeXN0ZW0vbXRoLmpzXCI7XHJcblxyXG5pbXBvcnQgKiBhcyBjYW1lcmFDb250cm9sbGVyIGZyb20gXCIuL2NhbWVyYV9jb250cm9sbGVyLmpzXCI7XHJcbmltcG9ydCB7QmFubmVyfSBmcm9tIFwiLi9iYW5uZXIuanNcIjtcclxuaW1wb3J0IHtTa3lzcGhlcmV9IGZyb20gXCIuL3NreXNwaGVyZS5qc1wiO1xyXG5cclxuaW1wb3J0IHtDb25uZWN0aW9uLCBVUkl9IGZyb20gXCIuL25vZGVzLmpzXCI7XHJcblxyXG5leHBvcnQge0Nvbm5lY3Rpb24sIFVSSX07XHJcblxyXG5sZXQgc3lzdGVtID0gbmV3IHJuZC5TeXN0ZW0oKTtcclxubGV0IHNlcnZlciA9IG5ldyBDb25uZWN0aW9uKCk7XHJcblxyXG4vLyBhZGQgbmVjZXNzYXJ5XHJcbnN5c3RlbS5hZGRVbml0KGNhbWVyYUNvbnRyb2xsZXIuQXJjYmFsbC5jcmVhdGUpO1xyXG5zeXN0ZW0uYWRkVW5pdChTa3lzcGhlcmUuY3JlYXRlLCBcIi4vYmluL2ltZ3MvbGFraHRhLnBuZ1wiKTtcclxuXHJcblxyXG4vLyBhZGQgYmFzZSBjb25zdHJ1Y3Rpb25cclxubGV0IGZsb29yQmFzZSA9IDAuMDtcclxubGV0IGZsb29ySGVpZ2h0ID0gNC41O1xyXG5sZXQgY3V0dGluZ0hlaWdodDtcclxuXHJcbmxldCBjdXR0aW5nSGVpZ2h0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFzZUNvbnN0cnVjdGlvbkN1dHRpbmdIZWlnaHRcIik7XHJcbmN1dHRpbmdIZWlnaHQgPSBmbG9vckJhc2UgKyBjdXR0aW5nSGVpZ2h0RWxlbWVudC52YWx1ZSAqIGZsb29ySGVpZ2h0O1xyXG5cclxubGV0IGJhc2VDb25zdHJ1Y3Rpb25NYXRlcmlhbCA9IGF3YWl0IHN5c3RlbS5jcmVhdGVNYXRlcmlhbChcIi4vc2hhZGVycy9iYXNlQ29uc3RydWN0aW9uXCIpO1xyXG5jdXR0aW5nSGVpZ2h0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xyXG4gIGN1dHRpbmdIZWlnaHQgPSBmbG9vckJhc2UgKyBjdXR0aW5nSGVpZ2h0RWxlbWVudC52YWx1ZSAqIGZsb29ySGVpZ2h0O1xyXG4gIGJhc2VDb25zdHJ1Y3Rpb25NYXRlcmlhbC51Ym8ud3JpdGVEYXRhKG5ldyBGbG9hdDMyQXJyYXkoW2N1dHRpbmdIZWlnaHRdKSk7XHJcbn0pO1xyXG5cclxuLy8gZGlzcGxheXMgYmFzaWMgY29uc3RydWN0aW9uXHJcbmNvbnN0IGJhc2VDb25zdHJ1Y3Rpb25EaXNwbGF5ZXIgPSBhd2FpdCBzeXN0ZW0uYWRkVW5pdChhc3luYyBmdW5jdGlvbigpIHtcclxuICBsZXQgYnVpbGRpbmdNb2RlbCA9IGF3YWl0IHN5c3RlbS5jcmVhdGVQcmltaXRpdmUoXHJcbiAgICBhd2FpdCBybmQuVG9wb2xvZ3kubW9kZWxfb2JqKFwiLi9iaW4vbW9kZWxzL1BNTDMwX3NpbXBsZS5vYmpcIiksXHJcbiAgICBiYXNlQ29uc3RydWN0aW9uTWF0ZXJpYWxcclxuICApO1xyXG5cclxuICBiYXNlQ29uc3RydWN0aW9uTWF0ZXJpYWwudWJvTmFtZU9uU2hhZGVyID0gXCJtYXRlcmlhbFVCT1wiO1xyXG4gIGJhc2VDb25zdHJ1Y3Rpb25NYXRlcmlhbC51Ym8gPSBzeXN0ZW0uY3JlYXRlVW5pZm9ybUJ1ZmZlcigpO1xyXG5cclxuICAvLyBpbml0aWFsaXphdGlvblxyXG4gIGJhc2VDb25zdHJ1Y3Rpb25NYXRlcmlhbC51Ym8ud3JpdGVEYXRhKG5ldyBGbG9hdDMyQXJyYXkoW2N1dHRpbmdIZWlnaHRdKSk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICB0eXBlOiBcImJhc2VDb25zdHJ1Y3Rpb25cIixcclxuICAgIHJlc3BvbnNlKHN5c3RlbSkge1xyXG4gICAgICBzeXN0ZW0uZHJhd1ByaW1pdGl2ZShidWlsZGluZ01vZGVsKTtcclxuICAgIH0gLyogcmVzcG9uc2UgKi9cclxuICB9O1xyXG59KTsgLyogYmFzZUNvbnN0cnVjdGlvbkRpc3BsYXllciAqL1xyXG5cclxuLy8gbm9kZSBhbmQgY29ubmVjdGlvbiB1bml0cyBjb2xsZWN0aW9uXHJcbmxldCBub2RlcyA9IHt9O1xyXG5sZXQgY29ubmVjdGlvbnMgPSB7fTtcclxuXHJcblxyXG5sZXQgbm9kZVByaW0gPSBhd2FpdCBzeXN0ZW0uY3JlYXRlUHJpbWl0aXZlKHJuZC5Ub3BvbG9neS5zcGhlcmUoMC4yKSwgYXdhaXQgc3lzdGVtLmNyZWF0ZU1hdGVyaWFsKFwiLi9zaGFkZXJzL3BvaW50X3NwaGVyZVwiKSk7IC8vIHByaW1pdGl2ZSBvZiBhbnkgbm9kZSBkaXNwbGF5ZWRcclxuXHJcbi8vIGNyZWF0ZXMgbmV3IG5vZGVcclxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlTm9kZShsb2NhdGlvbiwgb2xkTmFtZSA9IG51bGwsIG9sZFNreXNwaGVyZSA9IG51bGwsIGFkZGVkT25TZXJ2ZXIgPSBmYWxzZSwgb2xkbm9kZVVSSSA9IG51bGwpIHtcclxuICAvLyBjaGVjayBpZiBuZXcgbm9kZSBpcyBwb3NzaWJsZSB0byBiZSBwbGFjZWRcclxuICBpZiAoIWFkZGVkT25TZXJ2ZXIpIHtcclxuICAgIGZvciAobGV0IG9sZE5vZGUgb2YgT2JqZWN0LnZhbHVlcyhub2RlcykpIHtcclxuICAgICAgaWYgKGxvY2F0aW9uLmRpc3RhbmNlKG9sZE5vZGUucG9zKSA8PSAwLjMpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IHRyYW5zZm9ybSA9IG10aC5NYXQ0LnRyYW5zbGF0ZShsb2NhdGlvbik7XHJcblxyXG4gIGxldCBwb3NpdGlvbiA9IGxvY2F0aW9uLmNvcHkoKTtcclxuICBsZXQgdW5pdCA9IGF3YWl0IHN5c3RlbS5hZGRVbml0KGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc2t5c3BoZXJlOiB7XHJcbiAgICAgICAgcm90YXRpb246IDAsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICB0eXBlOiBcIm5vZGVcIixcclxuICAgICAgcmVzcG9uc2Uoc3lzdGVtKSB7XHJcbiAgICAgICAgaWYgKGxvY2F0aW9uLnkgPD0gY3V0dGluZ0hlaWdodCkge1xyXG4gICAgICAgICAgc3lzdGVtLmRyYXdNYXJrZXJQcmltaXRpdmUobm9kZVByaW0sIHRyYW5zZm9ybSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCAvKiByZXNwb25zZSAqL1xyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgLy8gcG9zaXRpb24gcHJvcGVydHlcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodW5pdCwgXCJwb3NcIiwge1xyXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHBvc2l0aW9uO1xyXG4gICAgfSwgLyogZ2V0ICovXHJcblxyXG4gICAgc2V0OiBmdW5jdGlvbihuZXdQb3NpdGlvbikge1xyXG4gICAgICAvLyBjaGVjayBpZiBub2RlIGlzIHBvc3NpYmxlIHRvIG1vdmUgaGVyZVxyXG4gICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIE9iamVjdC52YWx1ZXMobm9kZXMpKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bml0ICYmICB2YWx1ZS5wb3MuZGlzdGFuY2UobmV3UG9zaXRpb24pIDw9IDAuMykge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcGxhY2Ugbm9kZVxyXG4gICAgICBwb3NpdGlvbiA9IG5ld1Bvc2l0aW9uLmNvcHkoKTtcclxuICAgICAgdHJhbnNmb3JtID0gbXRoLk1hdDQudHJhbnNsYXRlKHBvc2l0aW9uKTtcclxuICAgICAgdW5pdC5iYW5uZXIucG9zID0gcG9zaXRpb24uYWRkKG5ldyBtdGguVmVjMygwLCAyLCAwKSk7XHJcbiAgICAgIHVwZGF0ZUNvbm5lY3Rpb25UcmFuc2Zvcm1zKHVuaXQpO1xyXG5cclxuICAgICAgLy8gdXBkYXRlIHNlcnZlciBkYXRhXHJcbiAgICAgIHNlcnZlci51cGRhdGVOb2RlKHVuaXQubm9kZVVSSSwge3Bvc2l0aW9uOiBwb3NpdGlvbn0pO1xyXG4gICAgfSAvKiBzZXQgKi9cclxuICB9KTtcclxuXHJcbiAgLy8gbmFtZSBwcm9wZXJ0eVxyXG4gIGxldCBuYW1lID0gb2xkTmFtZTtcclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodW5pdCwgXCJuYW1lXCIsIHtcclxuICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBuYW1lO1xyXG4gICAgfSwgLyogZ2V0ICovXHJcblxyXG4gICAgc2V0OiBmdW5jdGlvbihuZXdOYW1lKSB7XHJcbiAgICAgIHVuaXQuYmFubmVyLmNvbnRlbnQgPSBuZXdOYW1lO1xyXG4gICAgICBuYW1lID0gbmV3TmFtZTtcclxuICAgICAgLy8gdXBkYXRlIHNlcnZlciBkYXRhXHJcblxyXG4gICAgICBzZXJ2ZXIudXBkYXRlTm9kZSh1bml0Lm5vZGVVUkksIHtuYW1lOiBuYW1lfSk7XHJcbiAgICB9IC8qIHNldCAqL1xyXG4gIH0pO1xyXG5cclxuICBsZXQgc2t5c3BoZXJlUGF0aDtcclxuICBpZiAob2xkU2t5c3BoZXJlICE9PSBudWxsKSB7XHJcbiAgICBza3lzcGhlcmVQYXRoID0gb2xkU2t5c3BoZXJlLnBhdGg7XHJcbiAgICB1bml0LnNreXNwaGVyZS5yb3RhdGlvbiA9IG9sZFNreXNwaGVyZS5yb3RhdGlvbjtcclxuICB9XHJcblxyXG4gIC8vIHNreXNwaGVyZS5wYXRoIHByb3BlcnR5XHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHVuaXQuc2t5c3BoZXJlLCBcInBhdGhcIiwge1xyXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHNreXNwaGVyZVBhdGg7XHJcbiAgICB9LCAvKiBnZXQgKi9cclxuXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKG5ld1NreXNwaGVyZVBhdGgpIHtcclxuICAgICAgc2t5c3BoZXJlUGF0aCA9IG5ld1NreXNwaGVyZVBhdGg7XHJcblxyXG4gICAgICAvLyB1cGRhdGUgc2VydmVyIGRhdGFcclxuICAgICAgc2VydmVyLnVwZGF0ZU5vZGUodW5pdC5ub2RlVVJJLCB7XHJcbiAgICAgICAgc2t5c3BoZXJlOiB7XHJcbiAgICAgICAgICBwYXRoOiBza3lzcGhlcmVQYXRoLFxyXG4gICAgICAgICAgcm90YXRpb246IHVuaXQuc2t5c3BoZXJlLnJvdGF0aW9uLFxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9IC8qIHNldCAqL1xyXG4gIH0pO1xyXG5cclxuICAvLyBnZXQgbm9kZSBpZFxyXG4gIGlmIChhZGRlZE9uU2VydmVyKSB7XHJcbiAgICB1bml0Lm5vZGVVUkkgPSBvbGRub2RlVVJJO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB1bml0Lm5vZGVVUkkgPSBhd2FpdCBzZXJ2ZXIuYWRkTm9kZSh7XHJcbiAgICAgIG5hbWU6IHVuaXQubmFtZSxcclxuICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICBza3lzcGhlcmU6IHtcclxuICAgICAgICBwYXRoOiB1bml0LnNreXNwaGVyZS5wYXRoLFxyXG4gICAgICAgIHJvdGF0aW9uOiB1bml0LnNreXNwaGVyZS5yb3RhdGlvblxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8vIGFkZCBuYW1lIGlmIGl0J3MgdW5kZWZpbmVkXHJcbiAgaWYgKG5hbWUgPT09IG51bGwpIHtcclxuICAgIG5hbWUgPSBgbm9kZSMke3VuaXQubm9kZVVSSX1gO1xyXG4gIH1cclxuXHJcbiAgdW5pdC5iYW5uZXIgPSBhd2FpdCBCYW5uZXIuY3JlYXRlKHN5c3RlbSwgbmFtZSwgbG9jYXRpb24sIDIpO1xyXG4gIHVuaXQuYmFubmVyLnNob3cgPSBmYWxzZTtcclxuXHJcbiAgbm9kZXNbdW5pdC5ub2RlVVJJLnRvU3RyKCldID0gdW5pdDtcclxuICB1bml0LmJhbm5lci5ub2RlVVJJID0gdW5pdC5ub2RlVVJJO1xyXG5cclxuICByZXR1cm4gdW5pdDtcclxufSAvKiBjcmVhdGVOb2RlICovXHJcblxyXG4vLyBkZXN0cm95IG5vZGVcclxuZnVuY3Rpb24gZGVzdHJveU5vZGUobm9kZSkge1xyXG4gIGJyZWFrTm9kZUNvbm5lY3Rpb25zKG5vZGUpO1xyXG4gIG5vZGUuZG9TdWljaWRlID0gdHJ1ZTtcclxuICBub2RlLmJhbm5lci5kb1N1aWNpZGUgPSB0cnVlO1xyXG4gIHNlcnZlci5kZWxOb2RlKG5vZGUubm9kZVVSSSk7XHJcblxyXG4gIGRlbGV0ZSBub2Rlc1tub2RlLm5vZGVVUkldO1xyXG59IC8qIGRlc3Ryb3lOb2RlICovXHJcblxyXG5cclxubGV0IGNvbm5lY3Rpb25QcmltaXRpdmUgPSBhd2FpdCBzeXN0ZW0uY3JlYXRlUHJpbWl0aXZlKHJuZC5Ub3BvbG9neS5jeWxpbmRlcigpLCBhd2FpdCBzeXN0ZW0uY3JlYXRlTWF0ZXJpYWwoXCIuL3NoYWRlcnMvY29ubmVjdGlvblwiKSk7XHJcbmxldCBjb25uZWN0aW9uVW5pcXVlSUQgPSAwO1xyXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVDb25uZWN0aW9uKGZpcnN0Tm9kZSwgc2Vjb25kTm9kZSwgYWRkZWRPblNlcnZlciA9IGZhbHNlKSB7XHJcbiAgLy8gY2hlY2sgaWYgY29ubmVjdGlvbiBpcyBwb3NzaWJsZVxyXG4gIGlmIChmaXJzdE5vZGUgPT09IHNlY29uZE5vZGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJjYW4ndCBjb25uZWN0IG5vZGUgd2l0aCBub2RlIGl0c2VsZlwiKTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBmb3IgKGNvbnN0IGluZGV4IGluIGNvbm5lY3Rpb25zKSB7XHJcbiAgICBsZXQgY29ubmVjdGlvbiA9IGNvbm5lY3Rpb25zW2luZGV4XTtcclxuXHJcbiAgICBpZiAoZmlyc3ROb2RlID09PSBjb25uZWN0aW9uLmZpcnN0ICYmIHNlY29uZE5vZGUgPT09IGNvbm5lY3Rpb24uc2Vjb25kIHx8XHJcbiAgICAgICAgZmlyc3ROb2RlID09PSBjb25uZWN0aW9uLnNlY29uZCAmJiBzZWNvbmROb2RlID09PSBjb25uZWN0aW9uLmZpcnN0KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYGNvbm5lY3Rpb24geyR7Zmlyc3ROb2RlLm5hbWV9LCAke3NlY29uZE5vZGUubmFtZX19IGFscmVhZHkgZXhpc3RzYCk7XHJcbiAgICAgIHJldHVybiBjb25uZWN0aW9uO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IHRyYW5zZm9ybSA9IG10aC5NYXQ0LmlkZW50aXR5KCk7XHJcblxyXG5cclxuICAvLyBXb3JraW5nIHdpdGggYmFja2VuZFxyXG4gIGlmICghYWRkZWRPblNlcnZlcikge1xyXG4gICAgaWYgKCEoYXdhaXQgc2VydmVyLmNvbm5lY3ROb2RlcyhmaXJzdE5vZGUubm9kZVVSSSwgc2Vjb25kTm9kZS5ub2RlVVJJKSkpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsZXQgdW5pdCA9IGF3YWl0IHN5c3RlbS5hZGRVbml0KGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZmlyc3Q6IGZpcnN0Tm9kZSxcclxuICAgICAgc2Vjb25kOiBzZWNvbmROb2RlLFxyXG4gICAgICB0eXBlOiBcImNvbm5lY3Rpb25cIixcclxuICAgICAgY29ubmVjdGlvbklEOiBjb25uZWN0aW9uVW5pcXVlSUQrKyxcclxuXHJcbiAgICAgIHVwZGF0ZVRyYW5zZm9ybSgpIHtcclxuICAgICAgICBsZXQgZGlyID0gdW5pdC5zZWNvbmQucG9zLnN1Yih1bml0LmZpcnN0LnBvcyk7XHJcbiAgICAgICAgbGV0IGRpc3QgPSBkaXIubGVuZ3RoKCk7XHJcbiAgICAgICAgZGlyID0gZGlyLm11bCgxLjAgLyBkaXN0KTtcclxuICAgICAgICBsZXQgZWxldmF0aW9uID0gTWF0aC5hY29zKGRpci55KTtcclxuXHJcbiAgICAgICAgdHJhbnNmb3JtID0gbXRoLk1hdDQuc2NhbGUobmV3IG10aC5WZWMzKDAuMSwgZGlzdCwgMC4xKSkubXVsKG10aC5NYXQ0LnJvdGF0ZShlbGV2YXRpb24sIG5ldyBtdGguVmVjMygtZGlyLnosIDAsIGRpci54KSkpLm11bChtdGguTWF0NC50cmFuc2xhdGUodW5pdC5maXJzdC5wb3MpKTtcclxuICAgICAgfSwgLyogdXBkYXRlVHJhbnNmb3JtICovXHJcblxyXG4gICAgICByZXNwb25zZShzeXN0ZW0pIHtcclxuICAgICAgICBpZiAoZmlyc3ROb2RlLnBvcy55IDw9IGN1dHRpbmdIZWlnaHQgfHwgc2Vjb25kTm9kZS5wb3MueSA8PSBjdXR0aW5nSGVpZ2h0KSB7XHJcbiAgICAgICAgICBzeXN0ZW0uZHJhd01hcmtlclByaW1pdGl2ZShjb25uZWN0aW9uUHJpbWl0aXZlLCB0cmFuc2Zvcm0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSAvKiByZXNwb25zZSAqL1xyXG4gICAgfTtcclxuICB9KTtcclxuICB1bml0LnVwZGF0ZVRyYW5zZm9ybSgpO1xyXG5cclxuICBjb25uZWN0aW9uc1t1bml0LmNvbm5lY3Rpb25JRF0gPSB1bml0O1xyXG5cclxuICByZXR1cm4gdW5pdDtcclxufSAvKiBjcmVhdGVDb25uZWN0aW9uICovXHJcblxyXG5cclxuZnVuY3Rpb24gZGVzdHJveUNvbm5lY3Rpb24oY29ubmVjdGlvbikge1xyXG4gIGNvbm5lY3Rpb24uZG9TdWljaWRlID0gdHJ1ZTtcclxuICBjb25zb2xlLmxvZyhjb25uZWN0aW9uLmZpcnN0Lm5vZGVVUkkudG9TdHIoKSwgY29ubmVjdGlvbi5zZWNvbmQubm9kZVVSSS50b1N0cigpKTtcclxuICBzZXJ2ZXIuZGlzY29ubmVjdE5vZGVzKGNvbm5lY3Rpb24uZmlyc3Qubm9kZVVSSSwgY29ubmVjdGlvbi5zZWNvbmQubm9kZVVSSSk7XHJcbiAgZGVsZXRlIGNvbm5lY3Rpb25zW2Nvbm5lY3Rpb24uY29ubmVjdGlvbklEXTtcclxufSAvKiBkZXN0cm95Q29ubmVjdGlvbiAqL1xyXG5cclxuXHJcbi8vIHVwZGF0ZSB0cmFuc2Zvcm0gbWF0cmljZXMgb2YgYWxsIGNvbm5lY3Rpb25zIHdpdGggbm9kZS5cclxuZnVuY3Rpb24gdXBkYXRlQ29ubmVjdGlvblRyYW5zZm9ybXMobm9kZSA9IG51bGwpIHtcclxuICBmb3IgKGNvbnN0IHZhbHVlIG9mIE9iamVjdC52YWx1ZXMoY29ubmVjdGlvbnMpKSB7XHJcbiAgICBpZiAodmFsdWUuZmlyc3QgPT09IG5vZGUgfHwgdmFsdWUuc2Vjb25kID09PSBub2RlKSB7XHJcbiAgICAgIHZhbHVlLnVwZGF0ZVRyYW5zZm9ybSgpO1xyXG4gICAgfVxyXG4gIH1cclxufSAvKiB1cGRhdGVDb25uZWN0aW9uVHJhbnNmb3JtcyAqL1xyXG5cclxuXHJcbi8vIGRlbGV0ZSBhbGwgY29ubmVjdGlvbnMgd2l0aCBzcGVjaWZpZWQgbm9kZVxyXG5mdW5jdGlvbiBicmVha05vZGVDb25uZWN0aW9ucyhub2RlID0gbnVsbCkge1xyXG4gIGxldCBrZXlMaXN0ID0gW107XHJcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoY29ubmVjdGlvbnMpKSB7XHJcbiAgICBpZiAodmFsdWUuZmlyc3QgPT09IG5vZGUgfHwgdmFsdWUuc2Vjb25kID09PSBub2RlKSB7XHJcbiAgICAgIHZhbHVlLmRvU3VpY2lkZSA9IHRydWU7XHJcbiAgICAgIGtleUxpc3QucHVzaChrZXkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZm9yIChsZXQga2V5IG9mIGtleUxpc3QpIHtcclxuICAgIGRlc3Ryb3lDb25uZWN0aW9uKGNvbm5lY3Rpb25zW2tleV0pO1xyXG4gIH1cclxufSAvKiBicmVha05vZGVDb25uZWN0aW9ucyAqL1xyXG5cclxuXHJcbi8vIGxvYWQgcHJldmlvdXMgc2Vzc2lvbiBub2RlcyBhbmQgY29ubmVjdGlvbnNcclxuYXN5bmMgZnVuY3Rpb24gYWRkU2VydmVyRGF0YSgpIHtcclxuICBsZXQgc2VydmVyTm9kZVVSSXMgPSBhd2FpdCBzZXJ2ZXIuZ2V0QWxsTm9kZXMoKTtcclxuICBsZXQgc2VydmVyTm9kZXMgPSBhd2FpdCBzZXJ2ZXIuZ2V0QWxsTm9kZXNEYXRhKCk7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwLCBjb3VudCA9IHNlcnZlck5vZGVzLmxlbmd0aDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgIGxldCBzZXJ2ZXJOb2RlID0gc2VydmVyTm9kZXNbaV07XHJcbiAgICBhd2FpdCBjcmVhdGVOb2RlKG10aC5WZWMzLmZyb21PYmplY3Qoc2VydmVyTm9kZS5wb3NpdGlvbiksIHNlcnZlck5vZGUubmFtZSwgc2VydmVyTm9kZS5za3lzcGhlcmUsIHRydWUsIHNlcnZlck5vZGVVUklzW2ldKVxyXG4gIH1cclxuICAvLyBsZXQgc2VydmVyTm9kZVVSSXMgPSBhd2FpdCBzZXJ2ZXIuZ2V0QWxsTm9kZXMoKTtcclxuICAvLyBmb3IgKGxldCBzZXJ2ZXJOb2RlVVJJIG9mIHNlcnZlck5vZGVVUklzKSB7XHJcbiAgLy8gICBsZXQgc2VydmVyTm9kZSA9IGF3YWl0IHNlcnZlci5nZXROb2RlKHNlcnZlck5vZGVVUkkpO1xyXG4gIC8vICAgYXdhaXQgY3JlYXRlTm9kZShtdGguVmVjMy5mcm9tT2JqZWN0KHNlcnZlck5vZGUucG9zaXRpb24pLCBzZXJ2ZXJOb2RlLm5hbWUsIHNlcnZlck5vZGUuc2t5c3BoZXJlLCB0cnVlLCBzZXJ2ZXJOb2RlVVJJKTtcclxuICAvLyB9XHJcblxyXG4gIC8vIHNhbWUgc2hpdCwgYnV0IHdpdGggbmljZSBzdGhcclxuICBsZXQgc2VydmVyQ29ubmVjdGlvbnMgPSBhd2FpdCBzZXJ2ZXIuZ2V0QWxsQ29ubmVjdGlvbnMoKTtcclxuXHJcbiAgZm9yIChsZXQgY29ubmVjdGlvbiBvZiBzZXJ2ZXJDb25uZWN0aW9ucykge1xyXG4gICAgY3JlYXRlQ29ubmVjdGlvbihub2Rlc1tjb25uZWN0aW9uWzBdLnRvU3RyKCldLCBub2Rlc1tjb25uZWN0aW9uWzFdLnRvU3RyKCldLCB0cnVlKTtcclxuICB9XHJcbn0gLyogYWRkU2VydmVyRGF0YSAqL1xyXG5hd2FpdCBhZGRTZXJ2ZXJEYXRhKCk7XHJcblxyXG4vLyBhZGRpbmcgbm9kZVxyXG5zeXN0ZW0uY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGV2ZW50KSA9PiB7XHJcbiAgaWYgKChldmVudC5idXR0b25zICYgMSkgPT09IDEgJiYgZXZlbnQuYWx0S2V5KSB7XHJcbiAgICBsZXQgdW5pdCA9IHN5c3RlbS5nZXRVbml0QnlDb29yZChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcclxuICBcclxuICAgIGlmICh1bml0ICE9PSB1bmRlZmluZWQgJiYgdW5pdC50eXBlID09PSBcImJhc2VDb25zdHJ1Y3Rpb25cIikge1xyXG4gICAgICBjcmVhdGVOb2RlKHN5c3RlbS5nZXRQb3NpdGlvbkJ5Q29vcmQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSkpO1xyXG4gICAgfVxyXG4gIH1cclxufSk7IC8qIGV2ZW50IHN5c3RlbS5jYW52YXM6XCJtb3VzZWRvd25cIiAqL1xyXG5cclxubGV0IGV2ZW50UGFpciA9IG51bGw7XHJcblxyXG4vLyBhZGRpbmcgY29ubmVjdGlvbiBiZXR3ZWVuIG5vZGVzXHJcbnN5c3RlbS5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZXZlbnQpID0+IHtcclxuICBpZiAoKGV2ZW50LmJ1dHRvbnMgJiAyKSA9PT0gMiAmJiAhZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQuYWx0S2V5KSB7XHJcbiAgICBsZXQgcG9pbnRFdmVudCA9IHtcclxuICAgICAgeDogZXZlbnQuY2xpZW50WCxcclxuICAgICAgeTogZXZlbnQuY2xpZW50WVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgdW5pdCA9IHN5c3RlbS5nZXRVbml0QnlDb29yZChwb2ludEV2ZW50LngsIHBvaW50RXZlbnQueSk7XHJcblxyXG4gICAgaWYgKHVuaXQgIT09IHVuZGVmaW5lZCAmJiB1bml0LnR5cGUgPT09IFwibm9kZVwiKSB7XHJcbiAgXHJcbiAgICAgIHBvaW50RXZlbnQudW5pdCA9IHVuaXQ7XHJcbiAgXHJcbiAgICAgIGlmIChldmVudFBhaXIgPT09IG51bGwpIHtcclxuICAgICAgICBldmVudFBhaXIgPSB7XHJcbiAgICAgICAgICBmaXJzdDogcG9pbnRFdmVudCxcclxuICAgICAgICAgIHNlY29uZDogbnVsbFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZXZlbnRQYWlyLmZpcnN0LmJhbm5lclByb21pc2UgPSBCYW5uZXIuY3JlYXRlKHN5c3RlbSwgXCJGaXJzdCBlbGVtZW50XCIsIHVuaXQucG9zLCA0KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBldmVudFBhaXIuc2Vjb25kID0gcG9pbnRFdmVudDtcclxuICBcclxuICAgICAgICAvLyBlcmFzZSBiYW5uZXJcclxuICAgICAgICBldmVudFBhaXIuZmlyc3QuYmFubmVyUHJvbWlzZS50aGVuKGJhbm5lciA9PiBiYW5uZXIuZG9TdWljaWRlID0gdHJ1ZSk7XHJcbiAgICAgICAgLy8gcmVmdXNlIGNvbm5lY3Rpb24gd2l0aCBpbnZhbGlkIGJhbm5lclxyXG4gICAgICAgIGlmIChldmVudFBhaXIuZmlyc3QudW5pdC5kb1N1aWNpZGUpIHtcclxuICAgICAgICAgIGV2ZW50UGFpciA9IG51bGw7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gIFxyXG4gICAgICAgIGNyZWF0ZUNvbm5lY3Rpb24oZXZlbnRQYWlyLmZpcnN0LnVuaXQsIGV2ZW50UGFpci5zZWNvbmQudW5pdCk7XHJcbiAgXHJcbiAgICAgICAgZXZlbnRQYWlyID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcG9pbnRFdmVudCA9IG51bGw7XHJcbiAgfVxyXG59KTsgLyogZXZlbnQgc3lzdGVtLmNhbnZhczpcIm1vdXNlZG93blwiICovXHJcblxyXG5cclxuXHJcbi8vIFVJIGhhbmRsaW5nXHJcblxyXG5sZXQgbm9kZVBhcmFtZXRlcnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vZGVQYXJhbWV0ZXJzXCIpO1xyXG5sZXQgbm9kZUlucHV0UGFyYW1ldGVycyA9IHtcclxuICBub2RlVVJJOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vZGVVUklcIiksXHJcbiAgbm9kZU5hbWU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm9kZU5hbWVcIiksXHJcbiAgc2t5c3BoZXJlUGF0aDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJza3lzcGhlcmVQYXRoXCIpLFxyXG4gIG1ha2VEZWZhdWx0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1ha2VEZWZhdWx0XCIpLFxyXG4gIGRlbGV0ZU5vZGU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVsZXRlTm9kZVwiKVxyXG59OyAvKiBub2RlSW5wdXRQYXJhbWV0ZXJzICovXHJcblxyXG5sZXQgY29ubmVjdGlvblBhcmFtZXRlcnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbm5lY3Rpb25QYXJhbWV0ZXJzXCIpO1xyXG5sZXQgY29ubmVjdGlvbklucHV0UGFyYW1ldGVycyA9IHtcclxuICBub2Rlc1VSSTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25uZWN0aW9uTm9kZXNVUklcIiksXHJcbiAgZGVsZXRlQ29ubmVjdGlvbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZWxldGVDb25uZWN0aW9uXCIpXHJcbn07IC8qIGNvbm5lY3Rpb25JbnB1dFBhcmFtZXRlcnMgKi9cclxuXHJcbi8vIG5vZGUgcG9pbnRpbmcgdW5pdFxyXG5sZXQgZG9Nb3ZlTm9kZSA9IHRydWU7XHJcbmxldCBhY3RpdmVDb250ZW50U2hvd05vZGUgPSBudWxsO1xyXG5sZXQgYWN0aXZlQ29udGVudFNob3dDb25uZWN0aW9uID0gbnVsbDtcclxuXHJcbi8vIGN1cnJlbnQgdW5pdCBzZWxlY3RvclxyXG5sZXQgYWN0aXZlQmFubmVyU2hvd1VuaXQgPSBudWxsO1xyXG5zeXN0ZW0uY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKGV2ZW50KSA9PiB7XHJcbiAgbGV0IHVuaXQgPSBzeXN0ZW0uZ2V0VW5pdEJ5Q29vcmQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XHJcblxyXG4gIGlmICh1bml0ID09PSBhY3RpdmVCYW5uZXJTaG93VW5pdCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKHVuaXQgIT09IHVuZGVmaW5lZCAmJiB1bml0LnR5cGUgPT09IFwiYmFubmVyXCIpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChhY3RpdmVCYW5uZXJTaG93VW5pdCAhPT0gbnVsbCkge1xyXG4gICAgYWN0aXZlQmFubmVyU2hvd1VuaXQuYmFubmVyLnNob3cgPSBmYWxzZTtcclxuICAgIGFjdGl2ZUJhbm5lclNob3dVbml0ID0gbnVsbDtcclxuICB9XHJcblxyXG4gIGlmICh1bml0ICE9PSB1bmRlZmluZWQgJiYgdW5pdC50eXBlID09PSBcIm5vZGVcIikge1xyXG4gICAgdW5pdC5iYW5uZXIuc2hvdyA9IHRydWU7XHJcbiAgICBhY3RpdmVCYW5uZXJTaG93VW5pdCA9IHVuaXQ7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vIHVuaXQgbmFtZSBzaG93ZXJcclxuc3lzdGVtLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldmVudCkgPT4ge1xyXG4gIGlmICgoZXZlbnQuYnV0dG9ucyAmIDEpICE9PSAxIHx8IGV2ZW50LmN0cmxLZXkpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGxldCB1bml0ID0gc3lzdGVtLmdldFVuaXRCeUNvb3JkKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xyXG5cclxuICBub2RlSW5wdXRQYXJhbWV0ZXJzLm5vZGVVUkkuaW5uZXJUZXh0ID0gXCJcIjtcclxuICBub2RlSW5wdXRQYXJhbWV0ZXJzLm5vZGVOYW1lLnZhbHVlID0gXCJcIjtcclxuICBub2RlSW5wdXRQYXJhbWV0ZXJzLnNreXNwaGVyZVBhdGgudmFsdWUgPSBcIlwiO1xyXG5cclxuICBhY3RpdmVDb250ZW50U2hvd05vZGUgPSBudWxsO1xyXG4gIGFjdGl2ZUNvbnRlbnRTaG93Q29ubmVjdGlvbiA9IG51bGw7XHJcbiAgZG9Nb3ZlTm9kZSA9IGZhbHNlO1xyXG5cclxuICBpZiAodW5pdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAodW5pdC50eXBlID09PSBcIm5vZGVcIikge1xyXG4gICAgbm9kZVBhcmFtZXRlcnMucmVtb3ZlQXR0cmlidXRlKFwiaGlkZGVuXCIpO1xyXG4gICAgY29ubmVjdGlvblBhcmFtZXRlcnMuc2V0QXR0cmlidXRlKFwiaGlkZGVuXCIsIFwiXCIpO1xyXG5cclxuICAgIG5vZGVJbnB1dFBhcmFtZXRlcnMubm9kZVVSSS5pbm5lclRleHQgPSB1bml0Lm5vZGVVUkkudG9TdHIoKTtcclxuICAgIG5vZGVJbnB1dFBhcmFtZXRlcnMubm9kZU5hbWUudmFsdWUgPSB1bml0Lm5hbWU7XHJcbiAgICBub2RlSW5wdXRQYXJhbWV0ZXJzLnNreXNwaGVyZVBhdGgudmFsdWUgPSB1bml0LnNreXNwaGVyZS5wYXRoO1xyXG5cclxuICAgIGFjdGl2ZUNvbnRlbnRTaG93Tm9kZSA9IHVuaXQ7XHJcbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIHtcclxuICAgICAgZG9Nb3ZlTm9kZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmICh1bml0LnR5cGUgPT09IFwiY29ubmVjdGlvblwiKSB7XHJcbiAgICBjb25uZWN0aW9uSW5wdXRQYXJhbWV0ZXJzLm5vZGVzVVJJLmlubmVyVGV4dCA9IGAke3VuaXQuZmlyc3Qubm9kZVVSSS50b1N0cigpfSAtICR7dW5pdC5zZWNvbmQubm9kZVVSSS50b1N0cigpfWA7XHJcblxyXG4gICAgbm9kZVBhcmFtZXRlcnMuc2V0QXR0cmlidXRlKFwiaGlkZGVuXCIsIFwiXCIpO1xyXG4gICAgY29ubmVjdGlvblBhcmFtZXRlcnMucmVtb3ZlQXR0cmlidXRlKFwiaGlkZGVuXCIpO1xyXG5cclxuICAgIGFjdGl2ZUNvbnRlbnRTaG93Q29ubmVjdGlvbiA9IHVuaXQ7XHJcbiAgfSBlbHNlIHtcclxuICAgIG5vZGVQYXJhbWV0ZXJzLnNldEF0dHJpYnV0ZShcImhpZGRlblwiLCBcIlwiKTtcclxuICAgIGNvbm5lY3Rpb25QYXJhbWV0ZXJzLnNldEF0dHJpYnV0ZShcImhpZGRlblwiLCBcIlwiKTtcclxuICB9XHJcbn0pOyAvKiBldmVudCBzeXN0ZW0uY2FudmFzOlwibW91c2Vkb3duXCIgKi9cclxuXHJcblxyXG5zeXN0ZW0uY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChldmVudCkgPT4ge1xyXG4gIGRvTW92ZU5vZGUgPSBmYWxzZTtcclxufSk7IC8qIGV2ZW50IHN5c3RlbS5jYW52YXM6XCJtb3VzZXVwXCIgKi9cclxuXHJcbi8vIG5vZGUgbW92ZW1lbnQgaGFuZGxlclxyXG5zeXN0ZW0uY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKGV2ZW50KSA9PiB7XHJcbiAgaWYgKGFjdGl2ZUNvbnRlbnRTaG93Tm9kZSAhPT0gbnVsbCAmJiBkb01vdmVOb2RlKSB7XHJcbiAgICBsZXQgcG9zaXRpb24gPSBzeXN0ZW0uZ2V0UG9zaXRpb25CeUNvb3JkKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xyXG5cclxuICAgIGlmIChwb3NpdGlvbi54ICE9PSBwb3NpdGlvbi55ICYmIHBvc2l0aW9uLnkgIT09IHBvc2l0aW9uLnopIHtcclxuICAgICAgYWN0aXZlQ29udGVudFNob3dOb2RlLnBvcyA9IHBvc2l0aW9uO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9Nb3ZlTm9kZSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxufSk7IC8qIGV2ZW50IHN5c3RlbS5jYW52YXM6XCJtb3VzZW1vdmVcIiAqL1xyXG5cclxubm9kZUlucHV0UGFyYW1ldGVycy5ub2RlTmFtZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcclxuICBpZiAoYWN0aXZlQ29udGVudFNob3dOb2RlICE9PSBudWxsKSB7XHJcbiAgICBhY3RpdmVDb250ZW50U2hvd05vZGUubmFtZSA9IG5vZGVJbnB1dFBhcmFtZXRlcnMubm9kZU5hbWUudmFsdWU7XHJcbiAgfVxyXG59KTsgLyogZXZlbnQgbm9kZUlucHV0UGFyYW1ldGVycy5ub2RlTmFtZTpcImNoYW5nZVwiICovXHJcblxyXG5ub2RlSW5wdXRQYXJhbWV0ZXJzLnNreXNwaGVyZVBhdGguYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XHJcbiAgaWYgKGFjdGl2ZUNvbnRlbnRTaG93Tm9kZSAhPT0gbnVsbCkge1xyXG4gICAgYWN0aXZlQ29udGVudFNob3dOb2RlLnNreXNwaGVyZS5wYXRoID0gbm9kZUlucHV0UGFyYW1ldGVycy5za3lzcGhlcmVQYXRoLnZhbHVlO1xyXG4gIH1cclxufSk7IC8qIGV2ZW50IG5vZGVJbnB1dFBhcmFtZXRlcnMuc2t5c3BoZXJlUGF0aDpcImNoYW5nZVwiICovXHJcblxyXG5ub2RlSW5wdXRQYXJhbWV0ZXJzLm1ha2VEZWZhdWx0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgaWYgKGFjdGl2ZUNvbnRlbnRTaG93Tm9kZSAhPT0gbnVsbCkge1xyXG4gICAgc2VydmVyLnNldERlZk5vZGVVUkkoYWN0aXZlQ29udGVudFNob3dOb2RlLm5vZGVVUkkpLnRoZW4oKCkgPT4ge2NvbnNvbGUubG9nKGBuZXcgZGVmYXVsdCBub2RlOiAke2FjdGl2ZUNvbnRlbnRTaG93Tm9kZS5uYW1lfWApfSk7XHJcbiAgfVxyXG59KTsgLyogZXZlbnQgbm9kZUlucHV0UGFyYW1ldGVycy5tYWtlRGVmYXVsdDpcImNsaWNrXCIgKi9cclxuXHJcbm5vZGVJbnB1dFBhcmFtZXRlcnMuZGVsZXRlTm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gIGlmIChhY3RpdmVDb250ZW50U2hvd05vZGUgIT09IG51bGwpIHtcclxuICAgIGRlc3Ryb3lOb2RlKGFjdGl2ZUNvbnRlbnRTaG93Tm9kZSk7XHJcbiAgICBhY3RpdmVDb250ZW50U2hvd05vZGUgPSBudWxsO1xyXG4gIH1cclxufSk7IC8qIGV2ZW50IG5vZGVJbnB1dFBhcmFtZXRlcnMuZGVsZXRlTm9kZTpcImNsaWNrXCIgKi9cclxuXHJcbmNvbm5lY3Rpb25JbnB1dFBhcmFtZXRlcnMuZGVsZXRlQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gIGlmIChhY3RpdmVDb250ZW50U2hvd0Nvbm5lY3Rpb24gIT09IG51bGwpIHtcclxuICAgIGRlc3Ryb3lDb25uZWN0aW9uKGFjdGl2ZUNvbnRlbnRTaG93Q29ubmVjdGlvbik7XHJcbiAgICBhY3RpdmVDb250ZW50U2hvd0Nvbm5lY3Rpb24gPSBudWxsO1xyXG4gIH1cclxufSk7IC8qIGV2ZW50IGNvbm5lY3Rpb25JbnB1dFBhcmFtZXRlcnMuZGVsZXRlQ29ubmVjdGlvbjpcImNsaWNrXCIgKi9cclxuXHJcbi8vIHByZXZpZXcgbW9kZSByZWRpcmVjdGluZyBidXR0b25cclxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b1ByZXZpZXdcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiLi92aWV3ZXIuaHRtbFwiO1xyXG59KTsgLyogZXZlbnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcmV2aWV3XCIpOlwiY2xpY2tcIiAqL1xyXG5cclxuLy8gc3RhcnQgc3lzdGVtXHJcbnN5c3RlbS5ydW4oKTtcclxuXHJcbi8qIG1haW4uanMgKi8iXSwibmFtZXMiOlsibXRoLlNpemUiLCJtdGguVmVjMyIsIm10aC5WZWMyIiwibXRoLk1hdDQiLCJtdGguQ2FtZXJhIiwicm5kLlRvcG9sb2d5Iiwid2l0aE5hdGl2ZUJsb2IiLCJ3aXRoTmF0aXZlQXJyYXlCdWZmZXIiLCJpc1ZpZXciLCJsb29rdXAiLCJkZWNvZGUiLCJwcm90b2NvbCIsImdsb2JhbFRoaXMiLCJlbmNvZGUiLCJYTUxIdHRwUmVxdWVzdCIsIlNvY2tldCIsIlJFU0VSVkVEX0VWRU5UUyIsIkVuZ2luZSIsImlvIiwicm5kLlN5c3RlbSIsImNhbWVyYUNvbnRyb2xsZXIuQXJjYmFsbCJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUNsRCxFQUFFLElBQUksTUFBTSxJQUFJLElBQUksRUFBRTtBQUN0QixJQUFJLE9BQU8sSUFBSSxDQUFDO0FBQ2hCLEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyQztBQUNBLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDbEMsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCO0FBQ0EsRUFBRSxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEMsRUFBRSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDO0FBQ25DLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3RDtBQUNBLEVBQUUsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUNEO0FBQ08sU0FBUyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRTtBQUM3RCxFQUFFLElBQUksT0FBTyxHQUFHO0FBQ2hCLElBQUksc0JBQXNCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxh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QUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BELE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDcEQsS0FBSyxDQUFDO0FBQ04sR0FBRztBQUNIO0FBQ0EsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUNsQixFQUFFO0FBQ0YsSUFBSSxPQUFPLElBQUksSUFBSTtBQUNuQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3pFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDekUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUN6RSxLQUFLLENBQUM7QUFDTixHQUFHO0FBQ0g7QUFDQSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ2hCLEVBQUU7QUFDRixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDOUU7QUFDQSxJQUFJLE9BQU8sSUFBSSxJQUFJO0FBQ25CLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFDL0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUMvRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQy9FLEtBQUssQ0FBQztBQUNOLEdBQUc7QUFDSDtBQUNBLEVBQUUsU0FBUyxHQUFHO0FBQ2QsSUFBSSxPQUFPLElBQUksSUFBSTtBQUNuQixNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BELE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDcEQsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNwRCxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BELEtBQUssQ0FBQztBQUNOLEdBQUc7QUFDSDtBQUNBLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRTtBQUNWLElBQUksT0FBTyxJQUFJLElBQUk7QUFDbkIsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HO0FBQ0EsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HO0FBQ0EsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HO0FBQ0EsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENB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RyxDQUFDLElBQUksQ0FBQztBQUMxRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0FBQzFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDMUcsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLGdDQUFnQyxDQUFDLGdDQUFnQyxDQUFDO0FBQzFHLEtBQUssQ0FBQztBQUNOLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFDM0IsSUFBSTtBQUNKLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFO0FBQ25DLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxFQUFFO0FBQ3JDLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0I7QUFDQSxJQUFJLE9BQU8sSUFBSSxJQUFJO0FBQ25CLE1BQU0sR0FBRyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ25ELE1BQU0sR0FBRyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ25ELE1BQU0sR0FBRyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ25ELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDbkQsS0FBSyxDQUFDO0FBQ04sR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtBQUN0RCxJQUFJLE9BQU8sSUFBSSxJQUFJO0FBQ25CLE1BQU0sQ0FBQyxHQUFHLElBQUksSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsQ0FBQztBQUN6RyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsK0JBQStCLENBQUM7QUFDekcsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLE1BQU0sS0FBSyxHQUFHLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsR0FBRyxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekcsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLGdDQUFnQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQztBQUN6RyxLQUFLLENBQUM7QUFDTixHQUFHO0FBQ0gsQ0FBQztBQUNEO0FBQ08sTUFBTSxNQUFNLENBQUM7QUFDcEI7QUFDQSxFQUFFLFFBQVEsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbEMsRUFBRSxpQkFBaUIsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDM0MsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2QsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2I7QUFDQTtBQUNBLEVBQUUsVUFBVSxDQUFDO0FBQ2I7QUFDQTtBQUNBLEVBQUUsR0FBRyxDQUFDO0FBQ04sRUFBRSxFQUFFLENBQUM7QUFDTCxFQUFFLEdBQUcsQ0FBQztBQUNOLEVBQUUsRUFBRSxDQUFDO0FBQ0wsRUFBRSxLQUFLLENBQUM7QUFDUjtBQUNBO0FBQ0EsRUFBRSxJQUFJLENBQUM7QUFDUCxFQUFFLElBQUksQ0FBQztBQUNQLEVBQUUsUUFBUSxDQUFDO0FBQ1g7QUFDQSxFQUFFLFdBQVcsR0FBRztBQUNoQixJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2hDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFO0FBQ3hDLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkMsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUN4QixJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDO0FBQ3RCLElBQUksSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEQ7QUFDQSxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUU7QUFDL0MsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLEtBQUssTUFBTTtBQUNYLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUN4RSxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU87QUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNqRSxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ2pFLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRztBQUN6QixLQUFLLENBQUM7QUFDTixJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdDLEdBQUc7QUFDSDtBQUNBLEVBQUUsTUFBTSxDQUFDLGFBQWEsRUFBRTtBQUN4QixJQUFJLElBQUksQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzNDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELEdBQUc7QUFDSDtBQUNBLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBQ25CLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDdkMsSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QztBQUNBLElBQUksSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDMUIsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN4QjtBQUNBLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdFLElBQUksSUFBSSxDQUFDLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdFLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JGLEdBQUc7QUFDSCxDQUFDOztBQ2pZRDtBQUNBLFNBQVMsU0FBUyxDQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUU7QUFDbEQsRUFBRSxNQUFNLElBQUksR0FBRyxDQUFDLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsc0JBQXNCLENBQUMsR0FBRyxFQUFFLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hJLEVBQUUsUUFBUSxhQUFhO0FBQ3ZCLElBQUksS0FBSyxPQUFPLENBQUMsS0FBSztBQUN0QixNQUFNLE1BQU0sY0FBYyxHQUFHLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDLEtBQUssRUFBRSxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDeEosTUFBTSxPQUFPO0FBQ2IsUUFBUSxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFDeEMsUUFBUSxRQUFRLEVBQUUsY0FBYyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFDcEQsUUFBUSxhQUFhLEVBQUUsc0JBQXNCLENBQUMsS0FBSztBQUNuRCxPQUFPLENBQUM7QUFDUjtBQUNBLElBQUksS0FBSyxPQUFPLENBQUMsYUFBYTtBQUM5QixNQUFNLE1BQU0sYUFBYSxHQUFHLENBQUMsc0JBQXNCLENBQUMsRUFBRSxFQUFFLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDL0ksTUFBTSxPQUFPO0FBQ2IsUUFBUSxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFDeEMsUUFBUSxRQUFRLEVBQUUsYUFBYSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFDbkQsUUFBUSxhQUFhLEVBQUUsc0JBQXNCLENBQUMsYUFBYTtBQUMzRCxPQUFPLENBQUM7QUFDUjtBQUNBLElBQUksS0FBSyxPQUFPLENBQUMsS0FBSztBQUN0QixNQUFNLE9BQU87QUFDYixRQUFRLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQyxlQUFlO0FBQ3RELFFBQVEsUUFBUSxFQUFFLHNCQUFzQixDQUFDLGtCQUFrQjtBQUMzRCxRQUFRLGFBQWEsRUFBRSxzQkFBc0IsQ0FBQyxLQUFLO0FBQ25ELE9BQU8sQ0FBQztBQUNSO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsTUFBTSxPQUFPO0FBQ2IsUUFBUSxNQUFNLEVBQUUsc0JBQXNCLENBQUMsR0FBRztBQUMxQyxRQUFRLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxFQUFFO0FBQzNDLFFBQVEsYUFBYSxFQUFFLHNCQUFzQixDQUFDLGFBQWE7QUFDM0QsT0FBTyxDQUFDO0FBQ1IsR0FBRztBQUNILENBQUM7QUFDRDtBQUNPLE1BQU0sT0FBTyxDQUFDO0FBQ3JCLEVBQUUsR0FBRyxDQUFDO0FBQ04sRUFBRSxPQUFPLENBQUM7QUFDVixFQUFFLElBQUksQ0FBQztBQUNQLEVBQUUsRUFBRSxDQUFDO0FBQ0w7QUFDQSxFQUFFLE9BQU8sS0FBSyxXQUFXLENBQUMsQ0FBQztBQUMzQixFQUFFLE9BQU8sYUFBYSxHQUFHLENBQUMsQ0FBQztBQUMzQixFQUFFLE9BQU8sS0FBSyxXQUFXLENBQUMsQ0FBQztBQUMzQjtBQUNBLEVBQUUsV0FBVyxDQUFDLEVBQUUsRUFBRSxhQUFhLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxjQUFjLEdBQUcsQ0FBQyxFQUFFO0FBQ3JFLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDakIsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUlBLElBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbkMsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUNqQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0M7QUFDQSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLGFBQWEsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMzRDtBQUNBLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4SDtBQUNBLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEUsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0RSxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN6RSxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN6RTtBQUNBLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0MsR0FBRztBQUNIO0FBQ0E7QUFDQSxFQUFFLE9BQU8scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBQ3RDLEVBQUUsT0FBTyxjQUFjLENBQUMsRUFBRSxFQUFFO0FBQzVCLElBQUksSUFBSSxPQUFPLENBQUMscUJBQXFCLEtBQUssSUFBSSxFQUFFO0FBQ2hELE1BQU0sT0FBTyxDQUFDLHFCQUFxQixHQUFHLElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hGO0FBQ0EsTUFBTSxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3RFLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLFVBQVUsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5SDtBQUNBLE1BQU0sRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekUsTUFBTSxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN6RSxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sT0FBTyxDQUFDLHFCQUFxQixDQUFDO0FBQ3pDLEdBQUc7QUFDSDtBQUNBLEVBQUUsY0FBYyxDQUFDLElBQUksRUFBRTtBQUN2QixJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2hELElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxVQUFVLENBQUM7QUFDckcsTUFBTSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0FBQzVCLE1BQU0sSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtBQUM1QixNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7QUFDNUIsTUFBTSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0FBQzVCLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDUixHQUFHO0FBQ0g7QUFDQSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDYixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxLQUFLO0FBQzVDLE1BQU0sSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUM5QjtBQUNBLE1BQU0sS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDdkIsTUFBTSxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU07QUFDM0IsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlCLFFBQVEsT0FBTyxFQUFFLENBQUM7QUFDbEIsT0FBTyxDQUFDO0FBQ1IsS0FBSyxDQUFDLENBQUM7QUFDUCxHQUFHO0FBQ0g7QUFDQSxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDbkIsSUFBSSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQ3JCO0FBQ0EsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0FBQzlCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUMvQixJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0MsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2hILEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFO0FBQzNCLElBQUksSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUNyQjtBQUNBLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQzFDLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQztBQUNBLElBQUksSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckUsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNsQyxHQUFHO0FBQ0g7QUFDQSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUU7QUFDZixJQUFJLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDckIsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM1QjtBQUNBLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDNUksR0FBRztBQUNILENBQUM7QUFDRDtBQUNBLE1BQU0sZ0JBQWdCLEdBQUc7QUFDekIsRUFBRSxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUM7QUFDeEYsRUFBRSxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUM7QUFDeEYsRUFBRSxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUM7QUFDeEYsRUFBRSxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUM7QUFDeEYsRUFBRSxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUM7QUFDeEYsRUFBRSxDQUFDLE1BQU0sRUFBRSxz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QUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDMUUsY0FBYyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUlDLElBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDdkUsY0FBYyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUlELElBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3hFLGFBQWEsQ0FBQyxDQUFDO0FBQ2YsV0FBVztBQUNYLFVBQVU7QUFDVixZQUFZLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0MsWUFBWSxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BGO0FBQ0EsWUFBWSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU07QUFDbkMsY0FBYyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUlBLElBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzFFLGNBQWMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJQyxJQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZFLGNBQWMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJRCxJQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN4RSxhQUFhLENBQUMsQ0FBQztBQUNmLFdBQVc7QUFDWCxVQUFVO0FBQ1YsWUFBWSxJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdDLFlBQVksSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRjtBQUNBLFlBQVksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNO0FBQ25DLGNBQWMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJQSxJQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMxRSxjQUFjLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSUMsSUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN2RSxjQUFjLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSUQsSUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDeEUsYUFBYSxDQUFDLENBQUM7QUFDZixXQUFXO0FBQ1gsUUFBUSxNQUFNO0FBQ2QsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxHQUFHLENBQUM7QUFDZixHQUFHO0FBQ0g7QUFDQSxFQUFFLHVCQUF1QixHQUFHO0FBQzVCLElBQUksSUFBSSxTQUFTLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDMUQsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDZCxJQUFJLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUNqQztBQUNBLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2xCLE1BQU0sSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDaEM7QUFDQSxNQUFNLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLE1BQU0sU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsTUFBTSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QjtBQUNBLE1BQU0sU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsTUFBTSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QjtBQUNBLE1BQU0sU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsTUFBTSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QixNQUFNLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFD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LENBQUMsQ0FBQyxDQUFDO0FBQ2xFO0FBQ0E7QUFDQSxJQUFJLElBQUksSUFBSSxHQUFHLElBQUlBLElBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN6RCxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3BDO0FBQ0EsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QixJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDO0FBQ0E7QUFDQSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTTtBQUM1QixNQUFNLElBQUksVUFBVSxHQUFHLElBQUlBLElBQVEsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUMzRTtBQUNBLE1BQU0sTUFBTSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLE1BQU0sTUFBTSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ25DO0FBQ0EsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUMsS0FBSyxDQUFDO0FBQ047QUFDQSxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQzdCLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxRQUFRLEdBQUdHLElB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Q0FBQztBQUM1RSxHQUFHO0FBQ0g7QUFDQSxFQUFFLEtBQUssR0FBRztBQUNWLEdBQUc7QUFDSDtBQUNBLEVBQUUsR0FBRyxHQUFHO0FBQ1I7QUFDQSxJQUFJLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDckI7QUFDQSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkI7QUFDQSxJQUFJLElBQUksVUFBVSxHQUFHLElBQUksWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFDO0FBQ0EsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ2pDLE1BQU0sVUFBVSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckQsS0FBSztBQUNMLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2QyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdkMsSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2QjtBQUNBLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckUsTUFBTSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUMvQyxNQUFNLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ2hEO0FBQ0EsTUFBTSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ25DLFFBQVEsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsT0FBTztBQUNQLE1BQU0sVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQzlDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDM0MsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzNFLE1BQU0sSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNyRCxNQUFNLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDdEQ7QUFDQSxNQUFNLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDbkMsUUFBUSxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxPQUFPO0FBQ1AsTUFBTSxVQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNwRDtBQUNBLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDM0MsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoQyxLQUFLO0FBQ0wsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BDO0FBQ0E7QUFDQSxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUksSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztBQUNoQztBQUNBO0FBQ0EsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzlCLElBQUksY0FBYyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3hHLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN0QztBQUNBLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2hCLEdBQUc7QUFDSDtBQUNBO0FBQ0EsRUFBRSxhQUFhLGFBQWEsQ0FBQyxDQUFDLEVBQUU7QUFDaEMsSUFBSSxPQUFPLENBQUMsQ0FBQztBQUNiLEdBQUc7QUFDSDtBQUNBLEVBQUUsTUFBTSxPQUFPLENBQUMsY0FBYyxFQUFFLEdBQUcsSUFBSSxFQUFFO0FBQ3pDLElBQUksSUFBSSxHQUFHLEdBQUcsTUFBTSxNQUFNLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3hFO0FBQ0EsSUFBSSxHQUFHLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNyQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxTQUFTLEVBQUU7QUFDL0IsTUFBTSxNQUFNLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2pELEtBQUs7QUFDTCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNuQztBQUNBLElBQUksT0FBTyxHQUFHLENBQUM7QUFDZixHQUFHO0FBQ0g7QUFDQSxFQUFFLFdBQVcsQ0FBQyxFQUFFLEVBQUU7QUFDbEIsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDMUIsR0FBRztBQUNIO0FBQ0EsRUFBRSxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUN2QixJQUFJLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEU7QUFDQSxJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMxQixHQUFHO0FBQ0g7QUFDQSxFQUFFLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDM0IsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEQ7QUFDQSxJQUFJLE9BQU8sSUFBSUYsSUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEQsR0FBRztBQUNIO0FBQ0EsRUFBRSxNQUFNLEdBQUcsR0FBRztBQUNkO0FBQ0EsSUFBSSxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3BFLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDdkQ7QUFDQSxJQUFJLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztBQUN0QjtBQUNBLElBQUksTUFBTSxHQUFHLEdBQUcsaUJBQWlCO0FBQ2pDLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUM5QjtBQUNBLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3JCO0FBQ0EsTUFBTSxLQUFLLE1BQU0sRUFBRSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDckMsUUFBUSxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDO0FBQ0EsUUFBUSxNQUFNLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDL0MsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCO0FBQ0EsUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUFFO0FBQ3JDLFVBQVUsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtBQUN4QyxZQUFZLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0IsV0FBVztBQUNYLFVBQVUsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2xDLFNBQVM7QUFDVCxPQUFPO0FBQ1A7QUFDQSxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNuQjtBQUNBLE1BQU0sTUFBTSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDLEtBQUssQ0FBQztBQUNOO0FBQ0EsSUFBSSxNQUFNLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdEMsR0FBRztBQUNILENBQUM7QUFDRDtBQUNBOztBQ3RTTyxNQUFNLE9BQU8sQ0FBQztBQUNyQjtBQUNBLElBQUksT0FBTyxNQUFNLEdBQUc7QUFDcEIsSUFBSSxNQUFNLEVBQUUsR0FBRyxJQUFJQSxJQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNyQyxJQUFJLElBQUksR0FBRyxHQUFHLElBQUlBLElBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJQSxJQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNuRSxJQUFJLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDdEM7QUFDQSxJQUFJLElBQUksTUFBTSxHQUFHO0FBQ2pCLE1BQU0sUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUN2QixRQUFRLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDdkMsT0FBTztBQUNQLEtBQUssQ0FBQztBQUNOO0FBQ0EsSUFBSSxNQUFNLFdBQVcsR0FBRyxTQUFTLEtBQUssRUFBRTtBQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFO0FBQzFDLFFBQVEsT0FBTztBQUNmLE9BQU87QUFDUDtBQUNBLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNwQyxRQUFRLElBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDcEM7QUFDQTtBQUNBLFFBQVEsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNwQyxRQUFRO0FBQ1IsVUFBVSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZJLFVBQVUsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNqRTtBQUNBO0FBQ0EsVUFBVSxPQUFPLEtBQUssS0FBSyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDOUMsUUFBUSxRQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDNUM7QUFDQSxRQUFRLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMvRDtBQUNBO0FBQ0EsUUFBUSxTQUFTLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdEUsUUFBUSxTQUFTLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2xELFFBQVEsU0FBUyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3RFO0FBQ0EsUUFBUSxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoQyxPQUFPO0FBQ1A7QUFDQSxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDcEMsUUFBUSxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzFDLFFBQVEsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUM1QyxRQUFRLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakM7QUFDQSxRQUFRLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzlHLFFBQVEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0IsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQixPQUFPO0FBQ1AsS0FBSyxDQUFDO0FBQ047QUFDQSxJQUFJLE1BQU0sT0FBTyxHQUFHLFNBQVMsS0FBSyxFQUFFO0FBQ3BDLE1BQU0sSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDeEM7QUFDQSxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDNUMsS0FBSyxDQUFDO0FBQ047QUFDQSxJQUFJLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FB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QUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLE1BQU07QUFDbkUsRUFBRSxJQUFJLHFCQUFxQixLQUFLLElBQUksRUFBRTtBQUN0QyxJQUFJLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNuRixHQUFHO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDSDtBQUNBLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBTTtBQUNoRSxFQUFFLElBQUkscUJBQXFCLEtBQUssSUFBSSxFQUFFO0FBQ3RDLElBQUksTUFBTSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JJLEdBQUc7QUFDSCxDQUFDLENBQUMsQ0FBQztBQUNIO0FBQ0EsbUJBQW1CLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxNQUFNO0FBQy9ELEVBQUUsSUFBSSxxQkFBcUIsS0FBSyxJQUFJLEVBQUU7QUFDdEMsSUFBSSxXQUFXLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUN2QyxJQUFJLHFCQUFxQixHQUFHLElBQUksQ0FBQztBQUNqQyxHQUFHO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDSDtBQUNBLHlCQUF5QixDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxNQUFNO0FBQzNFLEVBQUUsSUFBSSwyQkFBMkIsS0FBSyxJQUFJLEVBQUU7QUFDNUMsSUFBSSxpQkFBaUIsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQ25ELElBQUksMkJBQTJCLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLEdBQUc7QUFDSCxDQUFDLENBQUMsQ0FBQztBQUNIO0FBQ0E7QUFDQSxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxNQUFNO0FBQ3JFLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsZUFBZSxDQUFDO0FBQ3pDLENBQUMsQ0FBQyxDQUFDO0FBQ0g7QUFDQTtBQUNBLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNiO0FBQ0E7Ozs7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDI3LDI4LDI5LDMwLDMxLDMyLDMzLDM0LDM1LDM2LDM3LDM4LDM5LDQwXX0=
