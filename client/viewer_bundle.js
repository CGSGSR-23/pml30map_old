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
    if (m2 instanceof Vec3)
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
    if (m2 instanceof Vec2)
      return new Vec2(this.x * m2.x, this.y * m2.y);
    else
      return new Vec2(this.x * m2, this.y * m2);
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
            return data instanceof ArrayBuffer ? new Blob([data]) : data;
        case "arraybuffer":
        default:
            return data; // assuming the data is already an ArrayBuffer
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
function encode$1(num) {
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
    const now = encode$1(+new Date());
    if (now !== prev)
        return seed = 0, prev = now;
    return now + '.' + encode$1(seed++);
}
//
// Map each character to its index.
//
for (; i < length; i++)
    map[alphabet[i]] = i;

// imported from https://github.com/galkn/querystring
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */
function encode(obj) {
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
            this.xs = opts.secure !== isSSL;
        }
        /**
         * XHR supports binary
         */
        const forceBase64 = opts && opts.forceBase64;
        this.supportsBinary = hasXHR2 && !forceBase64;
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
        let query = this.query || {};
        const schema = this.opts.secure ? "https" : "http";
        let port = "";
        // cache busting is forced
        if (false !== this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast();
        }
        if (!this.supportsBinary && !query.sid) {
            query.b64 = 1;
        }
        // avoid port if default for schema
        if (this.opts.port &&
            (("https" === schema && Number(this.opts.port) !== 443) ||
                ("http" === schema && Number(this.opts.port) !== 80))) {
            port = ":" + this.opts.port;
        }
        const encodedQuery = encode(query);
        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (schema +
            "://" +
            (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
            port +
            this.opts.path +
            (encodedQuery.length ? "?" + encodedQuery : ""));
    }
    /**
     * Creates a request.
     *
     * @param {String} method
     * @private
     */
    request(opts = {}) {
        Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
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
        this.async = false !== opts.async;
        this.data = undefined !== opts.data ? opts.data : null;
        this.create();
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @private
     */
    create() {
        const opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
        opts.xdomain = !!this.opts.xd;
        opts.xscheme = !!this.opts.xs;
        const xhr = (this.xhr = new XHR(opts));
        try {
            xhr.open(this.method, this.uri, this.async);
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
            // ie6 check
            if ("withCredentials" in xhr) {
                xhr.withCredentials = this.opts.withCredentials;
            }
            if (this.opts.requestTimeout) {
                xhr.timeout = this.opts.requestTimeout;
            }
            xhr.onreadystatechange = () => {
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
        let query = this.query || {};
        const schema = this.opts.secure ? "wss" : "ws";
        let port = "";
        // avoid port if default for schema
        if (this.opts.port &&
            (("wss" === schema && Number(this.opts.port) !== 443) ||
                ("ws" === schema && Number(this.opts.port) !== 80))) {
            port = ":" + this.opts.port;
        }
        // append timestamp to URI
        if (this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast();
        }
        // communicate binary support capabilities
        if (!this.supportsBinary) {
            query.b64 = 1;
        }
        const encodedQuery = encode(query);
        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (schema +
            "://" +
            (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
            port +
            this.opts.path +
            (encodedQuery.length ? "?" + encodedQuery : ""));
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

const transports = {
    websocket: WS,
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
        this.transports = opts.transports || ["polling", "websocket"];
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
        transport.open();
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
        // emit `error`
        const errorSub = on(socket, "error", (err) => {
            self.cleanup();
            self._readyState = "closed";
            this.emitReserved("error", err);
            if (fn) {
                fn(err);
            }
            else {
                // Only do this if there is no fn to handle the error
                self.maybeReconnectOnOpen();
            }
        });
        if (false !== this._timeout) {
            const timeout = this._timeout;
            if (timeout === 0) {
                openSubDestroy(); // prevents a race condition with the 'open' event
            }
            // set timer
            const timer = this.setTimeoutFn(() => {
                openSubDestroy();
                socket.close();
                // @ts-ignore
                socket.emit("error", new Error("timeout"));
            }, timeout);
            if (this.opts.autoUnref) {
                timer.unref();
            }
            this.subs.push(function subDestroy() {
                clearTimeout(timer);
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
            this.subs.push(function subDestroy() {
                clearTimeout(timer);
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
  async getNearest( pos, floor ) {
    return new URI(await this.send("getNearestReq", pos, floor));
  }
  
  
} /* Connection */

class Rotator {
  // camera unit
  static create() {
    const up = new Vec3(0, 1, 0);
    let radius = 1;

    let camera = {
      loc: new Vec3(30, 30, 30),
      at: new Vec3(0, 0, 0),
      projSize: 1,
      response(system) {
        system.camera.set(camera.loc, camera.at, up);
        system.camera.projSet(1, 100, new Size(camera.projSize, camera.projSize));
      } /* response */
    };

    function moveCursor(delta) {
      let direction = camera.loc.sub(camera.at);

      // turn direction to polar coordinate system
      radius = direction.length();
      let
        azimuth  = Math.sign(direction.z) * Math.acos(direction.x / Math.sqrt(direction.x * direction.x + direction.z * direction.z)),
        elevator = Math.acos(direction.y / direction.length());

      // rotate direction
      azimuth  -= delta.x;
      elevator += delta.y;
      
      elevator = Math.min(Math.max(elevator, 0.01), Math.PI);
      
      // restore direction
      direction.x = radius * Math.sin(elevator) * Math.cos(azimuth);
      direction.y = radius * Math.cos(elevator);
      direction.z = radius * Math.sin(elevator) * Math.sin(azimuth);

      camera.loc = camera.at.add(direction);
    } /* moveCursor */

    const clamp = (number, minBorder, maxBorder) => {
      return Math.min(Math.max(number, minBorder), maxBorder);
    };

    let canvas = document.getElementById("canvas");

    canvas.addEventListener("mousemove", (event) => {
      if ((event.buttons & 1) == 1) { // rotate
        moveCursor((new Vec2(event.movementX, event.movementY)).mul(1.0 / 200.0));
      }
    });

    canvas.addEventListener("wheel", (event) => {
      let delta = event.deltaY / 700.0;

      camera.projSize += camera.projSize * delta;
      camera.projSize = clamp(camera.projSize, 0.1, 1);
    });


    let touchPosition = null;
    canvas.addEventListener("touchstart", (event) => {
      touchPosition = new Vec2(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      );
    });

    canvas.addEventListener("touchmove", (event) => {
      if (touchPosition === null) {
        return;
      }

      let newTouchPosition = new Vec2(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      );

      moveCursor(newTouchPosition.sub(touchPosition).mul(1.0 / 800.0));
      touchPosition = newTouchPosition;
    });

    canvas.addEventListener("touchend", (event) => {
      touchPosition = null;
    });

    return camera;
  } /* create */
} /* Arcball */

/* camera_controller.js */

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

let system = new System();
let server = new Connection();

system.renderParams.depthTest = false;
system.renderParams.cullFace = true;

// camera controller
let skysphere = await system.addUnit(Skysphere.create, "./bin/imgs/lakhta.png");
system.addUnit(Rotator.create);

let arrowPrim = await system.createEmptyPrimitive(4, Topology.TRIANGLE_FAN, await system.createMaterial("./shaders/arrow"));
let arrowUniqueID = 0;
let arrows = [];

async function createArrow(direction) {
  let transform = Mat4.rotateY(-Math.atan2(direction.z, direction.x));

  let arrow = await system.addUnit(() => {
    return {
      type: "arrow",
      name: `arrow#${arrowUniqueID++}`,
      direction: (new Vec2(direction.x, direction.z)).normalize(),
      response(system) {
        system.drawMarkerPrimitive(arrowPrim, transform);
      } /* response */
    }
  });

  arrows.push(arrow);

  return arrow;
} /* createArrow */

function clearArrows() {
  for (let arrow of arrows) {
    arrow.doSuicide = true;
  }

  arrows = [];
} /* clearArrows */

let currentNodeName = document.getElementById("currentNodeName");
//let skysphereRotation = document.getElementById("skysphereRotation");

const skysphereFolderPath = "./bin/imgs/";

let currentNode = null;
let neighbours = [];
async function setCurrentNode(nodeURI) {

  currentNode = await server.getNode(nodeURI);

  currentNode.position = Vec3.fromObject(currentNode.position);
  currentNodeName.innerText = currentNode.name;

  clearArrows();

  // wait then new node enviroment is loaded

  //skysphereRotation.value = currentNode.skysphere.rotation / (Math.PI * 2) * 314;
  await Promise.all([
    skysphere.slide(skysphereFolderPath + currentNode.skysphere.path, currentNode.skysphere.rotation),

    new Promise(async (resolve) => {
      let neighbourURIs = await server.getNeighbours(nodeURI);
      // delete old neighbours...
      for (let neighbour of neighbours) {
        neighbour.doSuicide = true; // SPb
      }

      // get new neighbours
      neighbours = [];
      for (let neighbourURI of neighbourURIs) {
        let neighbour = await server.getNode(neighbourURI);
        neighbour.position = Vec3.fromObject(neighbour.position); // update vec3
        neighbour.uri = neighbourURI;
        
        neighbours.push(neighbour);
      }

      resolve();
    })
  ]);

  // add arrows
  for (let neighbour of Object.values(neighbours)) {
    let arrow = await createArrow(neighbour.position.sub(currentNode.position).normalize());
    arrow.target = neighbour;
  }
} /* setCurrentNode */

// startup
setCurrentNode(await server.getDefNodeURI());

system.canvas.addEventListener("click", (event) => {
  let unit = system.getUnitByCoord(event.clientX, event.clientY);

  // go to next node if current node is arrow
  if (unit.type === "arrow") {
    setCurrentNode(unit.target.uri);
  }
}); /* event system.canvas:"click" */

// return to editor
document.getElementById("toEditor").addEventListener("click", () => {
  window.location.href = "./editor.html" + window.location.search;
}); /* event document.getElementById("toEditor"):"click" */

//skysphereRotation.addEventListener("input", (event) => {
//  let angle = skysphereRotation.value / 314 * Math.PI * 2;
//
//  skysphere.rotation = angle;
//  server.updateNode(currentNodeURI, {
//    skysphere: {
//      rotation: angle,
//      path: currentNode.skysphere.path,
//    }
//  });
//}); /* event skysphereRotation:"input" */

document.addEventListener("keydown", async (event) => {
  let direction = (new Vec2(system.camera.dir.x, system.camera.dir.z)).normalize();

  switch (event.key) {
    case "ArrowUp":
      break;

    case "ArrowDown":
      direction = direction.neg();
      break;

    case "ArrowLeft":
      direction = direction.right();
      break;

    case "ArrowRight":
      direction = direction.left();
      break;

    default:
      return;
  }

  let maxArrow = null, maxArrowCoefficent = Math.SQRT1_2;
  for (let arrow of arrows) {
    let coefficent = arrow.direction.dot(direction);

    if (coefficent > maxArrowCoefficent) {
      maxArrow = arrow;
      maxArrowCoefficent = coefficent;
    }
  }

  if (maxArrow !== null) {
    await setCurrentNode(maxArrow.target.uri);
  }
}); /* event document:"keydown" */


var mapCanvas = document.getElementById('minimapCanvas');
mapCanvas.width = mapCanvas.height = 200;
var mapContext = mapCanvas.getContext('2d');

function loadImg( fileName ) {
  var img = new Image();
  img.src = "./bin/imgs/" + fileName;
  return new Promise( async (resolve) => {
    img.onload = ()=>{ resolve(img); };
  });
}

var floorsMaps = [];

function setActive( button, newValue ) {
  button.className = button.className.replace(" active", "");

  if (newValue == 1)
  {
    button.className += " active";
  }
}

function onFloorchange( newCurFloor ) {
  console.log("NEW ACTIVE FLOOR: " + newCurFloor);
}

var floorButtons = [];
var curFloor = 0;
for (let i = -1; i <= 4; i++)
{
  let floor = document.getElementById("floor" + i);
  
  if (floor == undefined)
  {
    console.log("FUCK YOU, FLOOR " + i);
    continue;
  }
  floor.onclick = ()=>{
    if (curFloor !== undefined)
      setActive(floorButtons[curFloor], 0);
    setActive(floor, 1);
    onFloorchange(i);
    curFloor = i;
  };

  floorsMaps[i] = await loadImg(`minimap/f${i}.png`);
  
  floorButtons[i] = floor;
}
//console.log(floorsMaps);
//console.log(minimapF1);
setActive(floorButtons[curFloor], 1);

var miniMapScale = .2;
var miniMapOffset = new Vec2(0, 0);
var centerPos = new Vec2(710, 340);
var mapPos1 = new Vec2(11.5, 16.5);
var minimapPos1 = new Vec2(floorsMaps[0].width - centerPos.x, floorsMaps[0].height - centerPos.y);
var mapCoef = mapPos1.length() / minimapPos1.length();


mapCanvas.onwheel = (e)=>{
  
  let coef = Math.pow(0.95, e.deltaY / 100);
  console.log(e);
  let mousePos = new Vec2(e.offsetX, e.offsetY);

  miniMapOffset = mousePos.sub(mousePos.sub(miniMapOffset).mul(coef));

  miniMapScale *= coef;

  console.log(miniMapOffset);
  console.log(miniMapScale);
};

mapCanvas.oncontextmenu = ( e )=>{
  e.preventDefault();
};
mapCanvas.onmousemove = ( e )=>{
  if (e.buttons & 2) // Drag
    miniMapOffset = miniMapOffset.add(new Vec2(e.movementX, e.movementY));   
};

mapCanvas.onclick = async ( e )=>{
  if (curFloor === undefined)
    return;
    
  let mPos = new Vec2(e.offsetX, e.offsetY).sub(miniMapOffset).mul(1 / miniMapScale);

  let pos = mPos.sub(centerPos).mul(mapCoef);

  let nearestURI = await server.getNearest(new Vec3(pos.x, 0, pos.y), curFloor);
  console.log(nearestURI);
  
  await setCurrentNode(nearestURI);
  //await setCurrentNode();
};

window.setInterval(()=>{
  // Render
  mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  
  if (curFloor === undefined)
    return;

  mapContext.drawImage(floorsMaps[curFloor], miniMapOffset.x, miniMapOffset.y, floorsMaps[curFloor].width * miniMapScale, floorsMaps[curFloor].height * miniMapScale);
}, 10);

system.run();

/* viewer_main.js */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyX2J1bmRsZS5qcyIsInNvdXJjZXMiOlsic3JjL3N5c3RlbS9zaGFkZXIuanMiLCJzcmMvc3lzdGVtL210aC5qcyIsInNyYy9zeXN0ZW0vdGV4dHVyZS5qcyIsInNyYy9zeXN0ZW0vdWJvLmpzIiwic3JjL3N5c3RlbS9tYXRlcmlhbC5qcyIsInNyYy9zeXN0ZW0vcHJpbWl0aXZlLmpzIiwic3JjL3N5c3RlbS90YXJnZXQuanMiLCJzcmMvc3lzdGVtL3RpbWVyLmpzIiwic3JjL3N5c3RlbS9zeXN0ZW0uanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLXBhcnNlci9idWlsZC9lc20vY29tbW9ucy5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9lbmNvZGVQYWNrZXQuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9jb250cmliL2Jhc2U2NC1hcnJheWJ1ZmZlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9kZWNvZGVQYWNrZXQuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9Ac29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9nbG9iYWxUaGlzLmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdXRpbC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnQuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi95ZWFzdC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9jb250cmliL3BhcnNlcXMuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9oYXMtY29ycy5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3htbGh0dHByZXF1ZXN0LmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy9wb2xsaW5nLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvd2Vic29ja2V0LWNvbnN0cnVjdG9yLmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy93ZWJzb2NrZXQuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9jb250cmliL3BhcnNldXJpLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3NvY2tldC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS91cmwuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLXBhcnNlci9idWlsZC9lc20vaXMtYmluYXJ5LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1wYXJzZXIvYnVpbGQvZXNtL2JpbmFyeS5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tcGFyc2VyL2J1aWxkL2VzbS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9vbi5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9zb2NrZXQuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9iYWNrbzIuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vbWFuYWdlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9pbmRleC5qcyIsInNyYy9ub2Rlcy5qcyIsInNyYy9jYW1lcmFfY29udHJvbGxlci5qcyIsInNyYy9za3lzcGhlcmUuanMiLCJzcmMvdmlld2VyX21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gc2hhZGVyTW9kdWxlRnJvbVNvdXJjZShnbCwgdHlwZSwgc291cmNlKSB7XHJcbiAgaWYgKHNvdXJjZSA9PSBudWxsKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIGxldCBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSk7XHJcblxyXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XHJcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG5cclxuICBsZXQgcmVzID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xyXG4gIGlmIChyZXMgIT0gbnVsbCAmJiByZXMubGVuZ3RoID4gMClcclxuICAgIGNvbnNvbGUuZXJyb3IoYFNoYWRlciBtb2R1bGUgY29tcGlsYXRpb24gZXJyb3I6ICR7cmVzfWApO1xyXG5cclxuICByZXR1cm4gc2hhZGVyO1xyXG59IC8qIHNoYWRlck1vZHVsZUZyb21Tb3VyY2UgKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaGFkZXJGcm9tU291cmNlKGdsLCB2ZXJ0U291cmNlLCBmcmFnU291cmNlKSB7XHJcbiAgbGV0IG1vZHVsZXMgPSBbXHJcbiAgICBzaGFkZXJNb2R1bGVGcm9tU291cmNlKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2ZXJ0U291cmNlKSxcclxuICAgIHNoYWRlck1vZHVsZUZyb21Tb3VyY2UoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgZnJhZ1NvdXJjZSksXHJcbiAgXTtcclxuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2R1bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAobW9kdWxlc1tpXSAhPSBudWxsKSB7XHJcbiAgICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBtb2R1bGVzW2ldKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xyXG5cclxuICBpZiAoIWdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKVxyXG4gICAgY29uc29sZS5lcnJvcihgU2hhZGVyIGxpbmtpbmcgZXJyb3I6ICR7Z2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSl9YCk7XHJcblxyXG4gIHJldHVybiBwcm9ncmFtO1xyXG59IC8qIHNoYWRlckZyb21Tb3VyY2UgKi9cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkU2hhZGVyKGdsLCBwYXRoKSB7XHJcbiAgcmV0dXJuIHNoYWRlckZyb21Tb3VyY2UoZ2wsXHJcbiAgICBhd2FpdCBmZXRjaChwYXRoICsgXCIudmVydD9cIiArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKSkudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5vayA/IHJlc3BvbnNlLnRleHQoKSA6IG51bGwpLFxyXG4gICAgYXdhaXQgZmV0Y2gocGF0aCArIFwiLmZyYWc/XCIgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkpLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2Uub2sgPyByZXNwb25zZS50ZXh0KCkgOiBudWxsKSxcclxuICApO1xyXG59IC8qIGxvYWRTaGFkZXIgKi8iLCJleHBvcnQgY2xhc3MgVmVjMyB7XHJcbiAgeDtcclxuICB5O1xyXG4gIHo7XHJcblxyXG4gIGNvbnN0cnVjdG9yKG54LCBueSwgbnopIHtcclxuICAgIHRoaXMueCA9IG54O1xyXG4gICAgdGhpcy55ID0gbnk7XHJcbiAgICB0aGlzLnogPSBuejtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIGNvcHkoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzModGhpcy54LCB0aGlzLnksIHRoaXMueik7XHJcbiAgfSAvKiBjb3B5ICovXHJcblxyXG4gIGFkZChtMikge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMzKHRoaXMueCArIG0yLngsIHRoaXMueSArIG0yLnksIHRoaXMueiArIG0yLnopO1xyXG4gIH0gLyogYWRkICovXHJcblxyXG4gIHN1YihtMikge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMzKHRoaXMueCAtIG0yLngsIHRoaXMueSAtIG0yLnksIHRoaXMueiAtIG0yLnopO1xyXG4gIH0gLyogc3ViICovXHJcblxyXG4gIG11bChtMikge1xyXG4gICAgaWYgKG0yIGluc3RhbmNlb2YgVmVjMylcclxuICAgICAgcmV0dXJuIG5ldyBWZWMzKHRoaXMueCAqIG0yLngsIHRoaXMueSAqIG0yLnksIHRoaXMueiAqIG0yLnopO1xyXG4gICAgZWxzZVxyXG4gICAgICByZXR1cm4gbmV3IFZlYzModGhpcy54ICogbTIsICAgdGhpcy55ICogbTIsICAgdGhpcy56ICogbTIgICk7XHJcbiAgfSAvKiBtdWwgKi9cclxuXHJcbiAgbGVuZ3RoKCkge1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkgKyB0aGlzLnogKiB0aGlzLnopO1xyXG4gIH0gLyogbGVuZ3RoICovXHJcblxyXG4gIGRpc3RhbmNlKG0yKSB7XHJcbiAgICBsZXRcclxuICAgICAgZHggPSB0aGlzLnggLSBtMi54LFxyXG4gICAgICBkeSA9IHRoaXMueSAtIG0yLnksXHJcbiAgICAgIGR6ID0gdGhpcy56IC0gbTIuejtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkgKyBkeiAqIGR6KTtcclxuICB9IC8qIGRpc3RhbmNlICovXHJcblxyXG4gIGRvdChtMikge1xyXG4gICAgcmV0dXJuIHRoaXMueCAqIG0yLnggKyB0aGlzLnkgKiBtMi55ICsgdGhpcy56ICogbTIuejtcclxuICB9IC8qIGRvdCAqL1xyXG5cclxuICBjcm9zcyhvdGh2KSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzMoXHJcbiAgICAgIHRoaXMueSAqIG90aHYueiAtIG90aHYueSAqIHRoaXMueixcclxuICAgICAgdGhpcy56ICogb3Rodi54IC0gb3Rodi56ICogdGhpcy54LFxyXG4gICAgICB0aGlzLnggKiBvdGh2LnkgLSBvdGh2LnggKiB0aGlzLnlcclxuICAgICk7XHJcbiAgfSAvKiBjcm9zcyAqL1xyXG5cclxuICBub3JtYWxpemUoKSB7XHJcbiAgICBsZXQgbGVuID0gdGhpcy5sZW5ndGgoKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFZlYzModGhpcy54IC8gbGVuLCB0aGlzLnkgLyBsZW4sIHRoaXMueiAvIGxlbik7XHJcbiAgfSAvKiBub3JtYWxpemUgKi9cclxuXHJcbiAgc3RhdGljIGZyb21TcGhlcmljYWwoYXppbXV0aCwgZWxldmF0aW9uLCByYWRpdXMgPSAxKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzMoXHJcbiAgICAgIHJhZGl1cyAqIE1hdGguc2luKGVsZXZhdGlvbikgKiBNYXRoLmNvcyhhemltdXRoKSxcclxuICAgICAgcmFkaXVzICogTWF0aC5jb3MoZWxldmF0aW9uKSxcclxuICAgICAgcmFkaXVzICogTWF0aC5zaW4oZWxldmF0aW9uKSAqIE1hdGguc2luKGF6aW11dGgpXHJcbiAgICApO1xyXG4gIH0gLyogc3BoZXJpY2FsVG9DYXJ0ZXNpYW4gKi9cclxuXHJcbiAgc3RhdGljIGZyb21PYmplY3Qob2JqZWN0KSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzMob2JqZWN0LngsIG9iamVjdC55LCBvYmplY3Queik7XHJcbiAgfSAvKiBmcm9tT2JqZWN0ICovXHJcbn0gLyogVmVjMyAqL1xyXG5cclxuZXhwb3J0IGNsYXNzIFZlYzIge1xyXG4gIHg7XHJcbiAgeTtcclxuXHJcbiAgY29uc3RydWN0b3IobngsIG55KSB7XHJcbiAgICB0aGlzLnggPSBueDtcclxuICAgIHRoaXMueSA9IG55O1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgY29weSgpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMigpO1xyXG4gIH1cclxuXHJcbiAgYWRkKG0yKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54ICsgbTIueCwgdGhpcy55ICsgbTIueSk7XHJcbiAgfSAvKiBhZGQgKi9cclxuXHJcbiAgc3ViKG0yKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54IC0gbTIueCwgdGhpcy55IC0gbTIueSk7XHJcbiAgfSAvKiBzdWIgKi9cclxuXHJcbiAgbXVsKG0yKSB7XHJcbiAgICBpZiAobTIgaW5zdGFuY2VvZiBWZWMyKVxyXG4gICAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54ICogbTIueCwgdGhpcy55ICogbTIueSk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKiBtMiwgdGhpcy55ICogbTIpO1xyXG4gIH0gLyogbXVsICovXHJcblxyXG4gIGxlbmd0aDIoKSB7XHJcbiAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpczt5XHJcbiAgfSAvKiBsZW5ndGgyICovXHJcblxyXG4gIGxlbmd0aCgpIHtcclxuICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcclxuICB9IC8qIGxlbmd0aCAqL1xyXG5cclxuICBkb3QobTIpIHtcclxuICAgIHJldHVybiB0aGlzLnggKiBtMi54ICsgdGhpcy55ICogbTIueTtcclxuICB9IC8qIGRvdCAqL1xyXG5cclxuICBjcm9zcyhvdGh2KSB7XHJcbiAgICByZXR1cm4gdGhpcy54ICogb3Rodi55IC0gb3Rodi54ICogdGhpcy55O1xyXG4gIH0gLyogY3Jvc3MgKi9cclxuXHJcbiAgbm9ybWFsaXplKCkge1xyXG4gICAgbGV0IGxlbiA9IHRoaXMubGVuZ3RoKCk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCAvIGxlbiwgdGhpcy55IC8gbGVuKTtcclxuICB9IC8qIG5vcm1hbGl6ZSAqL1xyXG5cclxuICBuZWcoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzIoLXRoaXMueCwgLXRoaXMueSk7XHJcbiAgfSAvKiBuZWcgKi9cclxuXHJcbiAgbGVmdCgpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMigtdGhpcy55LCB0aGlzLngpO1xyXG4gIH0gLyogcmlnaHQgKi9cclxuXHJcbiAgcmlnaHQoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy55LCAtdGhpcy54KTtcclxuICB9IC8qIHJpZ2h0ICovXHJcbn0gLyogVmVjMiAqL1xyXG5cclxuZXhwb3J0IGNsYXNzIFNpemUge1xyXG4gIHc7XHJcbiAgaDtcclxuXHJcbiAgY29uc3RydWN0b3IodywgaCkge1xyXG4gICAgdGhpcy53ID0gdztcclxuICAgIHRoaXMuaCA9IGg7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBjb3B5KCkge1xyXG4gICAgcmV0dXJuIG5ldyBTaXplKHRoaXMudywgdGhpcy5oKTtcclxuICB9IC8qIGNvcHkgKi9cclxufSAvKiBTaXplICovXHJcblxyXG5leHBvcnQgY2xhc3MgTWF0NCB7XHJcbiAgbTtcclxuXHJcbiAgY29uc3RydWN0b3IodjAwLCB2MDEsIHYwMiwgdjAzLFxyXG4gICAgICAgICAgICAgIHYxMCwgdjExLCB2MTIsIHYxMyxcclxuICAgICAgICAgICAgICB2MjAsIHYyMSwgdjIyLCB2MjMsXHJcbiAgICAgICAgICAgICAgdjMwLCB2MzEsIHYzMiwgdjMzKSB7XHJcbiAgICB0aGlzLm0gPSBbXHJcbiAgICAgIHYwMCwgdjAxLCB2MDIsIHYwMyxcclxuICAgICAgdjEwLCB2MTEsIHYxMiwgdjEzLFxyXG4gICAgICB2MjAsIHYyMSwgdjIyLCB2MjMsXHJcbiAgICAgIHYzMCwgdjMxLCB2MzIsIHYzM1xyXG4gICAgXTtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIGNvcHkoKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHRoaXMubVsgMF0sIHRoaXMubVsgMV0sIHRoaXMubVsgMl0sIHRoaXMubVsgM10sXHJcbiAgICAgIHRoaXMubVsgNF0sIHRoaXMubVsgNV0sIHRoaXMubVsgNl0sIHRoaXMubVsgN10sXHJcbiAgICAgIHRoaXMubVsgOF0sIHRoaXMubVsgOV0sIHRoaXMubVsxMF0sIHRoaXMubVsxMV0sXHJcbiAgICAgIHRoaXMubVsxMl0sIHRoaXMubVsxM10sIHRoaXMubVsxNF0sIHRoaXMubVsxNV0sXHJcbiAgICApO1xyXG4gIH0gLyogY29weSAqL1xyXG5cclxuICB0cmFuc2Zvcm1Qb2ludCh2KVxyXG4gIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyhcclxuICAgICAgdi54ICogdGhpcy5tWyAwXSArIHYueSAqIHRoaXMubVsgNF0gKyB2LnogKiB0aGlzLm1bIDhdICsgdGhpcy5tWzEyXSxcclxuICAgICAgdi54ICogdGhpcy5tWyAxXSArIHYueSAqIHRoaXMubVsgNV0gKyB2LnogKiB0aGlzLm1bIDldICsgdGhpcy5tWzEzXSxcclxuICAgICAgdi54ICogdGhpcy5tWyAyXSArIHYueSAqIHRoaXMubVsgNl0gKyB2LnogKiB0aGlzLm1bMTBdICsgdGhpcy5tWzE0XVxyXG4gICAgKTtcclxuICB9IC8qIHRyYW5zZm9ybVBvaW50ICovXHJcblxyXG4gIHRyYW5zZm9ybTR4NCh2KVxyXG4gIHtcclxuICAgIGxldCB3ID0gdi54ICogdGhpcy5tWzNdICsgdi55ICogdGhpcy5tWzddICsgdi56ICogdGhpcy5tWzExXSArIHRoaXMubVsxNV07XHJcbiAgXHJcbiAgICByZXR1cm4gbmV3IFZlYzMoXHJcbiAgICAgICh2LnggKiB0aGlzLm1bIDBdICsgdi55ICogdGhpcy5tWyA0XSArIHYueiAqIHRoaXMubVsgOF0gKyB0aGlzLm1bMTJdKSAvIHcsXHJcbiAgICAgICh2LnggKiB0aGlzLm1bIDFdICsgdi55ICogdGhpcy5tWyA1XSArIHYueiAqIHRoaXMubVsgOV0gKyB0aGlzLm1bMTNdKSAvIHcsXHJcbiAgICAgICh2LnggKiB0aGlzLm1bIDJdICsgdi55ICogdGhpcy5tWyA2XSArIHYueiAqIHRoaXMubVsxMF0gKyB0aGlzLm1bMTRdKSAvIHdcclxuICAgICk7XHJcbiAgfSAvKiB0cmFuc2Zvcm00eDQgKi9cclxuXHJcbiAgdHJhbnNwb3NlKCkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICB0aGlzLm1bIDBdLCB0aGlzLm1bIDRdLCB0aGlzLm1bIDhdLCB0aGlzLm1bMTJdLFxyXG4gICAgICB0aGlzLm1bIDFdLCB0aGlzLm1bIDVdLCB0aGlzLm1bIDldLCB0aGlzLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bIDJdLCB0aGlzLm1bIDZdLCB0aGlzLm1bMTBdLCB0aGlzLm1bMTRdLFxyXG4gICAgICB0aGlzLm1bIDNdLCB0aGlzLm1bIDddLCB0aGlzLm1bMTFdLCB0aGlzLm1bMTVdXHJcbiAgICApO1xyXG4gIH0gLyogdHJhbnNwb3NlICovXHJcblxyXG4gIG11bChtMikge1xyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICB0aGlzLm1bIDBdICogbTIubVsgMF0gKyB0aGlzLm1bIDFdICogbTIubVsgNF0gKyB0aGlzLm1bIDJdICogbTIubVsgOF0gKyB0aGlzLm1bIDNdICogbTIubVsxMl0sXHJcbiAgICAgIHRoaXMubVsgMF0gKiBtMi5tWyAxXSArIHRoaXMubVsgMV0gKiBtMi5tWyA1XSArIHRoaXMubVsgMl0gKiBtMi5tWyA5XSArIHRoaXMubVsgM10gKiBtMi5tWzEzXSxcclxuICAgICAgdGhpcy5tWyAwXSAqIG0yLm1bIDJdICsgdGhpcy5tWyAxXSAqIG0yLm1bIDZdICsgdGhpcy5tWyAyXSAqIG0yLm1bMTBdICsgdGhpcy5tWyAzXSAqIG0yLm1bMTRdLFxyXG4gICAgICB0aGlzLm1bIDBdICogbTIubVsgM10gKyB0aGlzLm1bIDFdICogbTIubVsgN10gKyB0aGlzLm1bIDJdICogbTIubVsxMV0gKyB0aGlzLm1bIDNdICogbTIubVsxNV0sXHJcblxyXG4gICAgICB0aGlzLm1bIDRdICogbTIubVsgMF0gKyB0aGlzLm1bIDVdICogbTIubVsgNF0gKyB0aGlzLm1bIDZdICogbTIubVsgOF0gKyB0aGlzLm1bIDddICogbTIubVsxMl0sXHJcbiAgICAgIHRoaXMubVsgNF0gKiBtMi5tWyAxXSArIHRoaXMubVsgNV0gKiBtMi5tWyA1XSArIHRoaXMubVsgNl0gKiBtMi5tWyA5XSArIHRoaXMubVsgN10gKiBtMi5tWzEzXSxcclxuICAgICAgdGhpcy5tWyA0XSAqIG0yLm1bIDJdICsgdGhpcy5tWyA1XSAqIG0yLm1bIDZdICsgdGhpcy5tWyA2XSAqIG0yLm1bMTBdICsgdGhpcy5tWyA3XSAqIG0yLm1bMTRdLFxyXG4gICAgICB0aGlzLm1bIDRdICogbTIubVsgM10gKyB0aGlzLm1bIDVdICogbTIubVsgN10gKyB0aGlzLm1bIDZdICogbTIubVsxMV0gKyB0aGlzLm1bIDddICogbTIubVsxNV0sXHJcblxyXG4gICAgICB0aGlzLm1bIDhdICogbTIubVsgMF0gKyB0aGlzLm1bIDldICogbTIubVsgNF0gKyB0aGlzLm1bMTBdICogbTIubVsgOF0gKyB0aGlzLm1bMTFdICogbTIubVsxMl0sXHJcbiAgICAgIHRoaXMubVsgOF0gKiBtMi5tWyAxXSArIHRoaXMubVsgOV0gKiBtMi5tWyA1XSArIHRoaXMubVsxMF0gKiBtMi5tWyA5XSArIHRoaXMubVsxMV0gKiBtMi5tWzEzXSxcclxuICAgICAgdGhpcy5tWyA4XSAqIG0yLm1bIDJdICsgdGhpcy5tWyA5XSAqIG0yLm1bIDZdICsgdGhpcy5tWzEwXSAqIG0yLm1bMTBdICsgdGhpcy5tWzExXSAqIG0yLm1bMTRdLFxyXG4gICAgICB0aGlzLm1bIDhdICogbTIubVsgM10gKyB0aGlzLm1bIDldICogbTIubVsgN10gKyB0aGlzLm1bMTBdICogbTIubVsxMV0gKyB0aGlzLm1bMTFdICogbTIubVsxNV0sXHJcblxyXG4gICAgICB0aGlzLm1bMTJdICogbTIubVsgMF0gKyB0aGlzLm1bMTNdICogbTIubVsgNF0gKyB0aGlzLm1bMTRdICogbTIubVsgOF0gKyB0aGlzLm1bMTVdICogbTIubVsxMl0sXHJcbiAgICAgIHRoaXMubVsxMl0gKiBtMi5tWyAxXSArIHRoaXMubVsxM10gKiBtMi5tWyA1XSArIHRoaXMubVsxNF0gKiBtMi5tWyA5XSArIHRoaXMubVsxNV0gKiBtMi5tWzEzXSxcclxuICAgICAgdGhpcy5tWzEyXSAqIG0yLm1bIDJdICsgdGhpcy5tWzEzXSAqIG0yLm1bIDZdICsgdGhpcy5tWzE0XSAqIG0yLm1bMTBdICsgdGhpcy5tWzE1XSAqIG0yLm1bMTRdLFxyXG4gICAgICB0aGlzLm1bMTJdICogbTIubVsgM10gKyB0aGlzLm1bMTNdICogbTIubVsgN10gKyB0aGlzLm1bMTRdICogbTIubVsxMV0gKyB0aGlzLm1bMTVdICogbTIubVsxNV0sXHJcbiAgICApO1xyXG4gIH0gLyogbXVsICovXHJcblxyXG4gIHN0YXRpYyBpZGVudGl0eSgpIHtcclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgMSwgMCwgMCwgMCxcclxuICAgICAgMCwgMSwgMCwgMCxcclxuICAgICAgMCwgMCwgMSwgMCxcclxuICAgICAgMCwgMCwgMCwgMVxyXG4gICAgKTtcclxuICB9IC8qIGlkZW50aXR5ICovXHJcblxyXG4gIHN0YXRpYyBzY2FsZShzKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHMueCwgMCwgICAwLCAgIDAsXHJcbiAgICAgIDAsICAgcy55LCAwLCAgIDAsXHJcbiAgICAgIDAsICAgMCwgICBzLnosIDAsXHJcbiAgICAgIDAsICAgMCwgICAwLCAgIDFcclxuICAgICk7XHJcbiAgfSAvKiBzY2FsZSAqL1xyXG5cclxuICBzdGF0aWMgdHJhbnNsYXRlKHQpIHtcclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgMSwgICAwLCAgIDAsICAgMCxcclxuICAgICAgMCwgICAxLCAgIDAsICAgMCxcclxuICAgICAgMCwgICAwLCAgIDEsICAgMCxcclxuICAgICAgdC54LCB0LnksIHQueiwgMVxyXG4gICAgKTtcclxuICB9IC8qIHRyYW5zbGF0ZSAqL1xyXG5cclxuICBzdGF0aWMgcm90YXRlWChhbmdsZSkge1xyXG4gICAgbGV0IHMgPSBNYXRoLnNpbihhbmdsZSksIGMgPSBNYXRoLmNvcyhhbmdsZSk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICAxLCAwLCAwLCAwLFxyXG4gICAgICAwLCBjLCBzLCAwLFxyXG4gICAgICAwLC1zLCBjLCAwLFxyXG4gICAgICAwLCAwLCAwLCAxXHJcbiAgICApO1xyXG4gIH0gLyogcm90YXRlWCAqL1xyXG5cclxuICBzdGF0aWMgcm90YXRlWShhbmdsZSkge1xyXG4gICAgbGV0IHMgPSBNYXRoLnNpbihhbmdsZSksIGMgPSBNYXRoLmNvcyhhbmdsZSk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICBjLCAwLC1zLCAwLFxyXG4gICAgICAwLCAxLCAwLCAwLFxyXG4gICAgICBzLCAwLCBjLCAwLFxyXG4gICAgICAwLCAwLCAwLCAxXHJcbiAgICApO1xyXG4gIH0gLyogcm90YXRlWSAqL1xyXG5cclxuICBzdGF0aWMgcm90YXRlWihhbmdsZSkge1xyXG4gICAgbGV0IHMgPSBNYXRoLnNpbihhbmdsZSksIGMgPSBNYXRoLmNvcyhhbmdsZSk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICBjLCBzLCAwLCAwLFxyXG4gICAgIC1zLCBjLCAwLCAwLFxyXG4gICAgICAwLCAwLCAxLCAwLFxyXG4gICAgICAwLCAwLCAwLCAxXHJcbiAgICApO1xyXG4gIH0gLyogcm90YXRlWiAqL1xyXG5cclxuICBzdGF0aWMgcm90YXRlKGFuZ2xlLCBheGlzKSB7XHJcbiAgICBsZXQgdiA9IGF4aXMubm9ybWFsaXplKCk7XHJcbiAgICBsZXQgcyA9IE1hdGguc2luKGFuZ2xlKSwgYyA9IE1hdGguY29zKGFuZ2xlKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHYueCAqIHYueCAqICgxIC0gYykgKyBjLCAgICAgICAgIHYueCAqIHYueSAqICgxIC0gYykgLSB2LnogKiBzLCAgIHYueCAqIHYueiAqICgxIC0gYykgKyB2LnkgKiBzLCAgIDAsXHJcbiAgICAgIHYueSAqIHYueCAqICgxIC0gYykgKyB2LnogKiBzLCAgIHYueSAqIHYueSAqICgxIC0gYykgKyBjLCAgICAgICAgIHYueSAqIHYueiAqICgxIC0gYykgLSB2LnggKiBzLCAgIDAsXHJcbiAgICAgIHYueiAqIHYueCAqICgxIC0gYykgLSB2LnkgKiBzLCAgIHYueiAqIHYueSAqICgxIC0gYykgKyB2LnggKiBzLCAgIHYueiAqIHYueiAqICgxIC0gYykgKyBjLCAgICAgICAgIDAsXHJcbiAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDFcclxuICAgICk7XHJcbiAgfSAvKiByb3RhdGUgKi9cclxuXHJcbiAgc3RhdGljIHZpZXcobG9jLCBhdCwgdXApIHtcclxuICAgIGxldFxyXG4gICAgICBkaXIgPSBhdC5zdWIobG9jKS5ub3JtYWxpemUoKSxcclxuICAgICAgcmdoID0gZGlyLmNyb3NzKHVwKS5ub3JtYWxpemUoKSxcclxuICAgICAgdHVwID0gcmdoLmNyb3NzKGRpcik7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICByZ2gueCwgICAgICAgICB0dXAueCwgICAgICAgICAtZGlyLngsICAgICAgIDAsXHJcbiAgICAgIHJnaC55LCAgICAgICAgIHR1cC55LCAgICAgICAgIC1kaXIueSwgICAgICAgMCxcclxuICAgICAgcmdoLnosICAgICAgICAgdHVwLnosICAgICAgICAgLWRpci56LCAgICAgICAwLFxyXG4gICAgICAtbG9jLmRvdChyZ2gpLCAtbG9jLmRvdCh0dXApLCBsb2MuZG90KGRpciksIDFcclxuICAgICk7XHJcbiAgfSAvKiB2aWV3ICovXHJcblxyXG4gIHN0YXRpYyBmcnVzdHVtKGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIDIgKiBuZWFyIC8gKHJpZ2h0IC0gbGVmdCksICAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCxcclxuICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMiAqIG5lYXIgLyAodG9wIC0gYm90dG9tKSwgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLFxyXG4gICAgICAocmlnaHQgKyBsZWZ0KSAvIChyaWdodCAtIGxlZnQpLCAodG9wICsgYm90dG9tKSAvICh0b3AgLSBib3R0b20pLCAobmVhciArIGZhcikgLyAobmVhciAtIGZhciksICAgLTEsXHJcbiAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIgKiBuZWFyICogZmFyIC8gKG5lYXIgLSBmYXIpLCAgMFxyXG4gICAgKTtcclxuICB9IC8qIGZydXN0dW0gKi9cclxufSAvKiBNYXQ0ICovXHJcblxyXG5leHBvcnQgY2xhc3MgQ2FtZXJhIHtcclxuICAvLyBjYW1lcmEgcHJvamVjdGlvbiBzaGFwZSBwYXJhbXNcclxuICBwcm9qU2l6ZSA9IG5ldyBTaXplKDAuMDEsIDAuMDEpO1xyXG4gIGNvcnJlY3RlZFByb2pTaXplID0gbmV3IFNpemUoMC4wMSwgMC4wMSk7XHJcbiAgbmVhciA9IDAuMDE7XHJcbiAgZmFyID0gODE5MjtcclxuXHJcbiAgLy8gY3VycmVudCBzY3JlZW4gcmVzb2x1dGlvblxyXG4gIHNjcmVlblNpemU7XHJcblxyXG4gIC8vIGNhbWVyYSBsb2NhdGlvblxyXG4gIGxvYztcclxuICBhdDtcclxuICBkaXI7XHJcbiAgdXA7XHJcbiAgcmlnaHQ7XHJcblxyXG4gIC8vIGNhbWVyYSBwcm9qZWN0aW9uIG1hdHJpY2VzXHJcbiAgdmlldztcclxuICBwcm9qO1xyXG4gIHZpZXdQcm9qO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMucHJvaiA9IE1hdDQuaWRlbnRpdHkoKTtcclxuICAgIHRoaXMuc2V0KG5ldyBWZWMzKDAsIDAsIC0xKSwgbmV3IFZlYzMoMCwgMCwgMCksIG5ldyBWZWMzKDAsIDEsIDApKTtcclxuICAgIHRoaXMucmVzaXplKG5ldyBTaXplKDMwLCAzMCkpO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgcHJvalNldChuZXdOZWFyLCBuZXdGYXIsIG5ld1Byb2pTaXplKSB7XHJcbiAgICB0aGlzLnByb2pTaXplID0gbmV3UHJvalNpemUuY29weSgpO1xyXG4gICAgdGhpcy5uZWFyID0gbmV3TmVhcjtcclxuICAgIHRoaXMuZmFyID0gbmV3RmFyO1xyXG4gICAgdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZSA9IHRoaXMucHJvalNpemUuY29weSgpO1xyXG5cclxuICAgIGlmICh0aGlzLnNjcmVlblNpemUudyA+IHRoaXMuc2NyZWVuU2l6ZS5oKSB7XHJcbiAgICAgIHRoaXMuY29ycmVjdGVkUHJvalNpemUudyAqPSB0aGlzLnNjcmVlblNpemUudyAvIHRoaXMuc2NyZWVuU2l6ZS5oO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS5oICo9IHRoaXMuc2NyZWVuU2l6ZS5oIC8gdGhpcy5zY3JlZW5TaXplLnc7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wcm9qID0gTWF0NC5mcnVzdHVtKFxyXG4gICAgICAtdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS53IC8gMiwgdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS53IC8gMixcclxuICAgICAgLXRoaXMuY29ycmVjdGVkUHJvalNpemUuaCAvIDIsIHRoaXMuY29ycmVjdGVkUHJvalNpemUuaCAvIDIsXHJcbiAgICAgIHRoaXMubmVhciwgdGhpcy5mYXJcclxuICAgICk7XHJcbiAgICB0aGlzLnZpZXdQcm9qID0gdGhpcy52aWV3Lm11bCh0aGlzLnByb2opO1xyXG4gIH0gLyogcHJvalNldCAqL1xyXG5cclxuICByZXNpemUobmV3U2NyZWVuU2l6ZSkge1xyXG4gICAgdGhpcy5zY3JlZW5TaXplID0gbmV3U2NyZWVuU2l6ZS5jb3B5KCk7XHJcbiAgICB0aGlzLnByb2pTZXQodGhpcy5uZWFyLCB0aGlzLmZhciwgdGhpcy5wcm9qU2l6ZSk7XHJcbiAgfSAvKiByZXNpemUgKi9cclxuXHJcbiAgc2V0KGxvYywgYXQsIHVwKSB7XHJcbiAgICB0aGlzLnZpZXcgPSBNYXQ0LnZpZXcobG9jLCBhdCwgdXApO1xyXG4gICAgdGhpcy52aWV3UHJvaiA9IHRoaXMudmlldy5tdWwodGhpcy5wcm9qKTtcclxuXHJcbiAgICB0aGlzLmxvYyA9IGxvYy5jb3B5KCk7XHJcbiAgICB0aGlzLmF0ID0gYXQuY29weSgpO1xyXG5cclxuICAgIHRoaXMucmlnaHQgPSBuZXcgVmVjMyh0aGlzLnZpZXcubVsgMF0sIHRoaXMudmlldy5tWyA0XSwgdGhpcy52aWV3Lm1bIDhdKTtcclxuICAgIHRoaXMudXAgICAgPSBuZXcgVmVjMyh0aGlzLnZpZXcubVsgMV0sIHRoaXMudmlldy5tWyA1XSwgdGhpcy52aWV3Lm1bIDldKTtcclxuICAgIHRoaXMuZGlyICAgPSBuZXcgVmVjMyh0aGlzLnZpZXcubVsgMl0sIHRoaXMudmlldy5tWyA2XSwgdGhpcy52aWV3Lm1bMTBdKS5tdWwoLTEpO1xyXG4gIH0gLyogc2V0ICovXHJcbn0gLyogQ2FtZXJhICovIiwiaW1wb3J0ICogYXMgbXRoIGZyb20gXCIuL210aC5qc1wiO1xyXG5cclxuLyogZm9ybWF0IGRlY29kaW5nIGZ1bmN0aW9uICovXHJcbmZ1bmN0aW9uIGdldEZvcm1hdChjb21wb25lbnRUeXBlLCBjb21wb25lbnRDb3VudCkge1xyXG4gIGNvbnN0IGZtdHMgPSBbV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SRUQsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkcsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCLCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlJHQkFdO1xyXG4gIHN3aXRjaCAoY29tcG9uZW50VHlwZSkge1xyXG4gICAgY2FzZSBUZXh0dXJlLkZMT0FUOlxyXG4gICAgICBjb25zdCBmbG9hdEludGVybmFscyA9IFtXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlIzMkYsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkczMkYsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCMzJGLCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlJHQkEzMkZdO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1hdDogZm10c1tjb21wb25lbnRDb3VudCAtIDFdLFxyXG4gICAgICAgIGludGVybmFsOiBmbG9hdEludGVybmFsc1tjb21wb25lbnRDb3VudCAtIDFdLFxyXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuRkxPQVQsXHJcbiAgICAgIH07XHJcblxyXG4gICAgY2FzZSBUZXh0dXJlLlVOU0lHTkVEX0JZVEU6XHJcbiAgICAgIGNvbnN0IGJ5dGVJbnRlcm5hbHMgPSBbV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SOCwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SRzgsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCOCwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SR0JBOF07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybWF0OiBmbXRzW2NvbXBvbmVudENvdW50IC0gMV0sXHJcbiAgICAgICAgaW50ZXJuYWw6IGJ5dGVJbnRlcm5hbHNbY29tcG9uZW50Q291bnQgLSAxXSxcclxuICAgICAgICBjb21wb25lbnRUeXBlOiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlVOU0lHTkVEX0JZVEUsXHJcbiAgICAgIH07XHJcblxyXG4gICAgY2FzZSBUZXh0dXJlLkRFUFRIOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1hdDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5ERVBUSF9DT01QT05FTlQsXHJcbiAgICAgICAgaW50ZXJuYWw6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuREVQVEhfQ09NUE9ORU5UMzJGLFxyXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuRkxPQVQsXHJcbiAgICAgIH07XHJcblxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgLy8gbWluaW1hbCBmb3JtYXQgcG9zc2libGVcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBmb3JtYXQ6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkVELFxyXG4gICAgICAgIGludGVybmFsOiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlI4LFxyXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVU5TSUdORURfQllURSxcclxuICAgICAgfTtcclxuICB9XHJcbn0gLyogZ2V0Rm9ybWF0ICovXHJcblxyXG5leHBvcnQgY2xhc3MgVGV4dHVyZSB7XHJcbiAgI2dsO1xyXG4gICNmb3JtYXQ7XHJcbiAgc2l6ZTtcclxuICBpZDtcclxuXHJcbiAgc3RhdGljIEZMT0FUICAgICAgICAgPSAwO1xyXG4gIHN0YXRpYyBVTlNJR05FRF9CWVRFID0gMTtcclxuICBzdGF0aWMgREVQVEggICAgICAgICA9IDI7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGdsLCBjb21wb25lbnRUeXBlID0gVGV4dHVyZS5GTE9BVCwgY29tcG9uZW50Q291bnQgPSAxKSB7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICB0aGlzLnNpemUgPSBuZXcgbXRoLlNpemUoMSwgMSk7XHJcbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCk7XHJcblxyXG4gICAgdGhpcy5mb3JtYXQgPSBnZXRGb3JtYXQoY29tcG9uZW50VHlwZSwgY29tcG9uZW50Q291bnQpO1xyXG4gICAgLy8gcHV0IGVtcHR5IGltYWdlIGRhdGFcclxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQuaW50ZXJuYWwsIDEsIDEsIDAsIHRoaXMuZm9ybWF0LmZvcm1hdCwgdGhpcy5mb3JtYXQuY29tcG9uZW50VHlwZSwgbnVsbCk7XHJcblxyXG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcblxyXG4gICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0FMSUdOTUVOVCwgMSk7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBcclxuICBzdGF0aWMgZGVmYXVsdENoZWNrZXJUZXh0dXJlID0gbnVsbDtcclxuICBzdGF0aWMgZGVmYXVsdENoZWNrZXIoZ2wpIHtcclxuICAgIGlmIChUZXh0dXJlLmRlZmF1bHRDaGVja2VyVGV4dHVyZSA9PT0gbnVsbCkge1xyXG4gICAgICBUZXh0dXJlLmRlZmF1bHRDaGVja2VyVGV4dHVyZSA9IG5ldyBUZXh0dXJlKGdsLCBUZXh0dXJlLlVOU0lHTkVEX0JZVEUsIDQpO1xyXG4gIFxyXG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBUZXh0dXJlLmRlZmF1bHRDaGVja2VyVGV4dHVyZS5pZCk7XHJcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQTgsIDEsIDEsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KFsweDAwLCAweEZGLCAweDAwLCAweEZGXSkpO1xyXG5cclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFRleHR1cmUuZGVmYXVsdENoZWNrZXJUZXh0dXJlO1xyXG4gIH0gLyogZGVmYXVsdENoZWNrZXIgKi9cclxuXHJcbiAgZGVmYXVsdENoZWNrZXIoZGF0YSkge1xyXG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmlkKTtcclxuICAgIHRoaXMuZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCAyLCAyLCAwLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBuZXcgVWludDhBcnJheShbXHJcbiAgICAgIDB4MDAsIDB4RkYsIDB4MDAsIDB4RkYsXHJcbiAgICAgIDB4MDAsIDB4MDAsIDB4MDAsIDB4RkYsXHJcbiAgICAgIDB4MDAsIDB4MDAsIDB4MDAsIDB4RkYsXHJcbiAgICAgIDB4MDAsIDB4RkYsIDB4MDAsIDB4RkYsXHJcbiAgICBdKSk7XHJcbiAgfVxyXG5cclxuICBsb2FkKHBhdGgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGxldCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgICAgaW1hZ2Uuc3JjID0gcGF0aDtcclxuICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4geyBcclxuICAgICAgICB0aGlzLmZyb21JbWFnZShpbWFnZSk7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgfSAvKiBsb2FkICovXHJcblxyXG4gIGZyb21JbWFnZShpbWFnZSkge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICB0aGlzLnNpemUudyA9IGltYWdlLndpZHRoO1xyXG4gICAgdGhpcy5zaXplLmggPSBpbWFnZS5oZWlnaHQ7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmlkKTtcclxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQuaW50ZXJuYWwsIHRoaXMuZm9ybWF0LmZvcm1hdCwgdGhpcy5mb3JtYXQuY29tcG9uZW50VHlwZSwgaW1hZ2UpO1xyXG4gIH0gLyogZnJvbUltYWdlICovXHJcblxyXG4gIGJpbmQocHJvZ3JhbSwgaW5kZXggPSAwKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmlkKTtcclxuXHJcbiAgICBsZXQgbG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgYFRleHR1cmUke2luZGV4fWApO1xyXG4gICAgZ2wudW5pZm9ybTFpKGxvY2F0aW9uLCBpbmRleCk7XHJcbiAgfSAvKiBiaW5kICovXHJcblxyXG4gIHJlc2l6ZShzaXplKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG4gICAgdGhpcy5zaXplID0gc2l6ZS5jb3B5KCk7XHJcblxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdC5pbnRlcm5hbCwgdGhpcy5zaXplLncsIHRoaXMuc2l6ZS5oLCAwLCB0aGlzLmZvcm1hdC5mb3JtYXQsIHRoaXMuZm9ybWF0LmNvbXBvbmVudFR5cGUsIG51bGwpO1xyXG4gIH0gLyogcmVzaXplICovXHJcbn0gLyogVGV4dHVyZSAqL1xyXG5cclxuY29uc3QgZmFjZURlc2NyaXB0aW9ucyA9IFtcclxuICB7dGFyZ2V0OiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCwgdGV4dDogXCIrWFwiLCBwYXRoOiBcInBvc1hcIn0sXHJcbiAge3RhcmdldDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIHRleHQ6IFwiLVhcIiwgcGF0aDogXCJuZWdYXCJ9LFxyXG4gIHt0YXJnZXQ6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCB0ZXh0OiBcIitZXCIsIHBhdGg6IFwicG9zWVwifSxcclxuICB7dGFyZ2V0OiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgdGV4dDogXCItWVwiLCBwYXRoOiBcIm5lZ1lcIn0sXHJcbiAge3RhcmdldDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIHRleHQ6IFwiK1pcIiwgcGF0aDogXCJwb3NaXCJ9LFxyXG4gIHt0YXJnZXQ6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCB0ZXh0OiBcIi1aXCIsIHBhdGg6IFwibmVnWlwifSxcclxuXTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDdWJlbWFwIHtcclxuICAjZ2w7XHJcbiAgaWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGdsKSB7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcblxyXG4gICAgbGV0IGN0eCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIikuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuICAgIGN0eC5jYW52YXMud2lkdGggPSAxMjg7XHJcbiAgICBjdHguY2FudmFzLmhlaWdodCA9IDEyODtcclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3RmFjZSh0ZXh0KSB7XHJcbiAgICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IGN0eC5jYW52YXM7XHJcblxyXG4gICAgICBjdHguZmlsbFN0eWxlID0gJyNDQ0MnO1xyXG4gICAgICBjdHguZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgIGN0eC5mb250ID0gYCR7d2lkdGggKiAwLjV9cHggY29uc29sYXNgO1xyXG4gICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XHJcbiAgICAgIGN0eC50ZXh0QmFzZUxpbmUgPSAnbWlkZGxlJztcclxuICAgICAgY3R4LmZpbGxTdHlsZSA9ICcjMzMzJztcclxuXHJcbiAgICAgIGN0eC5maWxsVGV4dCh0ZXh0LCB3aWR0aCAvIDIsIGhlaWdodCAvIDIpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaWQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLmlkKTtcclxuXHJcbiAgICBmb3IgKGxldCBkZXNjciBvZiBmYWNlRGVzY3JpcHRpb25zKSB7XHJcbiAgICAgIGRyYXdGYWNlKGRlc2NyLnRleHQpO1xyXG5cclxuICAgICAgZ2wudGV4SW1hZ2UyRChkZXNjci50YXJnZXQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGN0eC5jYW52YXMpO1xyXG4gICAgfVxyXG4gICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSX01JUE1BUF9MSU5FQVIpO1xyXG4gIFxyXG4gICAgY3R4LmNhbnZhcy5yZW1vdmUoKTtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIGxvYWQocGF0aCkge1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgdGhpcy5pZCk7XHJcblxyXG4gICAgZm9yIChsZXQgZGVzY3Igb2YgZmFjZURlc2NyaXB0aW9ucykge1xyXG4gICAgICBsZXQgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuXHJcbiAgICAgIGdsLnRleEltYWdlMkQoZGVzY3IudGFyZ2V0LCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBjdHguY2FudmFzKTtcclxuICAgIH1cclxuICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfQ1VCRV9NQVApO1xyXG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUl9NSVBNQVBfTElORUFSKTtcclxuICB9IC8qIGxvYWQgKi9cclxuXHJcbiAgYmluZChwcm9ncmFtLCBpbmRleCA9IDApIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIHRoaXMuaWQpO1xyXG5cclxuICAgIGxldCBsb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBgVGV4dHVyZSR7aW5kZXh9YCk7XHJcbiAgICBnbC51bmlmb3JtMWkobG9jYXRpb24sIGluZGV4KTtcclxuICB9IC8qIGJpbmQgKi9cclxufSAvKiBDdWJlbWFwICovIiwiZXhwb3J0IGNsYXNzIFVCTyB7XHJcbiAgZ2w7XHJcbiAgYnVmZmVyO1xyXG4gIGlzRW1wdHkgPSB0cnVlO1xyXG5cclxuICBjb25zdHJ1Y3RvcihnbCkge1xyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgdGhpcy5idWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIHdyaXRlRGF0YShkYXRhQXNGbG9hdEFycmF5KSB7XHJcbiAgICB0aGlzLmlzRW1wdHkgPSBmYWxzZTtcclxuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLlVOSUZPUk1fQlVGRkVSLCB0aGlzLmJ1ZmZlcik7XHJcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5VTklGT1JNX0JVRkZFUiwgZGF0YUFzRmxvYXRBcnJheSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XHJcbiAgfSAvKiB3cml0ZURhdGEgKi9cclxuXHJcbiAgYmluZChzaGFkZXIsIGJpbmRpbmdQb2ludCwgYnVmZmVyTmFtZSkge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICBpZiAoIXRoaXMuaXNFbXB0eSkge1xyXG4gICAgICBsZXQgbG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtQmxvY2tJbmRleChzaGFkZXIsIGJ1ZmZlck5hbWUpO1xyXG5cclxuICAgICAgaWYgKGxvY2F0aW9uICE9IGdsLklOVkFMSURfSU5ERVgpIHtcclxuICAgICAgICBnbC51bmlmb3JtQmxvY2tCaW5kaW5nKHNoYWRlciwgbG9jYXRpb24sIGJpbmRpbmdQb2ludCk7XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlckJhc2UoZ2wuVU5JRk9STV9CVUZGRVIsIGJpbmRpbmdQb2ludCwgdGhpcy5idWZmZXIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSAvKiBiaW5kICovXHJcbn0gLyogVUJPICovIiwiaW1wb3J0IHtsb2FkU2hhZGVyfSBmcm9tIFwiLi9zaGFkZXIuanNcIjtcclxuaW1wb3J0IHtUZXh0dXJlLCBDdWJlbWFwfSBmcm9tIFwiLi90ZXh0dXJlLmpzXCI7XHJcbmltcG9ydCB7VUJPfSBmcm9tIFwiLi91Ym8uanNcIjtcclxuZXhwb3J0IHtUZXh0dXJlLCBDdWJlbWFwLCBVQk8sIGxvYWRTaGFkZXJ9O1xyXG5cclxuZXhwb3J0IGNsYXNzIE1hdGVyaWFsIHtcclxuICB1Ym9OYW1lT25TaGFkZXIgPSBcIlwiO1xyXG4gIGdsO1xyXG4gIHVibyA9IG51bGw7ICAgIC8vIG9iamVjdCBidWZmZXJcclxuICB0ZXh0dXJlcyA9IFtdOyAvLyBhcnJheSBvZiB0ZXh0dXJlc1xyXG4gIHNoYWRlcjsgICAgICAgIC8vIHNoYWRlciBwb2ludGVyXHJcblxyXG4gIGNvbnN0cnVjdG9yKGdsLCBzaGFkZXIpIHtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuICAgIHRoaXMuc2hhZGVyID0gc2hhZGVyO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgYXBwbHkoKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIGdsLnVzZVByb2dyYW0odGhpcy5zaGFkZXIpO1xyXG5cclxuICAgIGlmICh0aGlzLnVibyAhPSBudWxsKVxyXG4gICAgICB0aGlzLnViby5iaW5kKHRoaXMuc2hhZGVyLCAwLCB0aGlzLnVib05hbWVPblNoYWRlcik7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dHVyZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgIHRoaXMudGV4dHVyZXNbaV0uYmluZCh0aGlzLnNoYWRlciwgaSk7XHJcbiAgfSAvKiBhcHBseSAqL1xyXG5cclxuICB1bmJvdW5kVGV4dHVyZXMoKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0dXJlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaSk7XHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgfVxyXG4gIH0gLyogdW5ib3VuZFRleHR1cmVzICovXHJcbn0gLyogTWF0ZXJpYWwgKi8iLCJpbXBvcnQge2xvYWRTaGFkZXJ9IGZyb20gXCIuL3NoYWRlci5qc1wiO1xyXG5pbXBvcnQge01hdGVyaWFsLCBUZXh0dXJlLCBDdWJlbWFwLCBVQk99IGZyb20gXCIuL21hdGVyaWFsLmpzXCI7XHJcbmltcG9ydCAqIGFzIG10aCBmcm9tIFwiLi9tdGguanNcIjtcclxuXHJcbmV4cG9ydCB7bG9hZFNoYWRlciwgTWF0ZXJpYWwsIFRleHR1cmUsIEN1YmVtYXAsIFVCTywgbXRofTtcclxuXHJcbmV4cG9ydCBjbGFzcyBWZXJ0ZXgge1xyXG4gIHA7XHJcbiAgdDtcclxuICBuO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwb3NpdGlvbiwgdGV4Y29vcmQsIG5vcm1hbCkge1xyXG4gICAgdGhpcy5wID0gcG9zaXRpb247XHJcbiAgICB0aGlzLnQgPSB0ZXhjb29yZDtcclxuICAgIHRoaXMubiA9IG5vcm1hbDtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIHN0YXRpYyBmcm9tQ29vcmQocHgsIHB5LCBweiwgcHUgPSAwLCBwdiA9IDAsIHBueCA9IDAsIHBueSA9IDAsIHBueiA9IDEpIHtcclxuICAgIHJldHVybiBuZXcgVmVydGV4KG5ldyBtdGguVmVjMyhweCwgcHksIHB6KSwgbmV3IG10aC5WZWMyKHB1LCBwdiksIG5ldyBtdGguVmVjMyhwbngsIHBueSwgcG56KSk7XHJcbiAgfSAvKiBmcm9tQ29vcmQgKi9cclxuXHJcbiAgc3RhdGljIGZyb21WZWN0b3JzKHAsIHQgPSBuZXcgbXRoLlZlYzIoMCwgMCksIG4gPSBuZXcgbXRoLlZlYzMoMSwgMSwgMSkpIHtcclxuICAgIHJldHVybiBuZXcgVmVydGV4KHAuY29weSgpLCB0LmNvcHkoKSwgbi5jb3B5KCkpO1xyXG4gIH0gLyogZnJvbVZlY3RvcnMgKi9cclxufTsgLyogVmVydGV4ICovXHJcblxyXG5leHBvcnQgY2xhc3MgVG9wb2xvZ3kge1xyXG4gIHZ0eDtcclxuICBpZHg7XHJcbiAgdHlwZSA9IFRvcG9sb2d5LlRSSUFOR0xFUztcclxuXHJcbiAgc3RhdGljIExJTkVTICAgICAgICAgID0gV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5MSU5FUztcclxuICBzdGF0aWMgTElORV9TVFJJUCAgICAgPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkxJTkVfU1RSSVA7XHJcbiAgc3RhdGljIExJTkVfTE9PUCAgICAgID0gV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5MSU5FX0xPT1A7XHJcblxyXG4gIHN0YXRpYyBQT0lOVFMgICAgICAgICA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUE9JTlRTO1xyXG5cclxuICBzdGF0aWMgVFJJQU5HTEVTICAgICAgPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlRSSUFOR0xFUztcclxuICBzdGF0aWMgVFJJQU5HTEVfU1RSSVAgPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlRSSUFOR0xFX1NUUklQO1xyXG4gIHN0YXRpYyBUUklBTkdMRV9GQU4gICA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVFJJQU5HTEVfRkFOO1xyXG5cclxuICBjb25zdHJ1Y3RvcihudnR4ID0gW10sIG5pZHggPSBudWxsKSB7XHJcbiAgICB0aGlzLnZ0eCA9IG52dHg7XHJcbiAgICB0aGlzLmlkeCA9IG5pZHg7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBzdGF0aWMgZ2VvbWV0cnlUeXBlVG9HTChnZW9tZXRyeVR5cGUpIHtcclxuICAgIHJldHVybiBnZW9tZXRyeVR5cGU7XHJcbiAgfSAvKiBnZW9tZXRyeVR5cGVUb0dMICovXHJcblxyXG4gIHN0YXRpYyBzcXVhcmUoKSB7XHJcbiAgICBsZXQgdHBsID0gbmV3IFRvcG9sb2d5KFtcclxuICAgICAgVmVydGV4LmZyb21Db29yZCgtMSwgLTEsIDAsIDAsIDApLFxyXG4gICAgICBWZXJ0ZXguZnJvbUNvb3JkKC0xLCAgMSwgMCwgMCwgMSksXHJcbiAgICAgIFZlcnRleC5mcm9tQ29vcmQoIDEsIC0xLCAwLCAxLCAwKSxcclxuICAgICAgVmVydGV4LmZyb21Db29yZCggMSwgIDEsIDAsIDEsIDEpXHJcbiAgICBdLCBbMCwgMSwgMiwgM10pO1xyXG4gICAgdHBsLnR5cGUgPSBUb3BvbG9neS5UUklBTkdMRV9TVFJJUDtcclxuICAgIHJldHVybiB0cGw7XHJcbiAgfSAvKiB0aGVUcmlhbmdsZSAqL1xyXG5cclxuICBzdGF0aWMgI3BsYW5lSW5kZXhlZCh3aWR0aCA9IDMwLCBoZWlnaHQgPSAzMCkge1xyXG4gICAgbGV0IHRwbCA9IG5ldyBUb3BvbG9neSgpO1xyXG5cclxuICAgIHRwbC50eXBlID0gVG9wb2xvZ3kuVFJJQU5HTEVfU1RSSVA7XHJcbiAgICB0cGwudnR4ID0gW107XHJcbiAgICB0cGwuaWR4ID0gW107XHJcblxyXG4gICAgbGV0IGkgPSAwO1xyXG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQgLSAxOyB5KyspIHtcclxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgdHBsLmlkeFtpKytdID0geSAqIHdpZHRoICsgeDtcclxuICAgICAgICB0cGwuaWR4W2krK10gPSAoeSArIDEpICogd2lkdGggKyB4O1xyXG4gICAgICB9XHJcbiAgICAgIHRwbC5pZHhbaSsrXSA9IC0xO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cGw7XHJcbiAgfSAvKiBwbGFuZUluZGV4ZWQgKi9cclxuXHJcbiAgc3RhdGljIHBsYW5lKHdpZHRoID0gMzAsIGhlaWdodCA9IDMwKSB7XHJcbiAgICBsZXQgdHBsID0gVG9wb2xvZ3kuI3BsYW5lSW5kZXhlZCh3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XHJcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xyXG4gICAgICAgIHRwbC52dHhbeSAqIHdpZHRoICsgeF0gPSBWZXJ0ZXguZnJvbUNvb3JkKFxyXG4gICAgICAgICAgeCwgMCwgeSxcclxuICAgICAgICAgIHggLyAod2lkdGggLSAxKSwgeSAvIChoZWlnaHQgLSAxKSxcclxuICAgICAgICAgIDAsIDEsIDBcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIHBsYW5lICovXHJcblxyXG4gIHN0YXRpYyBjb25lKHNpemUgPSAzMCkge1xyXG4gICAgbGV0IHRwbCA9IG5ldyBUb3BvbG9neShbXSwgW10pO1xyXG5cclxuICAgIHRwbC52dHgucHVzaChWZXJ0ZXguZnJvbUNvb3JkKDAsIDEsIDApKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XHJcbiAgICAgIGxldCBhID0gaSAvIChzaXplIC0gMSkgKiBNYXRoLlBJICogMjtcclxuXHJcbiAgICAgIHRwbC52dHgucHVzaChWZXJ0ZXguZnJvbUNvb3JkKE1hdGguY29zKGEpLCAwLCBNYXRoLnNpbihhKSkpO1xyXG5cclxuICAgICAgdHBsLmlkeC5wdXNoKGkgJSBzaXplICsgMSk7XHJcbiAgICAgIHRwbC5pZHgucHVzaCgwKTtcclxuICAgICAgdHBsLmlkeC5wdXNoKChpICsgMSkgJSBzaXplICsgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIGNvbmUgKi9cclxuXHJcbiAgc3RhdGljIGN5bGluZGVyKHNpemU9MzApIHtcclxuICAgIGxldCB0cGwgPSBuZXcgVG9wb2xvZ3koW10pO1xyXG4gICAgdHBsLnR5cGUgPSB0aGlzLlRSSUFOR0xFX1NUUklQO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHNpemU7IGkrKykge1xyXG4gICAgICBsZXQgYSA9IGkgLyAoc2l6ZSAtIDIpICogTWF0aC5QSSAqIDI7XHJcbiAgICAgIGxldCBjYSA9IE1hdGguY29zKGEpLCBzYSA9IE1hdGguc2luKGEpO1xyXG5cclxuICAgICAgdHBsLnZ0eC5wdXNoKFZlcnRleC5mcm9tQ29vcmQoY2EsIDAsIHNhKSk7XHJcbiAgICAgIHRwbC52dHgucHVzaChWZXJ0ZXguZnJvbUNvb3JkKGNhLCAxLCBzYSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cGw7XHJcbiAgfSAvKiBjeWxpbmRlciAqL1xyXG5cclxuICBzdGF0aWMgc3BoZXJlKHJhZGl1cyA9IDEsIHdpZHRoID0gMzAsIGhlaWdodCA9IDMwKSB7XHJcbiAgICBsZXQgdHBsID0gVG9wb2xvZ3kuI3BsYW5lSW5kZXhlZCh3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XHJcbiAgICAgIGxldCB0aGV0YSA9IE1hdGguUEkgKiB5IC8gKGhlaWdodCAtIDEpO1xyXG4gICAgICBsZXQgc3RoZXRhID0gTWF0aC5zaW4odGhldGEpO1xyXG4gICAgICBsZXQgY3RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xyXG5cclxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgbGV0IHBoaSA9IDIgKiBNYXRoLlBJICogeCAvICh3aWR0aCAtIDEpO1xyXG5cclxuICAgICAgICBsZXQgbnggPSBzdGhldGEgKiBNYXRoLnNpbihwaGkpO1xyXG4gICAgICAgIGxldCBueSA9IGN0aGV0YTtcclxuICAgICAgICBsZXQgbnogPSBzdGhldGEgKiBNYXRoLmNvcyhwaGkpO1xyXG5cclxuICAgICAgICB0cGwudnR4W3kgKiB3aWR0aCArIHhdID0gVmVydGV4LmZyb21Db29yZChcclxuICAgICAgICAgIHJhZGl1cyAqIG54LCByYWRpdXMgKiBueSwgcmFkaXVzICogbnosXHJcbiAgICAgICAgICB4IC8gKHdpZHRoIC0gMSksIHkgLyAoaGVpZ2h0IC0gMSksXHJcbiAgICAgICAgICBueCwgbnksIG56XHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cGw7XHJcbiAgfSAvKiBzcGhlcmUgKi9cclxuXHJcbiAgc3RhdGljIGFzeW5jIG1vZGVsX29iaihwYXRoKSB7XHJcbiAgICBsZXQgdHBsID0gbmV3IFRvcG9sb2d5KCk7XHJcbiAgICB0cGwudnR4ID0gW107XHJcbiAgICB0cGwudHlwZSA9IFRvcG9sb2d5LlRSSUFOR0xFUztcclxuXHJcbiAgICBjb25zdCBzcmMgPSBhd2FpdCBmZXRjaChwYXRoKS50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLnRleHQoKSk7XHJcbiAgICBsZXQgbGluZXMgPSBzcmMuc3BsaXQoXCJcXG5cIik7XHJcbiAgICBsZXQgcG9zaXRpb25zID0gW107XHJcbiAgICBsZXQgdGV4Q29vcmRzID0gW107XHJcbiAgICBsZXQgbm9ybWFscyA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGxpID0gMCwgbGluZUNvdW50ID0gbGluZXMubGVuZ3RoOyBsaSA8IGxpbmVDb3VudDsgbGkrKykge1xyXG4gICAgICBsZXQgc2VnbWVudHMgPSBsaW5lc1tsaV0uc3BsaXQoXCIgXCIpO1xyXG5cclxuICAgICAgc3dpdGNoIChzZWdtZW50c1swXSkge1xyXG4gICAgICAgIGNhc2UgXCJ2XCI6XHJcbiAgICAgICAgICBwb3NpdGlvbnMucHVzaChuZXcgbXRoLlZlYzMoXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoc2VnbWVudHNbMV0pLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzJdKSxcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChzZWdtZW50c1szXSlcclxuICAgICAgICAgICkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgXCJ2dFwiOlxyXG4gICAgICAgICAgdGV4Q29vcmRzLnB1c2gobmV3IG10aC5WZWMyKFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzFdKSxcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChzZWdtZW50c1syXSlcclxuICAgICAgICAgICkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgXCJ2blwiOlxyXG4gICAgICAgICAgbm9ybWFscy5wdXNoKG5ldyBtdGguVmVjMyhcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChzZWdtZW50c1sxXSksXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoc2VnbWVudHNbMl0pLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzNdKVxyXG4gICAgICAgICAgKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSBcImZcIjpcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZ0ZCA9IHNlZ21lbnRzWzFdLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgbGV0IGkwID0gcGFyc2VJbnQodnRkWzBdKSwgaTEgPSBwYXJzZUludCh2dGRbMV0pLCBpMiA9IHBhcnNlSW50KHZ0ZFsyXSk7XHJcblxyXG4gICAgICAgICAgICB0cGwudnR4LnB1c2gobmV3IFZlcnRleChcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTApID8gbmV3IG10aC5WZWMzKDAsIDAsIDApIDogcG9zaXRpb25zW2kwIC0gMV0sXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkxKSA/IG5ldyBtdGguVmVjMigwLCAwKSA6IHRleENvb3Jkc1tpMSAtIDFdLFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMikgPyBuZXcgbXRoLlZlYzMoMCwgMCwgMCkgOiBub3JtYWxzW2kyIC0gMV1cclxuICAgICAgICAgICAgKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB2dGQgPSBzZWdtZW50c1syXS5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgIGxldCBpMCA9IHBhcnNlSW50KHZ0ZFswXSksIGkxID0gcGFyc2VJbnQodnRkWzFdKSwgaTIgPSBwYXJzZUludCh2dGRbMl0pO1xyXG5cclxuICAgICAgICAgICAgdHBsLnZ0eC5wdXNoKG5ldyBWZXJ0ZXgoXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkwKSA/IG5ldyBtdGguVmVjMygwLCAwLCAwKSA6IHBvc2l0aW9uc1tpMCAtIDFdLFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMSkgPyBuZXcgbXRoLlZlYzIoMCwgMCkgOiB0ZXhDb29yZHNbaTEgLSAxXSxcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTIpID8gbmV3IG10aC5WZWMzKDAsIDAsIDApIDogbm9ybWFsc1tpMiAtIDFdXHJcbiAgICAgICAgICAgICkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdnRkID0gc2VnbWVudHNbM10uc3BsaXQoXCIvXCIpO1xyXG4gICAgICAgICAgICBsZXQgaTAgPSBwYXJzZUludCh2dGRbMF0pLCBpMSA9IHBhcnNlSW50KHZ0ZFsxXSksIGkyID0gcGFyc2VJbnQodnRkWzJdKTtcclxuXHJcbiAgICAgICAgICAgIHRwbC52dHgucHVzaChuZXcgVmVydGV4KFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMCkgPyBuZXcgbXRoLlZlYzMoMCwgMCwgMCkgOiBwb3NpdGlvbnNbaTAgLSAxXSxcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTEpID8gbmV3IG10aC5WZWMyKDAsIDApIDogdGV4Q29vcmRzW2kxIC0gMV0sXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkyKSA/IG5ldyBtdGguVmVjMygwLCAwLCAwKSA6IG5vcm1hbHNbaTIgLSAxXVxyXG4gICAgICAgICAgICApKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cGw7XHJcbiAgfSAvKiBtb2RlbF9vYmogKi9cclxuXHJcbiAgZ2V0VmVydGljZXNBc0Zsb2F0QXJyYXkoKSB7XHJcbiAgICBsZXQgcmVzX2FycmF5ID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnZ0eC5sZW5ndGggKiA4KTtcclxuICAgIGxldCBpID0gMDtcclxuICAgIGxldCBtaSA9IHRoaXMudnR4Lmxlbmd0aCAqIDg7XHJcblxyXG4gICAgd2hpbGUoaSA8IG1pKSB7XHJcbiAgICAgIGxldCB2dCA9IHRoaXMudnR4W2kgPj4gM107XHJcbiAgXHJcbiAgICAgIHJlc19hcnJheVtpKytdID0gdnQucC54O1xyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0LnAueTtcclxuICAgICAgcmVzX2FycmF5W2krK10gPSB2dC5wLno7XHJcblxyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0LnQueDtcclxuICAgICAgcmVzX2FycmF5W2krK10gPSB2dC50Lnk7XHJcblxyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0Lm4ueDtcclxuICAgICAgcmVzX2FycmF5W2krK10gPSB2dC5uLnk7XHJcbiAgICAgIHJlc19hcnJheVtpKytdID0gdnQubi56O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNfYXJyYXk7XHJcbiAgfSAvKiBnZXRWZXJ0aWNlc0FzRmxvYXRBcnJheSAqL1xyXG5cclxuICBnZXRJbmRpY2VzQXNVaW50QXJyYXkoKSB7XHJcbiAgICByZXR1cm4gbmV3IFVpbnQzMkFycmF5KHRoaXMuaWR4KTtcclxuICB9IC8qIGdldEluZGljZXNBc1VpbnRBcnJheSAqL1xyXG59IC8qIFRvcG9sb2d5ICovXHJcblxyXG5leHBvcnQgY2xhc3MgRW1wdHlQcmltaXRpdmUge1xyXG4gIGdsO1xyXG4gIG1hdGVyaWFsO1xyXG4gIGdlb21ldHJ5VHlwZSA9IFRvcG9sb2d5LlRSSUFOR0xFUztcclxuICB2ZXJ0ZXhDb3VudCA9IDQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGdsQ29udGV4dCwgdmVydGV4Q291bnQgPSA0LCBnZW9tZXRyeVR5cGUgPSBUb3BvbG9neS5UUklBTkdMRVMsIG1hdGVyaWFsID0gbnVsbCkge1xyXG4gICAgdGhpcy5nbCA9IGdsQ29udGV4dDtcclxuICAgIHRoaXMudmVydGV4Q291bnQgPSB2ZXJ0ZXhDb3VudDtcclxuICAgIHRoaXMuZ2VvbWV0cnlUeXBlID0gZ2VvbWV0cnlUeXBlO1xyXG4gICAgdGhpcy5tYXRlcmlhbCA9IG1hdGVyaWFsO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgZHJhdyhjYW1lcmFCdWZmZXIgPSBudWxsKSB7XHJcbiAgICB0aGlzLm1hdGVyaWFsLmFwcGx5KCk7XHJcbiAgICBpZiAoY2FtZXJhQnVmZmVyICE9IG51bGwpIHtcclxuICAgICAgY2FtZXJhQnVmZmVyLmJpbmQodGhpcy5tYXRlcmlhbC5zaGFkZXIsIDEsIFwiY2FtZXJhQnVmZmVyXCIpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5nbC5kcmF3QXJyYXlzKFRvcG9sb2d5Lmdlb21ldHJ5VHlwZVRvR0wodGhpcy5nZW9tZXRyeVR5cGUpLCAwLCB0aGlzLnZlcnRleENvdW50KTtcclxuICB9IC8qIGRyYXcgKi9cclxuXHJcbiAgc3RhdGljIGRyYXdGcm9tUGFyYW1zKGdsLCB2ZXJ0ZXhDb3VudCwgZ2VvbWV0cnlUeXBlLCBtYXRlcmlhbCwgY2FtZXJhQnVmZmVyID0gbnVsbCkge1xyXG4gICAgbWF0ZXJpYWwuYXBwbHkoKTtcclxuXHJcbiAgICBpZiAoY2FtZXJhQnVmZmVyICE9IG51bGwpIHtcclxuICAgICAgY2FtZXJhQnVmZmVyLmJpbmQobWF0ZXJpYWwuc2hhZGVyLCAxLCBcImNhbWVyYUJ1ZmZlclwiKTtcclxuICAgIH1cclxuICAgIGdsLmRyYXdBcnJheXMoVG9wb2xvZ3kuZ2VvbWV0cnlUeXBlVG9HTChnZW9tZXRyeVR5cGUpLCAwLCB2ZXJ0ZXhDb3VudCk7XHJcbiAgfSAvKiBkcmF3RnJvbVBhcmFtcyAqL1xyXG59IC8qIEVtcHR5UHJpbWl0aXZlICovXHJcblxyXG5leHBvcnQgY2xhc3MgUHJpbWl0aXZlIHtcclxuICBnbDtcclxuICB2ZXJ0ZXhBcnJheU9iamVjdCA9IG51bGw7XHJcbiAgaW5kZXhCdWZmZXIgPSBudWxsO1xyXG4gIHZlcnRleEJ1ZmZlciA9IG51bGw7XHJcbiAgdmVydGV4TnVtYmVyID0gMDtcclxuICBpbmRleE51bWJlciA9IDA7XHJcbiAgZ2VvbWV0cnlUeXBlID0gVG9wb2xvZ3kuVFJJQU5HTEVTO1xyXG4gIG1hdGVyaWFsID0gbnVsbDtcclxuXHJcbiAgY29uc3RydWN0b3IoZ2xDb250ZXh0KSB7XHJcbiAgICB0aGlzLmdsID0gZ2xDb250ZXh0O1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgZHJhdyhjYW1lcmFCdWZmZXIgPSBudWxsKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIHRoaXMubWF0ZXJpYWwuYXBwbHkoKTtcclxuXHJcbiAgICBpZiAoY2FtZXJhQnVmZmVyICE9IG51bGwpIHtcclxuICAgICAgY2FtZXJhQnVmZmVyLmJpbmQodGhpcy5tYXRlcmlhbC5zaGFkZXIsIDEsIFwiY2FtZXJhQnVmZmVyXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGdsLmJpbmRWZXJ0ZXhBcnJheSh0aGlzLnZlcnRleEFycmF5T2JqZWN0KTtcclxuICAgIGlmICh0aGlzLmluZGV4QnVmZmVyICE9IG51bGwpIHtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5pbmRleEJ1ZmZlcik7XHJcbiAgICAgIGdsLmRyYXdFbGVtZW50cyhUb3BvbG9neS5nZW9tZXRyeVR5cGVUb0dMKHRoaXMuZ2VvbWV0cnlUeXBlKSwgdGhpcy5pbmRleE51bWJlciwgZ2wuVU5TSUdORURfSU5ULCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGdsLmRyYXdBcnJheXMoVG9wb2xvZ3kuZ2VvbWV0cnlUeXBlVG9HTCh0aGlzLmdlb21ldHJ5VHlwZSksIDAsIHRoaXMudmVydGV4TnVtYmVyKTtcclxuICAgIH1cclxuICB9IC8qIGRyYXcgKi9cclxuXHJcbiAgY2xvbmVXaXRoTmV3TWF0ZXJpYWwobWF0ZXJpYWwgPSBudWxsKSB7XHJcbiAgICBpZiAobWF0ZXJpYWwgPT09IG51bGwpIHtcclxuICAgICAgbWF0ZXJpYWwgPSB0aGlzLm1hdGVyaWFsO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcbiAgICBsZXQgcHJpbSA9IG5ldyBQcmltaXRpdmUoZ2wpO1xyXG5cclxuICAgIHByaW0ubWF0ZXJpYWwgPSBtYXRlcmlhbDtcclxuXHJcbiAgICBwcmltLnZlcnRleEJ1ZmZlciA9IHRoaXMudmVydGV4QnVmZmVyO1xyXG4gICAgcHJpbS52ZXJ0ZXhDb3VudCA9IHRoaXMudmVydGV4Q291bnQ7XHJcblxyXG4gICAgcHJpbS52ZXJ0ZXhBcnJheU9iamVjdCA9IGdsLmNyZWF0ZVZlcnRleEFycmF5KCk7XHJcbiAgICBnbC5iaW5kVmVydGV4QXJyYXkocHJpbS52ZXJ0ZXhBcnJheU9iamVjdCk7XHJcblxyXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHByaW0udmVydGV4QnVmZmVyKTtcclxuXHJcbiAgICAvLyBNYXAgdmVydGV4IGxheW91dFxyXG4gICAgbGV0IHBvc2l0aW9uTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmltLm1hdGVyaWFsLnNoYWRlciwgXCJpblBvc2l0aW9uXCIpO1xyXG4gICAgaWYgKHBvc2l0aW9uTG9jYXRpb24gIT0gLTEpIHtcclxuICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihwb3NpdGlvbkxvY2F0aW9uLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDggKiA0LCAwKTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkocG9zaXRpb25Mb2NhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHRleENvb3JkTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmltLm1hdGVyaWFsLnNoYWRlciwgXCJpblRleENvb3JkXCIpO1xyXG4gICAgaWYgKHRleENvb3JkTG9jYXRpb24gIT0gLTEpIHtcclxuICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih0ZXhDb29yZExvY2F0aW9uLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDggKiA0LCAzICogNCk7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRleENvb3JkTG9jYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBub3JtYWxMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByaW0ubWF0ZXJpYWwuc2hhZGVyLCBcImluTm9ybWFsXCIpO1xyXG4gICAgaWYgKG5vcm1hbExvY2F0aW9uICE9IC0xKSB7XHJcbiAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobm9ybWFsTG9jYXRpb24sIDMsIGdsLkZMT0FULCBmYWxzZSwgOCAqIDQsIDUgKiA0KTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobm9ybWFsTG9jYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaW0uaW5kZXhCdWZmZXIgPSB0aGlzLmluZGV4QnVmZmVyO1xyXG4gICAgcHJpbS5pbmRleENvdW50ID0gdGhpcy5pbmRleENvdW50O1xyXG4gIH0gLyogY2xvbmVXaXRoTmV3TWF0ZXJpYWwgKi9cclxuXHJcbiAgc3RhdGljIGFzeW5jIGZyb21Ub3BvbG9neShnbCwgdHBsLCBtYXRlcmlhbCkge1xyXG4gICAgbGV0IHByaW0gPSBuZXcgUHJpbWl0aXZlKGdsKTtcclxuICAgIHByaW0ubWF0ZXJpYWwgPSBtYXRlcmlhbDtcclxuXHJcbiAgICBwcmltLmdlb21ldHJ5VHlwZSA9IHRwbC50eXBlO1xyXG5cclxuICAgIC8vIENyZWF0ZSB2ZXJ0ZXggYXJyYXlcclxuICAgIHByaW0udmVydGV4QXJyYXlPYmplY3QgPSBnbC5jcmVhdGVWZXJ0ZXhBcnJheSgpO1xyXG4gICAgZ2wuYmluZFZlcnRleEFycmF5KHByaW0udmVydGV4QXJyYXlPYmplY3QpO1xyXG5cclxuICAgIC8vIFdyaXRlIHZlcnRleCBidWZmZXJcclxuICAgIHByaW0udmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcHJpbS52ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHRwbC5nZXRWZXJ0aWNlc0FzRmxvYXRBcnJheSgpLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgICBwcmltLnZlcnRleE51bWJlciA9IHRwbC52dHgubGVuZ3RoO1xyXG5cclxuICAgIC8vIE1hcCB2ZXJ0ZXggbGF5b3V0XHJcbiAgICBsZXQgcG9zaXRpb25Mb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByaW0ubWF0ZXJpYWwuc2hhZGVyLCBcImluUG9zaXRpb25cIik7XHJcbiAgICBpZiAocG9zaXRpb25Mb2NhdGlvbiAhPSAtMSkge1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHBvc2l0aW9uTG9jYXRpb24sIDMsIGdsLkZMT0FULCBmYWxzZSwgOCAqIDQsIDApO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShwb3NpdGlvbkxvY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgdGV4Q29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByaW0ubWF0ZXJpYWwuc2hhZGVyLCBcImluVGV4Q29vcmRcIik7XHJcbiAgICBpZiAodGV4Q29vcmRMb2NhdGlvbiAhPSAtMSkge1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRleENvb3JkTG9jYXRpb24sIDMsIGdsLkZMT0FULCBmYWxzZSwgOCAqIDQsIDMgKiA0KTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGV4Q29vcmRMb2NhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG5vcm1hbExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJpbS5tYXRlcmlhbC5zaGFkZXIsIFwiaW5Ob3JtYWxcIik7XHJcbiAgICBpZiAobm9ybWFsTG9jYXRpb24gIT0gLTEpIHtcclxuICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihub3JtYWxMb2NhdGlvbiwgMywgZ2wuRkxPQVQsIGZhbHNlLCA4ICogNCwgNSAqIDQpO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShub3JtYWxMb2NhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ3JlYXRlIGluZGV4IGJ1ZmZlclxyXG4gICAgaWYgKHRwbC5pZHggPT0gbnVsbCkge1xyXG4gICAgICBwcmltLmluZGV4QnVmZmVyID0gbnVsbDtcclxuICAgICAgcHJpbS5pbmRleE51bWJlciA9IDA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwcmltLmluZGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHByaW0uaW5kZXhCdWZmZXIpO1xyXG4gICAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0cGwuZ2V0SW5kaWNlc0FzVWludEFycmF5KCksIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgICAgcHJpbS5pbmRleE51bWJlciA9IHRwbC5pZHgubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwcmltO1xyXG4gIH0gLyogZnJvbUFycmF5ICovXHJcbn07IC8qIFByaW1pdGl2ZSAqL1xyXG4iLCJpbXBvcnQgKiBhcyBtdGggZnJvbSBcIi4vbXRoLmpzXCI7XHJcbmltcG9ydCB7VGV4dHVyZX0gZnJvbSBcIi4vdGV4dHVyZS5qc1wiO1xyXG5cclxuZnVuY3Rpb24gZGVjb2RlRnJhbWVidWZmZXJTdGF0dXMoc3RhdHVzKSB7XHJcbiAgc3dpdGNoIChzdGF0dXMpIHtcclxuICAgIGNhc2UgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5GUkFNRUJVRkZFUl9DT01QTEVURTogICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiY29tcGxldGVcIjtcclxuICAgIGNhc2UgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0FUVEFDSE1FTlQ6ICAgICAgICAgcmV0dXJuIFwiaW5jb21wbGV0ZSBhdHRhY2htZW50XCI7XHJcbiAgICBjYXNlIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9ESU1FTlNJT05TOiAgICAgICAgIHJldHVybiBcImhlaWdodCBhbmQgd2lkdGggb2YgYXR0YWNobWVudCBhcmVuJ3Qgc2FtZVwiO1xyXG4gICAgY2FzZSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfTUlTU0lOR19BVFRBQ0hNRU5UOiByZXR1cm4gXCJhdHRhY2htZW50IG1pc3NpbmdcIjtcclxuICAgIGNhc2UgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5GUkFNRUJVRkZFUl9VTlNVUFBPUlRFRDogICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYXR0YWNobWVudCBmb3JtYXQgaXNuJ3Qgc3VwcG9ydGVkXCI7XHJcbiAgfVxyXG59IC8qIGRlY29kZUZyYW1lYnVmZmVyU3RhdHVzICovXHJcblxyXG5sZXQgY3VycmVudFRhcmdldCA9IG51bGw7XHJcbmxldCBmZXRjaGVyVGFyZ2V0ID0gbnVsbDtcclxuXHJcbmV4cG9ydCBjbGFzcyBUYXJnZXQge1xyXG4gICNnbDtcclxuICBGQk87XHJcbiAgYXR0YWNobWVudHMgPSBbXTtcclxuICBzaXplO1xyXG4gIGRlcHRoO1xyXG4gIGRyYXdCdWZmZXJzO1xyXG5cclxuICBjb25zdHJ1Y3RvcihnbCwgYXR0YWNobWVudENvdW50KSB7XHJcbiAgICB0aGlzLnNpemUgPSBuZXcgbXRoLlNpemUoODAwLCA2MDApO1xyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgdGhpcy5GQk8gPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG5cclxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgdGhpcy5GQk8pO1xyXG5cclxuICAgIC8vIGNyZWF0ZSB0YXJnZXQgdGV4dHVyZXNcclxuICAgIHRoaXMuZHJhd0J1ZmZlcnMgPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0YWNobWVudENvdW50OyBpKyspIHtcclxuICAgICAgdGhpcy5hdHRhY2htZW50c1tpXSA9IG5ldyBUZXh0dXJlKGdsLCBUZXh0dXJlLkZMT0FULCA0KTtcclxuICAgICAgdGhpcy5kcmF3QnVmZmVycy5wdXNoKGdsLkNPTE9SX0FUVEFDSE1FTlQwICsgaSk7XHJcbiAgICB9XHJcbiAgICBnbC5kcmF3QnVmZmVycyh0aGlzLmRyYXdCdWZmZXJzKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dGFjaG1lbnRDb3VudDsgaSsrKSB7XHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuYXR0YWNobWVudHNbaV0uaWQpO1xyXG4gICAgICB0aGlzLmF0dGFjaG1lbnRzW2ldLnJlc2l6ZSh0aGlzLnNpemUpO1xyXG4gIFxyXG4gICAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAgKyBpLCBnbC5URVhUVVJFXzJELCB0aGlzLmF0dGFjaG1lbnRzW2ldLmlkLCAwKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGVwdGggPSBuZXcgVGV4dHVyZShnbCwgVGV4dHVyZS5ERVBUSCk7XHJcbiAgICB0aGlzLmRlcHRoLnJlc2l6ZSh0aGlzLnNpemUpO1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5kZXB0aC5pZCk7XHJcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfQVRUQUNITUVOVCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy5kZXB0aC5pZCwgMCk7XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2coYEZyYW1lYnVmZmVyIHN0YXR1czogJHtkZWNvZGVGcmFtZWJ1ZmZlclN0YXR1cyhnbC5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKGdsLkZSQU1FQlVGRkVSKSl9YCk7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBnZXRBdHRhY2htZW50VmFsdWUoYXR0LCB4LCB5KSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIGlmIChmZXRjaGVyVGFyZ2V0ID09IG51bGwpIHtcclxuICAgICAgZmV0Y2hlclRhcmdldCA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XHJcbiAgICB9XHJcbiAgICBsZXQgZHN0ID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcclxuXHJcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGZldGNoZXJUYXJnZXQpO1xyXG4gICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCBnbC5URVhUVVJFXzJELCB0aGlzLmF0dGFjaG1lbnRzW2F0dF0uaWQsIDApO1xyXG4gICAgaWYgKGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpID09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XHJcbiAgICAgIGdsLnJlYWRQaXhlbHMoeCwgdGhpcy5hdHRhY2htZW50c1thdHRdLnNpemUuaCAtIHksIDEsIDEsIGdsLlJHQkEsIGdsLkZMT0FULCBkc3QpO1xyXG4gICAgfVxyXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBjdXJyZW50VGFyZ2V0KTtcclxuXHJcbiAgICByZXR1cm4gZHN0O1xyXG4gIH0gLyogZ2V0QXR0YWNobWVudFBpeGVsICovXHJcblxyXG4gIHJlc2l6ZShzaXplKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIHRoaXMuc2l6ZSA9IHNpemUuY29weSgpO1xyXG4gICAgdGhpcy5GQk8gPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG5cclxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgdGhpcy5GQk8pO1xyXG5cclxuICAgIC8vIGNyZWF0ZSB0YXJnZXQgdGV4dHVyZXNcclxuICAgIGxldCBkcmF3QnVmZmVycyA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dGFjaG1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHRoaXMuYXR0YWNobWVudHNbaV0gPSBuZXcgVGV4dHVyZShnbCwgVGV4dHVyZS5GTE9BVCwgNCk7XHJcbiAgICAgIGRyYXdCdWZmZXJzLnB1c2goZ2wuQ09MT1JfQVRUQUNITUVOVDAgKyBpKTtcclxuICAgIH1cclxuICAgIGdsLmRyYXdCdWZmZXJzKGRyYXdCdWZmZXJzKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXR0YWNobWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5hdHRhY2htZW50c1tpXS5pZCk7XHJcbiAgICAgIHRoaXMuYXR0YWNobWVudHNbaV0ucmVzaXplKHRoaXMuc2l6ZSk7XHJcbiAgXHJcbiAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCArIGksIGdsLlRFWFRVUkVfMkQsIHRoaXMuYXR0YWNobWVudHNbaV0uaWQsIDApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kZXB0aCA9IG5ldyBUZXh0dXJlKGdsLCBUZXh0dXJlLkRFUFRIKTtcclxuICAgIHRoaXMuZGVwdGgucmVzaXplKHRoaXMuc2l6ZSk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmRlcHRoLmlkKTtcclxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5URVhUVVJFXzJELCB0aGlzLmRlcHRoLmlkLCAwKTtcclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyhgRnJhbWVidWZmZXIgc3RhdHVzOiAke2RlY29kZUZyYW1lYnVmZmVyU3RhdHVzKGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpKX1gKTtcclxuICB9IC8qIHJlc2l6ZSAqL1xyXG5cclxuICBiaW5kKCkge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICBjdXJyZW50VGFyZ2V0ID0gdGhpcy5GQk87XHJcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuRkJPKTtcclxuICAgIGdsLmRyYXdCdWZmZXJzKHRoaXMuZHJhd0J1ZmZlcnMpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hdHRhY2htZW50cy5sZW5ndGg7IGkrKylcclxuICAgIGdsLmNsZWFyQnVmZmVyZnYoZ2wuQ09MT1IsIGksIFswLjAwLCAwLjAwLCAwLjAwLCAwLjAwXSk7XHJcbiAgICBnbC5jbGVhckJ1ZmZlcmZ2KGdsLkRFUFRILCAwLCBbMV0pO1xyXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgdGhpcy5zaXplLncsIHRoaXMuc2l6ZS5oKTtcclxuICB9IC8qIGJpbmQgKi9cclxuXHJcbiAgc3RhdGljIGRlZmF1bHRGcmFtZWJ1ZmZlciA9IHtcclxuICAgIHNpemU6IG5ldyBtdGguU2l6ZSg4MDAsIDYwMCksXHJcbiAgICBnbDogbnVsbCxcclxuXHJcbiAgICByZXNpemUoc2l6ZSkge1xyXG4gICAgICBUYXJnZXQuZGVmYXVsdEZyYW1lYnVmZmVyLnNpemUgPSBzaXplLmNvcHkoKTtcclxuICAgIH0sIC8qIHJlc2l6ZSAqL1xyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgIGxldCBnbCA9IFRhcmdldC5kZWZhdWx0RnJhbWVidWZmZXIuZ2w7XHJcblxyXG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG4gICAgICBnbC52aWV3cG9ydCgwLCAwLCBUYXJnZXQuZGVmYXVsdEZyYW1lYnVmZmVyLnNpemUudywgVGFyZ2V0LmRlZmF1bHRGcmFtZWJ1ZmZlci5zaXplLmgpO1xyXG4gICAgICBnbC5jbGVhcihXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkNPTE9SX0JVRkZFUl9CSVQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkRFUFRIX0JVRkZFUl9CSVQpO1xyXG4gICAgICBnbC5jbGVhckNvbG9yKDAuMzAsIDAuNDcsIDAuODAsIDEuMDApO1xyXG5cclxuICAgICAgY3VycmVudFRhcmdldCA9IG51bGw7XHJcbiAgICB9XHJcbiAgfTsgLyogZGVmYXVsdEZyYW1lYnVmZmVyICovXHJcblxyXG4gIGVuYWJsZURyYXdCdWZmZXIoYnVmZmVyKSB7XHJcbiAgICB0aGlzLmRyYXdCdWZmZXJzW2J1ZmZlcl0gPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkNPTE9SX0FUVEFDSE1FTlQwICsgYnVmZmVyO1xyXG5cclxuICAgIGlmIChjdXJyZW50VGFyZ2V0ID09PSB0aGlzLkZCTykge1xyXG4gICAgICB0aGlzLmdsLmRyYXdCdWZmZXJzKHRoaXMuZHJhd0J1ZmZlcnMpO1xyXG4gICAgfVxyXG4gIH0gLyogZW5hYmxlRHJhd0J1ZmZlciAqL1xyXG5cclxuICBkaXNhYmxlRHJhd0J1ZmZlcihidWZmZXIpIHtcclxuICAgIHRoaXMuZHJhd0J1ZmZlcnNbYnVmZmVyXSA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuTk9ORTtcclxuXHJcbiAgICBpZiAoY3VycmVudFRhcmdldCA9PT0gdGhpcy5GQk8pIHtcclxuICAgICAgdGhpcy5nbC5kcmF3QnVmZmVycyh0aGlzLmRyYXdCdWZmZXJzKTtcclxuICAgIH1cclxuICB9IC8qIGRpc2FibGVEcmF3QnVmZmVyICovXHJcblxyXG4gIHN0YXRpYyBkZWZhdWx0KGdsKSB7XHJcbiAgICBUYXJnZXQuZGVmYXVsdEZyYW1lYnVmZmVyLmdsID0gZ2w7XHJcbiAgICByZXR1cm4gVGFyZ2V0LmRlZmF1bHRGcmFtZWJ1ZmZlcjtcclxuICB9IC8qIGRlZmF1bHQgKi9cclxufSAvKiBUYXJnZXQgKi9cclxuXHJcbi8qIHRhcmdldC5qcyAqLyIsImZ1bmN0aW9uIGdldFRpbWUoKSB7XHJcbiAgcmV0dXJuIERhdGUubm93KCkgLyAxMDAwLjA7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUaW1lciB7XHJcbiAgZnBzUHJldlVwZGF0ZVRpbWUgPSAwLjAwO1xyXG4gIHN0YXJ0VGltZTtcclxuICBmcHNDb3VudGVyID0gMC4wMDtcclxuICBwYXVzZUNvbGxlY3RvciA9IDAuMDA7XHJcbiAgaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgZnBzRGVsdGFUaW1lID0gMy4wMDtcclxuICBmcHMgPSB1bmRlZmluZWQ7XHJcblxyXG4gIHRpbWUgPSAwLjAwO1xyXG4gIGdsb2JhbFRpbWU7XHJcbiAgXHJcbiAgZGVsdGFUaW1lID0gMC4wMDtcclxuICBnbG9iYWxEZWx0YVRpbWUgPSAwLjAwO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuc3RhcnRUaW1lID0gZ2V0VGltZSgpO1xyXG5cclxuICAgIHRoaXMuZ2xvYmFsVGltZSA9IHRoaXMuc3RhcnRUaW1lO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgcmVzcG9uc2UoKSB7XHJcbiAgICBsZXQgbmV3R2xvYmFsVGltZSA9IGdldFRpbWUoKTtcclxuXHJcbiAgICB0aGlzLmdsb2JhbERlbHRhVGltZSA9IG5ld0dsb2JhbFRpbWUgLSB0aGlzLmdsb2JhbFRpbWU7XHJcbiAgICB0aGlzLmdsb2JhbFRpbWUgPSBuZXdHbG9iYWxUaW1lO1xyXG5cclxuICAgIGlmICh0aGlzLmlzUGF1c2VkKSB7XHJcbiAgICAgIHRoaXMuZGVsdGFUaW1lID0gMC4wMDtcclxuICAgICAgdGhpcy5wYXVzZUNvbGxlY3RvciArPSB0aGlzLmdsb2JhbERlbHRhVGltZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMudGltZSA9IHRoaXMuZ2xvYmFsVGltZSAtIHRoaXMuc3RhcnRUaW1lIC0gdGhpcy5wYXVzZUNvbGxlY3RvcjtcclxuICAgICAgdGhpcy5kZWx0YVRpbWUgPSB0aGlzLmdsb2JhbERlbHRhVGltZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmZwc0NvdW50ZXIrKztcclxuICAgIGlmICh0aGlzLmdsb2JhbFRpbWUgLSB0aGlzLmZwc1ByZXZVcGRhdGVUaW1lID49IHRoaXMuZnBzRGVsdGFUaW1lKSB7XHJcbiAgICAgIHRoaXMuZnBzID0gdGhpcy5mcHNDb3VudGVyIC8gKHRoaXMuZ2xvYmFsVGltZSAtIHRoaXMuZnBzUHJldlVwZGF0ZVRpbWUpO1xyXG5cclxuICAgICAgdGhpcy5mcHNQcmV2VXBkYXRlVGltZSA9IHRoaXMuZ2xvYmFsVGltZTtcclxuICAgICAgdGhpcy5mcHNDb3VudGVyID0gMDtcclxuICAgIH1cclxuICB9IC8qIHJlc3BvbnNlICovXHJcbn0gLyogVGltZXIgKi9cclxuXHJcbi8qIHRpbWVyLmpzICovIiwiaW1wb3J0IHtsb2FkU2hhZGVyLCBNYXRlcmlhbCwgUHJpbWl0aXZlLCBFbXB0eVByaW1pdGl2ZSwgVG9wb2xvZ3ksIFZlcnRleCwgVGV4dHVyZSwgQ3ViZW1hcCwgVUJPLCBtdGh9IGZyb20gXCIuL3ByaW1pdGl2ZS5qc1wiO1xyXG5pbXBvcnQge1RhcmdldH0gZnJvbSBcIi4vdGFyZ2V0LmpzXCI7XHJcbmltcG9ydCB7VGltZXJ9IGZyb20gXCIuL3RpbWVyLmpzXCI7XHJcblxyXG5leHBvcnQge01hdGVyaWFsLCBQcmltaXRpdmUsIEVtcHR5UHJpbWl0aXZlLCBUb3BvbG9neSwgVmVydGV4LCBUZXh0dXJlLCBDdWJlbWFwLCBVQk8sIG10aH07XHJcblxyXG5jb25zdCBtYXQ0SWRlbnRpdHkgPSBtdGguTWF0NC5pZGVudGl0eSgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIFN5c3RlbSB7XHJcbiAgcmVuZGVyUXVldWU7XHJcbiAgbWFya2VyUmVuZGVyUXVldWU7XHJcbiAgZ2w7XHJcbiAgY2FtZXJhO1xyXG4gIGNhbWVyYVVCTztcclxuXHJcbiAgdGFyZ2V0O1xyXG4gIGZzTWF0ZXJpYWwgPSBudWxsO1xyXG5cclxuICB1bml0czsgIC8vIHVuaXQgbGlzdFxyXG4gIHRpbWVyOyAgLy8gdGltZXJcclxuICBsYXN0VW5pdElEID0gMDtcclxuXHJcbiAgY3VycmVudE9iamVjdElEID0gMDtcclxuICByZW5kZXJQYXJhbXMgPSB7fTtcclxuXHJcbiAgYWRkUmVuZGVyUGFyYW1ldGVyKEdMZW51bSwgcGFyYW1OYW1lLCBpbml0aWFsVmFsdWUgPSB0cnVlKSB7XHJcbiAgICBsZXQgdmFsdWUgPSAhaW5pdGlhbFZhbHVlO1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5yZW5kZXJQYXJhbXMsIHBhcmFtTmFtZSwge1xyXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICBnZXQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICB9LCAvKiBnZXQgKi9cclxuXHJcbiAgICAgIHNldChuZXdWYWx1ZSkge1xyXG4gICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdmFsdWUpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgZ2wuZW5hYmxlKEdMZW51bSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGdsLmRpc2FibGUoR0xlbnVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgfSAvKiBzZXQgKi9cclxuICAgIH0pOyAvKiBwcm9wZXJ0eSBkZWZpbml0aW9uICovXHJcbiAgICB0aGlzLnJlbmRlclBhcmFtc1twYXJhbU5hbWVdID0gaW5pdGlhbFZhbHVlO1xyXG4gIH0gLyogYWRkUmVuZGVyUGFyYW1ldGVyICovXHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgLy8gV2ViR0wgaW5pdGlhbGl6YXRpb25cclxuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG5cclxuICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2wyXCIpO1xyXG4gICAgaWYgKGdsID09IG51bGwpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoXCJDYW4ndCBpbml0aWFsaXplIFdlYkdMMlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgZXh0ZW5zaW9ucyA9IFtcIkVYVF9jb2xvcl9idWZmZXJfZmxvYXRcIiwgXCJPRVNfdGV4dHVyZV9mbG9hdF9saW5lYXJcIl07XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4dGVuc2lvbnMubGVuZ3RoOyBpKyspXHJcbiAgICAgIGlmIChnbC5nZXRFeHRlbnNpb24oZXh0ZW5zaW9uc1tpXSkgPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBFcnJvcihgXCIke2V4dGVuc2lvbnNbaV19XCIgZXh0ZW5zaW9uIHJlcXVpcmVkYCk7XHJcblxyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG5cclxuICAgIHRoaXMuYWRkUmVuZGVyUGFyYW1ldGVyKFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuREVQVEhfVEVTVCwgXCJkZXB0aFRlc3RcIiwgdHJ1ZSk7XHJcbiAgICB0aGlzLmFkZFJlbmRlclBhcmFtZXRlcihXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkNVTExfRkFDRSwgXCJjdWxsRmFjZVwiLCBmYWxzZSk7XHJcblxyXG4gICAgZ2wuZGVwdGhGdW5jKFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuTEVRVUFMKTtcclxuICAgIC8vIGdsLmVuYWJsZShXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkNVTExfRkFDRSk7XHJcblxyXG4gICAgLy8gZ2wuY3VsbEZhY2UoV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5CQUNLKTtcclxuXHJcbiAgICB0aGlzLnJlbmRlclF1ZXVlID0gW107XHJcbiAgICB0aGlzLm1hcmtlclJlbmRlclF1ZXVlID0gW107XHJcbiAgICB0aGlzLmNhbWVyYSA9IG5ldyBtdGguQ2FtZXJhKCk7XHJcblxyXG4gICAgdGhpcy5jYW1lcmFVQk8gPSBuZXcgVUJPKHRoaXMuZ2wpO1xyXG5cclxuICAgIHRoaXMuY2FtZXJhLnJlc2l6ZShuZXcgbXRoLlNpemUoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSk7XHJcblxyXG4gICAgLy8gdGFyZ2V0cyBzZXR1cFxyXG4gICAgbGV0IHNpemUgPSBuZXcgbXRoLlNpemUoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuICAgIHRoaXMudGFyZ2V0ID0gbmV3IFRhcmdldChnbCwgMik7XHJcblxyXG4gICAgdGhpcy50YXJnZXQucmVzaXplKHNpemUpO1xyXG4gICAgVGFyZ2V0LmRlZmF1bHQoZ2wpLnJlc2l6ZShzaXplKTtcclxuXHJcbiAgICAvLyByZXNpemUgaGFuZGxpbmdcclxuICAgIHdpbmRvdy5vbnJlc2l6ZSA9ICgpID0+IHtcclxuICAgICAgbGV0IHJlc29sdXRpb24gPSBuZXcgbXRoLlNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XHJcblxyXG4gICAgICBjYW52YXMud2lkdGggPSByZXNvbHV0aW9uLnc7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSByZXNvbHV0aW9uLmg7XHJcblxyXG4gICAgICB0aGlzLmNhbWVyYS5yZXNpemUocmVzb2x1dGlvbik7XHJcbiAgICAgIHRoaXMudGFyZ2V0LnJlc2l6ZShyZXNvbHV0aW9uKTtcclxuICAgICAgVGFyZ2V0LmRlZmF1bHQoZ2wpLnJlc2l6ZShyZXNvbHV0aW9uKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51bml0cyA9IHt9O1xyXG4gICAgdGhpcy50aW1lciA9IG5ldyBUaW1lcigpO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgc3RhdGljIGlkZW50aXR5ID0gbXRoLk1hdDQuaWRlbnRpdHkoKTtcclxuXHJcbiAgZHJhd1ByaW1pdGl2ZShwcmltaXRpdmUsIHRyYW5zZm9ybSA9IG1hdDRJZGVudGl0eSkge1xyXG4gICAgdGhpcy5yZW5kZXJRdWV1ZS5wdXNoKHtcclxuICAgICAgcHJpbWl0aXZlOiBwcmltaXRpdmUsXHJcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtLFxyXG4gICAgICBpZDogICAgICAgIHRoaXMuY3VycmVudE9iamVjdElEXHJcbiAgICB9KTtcclxuICB9IC8qIGRyYXdQcmltaXRpdmUgKi9cclxuXHJcbiAgZHJhd01hcmtlclByaW1pdGl2ZShwcmltaXRpdmUsIHRyYW5zZm9ybSA9IG1hdDRJZGVudGl0eSkge1xyXG4gICAgdGhpcy5tYXJrZXJSZW5kZXJRdWV1ZS5wdXNoKHtcclxuICAgICAgcHJpbWl0aXZlOiBwcmltaXRpdmUsXHJcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtLFxyXG4gICAgICBpZDogICAgICAgIHRoaXMuY3VycmVudE9iamVjdElEXHJcbiAgICB9KTtcclxuICB9IC8qIGRyYXdNYXJrZXJQcmltaXRpdmUgKi9cclxuXHJcbiAgY3JlYXRlVGV4dHVyZShwYXRoID0gbnVsbCkge1xyXG4gICAgaWYgKHBhdGggPT09IG51bGwpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUZXh0dXJlKHRoaXMuZ2wsIFRleHR1cmUuVU5TSUdORURfQllURSwgNCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsZXQgdGV4ID0gbmV3IFRleHR1cmUodGhpcy5nbCwgVGV4dHVyZS5VTlNJR05FRF9CWVRFLCA0KTtcclxuICAgICAgdGV4LmxvYWQocGF0aCk7XHJcblxyXG4gICAgICByZXR1cm4gdGV4O1xyXG4gICAgfVxyXG4gIH0gLyogY3JlYXRlVGV4dHVyZSAqL1xyXG5cclxuICBnZXREZWZhdWx0VGV4dHVyZSgpIHtcclxuICAgIHJldHVybiBUZXh0dXJlLmRlZmF1bHRDaGVja2VyKHRoaXMuZ2wpO1xyXG4gIH0gLyogZ2V0RGVmYXVsdFRleHR1cmUgKi9cclxuXHJcbiAgY3JlYXRlQ3ViZW1hcCgpIHtcclxuICAgIHJldHVybiBuZXcgQ3ViZW1hcCh0aGlzLmdsKTtcclxuICB9IC8qIGNyZWF0ZUN1YmVtYXAgKi9cclxuXHJcbiAgY3JlYXRlVW5pZm9ybUJ1ZmZlcigpIHtcclxuICAgIHJldHVybiBuZXcgVUJPKHRoaXMuZ2wpO1xyXG4gIH0gLyogY3JlYXRlVW5pZm9ybUJ1ZmZlciAqL1xyXG5cclxuICBhc3luYyBjcmVhdGVTaGFkZXIocGF0aCkge1xyXG4gICAgcmV0dXJuIGxvYWRTaGFkZXIodGhpcy5nbCwgcGF0aCk7XHJcbiAgfSAvKiBjcmVhdGVTaGFkZXIgKi9cclxuXHJcbiAgYXN5bmMgY3JlYXRlTWF0ZXJpYWwoc2hhZGVyKSB7XHJcbiAgICBpZiAodHlwZW9mKHNoYWRlcikgPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICByZXR1cm4gbmV3IE1hdGVyaWFsKHRoaXMuZ2wsIGF3YWl0IGxvYWRTaGFkZXIodGhpcy5nbCwgc2hhZGVyKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbmV3IE1hdGVyaWFsKHRoaXMuZ2wsIHNoYWRlcik7XHJcbiAgICB9XHJcbiAgfSAvKiBjcmVhdGVNYXRlcmlhbCAqL1xyXG5cclxuICBjcmVhdGVQcmltaXRpdmUodG9wb2xvZ3ksIG1hdGVyaWFsKSB7XHJcbiAgICByZXR1cm4gUHJpbWl0aXZlLmZyb21Ub3BvbG9neSh0aGlzLmdsLCB0b3BvbG9neSwgbWF0ZXJpYWwpO1xyXG4gIH0gLyogY3JlYXRlUHJpbWl0aXZlICovXHJcblxyXG4gIGNyZWF0ZUVtcHR5UHJpbWl0aXZlKHZlcnRleENvdW50LCB0b3BvbG9neVR5cGUsIG1hdGVyaWFsKSB7XHJcbiAgICByZXR1cm4gbmV3IEVtcHR5UHJpbWl0aXZlKHRoaXMuZ2wsIHZlcnRleENvdW50LCB0b3BvbG9neVR5cGUsIG1hdGVyaWFsKTtcclxuICB9IC8qIGNyZWF0ZUVtcHR5UHJpbWl0aXZlICovXHJcblxyXG4gIHN0YXJ0KCkge1xyXG4gIH0gLyogc3RhcnQgKi9cclxuXHJcbiAgZW5kKCkge1xyXG4gICAgLy8gcmVuZGVyaW5nIGluIHRhcmdldFxyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICB0aGlzLnRhcmdldC5iaW5kKCk7XHJcblxyXG4gICAgbGV0IGNhbWVyYUluZm8gPSBuZXcgRmxvYXQzMkFycmF5KDM2KTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcclxuICAgICAgY2FtZXJhSW5mb1tpICsgMTZdID0gdGhpcy5jYW1lcmEudmlld1Byb2oubVtpXTtcclxuICAgIH1cclxuICAgIGNhbWVyYUluZm9bMzJdID0gdGhpcy5jYW1lcmEubG9jLng7XHJcbiAgICBjYW1lcmFJbmZvWzMzXSA9IHRoaXMuY2FtZXJhLmxvYy55O1xyXG4gICAgY2FtZXJhSW5mb1szNF0gPSB0aGlzLmNhbWVyYS5sb2MuejtcclxuICAgIGNhbWVyYUluZm9bMzVdID0gMDsgLy8gSUQgb2Ygb2JqZWN0XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDAsIGNvdW50ID0gdGhpcy5yZW5kZXJRdWV1ZS5sZW5ndGg7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgIGxldCBwcmltID0gdGhpcy5yZW5kZXJRdWV1ZVtpXS5wcmltaXRpdmU7XHJcbiAgICAgIGxldCB0cmFucyA9IHRoaXMucmVuZGVyUXVldWVbaV0udHJhbnNmb3JtO1xyXG4gICAgICBcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XHJcbiAgICAgICAgY2FtZXJhSW5mb1tpXSA9IHRyYW5zLm1baV07XHJcbiAgICAgIH1cclxuICAgICAgY2FtZXJhSW5mb1szNV0gPSB0aGlzLnJlbmRlclF1ZXVlW2ldLmlkO1xyXG4gICAgICB0aGlzLmNhbWVyYVVCTy53cml0ZURhdGEoY2FtZXJhSW5mbyk7XHJcbiAgICAgIHByaW0uZHJhdyh0aGlzLmNhbWVyYVVCTyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50YXJnZXQuZGlzYWJsZURyYXdCdWZmZXIoMSk7XHJcbiAgICBmb3IgKGxldCBpID0gMCwgY291bnQgPSB0aGlzLm1hcmtlclJlbmRlclF1ZXVlLmxlbmd0aDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgbGV0IHByaW0gPSB0aGlzLm1hcmtlclJlbmRlclF1ZXVlW2ldLnByaW1pdGl2ZTtcclxuICAgICAgbGV0IHRyYW5zID0gdGhpcy5tYXJrZXJSZW5kZXJRdWV1ZVtpXS50cmFuc2Zvcm07XHJcbiAgICAgIFxyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcclxuICAgICAgICBjYW1lcmFJbmZvW2ldID0gdHJhbnMubVtpXTtcclxuICAgICAgfVxyXG4gICAgICBjYW1lcmFJbmZvWzM1XSA9IHRoaXMubWFya2VyUmVuZGVyUXVldWVbaV0uaWQ7XHJcblxyXG4gICAgICB0aGlzLmNhbWVyYVVCTy53cml0ZURhdGEoY2FtZXJhSW5mbyk7XHJcbiAgICAgIHByaW0uZHJhdyh0aGlzLmNhbWVyYVVCTyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnRhcmdldC5lbmFibGVEcmF3QnVmZmVyKDEpO1xyXG5cclxuICAgIC8vIGZsdXNoIHJlbmRlciBxdWV1ZVxyXG4gICAgdGhpcy5yZW5kZXJRdWV1ZSA9IFtdO1xyXG4gICAgdGhpcy5tYXJrZXJSZW5kZXJRdWV1ZSA9IFtdO1xyXG5cclxuICAgIC8vIHJlbmRlcmluZyB0byBzY3JlZW4gZnJhbWVidWZmZXJcclxuICAgIFRhcmdldC5kZWZhdWx0KGdsKS5iaW5kKCk7XHJcbiAgICBFbXB0eVByaW1pdGl2ZS5kcmF3RnJvbVBhcmFtcyh0aGlzLmdsLCA0LCBUb3BvbG9neS5UUklBTkdMRV9TVFJJUCwgdGhpcy5mc01hdGVyaWFsLCB0aGlzLmNhbWVyYVVCTyk7XHJcbiAgICB0aGlzLmZzTWF0ZXJpYWwudW5ib3VuZFRleHR1cmVzKCk7XHJcblxyXG4gICAgZ2wuZmluaXNoKCk7XHJcbiAgfSAvKiBlbmQgKi9cclxuXHJcbiAgLy8gZ2VuaW91cyBmdW5jdGlvbiwgYnV0IGl0IHdvcmtzIVxyXG4gIHN0YXRpYyBhc3luYyB1bnBhY2tQcm9taXNlKHYpIHtcclxuICAgIHJldHVybiB2O1xyXG4gIH0gLyogdW5wYWNrUHJvbWlzZSAqL1xyXG5cclxuICBhc3luYyBhZGRVbml0KGNyZWF0ZUZ1bmN0aW9uLCAuLi5hcmdzKSB7XHJcbiAgICBsZXQgdmFsID0gYXdhaXQgU3lzdGVtLnVucGFja1Byb21pc2UoY3JlYXRlRnVuY3Rpb24odGhpcywgLi4uYXJncykpO1xyXG5cclxuICAgIHZhbC5zeXN0ZW1JZCA9IHRoaXMubGFzdFVuaXRJRCsrO1xyXG4gICAgaWYgKHZhbC5pbml0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICBhd2FpdCBTeXN0ZW0udW5wYWNrUHJvbWlzZSh2YWwuaW5pdCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnVuaXRzW3ZhbC5zeXN0ZW1JZF0gPSB2YWw7XHJcblxyXG4gICAgcmV0dXJuIHZhbDtcclxuICB9IC8qIGFkZFVuaXQgKi9cclxuXHJcbiAgZ2V0VW5pdEJ5SUQoaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnVuaXRzW2lkXTtcclxuICB9IC8qIGdldFVuaXRCeUlEICovXHJcblxyXG4gIGdldFVuaXRCeUNvb3JkKHgsIHkpIHtcclxuICAgIGxldCBpZCA9IE1hdGgucm91bmQodGhpcy50YXJnZXQuZ2V0QXR0YWNobWVudFZhbHVlKDAsIHgsIHkpWzNdKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy51bml0c1tpZF07XHJcbiAgfSAvKiBnZXRVbml0QnlNb3VzZUxvY2F0aW9uICovXHJcblxyXG4gIGdldFBvc2l0aW9uQnlDb29yZCh4LCB5KSB7XHJcbiAgICBsZXQgYXJyID0gdGhpcy50YXJnZXQuZ2V0QXR0YWNobWVudFZhbHVlKDEsIHgsIHkpO1xyXG5cclxuICAgIHJldHVybiBuZXcgbXRoLlZlYzMoYXJyWzBdLCBhcnJbMV0sIGFyclsyXSk7XHJcbiAgfSAvKiBnZXRQb3NpdGlvbkJ5Q29vcmQgKi9cclxuXHJcbiAgYXN5bmMgcnVuKCkge1xyXG4gICAgLy8gaW5pdGlhbGl6ZSBmdWxsc2NyZWVuIG1hdGVyaWFsXHJcbiAgICB0aGlzLmZzTWF0ZXJpYWwgPSBhd2FpdCB0aGlzLmNyZWF0ZU1hdGVyaWFsKFwiLi9zaGFkZXJzL3RhcmdldFwiKTtcclxuICAgIHRoaXMuZnNNYXRlcmlhbC50ZXh0dXJlcyA9IHRoaXMudGFyZ2V0LmF0dGFjaG1lbnRzO1xyXG5cclxuICAgIGxldCBzeXN0ZW0gPSB0aGlzO1xyXG5cclxuICAgIGNvbnN0IHJ1biA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgICBzeXN0ZW0udGltZXIucmVzcG9uc2UoKTtcclxuXHJcbiAgICAgIHN5c3RlbS5zdGFydCgpO1xyXG5cclxuICAgICAgZm9yIChjb25zdCBpZCBpbiBzeXN0ZW0udW5pdHMpIHtcclxuICAgICAgICBsZXQgdW5pdCA9IHN5c3RlbS51bml0c1tpZF07XHJcblxyXG4gICAgICAgIHN5c3RlbS5jdXJyZW50T2JqZWN0SUQgPSB1bml0LnN5c3RlbUlkO1xyXG4gICAgICAgIHVuaXQucmVzcG9uc2Uoc3lzdGVtKTtcclxuXHJcbiAgICAgICAgaWYgKHVuaXQuZG9TdWljaWRlID09PSB0cnVlKSB7XHJcbiAgICAgICAgICBpZiAodW5pdC5jbG9zZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHVuaXQuY2xvc2Uoc3lzdGVtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGRlbGV0ZSBzeXN0ZW0udW5pdHNbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgc3lzdGVtLmVuZCgpO1xyXG5cclxuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShydW4pO1xyXG4gICAgfTtcclxuXHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJ1bik7XHJcbiAgfSAvKiBydW4gKi9cclxufSAvKiBSZW5kZXIgKi9cclxuXHJcbi8qIHJlbmRlci5qcyAqLyIsImNvbnN0IFBBQ0tFVF9UWVBFUyA9IE9iamVjdC5jcmVhdGUobnVsbCk7IC8vIG5vIE1hcCA9IG5vIHBvbHlmaWxsXG5QQUNLRVRfVFlQRVNbXCJvcGVuXCJdID0gXCIwXCI7XG5QQUNLRVRfVFlQRVNbXCJjbG9zZVwiXSA9IFwiMVwiO1xuUEFDS0VUX1RZUEVTW1wicGluZ1wiXSA9IFwiMlwiO1xuUEFDS0VUX1RZUEVTW1wicG9uZ1wiXSA9IFwiM1wiO1xuUEFDS0VUX1RZUEVTW1wibWVzc2FnZVwiXSA9IFwiNFwiO1xuUEFDS0VUX1RZUEVTW1widXBncmFkZVwiXSA9IFwiNVwiO1xuUEFDS0VUX1RZUEVTW1wibm9vcFwiXSA9IFwiNlwiO1xuY29uc3QgUEFDS0VUX1RZUEVTX1JFVkVSU0UgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuT2JqZWN0LmtleXMoUEFDS0VUX1RZUEVTKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgUEFDS0VUX1RZUEVTX1JFVkVSU0VbUEFDS0VUX1RZUEVTW2tleV1dID0ga2V5O1xufSk7XG5jb25zdCBFUlJPUl9QQUNLRVQgPSB7IHR5cGU6IFwiZXJyb3JcIiwgZGF0YTogXCJwYXJzZXIgZXJyb3JcIiB9O1xuZXhwb3J0IHsgUEFDS0VUX1RZUEVTLCBQQUNLRVRfVFlQRVNfUkVWRVJTRSwgRVJST1JfUEFDS0VUIH07XG4iLCJpbXBvcnQgeyBQQUNLRVRfVFlQRVMgfSBmcm9tIFwiLi9jb21tb25zLmpzXCI7XG5jb25zdCB3aXRoTmF0aXZlQmxvYiA9IHR5cGVvZiBCbG9iID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEJsb2IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKEJsb2IpID09PSBcIltvYmplY3QgQmxvYkNvbnN0cnVjdG9yXVwiKTtcbmNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuLy8gQXJyYXlCdWZmZXIuaXNWaWV3IG1ldGhvZCBpcyBub3QgZGVmaW5lZCBpbiBJRTEwXG5jb25zdCBpc1ZpZXcgPSBvYmogPT4ge1xuICAgIHJldHVybiB0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBBcnJheUJ1ZmZlci5pc1ZpZXcob2JqKVxuICAgICAgICA6IG9iaiAmJiBvYmouYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG59O1xuY29uc3QgZW5jb2RlUGFja2V0ID0gKHsgdHlwZSwgZGF0YSB9LCBzdXBwb3J0c0JpbmFyeSwgY2FsbGJhY2spID0+IHtcbiAgICBpZiAod2l0aE5hdGl2ZUJsb2IgJiYgZGF0YSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgaWYgKHN1cHBvcnRzQmluYXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQmxvYkFzQmFzZTY0KGRhdGEsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh3aXRoTmF0aXZlQXJyYXlCdWZmZXIgJiZcbiAgICAgICAgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBpc1ZpZXcoZGF0YSkpKSB7XG4gICAgICAgIGlmIChzdXBwb3J0c0JpbmFyeSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZUJsb2JBc0Jhc2U2NChuZXcgQmxvYihbZGF0YV0pLCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcGxhaW4gc3RyaW5nXG4gICAgcmV0dXJuIGNhbGxiYWNrKFBBQ0tFVF9UWVBFU1t0eXBlXSArIChkYXRhIHx8IFwiXCIpKTtcbn07XG5jb25zdCBlbmNvZGVCbG9iQXNCYXNlNjQgPSAoZGF0YSwgY2FsbGJhY2spID0+IHtcbiAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGZpbGVSZWFkZXIucmVzdWx0LnNwbGl0KFwiLFwiKVsxXTtcbiAgICAgICAgY2FsbGJhY2soXCJiXCIgKyAoY29udGVudCB8fCBcIlwiKSk7XG4gICAgfTtcbiAgICByZXR1cm4gZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGRhdGEpO1xufTtcbmV4cG9ydCBkZWZhdWx0IGVuY29kZVBhY2tldDtcbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3NvY2tldGlvL2Jhc2U2NC1hcnJheWJ1ZmZlclxuY29uc3QgY2hhcnMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG4vLyBVc2UgYSBsb29rdXAgdGFibGUgdG8gZmluZCB0aGUgaW5kZXguXG5jb25zdCBsb29rdXAgPSB0eXBlb2YgVWludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyBbXSA6IG5ldyBVaW50OEFycmF5KDI1Nik7XG5mb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgbG9va3VwW2NoYXJzLmNoYXJDb2RlQXQoaSldID0gaTtcbn1cbmV4cG9ydCBjb25zdCBlbmNvZGUgPSAoYXJyYXlidWZmZXIpID0+IHtcbiAgICBsZXQgYnl0ZXMgPSBuZXcgVWludDhBcnJheShhcnJheWJ1ZmZlciksIGksIGxlbiA9IGJ5dGVzLmxlbmd0aCwgYmFzZTY0ID0gJyc7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSAzKSB7XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpXSA+PiAyXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaV0gJiAzKSA8PCA0KSB8IChieXRlc1tpICsgMV0gPj4gNCldO1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbKChieXRlc1tpICsgMV0gJiAxNSkgPDwgMikgfCAoYnl0ZXNbaSArIDJdID4+IDYpXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzW2J5dGVzW2kgKyAyXSAmIDYzXTtcbiAgICB9XG4gICAgaWYgKGxlbiAlIDMgPT09IDIpIHtcbiAgICAgICAgYmFzZTY0ID0gYmFzZTY0LnN1YnN0cmluZygwLCBiYXNlNjQubGVuZ3RoIC0gMSkgKyAnPSc7XG4gICAgfVxuICAgIGVsc2UgaWYgKGxlbiAlIDMgPT09IDEpIHtcbiAgICAgICAgYmFzZTY0ID0gYmFzZTY0LnN1YnN0cmluZygwLCBiYXNlNjQubGVuZ3RoIC0gMikgKyAnPT0nO1xuICAgIH1cbiAgICByZXR1cm4gYmFzZTY0O1xufTtcbmV4cG9ydCBjb25zdCBkZWNvZGUgPSAoYmFzZTY0KSA9PiB7XG4gICAgbGV0IGJ1ZmZlckxlbmd0aCA9IGJhc2U2NC5sZW5ndGggKiAwLjc1LCBsZW4gPSBiYXNlNjQubGVuZ3RoLCBpLCBwID0gMCwgZW5jb2RlZDEsIGVuY29kZWQyLCBlbmNvZGVkMywgZW5jb2RlZDQ7XG4gICAgaWYgKGJhc2U2NFtiYXNlNjQubGVuZ3RoIC0gMV0gPT09ICc9Jykge1xuICAgICAgICBidWZmZXJMZW5ndGgtLTtcbiAgICAgICAgaWYgKGJhc2U2NFtiYXNlNjQubGVuZ3RoIC0gMl0gPT09ICc9Jykge1xuICAgICAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgYXJyYXlidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoYnVmZmVyTGVuZ3RoKSwgYnl0ZXMgPSBuZXcgVWludDhBcnJheShhcnJheWJ1ZmZlcik7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgICAgIGVuY29kZWQxID0gbG9va3VwW2Jhc2U2NC5jaGFyQ29kZUF0KGkpXTtcbiAgICAgICAgZW5jb2RlZDIgPSBsb29rdXBbYmFzZTY0LmNoYXJDb2RlQXQoaSArIDEpXTtcbiAgICAgICAgZW5jb2RlZDMgPSBsb29rdXBbYmFzZTY0LmNoYXJDb2RlQXQoaSArIDIpXTtcbiAgICAgICAgZW5jb2RlZDQgPSBsb29rdXBbYmFzZTY0LmNoYXJDb2RlQXQoaSArIDMpXTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9IChlbmNvZGVkMSA8PCAyKSB8IChlbmNvZGVkMiA+PiA0KTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDIgJiAxNSkgPDwgNCkgfCAoZW5jb2RlZDMgPj4gMik7XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoKGVuY29kZWQzICYgMykgPDwgNikgfCAoZW5jb2RlZDQgJiA2Myk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheWJ1ZmZlcjtcbn07XG4iLCJpbXBvcnQgeyBFUlJPUl9QQUNLRVQsIFBBQ0tFVF9UWVBFU19SRVZFUlNFIH0gZnJvbSBcIi4vY29tbW9ucy5qc1wiO1xuaW1wb3J0IHsgZGVjb2RlIH0gZnJvbSBcIi4vY29udHJpYi9iYXNlNjQtYXJyYXlidWZmZXIuanNcIjtcbmNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuY29uc3QgZGVjb2RlUGFja2V0ID0gKGVuY29kZWRQYWNrZXQsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBpZiAodHlwZW9mIGVuY29kZWRQYWNrZXQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFwibWVzc2FnZVwiLFxuICAgICAgICAgICAgZGF0YTogbWFwQmluYXJ5KGVuY29kZWRQYWNrZXQsIGJpbmFyeVR5cGUpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHR5cGUgPSBlbmNvZGVkUGFja2V0LmNoYXJBdCgwKTtcbiAgICBpZiAodHlwZSA9PT0gXCJiXCIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFwibWVzc2FnZVwiLFxuICAgICAgICAgICAgZGF0YTogZGVjb2RlQmFzZTY0UGFja2V0KGVuY29kZWRQYWNrZXQuc3Vic3RyaW5nKDEpLCBiaW5hcnlUeXBlKVxuICAgICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBwYWNrZXRUeXBlID0gUEFDS0VUX1RZUEVTX1JFVkVSU0VbdHlwZV07XG4gICAgaWYgKCFwYWNrZXRUeXBlKSB7XG4gICAgICAgIHJldHVybiBFUlJPUl9QQUNLRVQ7XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVkUGFja2V0Lmxlbmd0aCA+IDFcbiAgICAgICAgPyB7XG4gICAgICAgICAgICB0eXBlOiBQQUNLRVRfVFlQRVNfUkVWRVJTRVt0eXBlXSxcbiAgICAgICAgICAgIGRhdGE6IGVuY29kZWRQYWNrZXQuc3Vic3RyaW5nKDEpXG4gICAgICAgIH1cbiAgICAgICAgOiB7XG4gICAgICAgICAgICB0eXBlOiBQQUNLRVRfVFlQRVNfUkVWRVJTRVt0eXBlXVxuICAgICAgICB9O1xufTtcbmNvbnN0IGRlY29kZUJhc2U2NFBhY2tldCA9IChkYXRhLCBiaW5hcnlUeXBlKSA9PiB7XG4gICAgaWYgKHdpdGhOYXRpdmVBcnJheUJ1ZmZlcikge1xuICAgICAgICBjb25zdCBkZWNvZGVkID0gZGVjb2RlKGRhdGEpO1xuICAgICAgICByZXR1cm4gbWFwQmluYXJ5KGRlY29kZWQsIGJpbmFyeVR5cGUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHsgYmFzZTY0OiB0cnVlLCBkYXRhIH07IC8vIGZhbGxiYWNrIGZvciBvbGQgYnJvd3NlcnNcbiAgICB9XG59O1xuY29uc3QgbWFwQmluYXJ5ID0gKGRhdGEsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBzd2l0Y2ggKGJpbmFyeVR5cGUpIHtcbiAgICAgICAgY2FzZSBcImJsb2JcIjpcbiAgICAgICAgICAgIHJldHVybiBkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgPyBuZXcgQmxvYihbZGF0YV0pIDogZGF0YTtcbiAgICAgICAgY2FzZSBcImFycmF5YnVmZmVyXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZGF0YTsgLy8gYXNzdW1pbmcgdGhlIGRhdGEgaXMgYWxyZWFkeSBhbiBBcnJheUJ1ZmZlclxuICAgIH1cbn07XG5leHBvcnQgZGVmYXVsdCBkZWNvZGVQYWNrZXQ7XG4iLCJpbXBvcnQgZW5jb2RlUGFja2V0IGZyb20gXCIuL2VuY29kZVBhY2tldC5qc1wiO1xuaW1wb3J0IGRlY29kZVBhY2tldCBmcm9tIFwiLi9kZWNvZGVQYWNrZXQuanNcIjtcbmNvbnN0IFNFUEFSQVRPUiA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMzApOyAvLyBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRGVsaW1pdGVyI0FTQ0lJX2RlbGltaXRlZF90ZXh0XG5jb25zdCBlbmNvZGVQYXlsb2FkID0gKHBhY2tldHMsIGNhbGxiYWNrKSA9PiB7XG4gICAgLy8gc29tZSBwYWNrZXRzIG1heSBiZSBhZGRlZCB0byB0aGUgYXJyYXkgd2hpbGUgZW5jb2RpbmcsIHNvIHRoZSBpbml0aWFsIGxlbmd0aCBtdXN0IGJlIHNhdmVkXG4gICAgY29uc3QgbGVuZ3RoID0gcGFja2V0cy5sZW5ndGg7XG4gICAgY29uc3QgZW5jb2RlZFBhY2tldHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHBhY2tldHMuZm9yRWFjaCgocGFja2V0LCBpKSA9PiB7XG4gICAgICAgIC8vIGZvcmNlIGJhc2U2NCBlbmNvZGluZyBmb3IgYmluYXJ5IHBhY2tldHNcbiAgICAgICAgZW5jb2RlUGFja2V0KHBhY2tldCwgZmFsc2UsIGVuY29kZWRQYWNrZXQgPT4ge1xuICAgICAgICAgICAgZW5jb2RlZFBhY2tldHNbaV0gPSBlbmNvZGVkUGFja2V0O1xuICAgICAgICAgICAgaWYgKCsrY291bnQgPT09IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVuY29kZWRQYWNrZXRzLmpvaW4oU0VQQVJBVE9SKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcbmNvbnN0IGRlY29kZVBheWxvYWQgPSAoZW5jb2RlZFBheWxvYWQsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBjb25zdCBlbmNvZGVkUGFja2V0cyA9IGVuY29kZWRQYXlsb2FkLnNwbGl0KFNFUEFSQVRPUik7XG4gICAgY29uc3QgcGFja2V0cyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW5jb2RlZFBhY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZGVjb2RlZFBhY2tldCA9IGRlY29kZVBhY2tldChlbmNvZGVkUGFja2V0c1tpXSwgYmluYXJ5VHlwZSk7XG4gICAgICAgIHBhY2tldHMucHVzaChkZWNvZGVkUGFja2V0KTtcbiAgICAgICAgaWYgKGRlY29kZWRQYWNrZXQudHlwZSA9PT0gXCJlcnJvclwiKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGFja2V0cztcbn07XG5leHBvcnQgY29uc3QgcHJvdG9jb2wgPSA0O1xuZXhwb3J0IHsgZW5jb2RlUGFja2V0LCBlbmNvZGVQYXlsb2FkLCBkZWNvZGVQYWNrZXQsIGRlY29kZVBheWxvYWQgfTtcbiIsIi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XG59XG5cbi8qKlxuICogTWl4aW4gdGhlIGVtaXR0ZXIgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtaXhpbihvYmopIHtcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgb2JqW2tleV0gPSBFbWl0dGVyLnByb3RvdHlwZVtrZXldO1xuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogTGlzdGVuIG9uIHRoZSBnaXZlbiBgZXZlbnRgIHdpdGggYGZuYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9XG5FbWl0dGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICAodGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gfHwgW10pXG4gICAgLnB1c2goZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICBmdW5jdGlvbiBvbigpIHtcbiAgICB0aGlzLm9mZihldmVudCwgb24pO1xuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBvbi5mbiA9IGZuO1xuICB0aGlzLm9uKGV2ZW50LCBvbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIC8vIGFsbFxuICBpZiAoMCA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBzcGVjaWZpYyBldmVudFxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcbiAgaWYgKCFjYWxsYmFja3MpIHJldHVybiB0aGlzO1xuXG4gIC8vIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgaWYgKDEgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcbiAgdmFyIGNiO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNiID0gY2FsbGJhY2tzW2ldO1xuICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIGV2ZW50IHNwZWNpZmljIGFycmF5cyBmb3IgZXZlbnQgdHlwZXMgdGhhdCBub1xuICAvLyBvbmUgaXMgc3Vic2NyaWJlZCBmb3IgdG8gYXZvaWQgbWVtb3J5IGxlYWsuXG4gIGlmIChjYWxsYmFja3MubGVuZ3RoID09PSAwKSB7XG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKVxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcblxuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICB9XG5cbiAgaWYgKGNhbGxiYWNrcykge1xuICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBhbGlhcyB1c2VkIGZvciByZXNlcnZlZCBldmVudHMgKHByb3RlY3RlZCBtZXRob2QpXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0UmVzZXJ2ZWQgPSBFbWl0dGVyLnByb3RvdHlwZS5lbWl0O1xuXG4vKipcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gIHJldHVybiB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGVtaXR0ZXIgaGFzIGBldmVudGAgaGFuZGxlcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5oYXNMaXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHJldHVybiAhISB0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoO1xufTtcbiIsImV4cG9ydCBjb25zdCBnbG9iYWxUaGlzU2hpbSA9ICgoKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpO1xuICAgIH1cbn0pKCk7XG4iLCJpbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzIH0gZnJvbSBcIi4vZ2xvYmFsVGhpcy5qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIHBpY2sob2JqLCAuLi5hdHRyKSB7XG4gICAgcmV0dXJuIGF0dHIucmVkdWNlKChhY2MsIGspID0+IHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgYWNjW2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xufVxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgcmVhbCB0aW1lb3V0IGZ1bmN0aW9ucyBzbyB0aGV5IGNhbiBiZSB1c2VkIHdoZW4gb3ZlcnJpZGRlblxuY29uc3QgTkFUSVZFX1NFVF9USU1FT1VUID0gZ2xvYmFsVGhpcy5zZXRUaW1lb3V0O1xuY29uc3QgTkFUSVZFX0NMRUFSX1RJTUVPVVQgPSBnbG9iYWxUaGlzLmNsZWFyVGltZW91dDtcbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsVGltZXJGdW5jdGlvbnMob2JqLCBvcHRzKSB7XG4gICAgaWYgKG9wdHMudXNlTmF0aXZlVGltZXJzKSB7XG4gICAgICAgIG9iai5zZXRUaW1lb3V0Rm4gPSBOQVRJVkVfU0VUX1RJTUVPVVQuYmluZChnbG9iYWxUaGlzKTtcbiAgICAgICAgb2JqLmNsZWFyVGltZW91dEZuID0gTkFUSVZFX0NMRUFSX1RJTUVPVVQuYmluZChnbG9iYWxUaGlzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG9iai5zZXRUaW1lb3V0Rm4gPSBnbG9iYWxUaGlzLnNldFRpbWVvdXQuYmluZChnbG9iYWxUaGlzKTtcbiAgICAgICAgb2JqLmNsZWFyVGltZW91dEZuID0gZ2xvYmFsVGhpcy5jbGVhclRpbWVvdXQuYmluZChnbG9iYWxUaGlzKTtcbiAgICB9XG59XG4vLyBiYXNlNjQgZW5jb2RlZCBidWZmZXJzIGFyZSBhYm91dCAzMyUgYmlnZ2VyIChodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQpXG5jb25zdCBCQVNFNjRfT1ZFUkhFQUQgPSAxLjMzO1xuLy8gd2UgY291bGQgYWxzbyBoYXZlIHVzZWQgYG5ldyBCbG9iKFtvYmpdKS5zaXplYCwgYnV0IGl0IGlzbid0IHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydCBmdW5jdGlvbiBieXRlTGVuZ3RoKG9iaikge1xuICAgIGlmICh0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB1dGY4TGVuZ3RoKG9iaik7XG4gICAgfVxuICAgIC8vIGFycmF5YnVmZmVyIG9yIGJsb2JcbiAgICByZXR1cm4gTWF0aC5jZWlsKChvYmouYnl0ZUxlbmd0aCB8fCBvYmouc2l6ZSkgKiBCQVNFNjRfT1ZFUkhFQUQpO1xufVxuZnVuY3Rpb24gdXRmOExlbmd0aChzdHIpIHtcbiAgICBsZXQgYyA9IDAsIGxlbmd0aCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBzdHIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICAgICAgICBsZW5ndGggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjIDwgMHg4MDApIHtcbiAgICAgICAgICAgIGxlbmd0aCArPSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPCAweGQ4MDAgfHwgYyA+PSAweGUwMDApIHtcbiAgICAgICAgICAgIGxlbmd0aCArPSAzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgbGVuZ3RoICs9IDQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxlbmd0aDtcbn1cbiIsImltcG9ydCB7IGRlY29kZVBhY2tldCB9IGZyb20gXCJlbmdpbmUuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IGluc3RhbGxUaW1lckZ1bmN0aW9ucyB9IGZyb20gXCIuL3V0aWwuanNcIjtcbmNsYXNzIFRyYW5zcG9ydEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKHJlYXNvbiwgZGVzY3JpcHRpb24sIGNvbnRleHQpIHtcbiAgICAgICAgc3VwZXIocmVhc29uKTtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnR5cGUgPSBcIlRyYW5zcG9ydEVycm9yXCI7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFRyYW5zcG9ydCBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIFRyYW5zcG9ydCBhYnN0cmFjdCBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgaW5zdGFsbFRpbWVyRnVuY3Rpb25zKHRoaXMsIG9wdHMpO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICB0aGlzLnF1ZXJ5ID0gb3B0cy5xdWVyeTtcbiAgICAgICAgdGhpcy5zb2NrZXQgPSBvcHRzLnNvY2tldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcmVhc29uXG4gICAgICogQHBhcmFtIGRlc2NyaXB0aW9uXG4gICAgICogQHBhcmFtIGNvbnRleHQgLSB0aGUgZXJyb3IgY29udGV4dFxuICAgICAqIEByZXR1cm4ge1RyYW5zcG9ydH0gZm9yIGNoYWluaW5nXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uRXJyb3IocmVhc29uLCBkZXNjcmlwdGlvbiwgY29udGV4dCkge1xuICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBuZXcgVHJhbnNwb3J0RXJyb3IocmVhc29uLCBkZXNjcmlwdGlvbiwgY29udGV4dCkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3BlbnMgdGhlIHRyYW5zcG9ydC5cbiAgICAgKi9cbiAgICBvcGVuKCkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcIm9wZW5pbmdcIjtcbiAgICAgICAgdGhpcy5kb09wZW4oKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlcyB0aGUgdHJhbnNwb3J0LlxuICAgICAqL1xuICAgIGNsb3NlKCkge1xuICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSBcIm9wZW5pbmdcIiB8fCB0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlblwiKSB7XG4gICAgICAgICAgICB0aGlzLmRvQ2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMub25DbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBtdWx0aXBsZSBwYWNrZXRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gcGFja2V0c1xuICAgICAqL1xuICAgIHNlbmQocGFja2V0cykge1xuICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSBcIm9wZW5cIikge1xuICAgICAgICAgICAgdGhpcy53cml0ZShwYWNrZXRzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHRoaXMgbWlnaHQgaGFwcGVuIGlmIHRoZSB0cmFuc3BvcnQgd2FzIHNpbGVudGx5IGNsb3NlZCBpbiB0aGUgYmVmb3JldW5sb2FkIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBvcGVuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25PcGVuKCkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcIm9wZW5cIjtcbiAgICAgICAgdGhpcy53cml0YWJsZSA9IHRydWU7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcIm9wZW5cIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aXRoIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGF0YVxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvbkRhdGEoZGF0YSkge1xuICAgICAgICBjb25zdCBwYWNrZXQgPSBkZWNvZGVQYWNrZXQoZGF0YSwgdGhpcy5zb2NrZXQuYmluYXJ5VHlwZSk7XG4gICAgICAgIHRoaXMub25QYWNrZXQocGFja2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggYSBkZWNvZGVkIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvblBhY2tldChwYWNrZXQpIHtcbiAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwicGFja2V0XCIsIHBhY2tldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGNsb3NlLlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uQ2xvc2UoZGV0YWlscykge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJjbG9zZVwiLCBkZXRhaWxzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGF1c2VzIHRoZSB0cmFuc3BvcnQsIGluIG9yZGVyIG5vdCB0byBsb3NlIHBhY2tldHMgZHVyaW5nIGFuIHVwZ3JhZGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb25QYXVzZVxuICAgICAqL1xuICAgIHBhdXNlKG9uUGF1c2UpIHsgfVxufVxuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vdW5zaGlmdGlvL3llYXN0XG4ndXNlIHN0cmljdCc7XG5jb25zdCBhbHBoYWJldCA9ICcwMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ei1fJy5zcGxpdCgnJyksIGxlbmd0aCA9IDY0LCBtYXAgPSB7fTtcbmxldCBzZWVkID0gMCwgaSA9IDAsIHByZXY7XG4vKipcbiAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHNwZWNpZmllZCBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBudW1iZXIuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKG51bSkge1xuICAgIGxldCBlbmNvZGVkID0gJyc7XG4gICAgZG8ge1xuICAgICAgICBlbmNvZGVkID0gYWxwaGFiZXRbbnVtICUgbGVuZ3RoXSArIGVuY29kZWQ7XG4gICAgICAgIG51bSA9IE1hdGguZmxvb3IobnVtIC8gbGVuZ3RoKTtcbiAgICB9IHdoaWxlIChudW0gPiAwKTtcbiAgICByZXR1cm4gZW5jb2RlZDtcbn1cbi8qKlxuICogUmV0dXJuIHRoZSBpbnRlZ2VyIHZhbHVlIHNwZWNpZmllZCBieSB0aGUgZ2l2ZW4gc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBjb252ZXJ0LlxuICogQHJldHVybnMge051bWJlcn0gVGhlIGludGVnZXIgdmFsdWUgcmVwcmVzZW50ZWQgYnkgdGhlIHN0cmluZy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUoc3RyKSB7XG4gICAgbGV0IGRlY29kZWQgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVjb2RlZCA9IGRlY29kZWQgKiBsZW5ndGggKyBtYXBbc3RyLmNoYXJBdChpKV07XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVkO1xufVxuLyoqXG4gKiBZZWFzdDogQSB0aW55IGdyb3dpbmcgaWQgZ2VuZXJhdG9yLlxuICpcbiAqIEByZXR1cm5zIHtTdHJpbmd9IEEgdW5pcXVlIGlkLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHllYXN0KCkge1xuICAgIGNvbnN0IG5vdyA9IGVuY29kZSgrbmV3IERhdGUoKSk7XG4gICAgaWYgKG5vdyAhPT0gcHJldilcbiAgICAgICAgcmV0dXJuIHNlZWQgPSAwLCBwcmV2ID0gbm93O1xuICAgIHJldHVybiBub3cgKyAnLicgKyBlbmNvZGUoc2VlZCsrKTtcbn1cbi8vXG4vLyBNYXAgZWFjaCBjaGFyYWN0ZXIgdG8gaXRzIGluZGV4LlxuLy9cbmZvciAoOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgbWFwW2FscGhhYmV0W2ldXSA9IGk7XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9nYWxrbi9xdWVyeXN0cmluZ1xuLyoqXG4gKiBDb21waWxlcyBhIHF1ZXJ5c3RyaW5nXG4gKiBSZXR1cm5zIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgb2JqZWN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZShvYmopIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcmJztcbiAgICAgICAgICAgIHN0ciArPSBlbmNvZGVVUklDb21wb25lbnQoaSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuLyoqXG4gKiBQYXJzZXMgYSBzaW1wbGUgcXVlcnlzdHJpbmcgaW50byBhbiBvYmplY3RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlKHFzKSB7XG4gICAgbGV0IHFyeSA9IHt9O1xuICAgIGxldCBwYWlycyA9IHFzLnNwbGl0KCcmJyk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBwYWlycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbGV0IHBhaXIgPSBwYWlyc1tpXS5zcGxpdCgnPScpO1xuICAgICAgICBxcnlbZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIHFyeTtcbn1cbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2NvbXBvbmVudC9oYXMtY29yc1xubGV0IHZhbHVlID0gZmFsc2U7XG50cnkge1xuICAgIHZhbHVlID0gdHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbn1cbmNhdGNoIChlcnIpIHtcbiAgICAvLyBpZiBYTUxIdHRwIHN1cHBvcnQgaXMgZGlzYWJsZWQgaW4gSUUgdGhlbiBpdCB3aWxsIHRocm93XG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gY3JlYXRlXG59XG5leHBvcnQgY29uc3QgaGFzQ09SUyA9IHZhbHVlO1xuIiwiLy8gYnJvd3NlciBzaGltIGZvciB4bWxodHRwcmVxdWVzdCBtb2R1bGVcbmltcG9ydCB7IGhhc0NPUlMgfSBmcm9tIFwiLi4vY29udHJpYi9oYXMtY29ycy5qc1wiO1xuaW1wb3J0IHsgZ2xvYmFsVGhpc1NoaW0gYXMgZ2xvYmFsVGhpcyB9IGZyb20gXCIuLi9nbG9iYWxUaGlzLmpzXCI7XG5leHBvcnQgZnVuY3Rpb24gWEhSKG9wdHMpIHtcbiAgICBjb25zdCB4ZG9tYWluID0gb3B0cy54ZG9tYWluO1xuICAgIC8vIFhNTEh0dHBSZXF1ZXN0IGNhbiBiZSBkaXNhYmxlZCBvbiBJRVxuICAgIHRyeSB7XG4gICAgICAgIGlmIChcInVuZGVmaW5lZFwiICE9PSB0eXBlb2YgWE1MSHR0cFJlcXVlc3QgJiYgKCF4ZG9tYWluIHx8IGhhc0NPUlMpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHsgfVxuICAgIGlmICgheGRvbWFpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBnbG9iYWxUaGlzW1tcIkFjdGl2ZVwiXS5jb25jYXQoXCJPYmplY3RcIikuam9pbihcIlhcIildKFwiTWljcm9zb2Z0LlhNTEhUVFBcIik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IFRyYW5zcG9ydCB9IGZyb20gXCIuLi90cmFuc3BvcnQuanNcIjtcbmltcG9ydCB7IHllYXN0IH0gZnJvbSBcIi4uL2NvbnRyaWIveWVhc3QuanNcIjtcbmltcG9ydCB7IGVuY29kZSB9IGZyb20gXCIuLi9jb250cmliL3BhcnNlcXMuanNcIjtcbmltcG9ydCB7IGVuY29kZVBheWxvYWQsIGRlY29kZVBheWxvYWQgfSBmcm9tIFwiZW5naW5lLmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgWEhSIGFzIFhNTEh0dHBSZXF1ZXN0IH0gZnJvbSBcIi4veG1saHR0cHJlcXVlc3QuanNcIjtcbmltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgaW5zdGFsbFRpbWVyRnVuY3Rpb25zLCBwaWNrIH0gZnJvbSBcIi4uL3V0aWwuanNcIjtcbmltcG9ydCB7IGdsb2JhbFRoaXNTaGltIGFzIGdsb2JhbFRoaXMgfSBmcm9tIFwiLi4vZ2xvYmFsVGhpcy5qc1wiO1xuZnVuY3Rpb24gZW1wdHkoKSB7IH1cbmNvbnN0IGhhc1hIUjIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCh7XG4gICAgICAgIHhkb21haW46IGZhbHNlLFxuICAgIH0pO1xuICAgIHJldHVybiBudWxsICE9IHhoci5yZXNwb25zZVR5cGU7XG59KSgpO1xuZXhwb3J0IGNsYXNzIFBvbGxpbmcgZXh0ZW5kcyBUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIFhIUiBQb2xsaW5nIGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIob3B0cyk7XG4gICAgICAgIHRoaXMucG9sbGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBjb25zdCBpc1NTTCA9IFwiaHR0cHM6XCIgPT09IGxvY2F0aW9uLnByb3RvY29sO1xuICAgICAgICAgICAgbGV0IHBvcnQgPSBsb2NhdGlvbi5wb3J0O1xuICAgICAgICAgICAgLy8gc29tZSB1c2VyIGFnZW50cyBoYXZlIGVtcHR5IGBsb2NhdGlvbi5wb3J0YFxuICAgICAgICAgICAgaWYgKCFwb3J0KSB7XG4gICAgICAgICAgICAgICAgcG9ydCA9IGlzU1NMID8gXCI0NDNcIiA6IFwiODBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMueGQgPVxuICAgICAgICAgICAgICAgICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSAhPT0gbG9jYXRpb24uaG9zdG5hbWUpIHx8XG4gICAgICAgICAgICAgICAgICAgIHBvcnQgIT09IG9wdHMucG9ydDtcbiAgICAgICAgICAgIHRoaXMueHMgPSBvcHRzLnNlY3VyZSAhPT0gaXNTU0w7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFhIUiBzdXBwb3J0cyBiaW5hcnlcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGZvcmNlQmFzZTY0ID0gb3B0cyAmJiBvcHRzLmZvcmNlQmFzZTY0O1xuICAgICAgICB0aGlzLnN1cHBvcnRzQmluYXJ5ID0gaGFzWEhSMiAmJiAhZm9yY2VCYXNlNjQ7XG4gICAgfVxuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gXCJwb2xsaW5nXCI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE9wZW5zIHRoZSBzb2NrZXQgKHRyaWdnZXJzIHBvbGxpbmcpLiBXZSB3cml0ZSBhIFBJTkcgbWVzc2FnZSB0byBkZXRlcm1pbmVcbiAgICAgKiB3aGVuIHRoZSB0cmFuc3BvcnQgaXMgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBkb09wZW4oKSB7XG4gICAgICAgIHRoaXMucG9sbCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXVzZXMgcG9sbGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uUGF1c2UgLSBjYWxsYmFjayB1cG9uIGJ1ZmZlcnMgYXJlIGZsdXNoZWQgYW5kIHRyYW5zcG9ydCBpcyBwYXVzZWRcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIHBhdXNlKG9uUGF1c2UpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJwYXVzaW5nXCI7XG4gICAgICAgIGNvbnN0IHBhdXNlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJwYXVzZWRcIjtcbiAgICAgICAgICAgIG9uUGF1c2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMucG9sbGluZyB8fCAhdGhpcy53cml0YWJsZSkge1xuICAgICAgICAgICAgbGV0IHRvdGFsID0gMDtcbiAgICAgICAgICAgIGlmICh0aGlzLnBvbGxpbmcpIHtcbiAgICAgICAgICAgICAgICB0b3RhbCsrO1xuICAgICAgICAgICAgICAgIHRoaXMub25jZShcInBvbGxDb21wbGV0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC0tdG90YWwgfHwgcGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy53cml0YWJsZSkge1xuICAgICAgICAgICAgICAgIHRvdGFsKys7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwiZHJhaW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAtLXRvdGFsIHx8IHBhdXNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXVzZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBwb2xsaW5nIGN5Y2xlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwb2xsKCkge1xuICAgICAgICB0aGlzLnBvbGxpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmRvUG9sbCgpO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBvbGxcIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE92ZXJsb2FkcyBvbkRhdGEgdG8gZGV0ZWN0IHBheWxvYWRzLlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uRGF0YShkYXRhKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrID0gKHBhY2tldCkgPT4ge1xuICAgICAgICAgICAgLy8gaWYgaXRzIHRoZSBmaXJzdCBtZXNzYWdlIHdlIGNvbnNpZGVyIHRoZSB0cmFuc3BvcnQgb3BlblxuICAgICAgICAgICAgaWYgKFwib3BlbmluZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgJiYgcGFja2V0LnR5cGUgPT09IFwib3BlblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbk9wZW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIGl0cyBhIGNsb3NlIHBhY2tldCwgd2UgY2xvc2UgdGhlIG9uZ29pbmcgcmVxdWVzdHNcbiAgICAgICAgICAgIGlmIChcImNsb3NlXCIgPT09IHBhY2tldC50eXBlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkNsb3NlKHsgZGVzY3JpcHRpb246IFwidHJhbnNwb3J0IGNsb3NlZCBieSB0aGUgc2VydmVyXCIgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGJ5cGFzcyBvbkRhdGEgYW5kIGhhbmRsZSB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgdGhpcy5vblBhY2tldChwYWNrZXQpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBkZWNvZGUgcGF5bG9hZFxuICAgICAgICBkZWNvZGVQYXlsb2FkKGRhdGEsIHRoaXMuc29ja2V0LmJpbmFyeVR5cGUpLmZvckVhY2goY2FsbGJhY2spO1xuICAgICAgICAvLyBpZiBhbiBldmVudCBkaWQgbm90IHRyaWdnZXIgY2xvc2luZ1xuICAgICAgICBpZiAoXCJjbG9zZWRcIiAhPT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAvLyBpZiB3ZSBnb3QgZGF0YSB3ZSdyZSBub3QgcG9sbGluZ1xuICAgICAgICAgICAgdGhpcy5wb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBvbGxDb21wbGV0ZVwiKTtcbiAgICAgICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2xsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBGb3IgcG9sbGluZywgc2VuZCBhIGNsb3NlIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBkb0Nsb3NlKCkge1xuICAgICAgICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMud3JpdGUoW3sgdHlwZTogXCJjbG9zZVwiIH1dKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpbiBjYXNlIHdlJ3JlIHRyeWluZyB0byBjbG9zZSB3aGlsZVxuICAgICAgICAgICAgLy8gaGFuZHNoYWtpbmcgaXMgaW4gcHJvZ3Jlc3MgKEdILTE2NClcbiAgICAgICAgICAgIHRoaXMub25jZShcIm9wZW5cIiwgY2xvc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyaXRlcyBhIHBhY2tldHMgcGF5bG9hZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhY2tldHMgLSBkYXRhIHBhY2tldHNcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgd3JpdGUocGFja2V0cykge1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIGVuY29kZVBheWxvYWQocGFja2V0cywgKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZG9Xcml0ZShkYXRhLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy53cml0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIHVyaSBmb3IgY29ubmVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdXJpKCkge1xuICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLnF1ZXJ5IHx8IHt9O1xuICAgICAgICBjb25zdCBzY2hlbWEgPSB0aGlzLm9wdHMuc2VjdXJlID8gXCJodHRwc1wiIDogXCJodHRwXCI7XG4gICAgICAgIGxldCBwb3J0ID0gXCJcIjtcbiAgICAgICAgLy8gY2FjaGUgYnVzdGluZyBpcyBmb3JjZWRcbiAgICAgICAgaWYgKGZhbHNlICE9PSB0aGlzLm9wdHMudGltZXN0YW1wUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIHF1ZXJ5W3RoaXMub3B0cy50aW1lc3RhbXBQYXJhbV0gPSB5ZWFzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5zdXBwb3J0c0JpbmFyeSAmJiAhcXVlcnkuc2lkKSB7XG4gICAgICAgICAgICBxdWVyeS5iNjQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIC8vIGF2b2lkIHBvcnQgaWYgZGVmYXVsdCBmb3Igc2NoZW1hXG4gICAgICAgIGlmICh0aGlzLm9wdHMucG9ydCAmJlxuICAgICAgICAgICAgKChcImh0dHBzXCIgPT09IHNjaGVtYSAmJiBOdW1iZXIodGhpcy5vcHRzLnBvcnQpICE9PSA0NDMpIHx8XG4gICAgICAgICAgICAgICAgKFwiaHR0cFwiID09PSBzY2hlbWEgJiYgTnVtYmVyKHRoaXMub3B0cy5wb3J0KSAhPT0gODApKSkge1xuICAgICAgICAgICAgcG9ydCA9IFwiOlwiICsgdGhpcy5vcHRzLnBvcnQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW5jb2RlZFF1ZXJ5ID0gZW5jb2RlKHF1ZXJ5KTtcbiAgICAgICAgY29uc3QgaXB2NiA9IHRoaXMub3B0cy5ob3N0bmFtZS5pbmRleE9mKFwiOlwiKSAhPT0gLTE7XG4gICAgICAgIHJldHVybiAoc2NoZW1hICtcbiAgICAgICAgICAgIFwiOi8vXCIgK1xuICAgICAgICAgICAgKGlwdjYgPyBcIltcIiArIHRoaXMub3B0cy5ob3N0bmFtZSArIFwiXVwiIDogdGhpcy5vcHRzLmhvc3RuYW1lKSArXG4gICAgICAgICAgICBwb3J0ICtcbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoICtcbiAgICAgICAgICAgIChlbmNvZGVkUXVlcnkubGVuZ3RoID8gXCI/XCIgKyBlbmNvZGVkUXVlcnkgOiBcIlwiKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSByZXF1ZXN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcmVxdWVzdChvcHRzID0ge30pIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihvcHRzLCB7IHhkOiB0aGlzLnhkLCB4czogdGhpcy54cyB9LCB0aGlzLm9wdHMpO1xuICAgICAgICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcy51cmkoKSwgb3B0cyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGF0YSB0byBzZW5kLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxlZCB1cG9uIGZsdXNoLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZG9Xcml0ZShkYXRhLCBmbikge1xuICAgICAgICBjb25zdCByZXEgPSB0aGlzLnJlcXVlc3Qoe1xuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIH0pO1xuICAgICAgICByZXEub24oXCJzdWNjZXNzXCIsIGZuKTtcbiAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgKHhoclN0YXR1cywgY29udGV4dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKFwieGhyIHBvc3QgZXJyb3JcIiwgeGhyU3RhdHVzLCBjb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBhIHBvbGwgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGRvUG9sbCgpIHtcbiAgICAgICAgY29uc3QgcmVxID0gdGhpcy5yZXF1ZXN0KCk7XG4gICAgICAgIHJlcS5vbihcImRhdGFcIiwgdGhpcy5vbkRhdGEuYmluZCh0aGlzKSk7XG4gICAgICAgIHJlcS5vbihcImVycm9yXCIsICh4aHJTdGF0dXMsIGNvbnRleHQpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihcInhociBwb2xsIGVycm9yXCIsIHhoclN0YXR1cywgY29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnBvbGxYaHIgPSByZXE7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFJlcXVlc3QgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodXJpLCBvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0cztcbiAgICAgICAgdGhpcy5tZXRob2QgPSBvcHRzLm1ldGhvZCB8fCBcIkdFVFwiO1xuICAgICAgICB0aGlzLnVyaSA9IHVyaTtcbiAgICAgICAgdGhpcy5hc3luYyA9IGZhbHNlICE9PSBvcHRzLmFzeW5jO1xuICAgICAgICB0aGlzLmRhdGEgPSB1bmRlZmluZWQgIT09IG9wdHMuZGF0YSA/IG9wdHMuZGF0YSA6IG51bGw7XG4gICAgICAgIHRoaXMuY3JlYXRlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIFhIUiBvYmplY3QgYW5kIHNlbmRzIHRoZSByZXF1ZXN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjcmVhdGUoKSB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBwaWNrKHRoaXMub3B0cywgXCJhZ2VudFwiLCBcInBmeFwiLCBcImtleVwiLCBcInBhc3NwaHJhc2VcIiwgXCJjZXJ0XCIsIFwiY2FcIiwgXCJjaXBoZXJzXCIsIFwicmVqZWN0VW5hdXRob3JpemVkXCIsIFwiYXV0b1VucmVmXCIpO1xuICAgICAgICBvcHRzLnhkb21haW4gPSAhIXRoaXMub3B0cy54ZDtcbiAgICAgICAgb3B0cy54c2NoZW1lID0gISF0aGlzLm9wdHMueHM7XG4gICAgICAgIGNvbnN0IHhociA9ICh0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdChvcHRzKSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB4aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy51cmksIHRoaXMuYXN5bmMpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc2V0RGlzYWJsZUhlYWRlckNoZWNrICYmIHhoci5zZXREaXNhYmxlSGVhZGVyQ2hlY2sodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgaW4gdGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5leHRyYUhlYWRlcnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihpLCB0aGlzLm9wdHMuZXh0cmFIZWFkZXJzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgIGlmIChcIlBPU1RcIiA9PT0gdGhpcy5tZXRob2QpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcInRleHQvcGxhaW47Y2hhcnNldD1VVEYtOFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcIiovKlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgIC8vIGllNiBjaGVja1xuICAgICAgICAgICAgaWYgKFwid2l0aENyZWRlbnRpYWxzXCIgaW4geGhyKSB7XG4gICAgICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRoaXMub3B0cy53aXRoQ3JlZGVudGlhbHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLnJlcXVlc3RUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSB0aGlzLm9wdHMucmVxdWVzdFRpbWVvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICg0ICE9PSB4aHIucmVhZHlTdGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmICgyMDAgPT09IHhoci5zdGF0dXMgfHwgMTIyMyA9PT0geGhyLnN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uTG9hZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBgZXJyb3JgIGV2ZW50IGhhbmRsZXIgdGhhdCdzIHVzZXItc2V0XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IHRocm93IGluIHRoZSBzYW1lIHRpY2sgYW5kIGdldHMgY2F1Z2h0IGhlcmVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKHR5cGVvZiB4aHIuc3RhdHVzID09PSBcIm51bWJlclwiID8geGhyLnN0YXR1cyA6IDApO1xuICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgeGhyLnNlbmQodGhpcy5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gTmVlZCB0byBkZWZlciBzaW5jZSAuY3JlYXRlKCkgaXMgY2FsbGVkIGRpcmVjdGx5IGZyb20gdGhlIGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAvLyBhbmQgdGh1cyB0aGUgJ2Vycm9yJyBldmVudCBjYW4gb25seSBiZSBvbmx5IGJvdW5kICphZnRlciogdGhpcyBleGNlcHRpb25cbiAgICAgICAgICAgIC8vIG9jY3Vycy4gIFRoZXJlZm9yZSwgYWxzbywgd2UgY2Fubm90IHRocm93IGhlcmUgYXQgYWxsLlxuICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXggPSBSZXF1ZXN0LnJlcXVlc3RzQ291bnQrKztcbiAgICAgICAgICAgIFJlcXVlc3QucmVxdWVzdHNbdGhpcy5pbmRleF0gPSB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVycm9yLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycikge1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVyciwgdGhpcy54aHIpO1xuICAgICAgICB0aGlzLmNsZWFudXAodHJ1ZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFucyB1cCBob3VzZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY2xlYW51cChmcm9tRXJyb3IpIHtcbiAgICAgICAgaWYgKFwidW5kZWZpbmVkXCIgPT09IHR5cGVvZiB0aGlzLnhociB8fCBudWxsID09PSB0aGlzLnhocikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGVtcHR5O1xuICAgICAgICBpZiAoZnJvbUVycm9yKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLmFib3J0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgZGVsZXRlIFJlcXVlc3QucmVxdWVzdHNbdGhpcy5pbmRleF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54aHIgPSBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBsb2FkLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkxvYWQoKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLnhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRhdGFcIiwgZGF0YSk7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInN1Y2Nlc3NcIik7XG4gICAgICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBBYm9ydHMgdGhlIHJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIGFib3J0KCkge1xuICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICB9XG59XG5SZXF1ZXN0LnJlcXVlc3RzQ291bnQgPSAwO1xuUmVxdWVzdC5yZXF1ZXN0cyA9IHt9O1xuLyoqXG4gKiBBYm9ydHMgcGVuZGluZyByZXF1ZXN0cyB3aGVuIHVubG9hZGluZyB0aGUgd2luZG93LiBUaGlzIGlzIG5lZWRlZCB0byBwcmV2ZW50XG4gKiBtZW1vcnkgbGVha3MgKGUuZy4gd2hlbiB1c2luZyBJRSkgYW5kIHRvIGVuc3VyZSB0aGF0IG5vIHNwdXJpb3VzIGVycm9yIGlzXG4gKiBlbWl0dGVkLlxuICovXG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmICh0eXBlb2YgYXR0YWNoRXZlbnQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGF0dGFjaEV2ZW50KFwib251bmxvYWRcIiwgdW5sb2FkSGFuZGxlcik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY29uc3QgdGVybWluYXRpb25FdmVudCA9IFwib25wYWdlaGlkZVwiIGluIGdsb2JhbFRoaXMgPyBcInBhZ2VoaWRlXCIgOiBcInVubG9hZFwiO1xuICAgICAgICBhZGRFdmVudExpc3RlbmVyKHRlcm1pbmF0aW9uRXZlbnQsIHVubG9hZEhhbmRsZXIsIGZhbHNlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1bmxvYWRIYW5kbGVyKCkge1xuICAgIGZvciAobGV0IGkgaW4gUmVxdWVzdC5yZXF1ZXN0cykge1xuICAgICAgICBpZiAoUmVxdWVzdC5yZXF1ZXN0cy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgUmVxdWVzdC5yZXF1ZXN0c1tpXS5hYm9ydCgpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgZ2xvYmFsVGhpc1NoaW0gYXMgZ2xvYmFsVGhpcyB9IGZyb20gXCIuLi9nbG9iYWxUaGlzLmpzXCI7XG5leHBvcnQgY29uc3QgbmV4dFRpY2sgPSAoKCkgPT4ge1xuICAgIGNvbnN0IGlzUHJvbWlzZUF2YWlsYWJsZSA9IHR5cGVvZiBQcm9taXNlID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFByb21pc2UucmVzb2x2ZSA9PT0gXCJmdW5jdGlvblwiO1xuICAgIGlmIChpc1Byb21pc2VBdmFpbGFibGUpIHtcbiAgICAgICAgcmV0dXJuIChjYikgPT4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihjYik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gKGNiLCBzZXRUaW1lb3V0Rm4pID0+IHNldFRpbWVvdXRGbihjYiwgMCk7XG4gICAgfVxufSkoKTtcbmV4cG9ydCBjb25zdCBXZWJTb2NrZXQgPSBnbG9iYWxUaGlzLldlYlNvY2tldCB8fCBnbG9iYWxUaGlzLk1veldlYlNvY2tldDtcbmV4cG9ydCBjb25zdCB1c2luZ0Jyb3dzZXJXZWJTb2NrZXQgPSB0cnVlO1xuZXhwb3J0IGNvbnN0IGRlZmF1bHRCaW5hcnlUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuIiwiaW1wb3J0IHsgVHJhbnNwb3J0IH0gZnJvbSBcIi4uL3RyYW5zcG9ydC5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlIH0gZnJvbSBcIi4uL2NvbnRyaWIvcGFyc2Vxcy5qc1wiO1xuaW1wb3J0IHsgeWVhc3QgfSBmcm9tIFwiLi4vY29udHJpYi95ZWFzdC5qc1wiO1xuaW1wb3J0IHsgcGljayB9IGZyb20gXCIuLi91dGlsLmpzXCI7XG5pbXBvcnQgeyBkZWZhdWx0QmluYXJ5VHlwZSwgbmV4dFRpY2ssIHVzaW5nQnJvd3NlcldlYlNvY2tldCwgV2ViU29ja2V0LCB9IGZyb20gXCIuL3dlYnNvY2tldC1jb25zdHJ1Y3Rvci5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlUGFja2V0IH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbi8vIGRldGVjdCBSZWFjdE5hdGl2ZSBlbnZpcm9ubWVudFxuY29uc3QgaXNSZWFjdE5hdGl2ZSA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICB0eXBlb2YgbmF2aWdhdG9yLnByb2R1Y3QgPT09IFwic3RyaW5nXCIgJiZcbiAgICBuYXZpZ2F0b3IucHJvZHVjdC50b0xvd2VyQ2FzZSgpID09PSBcInJlYWN0bmF0aXZlXCI7XG5leHBvcnQgY2xhc3MgV1MgZXh0ZW5kcyBUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIFdlYlNvY2tldCB0cmFuc3BvcnQgY29uc3RydWN0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIGNvbm5lY3Rpb24gb3B0aW9uc1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHN1cGVyKG9wdHMpO1xuICAgICAgICB0aGlzLnN1cHBvcnRzQmluYXJ5ID0gIW9wdHMuZm9yY2VCYXNlNjQ7XG4gICAgfVxuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gXCJ3ZWJzb2NrZXRcIjtcbiAgICB9XG4gICAgZG9PcGVuKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hlY2soKSkge1xuICAgICAgICAgICAgLy8gbGV0IHByb2JlIHRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB1cmkgPSB0aGlzLnVyaSgpO1xuICAgICAgICBjb25zdCBwcm90b2NvbHMgPSB0aGlzLm9wdHMucHJvdG9jb2xzO1xuICAgICAgICAvLyBSZWFjdCBOYXRpdmUgb25seSBzdXBwb3J0cyB0aGUgJ2hlYWRlcnMnIG9wdGlvbiwgYW5kIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIGFueXRoaW5nIGVsc2UgaXMgcGFzc2VkXG4gICAgICAgIGNvbnN0IG9wdHMgPSBpc1JlYWN0TmF0aXZlXG4gICAgICAgICAgICA/IHt9XG4gICAgICAgICAgICA6IHBpY2sodGhpcy5vcHRzLCBcImFnZW50XCIsIFwicGVyTWVzc2FnZURlZmxhdGVcIiwgXCJwZnhcIiwgXCJrZXlcIiwgXCJwYXNzcGhyYXNlXCIsIFwiY2VydFwiLCBcImNhXCIsIFwiY2lwaGVyc1wiLCBcInJlamVjdFVuYXV0aG9yaXplZFwiLCBcImxvY2FsQWRkcmVzc1wiLCBcInByb3RvY29sVmVyc2lvblwiLCBcIm9yaWdpblwiLCBcIm1heFBheWxvYWRcIiwgXCJmYW1pbHlcIiwgXCJjaGVja1NlcnZlcklkZW50aXR5XCIpO1xuICAgICAgICBpZiAodGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgb3B0cy5oZWFkZXJzID0gdGhpcy5vcHRzLmV4dHJhSGVhZGVycztcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy53cyA9XG4gICAgICAgICAgICAgICAgdXNpbmdCcm93c2VyV2ViU29ja2V0ICYmICFpc1JlYWN0TmF0aXZlXG4gICAgICAgICAgICAgICAgICAgID8gcHJvdG9jb2xzXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG5ldyBXZWJTb2NrZXQodXJpLCBwcm90b2NvbHMpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG5ldyBXZWJTb2NrZXQodXJpKVxuICAgICAgICAgICAgICAgICAgICA6IG5ldyBXZWJTb2NrZXQodXJpLCBwcm90b2NvbHMsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53cy5iaW5hcnlUeXBlID0gdGhpcy5zb2NrZXQuYmluYXJ5VHlwZSB8fCBkZWZhdWx0QmluYXJ5VHlwZTtcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgc29ja2V0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLndzLm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53cy5fc29ja2V0LnVucmVmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLndzLm9uY2xvc2UgPSAoY2xvc2VFdmVudCkgPT4gdGhpcy5vbkNsb3NlKHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIndlYnNvY2tldCBjb25uZWN0aW9uIGNsb3NlZFwiLFxuICAgICAgICAgICAgY29udGV4dDogY2xvc2VFdmVudCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMud3Mub25tZXNzYWdlID0gKGV2KSA9PiB0aGlzLm9uRGF0YShldi5kYXRhKTtcbiAgICAgICAgdGhpcy53cy5vbmVycm9yID0gKGUpID0+IHRoaXMub25FcnJvcihcIndlYnNvY2tldCBlcnJvclwiLCBlKTtcbiAgICB9XG4gICAgd3JpdGUocGFja2V0cykge1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIC8vIGVuY29kZVBhY2tldCBlZmZpY2llbnQgYXMgaXQgdXNlcyBXUyBmcmFtaW5nXG4gICAgICAgIC8vIG5vIG5lZWQgZm9yIGVuY29kZVBheWxvYWRcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWNrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwYWNrZXQgPSBwYWNrZXRzW2ldO1xuICAgICAgICAgICAgY29uc3QgbGFzdFBhY2tldCA9IGkgPT09IHBhY2tldHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGVuY29kZVBhY2tldChwYWNrZXQsIHRoaXMuc3VwcG9ydHNCaW5hcnksIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gYWx3YXlzIGNyZWF0ZSBhIG5ldyBvYmplY3QgKEdILTQzNylcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRzID0ge307XG4gICAgICAgICAgICAgICAgaWYgKCF1c2luZ0Jyb3dzZXJXZWJTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhY2tldC5vcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbXByZXNzID0gcGFja2V0Lm9wdGlvbnMuY29tcHJlc3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5wZXJNZXNzYWdlRGVmbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGVuID0gXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBcInN0cmluZ1wiID09PSB0eXBlb2YgZGF0YSA/IEJ1ZmZlci5ieXRlTGVuZ3RoKGRhdGEpIDogZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGVuIDwgdGhpcy5vcHRzLnBlck1lc3NhZ2VEZWZsYXRlLnRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29tcHJlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTb21ldGltZXMgdGhlIHdlYnNvY2tldCBoYXMgYWxyZWFkeSBiZWVuIGNsb3NlZCBidXQgdGhlIGJyb3dzZXIgZGlkbid0XG4gICAgICAgICAgICAgICAgLy8gaGF2ZSBhIGNoYW5jZSBvZiBpbmZvcm1pbmcgdXMgYWJvdXQgaXQgeWV0LCBpbiB0aGF0IGNhc2Ugc2VuZCB3aWxsXG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNpbmdCcm93c2VyV2ViU29ja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUeXBlRXJyb3IgaXMgdGhyb3duIHdoZW4gcGFzc2luZyB0aGUgc2Vjb25kIGFyZ3VtZW50IG9uIFNhZmFyaVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cy5zZW5kKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cy5zZW5kKGRhdGEsIG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsYXN0UGFja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZha2UgZHJhaW5cbiAgICAgICAgICAgICAgICAgICAgLy8gZGVmZXIgdG8gbmV4dCB0aWNrIHRvIGFsbG93IFNvY2tldCB0byBjbGVhciB3cml0ZUJ1ZmZlclxuICAgICAgICAgICAgICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZHJhaW5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRoaXMuc2V0VGltZW91dEZuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkb0Nsb3NlKCkge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMud3MgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRoaXMud3MuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMud3MgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyB1cmkgZm9yIGNvbm5lY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHVyaSgpIHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5xdWVyeSB8fCB7fTtcbiAgICAgICAgY29uc3Qgc2NoZW1hID0gdGhpcy5vcHRzLnNlY3VyZSA/IFwid3NzXCIgOiBcIndzXCI7XG4gICAgICAgIGxldCBwb3J0ID0gXCJcIjtcbiAgICAgICAgLy8gYXZvaWQgcG9ydCBpZiBkZWZhdWx0IGZvciBzY2hlbWFcbiAgICAgICAgaWYgKHRoaXMub3B0cy5wb3J0ICYmXG4gICAgICAgICAgICAoKFwid3NzXCIgPT09IHNjaGVtYSAmJiBOdW1iZXIodGhpcy5vcHRzLnBvcnQpICE9PSA0NDMpIHx8XG4gICAgICAgICAgICAgICAgKFwid3NcIiA9PT0gc2NoZW1hICYmIE51bWJlcih0aGlzLm9wdHMucG9ydCkgIT09IDgwKSkpIHtcbiAgICAgICAgICAgIHBvcnQgPSBcIjpcIiArIHRoaXMub3B0cy5wb3J0O1xuICAgICAgICB9XG4gICAgICAgIC8vIGFwcGVuZCB0aW1lc3RhbXAgdG8gVVJJXG4gICAgICAgIGlmICh0aGlzLm9wdHMudGltZXN0YW1wUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIHF1ZXJ5W3RoaXMub3B0cy50aW1lc3RhbXBQYXJhbV0gPSB5ZWFzdCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbW11bmljYXRlIGJpbmFyeSBzdXBwb3J0IGNhcGFiaWxpdGllc1xuICAgICAgICBpZiAoIXRoaXMuc3VwcG9ydHNCaW5hcnkpIHtcbiAgICAgICAgICAgIHF1ZXJ5LmI2NCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW5jb2RlZFF1ZXJ5ID0gZW5jb2RlKHF1ZXJ5KTtcbiAgICAgICAgY29uc3QgaXB2NiA9IHRoaXMub3B0cy5ob3N0bmFtZS5pbmRleE9mKFwiOlwiKSAhPT0gLTE7XG4gICAgICAgIHJldHVybiAoc2NoZW1hICtcbiAgICAgICAgICAgIFwiOi8vXCIgK1xuICAgICAgICAgICAgKGlwdjYgPyBcIltcIiArIHRoaXMub3B0cy5ob3N0bmFtZSArIFwiXVwiIDogdGhpcy5vcHRzLmhvc3RuYW1lKSArXG4gICAgICAgICAgICBwb3J0ICtcbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoICtcbiAgICAgICAgICAgIChlbmNvZGVkUXVlcnkubGVuZ3RoID8gXCI/XCIgKyBlbmNvZGVkUXVlcnkgOiBcIlwiKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZlYXR1cmUgZGV0ZWN0aW9uIGZvciBXZWJTb2NrZXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIHRoaXMgdHJhbnNwb3J0IGlzIGF2YWlsYWJsZS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGNoZWNrKCkge1xuICAgICAgICByZXR1cm4gISFXZWJTb2NrZXQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgUG9sbGluZyB9IGZyb20gXCIuL3BvbGxpbmcuanNcIjtcbmltcG9ydCB7IFdTIH0gZnJvbSBcIi4vd2Vic29ja2V0LmpzXCI7XG5leHBvcnQgY29uc3QgdHJhbnNwb3J0cyA9IHtcbiAgICB3ZWJzb2NrZXQ6IFdTLFxuICAgIHBvbGxpbmc6IFBvbGxpbmcsXG59O1xuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZ2Fsa24vcGFyc2V1cmlcbi8qKlxuICogUGFyc2VzIGEgVVJJXG4gKlxuICogTm90ZTogd2UgY291bGQgYWxzbyBoYXZlIHVzZWQgdGhlIGJ1aWx0LWluIFVSTCBvYmplY3QsIGJ1dCBpdCBpc24ndCBzdXBwb3J0ZWQgb24gYWxsIHBsYXRmb3Jtcy5cbiAqXG4gKiBTZWU6XG4gKiAtIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9VUkxcbiAqIC0gaHR0cHM6Ly9jYW5pdXNlLmNvbS91cmxcbiAqIC0gaHR0cHM6Ly93d3cucmZjLWVkaXRvci5vcmcvcmZjL3JmYzM5ODYjYXBwZW5kaXgtQlxuICpcbiAqIEhpc3Rvcnkgb2YgdGhlIHBhcnNlKCkgbWV0aG9kOlxuICogLSBmaXJzdCBjb21taXQ6IGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NrZXRpby9zb2NrZXQuaW8tY2xpZW50L2NvbW1pdC80ZWUxZDVkOTRiMzkwNmE5YzA1MmI0NTlmMWE4MThiMTVmMzhmOTFjXG4gKiAtIGV4cG9ydCBpbnRvIGl0cyBvd24gbW9kdWxlOiBodHRwczovL2dpdGh1Yi5jb20vc29ja2V0aW8vZW5naW5lLmlvLWNsaWVudC9jb21taXQvZGUyYzU2MWU0NTY0ZWZlYjc4ZjFiZGIxYmEzOWVmODFiMjgyMmNiM1xuICogLSByZWltcG9ydDogaHR0cHM6Ly9naXRodWIuY29tL3NvY2tldGlvL2VuZ2luZS5pby1jbGllbnQvY29tbWl0L2RmMzIyNzdjM2Y2ZDYyMmVlYzVlZDA5ZjQ5M2NhZTNmMzM5MWQyNDJcbiAqXG4gKiBAYXV0aG9yIFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPiAoTUlUIGxpY2Vuc2UpXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuY29uc3QgcmUgPSAvXig/Oig/IVteOkBcXC8/I10rOlteOkBcXC9dKkApKGh0dHB8aHR0cHN8d3N8d3NzKTpcXC9cXC8pPygoPzooKFteOkBcXC8/I10qKSg/OjooW146QFxcLz8jXSopKT8pP0ApPygoPzpbYS1mMC05XXswLDR9Oil7Miw3fVthLWYwLTldezAsNH18W146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLztcbmNvbnN0IHBhcnRzID0gW1xuICAgICdzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnYW5jaG9yJ1xuXTtcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgICBjb25zdCBzcmMgPSBzdHIsIGIgPSBzdHIuaW5kZXhPZignWycpLCBlID0gc3RyLmluZGV4T2YoJ10nKTtcbiAgICBpZiAoYiAhPSAtMSAmJiBlICE9IC0xKSB7XG4gICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgYikgKyBzdHIuc3Vic3RyaW5nKGIsIGUpLnJlcGxhY2UoLzovZywgJzsnKSArIHN0ci5zdWJzdHJpbmcoZSwgc3RyLmxlbmd0aCk7XG4gICAgfVxuICAgIGxldCBtID0gcmUuZXhlYyhzdHIgfHwgJycpLCB1cmkgPSB7fSwgaSA9IDE0O1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgdXJpW3BhcnRzW2ldXSA9IG1baV0gfHwgJyc7XG4gICAgfVxuICAgIGlmIChiICE9IC0xICYmIGUgIT0gLTEpIHtcbiAgICAgICAgdXJpLnNvdXJjZSA9IHNyYztcbiAgICAgICAgdXJpLmhvc3QgPSB1cmkuaG9zdC5zdWJzdHJpbmcoMSwgdXJpLmhvc3QubGVuZ3RoIC0gMSkucmVwbGFjZSgvOy9nLCAnOicpO1xuICAgICAgICB1cmkuYXV0aG9yaXR5ID0gdXJpLmF1dGhvcml0eS5yZXBsYWNlKCdbJywgJycpLnJlcGxhY2UoJ10nLCAnJykucmVwbGFjZSgvOy9nLCAnOicpO1xuICAgICAgICB1cmkuaXB2NnVyaSA9IHRydWU7XG4gICAgfVxuICAgIHVyaS5wYXRoTmFtZXMgPSBwYXRoTmFtZXModXJpLCB1cmlbJ3BhdGgnXSk7XG4gICAgdXJpLnF1ZXJ5S2V5ID0gcXVlcnlLZXkodXJpLCB1cmlbJ3F1ZXJ5J10pO1xuICAgIHJldHVybiB1cmk7XG59XG5mdW5jdGlvbiBwYXRoTmFtZXMob2JqLCBwYXRoKSB7XG4gICAgY29uc3QgcmVneCA9IC9cXC97Miw5fS9nLCBuYW1lcyA9IHBhdGgucmVwbGFjZShyZWd4LCBcIi9cIikuc3BsaXQoXCIvXCIpO1xuICAgIGlmIChwYXRoLnNsaWNlKDAsIDEpID09ICcvJyB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBuYW1lcy5zcGxpY2UoMCwgMSk7XG4gICAgfVxuICAgIGlmIChwYXRoLnNsaWNlKC0xKSA9PSAnLycpIHtcbiAgICAgICAgbmFtZXMuc3BsaWNlKG5hbWVzLmxlbmd0aCAtIDEsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXM7XG59XG5mdW5jdGlvbiBxdWVyeUtleSh1cmksIHF1ZXJ5KSB7XG4gICAgY29uc3QgZGF0YSA9IHt9O1xuICAgIHF1ZXJ5LnJlcGxhY2UoLyg/Ol58JikoW14mPV0qKT0/KFteJl0qKS9nLCBmdW5jdGlvbiAoJDAsICQxLCAkMikge1xuICAgICAgICBpZiAoJDEpIHtcbiAgICAgICAgICAgIGRhdGFbJDFdID0gJDI7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGF0YTtcbn1cbiIsImltcG9ydCB7IHRyYW5zcG9ydHMgfSBmcm9tIFwiLi90cmFuc3BvcnRzL2luZGV4LmpzXCI7XG5pbXBvcnQgeyBpbnN0YWxsVGltZXJGdW5jdGlvbnMsIGJ5dGVMZW5ndGggfSBmcm9tIFwiLi91dGlsLmpzXCI7XG5pbXBvcnQgeyBkZWNvZGUgfSBmcm9tIFwiLi9jb250cmliL3BhcnNlcXMuanNcIjtcbmltcG9ydCB7IHBhcnNlIH0gZnJvbSBcIi4vY29udHJpYi9wYXJzZXVyaS5qc1wiO1xuaW1wb3J0IHsgRW1pdHRlciB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG5pbXBvcnQgeyBwcm90b2NvbCB9IGZyb20gXCJlbmdpbmUuaW8tcGFyc2VyXCI7XG5leHBvcnQgY2xhc3MgU29ja2V0IGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogU29ja2V0IGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSB1cmkgLSB1cmkgb3Igb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHVyaSwgb3B0cyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMud3JpdGVCdWZmZXIgPSBbXTtcbiAgICAgICAgaWYgKHVyaSAmJiBcIm9iamVjdFwiID09PSB0eXBlb2YgdXJpKSB7XG4gICAgICAgICAgICBvcHRzID0gdXJpO1xuICAgICAgICAgICAgdXJpID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXJpKSB7XG4gICAgICAgICAgICB1cmkgPSBwYXJzZSh1cmkpO1xuICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSA9IHVyaS5ob3N0O1xuICAgICAgICAgICAgb3B0cy5zZWN1cmUgPSB1cmkucHJvdG9jb2wgPT09IFwiaHR0cHNcIiB8fCB1cmkucHJvdG9jb2wgPT09IFwid3NzXCI7XG4gICAgICAgICAgICBvcHRzLnBvcnQgPSB1cmkucG9ydDtcbiAgICAgICAgICAgIGlmICh1cmkucXVlcnkpXG4gICAgICAgICAgICAgICAgb3B0cy5xdWVyeSA9IHVyaS5xdWVyeTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRzLmhvc3QpIHtcbiAgICAgICAgICAgIG9wdHMuaG9zdG5hbWUgPSBwYXJzZShvcHRzLmhvc3QpLmhvc3Q7XG4gICAgICAgIH1cbiAgICAgICAgaW5zdGFsbFRpbWVyRnVuY3Rpb25zKHRoaXMsIG9wdHMpO1xuICAgICAgICB0aGlzLnNlY3VyZSA9XG4gICAgICAgICAgICBudWxsICE9IG9wdHMuc2VjdXJlXG4gICAgICAgICAgICAgICAgPyBvcHRzLnNlY3VyZVxuICAgICAgICAgICAgICAgIDogdHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiICYmIFwiaHR0cHM6XCIgPT09IGxvY2F0aW9uLnByb3RvY29sO1xuICAgICAgICBpZiAob3B0cy5ob3N0bmFtZSAmJiAhb3B0cy5wb3J0KSB7XG4gICAgICAgICAgICAvLyBpZiBubyBwb3J0IGlzIHNwZWNpZmllZCBtYW51YWxseSwgdXNlIHRoZSBwcm90b2NvbCBkZWZhdWx0XG4gICAgICAgICAgICBvcHRzLnBvcnQgPSB0aGlzLnNlY3VyZSA/IFwiNDQzXCIgOiBcIjgwXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ob3N0bmFtZSA9XG4gICAgICAgICAgICBvcHRzLmhvc3RuYW1lIHx8XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiA/IGxvY2F0aW9uLmhvc3RuYW1lIDogXCJsb2NhbGhvc3RcIik7XG4gICAgICAgIHRoaXMucG9ydCA9XG4gICAgICAgICAgICBvcHRzLnBvcnQgfHxcbiAgICAgICAgICAgICAgICAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiICYmIGxvY2F0aW9uLnBvcnRcbiAgICAgICAgICAgICAgICAgICAgPyBsb2NhdGlvbi5wb3J0XG4gICAgICAgICAgICAgICAgICAgIDogdGhpcy5zZWN1cmVcbiAgICAgICAgICAgICAgICAgICAgICAgID8gXCI0NDNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOiBcIjgwXCIpO1xuICAgICAgICB0aGlzLnRyYW5zcG9ydHMgPSBvcHRzLnRyYW5zcG9ydHMgfHwgW1wicG9sbGluZ1wiLCBcIndlYnNvY2tldFwiXTtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLnByZXZCdWZmZXJMZW4gPSAwO1xuICAgICAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIHBhdGg6IFwiL2VuZ2luZS5pb1wiLFxuICAgICAgICAgICAgYWdlbnQ6IGZhbHNlLFxuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiBmYWxzZSxcbiAgICAgICAgICAgIHVwZ3JhZGU6IHRydWUsXG4gICAgICAgICAgICB0aW1lc3RhbXBQYXJhbTogXCJ0XCIsXG4gICAgICAgICAgICByZW1lbWJlclVwZ3JhZGU6IGZhbHNlLFxuICAgICAgICAgICAgYWRkVHJhaWxpbmdTbGFzaDogdHJ1ZSxcbiAgICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgICAgICAgIHBlck1lc3NhZ2VEZWZsYXRlOiB7XG4gICAgICAgICAgICAgICAgdGhyZXNob2xkOiAxMDI0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zcG9ydE9wdGlvbnM6IHt9LFxuICAgICAgICAgICAgY2xvc2VPbkJlZm9yZXVubG9hZDogdHJ1ZSxcbiAgICAgICAgfSwgb3B0cyk7XG4gICAgICAgIHRoaXMub3B0cy5wYXRoID1cbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoLnJlcGxhY2UoL1xcLyQvLCBcIlwiKSArXG4gICAgICAgICAgICAgICAgKHRoaXMub3B0cy5hZGRUcmFpbGluZ1NsYXNoID8gXCIvXCIgOiBcIlwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdHMucXVlcnkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMub3B0cy5xdWVyeSA9IGRlY29kZSh0aGlzLm9wdHMucXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNldCBvbiBoYW5kc2hha2VcbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXBncmFkZXMgPSBudWxsO1xuICAgICAgICB0aGlzLnBpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXQgPSBudWxsO1xuICAgICAgICAvLyBzZXQgb24gaGVhcnRiZWF0XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXRUaW1lciA9IG51bGw7XG4gICAgICAgIGlmICh0eXBlb2YgYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLmNsb3NlT25CZWZvcmV1bmxvYWQpIHtcbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IGNsb3NlcyB0aGUgY29ubmVjdGlvbiB3aGVuIHRoZSBcImJlZm9yZXVubG9hZFwiIGV2ZW50IGlzIGVtaXR0ZWQgYnV0IG5vdCBDaHJvbWUuIFRoaXMgZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmVzIGV2ZXJ5IGJyb3dzZXIgYmVoYXZlcyB0aGUgc2FtZSAobm8gXCJkaXNjb25uZWN0XCIgZXZlbnQgYXQgdGhlIFNvY2tldC5JTyBsZXZlbCB3aGVuIHRoZSBwYWdlIGlzXG4gICAgICAgICAgICAgICAgLy8gY2xvc2VkL3JlbG9hZGVkKVxuICAgICAgICAgICAgICAgIHRoaXMuYmVmb3JldW5sb2FkRXZlbnRMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaWxlbnRseSBjbG9zZSB0aGUgdHJhbnNwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJiZWZvcmV1bmxvYWRcIiwgdGhpcy5iZWZvcmV1bmxvYWRFdmVudExpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5ob3N0bmFtZSAhPT0gXCJsb2NhbGhvc3RcIikge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmbGluZUV2ZW50TGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25DbG9zZShcInRyYW5zcG9ydCBjbG9zZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJuZXR3b3JrIGNvbm5lY3Rpb24gbG9zdFwiLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJvZmZsaW5lXCIsIHRoaXMub2ZmbGluZUV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0cmFuc3BvcnQgb2YgdGhlIGdpdmVuIHR5cGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRyYW5zcG9ydCBuYW1lXG4gICAgICogQHJldHVybiB7VHJhbnNwb3J0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY3JlYXRlVHJhbnNwb3J0KG5hbWUpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdHMucXVlcnkpO1xuICAgICAgICAvLyBhcHBlbmQgZW5naW5lLmlvIHByb3RvY29sIGlkZW50aWZpZXJcbiAgICAgICAgcXVlcnkuRUlPID0gcHJvdG9jb2w7XG4gICAgICAgIC8vIHRyYW5zcG9ydCBuYW1lXG4gICAgICAgIHF1ZXJ5LnRyYW5zcG9ydCA9IG5hbWU7XG4gICAgICAgIC8vIHNlc3Npb24gaWQgaWYgd2UgYWxyZWFkeSBoYXZlIG9uZVxuICAgICAgICBpZiAodGhpcy5pZClcbiAgICAgICAgICAgIHF1ZXJ5LnNpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdHMudHJhbnNwb3J0T3B0aW9uc1tuYW1lXSwgdGhpcy5vcHRzLCB7XG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgIHNvY2tldDogdGhpcyxcbiAgICAgICAgICAgIGhvc3RuYW1lOiB0aGlzLmhvc3RuYW1lLFxuICAgICAgICAgICAgc2VjdXJlOiB0aGlzLnNlY3VyZSxcbiAgICAgICAgICAgIHBvcnQ6IHRoaXMucG9ydCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgdHJhbnNwb3J0c1tuYW1lXShvcHRzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdHJhbnNwb3J0IHRvIHVzZSBhbmQgc3RhcnRzIHByb2JlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvcGVuKCkge1xuICAgICAgICBsZXQgdHJhbnNwb3J0O1xuICAgICAgICBpZiAodGhpcy5vcHRzLnJlbWVtYmVyVXBncmFkZSAmJlxuICAgICAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyAmJlxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnRzLmluZGV4T2YoXCJ3ZWJzb2NrZXRcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSBcIndlYnNvY2tldFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKDAgPT09IHRoaXMudHJhbnNwb3J0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIEVtaXQgZXJyb3Igb24gbmV4dCB0aWNrIHNvIGl0IGNhbiBiZSBsaXN0ZW5lZCB0b1xuICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgXCJObyB0cmFuc3BvcnRzIGF2YWlsYWJsZVwiKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdHJhbnNwb3J0ID0gdGhpcy50cmFuc3BvcnRzWzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICAvLyBSZXRyeSB3aXRoIHRoZSBuZXh0IHRyYW5zcG9ydCBpZiB0aGUgdHJhbnNwb3J0IGlzIGRpc2FibGVkIChqc29ucDogZmFsc2UpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSB0aGlzLmNyZWF0ZVRyYW5zcG9ydCh0cmFuc3BvcnQpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydHMuc2hpZnQoKTtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyYW5zcG9ydC5vcGVuKCk7XG4gICAgICAgIHRoaXMuc2V0VHJhbnNwb3J0KHRyYW5zcG9ydCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGN1cnJlbnQgdHJhbnNwb3J0LiBEaXNhYmxlcyB0aGUgZXhpc3Rpbmcgb25lIChpZiBhbnkpLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzZXRUcmFuc3BvcnQodHJhbnNwb3J0KSB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zcG9ydCkge1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IHVwIHRyYW5zcG9ydFxuICAgICAgICB0aGlzLnRyYW5zcG9ydCA9IHRyYW5zcG9ydDtcbiAgICAgICAgLy8gc2V0IHVwIHRyYW5zcG9ydCBsaXN0ZW5lcnNcbiAgICAgICAgdHJhbnNwb3J0XG4gICAgICAgICAgICAub24oXCJkcmFpblwiLCB0aGlzLm9uRHJhaW4uYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcInBhY2tldFwiLCB0aGlzLm9uUGFja2V0LmJpbmQodGhpcykpXG4gICAgICAgICAgICAub24oXCJlcnJvclwiLCB0aGlzLm9uRXJyb3IuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcImNsb3NlXCIsIChyZWFzb24pID0+IHRoaXMub25DbG9zZShcInRyYW5zcG9ydCBjbG9zZVwiLCByZWFzb24pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJvYmVzIGEgdHJhbnNwb3J0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSB0cmFuc3BvcnQgbmFtZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJvYmUobmFtZSkge1xuICAgICAgICBsZXQgdHJhbnNwb3J0ID0gdGhpcy5jcmVhdGVUcmFuc3BvcnQobmFtZSk7XG4gICAgICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICBjb25zdCBvblRyYW5zcG9ydE9wZW4gPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5zZW5kKFt7IHR5cGU6IFwicGluZ1wiLCBkYXRhOiBcInByb2JlXCIgfV0pO1xuICAgICAgICAgICAgdHJhbnNwb3J0Lm9uY2UoXCJwYWNrZXRcIiwgKG1zZykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoXCJwb25nXCIgPT09IG1zZy50eXBlICYmIFwicHJvYmVcIiA9PT0gbXNnLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGdyYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGluZ1wiLCB0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRyYW5zcG9ydClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IFwid2Vic29ja2V0XCIgPT09IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5wYXVzZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcImNsb3NlZFwiID09PSB0aGlzLnJlYWR5U3RhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUcmFuc3BvcnQodHJhbnNwb3J0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydC5zZW5kKFt7IHR5cGU6IFwidXBncmFkZVwiIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkZVwiLCB0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBncmFkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKFwicHJvYmUgZXJyb3JcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgZXJyLnRyYW5zcG9ydCA9IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGVFcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBmcmVlemVUcmFuc3BvcnQoKSB7XG4gICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIC8vIEFueSBjYWxsYmFjayBjYWxsZWQgYnkgdHJhbnNwb3J0IHNob3VsZCBiZSBpZ25vcmVkIHNpbmNlIG5vd1xuICAgICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5jbG9zZSgpO1xuICAgICAgICAgICAgdHJhbnNwb3J0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgYW55IGVycm9yIHRoYXQgaGFwcGVucyB3aGlsZSBwcm9iaW5nXG4gICAgICAgIGNvbnN0IG9uZXJyb3IgPSAoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihcInByb2JlIGVycm9yOiBcIiArIGVycik7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBlcnJvci50cmFuc3BvcnQgPSB0cmFuc3BvcnQubmFtZTtcbiAgICAgICAgICAgIGZyZWV6ZVRyYW5zcG9ydCgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJ1cGdyYWRlRXJyb3JcIiwgZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBvblRyYW5zcG9ydENsb3NlKCkge1xuICAgICAgICAgICAgb25lcnJvcihcInRyYW5zcG9ydCBjbG9zZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gV2hlbiB0aGUgc29ja2V0IGlzIGNsb3NlZCB3aGlsZSB3ZSdyZSBwcm9iaW5nXG4gICAgICAgIGZ1bmN0aW9uIG9uY2xvc2UoKSB7XG4gICAgICAgICAgICBvbmVycm9yKFwic29ja2V0IGNsb3NlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGVuIHRoZSBzb2NrZXQgaXMgdXBncmFkZWQgd2hpbGUgd2UncmUgcHJvYmluZ1xuICAgICAgICBmdW5jdGlvbiBvbnVwZ3JhZGUodG8pIHtcbiAgICAgICAgICAgIGlmICh0cmFuc3BvcnQgJiYgdG8ubmFtZSAhPT0gdHJhbnNwb3J0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBmcmVlemVUcmFuc3BvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBvbiB0aGUgdHJhbnNwb3J0IGFuZCBvbiBzZWxmXG4gICAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgICAgICB0cmFuc3BvcnQucmVtb3ZlTGlzdGVuZXIoXCJvcGVuXCIsIG9uVHJhbnNwb3J0T3Blbik7XG4gICAgICAgICAgICB0cmFuc3BvcnQucmVtb3ZlTGlzdGVuZXIoXCJlcnJvclwiLCBvbmVycm9yKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcImNsb3NlXCIsIG9uVHJhbnNwb3J0Q2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJjbG9zZVwiLCBvbmNsb3NlKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKFwidXBncmFkaW5nXCIsIG9udXBncmFkZSk7XG4gICAgICAgIH07XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwib3BlblwiLCBvblRyYW5zcG9ydE9wZW4pO1xuICAgICAgICB0cmFuc3BvcnQub25jZShcImVycm9yXCIsIG9uZXJyb3IpO1xuICAgICAgICB0cmFuc3BvcnQub25jZShcImNsb3NlXCIsIG9uVHJhbnNwb3J0Q2xvc2UpO1xuICAgICAgICB0aGlzLm9uY2UoXCJjbG9zZVwiLCBvbmNsb3NlKTtcbiAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkaW5nXCIsIG9udXBncmFkZSk7XG4gICAgICAgIHRyYW5zcG9ydC5vcGVuKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGNvbm5lY3Rpb24gaXMgZGVlbWVkIG9wZW4uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uT3BlbigpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJvcGVuXCI7XG4gICAgICAgIFNvY2tldC5wcmlvcldlYnNvY2tldFN1Y2Nlc3MgPSBcIndlYnNvY2tldFwiID09PSB0aGlzLnRyYW5zcG9ydC5uYW1lO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcIm9wZW5cIik7XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgLy8gd2UgY2hlY2sgZm9yIGByZWFkeVN0YXRlYCBpbiBjYXNlIGFuIGBvcGVuYFxuICAgICAgICAvLyBsaXN0ZW5lciBhbHJlYWR5IGNsb3NlZCB0aGUgc29ja2V0XG4gICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlICYmIHRoaXMub3B0cy51cGdyYWRlKSB7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICBjb25zdCBsID0gdGhpcy51cGdyYWRlcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvYmUodGhpcy51cGdyYWRlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBhIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25QYWNrZXQocGFja2V0KSB7XG4gICAgICAgIGlmIChcIm9wZW5pbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcImNsb3NpbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBhY2tldFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgLy8gU29ja2V0IGlzIGxpdmUgLSBhbnkgcGFja2V0IGNvdW50c1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJoZWFydGJlYXRcIik7XG4gICAgICAgICAgICBzd2l0Y2ggKHBhY2tldC50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm9wZW5cIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkhhbmRzaGFrZShKU09OLnBhcnNlKHBhY2tldC5kYXRhKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJwaW5nXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXRQaW5nVGltZW91dCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRQYWNrZXQoXCJwb25nXCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicG9uZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImVycm9yXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihcInNlcnZlciBlcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBlcnIuY29kZSA9IHBhY2tldC5kYXRhO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm1lc3NhZ2VcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkYXRhXCIsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJtZXNzYWdlXCIsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gaGFuZHNoYWtlIGNvbXBsZXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIGhhbmRzaGFrZSBvYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uSGFuZHNoYWtlKGRhdGEpIHtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJoYW5kc2hha2VcIiwgZGF0YSk7XG4gICAgICAgIHRoaXMuaWQgPSBkYXRhLnNpZDtcbiAgICAgICAgdGhpcy50cmFuc3BvcnQucXVlcnkuc2lkID0gZGF0YS5zaWQ7XG4gICAgICAgIHRoaXMudXBncmFkZXMgPSB0aGlzLmZpbHRlclVwZ3JhZGVzKGRhdGEudXBncmFkZXMpO1xuICAgICAgICB0aGlzLnBpbmdJbnRlcnZhbCA9IGRhdGEucGluZ0ludGVydmFsO1xuICAgICAgICB0aGlzLnBpbmdUaW1lb3V0ID0gZGF0YS5waW5nVGltZW91dDtcbiAgICAgICAgdGhpcy5tYXhQYXlsb2FkID0gZGF0YS5tYXhQYXlsb2FkO1xuICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICAvLyBJbiBjYXNlIG9wZW4gaGFuZGxlciBjbG9zZXMgc29ja2V0XG4gICAgICAgIGlmIChcImNsb3NlZFwiID09PSB0aGlzLnJlYWR5U3RhdGUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucmVzZXRQaW5nVGltZW91dCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGFuZCByZXNldHMgcGluZyB0aW1lb3V0IHRpbWVyIGJhc2VkIG9uIHNlcnZlciBwaW5ncy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcmVzZXRQaW5nVGltZW91dCgpIHtcbiAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRGbih0aGlzLnBpbmdUaW1lb3V0VGltZXIpO1xuICAgICAgICB0aGlzLnBpbmdUaW1lb3V0VGltZXIgPSB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2UoXCJwaW5nIHRpbWVvdXRcIik7XG4gICAgICAgIH0sIHRoaXMucGluZ0ludGVydmFsICsgdGhpcy5waW5nVGltZW91dCk7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICB0aGlzLnBpbmdUaW1lb3V0VGltZXIudW5yZWYoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgb24gYGRyYWluYCBldmVudFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkRyYWluKCkge1xuICAgICAgICB0aGlzLndyaXRlQnVmZmVyLnNwbGljZSgwLCB0aGlzLnByZXZCdWZmZXJMZW4pO1xuICAgICAgICAvLyBzZXR0aW5nIHByZXZCdWZmZXJMZW4gPSAwIGlzIHZlcnkgaW1wb3J0YW50XG4gICAgICAgIC8vIGZvciBleGFtcGxlLCB3aGVuIHVwZ3JhZGluZywgdXBncmFkZSBwYWNrZXQgaXMgc2VudCBvdmVyLFxuICAgICAgICAvLyBhbmQgYSBub256ZXJvIHByZXZCdWZmZXJMZW4gY291bGQgY2F1c2UgcHJvYmxlbXMgb24gYGRyYWluYFxuICAgICAgICB0aGlzLnByZXZCdWZmZXJMZW4gPSAwO1xuICAgICAgICBpZiAoMCA9PT0gdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZHJhaW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRmx1c2ggd3JpdGUgYnVmZmVycy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZmx1c2goKSB7XG4gICAgICAgIGlmIChcImNsb3NlZFwiICE9PSB0aGlzLnJlYWR5U3RhdGUgJiZcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LndyaXRhYmxlICYmXG4gICAgICAgICAgICAhdGhpcy51cGdyYWRpbmcgJiZcbiAgICAgICAgICAgIHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwYWNrZXRzID0gdGhpcy5nZXRXcml0YWJsZVBhY2tldHMoKTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnNlbmQocGFja2V0cyk7XG4gICAgICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIGN1cnJlbnQgbGVuZ3RoIG9mIHdyaXRlQnVmZmVyXG4gICAgICAgICAgICAvLyBzcGxpY2Ugd3JpdGVCdWZmZXIgYW5kIGNhbGxiYWNrQnVmZmVyIG9uIGBkcmFpbmBcbiAgICAgICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IHBhY2tldHMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJmbHVzaFwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbnN1cmUgdGhlIGVuY29kZWQgc2l6ZSBvZiB0aGUgd3JpdGVCdWZmZXIgaXMgYmVsb3cgdGhlIG1heFBheWxvYWQgdmFsdWUgc2VudCBieSB0aGUgc2VydmVyIChvbmx5IGZvciBIVFRQXG4gICAgICogbG9uZy1wb2xsaW5nKVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXRXcml0YWJsZVBhY2tldHMoKSB7XG4gICAgICAgIGNvbnN0IHNob3VsZENoZWNrUGF5bG9hZFNpemUgPSB0aGlzLm1heFBheWxvYWQgJiZcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0Lm5hbWUgPT09IFwicG9sbGluZ1wiICYmXG4gICAgICAgICAgICB0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCA+IDE7XG4gICAgICAgIGlmICghc2hvdWxkQ2hlY2tQYXlsb2FkU2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVCdWZmZXI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHBheWxvYWRTaXplID0gMTsgLy8gZmlyc3QgcGFja2V0IHR5cGVcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyaXRlQnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy53cml0ZUJ1ZmZlcltpXS5kYXRhO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBwYXlsb2FkU2l6ZSArPSBieXRlTGVuZ3RoKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgPiAwICYmIHBheWxvYWRTaXplID4gdGhpcy5tYXhQYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVCdWZmZXIuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXlsb2FkU2l6ZSArPSAyOyAvLyBzZXBhcmF0b3IgKyBwYWNrZXQgdHlwZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyaXRlQnVmZmVyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIG1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIC0gbWVzc2FnZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJuIHtTb2NrZXR9IGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICB3cml0ZShtc2csIG9wdGlvbnMsIGZuKSB7XG4gICAgICAgIHRoaXMuc2VuZFBhY2tldChcIm1lc3NhZ2VcIiwgbXNnLCBvcHRpb25zLCBmbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBzZW5kKG1zZywgb3B0aW9ucywgZm4pIHtcbiAgICAgICAgdGhpcy5zZW5kUGFja2V0KFwibWVzc2FnZVwiLCBtc2csIG9wdGlvbnMsIGZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGU6IHBhY2tldCB0eXBlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIC0gY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzZW5kUGFja2V0KHR5cGUsIGRhdGEsIG9wdGlvbnMsIGZuKSB7XG4gICAgICAgIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBkYXRhKSB7XG4gICAgICAgICAgICBmbiA9IGRhdGE7XG4gICAgICAgICAgICBkYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBvcHRpb25zKSB7XG4gICAgICAgICAgICBmbiA9IG9wdGlvbnM7XG4gICAgICAgICAgICBvcHRpb25zID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJjbG9zaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fCBcImNsb3NlZFwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgb3B0aW9ucy5jb21wcmVzcyA9IGZhbHNlICE9PSBvcHRpb25zLmNvbXByZXNzO1xuICAgICAgICBjb25zdCBwYWNrZXQgPSB7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGFja2V0Q3JlYXRlXCIsIHBhY2tldCk7XG4gICAgICAgIHRoaXMud3JpdGVCdWZmZXIucHVzaChwYWNrZXQpO1xuICAgICAgICBpZiAoZm4pXG4gICAgICAgICAgICB0aGlzLm9uY2UoXCJmbHVzaFwiLCBmbik7XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2VzIHRoZSBjb25uZWN0aW9uLlxuICAgICAqL1xuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25DbG9zZShcImZvcmNlZCBjbG9zZVwiKTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGNsZWFudXBBbmRDbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub2ZmKFwidXBncmFkZVwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJ1cGdyYWRlRXJyb3JcIiwgY2xlYW51cEFuZENsb3NlKTtcbiAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHdhaXRGb3JVcGdyYWRlID0gKCkgPT4ge1xuICAgICAgICAgICAgLy8gd2FpdCBmb3IgdXBncmFkZSB0byBmaW5pc2ggc2luY2Ugd2UgY2FuJ3Qgc2VuZCBwYWNrZXRzIHdoaWxlIHBhdXNpbmcgYSB0cmFuc3BvcnRcbiAgICAgICAgICAgIHRoaXMub25jZShcInVwZ3JhZGVcIiwgY2xlYW51cEFuZENsb3NlKTtcbiAgICAgICAgICAgIHRoaXMub25jZShcInVwZ3JhZGVFcnJvclwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoXCJvcGVuaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fCBcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcImNsb3NpbmdcIjtcbiAgICAgICAgICAgIGlmICh0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMub25jZShcImRyYWluXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudXBncmFkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yVXBncmFkZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy51cGdyYWRpbmcpIHtcbiAgICAgICAgICAgICAgICB3YWl0Rm9yVXBncmFkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gdHJhbnNwb3J0IGVycm9yXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uRXJyb3IoZXJyKSB7XG4gICAgICAgIFNvY2tldC5wcmlvcldlYnNvY2tldFN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIpO1xuICAgICAgICB0aGlzLm9uQ2xvc2UoXCJ0cmFuc3BvcnQgZXJyb3JcIiwgZXJyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gdHJhbnNwb3J0IGNsb3NlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkNsb3NlKHJlYXNvbiwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgaWYgKFwib3BlbmluZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgfHxcbiAgICAgICAgICAgIFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUgfHxcbiAgICAgICAgICAgIFwiY2xvc2luZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIC8vIGNsZWFyIHRpbWVyc1xuICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRGbih0aGlzLnBpbmdUaW1lb3V0VGltZXIpO1xuICAgICAgICAgICAgLy8gc3RvcCBldmVudCBmcm9tIGZpcmluZyBhZ2FpbiBmb3IgdHJhbnNwb3J0XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoXCJjbG9zZVwiKTtcbiAgICAgICAgICAgIC8vIGVuc3VyZSB0cmFuc3BvcnQgd29uJ3Qgc3RheSBvcGVuXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5jbG9zZSgpO1xuICAgICAgICAgICAgLy8gaWdub3JlIGZ1cnRoZXIgdHJhbnNwb3J0IGNvbW11bmljYXRpb25cbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZW1vdmVFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKFwiYmVmb3JldW5sb2FkXCIsIHRoaXMuYmVmb3JldW5sb2FkRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJvZmZsaW5lXCIsIHRoaXMub2ZmbGluZUV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNldCByZWFkeSBzdGF0ZVxuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgICAgIC8vIGNsZWFyIHNlc3Npb24gaWRcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgLy8gZW1pdCBjbG9zZSBldmVudFxuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjbG9zZVwiLCByZWFzb24sIGRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgIC8vIGNsZWFuIGJ1ZmZlcnMgYWZ0ZXIsIHNvIHVzZXJzIGNhbiBzdGlsbFxuICAgICAgICAgICAgLy8gZ3JhYiB0aGUgYnVmZmVycyBvbiBgY2xvc2VgIGV2ZW50XG4gICAgICAgICAgICB0aGlzLndyaXRlQnVmZmVyID0gW107XG4gICAgICAgICAgICB0aGlzLnByZXZCdWZmZXJMZW4gPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZpbHRlcnMgdXBncmFkZXMsIHJldHVybmluZyBvbmx5IHRob3NlIG1hdGNoaW5nIGNsaWVudCB0cmFuc3BvcnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gdXBncmFkZXMgLSBzZXJ2ZXIgdXBncmFkZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGZpbHRlclVwZ3JhZGVzKHVwZ3JhZGVzKSB7XG4gICAgICAgIGNvbnN0IGZpbHRlcmVkVXBncmFkZXMgPSBbXTtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICBjb25zdCBqID0gdXBncmFkZXMubGVuZ3RoO1xuICAgICAgICBmb3IgKDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgaWYgKH50aGlzLnRyYW5zcG9ydHMuaW5kZXhPZih1cGdyYWRlc1tpXSkpXG4gICAgICAgICAgICAgICAgZmlsdGVyZWRVcGdyYWRlcy5wdXNoKHVwZ3JhZGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmlsdGVyZWRVcGdyYWRlcztcbiAgICB9XG59XG5Tb2NrZXQucHJvdG9jb2wgPSBwcm90b2NvbDtcbiIsImltcG9ydCB7IHBhcnNlIH0gZnJvbSBcImVuZ2luZS5pby1jbGllbnRcIjtcbi8qKlxuICogVVJMIHBhcnNlci5cbiAqXG4gKiBAcGFyYW0gdXJpIC0gdXJsXG4gKiBAcGFyYW0gcGF0aCAtIHRoZSByZXF1ZXN0IHBhdGggb2YgdGhlIGNvbm5lY3Rpb25cbiAqIEBwYXJhbSBsb2MgLSBBbiBvYmplY3QgbWVhbnQgdG8gbWltaWMgd2luZG93LmxvY2F0aW9uLlxuICogICAgICAgIERlZmF1bHRzIHRvIHdpbmRvdy5sb2NhdGlvbi5cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVybCh1cmksIHBhdGggPSBcIlwiLCBsb2MpIHtcbiAgICBsZXQgb2JqID0gdXJpO1xuICAgIC8vIGRlZmF1bHQgdG8gd2luZG93LmxvY2F0aW9uXG4gICAgbG9jID0gbG9jIHx8ICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgbG9jYXRpb24pO1xuICAgIGlmIChudWxsID09IHVyaSlcbiAgICAgICAgdXJpID0gbG9jLnByb3RvY29sICsgXCIvL1wiICsgbG9jLmhvc3Q7XG4gICAgLy8gcmVsYXRpdmUgcGF0aCBzdXBwb3J0XG4gICAgaWYgKHR5cGVvZiB1cmkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgaWYgKFwiL1wiID09PSB1cmkuY2hhckF0KDApKSB7XG4gICAgICAgICAgICBpZiAoXCIvXCIgPT09IHVyaS5jaGFyQXQoMSkpIHtcbiAgICAgICAgICAgICAgICB1cmkgPSBsb2MucHJvdG9jb2wgKyB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmkgPSBsb2MuaG9zdCArIHVyaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIS9eKGh0dHBzP3x3c3M/KTpcXC9cXC8vLnRlc3QodXJpKSkge1xuICAgICAgICAgICAgaWYgKFwidW5kZWZpbmVkXCIgIT09IHR5cGVvZiBsb2MpIHtcbiAgICAgICAgICAgICAgICB1cmkgPSBsb2MucHJvdG9jb2wgKyBcIi8vXCIgKyB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmkgPSBcImh0dHBzOi8vXCIgKyB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcGFyc2VcbiAgICAgICAgb2JqID0gcGFyc2UodXJpKTtcbiAgICB9XG4gICAgLy8gbWFrZSBzdXJlIHdlIHRyZWF0IGBsb2NhbGhvc3Q6ODBgIGFuZCBgbG9jYWxob3N0YCBlcXVhbGx5XG4gICAgaWYgKCFvYmoucG9ydCkge1xuICAgICAgICBpZiAoL14oaHR0cHx3cykkLy50ZXN0KG9iai5wcm90b2NvbCkpIHtcbiAgICAgICAgICAgIG9iai5wb3J0ID0gXCI4MFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eKGh0dHB8d3MpcyQvLnRlc3Qob2JqLnByb3RvY29sKSkge1xuICAgICAgICAgICAgb2JqLnBvcnQgPSBcIjQ0M1wiO1xuICAgICAgICB9XG4gICAgfVxuICAgIG9iai5wYXRoID0gb2JqLnBhdGggfHwgXCIvXCI7XG4gICAgY29uc3QgaXB2NiA9IG9iai5ob3N0LmluZGV4T2YoXCI6XCIpICE9PSAtMTtcbiAgICBjb25zdCBob3N0ID0gaXB2NiA/IFwiW1wiICsgb2JqLmhvc3QgKyBcIl1cIiA6IG9iai5ob3N0O1xuICAgIC8vIGRlZmluZSB1bmlxdWUgaWRcbiAgICBvYmouaWQgPSBvYmoucHJvdG9jb2wgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgb2JqLnBvcnQgKyBwYXRoO1xuICAgIC8vIGRlZmluZSBocmVmXG4gICAgb2JqLmhyZWYgPVxuICAgICAgICBvYmoucHJvdG9jb2wgK1xuICAgICAgICAgICAgXCI6Ly9cIiArXG4gICAgICAgICAgICBob3N0ICtcbiAgICAgICAgICAgIChsb2MgJiYgbG9jLnBvcnQgPT09IG9iai5wb3J0ID8gXCJcIiA6IFwiOlwiICsgb2JqLnBvcnQpO1xuICAgIHJldHVybiBvYmo7XG59XG4iLCJjb25zdCB3aXRoTmF0aXZlQXJyYXlCdWZmZXIgPSB0eXBlb2YgQXJyYXlCdWZmZXIgPT09IFwiZnVuY3Rpb25cIjtcbmNvbnN0IGlzVmlldyA9IChvYmopID0+IHtcbiAgICByZXR1cm4gdHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gQXJyYXlCdWZmZXIuaXNWaWV3KG9iailcbiAgICAgICAgOiBvYmouYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG59O1xuY29uc3QgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuY29uc3Qgd2l0aE5hdGl2ZUJsb2IgPSB0eXBlb2YgQmxvYiA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgKHR5cGVvZiBCbG9iICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIHRvU3RyaW5nLmNhbGwoQmxvYikgPT09IFwiW29iamVjdCBCbG9iQ29uc3RydWN0b3JdXCIpO1xuY29uc3Qgd2l0aE5hdGl2ZUZpbGUgPSB0eXBlb2YgRmlsZSA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgKHR5cGVvZiBGaWxlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIHRvU3RyaW5nLmNhbGwoRmlsZSkgPT09IFwiW29iamVjdCBGaWxlQ29uc3RydWN0b3JdXCIpO1xuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgb2JqIGlzIGEgQnVmZmVyLCBhbiBBcnJheUJ1ZmZlciwgYSBCbG9iIG9yIGEgRmlsZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNCaW5hcnkob2JqKSB7XG4gICAgcmV0dXJuICgod2l0aE5hdGl2ZUFycmF5QnVmZmVyICYmIChvYmogaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBpc1ZpZXcob2JqKSkpIHx8XG4gICAgICAgICh3aXRoTmF0aXZlQmxvYiAmJiBvYmogaW5zdGFuY2VvZiBCbG9iKSB8fFxuICAgICAgICAod2l0aE5hdGl2ZUZpbGUgJiYgb2JqIGluc3RhbmNlb2YgRmlsZSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGhhc0JpbmFyeShvYmosIHRvSlNPTikge1xuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKGhhc0JpbmFyeShvYmpbaV0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoaXNCaW5hcnkob2JqKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG9iai50b0pTT04gJiZcbiAgICAgICAgdHlwZW9mIG9iai50b0pTT04gPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICBhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBoYXNCaW5hcnkob2JqLnRvSlNPTigpLCB0cnVlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpICYmIGhhc0JpbmFyeShvYmpba2V5XSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbiIsImltcG9ydCB7IGlzQmluYXJ5IH0gZnJvbSBcIi4vaXMtYmluYXJ5LmpzXCI7XG4vKipcbiAqIFJlcGxhY2VzIGV2ZXJ5IEJ1ZmZlciB8IEFycmF5QnVmZmVyIHwgQmxvYiB8IEZpbGUgaW4gcGFja2V0IHdpdGggYSBudW1iZXJlZCBwbGFjZWhvbGRlci5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0IC0gc29ja2V0LmlvIGV2ZW50IHBhY2tldFxuICogQHJldHVybiB7T2JqZWN0fSB3aXRoIGRlY29uc3RydWN0ZWQgcGFja2V0IGFuZCBsaXN0IG9mIGJ1ZmZlcnNcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29uc3RydWN0UGFja2V0KHBhY2tldCkge1xuICAgIGNvbnN0IGJ1ZmZlcnMgPSBbXTtcbiAgICBjb25zdCBwYWNrZXREYXRhID0gcGFja2V0LmRhdGE7XG4gICAgY29uc3QgcGFjayA9IHBhY2tldDtcbiAgICBwYWNrLmRhdGEgPSBfZGVjb25zdHJ1Y3RQYWNrZXQocGFja2V0RGF0YSwgYnVmZmVycyk7XG4gICAgcGFjay5hdHRhY2htZW50cyA9IGJ1ZmZlcnMubGVuZ3RoOyAvLyBudW1iZXIgb2YgYmluYXJ5ICdhdHRhY2htZW50cydcbiAgICByZXR1cm4geyBwYWNrZXQ6IHBhY2ssIGJ1ZmZlcnM6IGJ1ZmZlcnMgfTtcbn1cbmZ1bmN0aW9uIF9kZWNvbnN0cnVjdFBhY2tldChkYXRhLCBidWZmZXJzKSB7XG4gICAgaWYgKCFkYXRhKVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICBpZiAoaXNCaW5hcnkoZGF0YSkpIHtcbiAgICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSB7IF9wbGFjZWhvbGRlcjogdHJ1ZSwgbnVtOiBidWZmZXJzLmxlbmd0aCB9O1xuICAgICAgICBidWZmZXJzLnB1c2goZGF0YSk7XG4gICAgICAgIHJldHVybiBwbGFjZWhvbGRlcjtcbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICBjb25zdCBuZXdEYXRhID0gbmV3IEFycmF5KGRhdGEubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuZXdEYXRhW2ldID0gX2RlY29uc3RydWN0UGFja2V0KGRhdGFbaV0sIGJ1ZmZlcnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdEYXRhO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJvYmplY3RcIiAmJiAhKGRhdGEgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICBjb25zdCBuZXdEYXRhID0ge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSkge1xuICAgICAgICAgICAgICAgIG5ld0RhdGFba2V5XSA9IF9kZWNvbnN0cnVjdFBhY2tldChkYXRhW2tleV0sIGJ1ZmZlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbn1cbi8qKlxuICogUmVjb25zdHJ1Y3RzIGEgYmluYXJ5IHBhY2tldCBmcm9tIGl0cyBwbGFjZWhvbGRlciBwYWNrZXQgYW5kIGJ1ZmZlcnNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0IC0gZXZlbnQgcGFja2V0IHdpdGggcGxhY2Vob2xkZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBidWZmZXJzIC0gYmluYXJ5IGJ1ZmZlcnMgdG8gcHV0IGluIHBsYWNlaG9sZGVyIHBvc2l0aW9uc1xuICogQHJldHVybiB7T2JqZWN0fSByZWNvbnN0cnVjdGVkIHBhY2tldFxuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjb25zdHJ1Y3RQYWNrZXQocGFja2V0LCBidWZmZXJzKSB7XG4gICAgcGFja2V0LmRhdGEgPSBfcmVjb25zdHJ1Y3RQYWNrZXQocGFja2V0LmRhdGEsIGJ1ZmZlcnMpO1xuICAgIGRlbGV0ZSBwYWNrZXQuYXR0YWNobWVudHM7IC8vIG5vIGxvbmdlciB1c2VmdWxcbiAgICByZXR1cm4gcGFja2V0O1xufVxuZnVuY3Rpb24gX3JlY29uc3RydWN0UGFja2V0KGRhdGEsIGJ1ZmZlcnMpIHtcbiAgICBpZiAoIWRhdGEpXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIGlmIChkYXRhICYmIGRhdGEuX3BsYWNlaG9sZGVyID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IGlzSW5kZXhWYWxpZCA9IHR5cGVvZiBkYXRhLm51bSA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICAgICAgZGF0YS5udW0gPj0gMCAmJlxuICAgICAgICAgICAgZGF0YS5udW0gPCBidWZmZXJzLmxlbmd0aDtcbiAgICAgICAgaWYgKGlzSW5kZXhWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlcnNbZGF0YS5udW1dOyAvLyBhcHByb3ByaWF0ZSBidWZmZXIgKHNob3VsZCBiZSBuYXR1cmFsIG9yZGVyIGFueXdheSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgYXR0YWNobWVudHNcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGRhdGFbaV0gPSBfcmVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtpXSwgYnVmZmVycyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgZGF0YVtrZXldID0gX3JlY29uc3RydWN0UGFja2V0KGRhdGFba2V5XSwgYnVmZmVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG59XG4iLCJpbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IGRlY29uc3RydWN0UGFja2V0LCByZWNvbnN0cnVjdFBhY2tldCB9IGZyb20gXCIuL2JpbmFyeS5qc1wiO1xuaW1wb3J0IHsgaXNCaW5hcnksIGhhc0JpbmFyeSB9IGZyb20gXCIuL2lzLWJpbmFyeS5qc1wiO1xuLyoqXG4gKiBUaGVzZSBzdHJpbmdzIG11c3Qgbm90IGJlIHVzZWQgYXMgZXZlbnQgbmFtZXMsIGFzIHRoZXkgaGF2ZSBhIHNwZWNpYWwgbWVhbmluZy5cbiAqL1xuY29uc3QgUkVTRVJWRURfRVZFTlRTID0gW1xuICAgIFwiY29ubmVjdFwiLFxuICAgIFwiY29ubmVjdF9lcnJvclwiLFxuICAgIFwiZGlzY29ubmVjdFwiLFxuICAgIFwiZGlzY29ubmVjdGluZ1wiLFxuICAgIFwibmV3TGlzdGVuZXJcIixcbiAgICBcInJlbW92ZUxpc3RlbmVyXCIsIC8vIHVzZWQgYnkgdGhlIE5vZGUuanMgRXZlbnRFbWl0dGVyXG5dO1xuLyoqXG4gKiBQcm90b2NvbCB2ZXJzaW9uLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNvbnN0IHByb3RvY29sID0gNTtcbmV4cG9ydCB2YXIgUGFja2V0VHlwZTtcbihmdW5jdGlvbiAoUGFja2V0VHlwZSkge1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkNPTk5FQ1RcIl0gPSAwXSA9IFwiQ09OTkVDVFwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkRJU0NPTk5FQ1RcIl0gPSAxXSA9IFwiRElTQ09OTkVDVFwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkVWRU5UXCJdID0gMl0gPSBcIkVWRU5UXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQUNLXCJdID0gM10gPSBcIkFDS1wiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkNPTk5FQ1RfRVJST1JcIl0gPSA0XSA9IFwiQ09OTkVDVF9FUlJPUlwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkJJTkFSWV9FVkVOVFwiXSA9IDVdID0gXCJCSU5BUllfRVZFTlRcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJCSU5BUllfQUNLXCJdID0gNl0gPSBcIkJJTkFSWV9BQ0tcIjtcbn0pKFBhY2tldFR5cGUgfHwgKFBhY2tldFR5cGUgPSB7fSkpO1xuLyoqXG4gKiBBIHNvY2tldC5pbyBFbmNvZGVyIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBjbGFzcyBFbmNvZGVyIHtcbiAgICAvKipcbiAgICAgKiBFbmNvZGVyIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZXBsYWNlciAtIGN1c3RvbSByZXBsYWNlciB0byBwYXNzIGRvd24gdG8gSlNPTi5wYXJzZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHJlcGxhY2VyKSB7XG4gICAgICAgIHRoaXMucmVwbGFjZXIgPSByZXBsYWNlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlIGEgcGFja2V0IGFzIGEgc2luZ2xlIHN0cmluZyBpZiBub24tYmluYXJ5LCBvciBhcyBhXG4gICAgICogYnVmZmVyIHNlcXVlbmNlLCBkZXBlbmRpbmcgb24gcGFja2V0IHR5cGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIC0gcGFja2V0IG9iamVjdFxuICAgICAqL1xuICAgIGVuY29kZShvYmopIHtcbiAgICAgICAgaWYgKG9iai50eXBlID09PSBQYWNrZXRUeXBlLkVWRU5UIHx8IG9iai50eXBlID09PSBQYWNrZXRUeXBlLkFDSykge1xuICAgICAgICAgICAgaWYgKGhhc0JpbmFyeShvYmopKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5jb2RlQXNCaW5hcnkoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBvYmoudHlwZSA9PT0gUGFja2V0VHlwZS5FVkVOVFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVFxuICAgICAgICAgICAgICAgICAgICAgICAgOiBQYWNrZXRUeXBlLkJJTkFSWV9BQ0ssXG4gICAgICAgICAgICAgICAgICAgIG5zcDogb2JqLm5zcCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogb2JqLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGlkOiBvYmouaWQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFt0aGlzLmVuY29kZUFzU3RyaW5nKG9iaildO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNvZGUgcGFja2V0IGFzIHN0cmluZy5cbiAgICAgKi9cbiAgICBlbmNvZGVBc1N0cmluZyhvYmopIHtcbiAgICAgICAgLy8gZmlyc3QgaXMgdHlwZVxuICAgICAgICBsZXQgc3RyID0gXCJcIiArIG9iai50eXBlO1xuICAgICAgICAvLyBhdHRhY2htZW50cyBpZiB3ZSBoYXZlIHRoZW1cbiAgICAgICAgaWYgKG9iai50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVCB8fFxuICAgICAgICAgICAgb2JqLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0FDSykge1xuICAgICAgICAgICAgc3RyICs9IG9iai5hdHRhY2htZW50cyArIFwiLVwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIHdlIGhhdmUgYSBuYW1lc3BhY2Ugb3RoZXIgdGhhbiBgL2BcbiAgICAgICAgLy8gd2UgYXBwZW5kIGl0IGZvbGxvd2VkIGJ5IGEgY29tbWEgYCxgXG4gICAgICAgIGlmIChvYmoubnNwICYmIFwiL1wiICE9PSBvYmoubnNwKSB7XG4gICAgICAgICAgICBzdHIgKz0gb2JqLm5zcCArIFwiLFwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIGltbWVkaWF0ZWx5IGZvbGxvd2VkIGJ5IHRoZSBpZFxuICAgICAgICBpZiAobnVsbCAhPSBvYmouaWQpIHtcbiAgICAgICAgICAgIHN0ciArPSBvYmouaWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8ganNvbiBkYXRhXG4gICAgICAgIGlmIChudWxsICE9IG9iai5kYXRhKSB7XG4gICAgICAgICAgICBzdHIgKz0gSlNPTi5zdHJpbmdpZnkob2JqLmRhdGEsIHRoaXMucmVwbGFjZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZSBwYWNrZXQgYXMgJ2J1ZmZlciBzZXF1ZW5jZScgYnkgcmVtb3ZpbmcgYmxvYnMsIGFuZFxuICAgICAqIGRlY29uc3RydWN0aW5nIHBhY2tldCBpbnRvIG9iamVjdCB3aXRoIHBsYWNlaG9sZGVycyBhbmRcbiAgICAgKiBhIGxpc3Qgb2YgYnVmZmVycy5cbiAgICAgKi9cbiAgICBlbmNvZGVBc0JpbmFyeShvYmopIHtcbiAgICAgICAgY29uc3QgZGVjb25zdHJ1Y3Rpb24gPSBkZWNvbnN0cnVjdFBhY2tldChvYmopO1xuICAgICAgICBjb25zdCBwYWNrID0gdGhpcy5lbmNvZGVBc1N0cmluZyhkZWNvbnN0cnVjdGlvbi5wYWNrZXQpO1xuICAgICAgICBjb25zdCBidWZmZXJzID0gZGVjb25zdHJ1Y3Rpb24uYnVmZmVycztcbiAgICAgICAgYnVmZmVycy51bnNoaWZ0KHBhY2spOyAvLyBhZGQgcGFja2V0IGluZm8gdG8gYmVnaW5uaW5nIG9mIGRhdGEgbGlzdFxuICAgICAgICByZXR1cm4gYnVmZmVyczsgLy8gd3JpdGUgYWxsIHRoZSBidWZmZXJzXG4gICAgfVxufVxuLy8gc2VlIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzg1MTEyODEvY2hlY2staWYtYS12YWx1ZS1pcy1hbi1vYmplY3QtaW4tamF2YXNjcmlwdFxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIjtcbn1cbi8qKlxuICogQSBzb2NrZXQuaW8gRGVjb2RlciBpbnN0YW5jZVxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gZGVjb2RlclxuICovXG5leHBvcnQgY2xhc3MgRGVjb2RlciBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIERlY29kZXIgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJldml2ZXIgLSBjdXN0b20gcmV2aXZlciB0byBwYXNzIGRvd24gdG8gSlNPTi5zdHJpbmdpZnlcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihyZXZpdmVyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucmV2aXZlciA9IHJldml2ZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlY29kZXMgYW4gZW5jb2RlZCBwYWNrZXQgc3RyaW5nIGludG8gcGFja2V0IEpTT04uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqIC0gZW5jb2RlZCBwYWNrZXRcbiAgICAgKi9cbiAgICBhZGQob2JqKSB7XG4gICAgICAgIGxldCBwYWNrZXQ7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZWNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZ290IHBsYWludGV4dCBkYXRhIHdoZW4gcmVjb25zdHJ1Y3RpbmcgYSBwYWNrZXRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYWNrZXQgPSB0aGlzLmRlY29kZVN0cmluZyhvYmopO1xuICAgICAgICAgICAgY29uc3QgaXNCaW5hcnlFdmVudCA9IHBhY2tldC50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVDtcbiAgICAgICAgICAgIGlmIChpc0JpbmFyeUV2ZW50IHx8IHBhY2tldC50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9BQ0spIHtcbiAgICAgICAgICAgICAgICBwYWNrZXQudHlwZSA9IGlzQmluYXJ5RXZlbnQgPyBQYWNrZXRUeXBlLkVWRU5UIDogUGFja2V0VHlwZS5BQ0s7XG4gICAgICAgICAgICAgICAgLy8gYmluYXJ5IHBhY2tldCdzIGpzb25cbiAgICAgICAgICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IgPSBuZXcgQmluYXJ5UmVjb25zdHJ1Y3RvcihwYWNrZXQpO1xuICAgICAgICAgICAgICAgIC8vIG5vIGF0dGFjaG1lbnRzLCBsYWJlbGVkIGJpbmFyeSBidXQgbm8gYmluYXJ5IGRhdGEgdG8gZm9sbG93XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldC5hdHRhY2htZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJkZWNvZGVkXCIsIHBhY2tldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbm9uLWJpbmFyeSBmdWxsIHBhY2tldFxuICAgICAgICAgICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImRlY29kZWRcIiwgcGFja2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0JpbmFyeShvYmopIHx8IG9iai5iYXNlNjQpIHtcbiAgICAgICAgICAgIC8vIHJhdyBiaW5hcnkgZGF0YVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnb3QgYmluYXJ5IGRhdGEgd2hlbiBub3QgcmVjb25zdHJ1Y3RpbmcgYSBwYWNrZXRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYWNrZXQgPSB0aGlzLnJlY29uc3RydWN0b3IudGFrZUJpbmFyeURhdGEob2JqKTtcbiAgICAgICAgICAgICAgICBpZiAocGFja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlY2VpdmVkIGZpbmFsIGJ1ZmZlclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJkZWNvZGVkXCIsIHBhY2tldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB0eXBlOiBcIiArIG9iaik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjb2RlIGEgcGFja2V0IFN0cmluZyAoSlNPTiBkYXRhKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm4ge09iamVjdH0gcGFja2V0XG4gICAgICovXG4gICAgZGVjb2RlU3RyaW5nKHN0cikge1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIC8vIGxvb2sgdXAgdHlwZVxuICAgICAgICBjb25zdCBwID0ge1xuICAgICAgICAgICAgdHlwZTogTnVtYmVyKHN0ci5jaGFyQXQoMCkpLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoUGFja2V0VHlwZVtwLnR5cGVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gcGFja2V0IHR5cGUgXCIgKyBwLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvb2sgdXAgYXR0YWNobWVudHMgaWYgdHlwZSBiaW5hcnlcbiAgICAgICAgaWYgKHAudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfRVZFTlQgfHxcbiAgICAgICAgICAgIHAudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfQUNLKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgd2hpbGUgKHN0ci5jaGFyQXQoKytpKSAhPT0gXCItXCIgJiYgaSAhPSBzdHIubGVuZ3RoKSB7IH1cbiAgICAgICAgICAgIGNvbnN0IGJ1ZiA9IHN0ci5zdWJzdHJpbmcoc3RhcnQsIGkpO1xuICAgICAgICAgICAgaWYgKGJ1ZiAhPSBOdW1iZXIoYnVmKSB8fCBzdHIuY2hhckF0KGkpICE9PSBcIi1cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIklsbGVnYWwgYXR0YWNobWVudHNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwLmF0dGFjaG1lbnRzID0gTnVtYmVyKGJ1Zik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbG9vayB1cCBuYW1lc3BhY2UgKGlmIGFueSlcbiAgICAgICAgaWYgKFwiL1wiID09PSBzdHIuY2hhckF0KGkgKyAxKSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgIHdoaWxlICgrK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjID0gc3RyLmNoYXJBdChpKTtcbiAgICAgICAgICAgICAgICBpZiAoXCIsXCIgPT09IGMpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGlmIChpID09PSBzdHIubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHAubnNwID0gc3RyLnN1YnN0cmluZyhzdGFydCwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwLm5zcCA9IFwiL1wiO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvb2sgdXAgaWRcbiAgICAgICAgY29uc3QgbmV4dCA9IHN0ci5jaGFyQXQoaSArIDEpO1xuICAgICAgICBpZiAoXCJcIiAhPT0gbmV4dCAmJiBOdW1iZXIobmV4dCkgPT0gbmV4dCkge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgIHdoaWxlICgrK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjID0gc3RyLmNoYXJBdChpKTtcbiAgICAgICAgICAgICAgICBpZiAobnVsbCA9PSBjIHx8IE51bWJlcihjKSAhPSBjKSB7XG4gICAgICAgICAgICAgICAgICAgIC0taTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpID09PSBzdHIubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHAuaWQgPSBOdW1iZXIoc3RyLnN1YnN0cmluZyhzdGFydCwgaSArIDEpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb29rIHVwIGpzb24gZGF0YVxuICAgICAgICBpZiAoc3RyLmNoYXJBdCgrK2kpKSB7XG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gdGhpcy50cnlQYXJzZShzdHIuc3Vic3RyKGkpKTtcbiAgICAgICAgICAgIGlmIChEZWNvZGVyLmlzUGF5bG9hZFZhbGlkKHAudHlwZSwgcGF5bG9hZCkpIHtcbiAgICAgICAgICAgICAgICBwLmRhdGEgPSBwYXlsb2FkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBwYXlsb2FkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cbiAgICB0cnlQYXJzZShzdHIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHN0ciwgdGhpcy5yZXZpdmVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBpc1BheWxvYWRWYWxpZCh0eXBlLCBwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkNPTk5FQ1Q6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzT2JqZWN0KHBheWxvYWQpO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkRJU0NPTk5FQ1Q6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBheWxvYWQgPT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUX0VSUk9SOlxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIiB8fCBpc09iamVjdChwYXlsb2FkKTtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5FVkVOVDpcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5CSU5BUllfRVZFTlQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIChBcnJheS5pc0FycmF5KHBheWxvYWQpICYmXG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YgcGF5bG9hZFswXSA9PT0gXCJudW1iZXJcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiBwYXlsb2FkWzBdID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUkVTRVJWRURfRVZFTlRTLmluZGV4T2YocGF5bG9hZFswXSkgPT09IC0xKSkpO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkFDSzpcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5CSU5BUllfQUNLOlxuICAgICAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHBheWxvYWQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlYWxsb2NhdGVzIGEgcGFyc2VyJ3MgcmVzb3VyY2VzXG4gICAgICovXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgdGhpcy5yZWNvbnN0cnVjdG9yLmZpbmlzaGVkUmVjb25zdHJ1Y3Rpb24oKTtcbiAgICAgICAgICAgIHRoaXMucmVjb25zdHJ1Y3RvciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG4vKipcbiAqIEEgbWFuYWdlciBvZiBhIGJpbmFyeSBldmVudCdzICdidWZmZXIgc2VxdWVuY2UnLiBTaG91bGRcbiAqIGJlIGNvbnN0cnVjdGVkIHdoZW5ldmVyIGEgcGFja2V0IG9mIHR5cGUgQklOQVJZX0VWRU5UIGlzXG4gKiBkZWNvZGVkLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXRcbiAqIEByZXR1cm4ge0JpbmFyeVJlY29uc3RydWN0b3J9IGluaXRpYWxpemVkIHJlY29uc3RydWN0b3JcbiAqL1xuY2xhc3MgQmluYXJ5UmVjb25zdHJ1Y3RvciB7XG4gICAgY29uc3RydWN0b3IocGFja2V0KSB7XG4gICAgICAgIHRoaXMucGFja2V0ID0gcGFja2V0O1xuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5yZWNvblBhY2sgPSBwYWNrZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiBiaW5hcnkgZGF0YSByZWNlaXZlZCBmcm9tIGNvbm5lY3Rpb25cbiAgICAgKiBhZnRlciBhIEJJTkFSWV9FVkVOVCBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0J1ZmZlciB8IEFycmF5QnVmZmVyfSBiaW5EYXRhIC0gdGhlIHJhdyBiaW5hcnkgZGF0YSByZWNlaXZlZFxuICAgICAqIEByZXR1cm4ge251bGwgfCBPYmplY3R9IHJldHVybnMgbnVsbCBpZiBtb3JlIGJpbmFyeSBkYXRhIGlzIGV4cGVjdGVkIG9yXG4gICAgICogICBhIHJlY29uc3RydWN0ZWQgcGFja2V0IG9iamVjdCBpZiBhbGwgYnVmZmVycyBoYXZlIGJlZW4gcmVjZWl2ZWQuXG4gICAgICovXG4gICAgdGFrZUJpbmFyeURhdGEoYmluRGF0YSkge1xuICAgICAgICB0aGlzLmJ1ZmZlcnMucHVzaChiaW5EYXRhKTtcbiAgICAgICAgaWYgKHRoaXMuYnVmZmVycy5sZW5ndGggPT09IHRoaXMucmVjb25QYWNrLmF0dGFjaG1lbnRzKSB7XG4gICAgICAgICAgICAvLyBkb25lIHdpdGggYnVmZmVyIGxpc3RcbiAgICAgICAgICAgIGNvbnN0IHBhY2tldCA9IHJlY29uc3RydWN0UGFja2V0KHRoaXMucmVjb25QYWNrLCB0aGlzLmJ1ZmZlcnMpO1xuICAgICAgICAgICAgdGhpcy5maW5pc2hlZFJlY29uc3RydWN0aW9uKCk7XG4gICAgICAgICAgICByZXR1cm4gcGFja2V0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbGVhbnMgdXAgYmluYXJ5IHBhY2tldCByZWNvbnN0cnVjdGlvbiB2YXJpYWJsZXMuXG4gICAgICovXG4gICAgZmluaXNoZWRSZWNvbnN0cnVjdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZWNvblBhY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBbXTtcbiAgICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gb24ob2JqLCBldiwgZm4pIHtcbiAgICBvYmoub24oZXYsIGZuKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gc3ViRGVzdHJveSgpIHtcbiAgICAgICAgb2JqLm9mZihldiwgZm4pO1xuICAgIH07XG59XG4iLCJpbXBvcnQgeyBQYWNrZXRUeXBlIH0gZnJvbSBcInNvY2tldC5pby1wYXJzZXJcIjtcbmltcG9ydCB7IG9uIH0gZnJvbSBcIi4vb24uanNcIjtcbmltcG9ydCB7IEVtaXR0ZXIsIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbi8qKlxuICogSW50ZXJuYWwgZXZlbnRzLlxuICogVGhlc2UgZXZlbnRzIGNhbid0IGJlIGVtaXR0ZWQgYnkgdGhlIHVzZXIuXG4gKi9cbmNvbnN0IFJFU0VSVkVEX0VWRU5UUyA9IE9iamVjdC5mcmVlemUoe1xuICAgIGNvbm5lY3Q6IDEsXG4gICAgY29ubmVjdF9lcnJvcjogMSxcbiAgICBkaXNjb25uZWN0OiAxLFxuICAgIGRpc2Nvbm5lY3Rpbmc6IDEsXG4gICAgLy8gRXZlbnRFbWl0dGVyIHJlc2VydmVkIGV2ZW50czogaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9ldmVudHMuaHRtbCNldmVudHNfZXZlbnRfbmV3bGlzdGVuZXJcbiAgICBuZXdMaXN0ZW5lcjogMSxcbiAgICByZW1vdmVMaXN0ZW5lcjogMSxcbn0pO1xuLyoqXG4gKiBBIFNvY2tldCBpcyB0aGUgZnVuZGFtZW50YWwgY2xhc3MgZm9yIGludGVyYWN0aW5nIHdpdGggdGhlIHNlcnZlci5cbiAqXG4gKiBBIFNvY2tldCBiZWxvbmdzIHRvIGEgY2VydGFpbiBOYW1lc3BhY2UgKGJ5IGRlZmF1bHQgLykgYW5kIHVzZXMgYW4gdW5kZXJseWluZyB7QGxpbmsgTWFuYWdlcn0gdG8gY29tbXVuaWNhdGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gKlxuICogc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKFwiY29ubmVjdGVkXCIpO1xuICogfSk7XG4gKlxuICogLy8gc2VuZCBhbiBldmVudCB0byB0aGUgc2VydmVyXG4gKiBzb2NrZXQuZW1pdChcImZvb1wiLCBcImJhclwiKTtcbiAqXG4gKiBzb2NrZXQub24oXCJmb29iYXJcIiwgKCkgPT4ge1xuICogICAvLyBhbiBldmVudCB3YXMgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyXG4gKiB9KTtcbiAqXG4gKiAvLyB1cG9uIGRpc2Nvbm5lY3Rpb25cbiAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKHJlYXNvbikgPT4ge1xuICogICBjb25zb2xlLmxvZyhgZGlzY29ubmVjdGVkIGR1ZSB0byAke3JlYXNvbn1gKTtcbiAqIH0pO1xuICovXG5leHBvcnQgY2xhc3MgU29ja2V0IGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogYFNvY2tldGAgY29uc3RydWN0b3IuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoaW8sIG5zcCwgb3B0cykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgc29ja2V0IGlzIGN1cnJlbnRseSBjb25uZWN0ZWQgdG8gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAgICAgICAgICpcbiAgICAgICAgICogc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmNvbm5lY3RlZCk7IC8vIHRydWVcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5jb25uZWN0ZWQpOyAvLyBmYWxzZVxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBjb25uZWN0aW9uIHN0YXRlIHdhcyByZWNvdmVyZWQgYWZ0ZXIgYSB0ZW1wb3JhcnkgZGlzY29ubmVjdGlvbi4gSW4gdGhhdCBjYXNlLCBhbnkgbWlzc2VkIHBhY2tldHMgd2lsbFxuICAgICAgICAgKiBiZSB0cmFuc21pdHRlZCBieSB0aGUgc2VydmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWNvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJ1ZmZlciBmb3IgcGFja2V0cyByZWNlaXZlZCBiZWZvcmUgdGhlIENPTk5FQ1QgcGFja2V0XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlY2VpdmVCdWZmZXIgPSBbXTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJ1ZmZlciBmb3IgcGFja2V0cyB0aGF0IHdpbGwgYmUgc2VudCBvbmNlIHRoZSBzb2NrZXQgaXMgY29ubmVjdGVkXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNlbmRCdWZmZXIgPSBbXTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBxdWV1ZSBvZiBwYWNrZXRzIHRvIGJlIHNlbnQgd2l0aCByZXRyeSBpbiBjYXNlIG9mIGZhaWx1cmUuXG4gICAgICAgICAqXG4gICAgICAgICAqIFBhY2tldHMgYXJlIHNlbnQgb25lIGJ5IG9uZSwgZWFjaCB3YWl0aW5nIGZvciB0aGUgc2VydmVyIGFja25vd2xlZGdlbWVudCwgaW4gb3JkZXIgdG8gZ3VhcmFudGVlIHRoZSBkZWxpdmVyeSBvcmRlci5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIHNlcXVlbmNlIHRvIGdlbmVyYXRlIHRoZSBJRCBvZiB0aGUge0BsaW5rIFF1ZXVlZFBhY2tldH0uXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9xdWV1ZVNlcSA9IDA7XG4gICAgICAgIHRoaXMuaWRzID0gMDtcbiAgICAgICAgdGhpcy5hY2tzID0ge307XG4gICAgICAgIHRoaXMuZmxhZ3MgPSB7fTtcbiAgICAgICAgdGhpcy5pbyA9IGlvO1xuICAgICAgICB0aGlzLm5zcCA9IG5zcDtcbiAgICAgICAgaWYgKG9wdHMgJiYgb3B0cy5hdXRoKSB7XG4gICAgICAgICAgICB0aGlzLmF1dGggPSBvcHRzLmF1dGg7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMpO1xuICAgICAgICBpZiAodGhpcy5pby5fYXV0b0Nvbm5lY3QpXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgc29ja2V0IGlzIGN1cnJlbnRseSBkaXNjb25uZWN0ZWRcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImNvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmRpc2Nvbm5lY3RlZCk7IC8vIGZhbHNlXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsICgpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5kaXNjb25uZWN0ZWQpOyAvLyB0cnVlXG4gICAgICogfSk7XG4gICAgICovXG4gICAgZ2V0IGRpc2Nvbm5lY3RlZCgpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLmNvbm5lY3RlZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlIHRvIG9wZW4sIGNsb3NlIGFuZCBwYWNrZXQgZXZlbnRzXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN1YkV2ZW50cygpIHtcbiAgICAgICAgaWYgKHRoaXMuc3VicylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgaW8gPSB0aGlzLmlvO1xuICAgICAgICB0aGlzLnN1YnMgPSBbXG4gICAgICAgICAgICBvbihpbywgXCJvcGVuXCIsIHRoaXMub25vcGVuLmJpbmQodGhpcykpLFxuICAgICAgICAgICAgb24oaW8sIFwicGFja2V0XCIsIHRoaXMub25wYWNrZXQuYmluZCh0aGlzKSksXG4gICAgICAgICAgICBvbihpbywgXCJlcnJvclwiLCB0aGlzLm9uZXJyb3IuYmluZCh0aGlzKSksXG4gICAgICAgICAgICBvbihpbywgXCJjbG9zZVwiLCB0aGlzLm9uY2xvc2UuYmluZCh0aGlzKSksXG4gICAgICAgIF07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIFNvY2tldCB3aWxsIHRyeSB0byByZWNvbm5lY3Qgd2hlbiBpdHMgTWFuYWdlciBjb25uZWN0cyBvciByZWNvbm5lY3RzLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAqXG4gICAgICogY29uc29sZS5sb2coc29ja2V0LmFjdGl2ZSk7IC8vIHRydWVcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKHJlYXNvbikgPT4ge1xuICAgICAqICAgaWYgKHJlYXNvbiA9PT0gXCJpbyBzZXJ2ZXIgZGlzY29ubmVjdFwiKSB7XG4gICAgICogICAgIC8vIHRoZSBkaXNjb25uZWN0aW9uIHdhcyBpbml0aWF0ZWQgYnkgdGhlIHNlcnZlciwgeW91IG5lZWQgdG8gbWFudWFsbHkgcmVjb25uZWN0XG4gICAgICogICAgIGNvbnNvbGUubG9nKHNvY2tldC5hY3RpdmUpOyAvLyBmYWxzZVxuICAgICAqICAgfVxuICAgICAqICAgLy8gZWxzZSB0aGUgc29ja2V0IHdpbGwgYXV0b21hdGljYWxseSB0cnkgdG8gcmVjb25uZWN0XG4gICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuYWN0aXZlKTsgLy8gdHJ1ZVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGdldCBhY3RpdmUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuc3VicztcbiAgICB9XG4gICAgLyoqXG4gICAgICogXCJPcGVuc1wiIHRoZSBzb2NrZXQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKHtcbiAgICAgKiAgIGF1dG9Db25uZWN0OiBmYWxzZVxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogc29ja2V0LmNvbm5lY3QoKTtcbiAgICAgKi9cbiAgICBjb25uZWN0KCkge1xuICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgdGhpcy5zdWJFdmVudHMoKTtcbiAgICAgICAgaWYgKCF0aGlzLmlvW1wiX3JlY29ubmVjdGluZ1wiXSlcbiAgICAgICAgICAgIHRoaXMuaW8ub3BlbigpOyAvLyBlbnN1cmUgb3BlblxuICAgICAgICBpZiAoXCJvcGVuXCIgPT09IHRoaXMuaW8uX3JlYWR5U3RhdGUpXG4gICAgICAgICAgICB0aGlzLm9ub3BlbigpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWxpYXMgZm9yIHtAbGluayBjb25uZWN0KCl9LlxuICAgICAqL1xuICAgIG9wZW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3QoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBgbWVzc2FnZWAgZXZlbnQuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBtaW1pY3MgdGhlIFdlYlNvY2tldC5zZW5kKCkgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViU29ja2V0L3NlbmRcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnNlbmQoXCJoZWxsb1wiKTtcbiAgICAgKlxuICAgICAqIC8vIHRoaXMgaXMgZXF1aXZhbGVudCB0b1xuICAgICAqIHNvY2tldC5lbWl0KFwibWVzc2FnZVwiLCBcImhlbGxvXCIpO1xuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgc2VuZCguLi5hcmdzKSB7XG4gICAgICAgIGFyZ3MudW5zaGlmdChcIm1lc3NhZ2VcIik7XG4gICAgICAgIHRoaXMuZW1pdC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRlIGBlbWl0YC5cbiAgICAgKiBJZiB0aGUgZXZlbnQgaXMgaW4gYGV2ZW50c2AsIGl0J3MgZW1pdHRlZCBub3JtYWxseS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LmVtaXQoXCJoZWxsb1wiLCBcIndvcmxkXCIpO1xuICAgICAqXG4gICAgICogLy8gYWxsIHNlcmlhbGl6YWJsZSBkYXRhc3RydWN0dXJlcyBhcmUgc3VwcG9ydGVkIChubyBuZWVkIHRvIGNhbGwgSlNPTi5zdHJpbmdpZnkpXG4gICAgICogc29ja2V0LmVtaXQoXCJoZWxsb1wiLCAxLCBcIjJcIiwgeyAzOiBbXCI0XCJdLCA1OiBVaW50OEFycmF5LmZyb20oWzZdKSB9KTtcbiAgICAgKlxuICAgICAqIC8vIHdpdGggYW4gYWNrbm93bGVkZ2VtZW50IGZyb20gdGhlIHNlcnZlclxuICAgICAqIHNvY2tldC5lbWl0KFwiaGVsbG9cIiwgXCJ3b3JsZFwiLCAodmFsKSA9PiB7XG4gICAgICogICAvLyAuLi5cbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIGVtaXQoZXYsIC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKFJFU0VSVkVEX0VWRU5UUy5oYXNPd25Qcm9wZXJ0eShldikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCInICsgZXYudG9TdHJpbmcoKSArICdcIiBpcyBhIHJlc2VydmVkIGV2ZW50IG5hbWUnKTtcbiAgICAgICAgfVxuICAgICAgICBhcmdzLnVuc2hpZnQoZXYpO1xuICAgICAgICBpZiAodGhpcy5fb3B0cy5yZXRyaWVzICYmICF0aGlzLmZsYWdzLmZyb21RdWV1ZSAmJiAhdGhpcy5mbGFncy52b2xhdGlsZSkge1xuICAgICAgICAgICAgdGhpcy5fYWRkVG9RdWV1ZShhcmdzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgICAgICAgIHR5cGU6IFBhY2tldFR5cGUuRVZFTlQsXG4gICAgICAgICAgICBkYXRhOiBhcmdzLFxuICAgICAgICB9O1xuICAgICAgICBwYWNrZXQub3B0aW9ucyA9IHt9O1xuICAgICAgICBwYWNrZXQub3B0aW9ucy5jb21wcmVzcyA9IHRoaXMuZmxhZ3MuY29tcHJlc3MgIT09IGZhbHNlO1xuICAgICAgICAvLyBldmVudCBhY2sgY2FsbGJhY2tcbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSkge1xuICAgICAgICAgICAgY29uc3QgaWQgPSB0aGlzLmlkcysrO1xuICAgICAgICAgICAgY29uc3QgYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyQWNrQ2FsbGJhY2soaWQsIGFjayk7XG4gICAgICAgICAgICBwYWNrZXQuaWQgPSBpZDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpc1RyYW5zcG9ydFdyaXRhYmxlID0gdGhpcy5pby5lbmdpbmUgJiZcbiAgICAgICAgICAgIHRoaXMuaW8uZW5naW5lLnRyYW5zcG9ydCAmJlxuICAgICAgICAgICAgdGhpcy5pby5lbmdpbmUudHJhbnNwb3J0LndyaXRhYmxlO1xuICAgICAgICBjb25zdCBkaXNjYXJkUGFja2V0ID0gdGhpcy5mbGFncy52b2xhdGlsZSAmJiAoIWlzVHJhbnNwb3J0V3JpdGFibGUgfHwgIXRoaXMuY29ubmVjdGVkKTtcbiAgICAgICAgaWYgKGRpc2NhcmRQYWNrZXQpIHtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5ub3RpZnlPdXRnb2luZ0xpc3RlbmVycyhwYWNrZXQpO1xuICAgICAgICAgICAgdGhpcy5wYWNrZXQocGFja2V0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZEJ1ZmZlci5wdXNoKHBhY2tldCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mbGFncyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVnaXN0ZXJBY2tDYWxsYmFjayhpZCwgYWNrKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IChfYSA9IHRoaXMuZmxhZ3MudGltZW91dCkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogdGhpcy5fb3B0cy5hY2tUaW1lb3V0O1xuICAgICAgICBpZiAodGltZW91dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmFja3NbaWRdID0gYWNrO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLmlvLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5hY2tzW2lkXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZW5kQnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VuZEJ1ZmZlcltpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQnVmZmVyLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhY2suY2FsbCh0aGlzLCBuZXcgRXJyb3IoXCJvcGVyYXRpb24gaGFzIHRpbWVkIG91dFwiKSk7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB0aGlzLmFja3NbaWRdID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRoaXMuaW8uY2xlYXJUaW1lb3V0Rm4odGltZXIpO1xuICAgICAgICAgICAgYWNrLmFwcGx5KHRoaXMsIFtudWxsLCAuLi5hcmdzXSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVtaXRzIGFuIGV2ZW50IGFuZCB3YWl0cyBmb3IgYW4gYWNrbm93bGVkZ2VtZW50XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIHdpdGhvdXQgdGltZW91dFxuICAgICAqIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc29ja2V0LmVtaXRXaXRoQWNrKFwiaGVsbG9cIiwgXCJ3b3JsZFwiKTtcbiAgICAgKlxuICAgICAqIC8vIHdpdGggYSBzcGVjaWZpYyB0aW1lb3V0XG4gICAgICogdHJ5IHtcbiAgICAgKiAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc29ja2V0LnRpbWVvdXQoMTAwMCkuZW1pdFdpdGhBY2soXCJoZWxsb1wiLCBcIndvcmxkXCIpO1xuICAgICAqIH0gY2F0Y2ggKGVycikge1xuICAgICAqICAgLy8gdGhlIHNlcnZlciBkaWQgbm90IGFja25vd2xlZGdlIHRoZSBldmVudCBpbiB0aGUgZ2l2ZW4gZGVsYXlcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIGEgUHJvbWlzZSB0aGF0IHdpbGwgYmUgZnVsZmlsbGVkIHdoZW4gdGhlIHNlcnZlciBhY2tub3dsZWRnZXMgdGhlIGV2ZW50XG4gICAgICovXG4gICAgZW1pdFdpdGhBY2soZXYsIC4uLmFyZ3MpIHtcbiAgICAgICAgLy8gdGhlIHRpbWVvdXQgZmxhZyBpcyBvcHRpb25hbFxuICAgICAgICBjb25zdCB3aXRoRXJyID0gdGhpcy5mbGFncy50aW1lb3V0ICE9PSB1bmRlZmluZWQgfHwgdGhpcy5fb3B0cy5hY2tUaW1lb3V0ICE9PSB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBhcmdzLnB1c2goKGFyZzEsIGFyZzIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAod2l0aEVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJnMSA/IHJlamVjdChhcmcxKSA6IHJlc29sdmUoYXJnMik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShhcmcxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChldiwgLi4uYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGQgdGhlIHBhY2tldCB0byB0aGUgcXVldWUuXG4gICAgICogQHBhcmFtIGFyZ3NcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRUb1F1ZXVlKGFyZ3MpIHtcbiAgICAgICAgbGV0IGFjaztcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYWNrZXQgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5fcXVldWVTZXErKyxcbiAgICAgICAgICAgIHRyeUNvdW50OiAwLFxuICAgICAgICAgICAgcGVuZGluZzogZmFsc2UsXG4gICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgZmxhZ3M6IE9iamVjdC5hc3NpZ24oeyBmcm9tUXVldWU6IHRydWUgfSwgdGhpcy5mbGFncyksXG4gICAgICAgIH07XG4gICAgICAgIGFyZ3MucHVzaCgoZXJyLCAuLi5yZXNwb25zZUFyZ3MpID0+IHtcbiAgICAgICAgICAgIGlmIChwYWNrZXQgIT09IHRoaXMuX3F1ZXVlWzBdKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlIHBhY2tldCBoYXMgYWxyZWFkeSBiZWVuIGFja25vd2xlZGdlZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGhhc0Vycm9yID0gZXJyICE9PSBudWxsO1xuICAgICAgICAgICAgaWYgKGhhc0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldC50cnlDb3VudCA+IHRoaXMuX29wdHMucmV0cmllcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgaWYgKGFjaykge1xuICAgICAgICAgICAgICAgICAgICBhY2sobnVsbCwgLi4ucmVzcG9uc2VBcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYWNrZXQucGVuZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RyYWluUXVldWUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2gocGFja2V0KTtcbiAgICAgICAgdGhpcy5fZHJhaW5RdWV1ZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kIHRoZSBmaXJzdCBwYWNrZXQgb2YgdGhlIHF1ZXVlLCBhbmQgd2FpdCBmb3IgYW4gYWNrbm93bGVkZ2VtZW50IGZyb20gdGhlIHNlcnZlci5cbiAgICAgKiBAcGFyYW0gZm9yY2UgLSB3aGV0aGVyIHRvIHJlc2VuZCBhIHBhY2tldCB0aGF0IGhhcyBub3QgYmVlbiBhY2tub3dsZWRnZWQgeWV0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kcmFpblF1ZXVlKGZvcmNlID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RlZCB8fCB0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYWNrZXQgPSB0aGlzLl9xdWV1ZVswXTtcbiAgICAgICAgaWYgKHBhY2tldC5wZW5kaW5nICYmICFmb3JjZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBhY2tldC5wZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgcGFja2V0LnRyeUNvdW50Kys7XG4gICAgICAgIHRoaXMuZmxhZ3MgPSBwYWNrZXQuZmxhZ3M7XG4gICAgICAgIHRoaXMuZW1pdC5hcHBseSh0aGlzLCBwYWNrZXQuYXJncyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcGFja2V0KHBhY2tldCkge1xuICAgICAgICBwYWNrZXQubnNwID0gdGhpcy5uc3A7XG4gICAgICAgIHRoaXMuaW8uX3BhY2tldChwYWNrZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlbmdpbmUgYG9wZW5gLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbm9wZW4oKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5hdXRoID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5hdXRoKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VuZENvbm5lY3RQYWNrZXQoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbmRDb25uZWN0UGFja2V0KHRoaXMuYXV0aCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBDT05ORUNUIHBhY2tldCB0byBpbml0aWF0ZSB0aGUgU29ja2V0LklPIHNlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NlbmRDb25uZWN0UGFja2V0KGRhdGEpIHtcbiAgICAgICAgdGhpcy5wYWNrZXQoe1xuICAgICAgICAgICAgdHlwZTogUGFja2V0VHlwZS5DT05ORUNULFxuICAgICAgICAgICAgZGF0YTogdGhpcy5fcGlkXG4gICAgICAgICAgICAgICAgPyBPYmplY3QuYXNzaWduKHsgcGlkOiB0aGlzLl9waWQsIG9mZnNldDogdGhpcy5fbGFzdE9mZnNldCB9LCBkYXRhKVxuICAgICAgICAgICAgICAgIDogZGF0YSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBvciBtYW5hZ2VyIGBlcnJvcmAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmVycm9yKGVycikge1xuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNvbm5lY3RfZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlbmdpbmUgYGNsb3NlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFzb25cbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uY2xvc2UocmVhc29uLCBkZXNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICBkZWxldGUgdGhpcy5pZDtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkaXNjb25uZWN0XCIsIHJlYXNvbiwgZGVzY3JpcHRpb24pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2l0aCBzb2NrZXQgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25wYWNrZXQocGFja2V0KSB7XG4gICAgICAgIGNvbnN0IHNhbWVOYW1lc3BhY2UgPSBwYWNrZXQubnNwID09PSB0aGlzLm5zcDtcbiAgICAgICAgaWYgKCFzYW1lTmFtZXNwYWNlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBzd2l0Y2ggKHBhY2tldC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVDpcbiAgICAgICAgICAgICAgICBpZiAocGFja2V0LmRhdGEgJiYgcGFja2V0LmRhdGEuc2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25jb25uZWN0KHBhY2tldC5kYXRhLnNpZCwgcGFja2V0LmRhdGEucGlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY29ubmVjdF9lcnJvclwiLCBuZXcgRXJyb3IoXCJJdCBzZWVtcyB5b3UgYXJlIHRyeWluZyB0byByZWFjaCBhIFNvY2tldC5JTyBzZXJ2ZXIgaW4gdjIueCB3aXRoIGEgdjMueCBjbGllbnQsIGJ1dCB0aGV5IGFyZSBub3QgY29tcGF0aWJsZSAobW9yZSBpbmZvcm1hdGlvbiBoZXJlOiBodHRwczovL3NvY2tldC5pby9kb2NzL3YzL21pZ3JhdGluZy1mcm9tLTIteC10by0zLTAvKVwiKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkVWRU5UOlxuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVDpcbiAgICAgICAgICAgICAgICB0aGlzLm9uZXZlbnQocGFja2V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5BQ0s6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0FDSzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uYWNrKHBhY2tldCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRElTQ09OTkVDVDpcbiAgICAgICAgICAgICAgICB0aGlzLm9uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkNPTk5FQ1RfRVJST1I6XG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKHBhY2tldC5kYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBlcnIuZGF0YSA9IHBhY2tldC5kYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0X2Vycm9yXCIsIGVycik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gYSBzZXJ2ZXIgZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmV2ZW50KHBhY2tldCkge1xuICAgICAgICBjb25zdCBhcmdzID0gcGFja2V0LmRhdGEgfHwgW107XG4gICAgICAgIGlmIChudWxsICE9IHBhY2tldC5pZCkge1xuICAgICAgICAgICAgYXJncy5wdXNoKHRoaXMuYWNrKHBhY2tldC5pZCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0RXZlbnQoYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlY2VpdmVCdWZmZXIucHVzaChPYmplY3QuZnJlZXplKGFyZ3MpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbWl0RXZlbnQoYXJncykge1xuICAgICAgICBpZiAodGhpcy5fYW55TGlzdGVuZXJzICYmIHRoaXMuX2FueUxpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2FueUxpc3RlbmVycy5zbGljZSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdXBlci5lbWl0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICBpZiAodGhpcy5fcGlkICYmIGFyZ3MubGVuZ3RoICYmIHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RPZmZzZXQgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJvZHVjZXMgYW4gYWNrIGNhbGxiYWNrIHRvIGVtaXQgd2l0aCBhbiBldmVudC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgYWNrKGlkKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBsZXQgc2VudCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgZG91YmxlIGNhbGxiYWNrc1xuICAgICAgICAgICAgaWYgKHNlbnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgc2VudCA9IHRydWU7XG4gICAgICAgICAgICBzZWxmLnBhY2tldCh7XG4gICAgICAgICAgICAgICAgdHlwZTogUGFja2V0VHlwZS5BQ0ssXG4gICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgIGRhdGE6IGFyZ3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gYSBzZXJ2ZXIgYWNrbm93bGVnZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmFjayhwYWNrZXQpIHtcbiAgICAgICAgY29uc3QgYWNrID0gdGhpcy5hY2tzW3BhY2tldC5pZF07XG4gICAgICAgIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBhY2spIHtcbiAgICAgICAgICAgIGFjay5hcHBseSh0aGlzLCBwYWNrZXQuZGF0YSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5hY2tzW3BhY2tldC5pZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gc2VydmVyIGNvbm5lY3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uY29ubmVjdChpZCwgcGlkKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5yZWNvdmVyZWQgPSBwaWQgJiYgdGhpcy5fcGlkID09PSBwaWQ7XG4gICAgICAgIHRoaXMuX3BpZCA9IHBpZDsgLy8gZGVmaW5lZCBvbmx5IGlmIGNvbm5lY3Rpb24gc3RhdGUgcmVjb3ZlcnkgaXMgZW5hYmxlZFxuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdEJ1ZmZlcmVkKCk7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY29ubmVjdFwiKTtcbiAgICAgICAgdGhpcy5fZHJhaW5RdWV1ZSh0cnVlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW1pdCBidWZmZXJlZCBldmVudHMgKHJlY2VpdmVkIGFuZCBlbWl0dGVkKS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZW1pdEJ1ZmZlcmVkKCkge1xuICAgICAgICB0aGlzLnJlY2VpdmVCdWZmZXIuZm9yRWFjaCgoYXJncykgPT4gdGhpcy5lbWl0RXZlbnQoYXJncykpO1xuICAgICAgICB0aGlzLnJlY2VpdmVCdWZmZXIgPSBbXTtcbiAgICAgICAgdGhpcy5zZW5kQnVmZmVyLmZvckVhY2goKHBhY2tldCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5ub3RpZnlPdXRnb2luZ0xpc3RlbmVycyhwYWNrZXQpO1xuICAgICAgICAgICAgdGhpcy5wYWNrZXQocGFja2V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2VuZEJ1ZmZlciA9IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzZXJ2ZXIgZGlzY29ubmVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25kaXNjb25uZWN0KCkge1xuICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5vbmNsb3NlKFwiaW8gc2VydmVyIGRpc2Nvbm5lY3RcIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGZvcmNlZCBjbGllbnQvc2VydmVyIHNpZGUgZGlzY29ubmVjdGlvbnMsXG4gICAgICogdGhpcyBtZXRob2QgZW5zdXJlcyB0aGUgbWFuYWdlciBzdG9wcyB0cmFja2luZyB1cyBhbmRcbiAgICAgKiB0aGF0IHJlY29ubmVjdGlvbnMgZG9uJ3QgZ2V0IHRyaWdnZXJlZCBmb3IgdGhpcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3Vicykge1xuICAgICAgICAgICAgLy8gY2xlYW4gc3Vic2NyaXB0aW9ucyB0byBhdm9pZCByZWNvbm5lY3Rpb25zXG4gICAgICAgICAgICB0aGlzLnN1YnMuZm9yRWFjaCgoc3ViRGVzdHJveSkgPT4gc3ViRGVzdHJveSgpKTtcbiAgICAgICAgICAgIHRoaXMuc3VicyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlvW1wiX2Rlc3Ryb3lcIl0odGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERpc2Nvbm5lY3RzIHRoZSBzb2NrZXQgbWFudWFsbHkuIEluIHRoYXQgY2FzZSwgdGhlIHNvY2tldCB3aWxsIG5vdCB0cnkgdG8gcmVjb25uZWN0LlxuICAgICAqXG4gICAgICogSWYgdGhpcyBpcyB0aGUgbGFzdCBhY3RpdmUgU29ja2V0IGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgTWFuYWdlcn0sIHRoZSBsb3ctbGV2ZWwgY29ubmVjdGlvbiB3aWxsIGJlIGNsb3NlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKHJlYXNvbikgPT4ge1xuICAgICAqICAgLy8gY29uc29sZS5sb2cocmVhc29uKTsgcHJpbnRzIFwiaW8gY2xpZW50IGRpc2Nvbm5lY3RcIlxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogc29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5wYWNrZXQoeyB0eXBlOiBQYWNrZXRUeXBlLkRJU0NPTk5FQ1QgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlIHNvY2tldCBmcm9tIHBvb2xcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgLy8gZmlyZSBldmVudHNcbiAgICAgICAgICAgIHRoaXMub25jbG9zZShcImlvIGNsaWVudCBkaXNjb25uZWN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3Ige0BsaW5rIGRpc2Nvbm5lY3QoKX0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBjb21wcmVzcyBmbGFnLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQuY29tcHJlc3MoZmFsc2UpLmVtaXQoXCJoZWxsb1wiKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21wcmVzcyAtIGlmIGB0cnVlYCwgY29tcHJlc3NlcyB0aGUgc2VuZGluZyBkYXRhXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgY29tcHJlc3MoY29tcHJlc3MpIHtcbiAgICAgICAgdGhpcy5mbGFncy5jb21wcmVzcyA9IGNvbXByZXNzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBhIG1vZGlmaWVyIGZvciBhIHN1YnNlcXVlbnQgZXZlbnQgZW1pc3Npb24gdGhhdCB0aGUgZXZlbnQgbWVzc2FnZSB3aWxsIGJlIGRyb3BwZWQgd2hlbiB0aGlzIHNvY2tldCBpcyBub3RcbiAgICAgKiByZWFkeSB0byBzZW5kIG1lc3NhZ2VzLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQudm9sYXRpbGUuZW1pdChcImhlbGxvXCIpOyAvLyB0aGUgc2VydmVyIG1heSBvciBtYXkgbm90IHJlY2VpdmUgaXRcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHNlbGZcbiAgICAgKi9cbiAgICBnZXQgdm9sYXRpbGUoKSB7XG4gICAgICAgIHRoaXMuZmxhZ3Mudm9sYXRpbGUgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBhIG1vZGlmaWVyIGZvciBhIHN1YnNlcXVlbnQgZXZlbnQgZW1pc3Npb24gdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgd2l0aCBhbiBlcnJvciB3aGVuIHRoZVxuICAgICAqIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHdpdGhvdXQgYW4gYWNrbm93bGVkZ2VtZW50IGZyb20gdGhlIHNlcnZlcjpcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnRpbWVvdXQoNTAwMCkuZW1pdChcIm15LWV2ZW50XCIsIChlcnIpID0+IHtcbiAgICAgKiAgIGlmIChlcnIpIHtcbiAgICAgKiAgICAgLy8gdGhlIHNlcnZlciBkaWQgbm90IGFja25vd2xlZGdlIHRoZSBldmVudCBpbiB0aGUgZ2l2ZW4gZGVsYXlcbiAgICAgKiAgIH1cbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHNlbGZcbiAgICAgKi9cbiAgICB0aW1lb3V0KHRpbWVvdXQpIHtcbiAgICAgICAgdGhpcy5mbGFncy50aW1lb3V0ID0gdGltZW91dDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0Lm9uQW55KChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYGdvdCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgb25BbnkobGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fYW55TGlzdGVuZXJzID0gdGhpcy5fYW55TGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuIFRoZSBldmVudCBuYW1lIGlzIHBhc3NlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlXG4gICAgICogY2FsbGJhY2suIFRoZSBsaXN0ZW5lciBpcyBhZGRlZCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5wcmVwZW5kQW55KChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYGdvdCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgcHJlcGVuZEFueShsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBjYXRjaEFsbExpc3RlbmVyID0gKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgZ290IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfVxuICAgICAqXG4gICAgICogc29ja2V0Lm9uQW55KGNhdGNoQWxsTGlzdGVuZXIpO1xuICAgICAqXG4gICAgICogLy8gcmVtb3ZlIGEgc3BlY2lmaWMgbGlzdGVuZXJcbiAgICAgKiBzb2NrZXQub2ZmQW55KGNhdGNoQWxsTGlzdGVuZXIpO1xuICAgICAqXG4gICAgICogLy8gb3IgcmVtb3ZlIGFsbCBsaXN0ZW5lcnNcbiAgICAgKiBzb2NrZXQub2ZmQW55KCk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBvZmZBbnkobGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9hbnlMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaXN0ZW5lcikge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55TGlzdGVuZXJzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIgPT09IGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdGhhdCBhcmUgbGlzdGVuaW5nIGZvciBhbnkgZXZlbnQgdGhhdCBpcyBzcGVjaWZpZWQuIFRoaXMgYXJyYXkgY2FuIGJlIG1hbmlwdWxhdGVkLFxuICAgICAqIGUuZy4gdG8gcmVtb3ZlIGxpc3RlbmVycy5cbiAgICAgKi9cbiAgICBsaXN0ZW5lcnNBbnkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbnlMaXN0ZW5lcnMgfHwgW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay5cbiAgICAgKlxuICAgICAqIE5vdGU6IGFja25vd2xlZGdlbWVudHMgc2VudCB0byB0aGUgc2VydmVyIGFyZSBub3QgaW5jbHVkZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5vbkFueU91dGdvaW5nKChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYHNlbnQgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIG9uQW55T3V0Z29pbmcobGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgPSB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyB8fCBbXTtcbiAgICAgICAgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuIFRoZSBldmVudCBuYW1lIGlzIHBhc3NlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlXG4gICAgICogY2FsbGJhY2suIFRoZSBsaXN0ZW5lciBpcyBhZGRlZCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkuXG4gICAgICpcbiAgICAgKiBOb3RlOiBhY2tub3dsZWRnZW1lbnRzIHNlbnQgdG8gdGhlIHNlcnZlciBhcmUgbm90IGluY2x1ZGVkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQucHJlcGVuZEFueU91dGdvaW5nKChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYHNlbnQgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIHByZXBlbmRBbnlPdXRnb2luZyhsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBjYXRjaEFsbExpc3RlbmVyID0gKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgc2VudCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH1cbiAgICAgKlxuICAgICAqIHNvY2tldC5vbkFueU91dGdvaW5nKGNhdGNoQWxsTGlzdGVuZXIpO1xuICAgICAqXG4gICAgICogLy8gcmVtb3ZlIGEgc3BlY2lmaWMgbGlzdGVuZXJcbiAgICAgKiBzb2NrZXQub2ZmQW55T3V0Z29pbmcoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyBvciByZW1vdmUgYWxsIGxpc3RlbmVyc1xuICAgICAqIHNvY2tldC5vZmZBbnlPdXRnb2luZygpO1xuICAgICAqXG4gICAgICogQHBhcmFtIFtsaXN0ZW5lcl0gLSB0aGUgY2F0Y2gtYWxsIGxpc3RlbmVyIChvcHRpb25hbClcbiAgICAgKi9cbiAgICBvZmZBbnlPdXRnb2luZyhsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIgPT09IGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0aGF0IGFyZSBsaXN0ZW5pbmcgZm9yIGFueSBldmVudCB0aGF0IGlzIHNwZWNpZmllZC4gVGhpcyBhcnJheSBjYW4gYmUgbWFuaXB1bGF0ZWQsXG4gICAgICogZS5nLiB0byByZW1vdmUgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIGxpc3RlbmVyc0FueU91dGdvaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgfHwgW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE5vdGlmeSB0aGUgbGlzdGVuZXJzIGZvciBlYWNoIHBhY2tldCBzZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG5vdGlmeU91dGdvaW5nTGlzdGVuZXJzKHBhY2tldCkge1xuICAgICAgICBpZiAodGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgJiYgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy5zbGljZSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBwYWNrZXQuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvKipcbiAqIEluaXRpYWxpemUgYmFja29mZiB0aW1lciB3aXRoIGBvcHRzYC5cbiAqXG4gKiAtIGBtaW5gIGluaXRpYWwgdGltZW91dCBpbiBtaWxsaXNlY29uZHMgWzEwMF1cbiAqIC0gYG1heGAgbWF4IHRpbWVvdXQgWzEwMDAwXVxuICogLSBgaml0dGVyYCBbMF1cbiAqIC0gYGZhY3RvcmAgWzJdXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBCYWNrb2ZmKG9wdHMpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICB0aGlzLm1zID0gb3B0cy5taW4gfHwgMTAwO1xuICAgIHRoaXMubWF4ID0gb3B0cy5tYXggfHwgMTAwMDA7XG4gICAgdGhpcy5mYWN0b3IgPSBvcHRzLmZhY3RvciB8fCAyO1xuICAgIHRoaXMuaml0dGVyID0gb3B0cy5qaXR0ZXIgPiAwICYmIG9wdHMuaml0dGVyIDw9IDEgPyBvcHRzLmppdHRlciA6IDA7XG4gICAgdGhpcy5hdHRlbXB0cyA9IDA7XG59XG4vKipcbiAqIFJldHVybiB0aGUgYmFja29mZiBkdXJhdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5kdXJhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbXMgPSB0aGlzLm1zICogTWF0aC5wb3codGhpcy5mYWN0b3IsIHRoaXMuYXR0ZW1wdHMrKyk7XG4gICAgaWYgKHRoaXMuaml0dGVyKSB7XG4gICAgICAgIHZhciByYW5kID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgdmFyIGRldmlhdGlvbiA9IE1hdGguZmxvb3IocmFuZCAqIHRoaXMuaml0dGVyICogbXMpO1xuICAgICAgICBtcyA9IChNYXRoLmZsb29yKHJhbmQgKiAxMCkgJiAxKSA9PSAwID8gbXMgLSBkZXZpYXRpb24gOiBtcyArIGRldmlhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGgubWluKG1zLCB0aGlzLm1heCkgfCAwO1xufTtcbi8qKlxuICogUmVzZXQgdGhlIG51bWJlciBvZiBhdHRlbXB0cy5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmF0dGVtcHRzID0gMDtcbn07XG4vKipcbiAqIFNldCB0aGUgbWluaW11bSBkdXJhdGlvblxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnNldE1pbiA9IGZ1bmN0aW9uIChtaW4pIHtcbiAgICB0aGlzLm1zID0gbWluO1xufTtcbi8qKlxuICogU2V0IHRoZSBtYXhpbXVtIGR1cmF0aW9uXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuQmFja29mZi5wcm90b3R5cGUuc2V0TWF4ID0gZnVuY3Rpb24gKG1heCkge1xuICAgIHRoaXMubWF4ID0gbWF4O1xufTtcbi8qKlxuICogU2V0IHRoZSBqaXR0ZXJcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRKaXR0ZXIgPSBmdW5jdGlvbiAoaml0dGVyKSB7XG4gICAgdGhpcy5qaXR0ZXIgPSBqaXR0ZXI7XG59O1xuIiwiaW1wb3J0IHsgU29ja2V0IGFzIEVuZ2luZSwgaW5zdGFsbFRpbWVyRnVuY3Rpb25zLCBuZXh0VGljaywgfSBmcm9tIFwiZW5naW5lLmlvLWNsaWVudFwiO1xuaW1wb3J0IHsgU29ja2V0IH0gZnJvbSBcIi4vc29ja2V0LmpzXCI7XG5pbXBvcnQgKiBhcyBwYXJzZXIgZnJvbSBcInNvY2tldC5pby1wYXJzZXJcIjtcbmltcG9ydCB7IG9uIH0gZnJvbSBcIi4vb24uanNcIjtcbmltcG9ydCB7IEJhY2tvZmYgfSBmcm9tIFwiLi9jb250cmliL2JhY2tvMi5qc1wiO1xuaW1wb3J0IHsgRW1pdHRlciwgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuZXhwb3J0IGNsYXNzIE1hbmFnZXIgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3Rvcih1cmksIG9wdHMpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm5zcHMgPSB7fTtcbiAgICAgICAgdGhpcy5zdWJzID0gW107XG4gICAgICAgIGlmICh1cmkgJiYgXCJvYmplY3RcIiA9PT0gdHlwZW9mIHVyaSkge1xuICAgICAgICAgICAgb3B0cyA9IHVyaTtcbiAgICAgICAgICAgIHVyaSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICAgICAgb3B0cy5wYXRoID0gb3B0cy5wYXRoIHx8IFwiL3NvY2tldC5pb1wiO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICBpbnN0YWxsVGltZXJGdW5jdGlvbnModGhpcywgb3B0cyk7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uKG9wdHMucmVjb25uZWN0aW9uICE9PSBmYWxzZSk7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uQXR0ZW1wdHMob3B0cy5yZWNvbm5lY3Rpb25BdHRlbXB0cyB8fCBJbmZpbml0eSk7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uRGVsYXkob3B0cy5yZWNvbm5lY3Rpb25EZWxheSB8fCAxMDAwKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25EZWxheU1heChvcHRzLnJlY29ubmVjdGlvbkRlbGF5TWF4IHx8IDUwMDApO1xuICAgICAgICB0aGlzLnJhbmRvbWl6YXRpb25GYWN0b3IoKF9hID0gb3B0cy5yYW5kb21pemF0aW9uRmFjdG9yKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiAwLjUpO1xuICAgICAgICB0aGlzLmJhY2tvZmYgPSBuZXcgQmFja29mZih7XG4gICAgICAgICAgICBtaW46IHRoaXMucmVjb25uZWN0aW9uRGVsYXkoKSxcbiAgICAgICAgICAgIG1heDogdGhpcy5yZWNvbm5lY3Rpb25EZWxheU1heCgpLFxuICAgICAgICAgICAgaml0dGVyOiB0aGlzLnJhbmRvbWl6YXRpb25GYWN0b3IoKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudGltZW91dChudWxsID09IG9wdHMudGltZW91dCA/IDIwMDAwIDogb3B0cy50aW1lb3V0KTtcbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgIHRoaXMudXJpID0gdXJpO1xuICAgICAgICBjb25zdCBfcGFyc2VyID0gb3B0cy5wYXJzZXIgfHwgcGFyc2VyO1xuICAgICAgICB0aGlzLmVuY29kZXIgPSBuZXcgX3BhcnNlci5FbmNvZGVyKCk7XG4gICAgICAgIHRoaXMuZGVjb2RlciA9IG5ldyBfcGFyc2VyLkRlY29kZXIoKTtcbiAgICAgICAgdGhpcy5fYXV0b0Nvbm5lY3QgPSBvcHRzLmF1dG9Db25uZWN0ICE9PSBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuX2F1dG9Db25uZWN0KVxuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfVxuICAgIHJlY29ubmVjdGlvbih2KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb247XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9ICEhdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJlY29ubmVjdGlvbkF0dGVtcHRzKHYpIHtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb25BdHRlbXB0cztcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHMgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uRGVsYXkodikge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uRGVsYXk7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5ID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0TWluKHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmFuZG9taXphdGlvbkZhY3Rvcih2KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yYW5kb21pemF0aW9uRmFjdG9yO1xuICAgICAgICB0aGlzLl9yYW5kb21pemF0aW9uRmFjdG9yID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0Sml0dGVyKHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uRGVsYXlNYXgodikge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uRGVsYXlNYXg7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5TWF4ID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0TWF4KHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdGltZW91dCh2KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aW1lb3V0O1xuICAgICAgICB0aGlzLl90aW1lb3V0ID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyB0cnlpbmcgdG8gcmVjb25uZWN0IGlmIHJlY29ubmVjdGlvbiBpcyBlbmFibGVkIGFuZCB3ZSBoYXZlIG5vdFxuICAgICAqIHN0YXJ0ZWQgcmVjb25uZWN0aW5nIHlldFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBtYXliZVJlY29ubmVjdE9uT3BlbigpIHtcbiAgICAgICAgLy8gT25seSB0cnkgdG8gcmVjb25uZWN0IGlmIGl0J3MgdGhlIGZpcnN0IHRpbWUgd2UncmUgY29ubmVjdGluZ1xuICAgICAgICBpZiAoIXRoaXMuX3JlY29ubmVjdGluZyAmJlxuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uICYmXG4gICAgICAgICAgICB0aGlzLmJhY2tvZmYuYXR0ZW1wdHMgPT09IDApIHtcbiAgICAgICAgICAgIC8vIGtlZXBzIHJlY29ubmVjdGlvbiBmcm9tIGZpcmluZyB0d2ljZSBmb3IgdGhlIHNhbWUgcmVjb25uZWN0aW9uIGxvb3BcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB0cmFuc3BvcnQgYHNvY2tldGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIG9wdGlvbmFsLCBjYWxsYmFja1xuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBvcGVuKGZuKSB7XG4gICAgICAgIGlmICh+dGhpcy5fcmVhZHlTdGF0ZS5pbmRleE9mKFwib3BlblwiKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB0aGlzLmVuZ2luZSA9IG5ldyBFbmdpbmUodGhpcy51cmksIHRoaXMub3B0cyk7XG4gICAgICAgIGNvbnN0IHNvY2tldCA9IHRoaXMuZW5naW5lO1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICB0aGlzLnNraXBSZWNvbm5lY3QgPSBmYWxzZTtcbiAgICAgICAgLy8gZW1pdCBgb3BlbmBcbiAgICAgICAgY29uc3Qgb3BlblN1YkRlc3Ryb3kgPSBvbihzb2NrZXQsIFwib3BlblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLm9ub3BlbigpO1xuICAgICAgICAgICAgZm4gJiYgZm4oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGVtaXQgYGVycm9yYFxuICAgICAgICBjb25zdCBlcnJvclN1YiA9IG9uKHNvY2tldCwgXCJlcnJvclwiLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBzZWxmLmNsZWFudXAoKTtcbiAgICAgICAgICAgIHNlbGYuX3JlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgaWYgKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIE9ubHkgZG8gdGhpcyBpZiB0aGVyZSBpcyBubyBmbiB0byBoYW5kbGUgdGhlIGVycm9yXG4gICAgICAgICAgICAgICAgc2VsZi5tYXliZVJlY29ubmVjdE9uT3BlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZhbHNlICE9PSB0aGlzLl90aW1lb3V0KSB7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gdGhpcy5fdGltZW91dDtcbiAgICAgICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgb3BlblN1YkRlc3Ryb3koKTsgLy8gcHJldmVudHMgYSByYWNlIGNvbmRpdGlvbiB3aXRoIHRoZSAnb3BlbicgZXZlbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNldCB0aW1lclxuICAgICAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgb3BlblN1YkRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBzb2NrZXQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJ0aW1lb3V0XCIpKTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgICAgICB0aW1lci51bnJlZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdWJzLnB1c2goZnVuY3Rpb24gc3ViRGVzdHJveSgpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdWJzLnB1c2gob3BlblN1YkRlc3Ryb3kpO1xuICAgICAgICB0aGlzLnN1YnMucHVzaChlcnJvclN1Yik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3Igb3BlbigpXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgY29ubmVjdChmbikge1xuICAgICAgICByZXR1cm4gdGhpcy5vcGVuKGZuKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gdHJhbnNwb3J0IG9wZW4uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ub3BlbigpIHtcbiAgICAgICAgLy8gY2xlYXIgb2xkIHN1YnNcbiAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIC8vIG1hcmsgYXMgb3BlblxuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJvcGVuXCI7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICAgICAgLy8gYWRkIG5ldyBzdWJzXG4gICAgICAgIGNvbnN0IHNvY2tldCA9IHRoaXMuZW5naW5lO1xuICAgICAgICB0aGlzLnN1YnMucHVzaChvbihzb2NrZXQsIFwicGluZ1wiLCB0aGlzLm9ucGluZy5iaW5kKHRoaXMpKSwgb24oc29ja2V0LCBcImRhdGFcIiwgdGhpcy5vbmRhdGEuYmluZCh0aGlzKSksIG9uKHNvY2tldCwgXCJlcnJvclwiLCB0aGlzLm9uZXJyb3IuYmluZCh0aGlzKSksIG9uKHNvY2tldCwgXCJjbG9zZVwiLCB0aGlzLm9uY2xvc2UuYmluZCh0aGlzKSksIG9uKHRoaXMuZGVjb2RlciwgXCJkZWNvZGVkXCIsIHRoaXMub25kZWNvZGVkLmJpbmQodGhpcykpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gYSBwaW5nLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnBpbmcoKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGluZ1wiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggZGF0YS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25kYXRhKGRhdGEpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZGVjb2Rlci5hZGQoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMub25jbG9zZShcInBhcnNlIGVycm9yXCIsIGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHBhcnNlciBmdWxseSBkZWNvZGVzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmRlY29kZWQocGFja2V0KSB7XG4gICAgICAgIC8vIHRoZSBuZXh0VGljayBjYWxsIHByZXZlbnRzIGFuIGV4Y2VwdGlvbiBpbiBhIHVzZXItcHJvdmlkZWQgZXZlbnQgbGlzdGVuZXIgZnJvbSB0cmlnZ2VyaW5nIGEgZGlzY29ubmVjdGlvbiBkdWUgdG8gYSBcInBhcnNlIGVycm9yXCJcbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwYWNrZXRcIiwgcGFja2V0KTtcbiAgICAgICAgfSwgdGhpcy5zZXRUaW1lb3V0Rm4pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzb2NrZXQgZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZXJyb3IoZXJyKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBzb2NrZXQgZm9yIHRoZSBnaXZlbiBgbnNwYC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NvY2tldH1cbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgc29ja2V0KG5zcCwgb3B0cykge1xuICAgICAgICBsZXQgc29ja2V0ID0gdGhpcy5uc3BzW25zcF07XG4gICAgICAgIGlmICghc29ja2V0KSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBuZXcgU29ja2V0KHRoaXMsIG5zcCwgb3B0cyk7XG4gICAgICAgICAgICB0aGlzLm5zcHNbbnNwXSA9IHNvY2tldDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLl9hdXRvQ29ubmVjdCAmJiAhc29ja2V0LmFjdGl2ZSkge1xuICAgICAgICAgICAgc29ja2V0LmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc29ja2V0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNvY2tldCBjbG9zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzb2NrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kZXN0cm95KHNvY2tldCkge1xuICAgICAgICBjb25zdCBuc3BzID0gT2JqZWN0LmtleXModGhpcy5uc3BzKTtcbiAgICAgICAgZm9yIChjb25zdCBuc3Agb2YgbnNwcykge1xuICAgICAgICAgICAgY29uc3Qgc29ja2V0ID0gdGhpcy5uc3BzW25zcF07XG4gICAgICAgICAgICBpZiAoc29ja2V0LmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jbG9zZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXcml0ZXMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcGFja2V0KHBhY2tldCkge1xuICAgICAgICBjb25zdCBlbmNvZGVkUGFja2V0cyA9IHRoaXMuZW5jb2Rlci5lbmNvZGUocGFja2V0KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVkUGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5lbmdpbmUud3JpdGUoZW5jb2RlZFBhY2tldHNbaV0sIHBhY2tldC5vcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbGVhbiB1cCB0cmFuc3BvcnQgc3Vic2NyaXB0aW9ucyBhbmQgcGFja2V0IGJ1ZmZlci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY2xlYW51cCgpIHtcbiAgICAgICAgdGhpcy5zdWJzLmZvckVhY2goKHN1YkRlc3Ryb3kpID0+IHN1YkRlc3Ryb3koKSk7XG4gICAgICAgIHRoaXMuc3Vicy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmRlY29kZXIuZGVzdHJveSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZSB0aGUgY3VycmVudCBzb2NrZXQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jbG9zZSgpIHtcbiAgICAgICAgdGhpcy5za2lwUmVjb25uZWN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25jbG9zZShcImZvcmNlZCBjbG9zZVwiKTtcbiAgICAgICAgaWYgKHRoaXMuZW5naW5lKVxuICAgICAgICAgICAgdGhpcy5lbmdpbmUuY2xvc2UoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWxpYXMgZm9yIGNsb3NlKClcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBjbG9zZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25jbG9zZShyZWFzb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB0aGlzLmJhY2tvZmYucmVzZXQoKTtcbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY2xvc2VcIiwgcmVhc29uLCBkZXNjcmlwdGlvbik7XG4gICAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3Rpb24gJiYgIXRoaXMuc2tpcFJlY29ubmVjdCkge1xuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBBdHRlbXB0IGEgcmVjb25uZWN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICByZWNvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3RpbmcgfHwgdGhpcy5za2lwUmVjb25uZWN0KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5iYWNrb2ZmLmF0dGVtcHRzID49IHRoaXMuX3JlY29ubmVjdGlvbkF0dGVtcHRzKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2tvZmYucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicmVjb25uZWN0X2ZhaWxlZFwiKTtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGVsYXkgPSB0aGlzLmJhY2tvZmYuZHVyYXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGluZyA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCB0aW1lciA9IHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5za2lwUmVjb25uZWN0KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJyZWNvbm5lY3RfYXR0ZW1wdFwiLCBzZWxmLmJhY2tvZmYuYXR0ZW1wdHMpO1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGFnYWluIGZvciB0aGUgY2FzZSBzb2NrZXQgY2xvc2VkIGluIGFib3ZlIGV2ZW50c1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNraXBSZWNvbm5lY3QpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBzZWxmLm9wZW4oKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZWNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdF9lcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbnJlY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBkZWxheSk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLmF1dG9VbnJlZikge1xuICAgICAgICAgICAgICAgIHRpbWVyLnVucmVmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN1YnMucHVzaChmdW5jdGlvbiBzdWJEZXN0cm95KCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzdWNjZXNzZnVsIHJlY29ubmVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25yZWNvbm5lY3QoKSB7XG4gICAgICAgIGNvbnN0IGF0dGVtcHQgPSB0aGlzLmJhY2tvZmYuYXR0ZW1wdHM7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJhY2tvZmYucmVzZXQoKTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJyZWNvbm5lY3RcIiwgYXR0ZW1wdCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgdXJsIH0gZnJvbSBcIi4vdXJsLmpzXCI7XG5pbXBvcnQgeyBNYW5hZ2VyIH0gZnJvbSBcIi4vbWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgU29ja2V0IH0gZnJvbSBcIi4vc29ja2V0LmpzXCI7XG4vKipcbiAqIE1hbmFnZXJzIGNhY2hlLlxuICovXG5jb25zdCBjYWNoZSA9IHt9O1xuZnVuY3Rpb24gbG9va3VwKHVyaSwgb3B0cykge1xuICAgIGlmICh0eXBlb2YgdXJpID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG9wdHMgPSB1cmk7XG4gICAgICAgIHVyaSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgY29uc3QgcGFyc2VkID0gdXJsKHVyaSwgb3B0cy5wYXRoIHx8IFwiL3NvY2tldC5pb1wiKTtcbiAgICBjb25zdCBzb3VyY2UgPSBwYXJzZWQuc291cmNlO1xuICAgIGNvbnN0IGlkID0gcGFyc2VkLmlkO1xuICAgIGNvbnN0IHBhdGggPSBwYXJzZWQucGF0aDtcbiAgICBjb25zdCBzYW1lTmFtZXNwYWNlID0gY2FjaGVbaWRdICYmIHBhdGggaW4gY2FjaGVbaWRdW1wibnNwc1wiXTtcbiAgICBjb25zdCBuZXdDb25uZWN0aW9uID0gb3B0cy5mb3JjZU5ldyB8fFxuICAgICAgICBvcHRzW1wiZm9yY2UgbmV3IGNvbm5lY3Rpb25cIl0gfHxcbiAgICAgICAgZmFsc2UgPT09IG9wdHMubXVsdGlwbGV4IHx8XG4gICAgICAgIHNhbWVOYW1lc3BhY2U7XG4gICAgbGV0IGlvO1xuICAgIGlmIChuZXdDb25uZWN0aW9uKSB7XG4gICAgICAgIGlvID0gbmV3IE1hbmFnZXIoc291cmNlLCBvcHRzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmICghY2FjaGVbaWRdKSB7XG4gICAgICAgICAgICBjYWNoZVtpZF0gPSBuZXcgTWFuYWdlcihzb3VyY2UsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICAgIGlvID0gY2FjaGVbaWRdO1xuICAgIH1cbiAgICBpZiAocGFyc2VkLnF1ZXJ5ICYmICFvcHRzLnF1ZXJ5KSB7XG4gICAgICAgIG9wdHMucXVlcnkgPSBwYXJzZWQucXVlcnlLZXk7XG4gICAgfVxuICAgIHJldHVybiBpby5zb2NrZXQocGFyc2VkLnBhdGgsIG9wdHMpO1xufVxuLy8gc28gdGhhdCBcImxvb2t1cFwiIGNhbiBiZSB1c2VkIGJvdGggYXMgYSBmdW5jdGlvbiAoZS5nLiBgaW8oLi4uKWApIGFuZCBhcyBhXG4vLyBuYW1lc3BhY2UgKGUuZy4gYGlvLmNvbm5lY3QoLi4uKWApLCBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuT2JqZWN0LmFzc2lnbihsb29rdXAsIHtcbiAgICBNYW5hZ2VyLFxuICAgIFNvY2tldCxcbiAgICBpbzogbG9va3VwLFxuICAgIGNvbm5lY3Q6IGxvb2t1cCxcbn0pO1xuLyoqXG4gKiBQcm90b2NvbCB2ZXJzaW9uLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IHsgcHJvdG9jb2wgfSBmcm9tIFwic29ja2V0LmlvLXBhcnNlclwiO1xuLyoqXG4gKiBFeHBvc2UgY29uc3RydWN0b3JzIGZvciBzdGFuZGFsb25lIGJ1aWxkLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IHsgTWFuYWdlciwgU29ja2V0LCBsb29rdXAgYXMgaW8sIGxvb2t1cCBhcyBjb25uZWN0LCBsb29rdXAgYXMgZGVmYXVsdCwgfTtcbiIsImltcG9ydCB7IGlvIH0gZnJvbSBcInNvY2tldC5pby1jbGllbnRcIjtcclxuLy9pbXBvcnQgRmlsZVNhdmVyIGZyb20gXCJmaWxlLXNhdmVyXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVVJJIHtcclxuICBpZDsgLy8gaWQgaW4gVWludDhBcnJheSEhIVxyXG5cclxuICB0b1N0cigpIHtcclxuICAgIGlmICh0aGlzLmlkICE9IHVuZGVmaW5lZClcclxuICAgICAgcmV0dXJuIFwiW1wiICsgdGhpcy5pZC50b1N0cmluZygpICsgXCJdXCI7XHJcbiAgfVxyXG5cclxuICBmcm9tU3RyKCBzdHIgKSB7XHJcbiAgICB0aGlzLmlkID0gbmV3IFVpbnQ4QXJyYXkoSlNPTi5wYXJzZShzdHIpKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBmcm9tQXJyYXkoIGluQSApIHtcclxuICAgIGxldCBvdXRBID0gW107XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluQS5sZW5ndGg7IGkrKylcclxuICAgICAgb3V0QVtpXSA9IG5ldyBVUkkoaW5BW2ldKTtcclxuICAgIHJldHVybiBvdXRBO1xyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IoIGRhdGEgKSB7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhcIlVSSSBpbjpcIik7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgIGlmICh0eXBlb2YoZGF0YSkgPT0gJ3N0cmluZycpXHJcbiAgICAgIHRoaXMuZnJvbVN0cihkYXRhKTtcclxuICAgIGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcilcclxuICAgICAgdGhpcy5pZCA9IG5ldyBVaW50OEFycmF5KGRhdGEpO1xyXG4gICAgZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpXHJcbiAgICAgIHRoaXMuaWQgPSBkYXRhO1xyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIldST05HIFVSSSBUWVBFTDpcIik7XHJcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvbm5lY3Rpb24ge1xyXG4gIHNvY2tldDtcclxuXHJcbiAgZ2V0Tm9kZVJlcztcclxuICBnZXRBbGxOb2Rlc1JlcztcclxuICBhZGROb2RlUmVzO1xyXG4gIGRlbE5vZGVSZXM7XHJcbiAgY29ubmVjdE5vZGVzUmVzO1xyXG4gIGRpc2Nvbm5lY3ROb2Rlc1JlcztcclxuICBzZXREZWZOb2RlVVJJUmVzO1xyXG4gIGdldERlZk5vZGVVUklSZXM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJDb25uZWN0ZWQgd2l0aCBzZXJ2ZXJcIik7XHJcblxyXG4gICAgdGhpcy5zb2NrZXQgPSBpbygpO1xyXG5cclxuICAgIHRoaXMuc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiU09DS0VUIElEOiBcIiArIHRoaXMuc29ja2V0LmlkKTtcclxuXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHNlbmQoIHJlcSwgLi4uYXJncyApIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICB0aGlzLnNvY2tldC5lbWl0KHJlcSwgLi4uYXJncywgKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJURVNUIE9VVDpcIik7XHJcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcGluZyggdmFsdWUgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwicGluZ1wiLCB2YWx1ZSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXROb2RlKCB1cmkgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiZ2V0Tm9kZVJlcVwiLCB1cmkuaWQpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgYWRkTm9kZSggZGF0YSApIHtcclxuICAgIHJldHVybiBuZXcgVVJJKGF3YWl0IHRoaXMuc2VuZChcImFkZE5vZGVSZXFcIiwgZGF0YSkpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBkYXRlTm9kZSggdXJpLCBkYXRhICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcInVwZGF0ZU5vZGVSZXFcIiwgdXJpLmlkLCBkYXRhKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldEFsbE5vZGVzKCkge1xyXG4gICAgcmV0dXJuIFVSSS5mcm9tQXJyYXkoIGF3YWl0IHRoaXMuc2VuZChcImdldEFsbE5vZGVzUmVxXCIpKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldEFsbENvbm5lY3Rpb25zKCkge1xyXG4gICAgbGV0IGNBID0gYXdhaXQgdGhpcy5zZW5kKFwiZ2V0QWxsQ29ubmVjdGlvbnNSZXFcIik7XHJcblxyXG4gICAgbGV0IG91dEEgPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNBLmxlbmd0aDsgaSsrKVxyXG4gICAgICBvdXRBW2ldID0gW25ldyBVUkkoY0FbaV0uaWQxKSwgbmV3IFVSSShjQVtpXS5pZDIpXTtcclxuICAgIHJldHVybiBvdXRBO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0QWxsTm9kZXNEYXRhKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImdldEFsbE5vZGVzRGF0YVJlcVwiKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGRlbE5vZGUoIG5vZGUgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiZGVsTm9kZVJlcVwiLCBub2RlKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGNvbm5lY3ROb2RlcyggdXJpMSwgdXJpMiApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJjb25uZWN0Tm9kZXNSZXFcIiwgW3VyaTEuaWQsIHVyaTIuaWRdKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldE5vZGVDb25uZWN0aW9ucyggdXJpICkge1xyXG4gICAgbGV0IGNBID0gYXdhaXQgdGhpcy5zZW5kKFwiZ2V0Tm9kZUNvbm5lY3Rpb25zUmVxXCIsIHVyaS5pZCk7XHJcblxyXG4gICAgbGV0IG91dEEgPSBbXTtcclxuICAgIFxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjQS5sZW5ndGg7IGkrKylcclxuICAgICAgb3V0QVtpXSA9IFtuZXcgVVJJKGNBW2ldLmlkMSksIG5ldyBVUkkoY0FbaV0uaWQyKV07XHJcbiAgICByZXR1cm4gb3V0QTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldE5laWdoYm91cnMoIHVyaSApIHtcclxuICAgIHJldHVybiBVUkkuZnJvbUFycmF5KGF3YWl0IHRoaXMuc2VuZChcImdldE5laWdoYm91cnNSZXFcIiwgdXJpLmlkKSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBkaXNjb25uZWN0Tm9kZXMoIHVyaTEsIHVyaTIgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiZGlzY29ubmVjdE5vZGVzUmVxXCIsIFt1cmkxLmlkLCB1cmkyLmlkXSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBzZXREZWZOb2RlVVJJKCB1cmkgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwic2V0RGVmTm9kZVVSSVJlcVwiLCB1cmkuaWQpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0RGVmTm9kZVVSSSgpIHtcclxuICAgIHJldHVybiBuZXcgVVJJKGF3YWl0IHRoaXMuc2VuZChcImdldERlZk5vZGVVUklSZXFcIikpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgY2xlYXJEQigpIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJjbGVhckRCUmVxXCIpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0REIoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiZ2V0REJSZXFcIik7XHJcbiAgfVxyXG5cclxuICBhc3luYyBzYXZlREIoIG91dEZpbGVOYW1lICkge1xyXG4gICAgbGV0IGRiVGV4dCA9IEpTT04uc3RyaW5naWZ5KGF3YWl0IHRoaXMuZ2V0REIoKSk7XHJcbiAgXHJcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIHZhciBmaWxlID0gbmV3IEJsb2IoW2RiVGV4dF0sIHt0eXBlOiBcInRleHQvcGxhaW47Y2hhcnNldD11dGYtOFwifSk7XHJcbiAgICBhLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpO1xyXG4gICAgYS5kb3dubG9hZCA9IG91dEZpbGVOYW1lO1xyXG4gICAgYS5jbGljaygpO1xyXG4gICAgcmV0dXJuIGRiVGV4dDtcclxuICB9XHJcblxyXG4gIGFzeW5jIGxvYWREQiggZGIgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwibG9hZERCUmVxXCIsIGRiKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGFkZERCKCBkYiApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJhZGREYXRhUmVxXCIsIGRiKTtcclxuICB9XHJcbiAgYXN5bmMgZ2V0TmVhcmVzdCggcG9zLCBmbG9vciApIHtcclxuICAgIHJldHVybiBuZXcgVVJJKGF3YWl0IHRoaXMuc2VuZChcImdldE5lYXJlc3RSZXFcIiwgcG9zLCBmbG9vcikpO1xyXG4gIH1cclxuICBcclxuICBcclxufSAvKiBDb25uZWN0aW9uICovXHJcbiIsImltcG9ydCAqIGFzIG10aCBmcm9tIFwiLi9zeXN0ZW0vbXRoLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQXJjYmFsbCB7XHJcbiAgICAvLyBjYW1lcmEgdW5pdFxyXG4gICAgc3RhdGljIGNyZWF0ZSgpIHtcclxuICAgIGNvbnN0IHVwID0gbmV3IG10aC5WZWMzKDAsIDEsIDApO1xyXG4gICAgbGV0IGxvYyA9IG5ldyBtdGguVmVjMygzMCwgMzAsIDMwKSwgYXQgPSBuZXcgbXRoLlZlYzMoMCwgMCwgMCk7XHJcbiAgICBsZXQgcmFkaXVzID0gYXQuc3ViKGxvYykubGVuZ3RoKCk7XHJcblxyXG4gICAgbGV0IGNhbWVyYSA9IHtcclxuICAgICAgcmVzcG9uc2Uoc3lzdGVtKSB7XHJcbiAgICAgICAgc3lzdGVtLmNhbWVyYS5zZXQobG9jLCBhdCwgdXApO1xyXG4gICAgICB9IC8qIHJlc3BvbnNlICovXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBjb25zdCBvbk1vdXNlTW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIGlmIChldmVudC5hbHRLZXkgfHwgZXZlbnQuc2hpZnRLZXkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICgoZXZlbnQuYnV0dG9ucyAmIDEpID09IDEpIHsgLy8gcm90YXRlXHJcbiAgICAgICAgbGV0IGRpcmVjdGlvbiA9IGxvYy5zdWIoYXQpO1xyXG5cclxuICAgICAgICAvLyB0dXJuIGRpcmVjdGlvbiB0byBwb2xhciBjb29yZGluYXRlIHN5c3RlbVxyXG4gICAgICAgIHJhZGl1cyA9IGRpcmVjdGlvbi5sZW5ndGgoKTtcclxuICAgICAgICBsZXRcclxuICAgICAgICAgIGF6aW11dGggID0gTWF0aC5zaWduKGRpcmVjdGlvbi56KSAqIE1hdGguYWNvcyhkaXJlY3Rpb24ueCAvIE1hdGguc3FydChkaXJlY3Rpb24ueCAqIGRpcmVjdGlvbi54ICsgZGlyZWN0aW9uLnogKiBkaXJlY3Rpb24ueikpLFxyXG4gICAgICAgICAgZWxldmF0b3IgPSBNYXRoLmFjb3MoZGlyZWN0aW9uLnkgLyBkaXJlY3Rpb24ubGVuZ3RoKCkpO1xyXG5cclxuICAgICAgICAgIC8vIHJvdGF0ZSBkaXJlY3Rpb25cclxuICAgICAgICAgIGF6aW11dGggICs9IGV2ZW50Lm1vdmVtZW50WCAvIDIwMC4wO1xyXG4gICAgICAgIGVsZXZhdG9yIC09IGV2ZW50Lm1vdmVtZW50WSAvIDIwMC4wO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsZXZhdG9yID0gTWF0aC5taW4oTWF0aC5tYXgoZWxldmF0b3IsIDAuMDEpLCBNYXRoLlBJKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyByZXN0b3JlIGRpcmVjdGlvblxyXG4gICAgICAgIGRpcmVjdGlvbi54ID0gcmFkaXVzICogTWF0aC5zaW4oZWxldmF0b3IpICogTWF0aC5jb3MoYXppbXV0aCk7XHJcbiAgICAgICAgZGlyZWN0aW9uLnkgPSByYWRpdXMgKiBNYXRoLmNvcyhlbGV2YXRvcik7XHJcbiAgICAgICAgZGlyZWN0aW9uLnogPSByYWRpdXMgKiBNYXRoLnNpbihlbGV2YXRvcikgKiBNYXRoLnNpbihhemltdXRoKTtcclxuXHJcbiAgICAgICAgbG9jID0gYXQuYWRkKGRpcmVjdGlvbik7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGlmICgoZXZlbnQuYnV0dG9ucyAmIDIpID09IDIpIHsgLy8gbW92ZVxyXG4gICAgICAgIGxldCBkaXIgPSBhdC5zdWIobG9jKS5ub3JtYWxpemUoKTtcclxuICAgICAgICBsZXQgcmdoID0gZGlyLmNyb3NzKHVwKS5ub3JtYWxpemUoKTtcclxuICAgICAgICBsZXQgdHVwID0gcmdoLmNyb3NzKGRpcik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGRlbHRhID0gcmdoLm11bCgtZXZlbnQubW92ZW1lbnRYICogcmFkaXVzIC8gMzAwLjApLmFkZCh0dXAubXVsKGV2ZW50Lm1vdmVtZW50WSAqIHJhZGl1cyAvIDMwMC4wKSk7XHJcbiAgICAgICAgbG9jID0gbG9jLmFkZChkZWx0YSk7XHJcbiAgICAgICAgYXQgPSBhdC5hZGQoZGVsdGEpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IG9uV2hlZWwgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBsZXQgZGVsdGEgPSBldmVudC5kZWx0YVkgLyA1MDAwLjA7XHJcblxyXG4gICAgICBsb2MgPSBsb2Muc3ViKGF0LnN1Yihsb2MpLm11bChkZWx0YSkpO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xyXG4gICAgXHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvbk1vdXNlTW92ZSk7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIG9uV2hlZWwpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gY2FtZXJhO1xyXG4gIH1cclxufSAvKiBBcmNiYWxsICovXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFJvdGF0b3Ige1xyXG4gIC8vIGNhbWVyYSB1bml0XHJcbiAgc3RhdGljIGNyZWF0ZSgpIHtcclxuICAgIGNvbnN0IHVwID0gbmV3IG10aC5WZWMzKDAsIDEsIDApO1xyXG4gICAgbGV0IHJhZGl1cyA9IDE7XHJcblxyXG4gICAgbGV0IGNhbWVyYSA9IHtcclxuICAgICAgbG9jOiBuZXcgbXRoLlZlYzMoMzAsIDMwLCAzMCksXHJcbiAgICAgIGF0OiBuZXcgbXRoLlZlYzMoMCwgMCwgMCksXHJcbiAgICAgIHByb2pTaXplOiAxLFxyXG4gICAgICByZXNwb25zZShzeXN0ZW0pIHtcclxuICAgICAgICBzeXN0ZW0uY2FtZXJhLnNldChjYW1lcmEubG9jLCBjYW1lcmEuYXQsIHVwKTtcclxuICAgICAgICBzeXN0ZW0uY2FtZXJhLnByb2pTZXQoMSwgMTAwLCBuZXcgbXRoLlNpemUoY2FtZXJhLnByb2pTaXplLCBjYW1lcmEucHJvalNpemUpKTtcclxuICAgICAgfSAvKiByZXNwb25zZSAqL1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBtb3ZlQ3Vyc29yKGRlbHRhKSB7XHJcbiAgICAgIGxldCBkaXJlY3Rpb24gPSBjYW1lcmEubG9jLnN1YihjYW1lcmEuYXQpO1xyXG5cclxuICAgICAgLy8gdHVybiBkaXJlY3Rpb24gdG8gcG9sYXIgY29vcmRpbmF0ZSBzeXN0ZW1cclxuICAgICAgcmFkaXVzID0gZGlyZWN0aW9uLmxlbmd0aCgpO1xyXG4gICAgICBsZXRcclxuICAgICAgICBhemltdXRoICA9IE1hdGguc2lnbihkaXJlY3Rpb24ueikgKiBNYXRoLmFjb3MoZGlyZWN0aW9uLnggLyBNYXRoLnNxcnQoZGlyZWN0aW9uLnggKiBkaXJlY3Rpb24ueCArIGRpcmVjdGlvbi56ICogZGlyZWN0aW9uLnopKSxcclxuICAgICAgICBlbGV2YXRvciA9IE1hdGguYWNvcyhkaXJlY3Rpb24ueSAvIGRpcmVjdGlvbi5sZW5ndGgoKSk7XHJcblxyXG4gICAgICAvLyByb3RhdGUgZGlyZWN0aW9uXHJcbiAgICAgIGF6aW11dGggIC09IGRlbHRhLng7XHJcbiAgICAgIGVsZXZhdG9yICs9IGRlbHRhLnk7XHJcbiAgICAgIFxyXG4gICAgICBlbGV2YXRvciA9IE1hdGgubWluKE1hdGgubWF4KGVsZXZhdG9yLCAwLjAxKSwgTWF0aC5QSSk7XHJcbiAgICAgIFxyXG4gICAgICAvLyByZXN0b3JlIGRpcmVjdGlvblxyXG4gICAgICBkaXJlY3Rpb24ueCA9IHJhZGl1cyAqIE1hdGguc2luKGVsZXZhdG9yKSAqIE1hdGguY29zKGF6aW11dGgpO1xyXG4gICAgICBkaXJlY3Rpb24ueSA9IHJhZGl1cyAqIE1hdGguY29zKGVsZXZhdG9yKTtcclxuICAgICAgZGlyZWN0aW9uLnogPSByYWRpdXMgKiBNYXRoLnNpbihlbGV2YXRvcikgKiBNYXRoLnNpbihhemltdXRoKTtcclxuXHJcbiAgICAgIGNhbWVyYS5sb2MgPSBjYW1lcmEuYXQuYWRkKGRpcmVjdGlvbik7XHJcbiAgICB9IC8qIG1vdmVDdXJzb3IgKi9cclxuXHJcbiAgICBjb25zdCBjbGFtcCA9IChudW1iZXIsIG1pbkJvcmRlciwgbWF4Qm9yZGVyKSA9PiB7XHJcbiAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChudW1iZXIsIG1pbkJvcmRlciksIG1heEJvcmRlcik7XHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuXHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgaWYgKChldmVudC5idXR0b25zICYgMSkgPT0gMSkgeyAvLyByb3RhdGVcclxuICAgICAgICBtb3ZlQ3Vyc29yKChuZXcgbXRoLlZlYzIoZXZlbnQubW92ZW1lbnRYLCBldmVudC5tb3ZlbWVudFkpKS5tdWwoMS4wIC8gMjAwLjApKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgbGV0IGRlbHRhID0gZXZlbnQuZGVsdGFZIC8gNzAwLjA7XHJcblxyXG4gICAgICBjYW1lcmEucHJvalNpemUgKz0gY2FtZXJhLnByb2pTaXplICogZGVsdGE7XHJcbiAgICAgIGNhbWVyYS5wcm9qU2l6ZSA9IGNsYW1wKGNhbWVyYS5wcm9qU2l6ZSwgMC4xLCAxKTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBsZXQgdG91Y2hQb3NpdGlvbiA9IG51bGw7XHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgIHRvdWNoUG9zaXRpb24gPSBuZXcgbXRoLlZlYzIoXHJcbiAgICAgICAgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WCxcclxuICAgICAgICBldmVudC5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgaWYgKHRvdWNoUG9zaXRpb24gPT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBuZXdUb3VjaFBvc2l0aW9uID0gbmV3IG10aC5WZWMyKFxyXG4gICAgICAgIGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFgsXHJcbiAgICAgICAgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WVxyXG4gICAgICApO1xyXG5cclxuICAgICAgbW92ZUN1cnNvcihuZXdUb3VjaFBvc2l0aW9uLnN1Yih0b3VjaFBvc2l0aW9uKS5tdWwoMS4wIC8gODAwLjApKTtcclxuICAgICAgdG91Y2hQb3NpdGlvbiA9IG5ld1RvdWNoUG9zaXRpb247XHJcbiAgICB9KTtcclxuXHJcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldmVudCkgPT4ge1xyXG4gICAgICB0b3VjaFBvc2l0aW9uID0gbnVsbDtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBjYW1lcmE7XHJcbiAgfSAvKiBjcmVhdGUgKi9cclxufSAvKiBBcmNiYWxsICovXHJcblxyXG4vKiBjYW1lcmFfY29udHJvbGxlci5qcyAqLyIsImltcG9ydCAqIGFzIHJuZCBmcm9tIFwiLi9zeXN0ZW0vc3lzdGVtLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgU2t5c3BoZXJlIHtcclxuICBzdGF0aWMgYXN5bmMgY3JlYXRlKHN5c3RlbSwgZmlsZVBhdGggPSBudWxsKSB7XHJcbiAgICBsZXQgbXRsLCB0ZXgsIHByaW0sIHNwaGVyZTtcclxuICAgIGxldCBzbGlkZVN0YXJ0VGltZSA9IDAuMCwgc2xpZGVEdXJhdGlvbiA9IDAsIHNsaWRlUm90YXRpb247XHJcbiAgICBsZXQgZG9TbGlkZSA9IGZhbHNlO1xyXG5cclxuICAgIHJldHVybiBzcGhlcmUgPSB7XHJcbiAgICAgIHR5cGU6IFwic2t5c3BoZXJlXCIsXHJcbiAgICAgIG5hbWU6IFwiXCIsXHJcbiAgICAgIHRleHR1cmU6IG51bGwsXHJcbiAgICAgIHJvdGF0aW9uOiAwLFxyXG5cclxuICAgICAgYXN5bmMgaW5pdChzeXN0ZW0pIHtcclxuICAgICAgICBtdGwgPSBhd2FpdCBzeXN0ZW0uY3JlYXRlTWF0ZXJpYWwoXCIuL3NoYWRlcnMvc2t5c3BoZXJlXCIpO1xyXG5cclxuICAgICAgICB0ZXggPSBhd2FpdCBzeXN0ZW0uY3JlYXRlVGV4dHVyZShmaWxlUGF0aCk7XHJcblxyXG4gICAgICAgIG10bC50ZXh0dXJlcy5wdXNoKHRleCk7XHJcbiAgICAgICAgbXRsLnVibyA9IHN5c3RlbS5jcmVhdGVVbmlmb3JtQnVmZmVyKCk7XHJcbiAgICAgICAgbXRsLnVib05hbWVPblNoYWRlciA9IFwicHJvamVjdGlvbkluZm9cIjtcclxuXHJcbiAgICAgICAgcHJpbSA9IGF3YWl0IHN5c3RlbS5jcmVhdGVFbXB0eVByaW1pdGl2ZSg0LCBybmQuVG9wb2xvZ3kuVFJJQU5HTEVfU1RSSVAsIG10bCk7XHJcblxyXG4gICAgICAgIHNwaGVyZS50ZXh0dXJlID0gdGV4O1xyXG4gICAgICAgIHNwaGVyZS5uYW1lID0gYHNreXNwaGVyZSMke2ZpbGVQYXRofWA7XHJcbiAgICAgIH0sIC8qIGluaXQgKi9cclxuXHJcbiAgICAgIC8vIHNsaWRpbmcgdG8gYW5vdGhlciBza3lzcGhlcmUgZnVuY3Rpb25cclxuICAgICAgYXN5bmMgc2xpZGUobmV3VGV4dHVyZVBhdGgsIG5ld1RleHR1cmVSb3RhdGlvbiwgZHVyYXRpb24gPSAwLjMzKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgIC8vIGFkZCBuZXcgdGV4dHVyZVxyXG4gICAgICAgICAgbGV0IG5ld1RleHR1cmUgPSBhd2FpdCBzeXN0ZW0uY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgICAgYXdhaXQgbmV3VGV4dHVyZS5sb2FkKG5ld1RleHR1cmVQYXRoKTtcclxuICAgICAgICAgIG10bC50ZXh0dXJlcy5wdXNoKG5ld1RleHR1cmUpO1xyXG4gIFxyXG4gICAgICAgICAgc2xpZGVTdGFydFRpbWUgPSBudWxsO1xyXG4gICAgICAgICAgc2xpZGVEdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gICAgICAgICAgc2xpZGVSb3RhdGlvbiA9IG5ld1RleHR1cmVSb3RhdGlvbjtcclxuICAgICAgICAgIGRvU2xpZGUgPSB0cnVlO1xyXG5cclxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInNsaWRlIGVuZFwiKTtcclxuICAgICAgICAgICAgbXRsLnRleHR1cmVzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIGRvU2xpZGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgc3BoZXJlLnJvdGF0aW9uID0gc2xpZGVSb3RhdGlvbjtcclxuXHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIH0sIGR1cmF0aW9uICogMTAwMC4wKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSwgLyogc2xpZGUgKi9cclxuXHJcbiAgICAgIHJlc3BvbnNlKHN5c3RlbSkge1xyXG4gICAgICAgIC8vICdwZXJzcGVjdGl2ZS1jb3JyZWN0JyBkaXJlY3Rpb24gdmVjdG9yc1xyXG4gICAgICAgIGxldCBkaXIgPSBzeXN0ZW0uY2FtZXJhLmRpci5tdWwoc3lzdGVtLmNhbWVyYS5uZWFyKTtcclxuICAgICAgICBsZXQgcmdoID0gc3lzdGVtLmNhbWVyYS5yaWdodC5tdWwoc3lzdGVtLmNhbWVyYS5jb3JyZWN0ZWRQcm9qU2l6ZS53KTtcclxuICAgICAgICBsZXQgdHVwID0gc3lzdGVtLmNhbWVyYS51cC5tdWwoc3lzdGVtLmNhbWVyYS5jb3JyZWN0ZWRQcm9qU2l6ZS5oKTtcclxuXHJcbiAgICAgICAgaWYgKGRvU2xpZGUpIHtcclxuICAgICAgICAgIGlmIChzbGlkZVN0YXJ0VGltZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzbGlkZVN0YXJ0VGltZSA9IHN5c3RlbS50aW1lci50aW1lO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBzbGlkZUNvZWZmaWNlbnQgPSAoc3lzdGVtLnRpbWVyLnRpbWUgLSBzbGlkZVN0YXJ0VGltZSkgLyBzbGlkZUR1cmF0aW9uO1xyXG5cclxuICAgICAgICAgIG10bC51Ym8ud3JpdGVEYXRhKG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gICAgICAgICAgICBkaXIueCwgZGlyLnksIGRpci56LCAxLjAsXHJcbiAgICAgICAgICAgIHJnaC54LCByZ2gueSwgcmdoLnosIHNsaWRlQ29lZmZpY2VudCxcclxuICAgICAgICAgICAgdHVwLngsIHR1cC55LCB0dXAueixcclxuICAgICAgICAgICAgc3BoZXJlLnJvdGF0aW9uLFxyXG4gICAgICAgICAgICBzbGlkZVJvdGF0aW9uXHJcbiAgICAgICAgICBdKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG10bC51Ym8ud3JpdGVEYXRhKG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gICAgICAgICAgICBkaXIueCwgZGlyLnksIGRpci56LCAwLFxyXG4gICAgICAgICAgICByZ2gueCwgcmdoLnksIHJnaC56LCAwLFxyXG4gICAgICAgICAgICB0dXAueCwgdHVwLnksIHR1cC56LFxyXG4gICAgICAgICAgICBzcGhlcmUucm90YXRpb24sXHJcbiAgICAgICAgICAgIDBcclxuICAgICAgICAgIF0pKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBzeXN0ZW0uZHJhd01hcmtlclByaW1pdGl2ZShwcmltKTtcclxuICAgICAgfSAvKiByZXNwb25zZSAqL1xyXG4gICAgfTsgLyogX3RoaXMgKi9cclxuICB9IC8qIGNyZWF0ZSAqL1xyXG59IC8qIFNreXNwaGVyZSAqL1xyXG5cclxuLyogc2t5c3BoZXJlLmpzICovIiwiaW1wb3J0ICogYXMgcm5kIGZyb20gXCIuL3N5c3RlbS9zeXN0ZW0uanNcIjtcclxuaW1wb3J0ICogYXMgbXRoIGZyb20gXCIuL3N5c3RlbS9tdGguanNcIjtcclxuXHJcbmltcG9ydCB7IENvbm5lY3Rpb24gfSBmcm9tIFwiLi9ub2Rlcy5qc1wiO1xyXG5cclxuaW1wb3J0IHsgUm90YXRvciB9IGZyb20gXCIuL2NhbWVyYV9jb250cm9sbGVyLmpzXCI7XHJcbmltcG9ydCB7IFNreXNwaGVyZSB9IGZyb20gXCIuL3NreXNwaGVyZS5qc1wiO1xyXG5cclxubGV0IHN5c3RlbSA9IG5ldyBybmQuU3lzdGVtKCk7XHJcbmxldCBzZXJ2ZXIgPSBuZXcgQ29ubmVjdGlvbigpO1xyXG5cclxuc3lzdGVtLnJlbmRlclBhcmFtcy5kZXB0aFRlc3QgPSBmYWxzZTtcclxuc3lzdGVtLnJlbmRlclBhcmFtcy5jdWxsRmFjZSA9IHRydWU7XHJcblxyXG4vLyBjYW1lcmEgY29udHJvbGxlclxyXG5sZXQgc2t5c3BoZXJlID0gYXdhaXQgc3lzdGVtLmFkZFVuaXQoU2t5c3BoZXJlLmNyZWF0ZSwgXCIuL2Jpbi9pbWdzL2xha2h0YS5wbmdcIik7XHJcbmxldCBjYW1lcmFDb250cm9sbGVyID0gc3lzdGVtLmFkZFVuaXQoUm90YXRvci5jcmVhdGUpO1xyXG5cclxubGV0IGFycm93UHJpbSA9IGF3YWl0IHN5c3RlbS5jcmVhdGVFbXB0eVByaW1pdGl2ZSg0LCBybmQuVG9wb2xvZ3kuVFJJQU5HTEVfRkFOLCBhd2FpdCBzeXN0ZW0uY3JlYXRlTWF0ZXJpYWwoXCIuL3NoYWRlcnMvYXJyb3dcIikpO1xyXG5sZXQgYXJyb3dVbmlxdWVJRCA9IDA7XHJcbmxldCBhcnJvd3MgPSBbXTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUFycm93KGRpcmVjdGlvbikge1xyXG4gIGxldCB0cmFuc2Zvcm0gPSBtdGguTWF0NC5yb3RhdGVZKC1NYXRoLmF0YW4yKGRpcmVjdGlvbi56LCBkaXJlY3Rpb24ueCkpO1xyXG5cclxuICBsZXQgYXJyb3cgPSBhd2FpdCBzeXN0ZW0uYWRkVW5pdCgoKSA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiBcImFycm93XCIsXHJcbiAgICAgIG5hbWU6IGBhcnJvdyMke2Fycm93VW5pcXVlSUQrK31gLFxyXG4gICAgICBkaXJlY3Rpb246IChuZXcgbXRoLlZlYzIoZGlyZWN0aW9uLngsIGRpcmVjdGlvbi56KSkubm9ybWFsaXplKCksXHJcbiAgICAgIHJlc3BvbnNlKHN5c3RlbSkge1xyXG4gICAgICAgIHN5c3RlbS5kcmF3TWFya2VyUHJpbWl0aXZlKGFycm93UHJpbSwgdHJhbnNmb3JtKTtcclxuICAgICAgfSAvKiByZXNwb25zZSAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBhcnJvd3MucHVzaChhcnJvdyk7XHJcblxyXG4gIHJldHVybiBhcnJvdztcclxufSAvKiBjcmVhdGVBcnJvdyAqL1xyXG5cclxuZnVuY3Rpb24gY2xlYXJBcnJvd3MoKSB7XHJcbiAgZm9yIChsZXQgYXJyb3cgb2YgYXJyb3dzKSB7XHJcbiAgICBhcnJvdy5kb1N1aWNpZGUgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgYXJyb3dzID0gW107XHJcbn0gLyogY2xlYXJBcnJvd3MgKi9cclxuXHJcbmxldCBjdXJyZW50Tm9kZU5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImN1cnJlbnROb2RlTmFtZVwiKTtcclxuLy9sZXQgc2t5c3BoZXJlUm90YXRpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNreXNwaGVyZVJvdGF0aW9uXCIpO1xyXG5cclxuY29uc3Qgc2t5c3BoZXJlRm9sZGVyUGF0aCA9IFwiLi9iaW4vaW1ncy9cIjtcclxuXHJcbmxldCBjdXJyZW50Tm9kZSA9IG51bGw7XHJcbmxldCBjdXJyZW50Tm9kZVVSSSA9IG51bGw7XHJcbmxldCBuZWlnaGJvdXJzID0gW107XHJcbmFzeW5jIGZ1bmN0aW9uIHNldEN1cnJlbnROb2RlKG5vZGVVUkkpIHtcclxuXHJcbiAgY3VycmVudE5vZGUgPSBhd2FpdCBzZXJ2ZXIuZ2V0Tm9kZShub2RlVVJJKTtcclxuICBjdXJyZW50Tm9kZVVSSSA9IG5vZGVVUkk7XHJcblxyXG4gIGN1cnJlbnROb2RlLnBvc2l0aW9uID0gbXRoLlZlYzMuZnJvbU9iamVjdChjdXJyZW50Tm9kZS5wb3NpdGlvbik7XHJcbiAgY3VycmVudE5vZGVOYW1lLmlubmVyVGV4dCA9IGN1cnJlbnROb2RlLm5hbWU7XHJcblxyXG4gIGNsZWFyQXJyb3dzKCk7XHJcblxyXG4gIC8vIHdhaXQgdGhlbiBuZXcgbm9kZSBlbnZpcm9tZW50IGlzIGxvYWRlZFxyXG5cclxuICAvL3NreXNwaGVyZVJvdGF0aW9uLnZhbHVlID0gY3VycmVudE5vZGUuc2t5c3BoZXJlLnJvdGF0aW9uIC8gKE1hdGguUEkgKiAyKSAqIDMxNDtcclxuICBhd2FpdCBQcm9taXNlLmFsbChbXHJcbiAgICBza3lzcGhlcmUuc2xpZGUoc2t5c3BoZXJlRm9sZGVyUGF0aCArIGN1cnJlbnROb2RlLnNreXNwaGVyZS5wYXRoLCBjdXJyZW50Tm9kZS5za3lzcGhlcmUucm90YXRpb24pLFxyXG5cclxuICAgIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIGxldCBuZWlnaGJvdXJVUklzID0gYXdhaXQgc2VydmVyLmdldE5laWdoYm91cnMobm9kZVVSSSk7XHJcbiAgICAgIC8vIGRlbGV0ZSBvbGQgbmVpZ2hib3Vycy4uLlxyXG4gICAgICBmb3IgKGxldCBuZWlnaGJvdXIgb2YgbmVpZ2hib3Vycykge1xyXG4gICAgICAgIG5laWdoYm91ci5kb1N1aWNpZGUgPSB0cnVlOyAvLyBTUGJcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZ2V0IG5ldyBuZWlnaGJvdXJzXHJcbiAgICAgIG5laWdoYm91cnMgPSBbXTtcclxuICAgICAgZm9yIChsZXQgbmVpZ2hib3VyVVJJIG9mIG5laWdoYm91clVSSXMpIHtcclxuICAgICAgICBsZXQgbmVpZ2hib3VyID0gYXdhaXQgc2VydmVyLmdldE5vZGUobmVpZ2hib3VyVVJJKTtcclxuICAgICAgICBuZWlnaGJvdXIucG9zaXRpb24gPSBtdGguVmVjMy5mcm9tT2JqZWN0KG5laWdoYm91ci5wb3NpdGlvbik7IC8vIHVwZGF0ZSB2ZWMzXHJcbiAgICAgICAgbmVpZ2hib3VyLnVyaSA9IG5laWdoYm91clVSSTtcclxuICAgICAgICBcclxuICAgICAgICBuZWlnaGJvdXJzLnB1c2gobmVpZ2hib3VyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgfSlcclxuICBdKTtcclxuXHJcbiAgLy8gYWRkIGFycm93c1xyXG4gIGZvciAobGV0IG5laWdoYm91ciBvZiBPYmplY3QudmFsdWVzKG5laWdoYm91cnMpKSB7XHJcbiAgICBsZXQgYXJyb3cgPSBhd2FpdCBjcmVhdGVBcnJvdyhuZWlnaGJvdXIucG9zaXRpb24uc3ViKGN1cnJlbnROb2RlLnBvc2l0aW9uKS5ub3JtYWxpemUoKSk7XHJcbiAgICBhcnJvdy50YXJnZXQgPSBuZWlnaGJvdXI7XHJcbiAgfVxyXG59IC8qIHNldEN1cnJlbnROb2RlICovXHJcblxyXG4vLyBzdGFydHVwXHJcbnNldEN1cnJlbnROb2RlKGF3YWl0IHNlcnZlci5nZXREZWZOb2RlVVJJKCkpO1xyXG5cclxuc3lzdGVtLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XHJcbiAgbGV0IHVuaXQgPSBzeXN0ZW0uZ2V0VW5pdEJ5Q29vcmQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XHJcblxyXG4gIC8vIGdvIHRvIG5leHQgbm9kZSBpZiBjdXJyZW50IG5vZGUgaXMgYXJyb3dcclxuICBpZiAodW5pdC50eXBlID09PSBcImFycm93XCIpIHtcclxuICAgIHNldEN1cnJlbnROb2RlKHVuaXQudGFyZ2V0LnVyaSk7XHJcbiAgfVxyXG59KTsgLyogZXZlbnQgc3lzdGVtLmNhbnZhczpcImNsaWNrXCIgKi9cclxuXHJcbi8vIHJldHVybiB0byBlZGl0b3JcclxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b0VkaXRvclwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIuL2VkaXRvci5odG1sXCIgKyB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xyXG59KTsgLyogZXZlbnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b0VkaXRvclwiKTpcImNsaWNrXCIgKi9cclxuXHJcbi8vc2t5c3BoZXJlUm90YXRpb24uYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIChldmVudCkgPT4ge1xyXG4vLyAgbGV0IGFuZ2xlID0gc2t5c3BoZXJlUm90YXRpb24udmFsdWUgLyAzMTQgKiBNYXRoLlBJICogMjtcclxuLy9cclxuLy8gIHNreXNwaGVyZS5yb3RhdGlvbiA9IGFuZ2xlO1xyXG4vLyAgc2VydmVyLnVwZGF0ZU5vZGUoY3VycmVudE5vZGVVUkksIHtcclxuLy8gICAgc2t5c3BoZXJlOiB7XHJcbi8vICAgICAgcm90YXRpb246IGFuZ2xlLFxyXG4vLyAgICAgIHBhdGg6IGN1cnJlbnROb2RlLnNreXNwaGVyZS5wYXRoLFxyXG4vLyAgICB9XHJcbi8vICB9KTtcclxuLy99KTsgLyogZXZlbnQgc2t5c3BoZXJlUm90YXRpb246XCJpbnB1dFwiICovXHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBhc3luYyAoZXZlbnQpID0+IHtcclxuICBsZXQgZGlyZWN0aW9uID0gKG5ldyBtdGguVmVjMihzeXN0ZW0uY2FtZXJhLmRpci54LCBzeXN0ZW0uY2FtZXJhLmRpci56KSkubm9ybWFsaXplKCk7XHJcblxyXG4gIHN3aXRjaCAoZXZlbnQua2V5KSB7XHJcbiAgICBjYXNlIFwiQXJyb3dVcFwiOlxyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiQXJyb3dEb3duXCI6XHJcbiAgICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbi5uZWcoKTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcIkFycm93TGVmdFwiOlxyXG4gICAgICBkaXJlY3Rpb24gPSBkaXJlY3Rpb24ucmlnaHQoKTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSBcIkFycm93UmlnaHRcIjpcclxuICAgICAgZGlyZWN0aW9uID0gZGlyZWN0aW9uLmxlZnQoKTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgbGV0IG1heEFycm93ID0gbnVsbCwgbWF4QXJyb3dDb2VmZmljZW50ID0gTWF0aC5TUVJUMV8yO1xyXG4gIGZvciAobGV0IGFycm93IG9mIGFycm93cykge1xyXG4gICAgbGV0IGNvZWZmaWNlbnQgPSBhcnJvdy5kaXJlY3Rpb24uZG90KGRpcmVjdGlvbik7XHJcblxyXG4gICAgaWYgKGNvZWZmaWNlbnQgPiBtYXhBcnJvd0NvZWZmaWNlbnQpIHtcclxuICAgICAgbWF4QXJyb3cgPSBhcnJvdztcclxuICAgICAgbWF4QXJyb3dDb2VmZmljZW50ID0gY29lZmZpY2VudDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChtYXhBcnJvdyAhPT0gbnVsbCkge1xyXG4gICAgYXdhaXQgc2V0Q3VycmVudE5vZGUobWF4QXJyb3cudGFyZ2V0LnVyaSk7XHJcbiAgfVxyXG59KTsgLyogZXZlbnQgZG9jdW1lbnQ6XCJrZXlkb3duXCIgKi9cclxuXHJcblxyXG52YXIgbWFwQ2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21pbmltYXBDYW52YXMnKTtcclxubWFwQ2FudmFzLndpZHRoID0gbWFwQ2FudmFzLmhlaWdodCA9IDIwMDtcclxudmFyIG1hcENvbnRleHQgPSBtYXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbmZ1bmN0aW9uIGxvYWRJbWcoIGZpbGVOYW1lICkge1xyXG4gIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuICBpbWcuc3JjID0gXCIuL2Jpbi9pbWdzL1wiICsgZmlsZU5hbWU7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKCBhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgaW1nLm9ubG9hZCA9ICgpPT57IHJlc29sdmUoaW1nKTsgfTtcclxuICB9KTtcclxufVxyXG5cclxudmFyIGZsb29yc01hcHMgPSBbXTtcclxuXHJcbmZ1bmN0aW9uIHNldEFjdGl2ZSggYnV0dG9uLCBuZXdWYWx1ZSApIHtcclxuICBidXR0b24uY2xhc3NOYW1lID0gYnV0dG9uLmNsYXNzTmFtZS5yZXBsYWNlKFwiIGFjdGl2ZVwiLCBcIlwiKTtcclxuXHJcbiAgaWYgKG5ld1ZhbHVlID09IDEpXHJcbiAge1xyXG4gICAgYnV0dG9uLmNsYXNzTmFtZSArPSBcIiBhY3RpdmVcIjtcclxuICB9XHJcbiAgZWxzZSBpZiAobmV3VmFsdWUgPT0gMCkge1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gb25GbG9vcmNoYW5nZSggbmV3Q3VyRmxvb3IgKSB7XHJcbiAgY29uc29sZS5sb2coXCJORVcgQUNUSVZFIEZMT09SOiBcIiArIG5ld0N1ckZsb29yKTtcclxufVxyXG5cclxudmFyIGZsb29yQnV0dG9ucyA9IFtdO1xyXG52YXIgY3VyRmxvb3IgPSAwO1xyXG5mb3IgKGxldCBpID0gLTE7IGkgPD0gNDsgaSsrKVxyXG57XHJcbiAgbGV0IGZsb29yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmbG9vclwiICsgaSk7XHJcbiAgXHJcbiAgaWYgKGZsb29yID09IHVuZGVmaW5lZClcclxuICB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkZVQ0sgWU9VLCBGTE9PUiBcIiArIGkpO1xyXG4gICAgY29udGludWU7XHJcbiAgfVxyXG4gIGZsb29yLm9uY2xpY2sgPSAoKT0+e1xyXG4gICAgaWYgKGN1ckZsb29yICE9PSB1bmRlZmluZWQpXHJcbiAgICAgIHNldEFjdGl2ZShmbG9vckJ1dHRvbnNbY3VyRmxvb3JdLCAwKTtcclxuICAgIHNldEFjdGl2ZShmbG9vciwgMSk7XHJcbiAgICBvbkZsb29yY2hhbmdlKGkpO1xyXG4gICAgY3VyRmxvb3IgPSBpO1xyXG4gIH07XHJcblxyXG4gIGZsb29yc01hcHNbaV0gPSBhd2FpdCBsb2FkSW1nKGBtaW5pbWFwL2Yke2l9LnBuZ2ApO1xyXG4gIFxyXG4gIGZsb29yQnV0dG9uc1tpXSA9IGZsb29yO1xyXG59XHJcbi8vY29uc29sZS5sb2coZmxvb3JzTWFwcyk7XHJcbi8vY29uc29sZS5sb2cobWluaW1hcEYxKTtcclxuc2V0QWN0aXZlKGZsb29yQnV0dG9uc1tjdXJGbG9vcl0sIDEpO1xyXG5cclxudmFyIG1pbmlNYXBTY2FsZSA9IC4yO1xyXG52YXIgbWluaU1hcE9mZnNldCA9IG5ldyBtdGguVmVjMigwLCAwKTtcclxudmFyIGNlbnRlclBvcyA9IG5ldyBtdGguVmVjMig3MTAsIDM0MCk7XHJcbnZhciBtYXBQb3MxID0gbmV3IG10aC5WZWMyKDExLjUsIDE2LjUpO1xyXG52YXIgbWluaW1hcFBvczEgPSBuZXcgbXRoLlZlYzIoZmxvb3JzTWFwc1swXS53aWR0aCAtIGNlbnRlclBvcy54LCBmbG9vcnNNYXBzWzBdLmhlaWdodCAtIGNlbnRlclBvcy55KTtcclxudmFyIG1hcENvZWYgPSBtYXBQb3MxLmxlbmd0aCgpIC8gbWluaW1hcFBvczEubGVuZ3RoKCk7XHJcblxyXG5cclxubWFwQ2FudmFzLm9ud2hlZWwgPSAoZSk9PntcclxuICBcclxuICBsZXQgY29lZiA9IE1hdGgucG93KDAuOTUsIGUuZGVsdGFZIC8gMTAwKTtcclxuICBjb25zb2xlLmxvZyhlKTtcclxuICBsZXQgbW91c2VQb3MgPSBuZXcgbXRoLlZlYzIoZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xyXG5cclxuICBtaW5pTWFwT2Zmc2V0ID0gbW91c2VQb3Muc3ViKG1vdXNlUG9zLnN1YihtaW5pTWFwT2Zmc2V0KS5tdWwoY29lZikpO1xyXG5cclxuICBtaW5pTWFwU2NhbGUgKj0gY29lZjtcclxuXHJcbiAgY29uc29sZS5sb2cobWluaU1hcE9mZnNldCk7XHJcbiAgY29uc29sZS5sb2cobWluaU1hcFNjYWxlKTtcclxufTtcclxuXHJcbm1hcENhbnZhcy5vbmNvbnRleHRtZW51ID0gKCBlICk9PntcclxuICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbn07XHJcbm1hcENhbnZhcy5vbm1vdXNlbW92ZSA9ICggZSApPT57XHJcbiAgaWYgKGUuYnV0dG9ucyAmIDIpIC8vIERyYWdcclxuICAgIG1pbmlNYXBPZmZzZXQgPSBtaW5pTWFwT2Zmc2V0LmFkZChuZXcgbXRoLlZlYzIoZS5tb3ZlbWVudFgsIGUubW92ZW1lbnRZKSk7ICAgXHJcbn07XHJcblxyXG5tYXBDYW52YXMub25jbGljayA9IGFzeW5jICggZSApPT57XHJcbiAgaWYgKGN1ckZsb29yID09PSB1bmRlZmluZWQpXHJcbiAgICByZXR1cm47XHJcbiAgICBcclxuICBsZXQgbVBvcyA9IG5ldyBtdGguVmVjMihlLm9mZnNldFgsIGUub2Zmc2V0WSkuc3ViKG1pbmlNYXBPZmZzZXQpLm11bCgxIC8gbWluaU1hcFNjYWxlKTtcclxuXHJcbiAgbGV0IHBvcyA9IG1Qb3Muc3ViKGNlbnRlclBvcykubXVsKG1hcENvZWYpO1xyXG5cclxuICBsZXQgbmVhcmVzdFVSSSA9IGF3YWl0IHNlcnZlci5nZXROZWFyZXN0KG5ldyBtdGguVmVjMyhwb3MueCwgMCwgcG9zLnkpLCBjdXJGbG9vcik7XHJcbiAgY29uc29sZS5sb2cobmVhcmVzdFVSSSk7XHJcbiAgXHJcbiAgYXdhaXQgc2V0Q3VycmVudE5vZGUobmVhcmVzdFVSSSk7XHJcbiAgLy9hd2FpdCBzZXRDdXJyZW50Tm9kZSgpO1xyXG59XHJcblxyXG53aW5kb3cuc2V0SW50ZXJ2YWwoKCk9PntcclxuICAvLyBSZW5kZXJcclxuICBtYXBDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBtYXBDYW52YXMud2lkdGgsIG1hcENhbnZhcy5oZWlnaHQpO1xyXG4gIFxyXG4gIGlmIChjdXJGbG9vciA9PT0gdW5kZWZpbmVkKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICBtYXBDb250ZXh0LmRyYXdJbWFnZShmbG9vcnNNYXBzW2N1ckZsb29yXSwgbWluaU1hcE9mZnNldC54LCBtaW5pTWFwT2Zmc2V0LnksIGZsb29yc01hcHNbY3VyRmxvb3JdLndpZHRoICogbWluaU1hcFNjYWxlLCBmbG9vcnNNYXBzW2N1ckZsb29yXS5oZWlnaHQgKiBtaW5pTWFwU2NhbGUpO1xyXG59LCAxMCk7XHJcblxyXG5zeXN0ZW0ucnVuKCk7XHJcblxyXG4vKiB2aWV3ZXJfbWFpbi5qcyAqLyJdLCJuYW1lcyI6WyJtdGguU2l6ZSIsIm10aC5WZWMzIiwibXRoLlZlYzIiLCJtdGguTWF0NCIsIm10aC5DYW1lcmEiLCJ3aXRoTmF0aXZlQmxvYiIsIndpdGhOYXRpdmVBcnJheUJ1ZmZlciIsImlzVmlldyIsImxvb2t1cCIsImRlY29kZSIsInByb3RvY29sIiwiZ2xvYmFsVGhpcyIsImVuY29kZSIsIlhNTEh0dHBSZXF1ZXN0IiwiU29ja2V0IiwiUkVTRVJWRURfRVZFTlRTIiwiRW5naW5lIiwiaW8iLCJybmQuVG9wb2xvZ3kiLCJybmQuU3lzdGVtIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ2xELEVBQUUsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO0FBQ3RCLElBQUksT0FBTyxJQUFJLENBQUM7QUFDaEIsR0FBRztBQUNIO0FBQ0EsRUFBRSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JDO0FBQ0EsRUFBRSxFQUFFLENBQUMsWUFBWSxD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LEdBQUc7QUFDSDtBQUNBLEVBQUUsSUFBSSxHQUFHO0FBQ1QsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsR0FBRztBQUNIO0FBQ0EsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFO0FBQ1YsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsR0FBRztBQUNIO0FBQ0EsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFO0FBQ1YsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsR0FBRztBQUNIO0FBQ0EsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFO0FBQ1YsSUFBSSxJQUFJLEVBQUUsWUFBWSxJQUFJO0FBQzFCLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25FO0FBQ0EsTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7QUFDbkUsR0FBRztBQUNIO0FBQ0EsRUFBRSxNQUFNLEdBQUc7QUFDWCxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFFLEdBQUc7QUFDSDtBQUNBLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRTtBQUNmLElBQUk7QUFDSixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3hCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDeEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDbEQsR0FBRztBQUNIO0FBQ0EsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFO0FBQ1YsSUFBSSxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3pELEdBQUc7QUFDSDtBQUNBLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRTtBQUNkLElBQUksT0FBTyxJQUFJLElBQUk7QUFDbkIsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztBQUN2QyxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQ3ZDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDdkMsS0FBSyxDQUFDO0FBQ04sR0FBRztBQUNIO0FBQ0EsRUFBRSxTQUFTLEdBQUc7QUFDZCxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUM1QjtBQUNBLElBQUksT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQzlELEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxhQUFhLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ3ZELElBQUksT0FBTyxJQUFJLElBQUk7QUFDbkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUN0RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztBQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO0FBQ3RELEtBQUssQ0FBQztBQUNOLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxVQUFVLENBQUMsTUFBTSxFQUFFO0FBQzVCLElBQUksT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xELEdBQUc7QUFDSCxDQUFDO0FBQ0Q7QUFDTyxNQUFNLElBQUksQ0FBQztBQUNs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Q0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFDL0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUMvRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQy9FLEtBQUssQ0FBQztBQUNOLEdBQUc7QUFDSDtBQUNBLEVBQUUsU0FBUyxHQUFHO0FBQ2QsSUFBSSxPQUFPLElBQUksSUFBSTtBQUNuQixNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BELE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDcEQsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNwRCxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BELEtBQUssQ0FBQztBQUNOLEdBQUc7QUFDSDtBQUNBLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRTtBQUNWLElBQUksT0FBTyxJQUFJLElBQUk7QUFDbkIsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HO0FBQ0EsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HO0FBQ0EsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HO0FBQ0EsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLENB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SUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzdCLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqRDtBQUNBLElBQUksT0FBTyxJQUFJLElBQUk7QUFDbkIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUMxRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0FBQzFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMs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QUFLLENBQUM7QUFDeEMsRUFBRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDO0FBQzFDO0FBQ0EsRUFBRSxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUMvQztBQUNBLEVBQUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDN0MsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixHQUFHO0FBQ0g7QUFDQSxFQUFFLElBQUksU0FBUyxFQUFFO0FBQ2pCLElBQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQzFELE1BQU0sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckMsS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLENBQUM7QUFDRjtBQUNBO0FBQ0EsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxLQUFLLENBQUM7QUFDN0MsRUFBRSxJQUFJ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LENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUN6QixRQUFRLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDakYsUUFBUSxHQUFHLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDM0YsUUFBUSxHQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUMzQixLQUFLO0FBQ0wsSUFBSSxHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDaEQsSUFBSSxHQUFHLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDL0MsSUFBSSxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFDRCxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQzlCLElBQUksTUFBTSxJQUFJLEdBQUcsVUFBVSxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEUsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUN0RCxRQUFRLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzNC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LE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUN4RSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxZQUFZO0FBQ3pDLElBQUksSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDOUQsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDckIsUUFBUSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDakMsUUFBUSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzVELFFBQVEsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUM7QUFDaEYsS0FBSztBQUNMLElBQUksT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLENBQUMsQ0FBQztBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxZQUFZO0FBQ3RDLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDQUFDO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFD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QUNOO0FBQ0EsSUFBSSxTQUFTLFVBQVUsQ0FBQyxLQUFLLEVBQUU7QUFDL0IsTUFBTSxJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDaEQ7QUFDQTtBQUNBLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNsQyxNQUFNO0FBQ04sUUFBUSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JJLFFBQVEsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUMvRDtBQUNBO0FBQ0EsTUFBTSxPQUFPLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMxQixNQUFNLFFBQVEsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzFCO0FBQ0EsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0Q7QUFDQTtBQUNBLE1BQU0sU0FBUyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BFLE1BQU0sU0FBUyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNoRCxN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Q0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDN0M7QUFDQSxFQUFFLElBQUksVUFBVSxHQUFHLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJRCxJQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3BGLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMxQjtBQUNBLEVBQUUsTUFBTSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkM7QUFDQSxFQUFDO0FBQ0Q7QUFDQSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUk7QUFDdkI7QUFDQSxFQUFFLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNoRTtBQUNBLEVBQUUsSUFBSSxRQUFRLEtBQUssU0FBUztBQUM1QixJQUFJLE9BQU87QUFDWDtBQUNBLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEdBQUcsWUFBWSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDLENBQUM7QUFDdEssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ1A7QUFDQSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDYjtBQUNBIiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzksMTAsMTEsMTIsMTMsMTQsMTUsMTYsMTcsMTgsMTksMjAsMjEsMjIsMjMsMjQsMjUsMjYsMjcsMjgsMjksMzAsMzEsMzIsMzMsMzQsMzUsMzZdfQ==
