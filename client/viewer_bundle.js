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

function clamp(number, min, max) {
  return number < min ? min : number > max ? max : number;
} /* clamp */

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

    case Texture.HALF_FLOAT:
      const halfFloatInternals = [WebGL2RenderingContext.R16F, WebGL2RenderingContext.RG16F, WebGL2RenderingContext.RGB16F, WebGL2RenderingContext.RGBA16F];
      return {
        format: fmts[componentCount - 1],
        internal: halfFloatInternals[componentCount - 1],
        componentType: WebGL2RenderingContext.HALF_FLOAT
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
  static HALF_FLOAT    = 1;
  static UNSIGNED_BYTE = 2;
  static DEPTH         = 3;

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
      this.attachments[i] = new Texture(gl, Texture.HALF_FLOAT, 4);
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
      this.attachments[i] = new Texture(gl, Texture.HALF_FLOAT, 4);
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

    let extensions = ["EXT_color_buffer_float"];
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
function createPacketEncoderStream() {
    return new TransformStream({
        transform(packet, controller) {
            encodePacketToBinary(packet, encodedPacket => {
                const payloadLength = encodedPacket.length;
                let header;
                // inspired by the WebSocket format: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#decoding_payload_length
                if (payloadLength < 126) {
                    header = new Uint8Array(1);
                    new DataView(header.buffer).setUint8(0, payloadLength);
                }
                else if (payloadLength < 65536) {
                    header = new Uint8Array(3);
                    const view = new DataView(header.buffer);
                    view.setUint8(0, 126);
                    view.setUint16(1, payloadLength);
                }
                else {
                    header = new Uint8Array(9);
                    const view = new DataView(header.buffer);
                    view.setUint8(0, 127);
                    view.setBigUint64(1, BigInt(payloadLength));
                }
                // first bit indicates whether the payload is plain text (0) or binary (1)
                if (packet.data && typeof packet.data !== "string") {
                    header[0] |= 0x80;
                }
                controller.enqueue(header);
                controller.enqueue(encodedPacket);
            });
        }
    });
}
let TEXT_DECODER;
function totalLength(chunks) {
    return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
    if (chunks[0].length === size) {
        return chunks.shift();
    }
    const buffer = new Uint8Array(size);
    let j = 0;
    for (let i = 0; i < size; i++) {
        buffer[i] = chunks[0][j++];
        if (j === chunks[0].length) {
            chunks.shift();
            j = 0;
        }
    }
    if (chunks.length && j < chunks[0].length) {
        chunks[0] = chunks[0].slice(j);
    }
    return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
    if (!TEXT_DECODER) {
        TEXT_DECODER = new TextDecoder();
    }
    const chunks = [];
    let state = 0 /* READ_HEADER */;
    let expectedLength = -1;
    let isBinary = false;
    return new TransformStream({
        transform(chunk, controller) {
            chunks.push(chunk);
            while (true) {
                if (state === 0 /* READ_HEADER */) {
                    if (totalLength(chunks) < 1) {
                        break;
                    }
                    const header = concatChunks(chunks, 1);
                    isBinary = (header[0] & 0x80) === 0x80;
                    expectedLength = header[0] & 0x7f;
                    if (expectedLength < 126) {
                        state = 3 /* READ_PAYLOAD */;
                    }
                    else if (expectedLength === 126) {
                        state = 1 /* READ_EXTENDED_LENGTH_16 */;
                    }
                    else {
                        state = 2 /* READ_EXTENDED_LENGTH_64 */;
                    }
                }
                else if (state === 1 /* READ_EXTENDED_LENGTH_16 */) {
                    if (totalLength(chunks) < 2) {
                        break;
                    }
                    const headerArray = concatChunks(chunks, 2);
                    expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
                    state = 3 /* READ_PAYLOAD */;
                }
                else if (state === 2 /* READ_EXTENDED_LENGTH_64 */) {
                    if (totalLength(chunks) < 8) {
                        break;
                    }
                    const headerArray = concatChunks(chunks, 8);
                    const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
                    const n = view.getUint32(0);
                    if (n > Math.pow(2, 53 - 32) - 1) {
                        // the maximum safe integer in JavaScript is 2^53 - 1
                        controller.enqueue(ERROR_PACKET);
                        break;
                    }
                    expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
                    state = 3 /* READ_PAYLOAD */;
                }
                else {
                    if (totalLength(chunks) < expectedLength) {
                        break;
                    }
                    const data = concatChunks(chunks, expectedLength);
                    controller.enqueue(decodePacket(isBinary ? data : TEXT_DECODER.decode(data), binaryType));
                    state = 0 /* READ_HEADER */;
                }
                if (expectedLength === 0 || expectedLength > maxPayload) {
                    controller.enqueue(ERROR_PACKET);
                    break;
                }
            }
        }
    });
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
        this.ws.binaryType = this.socket.binaryType;
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
        this.transport.closed
            .then(() => {
            this.onClose();
        })
            .catch((err) => {
            this.onError("webtransport error", err);
        });
        // note: we could have used async/await, but that would require some additional polyfills
        this.transport.ready.then(() => {
            this.transport.createBidirectionalStream().then((stream) => {
                const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
                const reader = stream.readable.pipeThrough(decoderStream).getReader();
                const encoderStream = createPacketEncoderStream();
                encoderStream.readable.pipeTo(stream.writable);
                this.writer = encoderStream.writable.getWriter();
                const read = () => {
                    reader
                        .read()
                        .then(({ done, value }) => {
                        if (done) {
                            return;
                        }
                        this.onPacket(value);
                        read();
                    })
                        .catch((err) => {
                    });
                };
                read();
                const packet = { type: "open" };
                if (this.query.sid) {
                    packet.data = `{"sid":"${this.query.sid}"}`;
                }
                this.writer.write(packet).then(() => this.onOpen());
            });
        });
    }
    write(packets) {
        this.writable = false;
        for (let i = 0; i < packets.length; i++) {
            const packet = packets[i];
            const lastPacket = i === packets.length - 1;
            this.writer.write(packet).then(() => {
                if (lastPacket) {
                    nextTick(() => {
                        this.writable = true;
                        this.emitReserved("drain");
                    }, this.setTimeoutFn);
                }
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
        this.binaryType = defaultBinaryType;
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
            closeOnBeforeunload: false,
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
        const opts = Object.assign({}, this.opts, {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port,
        }, this.opts.transportOptions[name]);
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
            this.resetPingTimeout();
            switch (packet.type) {
                case "open":
                    this.onHandshake(JSON.parse(packet.data));
                    break;
                case "ping":
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
            1.75,
            slideRotation
          ]));
        } else {
          mtl.ubo.writeData(new Float32Array([
            dir.x, dir.y, dir.z, 0,
            rgh.x, rgh.y, rgh.z, 0,
            tup.x, tup.y, tup.z,
            sphere.rotation,
            1.75,
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

skysphere.rotation = Math.PI * 0.50;

let arrowMaterial = await system.createMaterial("./shaders/arrow");

arrowMaterial.ubo = system.createUniformBuffer();
arrowMaterial.uboNameOnShader = "arrowUBO";

/* Setup window material */
arrowMaterial.ubo.writeData(new Float32Array([window.innerHeight > window.innerWidth != 0 ? 3.0 : 1.0]));
window.addEventListener("resize", () => {
  arrowMaterial.ubo.writeData(new Float32Array([clamp(window.innerHeight / window.innerWidth, 0.5, 1.5) * 2.0]));
});

let arrowPrim = await system.createEmptyPrimitive(4, Topology.TRIANGLE_FAN, arrowMaterial);
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
  setFloor(currentNode.floor);

  clearArrows();

  // wait then new node enviroment is loaded

  //skysphereRotation.value = currentNode.skysphere.rotation / (Math.PI * 2) * 314;
  await Promise.all([
    skysphere.slide(skysphereFolderPath + currentNode.skysphere.path, skysphere.rotation),

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

// return to server
document.getElementById("toServer").addEventListener("click", () => {
  window.location.href = "./server.html" + window.location.search;
}); /* event document.getElementById("toServer"):"click" */


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


// Minimap part

function loadImg( fileName ) {
  var img = new Image();
  img.src = "./bin/imgs/" + fileName;
  return new Promise( async (resolve) => {
    img.onload = ()=>{ resolve(img); };
  });
} /* loadImg */


// Floor maps loading
function setActive( button, newValue ) {
  button.className = button.className.replace(" active", "");

  if (newValue == 1)
    button.className += " active";
} /* setActive */

function onFloorchange( newCurFloor ) {
  console.log("NEW ACTIVE FLOOR: " + newCurFloor);
} /* onFloorchange */

function setFloor( newFloor ) {
  if (curFloor !== undefined)
    setActive(floorButtons[curFloor], 0);
  setActive(floorButtons[newFloor], 1);
  onFloorchange(newFloor);
  curFloor = newFloor;
} /* End of 'setFloor' function */

function drawAvatar( ctx, coords )
{
  const size = 5;
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgb(255, 0, 0)';

  ctx.beginPath();
  ctx.moveTo(coords.x - size, coords.y - size);
  ctx.lineTo(coords.x + size, coords.y + size);
  ctx.moveTo(coords.x + size, coords.y - size);
  ctx.lineTo(coords.x - size, coords.y + size);
  ctx.closePath();
  ctx.stroke();
} /* End of 'drawAvatar' function */

var floorsMaps = [];
var floorButtons = [];
var curFloor;


async function setupMinimap() {
  var mapCanvas = document.getElementById('minimapCanvas');
  mapCanvas.width = mapCanvas.height = 200;
  var mapContext = mapCanvas.getContext('2d');

  var DBInfo = await server.send("getDBInfo", await server.send("getCurDBIndex"));
  console.log(DBInfo);

  // Add floor buttons
  let floorButtonBlock = document.getElementById("floorButtonBlock");

  let buttonsHtml = "";
  for (let i = 0, len = DBInfo.floorCount; i < len; i++)
    buttonsHtml += `<input type="button" id="floor${DBInfo.firstFloor + i}" class="button floor" value="${DBInfo.firstFloor + i}">`;
  floorButtonBlock.innerHTML = buttonsHtml;

  // Load images
  for (let i = 0, len = DBInfo.floorCount; i < len; i++)
  {
    // index of current button from button block
    let floorIndex = DBInfo.firstFloor + i;
  
    floorButtons[floorIndex] = floorButtonBlock.children[i];
    floorButtons[floorIndex].onclick = () => {
      setFloor(floorIndex);
    };
  
    floorsMaps[floorIndex] = await loadImg(`minimap/${DBInfo.name}/f${floorIndex}.png`);
  }

  console.log(floorsMaps);

  var modelEndPos = new Vec2(DBInfo.modelEndPos.x, DBInfo.modelEndPos.y);
  var minimapOffset = new Vec2(DBInfo.minimapOffset.x, DBInfo.minimapOffset.y);
  var minimapScale = DBInfo.minimapScale;
  var imgCenterPos = new Vec2(DBInfo.imgCenterPos.x, DBInfo.imgCenterPos.y);

  var imgEndPos = new Vec2(floorsMaps[0].width - DBInfo.imgCenterPos.x, floorsMaps[0].height - DBInfo.imgCenterPos.y);
  var mapCoef = modelEndPos.length() / imgEndPos.length();

  mapCanvas.onwheel = (e) => {

    let coef = Math.pow(0.95, e.deltaY / 100);
    console.log(e);
    let mousePos = new Vec2(e.offsetX, e.offsetY);

    minimapOffset = mousePos.sub(mousePos.sub(minimapOffset).mul(coef));

    minimapScale *= coef;

    console.log(minimapOffset);
    console.log(minimapScale);
  };

  mapCanvas.oncontextmenu = ( e )=>{
    e.preventDefault();
  };
  mapCanvas.onmousemove = ( e )=>{
    if (e.buttons & 2) // Drag
    minimapOffset = minimapOffset.add(new Vec2(e.movementX, e.movementY));
  };

  mapCanvas.onclick = async ( e )=>{
    if (curFloor === undefined)
      return;

    let mPos = new Vec2(e.offsetX, e.offsetY).sub(minimapOffset).mul(1 / minimapScale);

    let pos = mPos.sub(imgCenterPos).mul(mapCoef);

    let nearestURI = await server.getNearest(new Vec3(pos.x, 0, pos.y), parseInt(curFloor));
    console.log(nearestURI);

    await setCurrentNode(nearestURI);
    //await setCurrentNode();
  };

  window.setInterval(()=>{
    // Render
    mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    if (curFloor === undefined)
      return;

    mapContext.drawImage(floorsMaps[curFloor], minimapOffset.x, minimapOffset.y, floorsMaps[curFloor].width * minimapScale, floorsMaps[curFloor].height * minimapScale);

    if (currentNode != undefined)
    {
      let avatarPos = (new Vec2(currentNode.position.x, currentNode.position.z)).mul(1 / mapCoef).add(imgCenterPos);
      drawAvatar(mapContext, avatarPos.mul(minimapScale).add(minimapOffset));
    }
  }, 10);
}

await setupMinimap();

system.run();

/* viewer_main.js */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyX2J1bmRsZS5qcyIsInNvdXJjZXMiOlsic3JjL3N5c3RlbS9zaGFkZXIuanMiLCJzcmMvc3lzdGVtL210aC5qcyIsInNyYy9zeXN0ZW0vdGV4dHVyZS5qcyIsInNyYy9zeXN0ZW0vdWJvLmpzIiwic3JjL3N5c3RlbS9tYXRlcmlhbC5qcyIsInNyYy9zeXN0ZW0vcHJpbWl0aXZlLmpzIiwic3JjL3N5c3RlbS90YXJnZXQuanMiLCJzcmMvc3lzdGVtL3RpbWVyLmpzIiwic3JjL3N5c3RlbS9zeXN0ZW0uanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLXBhcnNlci9idWlsZC9lc20vY29tbW9ucy5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9lbmNvZGVQYWNrZXQuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9jb250cmliL2Jhc2U2NC1hcnJheWJ1ZmZlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9kZWNvZGVQYWNrZXQuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9Ac29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9nbG9iYWxUaGlzLmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdXRpbC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9jb250cmliL3BhcnNlcXMuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL2NvbnRyaWIveWVhc3QuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9oYXMtY29ycy5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3htbGh0dHByZXF1ZXN0LmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy9wb2xsaW5nLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvd2Vic29ja2V0LWNvbnN0cnVjdG9yLmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy93ZWJzb2NrZXQuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy93ZWJ0cmFuc3BvcnQuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9jb250cmliL3BhcnNldXJpLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3NvY2tldC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS91cmwuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLXBhcnNlci9idWlsZC9lc20vaXMtYmluYXJ5LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1wYXJzZXIvYnVpbGQvZXNtL2JpbmFyeS5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tcGFyc2VyL2J1aWxkL2VzbS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9vbi5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9zb2NrZXQuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9iYWNrbzIuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vbWFuYWdlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9pbmRleC5qcyIsInNyYy9ub2Rlcy5qcyIsInNyYy9jYW1lcmFfY29udHJvbGxlci5qcyIsInNyYy9za3lzcGhlcmUuanMiLCJzcmMvdmlld2VyX21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gc2hhZGVyTW9kdWxlRnJvbVNvdXJjZShnbCwgdHlwZSwgc291cmNlKSB7XHJcbiAgaWYgKHNvdXJjZSA9PSBudWxsKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIGxldCBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSk7XHJcblxyXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XHJcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG5cclxuICBsZXQgcmVzID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xyXG4gIGlmIChyZXMgIT0gbnVsbCAmJiByZXMubGVuZ3RoID4gMClcclxuICAgIGNvbnNvbGUuZXJyb3IoYFNoYWRlciBtb2R1bGUgY29tcGlsYXRpb24gZXJyb3I6ICR7cmVzfWApO1xyXG5cclxuICByZXR1cm4gc2hhZGVyO1xyXG59IC8qIHNoYWRlck1vZHVsZUZyb21Tb3VyY2UgKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaGFkZXJGcm9tU291cmNlKGdsLCB2ZXJ0U291cmNlLCBmcmFnU291cmNlKSB7XHJcbiAgbGV0IG1vZHVsZXMgPSBbXHJcbiAgICBzaGFkZXJNb2R1bGVGcm9tU291cmNlKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2ZXJ0U291cmNlKSxcclxuICAgIHNoYWRlck1vZHVsZUZyb21Tb3VyY2UoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgZnJhZ1NvdXJjZSksXHJcbiAgXTtcclxuICBsZXQgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2R1bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAobW9kdWxlc1tpXSAhPSBudWxsKSB7XHJcbiAgICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBtb2R1bGVzW2ldKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xyXG5cclxuICBpZiAoIWdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKVxyXG4gICAgY29uc29sZS5lcnJvcihgU2hhZGVyIGxpbmtpbmcgZXJyb3I6ICR7Z2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSl9YCk7XHJcblxyXG4gIHJldHVybiBwcm9ncmFtO1xyXG59IC8qIHNoYWRlckZyb21Tb3VyY2UgKi9cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkU2hhZGVyKGdsLCBwYXRoKSB7XHJcbiAgcmV0dXJuIHNoYWRlckZyb21Tb3VyY2UoZ2wsXHJcbiAgICBhd2FpdCBmZXRjaChwYXRoICsgXCIudmVydD9cIiArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKSkudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5vayA/IHJlc3BvbnNlLnRleHQoKSA6IG51bGwpLFxyXG4gICAgYXdhaXQgZmV0Y2gocGF0aCArIFwiLmZyYWc/XCIgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkpLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2Uub2sgPyByZXNwb25zZS50ZXh0KCkgOiBudWxsKSxcclxuICApO1xyXG59IC8qIGxvYWRTaGFkZXIgKi8iLCJleHBvcnQgZnVuY3Rpb24gY2xhbXAobnVtYmVyLCBtaW4sIG1heCkge1xyXG4gIHJldHVybiBudW1iZXIgPCBtaW4gPyBtaW4gOiBudW1iZXIgPiBtYXggPyBtYXggOiBudW1iZXI7XHJcbn0gLyogY2xhbXAgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBWZWMzIHtcclxuICB4O1xyXG4gIHk7XHJcbiAgejtcclxuXHJcbiAgY29uc3RydWN0b3IobngsIG55LCBueikge1xyXG4gICAgdGhpcy54ID0gbng7XHJcbiAgICB0aGlzLnkgPSBueTtcclxuICAgIHRoaXMueiA9IG56O1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgY29weSgpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyh0aGlzLngsIHRoaXMueSwgdGhpcy56KTtcclxuICB9IC8qIGNvcHkgKi9cclxuXHJcbiAgYWRkKG0yKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzModGhpcy54ICsgbTIueCwgdGhpcy55ICsgbTIueSwgdGhpcy56ICsgbTIueik7XHJcbiAgfSAvKiBhZGQgKi9cclxuXHJcbiAgc3ViKG0yKSB7XHJcbiAgICByZXR1cm4gbmV3IFZlYzModGhpcy54IC0gbTIueCwgdGhpcy55IC0gbTIueSwgdGhpcy56IC0gbTIueik7XHJcbiAgfSAvKiBzdWIgKi9cclxuXHJcbiAgbXVsKG0yKSB7XHJcbiAgICBpZiAobTIgaW5zdGFuY2VvZiBWZWMzKVxyXG4gICAgICByZXR1cm4gbmV3IFZlYzModGhpcy54ICogbTIueCwgdGhpcy55ICogbTIueSwgdGhpcy56ICogbTIueik7XHJcbiAgICBlbHNlXHJcbiAgICAgIHJldHVybiBuZXcgVmVjMyh0aGlzLnggKiBtMiwgICB0aGlzLnkgKiBtMiwgICB0aGlzLnogKiBtMiAgKTtcclxuICB9IC8qIG11bCAqL1xyXG5cclxuICBsZW5ndGgoKSB7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueik7XHJcbiAgfSAvKiBsZW5ndGggKi9cclxuXHJcbiAgZGlzdGFuY2UobTIpIHtcclxuICAgIGxldFxyXG4gICAgICBkeCA9IHRoaXMueCAtIG0yLngsXHJcbiAgICAgIGR5ID0gdGhpcy55IC0gbTIueSxcclxuICAgICAgZHogPSB0aGlzLnogLSBtMi56O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHopO1xyXG4gIH0gLyogZGlzdGFuY2UgKi9cclxuXHJcbiAgZG90KG0yKSB7XHJcbiAgICByZXR1cm4gdGhpcy54ICogbTIueCArIHRoaXMueSAqIG0yLnkgKyB0aGlzLnogKiBtMi56O1xyXG4gIH0gLyogZG90ICovXHJcblxyXG4gIGNyb3NzKG90aHYpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyhcclxuICAgICAgdGhpcy55ICogb3Rodi56IC0gb3Rodi55ICogdGhpcy56LFxyXG4gICAgICB0aGlzLnogKiBvdGh2LnggLSBvdGh2LnogKiB0aGlzLngsXHJcbiAgICAgIHRoaXMueCAqIG90aHYueSAtIG90aHYueCAqIHRoaXMueVxyXG4gICAgKTtcclxuICB9IC8qIGNyb3NzICovXHJcblxyXG4gIG5vcm1hbGl6ZSgpIHtcclxuICAgIGxldCBsZW4gPSB0aGlzLmxlbmd0aCgpO1xyXG5cclxuICAgIHJldHVybiBuZXcgVmVjMyh0aGlzLnggLyBsZW4sIHRoaXMueSAvIGxlbiwgdGhpcy56IC8gbGVuKTtcclxuICB9IC8qIG5vcm1hbGl6ZSAqL1xyXG5cclxuICBzdGF0aWMgZnJvbVNwaGVyaWNhbChhemltdXRoLCBlbGV2YXRpb24sIHJhZGl1cyA9IDEpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyhcclxuICAgICAgcmFkaXVzICogTWF0aC5zaW4oZWxldmF0aW9uKSAqIE1hdGguY29zKGF6aW11dGgpLFxyXG4gICAgICByYWRpdXMgKiBNYXRoLmNvcyhlbGV2YXRpb24pLFxyXG4gICAgICByYWRpdXMgKiBNYXRoLnNpbihlbGV2YXRpb24pICogTWF0aC5zaW4oYXppbXV0aClcclxuICAgICk7XHJcbiAgfSAvKiBzcGhlcmljYWxUb0NhcnRlc2lhbiAqL1xyXG5cclxuICBzdGF0aWMgZnJvbU9iamVjdChvYmplY3QpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMyhvYmplY3QueCwgb2JqZWN0LnksIG9iamVjdC56KTtcclxuICB9IC8qIGZyb21PYmplY3QgKi9cclxufSAvKiBWZWMzICovXHJcblxyXG5leHBvcnQgY2xhc3MgVmVjMiB7XHJcbiAgeDtcclxuICB5O1xyXG5cclxuICBjb25zdHJ1Y3RvcihueCwgbnkpIHtcclxuICAgIHRoaXMueCA9IG54O1xyXG4gICAgdGhpcy55ID0gbnk7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBjb3B5KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMyKCk7XHJcbiAgfVxyXG5cclxuICBhZGQobTIpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKyBtMi54LCB0aGlzLnkgKyBtMi55KTtcclxuICB9IC8qIGFkZCAqL1xyXG5cclxuICBzdWIobTIpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggLSBtMi54LCB0aGlzLnkgLSBtMi55KTtcclxuICB9IC8qIHN1YiAqL1xyXG5cclxuICBtdWwobTIpIHtcclxuICAgIGlmIChtMiBpbnN0YW5jZW9mIFZlYzIpXHJcbiAgICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKiBtMi54LCB0aGlzLnkgKiBtMi55KTtcclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCAqIG0yLCB0aGlzLnkgKiBtMik7XHJcbiAgfSAvKiBtdWwgKi9cclxuXHJcbiAgbGVuZ3RoMigpIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzO3lcclxuICB9IC8qIGxlbmd0aDIgKi9cclxuXHJcbiAgbGVuZ3RoKCkge1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xyXG4gIH0gLyogbGVuZ3RoICovXHJcblxyXG4gIGRvdChtMikge1xyXG4gICAgcmV0dXJuIHRoaXMueCAqIG0yLnggKyB0aGlzLnkgKiBtMi55O1xyXG4gIH0gLyogZG90ICovXHJcblxyXG4gIGNyb3NzKG90aHYpIHtcclxuICAgIHJldHVybiB0aGlzLnggKiBvdGh2LnkgLSBvdGh2LnggKiB0aGlzLnk7XHJcbiAgfSAvKiBjcm9zcyAqL1xyXG5cclxuICBub3JtYWxpemUoKSB7XHJcbiAgICBsZXQgbGVuID0gdGhpcy5sZW5ndGgoKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54IC8gbGVuLCB0aGlzLnkgLyBsZW4pO1xyXG4gIH0gLyogbm9ybWFsaXplICovXHJcblxyXG4gIG5lZygpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMigtdGhpcy54LCAtdGhpcy55KTtcclxuICB9IC8qIG5lZyAqL1xyXG5cclxuICBsZWZ0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMyKC10aGlzLnksIHRoaXMueCk7XHJcbiAgfSAvKiByaWdodCAqL1xyXG5cclxuICByaWdodCgpIHtcclxuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnksIC10aGlzLngpO1xyXG4gIH0gLyogcmlnaHQgKi9cclxufSAvKiBWZWMyICovXHJcblxyXG5leHBvcnQgY2xhc3MgU2l6ZSB7XHJcbiAgdztcclxuICBoO1xyXG5cclxuICBjb25zdHJ1Y3Rvcih3LCBoKSB7XHJcbiAgICB0aGlzLncgPSB3O1xyXG4gICAgdGhpcy5oID0gaDtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIGNvcHkoKSB7XHJcbiAgICByZXR1cm4gbmV3IFNpemUodGhpcy53LCB0aGlzLmgpO1xyXG4gIH0gLyogY29weSAqL1xyXG59IC8qIFNpemUgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBNYXQ0IHtcclxuICBtO1xyXG5cclxuICBjb25zdHJ1Y3Rvcih2MDAsIHYwMSwgdjAyLCB2MDMsXHJcbiAgICAgICAgICAgICAgdjEwLCB2MTEsIHYxMiwgdjEzLFxyXG4gICAgICAgICAgICAgIHYyMCwgdjIxLCB2MjIsIHYyMyxcclxuICAgICAgICAgICAgICB2MzAsIHYzMSwgdjMyLCB2MzMpIHtcclxuICAgIHRoaXMubSA9IFtcclxuICAgICAgdjAwLCB2MDEsIHYwMiwgdjAzLFxyXG4gICAgICB2MTAsIHYxMSwgdjEyLCB2MTMsXHJcbiAgICAgIHYyMCwgdjIxLCB2MjIsIHYyMyxcclxuICAgICAgdjMwLCB2MzEsIHYzMiwgdjMzXHJcbiAgICBdO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgY29weSgpIHtcclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgdGhpcy5tWyAwXSwgdGhpcy5tWyAxXSwgdGhpcy5tWyAyXSwgdGhpcy5tWyAzXSxcclxuICAgICAgdGhpcy5tWyA0XSwgdGhpcy5tWyA1XSwgdGhpcy5tWyA2XSwgdGhpcy5tWyA3XSxcclxuICAgICAgdGhpcy5tWyA4XSwgdGhpcy5tWyA5XSwgdGhpcy5tWzEwXSwgdGhpcy5tWzExXSxcclxuICAgICAgdGhpcy5tWzEyXSwgdGhpcy5tWzEzXSwgdGhpcy5tWzE0XSwgdGhpcy5tWzE1XSxcclxuICAgICk7XHJcbiAgfSAvKiBjb3B5ICovXHJcblxyXG4gIHRyYW5zZm9ybVBvaW50KHYpXHJcbiAge1xyXG4gICAgcmV0dXJuIG5ldyBWZWMzKFxyXG4gICAgICB2LnggKiB0aGlzLm1bIDBdICsgdi55ICogdGhpcy5tWyA0XSArIHYueiAqIHRoaXMubVsgOF0gKyB0aGlzLm1bMTJdLFxyXG4gICAgICB2LnggKiB0aGlzLm1bIDFdICsgdi55ICogdGhpcy5tWyA1XSArIHYueiAqIHRoaXMubVsgOV0gKyB0aGlzLm1bMTNdLFxyXG4gICAgICB2LnggKiB0aGlzLm1bIDJdICsgdi55ICogdGhpcy5tWyA2XSArIHYueiAqIHRoaXMubVsxMF0gKyB0aGlzLm1bMTRdXHJcbiAgICApO1xyXG4gIH0gLyogdHJhbnNmb3JtUG9pbnQgKi9cclxuXHJcbiAgdHJhbnNmb3JtNHg0KHYpXHJcbiAge1xyXG4gICAgbGV0IHcgPSB2LnggKiB0aGlzLm1bM10gKyB2LnkgKiB0aGlzLm1bN10gKyB2LnogKiB0aGlzLm1bMTFdICsgdGhpcy5tWzE1XTtcclxuICBcclxuICAgIHJldHVybiBuZXcgVmVjMyhcclxuICAgICAgKHYueCAqIHRoaXMubVsgMF0gKyB2LnkgKiB0aGlzLm1bIDRdICsgdi56ICogdGhpcy5tWyA4XSArIHRoaXMubVsxMl0pIC8gdyxcclxuICAgICAgKHYueCAqIHRoaXMubVsgMV0gKyB2LnkgKiB0aGlzLm1bIDVdICsgdi56ICogdGhpcy5tWyA5XSArIHRoaXMubVsxM10pIC8gdyxcclxuICAgICAgKHYueCAqIHRoaXMubVsgMl0gKyB2LnkgKiB0aGlzLm1bIDZdICsgdi56ICogdGhpcy5tWzEwXSArIHRoaXMubVsxNF0pIC8gd1xyXG4gICAgKTtcclxuICB9IC8qIHRyYW5zZm9ybTR4NCAqL1xyXG5cclxuICB0cmFuc3Bvc2UoKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHRoaXMubVsgMF0sIHRoaXMubVsgNF0sIHRoaXMubVsgOF0sIHRoaXMubVsxMl0sXHJcbiAgICAgIHRoaXMubVsgMV0sIHRoaXMubVsgNV0sIHRoaXMubVsgOV0sIHRoaXMubVsxM10sXHJcbiAgICAgIHRoaXMubVsgMl0sIHRoaXMubVsgNl0sIHRoaXMubVsxMF0sIHRoaXMubVsxNF0sXHJcbiAgICAgIHRoaXMubVsgM10sIHRoaXMubVsgN10sIHRoaXMubVsxMV0sIHRoaXMubVsxNV1cclxuICAgICk7XHJcbiAgfSAvKiB0cmFuc3Bvc2UgKi9cclxuXHJcbiAgbXVsKG0yKSB7XHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHRoaXMubVsgMF0gKiBtMi5tWyAwXSArIHRoaXMubVsgMV0gKiBtMi5tWyA0XSArIHRoaXMubVsgMl0gKiBtMi5tWyA4XSArIHRoaXMubVsgM10gKiBtMi5tWzEyXSxcclxuICAgICAgdGhpcy5tWyAwXSAqIG0yLm1bIDFdICsgdGhpcy5tWyAxXSAqIG0yLm1bIDVdICsgdGhpcy5tWyAyXSAqIG0yLm1bIDldICsgdGhpcy5tWyAzXSAqIG0yLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bIDBdICogbTIubVsgMl0gKyB0aGlzLm1bIDFdICogbTIubVsgNl0gKyB0aGlzLm1bIDJdICogbTIubVsxMF0gKyB0aGlzLm1bIDNdICogbTIubVsxNF0sXHJcbiAgICAgIHRoaXMubVsgMF0gKiBtMi5tWyAzXSArIHRoaXMubVsgMV0gKiBtMi5tWyA3XSArIHRoaXMubVsgMl0gKiBtMi5tWzExXSArIHRoaXMubVsgM10gKiBtMi5tWzE1XSxcclxuXHJcbiAgICAgIHRoaXMubVsgNF0gKiBtMi5tWyAwXSArIHRoaXMubVsgNV0gKiBtMi5tWyA0XSArIHRoaXMubVsgNl0gKiBtMi5tWyA4XSArIHRoaXMubVsgN10gKiBtMi5tWzEyXSxcclxuICAgICAgdGhpcy5tWyA0XSAqIG0yLm1bIDFdICsgdGhpcy5tWyA1XSAqIG0yLm1bIDVdICsgdGhpcy5tWyA2XSAqIG0yLm1bIDldICsgdGhpcy5tWyA3XSAqIG0yLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bIDRdICogbTIubVsgMl0gKyB0aGlzLm1bIDVdICogbTIubVsgNl0gKyB0aGlzLm1bIDZdICogbTIubVsxMF0gKyB0aGlzLm1bIDddICogbTIubVsxNF0sXHJcbiAgICAgIHRoaXMubVsgNF0gKiBtMi5tWyAzXSArIHRoaXMubVsgNV0gKiBtMi5tWyA3XSArIHRoaXMubVsgNl0gKiBtMi5tWzExXSArIHRoaXMubVsgN10gKiBtMi5tWzE1XSxcclxuXHJcbiAgICAgIHRoaXMubVsgOF0gKiBtMi5tWyAwXSArIHRoaXMubVsgOV0gKiBtMi5tWyA0XSArIHRoaXMubVsxMF0gKiBtMi5tWyA4XSArIHRoaXMubVsxMV0gKiBtMi5tWzEyXSxcclxuICAgICAgdGhpcy5tWyA4XSAqIG0yLm1bIDFdICsgdGhpcy5tWyA5XSAqIG0yLm1bIDVdICsgdGhpcy5tWzEwXSAqIG0yLm1bIDldICsgdGhpcy5tWzExXSAqIG0yLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bIDhdICogbTIubVsgMl0gKyB0aGlzLm1bIDldICogbTIubVsgNl0gKyB0aGlzLm1bMTBdICogbTIubVsxMF0gKyB0aGlzLm1bMTFdICogbTIubVsxNF0sXHJcbiAgICAgIHRoaXMubVsgOF0gKiBtMi5tWyAzXSArIHRoaXMubVsgOV0gKiBtMi5tWyA3XSArIHRoaXMubVsxMF0gKiBtMi5tWzExXSArIHRoaXMubVsxMV0gKiBtMi5tWzE1XSxcclxuXHJcbiAgICAgIHRoaXMubVsxMl0gKiBtMi5tWyAwXSArIHRoaXMubVsxM10gKiBtMi5tWyA0XSArIHRoaXMubVsxNF0gKiBtMi5tWyA4XSArIHRoaXMubVsxNV0gKiBtMi5tWzEyXSxcclxuICAgICAgdGhpcy5tWzEyXSAqIG0yLm1bIDFdICsgdGhpcy5tWzEzXSAqIG0yLm1bIDVdICsgdGhpcy5tWzE0XSAqIG0yLm1bIDldICsgdGhpcy5tWzE1XSAqIG0yLm1bMTNdLFxyXG4gICAgICB0aGlzLm1bMTJdICogbTIubVsgMl0gKyB0aGlzLm1bMTNdICogbTIubVsgNl0gKyB0aGlzLm1bMTRdICogbTIubVsxMF0gKyB0aGlzLm1bMTVdICogbTIubVsxNF0sXHJcbiAgICAgIHRoaXMubVsxMl0gKiBtMi5tWyAzXSArIHRoaXMubVsxM10gKiBtMi5tWyA3XSArIHRoaXMubVsxNF0gKiBtMi5tWzExXSArIHRoaXMubVsxNV0gKiBtMi5tWzE1XSxcclxuICAgICk7XHJcbiAgfSAvKiBtdWwgKi9cclxuXHJcbiAgc3RhdGljIGlkZW50aXR5KCkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICAxLCAwLCAwLCAwLFxyXG4gICAgICAwLCAxLCAwLCAwLFxyXG4gICAgICAwLCAwLCAxLCAwLFxyXG4gICAgICAwLCAwLCAwLCAxXHJcbiAgICApO1xyXG4gIH0gLyogaWRlbnRpdHkgKi9cclxuXHJcbiAgc3RhdGljIHNjYWxlKHMpIHtcclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgcy54LCAwLCAgIDAsICAgMCxcclxuICAgICAgMCwgICBzLnksIDAsICAgMCxcclxuICAgICAgMCwgICAwLCAgIHMueiwgMCxcclxuICAgICAgMCwgICAwLCAgIDAsICAgMVxyXG4gICAgKTtcclxuICB9IC8qIHNjYWxlICovXHJcblxyXG4gIHN0YXRpYyB0cmFuc2xhdGUodCkge1xyXG4gICAgcmV0dXJuIG5ldyBNYXQ0KFxyXG4gICAgICAxLCAgIDAsICAgMCwgICAwLFxyXG4gICAgICAwLCAgIDEsICAgMCwgICAwLFxyXG4gICAgICAwLCAgIDAsICAgMSwgICAwLFxyXG4gICAgICB0LngsIHQueSwgdC56LCAxXHJcbiAgICApO1xyXG4gIH0gLyogdHJhbnNsYXRlICovXHJcblxyXG4gIHN0YXRpYyByb3RhdGVYKGFuZ2xlKSB7XHJcbiAgICBsZXQgcyA9IE1hdGguc2luKGFuZ2xlKSwgYyA9IE1hdGguY29zKGFuZ2xlKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIDEsIDAsIDAsIDAsXHJcbiAgICAgIDAsIGMsIHMsIDAsXHJcbiAgICAgIDAsLXMsIGMsIDAsXHJcbiAgICAgIDAsIDAsIDAsIDFcclxuICAgICk7XHJcbiAgfSAvKiByb3RhdGVYICovXHJcblxyXG4gIHN0YXRpYyByb3RhdGVZKGFuZ2xlKSB7XHJcbiAgICBsZXQgcyA9IE1hdGguc2luKGFuZ2xlKSwgYyA9IE1hdGguY29zKGFuZ2xlKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIGMsIDAsLXMsIDAsXHJcbiAgICAgIDAsIDEsIDAsIDAsXHJcbiAgICAgIHMsIDAsIGMsIDAsXHJcbiAgICAgIDAsIDAsIDAsIDFcclxuICAgICk7XHJcbiAgfSAvKiByb3RhdGVZICovXHJcblxyXG4gIHN0YXRpYyByb3RhdGVaKGFuZ2xlKSB7XHJcbiAgICBsZXQgcyA9IE1hdGguc2luKGFuZ2xlKSwgYyA9IE1hdGguY29zKGFuZ2xlKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIGMsIHMsIDAsIDAsXHJcbiAgICAgLXMsIGMsIDAsIDAsXHJcbiAgICAgIDAsIDAsIDEsIDAsXHJcbiAgICAgIDAsIDAsIDAsIDFcclxuICAgICk7XHJcbiAgfSAvKiByb3RhdGVaICovXHJcblxyXG4gIHN0YXRpYyByb3RhdGUoYW5nbGUsIGF4aXMpIHtcclxuICAgIGxldCB2ID0gYXhpcy5ub3JtYWxpemUoKTtcclxuICAgIGxldCBzID0gTWF0aC5zaW4oYW5nbGUpLCBjID0gTWF0aC5jb3MoYW5nbGUpO1xyXG5cclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgdi54ICogdi54ICogKDEgLSBjKSArIGMsICAgICAgICAgdi54ICogdi55ICogKDEgLSBjKSAtIHYueiAqIHMsICAgdi54ICogdi56ICogKDEgLSBjKSArIHYueSAqIHMsICAgMCxcclxuICAgICAgdi55ICogdi54ICogKDEgLSBjKSArIHYueiAqIHMsICAgdi55ICogdi55ICogKDEgLSBjKSArIGMsICAgICAgICAgdi55ICogdi56ICogKDEgLSBjKSAtIHYueCAqIHMsICAgMCxcclxuICAgICAgdi56ICogdi54ICogKDEgLSBjKSAtIHYueSAqIHMsICAgdi56ICogdi55ICogKDEgLSBjKSArIHYueCAqIHMsICAgdi56ICogdi56ICogKDEgLSBjKSArIGMsICAgICAgICAgMCxcclxuICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMVxyXG4gICAgKTtcclxuICB9IC8qIHJvdGF0ZSAqL1xyXG5cclxuICBzdGF0aWMgdmlldyhsb2MsIGF0LCB1cCkge1xyXG4gICAgbGV0XHJcbiAgICAgIGRpciA9IGF0LnN1Yihsb2MpLm5vcm1hbGl6ZSgpLFxyXG4gICAgICByZ2ggPSBkaXIuY3Jvc3ModXApLm5vcm1hbGl6ZSgpLFxyXG4gICAgICB0dXAgPSByZ2guY3Jvc3MoZGlyKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE1hdDQoXHJcbiAgICAgIHJnaC54LCAgICAgICAgIHR1cC54LCAgICAgICAgIC1kaXIueCwgICAgICAgMCxcclxuICAgICAgcmdoLnksICAgICAgICAgdHVwLnksICAgICAgICAgLWRpci55LCAgICAgICAwLFxyXG4gICAgICByZ2gueiwgICAgICAgICB0dXAueiwgICAgICAgICAtZGlyLnosICAgICAgIDAsXHJcbiAgICAgIC1sb2MuZG90KHJnaCksIC1sb2MuZG90KHR1cCksIGxvYy5kb3QoZGlyKSwgMVxyXG4gICAgKTtcclxuICB9IC8qIHZpZXcgKi9cclxuXHJcbiAgc3RhdGljIGZydXN0dW0obGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcclxuICAgIHJldHVybiBuZXcgTWF0NChcclxuICAgICAgMiAqIG5lYXIgLyAocmlnaHQgLSBsZWZ0KSwgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLFxyXG4gICAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyICogbmVhciAvICh0b3AgLSBib3R0b20pLCAgICAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXHJcbiAgICAgIChyaWdodCArIGxlZnQpIC8gKHJpZ2h0IC0gbGVmdCksICh0b3AgKyBib3R0b20pIC8gKHRvcCAtIGJvdHRvbSksIChuZWFyICsgZmFyKSAvIChuZWFyIC0gZmFyKSwgICAtMSxcclxuICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMiAqIG5lYXIgKiBmYXIgLyAobmVhciAtIGZhciksICAwXHJcbiAgICApO1xyXG4gIH0gLyogZnJ1c3R1bSAqL1xyXG59IC8qIE1hdDQgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBDYW1lcmEge1xyXG4gIC8vIGNhbWVyYSBwcm9qZWN0aW9uIHNoYXBlIHBhcmFtc1xyXG4gIHByb2pTaXplID0gbmV3IFNpemUoMC4wMSwgMC4wMSk7XHJcbiAgY29ycmVjdGVkUHJvalNpemUgPSBuZXcgU2l6ZSgwLjAxLCAwLjAxKTtcclxuICBuZWFyID0gMC4wMTtcclxuICBmYXIgPSA4MTkyO1xyXG5cclxuICAvLyBjdXJyZW50IHNjcmVlbiByZXNvbHV0aW9uXHJcbiAgc2NyZWVuU2l6ZTtcclxuXHJcbiAgLy8gY2FtZXJhIGxvY2F0aW9uXHJcbiAgbG9jO1xyXG4gIGF0O1xyXG4gIGRpcjtcclxuICB1cDtcclxuICByaWdodDtcclxuXHJcbiAgLy8gY2FtZXJhIHByb2plY3Rpb24gbWF0cmljZXNcclxuICB2aWV3O1xyXG4gIHByb2o7XHJcbiAgdmlld1Byb2o7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5wcm9qID0gTWF0NC5pZGVudGl0eSgpO1xyXG4gICAgdGhpcy5zZXQobmV3IFZlYzMoMCwgMCwgLTEpLCBuZXcgVmVjMygwLCAwLCAwKSwgbmV3IFZlYzMoMCwgMSwgMCkpO1xyXG4gICAgdGhpcy5yZXNpemUobmV3IFNpemUoMzAsIDMwKSk7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBwcm9qU2V0KG5ld05lYXIsIG5ld0ZhciwgbmV3UHJvalNpemUpIHtcclxuICAgIHRoaXMucHJvalNpemUgPSBuZXdQcm9qU2l6ZS5jb3B5KCk7XHJcbiAgICB0aGlzLm5lYXIgPSBuZXdOZWFyO1xyXG4gICAgdGhpcy5mYXIgPSBuZXdGYXI7XHJcbiAgICB0aGlzLmNvcnJlY3RlZFByb2pTaXplID0gdGhpcy5wcm9qU2l6ZS5jb3B5KCk7XHJcblxyXG4gICAgaWYgKHRoaXMuc2NyZWVuU2l6ZS53ID4gdGhpcy5zY3JlZW5TaXplLmgpIHtcclxuICAgICAgdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS53ICo9IHRoaXMuc2NyZWVuU2l6ZS53IC8gdGhpcy5zY3JlZW5TaXplLmg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmNvcnJlY3RlZFByb2pTaXplLmggKj0gdGhpcy5zY3JlZW5TaXplLmggLyB0aGlzLnNjcmVlblNpemUudztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnByb2ogPSBNYXQ0LmZydXN0dW0oXHJcbiAgICAgIC10aGlzLmNvcnJlY3RlZFByb2pTaXplLncgLyAyLCB0aGlzLmNvcnJlY3RlZFByb2pTaXplLncgLyAyLFxyXG4gICAgICAtdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS5oIC8gMiwgdGhpcy5jb3JyZWN0ZWRQcm9qU2l6ZS5oIC8gMixcclxuICAgICAgdGhpcy5uZWFyLCB0aGlzLmZhclxyXG4gICAgKTtcclxuICAgIHRoaXMudmlld1Byb2ogPSB0aGlzLnZpZXcubXVsKHRoaXMucHJvaik7XHJcbiAgfSAvKiBwcm9qU2V0ICovXHJcblxyXG4gIHJlc2l6ZShuZXdTY3JlZW5TaXplKSB7XHJcbiAgICB0aGlzLnNjcmVlblNpemUgPSBuZXdTY3JlZW5TaXplLmNvcHkoKTtcclxuICAgIHRoaXMucHJvalNldCh0aGlzLm5lYXIsIHRoaXMuZmFyLCB0aGlzLnByb2pTaXplKTtcclxuICB9IC8qIHJlc2l6ZSAqL1xyXG5cclxuICBzZXQobG9jLCBhdCwgdXApIHtcclxuICAgIHRoaXMudmlldyA9IE1hdDQudmlldyhsb2MsIGF0LCB1cCk7XHJcbiAgICB0aGlzLnZpZXdQcm9qID0gdGhpcy52aWV3Lm11bCh0aGlzLnByb2opO1xyXG5cclxuICAgIHRoaXMubG9jID0gbG9jLmNvcHkoKTtcclxuICAgIHRoaXMuYXQgPSBhdC5jb3B5KCk7XHJcblxyXG4gICAgdGhpcy5yaWdodCA9IG5ldyBWZWMzKHRoaXMudmlldy5tWyAwXSwgdGhpcy52aWV3Lm1bIDRdLCB0aGlzLnZpZXcubVsgOF0pO1xyXG4gICAgdGhpcy51cCAgICA9IG5ldyBWZWMzKHRoaXMudmlldy5tWyAxXSwgdGhpcy52aWV3Lm1bIDVdLCB0aGlzLnZpZXcubVsgOV0pO1xyXG4gICAgdGhpcy5kaXIgICA9IG5ldyBWZWMzKHRoaXMudmlldy5tWyAyXSwgdGhpcy52aWV3Lm1bIDZdLCB0aGlzLnZpZXcubVsxMF0pLm11bCgtMSk7XHJcbiAgfSAvKiBzZXQgKi9cclxufSAvKiBDYW1lcmEgKi8iLCJpbXBvcnQgKiBhcyBtdGggZnJvbSBcIi4vbXRoLmpzXCI7XHJcblxyXG4vKiBmb3JtYXQgZGVjb2RpbmcgZnVuY3Rpb24gKi9cclxuZnVuY3Rpb24gZ2V0Rm9ybWF0KGNvbXBvbmVudFR5cGUsIGNvbXBvbmVudENvdW50KSB7XHJcbiAgY29uc3QgZm10cyA9IFtXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlJFRCwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SRywgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SR0IsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCQV07XHJcbiAgc3dpdGNoIChjb21wb25lbnRUeXBlKSB7XHJcbiAgICBjYXNlIFRleHR1cmUuRkxPQVQ6XHJcbiAgICAgIGNvbnN0IGZsb2F0SW50ZXJuYWxzID0gW1dlYkdMMlJlbmRlcmluZ0NvbnRleHQuUjMyRiwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SRzMyRiwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SR0IzMkYsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCQTMyRl07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybWF0OiBmbXRzW2NvbXBvbmVudENvdW50IC0gMV0sXHJcbiAgICAgICAgaW50ZXJuYWw6IGZsb2F0SW50ZXJuYWxzW2NvbXBvbmVudENvdW50IC0gMV0sXHJcbiAgICAgICAgY29tcG9uZW50VHlwZTogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5GTE9BVCxcclxuICAgICAgfTtcclxuXHJcbiAgICBjYXNlIFRleHR1cmUuSEFMRl9GTE9BVDpcclxuICAgICAgY29uc3QgaGFsZkZsb2F0SW50ZXJuYWxzID0gW1dlYkdMMlJlbmRlcmluZ0NvbnRleHQuUjE2RiwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SRzE2RiwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SR0IxNkYsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCQTE2Rl07XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybWF0OiBmbXRzW2NvbXBvbmVudENvdW50IC0gMV0sXHJcbiAgICAgICAgaW50ZXJuYWw6IGhhbGZGbG9hdEludGVybmFsc1tjb21wb25lbnRDb3VudCAtIDFdLFxyXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuSEFMRl9GTE9BVFxyXG4gICAgICB9O1xyXG5cclxuICAgIGNhc2UgVGV4dHVyZS5VTlNJR05FRF9CWVRFOlxyXG4gICAgICBjb25zdCBieXRlSW50ZXJuYWxzID0gW1dlYkdMMlJlbmRlcmluZ0NvbnRleHQuUjgsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkc4LCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlJHQjgsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuUkdCQThdO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1hdDogZm10c1tjb21wb25lbnRDb3VudCAtIDFdLFxyXG4gICAgICAgIGludGVybmFsOiBieXRlSW50ZXJuYWxzW2NvbXBvbmVudENvdW50IC0gMV0sXHJcbiAgICAgICAgY29tcG9uZW50VHlwZTogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5VTlNJR05FRF9CWVRFLFxyXG4gICAgICB9O1xyXG5cclxuICAgIGNhc2UgVGV4dHVyZS5ERVBUSDpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBmb3JtYXQ6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuREVQVEhfQ09NUE9ORU5ULFxyXG4gICAgICAgIGludGVybmFsOiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkRFUFRIX0NPTVBPTkVOVDMyRixcclxuICAgICAgICBjb21wb25lbnRUeXBlOiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkZMT0FULFxyXG4gICAgICB9O1xyXG5cclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIC8vIG1pbmltYWwgZm9ybWF0IHBvc3NpYmxlXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybWF0OiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlJFRCxcclxuICAgICAgICBpbnRlcm5hbDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5SOCxcclxuICAgICAgICBjb21wb25lbnRUeXBlOiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlVOU0lHTkVEX0JZVEUsXHJcbiAgICAgIH07XHJcbiAgfVxyXG59IC8qIGdldEZvcm1hdCAqL1xyXG5cclxuZXhwb3J0IGNsYXNzIFRleHR1cmUge1xyXG4gICNnbDtcclxuICAjZm9ybWF0O1xyXG4gIHNpemU7XHJcbiAgaWQ7XHJcblxyXG4gIHN0YXRpYyBGTE9BVCAgICAgICAgID0gMDtcclxuICBzdGF0aWMgSEFMRl9GTE9BVCAgICA9IDE7XHJcbiAgc3RhdGljIFVOU0lHTkVEX0JZVEUgPSAyO1xyXG4gIHN0YXRpYyBERVBUSCAgICAgICAgID0gMztcclxuXHJcbiAgY29uc3RydWN0b3IoZ2wsIGNvbXBvbmVudFR5cGUgPSBUZXh0dXJlLkZMT0FULCBjb21wb25lbnRDb3VudCA9IDEpIHtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuICAgIHRoaXMuc2l6ZSA9IG5ldyBtdGguU2l6ZSgxLCAxKTtcclxuICAgIHRoaXMuaWQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmlkKTtcclxuXHJcbiAgICB0aGlzLmZvcm1hdCA9IGdldEZvcm1hdChjb21wb25lbnRUeXBlLCBjb21wb25lbnRDb3VudCk7XHJcbiAgICAvLyBwdXQgZW1wdHkgaW1hZ2UgZGF0YVxyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdC5pbnRlcm5hbCwgMSwgMSwgMCwgdGhpcy5mb3JtYXQuZm9ybWF0LCB0aGlzLmZvcm1hdC5jb21wb25lbnRUeXBlLCBudWxsKTtcclxuXHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuXHJcbiAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfQUxJR05NRU5ULCAxKTtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIFxyXG4gIHN0YXRpYyBkZWZhdWx0Q2hlY2tlclRleHR1cmUgPSBudWxsO1xyXG4gIHN0YXRpYyBkZWZhdWx0Q2hlY2tlcihnbCkge1xyXG4gICAgaWYgKFRleHR1cmUuZGVmYXVsdENoZWNrZXJUZXh0dXJlID09PSBudWxsKSB7XHJcbiAgICAgIFRleHR1cmUuZGVmYXVsdENoZWNrZXJUZXh0dXJlID0gbmV3IFRleHR1cmUoZ2wsIFRleHR1cmUuVU5TSUdORURfQllURSwgNCk7XHJcbiAgXHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIFRleHR1cmUuZGVmYXVsdENoZWNrZXJUZXh0dXJlLmlkKTtcclxuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBOCwgMSwgMSwgMCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgbmV3IFVpbnQ4QXJyYXkoWzB4MDAsIDB4RkYsIDB4MDAsIDB4RkZdKSk7XHJcblxyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVGV4dHVyZS5kZWZhdWx0Q2hlY2tlclRleHR1cmU7XHJcbiAgfSAvKiBkZWZhdWx0Q2hlY2tlciAqL1xyXG5cclxuICBkZWZhdWx0Q2hlY2tlcihkYXRhKSB7XHJcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xyXG4gICAgdGhpcy5nbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIDIsIDIsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KFtcclxuICAgICAgMHgwMCwgMHhGRiwgMHgwMCwgMHhGRixcclxuICAgICAgMHgwMCwgMHgwMCwgMHgwMCwgMHhGRixcclxuICAgICAgMHgwMCwgMHgwMCwgMHgwMCwgMHhGRixcclxuICAgICAgMHgwMCwgMHhGRiwgMHgwMCwgMHhGRixcclxuICAgIF0pKTtcclxuICB9XHJcblxyXG4gIGxvYWQocGF0aCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgbGV0IGltYWdlID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgICBpbWFnZS5zcmMgPSBwYXRoO1xyXG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7IFxyXG4gICAgICAgIHRoaXMuZnJvbUltYWdlKGltYWdlKTtcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICB9IC8qIGxvYWQgKi9cclxuXHJcbiAgZnJvbUltYWdlKGltYWdlKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIHRoaXMuc2l6ZS53ID0gaW1hZ2Uud2lkdGg7XHJcbiAgICB0aGlzLnNpemUuaCA9IGltYWdlLmhlaWdodDtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xyXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdC5pbnRlcm5hbCwgdGhpcy5mb3JtYXQuZm9ybWF0LCB0aGlzLmZvcm1hdC5jb21wb25lbnRUeXBlLCBpbWFnZSk7XHJcbiAgfSAvKiBmcm9tSW1hZ2UgKi9cclxuXHJcbiAgYmluZChwcm9ncmFtLCBpbmRleCA9IDApIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xyXG5cclxuICAgIGxldCBsb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBgVGV4dHVyZSR7aW5kZXh9YCk7XHJcbiAgICBnbC51bmlmb3JtMWkobG9jYXRpb24sIGluZGV4KTtcclxuICB9IC8qIGJpbmQgKi9cclxuXHJcbiAgcmVzaXplKHNpemUpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcbiAgICB0aGlzLnNpemUgPSBzaXplLmNvcHkoKTtcclxuXHJcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZm9ybWF0LmludGVybmFsLCB0aGlzLnNpemUudywgdGhpcy5zaXplLmgsIDAsIHRoaXMuZm9ybWF0LmZvcm1hdCwgdGhpcy5mb3JtYXQuY29tcG9uZW50VHlwZSwgbnVsbCk7XHJcbiAgfSAvKiByZXNpemUgKi9cclxufSAvKiBUZXh0dXJlICovXHJcblxyXG5jb25zdCBmYWNlRGVzY3JpcHRpb25zID0gW1xyXG4gIHt0YXJnZXQ6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCB0ZXh0OiBcIitYXCIsIHBhdGg6IFwicG9zWFwifSxcclxuICB7dGFyZ2V0OiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCwgdGV4dDogXCItWFwiLCBwYXRoOiBcIm5lZ1hcIn0sXHJcbiAge3RhcmdldDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksIHRleHQ6IFwiK1lcIiwgcGF0aDogXCJwb3NZXCJ9LFxyXG4gIHt0YXJnZXQ6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCB0ZXh0OiBcIi1ZXCIsIHBhdGg6IFwibmVnWVwifSxcclxuICB7dGFyZ2V0OiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgdGV4dDogXCIrWlwiLCBwYXRoOiBcInBvc1pcIn0sXHJcbiAge3RhcmdldDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osIHRleHQ6IFwiLVpcIiwgcGF0aDogXCJuZWdaXCJ9LFxyXG5dO1xyXG5cclxuZXhwb3J0IGNsYXNzIEN1YmVtYXAge1xyXG4gICNnbDtcclxuICBpZDtcclxuXHJcbiAgY29uc3RydWN0b3IoZ2wpIHtcclxuICAgIHRoaXMuZ2wgPSBnbDtcclxuXHJcbiAgICBsZXQgY3R4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKS5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgY3R4LmNhbnZhcy53aWR0aCA9IDEyODtcclxuICAgIGN0eC5jYW52YXMuaGVpZ2h0ID0gMTI4O1xyXG5cclxuICAgIGZ1bmN0aW9uIGRyYXdGYWNlKHRleHQpIHtcclxuICAgICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gY3R4LmNhbnZhcztcclxuXHJcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnI0NDQyc7XHJcbiAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgY3R4LmZvbnQgPSBgJHt3aWR0aCAqIDAuNX1weCBjb25zb2xhc2A7XHJcbiAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcclxuICAgICAgY3R4LnRleHRCYXNlTGluZSA9ICdtaWRkbGUnO1xyXG4gICAgICBjdHguZmlsbFN0eWxlID0gJyMzMzMnO1xyXG5cclxuICAgICAgY3R4LmZpbGxUZXh0KHRleHQsIHdpZHRoIC8gMiwgaGVpZ2h0IC8gMik7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pZCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIHRoaXMuaWQpO1xyXG5cclxuICAgIGZvciAobGV0IGRlc2NyIG9mIGZhY2VEZXNjcmlwdGlvbnMpIHtcclxuICAgICAgZHJhd0ZhY2UoZGVzY3IudGV4dCk7XHJcblxyXG4gICAgICBnbC50ZXhJbWFnZTJEKGRlc2NyLnRhcmdldCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgY3R4LmNhbnZhcyk7XHJcbiAgICB9XHJcbiAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFX0NVQkVfTUFQKTtcclxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVJfTUlQTUFQX0xJTkVBUik7XHJcbiAgXHJcbiAgICBjdHguY2FudmFzLnJlbW92ZSgpO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgbG9hZChwYXRoKSB7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLmlkKTtcclxuXHJcbiAgICBmb3IgKGxldCBkZXNjciBvZiBmYWNlRGVzY3JpcHRpb25zKSB7XHJcbiAgICAgIGxldCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5cclxuICAgICAgZ2wudGV4SW1hZ2UyRChkZXNjci50YXJnZXQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGN0eC5jYW52YXMpO1xyXG4gICAgfVxyXG4gICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XHJcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSX01JUE1BUF9MSU5FQVIpO1xyXG4gIH0gLyogbG9hZCAqL1xyXG5cclxuICBiaW5kKHByb2dyYW0sIGluZGV4ID0gMCkge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaW5kZXgpO1xyXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgdGhpcy5pZCk7XHJcblxyXG4gICAgbGV0IGxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIGBUZXh0dXJlJHtpbmRleH1gKTtcclxuICAgIGdsLnVuaWZvcm0xaShsb2NhdGlvbiwgaW5kZXgpO1xyXG4gIH0gLyogYmluZCAqL1xyXG59IC8qIEN1YmVtYXAgKi8iLCJleHBvcnQgY2xhc3MgVUJPIHtcclxuICBnbDtcclxuICBidWZmZXI7XHJcbiAgaXNFbXB0eSA9IHRydWU7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGdsKSB7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICB0aGlzLmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgd3JpdGVEYXRhKGRhdGFBc0Zsb2F0QXJyYXkpIHtcclxuICAgIHRoaXMuaXNFbXB0eSA9IGZhbHNlO1xyXG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuVU5JRk9STV9CVUZGRVIsIHRoaXMuYnVmZmVyKTtcclxuICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLlVOSUZPUk1fQlVGRkVSLCBkYXRhQXNGbG9hdEFycmF5LCB0aGlzLmdsLlNUQVRJQ19EUkFXKTtcclxuICB9IC8qIHdyaXRlRGF0YSAqL1xyXG5cclxuICBiaW5kKHNoYWRlciwgYmluZGluZ1BvaW50LCBidWZmZXJOYW1lKSB7XHJcbiAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIGlmICghdGhpcy5pc0VtcHR5KSB7XHJcbiAgICAgIGxldCBsb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1CbG9ja0luZGV4KHNoYWRlciwgYnVmZmVyTmFtZSk7XHJcblxyXG4gICAgICBpZiAobG9jYXRpb24gIT0gZ2wuSU5WQUxJRF9JTkRFWCkge1xyXG4gICAgICAgIGdsLnVuaWZvcm1CbG9ja0JpbmRpbmcoc2hhZGVyLCBsb2NhdGlvbiwgYmluZGluZ1BvaW50KTtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyQmFzZShnbC5VTklGT1JNX0JVRkZFUiwgYmluZGluZ1BvaW50LCB0aGlzLmJ1ZmZlcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IC8qIGJpbmQgKi9cclxufSAvKiBVQk8gKi8iLCJpbXBvcnQge2xvYWRTaGFkZXJ9IGZyb20gXCIuL3NoYWRlci5qc1wiO1xyXG5pbXBvcnQge1RleHR1cmUsIEN1YmVtYXB9IGZyb20gXCIuL3RleHR1cmUuanNcIjtcclxuaW1wb3J0IHtVQk99IGZyb20gXCIuL3Viby5qc1wiO1xyXG5leHBvcnQge1RleHR1cmUsIEN1YmVtYXAsIFVCTywgbG9hZFNoYWRlcn07XHJcblxyXG5leHBvcnQgY2xhc3MgTWF0ZXJpYWwge1xyXG4gIHVib05hbWVPblNoYWRlciA9IFwiXCI7XHJcbiAgZ2w7XHJcbiAgdWJvID0gbnVsbDsgICAgLy8gb2JqZWN0IGJ1ZmZlclxyXG4gIHRleHR1cmVzID0gW107IC8vIGFycmF5IG9mIHRleHR1cmVzXHJcbiAgc2hhZGVyOyAgICAgICAgLy8gc2hhZGVyIHBvaW50ZXJcclxuXHJcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlcikge1xyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgdGhpcy5zaGFkZXIgPSBzaGFkZXI7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBhcHBseSgpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgZ2wudXNlUHJvZ3JhbSh0aGlzLnNoYWRlcik7XHJcblxyXG4gICAgaWYgKHRoaXMudWJvICE9IG51bGwpXHJcbiAgICAgIHRoaXMudWJvLmJpbmQodGhpcy5zaGFkZXIsIDAsIHRoaXMudWJvTmFtZU9uU2hhZGVyKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0dXJlcy5sZW5ndGg7IGkrKylcclxuICAgICAgdGhpcy50ZXh0dXJlc1tpXS5iaW5kKHRoaXMuc2hhZGVyLCBpKTtcclxuICB9IC8qIGFwcGx5ICovXHJcblxyXG4gIHVuYm91bmRUZXh0dXJlcygpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRleHR1cmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpKTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICB9XHJcbiAgfSAvKiB1bmJvdW5kVGV4dHVyZXMgKi9cclxufSAvKiBNYXRlcmlhbCAqLyIsImltcG9ydCB7bG9hZFNoYWRlcn0gZnJvbSBcIi4vc2hhZGVyLmpzXCI7XHJcbmltcG9ydCB7TWF0ZXJpYWwsIFRleHR1cmUsIEN1YmVtYXAsIFVCT30gZnJvbSBcIi4vbWF0ZXJpYWwuanNcIjtcclxuaW1wb3J0ICogYXMgbXRoIGZyb20gXCIuL210aC5qc1wiO1xyXG5cclxuZXhwb3J0IHtsb2FkU2hhZGVyLCBNYXRlcmlhbCwgVGV4dHVyZSwgQ3ViZW1hcCwgVUJPLCBtdGh9O1xyXG5cclxuZXhwb3J0IGNsYXNzIFZlcnRleCB7XHJcbiAgcDtcclxuICB0O1xyXG4gIG47XHJcblxyXG4gIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCB0ZXhjb29yZCwgbm9ybWFsKSB7XHJcbiAgICB0aGlzLnAgPSBwb3NpdGlvbjtcclxuICAgIHRoaXMudCA9IHRleGNvb3JkO1xyXG4gICAgdGhpcy5uID0gbm9ybWFsO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgc3RhdGljIGZyb21Db29yZChweCwgcHksIHB6LCBwdSA9IDAsIHB2ID0gMCwgcG54ID0gMCwgcG55ID0gMCwgcG56ID0gMSkge1xyXG4gICAgcmV0dXJuIG5ldyBWZXJ0ZXgobmV3IG10aC5WZWMzKHB4LCBweSwgcHopLCBuZXcgbXRoLlZlYzIocHUsIHB2KSwgbmV3IG10aC5WZWMzKHBueCwgcG55LCBwbnopKTtcclxuICB9IC8qIGZyb21Db29yZCAqL1xyXG5cclxuICBzdGF0aWMgZnJvbVZlY3RvcnMocCwgdCA9IG5ldyBtdGguVmVjMigwLCAwKSwgbiA9IG5ldyBtdGguVmVjMygxLCAxLCAxKSkge1xyXG4gICAgcmV0dXJuIG5ldyBWZXJ0ZXgocC5jb3B5KCksIHQuY29weSgpLCBuLmNvcHkoKSk7XHJcbiAgfSAvKiBmcm9tVmVjdG9ycyAqL1xyXG59OyAvKiBWZXJ0ZXggKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBUb3BvbG9neSB7XHJcbiAgdnR4O1xyXG4gIGlkeDtcclxuICB0eXBlID0gVG9wb2xvZ3kuVFJJQU5HTEVTO1xyXG5cclxuICBzdGF0aWMgTElORVMgICAgICAgICAgPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkxJTkVTO1xyXG4gIHN0YXRpYyBMSU5FX1NUUklQICAgICA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuTElORV9TVFJJUDtcclxuICBzdGF0aWMgTElORV9MT09QICAgICAgPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkxJTkVfTE9PUDtcclxuXHJcbiAgc3RhdGljIFBPSU5UUyAgICAgICAgID0gV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5QT0lOVFM7XHJcblxyXG4gIHN0YXRpYyBUUklBTkdMRVMgICAgICA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVFJJQU5HTEVTO1xyXG4gIHN0YXRpYyBUUklBTkdMRV9TVFJJUCA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuVFJJQU5HTEVfU1RSSVA7XHJcbiAgc3RhdGljIFRSSUFOR0xFX0ZBTiAgID0gV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5UUklBTkdMRV9GQU47XHJcblxyXG4gIGNvbnN0cnVjdG9yKG52dHggPSBbXSwgbmlkeCA9IG51bGwpIHtcclxuICAgIHRoaXMudnR4ID0gbnZ0eDtcclxuICAgIHRoaXMuaWR4ID0gbmlkeDtcclxuICB9IC8qIGNvbnN0cnVjdG9yICovXHJcblxyXG4gIHN0YXRpYyBnZW9tZXRyeVR5cGVUb0dMKGdlb21ldHJ5VHlwZSkge1xyXG4gICAgcmV0dXJuIGdlb21ldHJ5VHlwZTtcclxuICB9IC8qIGdlb21ldHJ5VHlwZVRvR0wgKi9cclxuXHJcbiAgc3RhdGljIHNxdWFyZSgpIHtcclxuICAgIGxldCB0cGwgPSBuZXcgVG9wb2xvZ3koW1xyXG4gICAgICBWZXJ0ZXguZnJvbUNvb3JkKC0xLCAtMSwgMCwgMCwgMCksXHJcbiAgICAgIFZlcnRleC5mcm9tQ29vcmQoLTEsICAxLCAwLCAwLCAxKSxcclxuICAgICAgVmVydGV4LmZyb21Db29yZCggMSwgLTEsIDAsIDEsIDApLFxyXG4gICAgICBWZXJ0ZXguZnJvbUNvb3JkKCAxLCAgMSwgMCwgMSwgMSlcclxuICAgIF0sIFswLCAxLCAyLCAzXSk7XHJcbiAgICB0cGwudHlwZSA9IFRvcG9sb2d5LlRSSUFOR0xFX1NUUklQO1xyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIHRoZVRyaWFuZ2xlICovXHJcblxyXG4gIHN0YXRpYyAjcGxhbmVJbmRleGVkKHdpZHRoID0gMzAsIGhlaWdodCA9IDMwKSB7XHJcbiAgICBsZXQgdHBsID0gbmV3IFRvcG9sb2d5KCk7XHJcblxyXG4gICAgdHBsLnR5cGUgPSBUb3BvbG9neS5UUklBTkdMRV9TVFJJUDtcclxuICAgIHRwbC52dHggPSBbXTtcclxuICAgIHRwbC5pZHggPSBbXTtcclxuXHJcbiAgICBsZXQgaSA9IDA7XHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodCAtIDE7IHkrKykge1xyXG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICB0cGwuaWR4W2krK10gPSB5ICogd2lkdGggKyB4O1xyXG4gICAgICAgIHRwbC5pZHhbaSsrXSA9ICh5ICsgMSkgKiB3aWR0aCArIHg7XHJcbiAgICAgIH1cclxuICAgICAgdHBsLmlkeFtpKytdID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIHBsYW5lSW5kZXhlZCAqL1xyXG5cclxuICBzdGF0aWMgcGxhbmUod2lkdGggPSAzMCwgaGVpZ2h0ID0gMzApIHtcclxuICAgIGxldCB0cGwgPSBUb3BvbG9neS4jcGxhbmVJbmRleGVkKHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgdHBsLnZ0eFt5ICogd2lkdGggKyB4XSA9IFZlcnRleC5mcm9tQ29vcmQoXHJcbiAgICAgICAgICB4LCAwLCB5LFxyXG4gICAgICAgICAgeCAvICh3aWR0aCAtIDEpLCB5IC8gKGhlaWdodCAtIDEpLFxyXG4gICAgICAgICAgMCwgMSwgMFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHBsO1xyXG4gIH0gLyogcGxhbmUgKi9cclxuXHJcbiAgc3RhdGljIGNvbmUoc2l6ZSA9IDMwKSB7XHJcbiAgICBsZXQgdHBsID0gbmV3IFRvcG9sb2d5KFtdLCBbXSk7XHJcblxyXG4gICAgdHBsLnZ0eC5wdXNoKFZlcnRleC5mcm9tQ29vcmQoMCwgMSwgMCkpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcclxuICAgICAgbGV0IGEgPSBpIC8gKHNpemUgLSAxKSAqIE1hdGguUEkgKiAyO1xyXG5cclxuICAgICAgdHBsLnZ0eC5wdXNoKFZlcnRleC5mcm9tQ29vcmQoTWF0aC5jb3MoYSksIDAsIE1hdGguc2luKGEpKSk7XHJcblxyXG4gICAgICB0cGwuaWR4LnB1c2goaSAlIHNpemUgKyAxKTtcclxuICAgICAgdHBsLmlkeC5wdXNoKDApO1xyXG4gICAgICB0cGwuaWR4LnB1c2goKGkgKyAxKSAlIHNpemUgKyAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHBsO1xyXG4gIH0gLyogY29uZSAqL1xyXG5cclxuICBzdGF0aWMgY3lsaW5kZXIoc2l6ZT0zMCkge1xyXG4gICAgbGV0IHRwbCA9IG5ldyBUb3BvbG9neShbXSk7XHJcbiAgICB0cGwudHlwZSA9IHRoaXMuVFJJQU5HTEVfU1RSSVA7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gc2l6ZTsgaSsrKSB7XHJcbiAgICAgIGxldCBhID0gaSAvIChzaXplIC0gMikgKiBNYXRoLlBJICogMjtcclxuICAgICAgbGV0IGNhID0gTWF0aC5jb3MoYSksIHNhID0gTWF0aC5zaW4oYSk7XHJcblxyXG4gICAgICB0cGwudnR4LnB1c2goVmVydGV4LmZyb21Db29yZChjYSwgMCwgc2EpKTtcclxuICAgICAgdHBsLnZ0eC5wdXNoKFZlcnRleC5mcm9tQ29vcmQoY2EsIDEsIHNhKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIGN5bGluZGVyICovXHJcblxyXG4gIHN0YXRpYyBzcGhlcmUocmFkaXVzID0gMSwgd2lkdGggPSAzMCwgaGVpZ2h0ID0gMzApIHtcclxuICAgIGxldCB0cGwgPSBUb3BvbG9neS4jcGxhbmVJbmRleGVkKHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgbGV0IHRoZXRhID0gTWF0aC5QSSAqIHkgLyAoaGVpZ2h0IC0gMSk7XHJcbiAgICAgIGxldCBzdGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XHJcbiAgICAgIGxldCBjdGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XHJcblxyXG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICBsZXQgcGhpID0gMiAqIE1hdGguUEkgKiB4IC8gKHdpZHRoIC0gMSk7XHJcblxyXG4gICAgICAgIGxldCBueCA9IHN0aGV0YSAqIE1hdGguc2luKHBoaSk7XHJcbiAgICAgICAgbGV0IG55ID0gY3RoZXRhO1xyXG4gICAgICAgIGxldCBueiA9IHN0aGV0YSAqIE1hdGguY29zKHBoaSk7XHJcblxyXG4gICAgICAgIHRwbC52dHhbeSAqIHdpZHRoICsgeF0gPSBWZXJ0ZXguZnJvbUNvb3JkKFxyXG4gICAgICAgICAgcmFkaXVzICogbngsIHJhZGl1cyAqIG55LCByYWRpdXMgKiBueixcclxuICAgICAgICAgIHggLyAod2lkdGggLSAxKSwgeSAvIChoZWlnaHQgLSAxKSxcclxuICAgICAgICAgIG54LCBueSwgbnpcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIHNwaGVyZSAqL1xyXG5cclxuICBzdGF0aWMgYXN5bmMgbW9kZWxfb2JqKHBhdGgpIHtcclxuICAgIGxldCB0cGwgPSBuZXcgVG9wb2xvZ3koKTtcclxuICAgIHRwbC52dHggPSBbXTtcclxuICAgIHRwbC50eXBlID0gVG9wb2xvZ3kuVFJJQU5HTEVTO1xyXG5cclxuICAgIGNvbnN0IHNyYyA9IGF3YWl0IGZldGNoKHBhdGgpLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UudGV4dCgpKTtcclxuICAgIGxldCBsaW5lcyA9IHNyYy5zcGxpdChcIlxcblwiKTtcclxuICAgIGxldCBwb3NpdGlvbnMgPSBbXTtcclxuICAgIGxldCB0ZXhDb29yZHMgPSBbXTtcclxuICAgIGxldCBub3JtYWxzID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgbGkgPSAwLCBsaW5lQ291bnQgPSBsaW5lcy5sZW5ndGg7IGxpIDwgbGluZUNvdW50OyBsaSsrKSB7XHJcbiAgICAgIGxldCBzZWdtZW50cyA9IGxpbmVzW2xpXS5zcGxpdChcIiBcIik7XHJcblxyXG4gICAgICBzd2l0Y2ggKHNlZ21lbnRzWzBdKSB7XHJcbiAgICAgICAgY2FzZSBcInZcIjpcclxuICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKG5ldyBtdGguVmVjMyhcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChzZWdtZW50c1sxXSksXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoc2VnbWVudHNbMl0pLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzNdKVxyXG4gICAgICAgICAgKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSBcInZ0XCI6XHJcbiAgICAgICAgICB0ZXhDb29yZHMucHVzaChuZXcgbXRoLlZlYzIoXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoc2VnbWVudHNbMV0pLFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzJdKVxyXG4gICAgICAgICAgKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSBcInZuXCI6XHJcbiAgICAgICAgICBub3JtYWxzLnB1c2gobmV3IG10aC5WZWMzKFxyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KHNlZ21lbnRzWzFdKSxcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChzZWdtZW50c1syXSksXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoc2VnbWVudHNbM10pXHJcbiAgICAgICAgICApKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICBjYXNlIFwiZlwiOlxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBsZXQgdnRkID0gc2VnbWVudHNbMV0uc3BsaXQoXCIvXCIpO1xyXG4gICAgICAgICAgICBsZXQgaTAgPSBwYXJzZUludCh2dGRbMF0pLCBpMSA9IHBhcnNlSW50KHZ0ZFsxXSksIGkyID0gcGFyc2VJbnQodnRkWzJdKTtcclxuXHJcbiAgICAgICAgICAgIHRwbC52dHgucHVzaChuZXcgVmVydGV4KFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMCkgPyBuZXcgbXRoLlZlYzMoMCwgMCwgMCkgOiBwb3NpdGlvbnNbaTAgLSAxXSxcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTEpID8gbmV3IG10aC5WZWMyKDAsIDApIDogdGV4Q29vcmRzW2kxIC0gMV0sXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkyKSA/IG5ldyBtdGguVmVjMygwLCAwLCAwKSA6IG5vcm1hbHNbaTIgLSAxXVxyXG4gICAgICAgICAgICApKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbGV0IHZ0ZCA9IHNlZ21lbnRzWzJdLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgbGV0IGkwID0gcGFyc2VJbnQodnRkWzBdKSwgaTEgPSBwYXJzZUludCh2dGRbMV0pLCBpMiA9IHBhcnNlSW50KHZ0ZFsyXSk7XHJcblxyXG4gICAgICAgICAgICB0cGwudnR4LnB1c2gobmV3IFZlcnRleChcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTApID8gbmV3IG10aC5WZWMzKDAsIDAsIDApIDogcG9zaXRpb25zW2kwIC0gMV0sXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkxKSA/IG5ldyBtdGguVmVjMigwLCAwKSA6IHRleENvb3Jkc1tpMSAtIDFdLFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMikgPyBuZXcgbXRoLlZlYzMoMCwgMCwgMCkgOiBub3JtYWxzW2kyIC0gMV1cclxuICAgICAgICAgICAgKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGxldCB2dGQgPSBzZWdtZW50c1szXS5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgIGxldCBpMCA9IHBhcnNlSW50KHZ0ZFswXSksIGkxID0gcGFyc2VJbnQodnRkWzFdKSwgaTIgPSBwYXJzZUludCh2dGRbMl0pO1xyXG5cclxuICAgICAgICAgICAgdHBsLnZ0eC5wdXNoKG5ldyBWZXJ0ZXgoXHJcbiAgICAgICAgICAgICAgTnVtYmVyLmlzTmFOKGkwKSA/IG5ldyBtdGguVmVjMygwLCAwLCAwKSA6IHBvc2l0aW9uc1tpMCAtIDFdLFxyXG4gICAgICAgICAgICAgIE51bWJlci5pc05hTihpMSkgPyBuZXcgbXRoLlZlYzIoMCwgMCkgOiB0ZXhDb29yZHNbaTEgLSAxXSxcclxuICAgICAgICAgICAgICBOdW1iZXIuaXNOYU4oaTIpID8gbmV3IG10aC5WZWMzKDAsIDAsIDApIDogbm9ybWFsc1tpMiAtIDFdXHJcbiAgICAgICAgICAgICkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxuICB9IC8qIG1vZGVsX29iaiAqL1xyXG5cclxuICBnZXRWZXJ0aWNlc0FzRmxvYXRBcnJheSgpIHtcclxuICAgIGxldCByZXNfYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMudnR4Lmxlbmd0aCAqIDgpO1xyXG4gICAgbGV0IGkgPSAwO1xyXG4gICAgbGV0IG1pID0gdGhpcy52dHgubGVuZ3RoICogODtcclxuXHJcbiAgICB3aGlsZShpIDwgbWkpIHtcclxuICAgICAgbGV0IHZ0ID0gdGhpcy52dHhbaSA+PiAzXTtcclxuICBcclxuICAgICAgcmVzX2FycmF5W2krK10gPSB2dC5wLng7XHJcbiAgICAgIHJlc19hcnJheVtpKytdID0gdnQucC55O1xyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0LnAuejtcclxuXHJcbiAgICAgIHJlc19hcnJheVtpKytdID0gdnQudC54O1xyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0LnQueTtcclxuXHJcbiAgICAgIHJlc19hcnJheVtpKytdID0gdnQubi54O1xyXG4gICAgICByZXNfYXJyYXlbaSsrXSA9IHZ0Lm4ueTtcclxuICAgICAgcmVzX2FycmF5W2krK10gPSB2dC5uLno7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc19hcnJheTtcclxuICB9IC8qIGdldFZlcnRpY2VzQXNGbG9hdEFycmF5ICovXHJcblxyXG4gIGdldEluZGljZXNBc1VpbnRBcnJheSgpIHtcclxuICAgIHJldHVybiBuZXcgVWludDMyQXJyYXkodGhpcy5pZHgpO1xyXG4gIH0gLyogZ2V0SW5kaWNlc0FzVWludEFycmF5ICovXHJcbn0gLyogVG9wb2xvZ3kgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBFbXB0eVByaW1pdGl2ZSB7XHJcbiAgZ2w7XHJcbiAgbWF0ZXJpYWw7XHJcbiAgZ2VvbWV0cnlUeXBlID0gVG9wb2xvZ3kuVFJJQU5HTEVTO1xyXG4gIHZlcnRleENvdW50ID0gNDtcclxuXHJcbiAgY29uc3RydWN0b3IoZ2xDb250ZXh0LCB2ZXJ0ZXhDb3VudCA9IDQsIGdlb21ldHJ5VHlwZSA9IFRvcG9sb2d5LlRSSUFOR0xFUywgbWF0ZXJpYWwgPSBudWxsKSB7XHJcbiAgICB0aGlzLmdsID0gZ2xDb250ZXh0O1xyXG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xyXG4gICAgdGhpcy5nZW9tZXRyeVR5cGUgPSBnZW9tZXRyeVR5cGU7XHJcbiAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBkcmF3KGNhbWVyYUJ1ZmZlciA9IG51bGwpIHtcclxuICAgIHRoaXMubWF0ZXJpYWwuYXBwbHkoKTtcclxuICAgIGlmIChjYW1lcmFCdWZmZXIgIT0gbnVsbCkge1xyXG4gICAgICBjYW1lcmFCdWZmZXIuYmluZCh0aGlzLm1hdGVyaWFsLnNoYWRlciwgMSwgXCJjYW1lcmFCdWZmZXJcIik7XHJcbiAgICB9XHJcbiAgICB0aGlzLmdsLmRyYXdBcnJheXMoVG9wb2xvZ3kuZ2VvbWV0cnlUeXBlVG9HTCh0aGlzLmdlb21ldHJ5VHlwZSksIDAsIHRoaXMudmVydGV4Q291bnQpO1xyXG4gIH0gLyogZHJhdyAqL1xyXG5cclxuICBzdGF0aWMgZHJhd0Zyb21QYXJhbXMoZ2wsIHZlcnRleENvdW50LCBnZW9tZXRyeVR5cGUsIG1hdGVyaWFsLCBjYW1lcmFCdWZmZXIgPSBudWxsKSB7XHJcbiAgICBtYXRlcmlhbC5hcHBseSgpO1xyXG5cclxuICAgIGlmIChjYW1lcmFCdWZmZXIgIT0gbnVsbCkge1xyXG4gICAgICBjYW1lcmFCdWZmZXIuYmluZChtYXRlcmlhbC5zaGFkZXIsIDEsIFwiY2FtZXJhQnVmZmVyXCIpO1xyXG4gICAgfVxyXG4gICAgZ2wuZHJhd0FycmF5cyhUb3BvbG9neS5nZW9tZXRyeVR5cGVUb0dMKGdlb21ldHJ5VHlwZSksIDAsIHZlcnRleENvdW50KTtcclxuICB9IC8qIGRyYXdGcm9tUGFyYW1zICovXHJcbn0gLyogRW1wdHlQcmltaXRpdmUgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBQcmltaXRpdmUge1xyXG4gIGdsO1xyXG4gIHZlcnRleEFycmF5T2JqZWN0ID0gbnVsbDtcclxuICBpbmRleEJ1ZmZlciA9IG51bGw7XHJcbiAgdmVydGV4QnVmZmVyID0gbnVsbDtcclxuICB2ZXJ0ZXhOdW1iZXIgPSAwO1xyXG4gIGluZGV4TnVtYmVyID0gMDtcclxuICBnZW9tZXRyeVR5cGUgPSBUb3BvbG9neS5UUklBTkdMRVM7XHJcbiAgbWF0ZXJpYWwgPSBudWxsO1xyXG5cclxuICBjb25zdHJ1Y3RvcihnbENvbnRleHQpIHtcclxuICAgIHRoaXMuZ2wgPSBnbENvbnRleHQ7XHJcbiAgfSAvKiBjb25zdHJ1Y3RvciAqL1xyXG5cclxuICBkcmF3KGNhbWVyYUJ1ZmZlciA9IG51bGwpIHtcclxuICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgdGhpcy5tYXRlcmlhbC5hcHBseSgpO1xyXG5cclxuICAgIGlmIChjYW1lcmFCdWZmZXIgIT0gbnVsbCkge1xyXG4gICAgICBjYW1lcmFCdWZmZXIuYmluZCh0aGlzLm1hdGVyaWFsLnNoYWRlciwgMSwgXCJjYW1lcmFCdWZmZXJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2wuYmluZFZlcnRleEFycmF5KHRoaXMudmVydGV4QXJyYXlPYmplY3QpO1xyXG4gICAgaWYgKHRoaXMuaW5kZXhCdWZmZXIgIT0gbnVsbCkge1xyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyKTtcclxuICAgICAgZ2wuZHJhd0VsZW1lbnRzKFRvcG9sb2d5Lmdlb21ldHJ5VHlwZVRvR0wodGhpcy5nZW9tZXRyeVR5cGUpLCB0aGlzLmluZGV4TnVtYmVyLCBnbC5VTlNJR05FRF9JTlQsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZ2wuZHJhd0FycmF5cyhUb3BvbG9neS5nZW9tZXRyeVR5cGVUb0dMKHRoaXMuZ2VvbWV0cnlUeXBlKSwgMCwgdGhpcy52ZXJ0ZXhOdW1iZXIpO1xyXG4gICAgfVxyXG4gIH0gLyogZHJhdyAqL1xyXG5cclxuICBjbG9uZVdpdGhOZXdNYXRlcmlhbChtYXRlcmlhbCA9IG51bGwpIHtcclxuICAgIGlmIChtYXRlcmlhbCA9PT0gbnVsbCkge1xyXG4gICAgICBtYXRlcmlhbCA9IHRoaXMubWF0ZXJpYWw7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuICAgIGxldCBwcmltID0gbmV3IFByaW1pdGl2ZShnbCk7XHJcblxyXG4gICAgcHJpbS5tYXRlcmlhbCA9IG1hdGVyaWFsO1xyXG5cclxuICAgIHByaW0udmVydGV4QnVmZmVyID0gdGhpcy52ZXJ0ZXhCdWZmZXI7XHJcbiAgICBwcmltLnZlcnRleENvdW50ID0gdGhpcy52ZXJ0ZXhDb3VudDtcclxuXHJcbiAgICBwcmltLnZlcnRleEFycmF5T2JqZWN0ID0gZ2wuY3JlYXRlVmVydGV4QXJyYXkoKTtcclxuICAgIGdsLmJpbmRWZXJ0ZXhBcnJheShwcmltLnZlcnRleEFycmF5T2JqZWN0KTtcclxuXHJcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgcHJpbS52ZXJ0ZXhCdWZmZXIpO1xyXG5cclxuICAgIC8vIE1hcCB2ZXJ0ZXggbGF5b3V0XHJcbiAgICBsZXQgcG9zaXRpb25Mb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByaW0ubWF0ZXJpYWwuc2hhZGVyLCBcImluUG9zaXRpb25cIik7XHJcbiAgICBpZiAocG9zaXRpb25Mb2NhdGlvbiAhPSAtMSkge1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHBvc2l0aW9uTG9jYXRpb24sIDMsIGdsLkZMT0FULCBmYWxzZSwgOCAqIDQsIDApO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShwb3NpdGlvbkxvY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgdGV4Q29vcmRMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByaW0ubWF0ZXJpYWwuc2hhZGVyLCBcImluVGV4Q29vcmRcIik7XHJcbiAgICBpZiAodGV4Q29vcmRMb2NhdGlvbiAhPSAtMSkge1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRleENvb3JkTG9jYXRpb24sIDMsIGdsLkZMT0FULCBmYWxzZSwgOCAqIDQsIDMgKiA0KTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGV4Q29vcmRMb2NhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG5vcm1hbExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJpbS5tYXRlcmlhbC5zaGFkZXIsIFwiaW5Ob3JtYWxcIik7XHJcbiAgICBpZiAobm9ybWFsTG9jYXRpb24gIT0gLTEpIHtcclxuICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihub3JtYWxMb2NhdGlvbiwgMywgZ2wuRkxPQVQsIGZhbHNlLCA4ICogNCwgNSAqIDQpO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShub3JtYWxMb2NhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpbS5pbmRleEJ1ZmZlciA9IHRoaXMuaW5kZXhCdWZmZXI7XHJcbiAgICBwcmltLmluZGV4Q291bnQgPSB0aGlzLmluZGV4Q291bnQ7XHJcbiAgfSAvKiBjbG9uZVdpdGhOZXdNYXRlcmlhbCAqL1xyXG5cclxuICBzdGF0aWMgYXN5bmMgZnJvbVRvcG9sb2d5KGdsLCB0cGwsIG1hdGVyaWFsKSB7XHJcbiAgICBsZXQgcHJpbSA9IG5ldyBQcmltaXRpdmUoZ2wpO1xyXG4gICAgcHJpbS5tYXRlcmlhbCA9IG1hdGVyaWFsO1xyXG5cclxuICAgIHByaW0uZ2VvbWV0cnlUeXBlID0gdHBsLnR5cGU7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHZlcnRleCBhcnJheVxyXG4gICAgcHJpbS52ZXJ0ZXhBcnJheU9iamVjdCA9IGdsLmNyZWF0ZVZlcnRleEFycmF5KCk7XHJcbiAgICBnbC5iaW5kVmVydGV4QXJyYXkocHJpbS52ZXJ0ZXhBcnJheU9iamVjdCk7XHJcblxyXG4gICAgLy8gV3JpdGUgdmVydGV4IGJ1ZmZlclxyXG4gICAgcHJpbS52ZXJ0ZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBwcmltLnZlcnRleEJ1ZmZlcik7XHJcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdHBsLmdldFZlcnRpY2VzQXNGbG9hdEFycmF5KCksIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgIHByaW0udmVydGV4TnVtYmVyID0gdHBsLnZ0eC5sZW5ndGg7XHJcblxyXG4gICAgLy8gTWFwIHZlcnRleCBsYXlvdXRcclxuICAgIGxldCBwb3NpdGlvbkxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJpbS5tYXRlcmlhbC5zaGFkZXIsIFwiaW5Qb3NpdGlvblwiKTtcclxuICAgIGlmIChwb3NpdGlvbkxvY2F0aW9uICE9IC0xKSB7XHJcbiAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocG9zaXRpb25Mb2NhdGlvbiwgMywgZ2wuRkxPQVQsIGZhbHNlLCA4ICogNCwgMCk7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHBvc2l0aW9uTG9jYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCB0ZXhDb29yZExvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJpbS5tYXRlcmlhbC5zaGFkZXIsIFwiaW5UZXhDb29yZFwiKTtcclxuICAgIGlmICh0ZXhDb29yZExvY2F0aW9uICE9IC0xKSB7XHJcbiAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGV4Q29vcmRMb2NhdGlvbiwgMywgZ2wuRkxPQVQsIGZhbHNlLCA4ICogNCwgMyAqIDQpO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0ZXhDb29yZExvY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgbm9ybWFsTG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcmltLm1hdGVyaWFsLnNoYWRlciwgXCJpbk5vcm1hbFwiKTtcclxuICAgIGlmIChub3JtYWxMb2NhdGlvbiAhPSAtMSkge1xyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKG5vcm1hbExvY2F0aW9uLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDggKiA0LCA1ICogNCk7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KG5vcm1hbExvY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgaW5kZXggYnVmZmVyXHJcbiAgICBpZiAodHBsLmlkeCA9PSBudWxsKSB7XHJcbiAgICAgIHByaW0uaW5kZXhCdWZmZXIgPSBudWxsO1xyXG4gICAgICBwcmltLmluZGV4TnVtYmVyID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHByaW0uaW5kZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgcHJpbS5pbmRleEJ1ZmZlcik7XHJcbiAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRwbC5nZXRJbmRpY2VzQXNVaW50QXJyYXkoKSwgZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgICBwcmltLmluZGV4TnVtYmVyID0gdHBsLmlkeC5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHByaW07XHJcbiAgfSAvKiBmcm9tQXJyYXkgKi9cclxufTsgLyogUHJpbWl0aXZlICovXHJcbiIsImltcG9ydCAqIGFzIG10aCBmcm9tIFwiLi9tdGguanNcIjtcclxuaW1wb3J0IHtUZXh0dXJlfSBmcm9tIFwiLi90ZXh0dXJlLmpzXCI7XHJcblxyXG5mdW5jdGlvbiBkZWNvZGVGcmFtZWJ1ZmZlclN0YXR1cyhzdGF0dXMpIHtcclxuICBzd2l0Y2ggKHN0YXR1cykge1xyXG4gICAgY2FzZSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkZSQU1FQlVGRkVSX0NPTVBMRVRFOiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJjb21wbGV0ZVwiO1xyXG4gICAgY2FzZSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVDogICAgICAgICByZXR1cm4gXCJpbmNvbXBsZXRlIGF0dGFjaG1lbnRcIjtcclxuICAgIGNhc2UgV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlM6ICAgICAgICAgcmV0dXJuIFwiaGVpZ2h0IGFuZCB3aWR0aCBvZiBhdHRhY2htZW50IGFyZW4ndCBzYW1lXCI7XHJcbiAgICBjYXNlIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlQ6IHJldHVybiBcImF0dGFjaG1lbnQgbWlzc2luZ1wiO1xyXG4gICAgY2FzZSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkZSQU1FQlVGRkVSX1VOU1VQUE9SVEVEOiAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJhdHRhY2htZW50IGZvcm1hdCBpc24ndCBzdXBwb3J0ZWRcIjtcclxuICB9XHJcbn0gLyogZGVjb2RlRnJhbWVidWZmZXJTdGF0dXMgKi9cclxuXHJcbmxldCBjdXJyZW50VGFyZ2V0ID0gbnVsbDtcclxubGV0IGZldGNoZXJUYXJnZXQgPSBudWxsO1xyXG5cclxuZXhwb3J0IGNsYXNzIFRhcmdldCB7XHJcbiAgI2dsO1xyXG4gIEZCTztcclxuICBhdHRhY2htZW50cyA9IFtdO1xyXG4gIHNpemU7XHJcbiAgZGVwdGg7XHJcbiAgZHJhd0J1ZmZlcnM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGdsLCBhdHRhY2htZW50Q291bnQpIHtcclxuICAgIHRoaXMuc2l6ZSA9IG5ldyBtdGguU2l6ZSg4MDAsIDYwMCk7XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICB0aGlzLkZCTyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XHJcblxyXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLkZCTyk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHRhcmdldCB0ZXh0dXJlc1xyXG4gICAgdGhpcy5kcmF3QnVmZmVycyA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRhY2htZW50Q291bnQ7IGkrKykge1xyXG4gICAgICB0aGlzLmF0dGFjaG1lbnRzW2ldID0gbmV3IFRleHR1cmUoZ2wsIFRleHR1cmUuSEFMRl9GTE9BVCwgNCk7XHJcbiAgICAgIHRoaXMuZHJhd0J1ZmZlcnMucHVzaChnbC5DT0xPUl9BVFRBQ0hNRU5UMCArIGkpO1xyXG4gICAgfVxyXG4gICAgZ2wuZHJhd0J1ZmZlcnModGhpcy5kcmF3QnVmZmVycyk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRhY2htZW50Q291bnQ7IGkrKykge1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmF0dGFjaG1lbnRzW2ldLmlkKTtcclxuICAgICAgdGhpcy5hdHRhY2htZW50c1tpXS5yZXNpemUodGhpcy5zaXplKTtcclxuICBcclxuICAgICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwICsgaSwgZ2wuVEVYVFVSRV8yRCwgdGhpcy5hdHRhY2htZW50c1tpXS5pZCwgMCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRlcHRoID0gbmV3IFRleHR1cmUoZ2wsIFRleHR1cmUuREVQVEgpO1xyXG4gICAgdGhpcy5kZXB0aC5yZXNpemUodGhpcy5zaXplKTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuZGVwdGguaWQpO1xyXG4gICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkRFUFRIX0FUVEFDSE1FTlQsIGdsLlRFWFRVUkVfMkQsIHRoaXMuZGVwdGguaWQsIDApO1xyXG5cclxuICAgIC8vIGNvbnNvbGUubG9nKGBGcmFtZWJ1ZmZlciBzdGF0dXM6ICR7ZGVjb2RlRnJhbWVidWZmZXJTdGF0dXMoZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUikpfWApO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgZ2V0QXR0YWNobWVudFZhbHVlKGF0dCwgeCwgeSkge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICBpZiAoZmV0Y2hlclRhcmdldCA9PSBudWxsKSB7XHJcbiAgICAgIGZldGNoZXJUYXJnZXQgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgfVxyXG4gICAgbGV0IGRzdCA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XHJcblxyXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBmZXRjaGVyVGFyZ2V0KTtcclxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy5hdHRhY2htZW50c1thdHRdLmlkLCAwKTtcclxuICAgIGlmIChnbC5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKGdsLkZSQU1FQlVGRkVSKSA9PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xyXG4gICAgICBnbC5yZWFkUGl4ZWxzKHgsIHRoaXMuYXR0YWNobWVudHNbYXR0XS5zaXplLmggLSB5LCAxLCAxLCBnbC5SR0JBLCBnbC5GTE9BVCwgZHN0KTtcclxuICAgIH1cclxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgY3VycmVudFRhcmdldCk7XHJcblxyXG4gICAgcmV0dXJuIGRzdDtcclxuICB9IC8qIGdldEF0dGFjaG1lbnRQaXhlbCAqL1xyXG5cclxuICByZXNpemUoc2l6ZSkge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICB0aGlzLnNpemUgPSBzaXplLmNvcHkoKTtcclxuICAgIHRoaXMuRkJPID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcclxuXHJcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuRkJPKTtcclxuXHJcbiAgICAvLyBjcmVhdGUgdGFyZ2V0IHRleHR1cmVzXHJcbiAgICBsZXQgZHJhd0J1ZmZlcnMgPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hdHRhY2htZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB0aGlzLmF0dGFjaG1lbnRzW2ldID0gbmV3IFRleHR1cmUoZ2wsIFRleHR1cmUuSEFMRl9GTE9BVCwgNCk7XHJcbiAgICAgIGRyYXdCdWZmZXJzLnB1c2goZ2wuQ09MT1JfQVRUQUNITUVOVDAgKyBpKTtcclxuICAgIH1cclxuICAgIGdsLmRyYXdCdWZmZXJzKGRyYXdCdWZmZXJzKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXR0YWNobWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5hdHRhY2htZW50c1tpXS5pZCk7XHJcbiAgICAgIHRoaXMuYXR0YWNobWVudHNbaV0ucmVzaXplKHRoaXMuc2l6ZSk7XHJcbiAgXHJcbiAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCArIGksIGdsLlRFWFRVUkVfMkQsIHRoaXMuYXR0YWNobWVudHNbaV0uaWQsIDApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kZXB0aCA9IG5ldyBUZXh0dXJlKGdsLCBUZXh0dXJlLkRFUFRIKTtcclxuICAgIHRoaXMuZGVwdGgucmVzaXplKHRoaXMuc2l6ZSk7XHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmRlcHRoLmlkKTtcclxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5URVhUVVJFXzJELCB0aGlzLmRlcHRoLmlkLCAwKTtcclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyhgRnJhbWVidWZmZXIgc3RhdHVzOiAke2RlY29kZUZyYW1lYnVmZmVyU3RhdHVzKGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpKX1gKTtcclxuICB9IC8qIHJlc2l6ZSAqL1xyXG5cclxuICBiaW5kKCkge1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICBjdXJyZW50VGFyZ2V0ID0gdGhpcy5GQk87XHJcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuRkJPKTtcclxuICAgIGdsLmRyYXdCdWZmZXJzKHRoaXMuZHJhd0J1ZmZlcnMpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hdHRhY2htZW50cy5sZW5ndGg7IGkrKylcclxuICAgIGdsLmNsZWFyQnVmZmVyZnYoZ2wuQ09MT1IsIGksIFswLjAwLCAwLjAwLCAwLjAwLCAwLjAwXSk7XHJcbiAgICBnbC5jbGVhckJ1ZmZlcmZ2KGdsLkRFUFRILCAwLCBbMV0pO1xyXG4gICAgZ2wudmlld3BvcnQoMCwgMCwgdGhpcy5zaXplLncsIHRoaXMuc2l6ZS5oKTtcclxuICB9IC8qIGJpbmQgKi9cclxuXHJcbiAgc3RhdGljIGRlZmF1bHRGcmFtZWJ1ZmZlciA9IHtcclxuICAgIHNpemU6IG5ldyBtdGguU2l6ZSg4MDAsIDYwMCksXHJcbiAgICBnbDogbnVsbCxcclxuXHJcbiAgICByZXNpemUoc2l6ZSkge1xyXG4gICAgICBUYXJnZXQuZGVmYXVsdEZyYW1lYnVmZmVyLnNpemUgPSBzaXplLmNvcHkoKTtcclxuICAgIH0sIC8qIHJlc2l6ZSAqL1xyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgIGxldCBnbCA9IFRhcmdldC5kZWZhdWx0RnJhbWVidWZmZXIuZ2w7XHJcblxyXG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG4gICAgICBnbC52aWV3cG9ydCgwLCAwLCBUYXJnZXQuZGVmYXVsdEZyYW1lYnVmZmVyLnNpemUudywgVGFyZ2V0LmRlZmF1bHRGcmFtZWJ1ZmZlci5zaXplLmgpO1xyXG4gICAgICBnbC5jbGVhcihXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkNPTE9SX0JVRkZFUl9CSVQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkRFUFRIX0JVRkZFUl9CSVQpO1xyXG4gICAgICBnbC5jbGVhckNvbG9yKDAuMzAsIDAuNDcsIDAuODAsIDEuMDApO1xyXG5cclxuICAgICAgY3VycmVudFRhcmdldCA9IG51bGw7XHJcbiAgICB9XHJcbiAgfTsgLyogZGVmYXVsdEZyYW1lYnVmZmVyICovXHJcblxyXG4gIGVuYWJsZURyYXdCdWZmZXIoYnVmZmVyKSB7XHJcbiAgICB0aGlzLmRyYXdCdWZmZXJzW2J1ZmZlcl0gPSBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkNPTE9SX0FUVEFDSE1FTlQwICsgYnVmZmVyO1xyXG5cclxuICAgIGlmIChjdXJyZW50VGFyZ2V0ID09PSB0aGlzLkZCTykge1xyXG4gICAgICB0aGlzLmdsLmRyYXdCdWZmZXJzKHRoaXMuZHJhd0J1ZmZlcnMpO1xyXG4gICAgfVxyXG4gIH0gLyogZW5hYmxlRHJhd0J1ZmZlciAqL1xyXG5cclxuICBkaXNhYmxlRHJhd0J1ZmZlcihidWZmZXIpIHtcclxuICAgIHRoaXMuZHJhd0J1ZmZlcnNbYnVmZmVyXSA9IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuTk9ORTtcclxuXHJcbiAgICBpZiAoY3VycmVudFRhcmdldCA9PT0gdGhpcy5GQk8pIHtcclxuICAgICAgdGhpcy5nbC5kcmF3QnVmZmVycyh0aGlzLmRyYXdCdWZmZXJzKTtcclxuICAgIH1cclxuICB9IC8qIGRpc2FibGVEcmF3QnVmZmVyICovXHJcblxyXG4gIHN0YXRpYyBkZWZhdWx0KGdsKSB7XHJcbiAgICBUYXJnZXQuZGVmYXVsdEZyYW1lYnVmZmVyLmdsID0gZ2w7XHJcbiAgICByZXR1cm4gVGFyZ2V0LmRlZmF1bHRGcmFtZWJ1ZmZlcjtcclxuICB9IC8qIGRlZmF1bHQgKi9cclxufSAvKiBUYXJnZXQgKi9cclxuXHJcbi8qIHRhcmdldC5qcyAqLyIsImZ1bmN0aW9uIGdldFRpbWUoKSB7XHJcbiAgcmV0dXJuIERhdGUubm93KCkgLyAxMDAwLjA7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUaW1lciB7XHJcbiAgZnBzUHJldlVwZGF0ZVRpbWUgPSAwLjAwO1xyXG4gIHN0YXJ0VGltZTtcclxuICBmcHNDb3VudGVyID0gMC4wMDtcclxuICBwYXVzZUNvbGxlY3RvciA9IDAuMDA7XHJcbiAgaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgZnBzRGVsdGFUaW1lID0gMy4wMDtcclxuICBmcHMgPSB1bmRlZmluZWQ7XHJcblxyXG4gIHRpbWUgPSAwLjAwO1xyXG4gIGdsb2JhbFRpbWU7XHJcbiAgXHJcbiAgZGVsdGFUaW1lID0gMC4wMDtcclxuICBnbG9iYWxEZWx0YVRpbWUgPSAwLjAwO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuc3RhcnRUaW1lID0gZ2V0VGltZSgpO1xyXG5cclxuICAgIHRoaXMuZ2xvYmFsVGltZSA9IHRoaXMuc3RhcnRUaW1lO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgcmVzcG9uc2UoKSB7XHJcbiAgICBsZXQgbmV3R2xvYmFsVGltZSA9IGdldFRpbWUoKTtcclxuXHJcbiAgICB0aGlzLmdsb2JhbERlbHRhVGltZSA9IG5ld0dsb2JhbFRpbWUgLSB0aGlzLmdsb2JhbFRpbWU7XHJcbiAgICB0aGlzLmdsb2JhbFRpbWUgPSBuZXdHbG9iYWxUaW1lO1xyXG5cclxuICAgIGlmICh0aGlzLmlzUGF1c2VkKSB7XHJcbiAgICAgIHRoaXMuZGVsdGFUaW1lID0gMC4wMDtcclxuICAgICAgdGhpcy5wYXVzZUNvbGxlY3RvciArPSB0aGlzLmdsb2JhbERlbHRhVGltZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMudGltZSA9IHRoaXMuZ2xvYmFsVGltZSAtIHRoaXMuc3RhcnRUaW1lIC0gdGhpcy5wYXVzZUNvbGxlY3RvcjtcclxuICAgICAgdGhpcy5kZWx0YVRpbWUgPSB0aGlzLmdsb2JhbERlbHRhVGltZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmZwc0NvdW50ZXIrKztcclxuICAgIGlmICh0aGlzLmdsb2JhbFRpbWUgLSB0aGlzLmZwc1ByZXZVcGRhdGVUaW1lID49IHRoaXMuZnBzRGVsdGFUaW1lKSB7XHJcbiAgICAgIHRoaXMuZnBzID0gdGhpcy5mcHNDb3VudGVyIC8gKHRoaXMuZ2xvYmFsVGltZSAtIHRoaXMuZnBzUHJldlVwZGF0ZVRpbWUpO1xyXG5cclxuICAgICAgdGhpcy5mcHNQcmV2VXBkYXRlVGltZSA9IHRoaXMuZ2xvYmFsVGltZTtcclxuICAgICAgdGhpcy5mcHNDb3VudGVyID0gMDtcclxuICAgIH1cclxuICB9IC8qIHJlc3BvbnNlICovXHJcbn0gLyogVGltZXIgKi9cclxuXHJcbi8qIHRpbWVyLmpzICovIiwiaW1wb3J0IHtsb2FkU2hhZGVyLCBNYXRlcmlhbCwgUHJpbWl0aXZlLCBFbXB0eVByaW1pdGl2ZSwgVG9wb2xvZ3ksIFZlcnRleCwgVGV4dHVyZSwgQ3ViZW1hcCwgVUJPLCBtdGh9IGZyb20gXCIuL3ByaW1pdGl2ZS5qc1wiO1xyXG5pbXBvcnQge1RhcmdldH0gZnJvbSBcIi4vdGFyZ2V0LmpzXCI7XHJcbmltcG9ydCB7VGltZXJ9IGZyb20gXCIuL3RpbWVyLmpzXCI7XHJcblxyXG5leHBvcnQge01hdGVyaWFsLCBQcmltaXRpdmUsIEVtcHR5UHJpbWl0aXZlLCBUb3BvbG9neSwgVmVydGV4LCBUZXh0dXJlLCBDdWJlbWFwLCBVQk8sIG10aH07XHJcblxyXG5jb25zdCBtYXQ0SWRlbnRpdHkgPSBtdGguTWF0NC5pZGVudGl0eSgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIFN5c3RlbSB7XHJcbiAgcmVuZGVyUXVldWU7XHJcbiAgbWFya2VyUmVuZGVyUXVldWU7XHJcbiAgZ2w7XHJcbiAgY2FtZXJhO1xyXG4gIGNhbWVyYVVCTztcclxuXHJcbiAgdGFyZ2V0O1xyXG4gIGZzTWF0ZXJpYWwgPSBudWxsO1xyXG5cclxuICB1bml0czsgIC8vIHVuaXQgbGlzdFxyXG4gIHRpbWVyOyAgLy8gdGltZXJcclxuICBsYXN0VW5pdElEID0gMDtcclxuXHJcbiAgY3VycmVudE9iamVjdElEID0gMDtcclxuICByZW5kZXJQYXJhbXMgPSB7fTtcclxuXHJcbiAgYWRkUmVuZGVyUGFyYW1ldGVyKEdMZW51bSwgcGFyYW1OYW1lLCBpbml0aWFsVmFsdWUgPSB0cnVlKSB7XHJcbiAgICBsZXQgdmFsdWUgPSAhaW5pdGlhbFZhbHVlO1xyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5yZW5kZXJQYXJhbXMsIHBhcmFtTmFtZSwge1xyXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICBnZXQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICB9LCAvKiBnZXQgKi9cclxuXHJcbiAgICAgIHNldChuZXdWYWx1ZSkge1xyXG4gICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdmFsdWUpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgZ2wuZW5hYmxlKEdMZW51bSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGdsLmRpc2FibGUoR0xlbnVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgfSAvKiBzZXQgKi9cclxuICAgIH0pOyAvKiBwcm9wZXJ0eSBkZWZpbml0aW9uICovXHJcbiAgICB0aGlzLnJlbmRlclBhcmFtc1twYXJhbU5hbWVdID0gaW5pdGlhbFZhbHVlO1xyXG4gIH0gLyogYWRkUmVuZGVyUGFyYW1ldGVyICovXHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgLy8gV2ViR0wgaW5pdGlhbGl6YXRpb25cclxuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG5cclxuICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2wyXCIpO1xyXG4gICAgaWYgKGdsID09IG51bGwpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoXCJDYW4ndCBpbml0aWFsaXplIFdlYkdMMlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgZXh0ZW5zaW9ucyA9IFtcIkVYVF9jb2xvcl9idWZmZXJfZmxvYXRcIl07XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4dGVuc2lvbnMubGVuZ3RoOyBpKyspXHJcbiAgICAgIGlmIChnbC5nZXRFeHRlbnNpb24oZXh0ZW5zaW9uc1tpXSkgPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBFcnJvcihgXCIke2V4dGVuc2lvbnNbaV19XCIgZXh0ZW5zaW9uIHJlcXVpcmVkYCk7XHJcblxyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG5cclxuICAgIHRoaXMuYWRkUmVuZGVyUGFyYW1ldGVyKFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuREVQVEhfVEVTVCwgXCJkZXB0aFRlc3RcIiwgdHJ1ZSk7XHJcbiAgICB0aGlzLmFkZFJlbmRlclBhcmFtZXRlcihXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkNVTExfRkFDRSwgXCJjdWxsRmFjZVwiLCBmYWxzZSk7XHJcblxyXG4gICAgZ2wuZGVwdGhGdW5jKFdlYkdMMlJlbmRlcmluZ0NvbnRleHQuTEVRVUFMKTtcclxuICAgIC8vIGdsLmVuYWJsZShXZWJHTDJSZW5kZXJpbmdDb250ZXh0LkNVTExfRkFDRSk7XHJcblxyXG4gICAgLy8gZ2wuY3VsbEZhY2UoV2ViR0wyUmVuZGVyaW5nQ29udGV4dC5CQUNLKTtcclxuXHJcbiAgICB0aGlzLnJlbmRlclF1ZXVlID0gW107XHJcbiAgICB0aGlzLm1hcmtlclJlbmRlclF1ZXVlID0gW107XHJcbiAgICB0aGlzLmNhbWVyYSA9IG5ldyBtdGguQ2FtZXJhKCk7XHJcblxyXG4gICAgdGhpcy5jYW1lcmFVQk8gPSBuZXcgVUJPKHRoaXMuZ2wpO1xyXG5cclxuICAgIHRoaXMuY2FtZXJhLnJlc2l6ZShuZXcgbXRoLlNpemUoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSk7XHJcblxyXG4gICAgLy8gdGFyZ2V0cyBzZXR1cFxyXG4gICAgbGV0IHNpemUgPSBuZXcgbXRoLlNpemUoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuICAgIHRoaXMudGFyZ2V0ID0gbmV3IFRhcmdldChnbCwgMik7XHJcblxyXG4gICAgdGhpcy50YXJnZXQucmVzaXplKHNpemUpO1xyXG4gICAgVGFyZ2V0LmRlZmF1bHQoZ2wpLnJlc2l6ZShzaXplKTtcclxuXHJcbiAgICAvLyByZXNpemUgaGFuZGxpbmdcclxuICAgIHdpbmRvdy5vbnJlc2l6ZSA9ICgpID0+IHtcclxuICAgICAgbGV0IHJlc29sdXRpb24gPSBuZXcgbXRoLlNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XHJcblxyXG4gICAgICBjYW52YXMud2lkdGggPSByZXNvbHV0aW9uLnc7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSByZXNvbHV0aW9uLmg7XHJcblxyXG4gICAgICB0aGlzLmNhbWVyYS5yZXNpemUocmVzb2x1dGlvbik7XHJcbiAgICAgIHRoaXMudGFyZ2V0LnJlc2l6ZShyZXNvbHV0aW9uKTtcclxuICAgICAgVGFyZ2V0LmRlZmF1bHQoZ2wpLnJlc2l6ZShyZXNvbHV0aW9uKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51bml0cyA9IHt9O1xyXG4gICAgdGhpcy50aW1lciA9IG5ldyBUaW1lcigpO1xyXG4gIH0gLyogY29uc3RydWN0b3IgKi9cclxuXHJcbiAgc3RhdGljIGlkZW50aXR5ID0gbXRoLk1hdDQuaWRlbnRpdHkoKTtcclxuXHJcbiAgZHJhd1ByaW1pdGl2ZShwcmltaXRpdmUsIHRyYW5zZm9ybSA9IG1hdDRJZGVudGl0eSkge1xyXG4gICAgdGhpcy5yZW5kZXJRdWV1ZS5wdXNoKHtcclxuICAgICAgcHJpbWl0aXZlOiBwcmltaXRpdmUsXHJcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtLFxyXG4gICAgICBpZDogICAgICAgIHRoaXMuY3VycmVudE9iamVjdElEXHJcbiAgICB9KTtcclxuICB9IC8qIGRyYXdQcmltaXRpdmUgKi9cclxuXHJcbiAgZHJhd01hcmtlclByaW1pdGl2ZShwcmltaXRpdmUsIHRyYW5zZm9ybSA9IG1hdDRJZGVudGl0eSkge1xyXG4gICAgdGhpcy5tYXJrZXJSZW5kZXJRdWV1ZS5wdXNoKHtcclxuICAgICAgcHJpbWl0aXZlOiBwcmltaXRpdmUsXHJcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtLFxyXG4gICAgICBpZDogICAgICAgIHRoaXMuY3VycmVudE9iamVjdElEXHJcbiAgICB9KTtcclxuICB9IC8qIGRyYXdNYXJrZXJQcmltaXRpdmUgKi9cclxuXHJcbiAgY3JlYXRlVGV4dHVyZShwYXRoID0gbnVsbCkge1xyXG4gICAgaWYgKHBhdGggPT09IG51bGwpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUZXh0dXJlKHRoaXMuZ2wsIFRleHR1cmUuVU5TSUdORURfQllURSwgNCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsZXQgdGV4ID0gbmV3IFRleHR1cmUodGhpcy5nbCwgVGV4dHVyZS5VTlNJR05FRF9CWVRFLCA0KTtcclxuICAgICAgdGV4LmxvYWQocGF0aCk7XHJcblxyXG4gICAgICByZXR1cm4gdGV4O1xyXG4gICAgfVxyXG4gIH0gLyogY3JlYXRlVGV4dHVyZSAqL1xyXG5cclxuICBnZXREZWZhdWx0VGV4dHVyZSgpIHtcclxuICAgIHJldHVybiBUZXh0dXJlLmRlZmF1bHRDaGVja2VyKHRoaXMuZ2wpO1xyXG4gIH0gLyogZ2V0RGVmYXVsdFRleHR1cmUgKi9cclxuXHJcbiAgY3JlYXRlQ3ViZW1hcCgpIHtcclxuICAgIHJldHVybiBuZXcgQ3ViZW1hcCh0aGlzLmdsKTtcclxuICB9IC8qIGNyZWF0ZUN1YmVtYXAgKi9cclxuXHJcbiAgY3JlYXRlVW5pZm9ybUJ1ZmZlcigpIHtcclxuICAgIHJldHVybiBuZXcgVUJPKHRoaXMuZ2wpO1xyXG4gIH0gLyogY3JlYXRlVW5pZm9ybUJ1ZmZlciAqL1xyXG5cclxuICBhc3luYyBjcmVhdGVTaGFkZXIocGF0aCkge1xyXG4gICAgcmV0dXJuIGxvYWRTaGFkZXIodGhpcy5nbCwgcGF0aCk7XHJcbiAgfSAvKiBjcmVhdGVTaGFkZXIgKi9cclxuXHJcbiAgYXN5bmMgY3JlYXRlTWF0ZXJpYWwoc2hhZGVyKSB7XHJcbiAgICBpZiAodHlwZW9mKHNoYWRlcikgPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICByZXR1cm4gbmV3IE1hdGVyaWFsKHRoaXMuZ2wsIGF3YWl0IGxvYWRTaGFkZXIodGhpcy5nbCwgc2hhZGVyKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbmV3IE1hdGVyaWFsKHRoaXMuZ2wsIHNoYWRlcik7XHJcbiAgICB9XHJcbiAgfSAvKiBjcmVhdGVNYXRlcmlhbCAqL1xyXG5cclxuICBjcmVhdGVQcmltaXRpdmUodG9wb2xvZ3ksIG1hdGVyaWFsKSB7XHJcbiAgICByZXR1cm4gUHJpbWl0aXZlLmZyb21Ub3BvbG9neSh0aGlzLmdsLCB0b3BvbG9neSwgbWF0ZXJpYWwpO1xyXG4gIH0gLyogY3JlYXRlUHJpbWl0aXZlICovXHJcblxyXG4gIGNyZWF0ZUVtcHR5UHJpbWl0aXZlKHZlcnRleENvdW50LCB0b3BvbG9neVR5cGUsIG1hdGVyaWFsKSB7XHJcbiAgICByZXR1cm4gbmV3IEVtcHR5UHJpbWl0aXZlKHRoaXMuZ2wsIHZlcnRleENvdW50LCB0b3BvbG9neVR5cGUsIG1hdGVyaWFsKTtcclxuICB9IC8qIGNyZWF0ZUVtcHR5UHJpbWl0aXZlICovXHJcblxyXG4gIHN0YXJ0KCkge1xyXG4gIH0gLyogc3RhcnQgKi9cclxuXHJcbiAgZW5kKCkge1xyXG4gICAgLy8gcmVuZGVyaW5nIGluIHRhcmdldFxyXG4gICAgbGV0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICB0aGlzLnRhcmdldC5iaW5kKCk7XHJcblxyXG4gICAgbGV0IGNhbWVyYUluZm8gPSBuZXcgRmxvYXQzMkFycmF5KDM2KTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcclxuICAgICAgY2FtZXJhSW5mb1tpICsgMTZdID0gdGhpcy5jYW1lcmEudmlld1Byb2oubVtpXTtcclxuICAgIH1cclxuICAgIGNhbWVyYUluZm9bMzJdID0gdGhpcy5jYW1lcmEubG9jLng7XHJcbiAgICBjYW1lcmFJbmZvWzMzXSA9IHRoaXMuY2FtZXJhLmxvYy55O1xyXG4gICAgY2FtZXJhSW5mb1szNF0gPSB0aGlzLmNhbWVyYS5sb2MuejtcclxuICAgIGNhbWVyYUluZm9bMzVdID0gMDsgLy8gSUQgb2Ygb2JqZWN0XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDAsIGNvdW50ID0gdGhpcy5yZW5kZXJRdWV1ZS5sZW5ndGg7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgIGxldCBwcmltID0gdGhpcy5yZW5kZXJRdWV1ZVtpXS5wcmltaXRpdmU7XHJcbiAgICAgIGxldCB0cmFucyA9IHRoaXMucmVuZGVyUXVldWVbaV0udHJhbnNmb3JtO1xyXG4gICAgICBcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XHJcbiAgICAgICAgY2FtZXJhSW5mb1tpXSA9IHRyYW5zLm1baV07XHJcbiAgICAgIH1cclxuICAgICAgY2FtZXJhSW5mb1szNV0gPSB0aGlzLnJlbmRlclF1ZXVlW2ldLmlkO1xyXG4gICAgICB0aGlzLmNhbWVyYVVCTy53cml0ZURhdGEoY2FtZXJhSW5mbyk7XHJcbiAgICAgIHByaW0uZHJhdyh0aGlzLmNhbWVyYVVCTyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50YXJnZXQuZGlzYWJsZURyYXdCdWZmZXIoMSk7XHJcbiAgICBmb3IgKGxldCBpID0gMCwgY291bnQgPSB0aGlzLm1hcmtlclJlbmRlclF1ZXVlLmxlbmd0aDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgbGV0IHByaW0gPSB0aGlzLm1hcmtlclJlbmRlclF1ZXVlW2ldLnByaW1pdGl2ZTtcclxuICAgICAgbGV0IHRyYW5zID0gdGhpcy5tYXJrZXJSZW5kZXJRdWV1ZVtpXS50cmFuc2Zvcm07XHJcbiAgICAgIFxyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcclxuICAgICAgICBjYW1lcmFJbmZvW2ldID0gdHJhbnMubVtpXTtcclxuICAgICAgfVxyXG4gICAgICBjYW1lcmFJbmZvWzM1XSA9IHRoaXMubWFya2VyUmVuZGVyUXVldWVbaV0uaWQ7XHJcblxyXG4gICAgICB0aGlzLmNhbWVyYVVCTy53cml0ZURhdGEoY2FtZXJhSW5mbyk7XHJcbiAgICAgIHByaW0uZHJhdyh0aGlzLmNhbWVyYVVCTyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnRhcmdldC5lbmFibGVEcmF3QnVmZmVyKDEpO1xyXG5cclxuICAgIC8vIGZsdXNoIHJlbmRlciBxdWV1ZVxyXG4gICAgdGhpcy5yZW5kZXJRdWV1ZSA9IFtdO1xyXG4gICAgdGhpcy5tYXJrZXJSZW5kZXJRdWV1ZSA9IFtdO1xyXG5cclxuICAgIC8vIHJlbmRlcmluZyB0byBzY3JlZW4gZnJhbWVidWZmZXJcclxuICAgIFRhcmdldC5kZWZhdWx0KGdsKS5iaW5kKCk7XHJcbiAgICBFbXB0eVByaW1pdGl2ZS5kcmF3RnJvbVBhcmFtcyh0aGlzLmdsLCA0LCBUb3BvbG9neS5UUklBTkdMRV9TVFJJUCwgdGhpcy5mc01hdGVyaWFsLCB0aGlzLmNhbWVyYVVCTyk7XHJcbiAgICB0aGlzLmZzTWF0ZXJpYWwudW5ib3VuZFRleHR1cmVzKCk7XHJcblxyXG4gICAgZ2wuZmluaXNoKCk7XHJcbiAgfSAvKiBlbmQgKi9cclxuXHJcbiAgLy8gZ2VuaW91cyBmdW5jdGlvbiwgYnV0IGl0IHdvcmtzIVxyXG4gIHN0YXRpYyBhc3luYyB1bnBhY2tQcm9taXNlKHYpIHtcclxuICAgIHJldHVybiB2O1xyXG4gIH0gLyogdW5wYWNrUHJvbWlzZSAqL1xyXG5cclxuICBhc3luYyBhZGRVbml0KGNyZWF0ZUZ1bmN0aW9uLCAuLi5hcmdzKSB7XHJcbiAgICBsZXQgdmFsID0gYXdhaXQgU3lzdGVtLnVucGFja1Byb21pc2UoY3JlYXRlRnVuY3Rpb24odGhpcywgLi4uYXJncykpO1xyXG5cclxuICAgIHZhbC5zeXN0ZW1JZCA9IHRoaXMubGFzdFVuaXRJRCsrO1xyXG4gICAgaWYgKHZhbC5pbml0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICBhd2FpdCBTeXN0ZW0udW5wYWNrUHJvbWlzZSh2YWwuaW5pdCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnVuaXRzW3ZhbC5zeXN0ZW1JZF0gPSB2YWw7XHJcblxyXG4gICAgcmV0dXJuIHZhbDtcclxuICB9IC8qIGFkZFVuaXQgKi9cclxuXHJcbiAgZ2V0VW5pdEJ5SUQoaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnVuaXRzW2lkXTtcclxuICB9IC8qIGdldFVuaXRCeUlEICovXHJcblxyXG4gIGdldFVuaXRCeUNvb3JkKHgsIHkpIHtcclxuICAgIGxldCBpZCA9IE1hdGgucm91bmQodGhpcy50YXJnZXQuZ2V0QXR0YWNobWVudFZhbHVlKDAsIHgsIHkpWzNdKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy51bml0c1tpZF07XHJcbiAgfSAvKiBnZXRVbml0QnlNb3VzZUxvY2F0aW9uICovXHJcblxyXG4gIGdldFBvc2l0aW9uQnlDb29yZCh4LCB5KSB7XHJcbiAgICBsZXQgYXJyID0gdGhpcy50YXJnZXQuZ2V0QXR0YWNobWVudFZhbHVlKDEsIHgsIHkpO1xyXG5cclxuICAgIHJldHVybiBuZXcgbXRoLlZlYzMoYXJyWzBdLCBhcnJbMV0sIGFyclsyXSk7XHJcbiAgfSAvKiBnZXRQb3NpdGlvbkJ5Q29vcmQgKi9cclxuXHJcbiAgYXN5bmMgcnVuKCkge1xyXG4gICAgLy8gaW5pdGlhbGl6ZSBmdWxsc2NyZWVuIG1hdGVyaWFsXHJcbiAgICB0aGlzLmZzTWF0ZXJpYWwgPSBhd2FpdCB0aGlzLmNyZWF0ZU1hdGVyaWFsKFwiLi9zaGFkZXJzL3RhcmdldFwiKTtcclxuICAgIHRoaXMuZnNNYXRlcmlhbC50ZXh0dXJlcyA9IHRoaXMudGFyZ2V0LmF0dGFjaG1lbnRzO1xyXG5cclxuICAgIGxldCBzeXN0ZW0gPSB0aGlzO1xyXG5cclxuICAgIGNvbnN0IHJ1biA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgICBzeXN0ZW0udGltZXIucmVzcG9uc2UoKTtcclxuXHJcbiAgICAgIHN5c3RlbS5zdGFydCgpO1xyXG5cclxuICAgICAgZm9yIChjb25zdCBpZCBpbiBzeXN0ZW0udW5pdHMpIHtcclxuICAgICAgICBsZXQgdW5pdCA9IHN5c3RlbS51bml0c1tpZF07XHJcblxyXG4gICAgICAgIHN5c3RlbS5jdXJyZW50T2JqZWN0SUQgPSB1bml0LnN5c3RlbUlkO1xyXG4gICAgICAgIHVuaXQucmVzcG9uc2Uoc3lzdGVtKTtcclxuXHJcbiAgICAgICAgaWYgKHVuaXQuZG9TdWljaWRlID09PSB0cnVlKSB7XHJcbiAgICAgICAgICBpZiAodW5pdC5jbG9zZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHVuaXQuY2xvc2Uoc3lzdGVtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGRlbGV0ZSBzeXN0ZW0udW5pdHNbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgc3lzdGVtLmVuZCgpO1xyXG5cclxuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShydW4pO1xyXG4gICAgfTtcclxuXHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJ1bik7XHJcbiAgfSAvKiBydW4gKi9cclxufSAvKiBSZW5kZXIgKi9cclxuXHJcbi8qIHJlbmRlci5qcyAqLyIsImNvbnN0IFBBQ0tFVF9UWVBFUyA9IE9iamVjdC5jcmVhdGUobnVsbCk7IC8vIG5vIE1hcCA9IG5vIHBvbHlmaWxsXG5QQUNLRVRfVFlQRVNbXCJvcGVuXCJdID0gXCIwXCI7XG5QQUNLRVRfVFlQRVNbXCJjbG9zZVwiXSA9IFwiMVwiO1xuUEFDS0VUX1RZUEVTW1wicGluZ1wiXSA9IFwiMlwiO1xuUEFDS0VUX1RZUEVTW1wicG9uZ1wiXSA9IFwiM1wiO1xuUEFDS0VUX1RZUEVTW1wibWVzc2FnZVwiXSA9IFwiNFwiO1xuUEFDS0VUX1RZUEVTW1widXBncmFkZVwiXSA9IFwiNVwiO1xuUEFDS0VUX1RZUEVTW1wibm9vcFwiXSA9IFwiNlwiO1xuY29uc3QgUEFDS0VUX1RZUEVTX1JFVkVSU0UgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuT2JqZWN0LmtleXMoUEFDS0VUX1RZUEVTKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgUEFDS0VUX1RZUEVTX1JFVkVSU0VbUEFDS0VUX1RZUEVTW2tleV1dID0ga2V5O1xufSk7XG5jb25zdCBFUlJPUl9QQUNLRVQgPSB7IHR5cGU6IFwiZXJyb3JcIiwgZGF0YTogXCJwYXJzZXIgZXJyb3JcIiB9O1xuZXhwb3J0IHsgUEFDS0VUX1RZUEVTLCBQQUNLRVRfVFlQRVNfUkVWRVJTRSwgRVJST1JfUEFDS0VUIH07XG4iLCJpbXBvcnQgeyBQQUNLRVRfVFlQRVMgfSBmcm9tIFwiLi9jb21tb25zLmpzXCI7XG5jb25zdCB3aXRoTmF0aXZlQmxvYiA9IHR5cGVvZiBCbG9iID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEJsb2IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKEJsb2IpID09PSBcIltvYmplY3QgQmxvYkNvbnN0cnVjdG9yXVwiKTtcbmNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuLy8gQXJyYXlCdWZmZXIuaXNWaWV3IG1ldGhvZCBpcyBub3QgZGVmaW5lZCBpbiBJRTEwXG5jb25zdCBpc1ZpZXcgPSBvYmogPT4ge1xuICAgIHJldHVybiB0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBBcnJheUJ1ZmZlci5pc1ZpZXcob2JqKVxuICAgICAgICA6IG9iaiAmJiBvYmouYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG59O1xuY29uc3QgZW5jb2RlUGFja2V0ID0gKHsgdHlwZSwgZGF0YSB9LCBzdXBwb3J0c0JpbmFyeSwgY2FsbGJhY2spID0+IHtcbiAgICBpZiAod2l0aE5hdGl2ZUJsb2IgJiYgZGF0YSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgaWYgKHN1cHBvcnRzQmluYXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQmxvYkFzQmFzZTY0KGRhdGEsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh3aXRoTmF0aXZlQXJyYXlCdWZmZXIgJiZcbiAgICAgICAgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBpc1ZpZXcoZGF0YSkpKSB7XG4gICAgICAgIGlmIChzdXBwb3J0c0JpbmFyeSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZUJsb2JBc0Jhc2U2NChuZXcgQmxvYihbZGF0YV0pLCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcGxhaW4gc3RyaW5nXG4gICAgcmV0dXJuIGNhbGxiYWNrKFBBQ0tFVF9UWVBFU1t0eXBlXSArIChkYXRhIHx8IFwiXCIpKTtcbn07XG5jb25zdCBlbmNvZGVCbG9iQXNCYXNlNjQgPSAoZGF0YSwgY2FsbGJhY2spID0+IHtcbiAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGZpbGVSZWFkZXIucmVzdWx0LnNwbGl0KFwiLFwiKVsxXTtcbiAgICAgICAgY2FsbGJhY2soXCJiXCIgKyAoY29udGVudCB8fCBcIlwiKSk7XG4gICAgfTtcbiAgICByZXR1cm4gZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGRhdGEpO1xufTtcbmZ1bmN0aW9uIHRvQXJyYXkoZGF0YSkge1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShkYXRhKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShkYXRhLmJ1ZmZlciwgZGF0YS5ieXRlT2Zmc2V0LCBkYXRhLmJ5dGVMZW5ndGgpO1xuICAgIH1cbn1cbmxldCBURVhUX0VOQ09ERVI7XG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlUGFja2V0VG9CaW5hcnkocGFja2V0LCBjYWxsYmFjaykge1xuICAgIGlmICh3aXRoTmF0aXZlQmxvYiAmJiBwYWNrZXQuZGF0YSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgcmV0dXJuIHBhY2tldC5kYXRhXG4gICAgICAgICAgICAuYXJyYXlCdWZmZXIoKVxuICAgICAgICAgICAgLnRoZW4odG9BcnJheSlcbiAgICAgICAgICAgIC50aGVuKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgZWxzZSBpZiAod2l0aE5hdGl2ZUFycmF5QnVmZmVyICYmXG4gICAgICAgIChwYWNrZXQuZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGlzVmlldyhwYWNrZXQuZGF0YSkpKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh0b0FycmF5KHBhY2tldC5kYXRhKSk7XG4gICAgfVxuICAgIGVuY29kZVBhY2tldChwYWNrZXQsIGZhbHNlLCBlbmNvZGVkID0+IHtcbiAgICAgICAgaWYgKCFURVhUX0VOQ09ERVIpIHtcbiAgICAgICAgICAgIFRFWFRfRU5DT0RFUiA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKFRFWFRfRU5DT0RFUi5lbmNvZGUoZW5jb2RlZCkpO1xuICAgIH0pO1xufVxuZXhwb3J0IHsgZW5jb2RlUGFja2V0IH07XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NrZXRpby9iYXNlNjQtYXJyYXlidWZmZXJcbmNvbnN0IGNoYXJzID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuLy8gVXNlIGEgbG9va3VwIHRhYmxlIHRvIGZpbmQgdGhlIGluZGV4LlxuY29uc3QgbG9va3VwID0gdHlwZW9mIFVpbnQ4QXJyYXkgPT09ICd1bmRlZmluZWQnID8gW10gOiBuZXcgVWludDhBcnJheSgyNTYpO1xuZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFycy5sZW5ndGg7IGkrKykge1xuICAgIGxvb2t1cFtjaGFycy5jaGFyQ29kZUF0KGkpXSA9IGk7XG59XG5leHBvcnQgY29uc3QgZW5jb2RlID0gKGFycmF5YnVmZmVyKSA9PiB7XG4gICAgbGV0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpLCBpLCBsZW4gPSBieXRlcy5sZW5ndGgsIGJhc2U2NCA9ICcnO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gMykge1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaV0gPj4gMl07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2ldICYgMykgPDwgNCkgfCAoYnl0ZXNbaSArIDFdID4+IDQpXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaSArIDFdICYgMTUpIDw8IDIpIHwgKGJ5dGVzW2kgKyAyXSA+PiA2KV07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpICsgMl0gJiA2M107XG4gICAgfVxuICAgIGlmIChsZW4gJSAzID09PSAyKSB7XG4gICAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDEpICsgJz0nO1xuICAgIH1cbiAgICBlbHNlIGlmIChsZW4gJSAzID09PSAxKSB7XG4gICAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDIpICsgJz09JztcbiAgICB9XG4gICAgcmV0dXJuIGJhc2U2NDtcbn07XG5leHBvcnQgY29uc3QgZGVjb2RlID0gKGJhc2U2NCkgPT4ge1xuICAgIGxldCBidWZmZXJMZW5ndGggPSBiYXNlNjQubGVuZ3RoICogMC43NSwgbGVuID0gYmFzZTY0Lmxlbmd0aCwgaSwgcCA9IDAsIGVuY29kZWQxLCBlbmNvZGVkMiwgZW5jb2RlZDMsIGVuY29kZWQ0O1xuICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDFdID09PSAnPScpIHtcbiAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG4gICAgICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDJdID09PSAnPScpIHtcbiAgICAgICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGFycmF5YnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmZlckxlbmd0aCksIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgICAgICBlbmNvZGVkMSA9IGxvb2t1cFtiYXNlNjQuY2hhckNvZGVBdChpKV07XG4gICAgICAgIGVuY29kZWQyID0gbG9va3VwW2Jhc2U2NC5jaGFyQ29kZUF0KGkgKyAxKV07XG4gICAgICAgIGVuY29kZWQzID0gbG9va3VwW2Jhc2U2NC5jaGFyQ29kZUF0KGkgKyAyKV07XG4gICAgICAgIGVuY29kZWQ0ID0gbG9va3VwW2Jhc2U2NC5jaGFyQ29kZUF0KGkgKyAzKV07XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoZW5jb2RlZDEgPDwgMikgfCAoZW5jb2RlZDIgPj4gNCk7XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoKGVuY29kZWQyICYgMTUpIDw8IDQpIHwgKGVuY29kZWQzID4+IDIpO1xuICAgICAgICBieXRlc1twKytdID0gKChlbmNvZGVkMyAmIDMpIDw8IDYpIHwgKGVuY29kZWQ0ICYgNjMpO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXlidWZmZXI7XG59O1xuIiwiaW1wb3J0IHsgRVJST1JfUEFDS0VULCBQQUNLRVRfVFlQRVNfUkVWRVJTRSB9IGZyb20gXCIuL2NvbW1vbnMuanNcIjtcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gXCIuL2NvbnRyaWIvYmFzZTY0LWFycmF5YnVmZmVyLmpzXCI7XG5jb25zdCB3aXRoTmF0aXZlQXJyYXlCdWZmZXIgPSB0eXBlb2YgQXJyYXlCdWZmZXIgPT09IFwiZnVuY3Rpb25cIjtcbmV4cG9ydCBjb25zdCBkZWNvZGVQYWNrZXQgPSAoZW5jb2RlZFBhY2tldCwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIGlmICh0eXBlb2YgZW5jb2RlZFBhY2tldCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICBkYXRhOiBtYXBCaW5hcnkoZW5jb2RlZFBhY2tldCwgYmluYXJ5VHlwZSlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgdHlwZSA9IGVuY29kZWRQYWNrZXQuY2hhckF0KDApO1xuICAgIGlmICh0eXBlID09PSBcImJcIikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICBkYXRhOiBkZWNvZGVCYXNlNjRQYWNrZXQoZW5jb2RlZFBhY2tldC5zdWJzdHJpbmcoMSksIGJpbmFyeVR5cGUpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHBhY2tldFR5cGUgPSBQQUNLRVRfVFlQRVNfUkVWRVJTRVt0eXBlXTtcbiAgICBpZiAoIXBhY2tldFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIEVSUk9SX1BBQ0tFVDtcbiAgICB9XG4gICAgcmV0dXJuIGVuY29kZWRQYWNrZXQubGVuZ3RoID4gMVxuICAgICAgICA/IHtcbiAgICAgICAgICAgIHR5cGU6IFBBQ0tFVF9UWVBFU19SRVZFUlNFW3R5cGVdLFxuICAgICAgICAgICAgZGF0YTogZW5jb2RlZFBhY2tldC5zdWJzdHJpbmcoMSlcbiAgICAgICAgfVxuICAgICAgICA6IHtcbiAgICAgICAgICAgIHR5cGU6IFBBQ0tFVF9UWVBFU19SRVZFUlNFW3R5cGVdXG4gICAgICAgIH07XG59O1xuY29uc3QgZGVjb2RlQmFzZTY0UGFja2V0ID0gKGRhdGEsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBpZiAod2l0aE5hdGl2ZUFycmF5QnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IGRlY29kZWQgPSBkZWNvZGUoZGF0YSk7XG4gICAgICAgIHJldHVybiBtYXBCaW5hcnkoZGVjb2RlZCwgYmluYXJ5VHlwZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4geyBiYXNlNjQ6IHRydWUsIGRhdGEgfTsgLy8gZmFsbGJhY2sgZm9yIG9sZCBicm93c2Vyc1xuICAgIH1cbn07XG5jb25zdCBtYXBCaW5hcnkgPSAoZGF0YSwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIHN3aXRjaCAoYmluYXJ5VHlwZSkge1xuICAgICAgICBjYXNlIFwiYmxvYlwiOlxuICAgICAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgICAgICAgICAgLy8gZnJvbSBXZWJTb2NrZXQgKyBiaW5hcnlUeXBlIFwiYmxvYlwiXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIEhUVFAgbG9uZy1wb2xsaW5nIG9yIFdlYlRyYW5zcG9ydFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYihbZGF0YV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYXJyYXlidWZmZXJcIjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIEhUVFAgbG9uZy1wb2xsaW5nIChiYXNlNjQpIG9yIFdlYlNvY2tldCArIGJpbmFyeVR5cGUgXCJhcnJheWJ1ZmZlclwiXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIFdlYlRyYW5zcG9ydCAoVWludDhBcnJheSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5idWZmZXI7XG4gICAgICAgICAgICB9XG4gICAgfVxufTtcbiIsImltcG9ydCB7IGVuY29kZVBhY2tldCwgZW5jb2RlUGFja2V0VG9CaW5hcnkgfSBmcm9tIFwiLi9lbmNvZGVQYWNrZXQuanNcIjtcbmltcG9ydCB7IGRlY29kZVBhY2tldCB9IGZyb20gXCIuL2RlY29kZVBhY2tldC5qc1wiO1xuaW1wb3J0IHsgRVJST1JfUEFDS0VUIH0gZnJvbSBcIi4vY29tbW9ucy5qc1wiO1xuY29uc3QgU0VQQVJBVE9SID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMCk7IC8vIHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9EZWxpbWl0ZXIjQVNDSUlfZGVsaW1pdGVkX3RleHRcbmNvbnN0IGVuY29kZVBheWxvYWQgPSAocGFja2V0cywgY2FsbGJhY2spID0+IHtcbiAgICAvLyBzb21lIHBhY2tldHMgbWF5IGJlIGFkZGVkIHRvIHRoZSBhcnJheSB3aGlsZSBlbmNvZGluZywgc28gdGhlIGluaXRpYWwgbGVuZ3RoIG11c3QgYmUgc2F2ZWRcbiAgICBjb25zdCBsZW5ndGggPSBwYWNrZXRzLmxlbmd0aDtcbiAgICBjb25zdCBlbmNvZGVkUGFja2V0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgcGFja2V0cy5mb3JFYWNoKChwYWNrZXQsIGkpID0+IHtcbiAgICAgICAgLy8gZm9yY2UgYmFzZTY0IGVuY29kaW5nIGZvciBiaW5hcnkgcGFja2V0c1xuICAgICAgICBlbmNvZGVQYWNrZXQocGFja2V0LCBmYWxzZSwgZW5jb2RlZFBhY2tldCA9PiB7XG4gICAgICAgICAgICBlbmNvZGVkUGFja2V0c1tpXSA9IGVuY29kZWRQYWNrZXQ7XG4gICAgICAgICAgICBpZiAoKytjb3VudCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZW5jb2RlZFBhY2tldHMuam9pbihTRVBBUkFUT1IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuY29uc3QgZGVjb2RlUGF5bG9hZCA9IChlbmNvZGVkUGF5bG9hZCwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIGNvbnN0IGVuY29kZWRQYWNrZXRzID0gZW5jb2RlZFBheWxvYWQuc3BsaXQoU0VQQVJBVE9SKTtcbiAgICBjb25zdCBwYWNrZXRzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVkUGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkZWNvZGVkUGFja2V0ID0gZGVjb2RlUGFja2V0KGVuY29kZWRQYWNrZXRzW2ldLCBiaW5hcnlUeXBlKTtcbiAgICAgICAgcGFja2V0cy5wdXNoKGRlY29kZWRQYWNrZXQpO1xuICAgICAgICBpZiAoZGVjb2RlZFBhY2tldC50eXBlID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYWNrZXRzO1xufTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYWNrZXRFbmNvZGVyU3RyZWFtKCkge1xuICAgIHJldHVybiBuZXcgVHJhbnNmb3JtU3RyZWFtKHtcbiAgICAgICAgdHJhbnNmb3JtKHBhY2tldCwgY29udHJvbGxlcikge1xuICAgICAgICAgICAgZW5jb2RlUGFja2V0VG9CaW5hcnkocGFja2V0LCBlbmNvZGVkUGFja2V0ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXlsb2FkTGVuZ3RoID0gZW5jb2RlZFBhY2tldC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgbGV0IGhlYWRlcjtcbiAgICAgICAgICAgICAgICAvLyBpbnNwaXJlZCBieSB0aGUgV2ViU29ja2V0IGZvcm1hdDogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYlNvY2tldHNfQVBJL1dyaXRpbmdfV2ViU29ja2V0X3NlcnZlcnMjZGVjb2RpbmdfcGF5bG9hZF9sZW5ndGhcbiAgICAgICAgICAgICAgICBpZiAocGF5bG9hZExlbmd0aCA8IDEyNikge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXIgPSBuZXcgVWludDhBcnJheSgxKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3IERhdGFWaWV3KGhlYWRlci5idWZmZXIpLnNldFVpbnQ4KDAsIHBheWxvYWRMZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXlsb2FkTGVuZ3RoIDwgNjU1MzYpIHtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyID0gbmV3IFVpbnQ4QXJyYXkoMyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoaGVhZGVyLmJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDgoMCwgMTI2KTtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMSwgcGF5bG9hZExlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXIgPSBuZXcgVWludDhBcnJheSg5KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhoZWFkZXIuYnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50OCgwLCAxMjcpO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldEJpZ1VpbnQ2NCgxLCBCaWdJbnQocGF5bG9hZExlbmd0aCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBmaXJzdCBiaXQgaW5kaWNhdGVzIHdoZXRoZXIgdGhlIHBheWxvYWQgaXMgcGxhaW4gdGV4dCAoMCkgb3IgYmluYXJ5ICgxKVxuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQuZGF0YSAmJiB0eXBlb2YgcGFja2V0LmRhdGEgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyWzBdIHw9IDB4ODA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShoZWFkZXIpO1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShlbmNvZGVkUGFja2V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5sZXQgVEVYVF9ERUNPREVSO1xuZnVuY3Rpb24gdG90YWxMZW5ndGgoY2h1bmtzKSB7XG4gICAgcmV0dXJuIGNodW5rcy5yZWR1Y2UoKGFjYywgY2h1bmspID0+IGFjYyArIGNodW5rLmxlbmd0aCwgMCk7XG59XG5mdW5jdGlvbiBjb25jYXRDaHVua3MoY2h1bmtzLCBzaXplKSB7XG4gICAgaWYgKGNodW5rc1swXS5sZW5ndGggPT09IHNpemUpIHtcbiAgICAgICAgcmV0dXJuIGNodW5rcy5zaGlmdCgpO1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShzaXplKTtcbiAgICBsZXQgaiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgYnVmZmVyW2ldID0gY2h1bmtzWzBdW2orK107XG4gICAgICAgIGlmIChqID09PSBjaHVua3NbMF0ubGVuZ3RoKSB7XG4gICAgICAgICAgICBjaHVua3Muc2hpZnQoKTtcbiAgICAgICAgICAgIGogPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjaHVua3MubGVuZ3RoICYmIGogPCBjaHVua3NbMF0ubGVuZ3RoKSB7XG4gICAgICAgIGNodW5rc1swXSA9IGNodW5rc1swXS5zbGljZShqKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlcjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYWNrZXREZWNvZGVyU3RyZWFtKG1heFBheWxvYWQsIGJpbmFyeVR5cGUpIHtcbiAgICBpZiAoIVRFWFRfREVDT0RFUikge1xuICAgICAgICBURVhUX0RFQ09ERVIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgICB9XG4gICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgbGV0IHN0YXRlID0gMCAvKiBSRUFEX0hFQURFUiAqLztcbiAgICBsZXQgZXhwZWN0ZWRMZW5ndGggPSAtMTtcbiAgICBsZXQgaXNCaW5hcnkgPSBmYWxzZTtcbiAgICByZXR1cm4gbmV3IFRyYW5zZm9ybVN0cmVhbSh7XG4gICAgICAgIHRyYW5zZm9ybShjaHVuaywgY29udHJvbGxlcikge1xuICAgICAgICAgICAgY2h1bmtzLnB1c2goY2h1bmspO1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09IDAgLyogUkVBRF9IRUFERVIgKi8pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsTGVuZ3RoKGNodW5rcykgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWFkZXIgPSBjb25jYXRDaHVua3MoY2h1bmtzLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaXNCaW5hcnkgPSAoaGVhZGVyWzBdICYgMHg4MCkgPT09IDB4ODA7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkTGVuZ3RoID0gaGVhZGVyWzBdICYgMHg3ZjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4cGVjdGVkTGVuZ3RoIDwgMTI2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDMgLyogUkVBRF9QQVlMT0FEICovO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV4cGVjdGVkTGVuZ3RoID09PSAxMjYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMSAvKiBSRUFEX0VYVEVOREVEX0xFTkdUSF8xNiAqLztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMiAvKiBSRUFEX0VYVEVOREVEX0xFTkdUSF82NCAqLztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdGF0ZSA9PT0gMSAvKiBSRUFEX0VYVEVOREVEX0xFTkdUSF8xNiAqLykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxMZW5ndGgoY2h1bmtzKSA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhlYWRlckFycmF5ID0gY29uY2F0Q2h1bmtzKGNodW5rcywgMik7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkTGVuZ3RoID0gbmV3IERhdGFWaWV3KGhlYWRlckFycmF5LmJ1ZmZlciwgaGVhZGVyQXJyYXkuYnl0ZU9mZnNldCwgaGVhZGVyQXJyYXkubGVuZ3RoKS5nZXRVaW50MTYoMCk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMyAvKiBSRUFEX1BBWUxPQUQgKi87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0YXRlID09PSAyIC8qIFJFQURfRVhURU5ERURfTEVOR1RIXzY0ICovKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b3RhbExlbmd0aChjaHVua3MpIDwgOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGVhZGVyQXJyYXkgPSBjb25jYXRDaHVua3MoY2h1bmtzLCA4KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhoZWFkZXJBcnJheS5idWZmZXIsIGhlYWRlckFycmF5LmJ5dGVPZmZzZXQsIGhlYWRlckFycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB2aWV3LmdldFVpbnQzMigwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG4gPiBNYXRoLnBvdygyLCA1MyAtIDMyKSAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBtYXhpbXVtIHNhZmUgaW50ZWdlciBpbiBKYXZhU2NyaXB0IGlzIDJeNTMgLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoRVJST1JfUEFDS0VUKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkTGVuZ3RoID0gbiAqIE1hdGgucG93KDIsIDMyKSArIHZpZXcuZ2V0VWludDMyKDQpO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDMgLyogUkVBRF9QQVlMT0FEICovO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsTGVuZ3RoKGNodW5rcykgPCBleHBlY3RlZExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGNvbmNhdENodW5rcyhjaHVua3MsIGV4cGVjdGVkTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGRlY29kZVBhY2tldChpc0JpbmFyeSA/IGRhdGEgOiBURVhUX0RFQ09ERVIuZGVjb2RlKGRhdGEpLCBiaW5hcnlUeXBlKSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMCAvKiBSRUFEX0hFQURFUiAqLztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGV4cGVjdGVkTGVuZ3RoID09PSAwIHx8IGV4cGVjdGVkTGVuZ3RoID4gbWF4UGF5bG9hZCkge1xuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoRVJST1JfUEFDS0VUKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5leHBvcnQgY29uc3QgcHJvdG9jb2wgPSA0O1xuZXhwb3J0IHsgZW5jb2RlUGFja2V0LCBlbmNvZGVQYXlsb2FkLCBkZWNvZGVQYWNrZXQsIGRlY29kZVBheWxvYWQgfTtcbiIsIi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XG59XG5cbi8qKlxuICogTWl4aW4gdGhlIGVtaXR0ZXIgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtaXhpbihvYmopIHtcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgb2JqW2tleV0gPSBFbWl0dGVyLnByb3RvdHlwZVtrZXldO1xuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogTGlzdGVuIG9uIHRoZSBnaXZlbiBgZXZlbnRgIHdpdGggYGZuYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9XG5FbWl0dGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICAodGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gfHwgW10pXG4gICAgLnB1c2goZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICBmdW5jdGlvbiBvbigpIHtcbiAgICB0aGlzLm9mZihldmVudCwgb24pO1xuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBvbi5mbiA9IGZuO1xuICB0aGlzLm9uKGV2ZW50LCBvbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIC8vIGFsbFxuICBpZiAoMCA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBzcGVjaWZpYyBldmVudFxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcbiAgaWYgKCFjYWxsYmFja3MpIHJldHVybiB0aGlzO1xuXG4gIC8vIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgaWYgKDEgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcbiAgdmFyIGNiO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNiID0gY2FsbGJhY2tzW2ldO1xuICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIGV2ZW50IHNwZWNpZmljIGFycmF5cyBmb3IgZXZlbnQgdHlwZXMgdGhhdCBub1xuICAvLyBvbmUgaXMgc3Vic2NyaWJlZCBmb3IgdG8gYXZvaWQgbWVtb3J5IGxlYWsuXG4gIGlmIChjYWxsYmFja3MubGVuZ3RoID09PSAwKSB7XG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKVxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcblxuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICB9XG5cbiAgaWYgKGNhbGxiYWNrcykge1xuICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBhbGlhcyB1c2VkIGZvciByZXNlcnZlZCBldmVudHMgKHByb3RlY3RlZCBtZXRob2QpXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0UmVzZXJ2ZWQgPSBFbWl0dGVyLnByb3RvdHlwZS5lbWl0O1xuXG4vKipcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gIHJldHVybiB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGVtaXR0ZXIgaGFzIGBldmVudGAgaGFuZGxlcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5oYXNMaXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHJldHVybiAhISB0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoO1xufTtcbiIsImV4cG9ydCBjb25zdCBnbG9iYWxUaGlzU2hpbSA9ICgoKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpO1xuICAgIH1cbn0pKCk7XG4iLCJpbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzIH0gZnJvbSBcIi4vZ2xvYmFsVGhpcy5qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIHBpY2sob2JqLCAuLi5hdHRyKSB7XG4gICAgcmV0dXJuIGF0dHIucmVkdWNlKChhY2MsIGspID0+IHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgYWNjW2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xufVxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgcmVhbCB0aW1lb3V0IGZ1bmN0aW9ucyBzbyB0aGV5IGNhbiBiZSB1c2VkIHdoZW4gb3ZlcnJpZGRlblxuY29uc3QgTkFUSVZFX1NFVF9USU1FT1VUID0gZ2xvYmFsVGhpcy5zZXRUaW1lb3V0O1xuY29uc3QgTkFUSVZFX0NMRUFSX1RJTUVPVVQgPSBnbG9iYWxUaGlzLmNsZWFyVGltZW91dDtcbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsVGltZXJGdW5jdGlvbnMob2JqLCBvcHRzKSB7XG4gICAgaWYgKG9wdHMudXNlTmF0aXZlVGltZXJzKSB7XG4gICAgICAgIG9iai5zZXRUaW1lb3V0Rm4gPSBOQVRJVkVfU0VUX1RJTUVPVVQuYmluZChnbG9iYWxUaGlzKTtcbiAgICAgICAgb2JqLmNsZWFyVGltZW91dEZuID0gTkFUSVZFX0NMRUFSX1RJTUVPVVQuYmluZChnbG9iYWxUaGlzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG9iai5zZXRUaW1lb3V0Rm4gPSBnbG9iYWxUaGlzLnNldFRpbWVvdXQuYmluZChnbG9iYWxUaGlzKTtcbiAgICAgICAgb2JqLmNsZWFyVGltZW91dEZuID0gZ2xvYmFsVGhpcy5jbGVhclRpbWVvdXQuYmluZChnbG9iYWxUaGlzKTtcbiAgICB9XG59XG4vLyBiYXNlNjQgZW5jb2RlZCBidWZmZXJzIGFyZSBhYm91dCAzMyUgYmlnZ2VyIChodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQpXG5jb25zdCBCQVNFNjRfT1ZFUkhFQUQgPSAxLjMzO1xuLy8gd2UgY291bGQgYWxzbyBoYXZlIHVzZWQgYG5ldyBCbG9iKFtvYmpdKS5zaXplYCwgYnV0IGl0IGlzbid0IHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydCBmdW5jdGlvbiBieXRlTGVuZ3RoKG9iaikge1xuICAgIGlmICh0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB1dGY4TGVuZ3RoKG9iaik7XG4gICAgfVxuICAgIC8vIGFycmF5YnVmZmVyIG9yIGJsb2JcbiAgICByZXR1cm4gTWF0aC5jZWlsKChvYmouYnl0ZUxlbmd0aCB8fCBvYmouc2l6ZSkgKiBCQVNFNjRfT1ZFUkhFQUQpO1xufVxuZnVuY3Rpb24gdXRmOExlbmd0aChzdHIpIHtcbiAgICBsZXQgYyA9IDAsIGxlbmd0aCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBzdHIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICAgICAgICBsZW5ndGggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjIDwgMHg4MDApIHtcbiAgICAgICAgICAgIGxlbmd0aCArPSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPCAweGQ4MDAgfHwgYyA+PSAweGUwMDApIHtcbiAgICAgICAgICAgIGxlbmd0aCArPSAzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgbGVuZ3RoICs9IDQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxlbmd0aDtcbn1cbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2dhbGtuL3F1ZXJ5c3RyaW5nXG4vKipcbiAqIENvbXBpbGVzIGEgcXVlcnlzdHJpbmdcbiAqIFJldHVybnMgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvYmplY3RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKG9iaikge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBmb3IgKGxldCBpIGluIG9iaikge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBpZiAoc3RyLmxlbmd0aClcbiAgICAgICAgICAgICAgICBzdHIgKz0gJyYnO1xuICAgICAgICAgICAgc3RyICs9IGVuY29kZVVSSUNvbXBvbmVudChpKSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChvYmpbaV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG4vKipcbiAqIFBhcnNlcyBhIHNpbXBsZSBxdWVyeXN0cmluZyBpbnRvIGFuIG9iamVjdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBxc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUocXMpIHtcbiAgICBsZXQgcXJ5ID0ge307XG4gICAgbGV0IHBhaXJzID0gcXMuc3BsaXQoJyYnKTtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHBhaXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBsZXQgcGFpciA9IHBhaXJzW2ldLnNwbGl0KCc9Jyk7XG4gICAgICAgIHFyeVtkZWNvZGVVUklDb21wb25lbnQocGFpclswXSldID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pO1xuICAgIH1cbiAgICByZXR1cm4gcXJ5O1xufVxuIiwiaW1wb3J0IHsgZGVjb2RlUGFja2V0IH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbmltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgaW5zdGFsbFRpbWVyRnVuY3Rpb25zIH0gZnJvbSBcIi4vdXRpbC5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlIH0gZnJvbSBcIi4vY29udHJpYi9wYXJzZXFzLmpzXCI7XG5jbGFzcyBUcmFuc3BvcnRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihyZWFzb24sIGRlc2NyaXB0aW9uLCBjb250ZXh0KSB7XG4gICAgICAgIHN1cGVyKHJlYXNvbik7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy50eXBlID0gXCJUcmFuc3BvcnRFcnJvclwiO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBUcmFuc3BvcnQgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBUcmFuc3BvcnQgYWJzdHJhY3QgY29uc3RydWN0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0cztcbiAgICAgICAgdGhpcy5xdWVyeSA9IG9wdHMucXVlcnk7XG4gICAgICAgIHRoaXMuc29ja2V0ID0gb3B0cy5zb2NrZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVtaXRzIGFuIGVycm9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlYXNvblxuICAgICAqIEBwYXJhbSBkZXNjcmlwdGlvblxuICAgICAqIEBwYXJhbSBjb250ZXh0IC0gdGhlIGVycm9yIGNvbnRleHRcbiAgICAgKiBAcmV0dXJuIHtUcmFuc3BvcnR9IGZvciBjaGFpbmluZ1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvbkVycm9yKHJlYXNvbiwgZGVzY3JpcHRpb24sIGNvbnRleHQpIHtcbiAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgbmV3IFRyYW5zcG9ydEVycm9yKHJlYXNvbiwgZGVzY3JpcHRpb24sIGNvbnRleHQpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE9wZW5zIHRoZSB0cmFuc3BvcnQuXG4gICAgICovXG4gICAgb3BlbigpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJvcGVuaW5nXCI7XG4gICAgICAgIHRoaXMuZG9PcGVuKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgdGhlIHRyYW5zcG9ydC5cbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gXCJvcGVuaW5nXCIgfHwgdGhpcy5yZWFkeVN0YXRlID09PSBcIm9wZW5cIikge1xuICAgICAgICAgICAgdGhpcy5kb0Nsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgbXVsdGlwbGUgcGFja2V0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhY2tldHNcbiAgICAgKi9cbiAgICBzZW5kKHBhY2tldHMpIHtcbiAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gXCJvcGVuXCIpIHtcbiAgICAgICAgICAgIHRoaXMud3JpdGUocGFja2V0cyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyB0aGlzIG1pZ2h0IGhhcHBlbiBpZiB0aGUgdHJhbnNwb3J0IHdhcyBzaWxlbnRseSBjbG9zZWQgaW4gdGhlIGJlZm9yZXVubG9hZCBldmVudCBoYW5kbGVyXG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gb3BlblxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uT3BlbigpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJvcGVuXCI7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSB0cnVlO1xuICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJvcGVuXCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2l0aCBkYXRhLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGRhdGFcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25EYXRhKGRhdGEpIHtcbiAgICAgICAgY29uc3QgcGFja2V0ID0gZGVjb2RlUGFja2V0KGRhdGEsIHRoaXMuc29ja2V0LmJpbmFyeVR5cGUpO1xuICAgICAgICB0aGlzLm9uUGFja2V0KHBhY2tldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aXRoIGEgZGVjb2RlZCBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25QYWNrZXQocGFja2V0KSB7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcInBhY2tldFwiLCBwYWNrZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBjbG9zZS5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvbkNsb3NlKGRldGFpbHMpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwiY2xvc2VcIiwgZGV0YWlscyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBhdXNlcyB0aGUgdHJhbnNwb3J0LCBpbiBvcmRlciBub3QgdG8gbG9zZSBwYWNrZXRzIGR1cmluZyBhbiB1cGdyYWRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9uUGF1c2VcbiAgICAgKi9cbiAgICBwYXVzZShvblBhdXNlKSB7IH1cbiAgICBjcmVhdGVVcmkoc2NoZW1hLCBxdWVyeSA9IHt9KSB7XG4gICAgICAgIHJldHVybiAoc2NoZW1hICtcbiAgICAgICAgICAgIFwiOi8vXCIgK1xuICAgICAgICAgICAgdGhpcy5faG9zdG5hbWUoKSArXG4gICAgICAgICAgICB0aGlzLl9wb3J0KCkgK1xuICAgICAgICAgICAgdGhpcy5vcHRzLnBhdGggK1xuICAgICAgICAgICAgdGhpcy5fcXVlcnkocXVlcnkpKTtcbiAgICB9XG4gICAgX2hvc3RuYW1lKCkge1xuICAgICAgICBjb25zdCBob3N0bmFtZSA9IHRoaXMub3B0cy5ob3N0bmFtZTtcbiAgICAgICAgcmV0dXJuIGhvc3RuYW1lLmluZGV4T2YoXCI6XCIpID09PSAtMSA/IGhvc3RuYW1lIDogXCJbXCIgKyBob3N0bmFtZSArIFwiXVwiO1xuICAgIH1cbiAgICBfcG9ydCgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5wb3J0ICYmXG4gICAgICAgICAgICAoKHRoaXMub3B0cy5zZWN1cmUgJiYgTnVtYmVyKHRoaXMub3B0cy5wb3J0ICE9PSA0NDMpKSB8fFxuICAgICAgICAgICAgICAgICghdGhpcy5vcHRzLnNlY3VyZSAmJiBOdW1iZXIodGhpcy5vcHRzLnBvcnQpICE9PSA4MCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCI6XCIgKyB0aGlzLm9wdHMucG9ydDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9xdWVyeShxdWVyeSkge1xuICAgICAgICBjb25zdCBlbmNvZGVkUXVlcnkgPSBlbmNvZGUocXVlcnkpO1xuICAgICAgICByZXR1cm4gZW5jb2RlZFF1ZXJ5Lmxlbmd0aCA/IFwiP1wiICsgZW5jb2RlZFF1ZXJ5IDogXCJcIjtcbiAgICB9XG59XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS91bnNoaWZ0aW8veWVhc3Rcbid1c2Ugc3RyaWN0JztcbmNvbnN0IGFscGhhYmV0ID0gJzAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6LV8nLnNwbGl0KCcnKSwgbGVuZ3RoID0gNjQsIG1hcCA9IHt9O1xubGV0IHNlZWQgPSAwLCBpID0gMCwgcHJldjtcbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgc3BlY2lmaWVkIG51bWJlci5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbnVtIFRoZSBudW1iZXIgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG51bWJlci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGUobnVtKSB7XG4gICAgbGV0IGVuY29kZWQgPSAnJztcbiAgICBkbyB7XG4gICAgICAgIGVuY29kZWQgPSBhbHBoYWJldFtudW0gJSBsZW5ndGhdICsgZW5jb2RlZDtcbiAgICAgICAgbnVtID0gTWF0aC5mbG9vcihudW0gLyBsZW5ndGgpO1xuICAgIH0gd2hpbGUgKG51bSA+IDApO1xuICAgIHJldHVybiBlbmNvZGVkO1xufVxuLyoqXG4gKiBSZXR1cm4gdGhlIGludGVnZXIgdmFsdWUgc3BlY2lmaWVkIGJ5IHRoZSBnaXZlbiBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgaW50ZWdlciB2YWx1ZSByZXByZXNlbnRlZCBieSB0aGUgc3RyaW5nLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZShzdHIpIHtcbiAgICBsZXQgZGVjb2RlZCA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICBkZWNvZGVkID0gZGVjb2RlZCAqIGxlbmd0aCArIG1hcFtzdHIuY2hhckF0KGkpXTtcbiAgICB9XG4gICAgcmV0dXJuIGRlY29kZWQ7XG59XG4vKipcbiAqIFllYXN0OiBBIHRpbnkgZ3Jvd2luZyBpZCBnZW5lcmF0b3IuXG4gKlxuICogQHJldHVybnMge1N0cmluZ30gQSB1bmlxdWUgaWQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24geWVhc3QoKSB7XG4gICAgY29uc3Qgbm93ID0gZW5jb2RlKCtuZXcgRGF0ZSgpKTtcbiAgICBpZiAobm93ICE9PSBwcmV2KVxuICAgICAgICByZXR1cm4gc2VlZCA9IDAsIHByZXYgPSBub3c7XG4gICAgcmV0dXJuIG5vdyArICcuJyArIGVuY29kZShzZWVkKyspO1xufVxuLy9cbi8vIE1hcCBlYWNoIGNoYXJhY3RlciB0byBpdHMgaW5kZXguXG4vL1xuZm9yICg7IGkgPCBsZW5ndGg7IGkrKylcbiAgICBtYXBbYWxwaGFiZXRbaV1dID0gaTtcbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2NvbXBvbmVudC9oYXMtY29yc1xubGV0IHZhbHVlID0gZmFsc2U7XG50cnkge1xuICAgIHZhbHVlID0gdHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbn1cbmNhdGNoIChlcnIpIHtcbiAgICAvLyBpZiBYTUxIdHRwIHN1cHBvcnQgaXMgZGlzYWJsZWQgaW4gSUUgdGhlbiBpdCB3aWxsIHRocm93XG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gY3JlYXRlXG59XG5leHBvcnQgY29uc3QgaGFzQ09SUyA9IHZhbHVlO1xuIiwiLy8gYnJvd3NlciBzaGltIGZvciB4bWxodHRwcmVxdWVzdCBtb2R1bGVcbmltcG9ydCB7IGhhc0NPUlMgfSBmcm9tIFwiLi4vY29udHJpYi9oYXMtY29ycy5qc1wiO1xuaW1wb3J0IHsgZ2xvYmFsVGhpc1NoaW0gYXMgZ2xvYmFsVGhpcyB9IGZyb20gXCIuLi9nbG9iYWxUaGlzLmpzXCI7XG5leHBvcnQgZnVuY3Rpb24gWEhSKG9wdHMpIHtcbiAgICBjb25zdCB4ZG9tYWluID0gb3B0cy54ZG9tYWluO1xuICAgIC8vIFhNTEh0dHBSZXF1ZXN0IGNhbiBiZSBkaXNhYmxlZCBvbiBJRVxuICAgIHRyeSB7XG4gICAgICAgIGlmIChcInVuZGVmaW5lZFwiICE9PSB0eXBlb2YgWE1MSHR0cFJlcXVlc3QgJiYgKCF4ZG9tYWluIHx8IGhhc0NPUlMpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHsgfVxuICAgIGlmICgheGRvbWFpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBnbG9iYWxUaGlzW1tcIkFjdGl2ZVwiXS5jb25jYXQoXCJPYmplY3RcIikuam9pbihcIlhcIildKFwiTWljcm9zb2Z0LlhNTEhUVFBcIik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb29raWVKYXIoKSB7IH1cbiIsImltcG9ydCB7IFRyYW5zcG9ydCB9IGZyb20gXCIuLi90cmFuc3BvcnQuanNcIjtcbmltcG9ydCB7IHllYXN0IH0gZnJvbSBcIi4uL2NvbnRyaWIveWVhc3QuanNcIjtcbmltcG9ydCB7IGVuY29kZVBheWxvYWQsIGRlY29kZVBheWxvYWQgfSBmcm9tIFwiZW5naW5lLmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgY3JlYXRlQ29va2llSmFyLCBYSFIgYXMgWE1MSHR0cFJlcXVlc3QsIH0gZnJvbSBcIi4veG1saHR0cHJlcXVlc3QuanNcIjtcbmltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgaW5zdGFsbFRpbWVyRnVuY3Rpb25zLCBwaWNrIH0gZnJvbSBcIi4uL3V0aWwuanNcIjtcbmltcG9ydCB7IGdsb2JhbFRoaXNTaGltIGFzIGdsb2JhbFRoaXMgfSBmcm9tIFwiLi4vZ2xvYmFsVGhpcy5qc1wiO1xuZnVuY3Rpb24gZW1wdHkoKSB7IH1cbmNvbnN0IGhhc1hIUjIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCh7XG4gICAgICAgIHhkb21haW46IGZhbHNlLFxuICAgIH0pO1xuICAgIHJldHVybiBudWxsICE9IHhoci5yZXNwb25zZVR5cGU7XG59KSgpO1xuZXhwb3J0IGNsYXNzIFBvbGxpbmcgZXh0ZW5kcyBUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIFhIUiBQb2xsaW5nIGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIob3B0cyk7XG4gICAgICAgIHRoaXMucG9sbGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBjb25zdCBpc1NTTCA9IFwiaHR0cHM6XCIgPT09IGxvY2F0aW9uLnByb3RvY29sO1xuICAgICAgICAgICAgbGV0IHBvcnQgPSBsb2NhdGlvbi5wb3J0O1xuICAgICAgICAgICAgLy8gc29tZSB1c2VyIGFnZW50cyBoYXZlIGVtcHR5IGBsb2NhdGlvbi5wb3J0YFxuICAgICAgICAgICAgaWYgKCFwb3J0KSB7XG4gICAgICAgICAgICAgICAgcG9ydCA9IGlzU1NMID8gXCI0NDNcIiA6IFwiODBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMueGQgPVxuICAgICAgICAgICAgICAgICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSAhPT0gbG9jYXRpb24uaG9zdG5hbWUpIHx8XG4gICAgICAgICAgICAgICAgICAgIHBvcnQgIT09IG9wdHMucG9ydDtcbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogWEhSIHN1cHBvcnRzIGJpbmFyeVxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgZm9yY2VCYXNlNjQgPSBvcHRzICYmIG9wdHMuZm9yY2VCYXNlNjQ7XG4gICAgICAgIHRoaXMuc3VwcG9ydHNCaW5hcnkgPSBoYXNYSFIyICYmICFmb3JjZUJhc2U2NDtcbiAgICAgICAgaWYgKHRoaXMub3B0cy53aXRoQ3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHRoaXMuY29va2llSmFyID0gY3JlYXRlQ29va2llSmFyKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiBcInBvbGxpbmdcIjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3BlbnMgdGhlIHNvY2tldCAodHJpZ2dlcnMgcG9sbGluZykuIFdlIHdyaXRlIGEgUElORyBtZXNzYWdlIHRvIGRldGVybWluZVxuICAgICAqIHdoZW4gdGhlIHRyYW5zcG9ydCBpcyBvcGVuLlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIGRvT3BlbigpIHtcbiAgICAgICAgdGhpcy5wb2xsKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBhdXNlcyBwb2xsaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25QYXVzZSAtIGNhbGxiYWNrIHVwb24gYnVmZmVycyBhcmUgZmx1c2hlZCBhbmQgdHJhbnNwb3J0IGlzIHBhdXNlZFxuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgcGF1c2Uob25QYXVzZSkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcInBhdXNpbmdcIjtcbiAgICAgICAgY29uc3QgcGF1c2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcInBhdXNlZFwiO1xuICAgICAgICAgICAgb25QYXVzZSgpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5wb2xsaW5nIHx8ICF0aGlzLndyaXRhYmxlKSB7XG4gICAgICAgICAgICBsZXQgdG90YWwgPSAwO1xuICAgICAgICAgICAgaWYgKHRoaXMucG9sbGluZykge1xuICAgICAgICAgICAgICAgIHRvdGFsKys7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwicG9sbENvbXBsZXRlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLS10b3RhbCB8fCBwYXVzZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLndyaXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdG90YWwrKztcbiAgICAgICAgICAgICAgICB0aGlzLm9uY2UoXCJkcmFpblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC0tdG90YWwgfHwgcGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhdXNlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RhcnRzIHBvbGxpbmcgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHBvbGwoKSB7XG4gICAgICAgIHRoaXMucG9sbGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuZG9Qb2xsKCk7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicG9sbFwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3ZlcmxvYWRzIG9uRGF0YSB0byBkZXRlY3QgcGF5bG9hZHMuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25EYXRhKGRhdGEpIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAocGFja2V0KSA9PiB7XG4gICAgICAgICAgICAvLyBpZiBpdHMgdGhlIGZpcnN0IG1lc3NhZ2Ugd2UgY29uc2lkZXIgdGhlIHRyYW5zcG9ydCBvcGVuXG4gICAgICAgICAgICBpZiAoXCJvcGVuaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSAmJiBwYWNrZXQudHlwZSA9PT0gXCJvcGVuXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgaXRzIGEgY2xvc2UgcGFja2V0LCB3ZSBjbG9zZSB0aGUgb25nb2luZyByZXF1ZXN0c1xuICAgICAgICAgICAgaWYgKFwiY2xvc2VcIiA9PT0gcGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ2xvc2UoeyBkZXNjcmlwdGlvbjogXCJ0cmFuc3BvcnQgY2xvc2VkIGJ5IHRoZSBzZXJ2ZXJcIiB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBvdGhlcndpc2UgYnlwYXNzIG9uRGF0YSBhbmQgaGFuZGxlIHRoZSBtZXNzYWdlXG4gICAgICAgICAgICB0aGlzLm9uUGFja2V0KHBhY2tldCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIGRlY29kZSBwYXlsb2FkXG4gICAgICAgIGRlY29kZVBheWxvYWQoZGF0YSwgdGhpcy5zb2NrZXQuYmluYXJ5VHlwZSkuZm9yRWFjaChjYWxsYmFjayk7XG4gICAgICAgIC8vIGlmIGFuIGV2ZW50IGRpZCBub3QgdHJpZ2dlciBjbG9zaW5nXG4gICAgICAgIGlmIChcImNsb3NlZFwiICE9PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIC8vIGlmIHdlIGdvdCBkYXRhIHdlJ3JlIG5vdCBwb2xsaW5nXG4gICAgICAgICAgICB0aGlzLnBvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicG9sbENvbXBsZXRlXCIpO1xuICAgICAgICAgICAgaWYgKFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZvciBwb2xsaW5nLCBzZW5kIGEgY2xvc2UgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIGRvQ2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IGNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy53cml0ZShbeyB0eXBlOiBcImNsb3NlXCIgfV0pO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoXCJvcGVuXCIgPT09IHRoaXMucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGluIGNhc2Ugd2UncmUgdHJ5aW5nIHRvIGNsb3NlIHdoaWxlXG4gICAgICAgICAgICAvLyBoYW5kc2hha2luZyBpcyBpbiBwcm9ncmVzcyAoR0gtMTY0KVxuICAgICAgICAgICAgdGhpcy5vbmNlKFwib3BlblwiLCBjbG9zZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogV3JpdGVzIGEgcGFja2V0cyBwYXlsb2FkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gcGFja2V0cyAtIGRhdGEgcGFja2V0c1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICB3cml0ZShwYWNrZXRzKSB7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgZW5jb2RlUGF5bG9hZChwYWNrZXRzLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kb1dyaXRlKGRhdGEsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRyYWluXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgdXJpIGZvciBjb25uZWN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB1cmkoKSB7XG4gICAgICAgIGNvbnN0IHNjaGVtYSA9IHRoaXMub3B0cy5zZWN1cmUgPyBcImh0dHBzXCIgOiBcImh0dHBcIjtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJ5IHx8IHt9O1xuICAgICAgICAvLyBjYWNoZSBidXN0aW5nIGlzIGZvcmNlZFxuICAgICAgICBpZiAoZmFsc2UgIT09IHRoaXMub3B0cy50aW1lc3RhbXBSZXF1ZXN0cykge1xuICAgICAgICAgICAgcXVlcnlbdGhpcy5vcHRzLnRpbWVzdGFtcFBhcmFtXSA9IHllYXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnN1cHBvcnRzQmluYXJ5ICYmICFxdWVyeS5zaWQpIHtcbiAgICAgICAgICAgIHF1ZXJ5LmI2NCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlVXJpKHNjaGVtYSwgcXVlcnkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcmVxdWVzdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHJlcXVlc3Qob3B0cyA9IHt9KSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24ob3B0cywgeyB4ZDogdGhpcy54ZCwgY29va2llSmFyOiB0aGlzLmNvb2tpZUphciB9LCB0aGlzLm9wdHMpO1xuICAgICAgICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcy51cmkoKSwgb3B0cyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGF0YSB0byBzZW5kLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxlZCB1cG9uIGZsdXNoLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZG9Xcml0ZShkYXRhLCBmbikge1xuICAgICAgICBjb25zdCByZXEgPSB0aGlzLnJlcXVlc3Qoe1xuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIH0pO1xuICAgICAgICByZXEub24oXCJzdWNjZXNzXCIsIGZuKTtcbiAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgKHhoclN0YXR1cywgY29udGV4dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKFwieGhyIHBvc3QgZXJyb3JcIiwgeGhyU3RhdHVzLCBjb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBhIHBvbGwgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGRvUG9sbCgpIHtcbiAgICAgICAgY29uc3QgcmVxID0gdGhpcy5yZXF1ZXN0KCk7XG4gICAgICAgIHJlcS5vbihcImRhdGFcIiwgdGhpcy5vbkRhdGEuYmluZCh0aGlzKSk7XG4gICAgICAgIHJlcS5vbihcImVycm9yXCIsICh4aHJTdGF0dXMsIGNvbnRleHQpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihcInhociBwb2xsIGVycm9yXCIsIHhoclN0YXR1cywgY29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnBvbGxYaHIgPSByZXE7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFJlcXVlc3QgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodXJpLCBvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0cztcbiAgICAgICAgdGhpcy5tZXRob2QgPSBvcHRzLm1ldGhvZCB8fCBcIkdFVFwiO1xuICAgICAgICB0aGlzLnVyaSA9IHVyaTtcbiAgICAgICAgdGhpcy5kYXRhID0gdW5kZWZpbmVkICE9PSBvcHRzLmRhdGEgPyBvcHRzLmRhdGEgOiBudWxsO1xuICAgICAgICB0aGlzLmNyZWF0ZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBYSFIgb2JqZWN0IGFuZCBzZW5kcyB0aGUgcmVxdWVzdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY3JlYXRlKCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBwaWNrKHRoaXMub3B0cywgXCJhZ2VudFwiLCBcInBmeFwiLCBcImtleVwiLCBcInBhc3NwaHJhc2VcIiwgXCJjZXJ0XCIsIFwiY2FcIiwgXCJjaXBoZXJzXCIsIFwicmVqZWN0VW5hdXRob3JpemVkXCIsIFwiYXV0b1VucmVmXCIpO1xuICAgICAgICBvcHRzLnhkb21haW4gPSAhIXRoaXMub3B0cy54ZDtcbiAgICAgICAgY29uc3QgeGhyID0gKHRoaXMueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KG9wdHMpKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHhoci5vcGVuKHRoaXMubWV0aG9kLCB0aGlzLnVyaSwgdHJ1ZSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuZXh0cmFIZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXREaXNhYmxlSGVhZGVyQ2hlY2sgJiYgeGhyLnNldERpc2FibGVIZWFkZXJDaGVjayh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSBpbiB0aGlzLm9wdHMuZXh0cmFIZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLmV4dHJhSGVhZGVycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGksIHRoaXMub3B0cy5leHRyYUhlYWRlcnNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgaWYgKFwiUE9TVFwiID09PSB0aGlzLm1ldGhvZCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwidGV4dC9wbGFpbjtjaGFyc2V0PVVURi04XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQWNjZXB0XCIsIFwiKi8qXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgKF9hID0gdGhpcy5vcHRzLmNvb2tpZUphcikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmFkZENvb2tpZXMoeGhyKTtcbiAgICAgICAgICAgIC8vIGllNiBjaGVja1xuICAgICAgICAgICAgaWYgKFwid2l0aENyZWRlbnRpYWxzXCIgaW4geGhyKSB7XG4gICAgICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRoaXMub3B0cy53aXRoQ3JlZGVudGlhbHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLnJlcXVlc3RUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSB0aGlzLm9wdHMucmVxdWVzdFRpbWVvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgKF9hID0gdGhpcy5vcHRzLmNvb2tpZUphcikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnBhcnNlQ29va2llcyh4aHIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoNCAhPT0geGhyLnJlYWR5U3RhdGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoMjAwID09PSB4aHIuc3RhdHVzIHx8IDEyMjMgPT09IHhoci5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkxvYWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgYGVycm9yYCBldmVudCBoYW5kbGVyIHRoYXQncyB1c2VyLXNldFxuICAgICAgICAgICAgICAgICAgICAvLyBkb2VzIG5vdCB0aHJvdyBpbiB0aGUgc2FtZSB0aWNrIGFuZCBnZXRzIGNhdWdodCBoZXJlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcih0eXBlb2YgeGhyLnN0YXR1cyA9PT0gXCJudW1iZXJcIiA/IHhoci5zdGF0dXMgOiAwKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHhoci5zZW5kKHRoaXMuZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIE5lZWQgdG8gZGVmZXIgc2luY2UgLmNyZWF0ZSgpIGlzIGNhbGxlZCBkaXJlY3RseSBmcm9tIHRoZSBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgLy8gYW5kIHRodXMgdGhlICdlcnJvcicgZXZlbnQgY2FuIG9ubHkgYmUgb25seSBib3VuZCAqYWZ0ZXIqIHRoaXMgZXhjZXB0aW9uXG4gICAgICAgICAgICAvLyBvY2N1cnMuICBUaGVyZWZvcmUsIGFsc28sIHdlIGNhbm5vdCB0aHJvdyBoZXJlIGF0IGFsbC5cbiAgICAgICAgICAgIHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZSk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aGlzLmluZGV4ID0gUmVxdWVzdC5yZXF1ZXN0c0NvdW50Kys7XG4gICAgICAgICAgICBSZXF1ZXN0LnJlcXVlc3RzW3RoaXMuaW5kZXhdID0gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25FcnJvcihlcnIpIHtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIsIHRoaXMueGhyKTtcbiAgICAgICAgdGhpcy5jbGVhbnVwKHRydWUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbGVhbnMgdXAgaG91c2UuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGNsZWFudXAoZnJvbUVycm9yKSB7XG4gICAgICAgIGlmIChcInVuZGVmaW5lZFwiID09PSB0eXBlb2YgdGhpcy54aHIgfHwgbnVsbCA9PT0gdGhpcy54aHIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlbXB0eTtcbiAgICAgICAgaWYgKGZyb21FcnJvcikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnhoci5hYm9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBSZXF1ZXN0LnJlcXVlc3RzW3RoaXMuaW5kZXhdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueGhyID0gbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gbG9hZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25Mb2FkKCkge1xuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy54aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICBpZiAoZGF0YSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkYXRhXCIsIGRhdGEpO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJzdWNjZXNzXCIpO1xuICAgICAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQWJvcnRzIHRoZSByZXF1ZXN0LlxuICAgICAqXG4gICAgICogQHBhY2thZ2VcbiAgICAgKi9cbiAgICBhYm9ydCgpIHtcbiAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxufVxuUmVxdWVzdC5yZXF1ZXN0c0NvdW50ID0gMDtcblJlcXVlc3QucmVxdWVzdHMgPSB7fTtcbi8qKlxuICogQWJvcnRzIHBlbmRpbmcgcmVxdWVzdHMgd2hlbiB1bmxvYWRpbmcgdGhlIHdpbmRvdy4gVGhpcyBpcyBuZWVkZWQgdG8gcHJldmVudFxuICogbWVtb3J5IGxlYWtzIChlLmcuIHdoZW4gdXNpbmcgSUUpIGFuZCB0byBlbnN1cmUgdGhhdCBubyBzcHVyaW91cyBlcnJvciBpc1xuICogZW1pdHRlZC5cbiAqL1xuaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBpZiAodHlwZW9mIGF0dGFjaEV2ZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBhdHRhY2hFdmVudChcIm9udW5sb2FkXCIsIHVubG9hZEhhbmRsZXIpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNvbnN0IHRlcm1pbmF0aW9uRXZlbnQgPSBcIm9ucGFnZWhpZGVcIiBpbiBnbG9iYWxUaGlzID8gXCJwYWdlaGlkZVwiIDogXCJ1bmxvYWRcIjtcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcih0ZXJtaW5hdGlvbkV2ZW50LCB1bmxvYWRIYW5kbGVyLCBmYWxzZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gdW5sb2FkSGFuZGxlcigpIHtcbiAgICBmb3IgKGxldCBpIGluIFJlcXVlc3QucmVxdWVzdHMpIHtcbiAgICAgICAgaWYgKFJlcXVlc3QucmVxdWVzdHMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgIFJlcXVlc3QucmVxdWVzdHNbaV0uYWJvcnQoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGdsb2JhbFRoaXNTaGltIGFzIGdsb2JhbFRoaXMgfSBmcm9tIFwiLi4vZ2xvYmFsVGhpcy5qc1wiO1xuZXhwb3J0IGNvbnN0IG5leHRUaWNrID0gKCgpID0+IHtcbiAgICBjb25zdCBpc1Byb21pc2VBdmFpbGFibGUgPSB0eXBlb2YgUHJvbWlzZSA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBQcm9taXNlLnJlc29sdmUgPT09IFwiZnVuY3Rpb25cIjtcbiAgICBpZiAoaXNQcm9taXNlQXZhaWxhYmxlKSB7XG4gICAgICAgIHJldHVybiAoY2IpID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oY2IpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChjYiwgc2V0VGltZW91dEZuKSA9PiBzZXRUaW1lb3V0Rm4oY2IsIDApO1xuICAgIH1cbn0pKCk7XG5leHBvcnQgY29uc3QgV2ViU29ja2V0ID0gZ2xvYmFsVGhpcy5XZWJTb2NrZXQgfHwgZ2xvYmFsVGhpcy5Nb3pXZWJTb2NrZXQ7XG5leHBvcnQgY29uc3QgdXNpbmdCcm93c2VyV2ViU29ja2V0ID0gdHJ1ZTtcbmV4cG9ydCBjb25zdCBkZWZhdWx0QmluYXJ5VHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcbiIsImltcG9ydCB7IFRyYW5zcG9ydCB9IGZyb20gXCIuLi90cmFuc3BvcnQuanNcIjtcbmltcG9ydCB7IHllYXN0IH0gZnJvbSBcIi4uL2NvbnRyaWIveWVhc3QuanNcIjtcbmltcG9ydCB7IHBpY2sgfSBmcm9tIFwiLi4vdXRpbC5qc1wiO1xuaW1wb3J0IHsgbmV4dFRpY2ssIHVzaW5nQnJvd3NlcldlYlNvY2tldCwgV2ViU29ja2V0LCB9IGZyb20gXCIuL3dlYnNvY2tldC1jb25zdHJ1Y3Rvci5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlUGFja2V0IH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbi8vIGRldGVjdCBSZWFjdE5hdGl2ZSBlbnZpcm9ubWVudFxuY29uc3QgaXNSZWFjdE5hdGl2ZSA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICB0eXBlb2YgbmF2aWdhdG9yLnByb2R1Y3QgPT09IFwic3RyaW5nXCIgJiZcbiAgICBuYXZpZ2F0b3IucHJvZHVjdC50b0xvd2VyQ2FzZSgpID09PSBcInJlYWN0bmF0aXZlXCI7XG5leHBvcnQgY2xhc3MgV1MgZXh0ZW5kcyBUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIFdlYlNvY2tldCB0cmFuc3BvcnQgY29uc3RydWN0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIGNvbm5lY3Rpb24gb3B0aW9uc1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHN1cGVyKG9wdHMpO1xuICAgICAgICB0aGlzLnN1cHBvcnRzQmluYXJ5ID0gIW9wdHMuZm9yY2VCYXNlNjQ7XG4gICAgfVxuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gXCJ3ZWJzb2NrZXRcIjtcbiAgICB9XG4gICAgZG9PcGVuKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hlY2soKSkge1xuICAgICAgICAgICAgLy8gbGV0IHByb2JlIHRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB1cmkgPSB0aGlzLnVyaSgpO1xuICAgICAgICBjb25zdCBwcm90b2NvbHMgPSB0aGlzLm9wdHMucHJvdG9jb2xzO1xuICAgICAgICAvLyBSZWFjdCBOYXRpdmUgb25seSBzdXBwb3J0cyB0aGUgJ2hlYWRlcnMnIG9wdGlvbiwgYW5kIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIGFueXRoaW5nIGVsc2UgaXMgcGFzc2VkXG4gICAgICAgIGNvbnN0IG9wdHMgPSBpc1JlYWN0TmF0aXZlXG4gICAgICAgICAgICA/IHt9XG4gICAgICAgICAgICA6IHBpY2sodGhpcy5vcHRzLCBcImFnZW50XCIsIFwicGVyTWVzc2FnZURlZmxhdGVcIiwgXCJwZnhcIiwgXCJrZXlcIiwgXCJwYXNzcGhyYXNlXCIsIFwiY2VydFwiLCBcImNhXCIsIFwiY2lwaGVyc1wiLCBcInJlamVjdFVuYXV0aG9yaXplZFwiLCBcImxvY2FsQWRkcmVzc1wiLCBcInByb3RvY29sVmVyc2lvblwiLCBcIm9yaWdpblwiLCBcIm1heFBheWxvYWRcIiwgXCJmYW1pbHlcIiwgXCJjaGVja1NlcnZlcklkZW50aXR5XCIpO1xuICAgICAgICBpZiAodGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgb3B0cy5oZWFkZXJzID0gdGhpcy5vcHRzLmV4dHJhSGVhZGVycztcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy53cyA9XG4gICAgICAgICAgICAgICAgdXNpbmdCcm93c2VyV2ViU29ja2V0ICYmICFpc1JlYWN0TmF0aXZlXG4gICAgICAgICAgICAgICAgICAgID8gcHJvdG9jb2xzXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG5ldyBXZWJTb2NrZXQodXJpLCBwcm90b2NvbHMpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG5ldyBXZWJTb2NrZXQodXJpKVxuICAgICAgICAgICAgICAgICAgICA6IG5ldyBXZWJTb2NrZXQodXJpLCBwcm90b2NvbHMsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53cy5iaW5hcnlUeXBlID0gdGhpcy5zb2NrZXQuYmluYXJ5VHlwZTtcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgc29ja2V0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLndzLm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53cy5fc29ja2V0LnVucmVmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLndzLm9uY2xvc2UgPSAoY2xvc2VFdmVudCkgPT4gdGhpcy5vbkNsb3NlKHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIndlYnNvY2tldCBjb25uZWN0aW9uIGNsb3NlZFwiLFxuICAgICAgICAgICAgY29udGV4dDogY2xvc2VFdmVudCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMud3Mub25tZXNzYWdlID0gKGV2KSA9PiB0aGlzLm9uRGF0YShldi5kYXRhKTtcbiAgICAgICAgdGhpcy53cy5vbmVycm9yID0gKGUpID0+IHRoaXMub25FcnJvcihcIndlYnNvY2tldCBlcnJvclwiLCBlKTtcbiAgICB9XG4gICAgd3JpdGUocGFja2V0cykge1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIC8vIGVuY29kZVBhY2tldCBlZmZpY2llbnQgYXMgaXQgdXNlcyBXUyBmcmFtaW5nXG4gICAgICAgIC8vIG5vIG5lZWQgZm9yIGVuY29kZVBheWxvYWRcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWNrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwYWNrZXQgPSBwYWNrZXRzW2ldO1xuICAgICAgICAgICAgY29uc3QgbGFzdFBhY2tldCA9IGkgPT09IHBhY2tldHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGVuY29kZVBhY2tldChwYWNrZXQsIHRoaXMuc3VwcG9ydHNCaW5hcnksIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gYWx3YXlzIGNyZWF0ZSBhIG5ldyBvYmplY3QgKEdILTQzNylcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRzID0ge307XG4gICAgICAgICAgICAgICAgaWYgKCF1c2luZ0Jyb3dzZXJXZWJTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhY2tldC5vcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbXByZXNzID0gcGFja2V0Lm9wdGlvbnMuY29tcHJlc3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5wZXJNZXNzYWdlRGVmbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGVuID0gXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBcInN0cmluZ1wiID09PSB0eXBlb2YgZGF0YSA/IEJ1ZmZlci5ieXRlTGVuZ3RoKGRhdGEpIDogZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGVuIDwgdGhpcy5vcHRzLnBlck1lc3NhZ2VEZWZsYXRlLnRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29tcHJlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTb21ldGltZXMgdGhlIHdlYnNvY2tldCBoYXMgYWxyZWFkeSBiZWVuIGNsb3NlZCBidXQgdGhlIGJyb3dzZXIgZGlkbid0XG4gICAgICAgICAgICAgICAgLy8gaGF2ZSBhIGNoYW5jZSBvZiBpbmZvcm1pbmcgdXMgYWJvdXQgaXQgeWV0LCBpbiB0aGF0IGNhc2Ugc2VuZCB3aWxsXG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNpbmdCcm93c2VyV2ViU29ja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUeXBlRXJyb3IgaXMgdGhyb3duIHdoZW4gcGFzc2luZyB0aGUgc2Vjb25kIGFyZ3VtZW50IG9uIFNhZmFyaVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cy5zZW5kKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cy5zZW5kKGRhdGEsIG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsYXN0UGFja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZha2UgZHJhaW5cbiAgICAgICAgICAgICAgICAgICAgLy8gZGVmZXIgdG8gbmV4dCB0aWNrIHRvIGFsbG93IFNvY2tldCB0byBjbGVhciB3cml0ZUJ1ZmZlclxuICAgICAgICAgICAgICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZHJhaW5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRoaXMuc2V0VGltZW91dEZuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkb0Nsb3NlKCkge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMud3MgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRoaXMud3MuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMud3MgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyB1cmkgZm9yIGNvbm5lY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHVyaSgpIHtcbiAgICAgICAgY29uc3Qgc2NoZW1hID0gdGhpcy5vcHRzLnNlY3VyZSA/IFwid3NzXCIgOiBcIndzXCI7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5xdWVyeSB8fCB7fTtcbiAgICAgICAgLy8gYXBwZW5kIHRpbWVzdGFtcCB0byBVUklcbiAgICAgICAgaWYgKHRoaXMub3B0cy50aW1lc3RhbXBSZXF1ZXN0cykge1xuICAgICAgICAgICAgcXVlcnlbdGhpcy5vcHRzLnRpbWVzdGFtcFBhcmFtXSA9IHllYXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tbXVuaWNhdGUgYmluYXJ5IHN1cHBvcnQgY2FwYWJpbGl0aWVzXG4gICAgICAgIGlmICghdGhpcy5zdXBwb3J0c0JpbmFyeSkge1xuICAgICAgICAgICAgcXVlcnkuYjY0ID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVVcmkoc2NoZW1hLCBxdWVyeSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZlYXR1cmUgZGV0ZWN0aW9uIGZvciBXZWJTb2NrZXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIHRoaXMgdHJhbnNwb3J0IGlzIGF2YWlsYWJsZS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGNoZWNrKCkge1xuICAgICAgICByZXR1cm4gISFXZWJTb2NrZXQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgVHJhbnNwb3J0IH0gZnJvbSBcIi4uL3RyYW5zcG9ydC5qc1wiO1xuaW1wb3J0IHsgbmV4dFRpY2sgfSBmcm9tIFwiLi93ZWJzb2NrZXQtY29uc3RydWN0b3IuanNcIjtcbmltcG9ydCB7IGNyZWF0ZVBhY2tldERlY29kZXJTdHJlYW0sIGNyZWF0ZVBhY2tldEVuY29kZXJTdHJlYW0sIH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbmV4cG9ydCBjbGFzcyBXVCBleHRlbmRzIFRyYW5zcG9ydCB7XG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiBcIndlYnRyYW5zcG9ydFwiO1xuICAgIH1cbiAgICBkb09wZW4oKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKHR5cGVvZiBXZWJUcmFuc3BvcnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy50cmFuc3BvcnQgPSBuZXcgV2ViVHJhbnNwb3J0KHRoaXMuY3JlYXRlVXJpKFwiaHR0cHNcIiksIHRoaXMub3B0cy50cmFuc3BvcnRPcHRpb25zW3RoaXMubmFtZV0pO1xuICAgICAgICB0aGlzLnRyYW5zcG9ydC5jbG9zZWRcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25DbG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihcIndlYnRyYW5zcG9ydCBlcnJvclwiLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gbm90ZTogd2UgY291bGQgaGF2ZSB1c2VkIGFzeW5jL2F3YWl0LCBidXQgdGhhdCB3b3VsZCByZXF1aXJlIHNvbWUgYWRkaXRpb25hbCBwb2x5ZmlsbHNcbiAgICAgICAgdGhpcy50cmFuc3BvcnQucmVhZHkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5jcmVhdGVCaWRpcmVjdGlvbmFsU3RyZWFtKCkudGhlbigoc3RyZWFtKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVjb2RlclN0cmVhbSA9IGNyZWF0ZVBhY2tldERlY29kZXJTdHJlYW0oTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIHRoaXMuc29ja2V0LmJpbmFyeVR5cGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IHN0cmVhbS5yZWFkYWJsZS5waXBlVGhyb3VnaChkZWNvZGVyU3RyZWFtKS5nZXRSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmNvZGVyU3RyZWFtID0gY3JlYXRlUGFja2V0RW5jb2RlclN0cmVhbSgpO1xuICAgICAgICAgICAgICAgIGVuY29kZXJTdHJlYW0ucmVhZGFibGUucGlwZVRvKHN0cmVhbS53cml0YWJsZSk7XG4gICAgICAgICAgICAgICAgdGhpcy53cml0ZXIgPSBlbmNvZGVyU3RyZWFtLndyaXRhYmxlLmdldFdyaXRlcigpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWRlclxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlYWQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKHsgZG9uZSwgdmFsdWUgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uUGFja2V0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhY2tldCA9IHsgdHlwZTogXCJvcGVuXCIgfTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5xdWVyeS5zaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFja2V0LmRhdGEgPSBge1wic2lkXCI6XCIke3RoaXMucXVlcnkuc2lkfVwifWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMud3JpdGVyLndyaXRlKHBhY2tldCkudGhlbigoKSA9PiB0aGlzLm9uT3BlbigpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgd3JpdGUocGFja2V0cykge1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGFja2V0ID0gcGFja2V0c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RQYWNrZXQgPSBpID09PSBwYWNrZXRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB0aGlzLndyaXRlci53cml0ZShwYWNrZXQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChsYXN0UGFja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcy5zZXRUaW1lb3V0Rm4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRvQ2xvc2UoKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgKF9hID0gdGhpcy50cmFuc3BvcnQpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5jbG9zZSgpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFBvbGxpbmcgfSBmcm9tIFwiLi9wb2xsaW5nLmpzXCI7XG5pbXBvcnQgeyBXUyB9IGZyb20gXCIuL3dlYnNvY2tldC5qc1wiO1xuaW1wb3J0IHsgV1QgfSBmcm9tIFwiLi93ZWJ0cmFuc3BvcnQuanNcIjtcbmV4cG9ydCBjb25zdCB0cmFuc3BvcnRzID0ge1xuICAgIHdlYnNvY2tldDogV1MsXG4gICAgd2VidHJhbnNwb3J0OiBXVCxcbiAgICBwb2xsaW5nOiBQb2xsaW5nLFxufTtcbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2dhbGtuL3BhcnNldXJpXG4vKipcbiAqIFBhcnNlcyBhIFVSSVxuICpcbiAqIE5vdGU6IHdlIGNvdWxkIGFsc28gaGF2ZSB1c2VkIHRoZSBidWlsdC1pbiBVUkwgb2JqZWN0LCBidXQgaXQgaXNuJ3Qgc3VwcG9ydGVkIG9uIGFsbCBwbGF0Zm9ybXMuXG4gKlxuICogU2VlOlxuICogLSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvVVJMXG4gKiAtIGh0dHBzOi8vY2FuaXVzZS5jb20vdXJsXG4gKiAtIGh0dHBzOi8vd3d3LnJmYy1lZGl0b3Iub3JnL3JmYy9yZmMzOTg2I2FwcGVuZGl4LUJcbiAqXG4gKiBIaXN0b3J5IG9mIHRoZSBwYXJzZSgpIG1ldGhvZDpcbiAqIC0gZmlyc3QgY29tbWl0OiBodHRwczovL2dpdGh1Yi5jb20vc29ja2V0aW8vc29ja2V0LmlvLWNsaWVudC9jb21taXQvNGVlMWQ1ZDk0YjM5MDZhOWMwNTJiNDU5ZjFhODE4YjE1ZjM4ZjkxY1xuICogLSBleHBvcnQgaW50byBpdHMgb3duIG1vZHVsZTogaHR0cHM6Ly9naXRodWIuY29tL3NvY2tldGlvL2VuZ2luZS5pby1jbGllbnQvY29tbWl0L2RlMmM1NjFlNDU2NGVmZWI3OGYxYmRiMWJhMzllZjgxYjI4MjJjYjNcbiAqIC0gcmVpbXBvcnQ6IGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NrZXRpby9lbmdpbmUuaW8tY2xpZW50L2NvbW1pdC9kZjMyMjc3YzNmNmQ2MjJlZWM1ZWQwOWY0OTNjYWUzZjMzOTFkMjQyXG4gKlxuICogQGF1dGhvciBTdGV2ZW4gTGV2aXRoYW4gPHN0ZXZlbmxldml0aGFuLmNvbT4gKE1JVCBsaWNlbnNlKVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmNvbnN0IHJlID0gL14oPzooPyFbXjpAXFwvPyNdKzpbXjpAXFwvXSpAKShodHRwfGh0dHBzfHdzfHdzcyk6XFwvXFwvKT8oKD86KChbXjpAXFwvPyNdKikoPzo6KFteOkBcXC8/I10qKSk/KT9AKT8oKD86W2EtZjAtOV17MCw0fTopezIsN31bYS1mMC05XXswLDR9fFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS87XG5jb25zdCBwYXJ0cyA9IFtcbiAgICAnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2FuY2hvcidcbl07XG5leHBvcnQgZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gICAgY29uc3Qgc3JjID0gc3RyLCBiID0gc3RyLmluZGV4T2YoJ1snKSwgZSA9IHN0ci5pbmRleE9mKCddJyk7XG4gICAgaWYgKGIgIT0gLTEgJiYgZSAhPSAtMSkge1xuICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIGIpICsgc3RyLnN1YnN0cmluZyhiLCBlKS5yZXBsYWNlKC86L2csICc7JykgKyBzdHIuc3Vic3RyaW5nKGUsIHN0ci5sZW5ndGgpO1xuICAgIH1cbiAgICBsZXQgbSA9IHJlLmV4ZWMoc3RyIHx8ICcnKSwgdXJpID0ge30sIGkgPSAxNDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIHVyaVtwYXJ0c1tpXV0gPSBtW2ldIHx8ICcnO1xuICAgIH1cbiAgICBpZiAoYiAhPSAtMSAmJiBlICE9IC0xKSB7XG4gICAgICAgIHVyaS5zb3VyY2UgPSBzcmM7XG4gICAgICAgIHVyaS5ob3N0ID0gdXJpLmhvc3Quc3Vic3RyaW5nKDEsIHVyaS5ob3N0Lmxlbmd0aCAtIDEpLnJlcGxhY2UoLzsvZywgJzonKTtcbiAgICAgICAgdXJpLmF1dGhvcml0eSA9IHVyaS5hdXRob3JpdHkucmVwbGFjZSgnWycsICcnKS5yZXBsYWNlKCddJywgJycpLnJlcGxhY2UoLzsvZywgJzonKTtcbiAgICAgICAgdXJpLmlwdjZ1cmkgPSB0cnVlO1xuICAgIH1cbiAgICB1cmkucGF0aE5hbWVzID0gcGF0aE5hbWVzKHVyaSwgdXJpWydwYXRoJ10pO1xuICAgIHVyaS5xdWVyeUtleSA9IHF1ZXJ5S2V5KHVyaSwgdXJpWydxdWVyeSddKTtcbiAgICByZXR1cm4gdXJpO1xufVxuZnVuY3Rpb24gcGF0aE5hbWVzKG9iaiwgcGF0aCkge1xuICAgIGNvbnN0IHJlZ3ggPSAvXFwvezIsOX0vZywgbmFtZXMgPSBwYXRoLnJlcGxhY2UocmVneCwgXCIvXCIpLnNwbGl0KFwiL1wiKTtcbiAgICBpZiAocGF0aC5zbGljZSgwLCAxKSA9PSAnLycgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbmFtZXMuc3BsaWNlKDAsIDEpO1xuICAgIH1cbiAgICBpZiAocGF0aC5zbGljZSgtMSkgPT0gJy8nKSB7XG4gICAgICAgIG5hbWVzLnNwbGljZShuYW1lcy5sZW5ndGggLSAxLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuZnVuY3Rpb24gcXVlcnlLZXkodXJpLCBxdWVyeSkge1xuICAgIGNvbnN0IGRhdGEgPSB7fTtcbiAgICBxdWVyeS5yZXBsYWNlKC8oPzpefCYpKFteJj1dKik9PyhbXiZdKikvZywgZnVuY3Rpb24gKCQwLCAkMSwgJDIpIHtcbiAgICAgICAgaWYgKCQxKSB7XG4gICAgICAgICAgICBkYXRhWyQxXSA9ICQyO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG59XG4iLCJpbXBvcnQgeyB0cmFuc3BvcnRzIH0gZnJvbSBcIi4vdHJhbnNwb3J0cy9pbmRleC5qc1wiO1xuaW1wb3J0IHsgaW5zdGFsbFRpbWVyRnVuY3Rpb25zLCBieXRlTGVuZ3RoIH0gZnJvbSBcIi4vdXRpbC5qc1wiO1xuaW1wb3J0IHsgZGVjb2RlIH0gZnJvbSBcIi4vY29udHJpYi9wYXJzZXFzLmpzXCI7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gXCIuL2NvbnRyaWIvcGFyc2V1cmkuanNcIjtcbmltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgcHJvdG9jb2wgfSBmcm9tIFwiZW5naW5lLmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgZGVmYXVsdEJpbmFyeVR5cGUgfSBmcm9tIFwiLi90cmFuc3BvcnRzL3dlYnNvY2tldC1jb25zdHJ1Y3Rvci5qc1wiO1xuZXhwb3J0IGNsYXNzIFNvY2tldCBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIFNvY2tldCBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gdXJpIC0gdXJpIG9yIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih1cmksIG9wdHMgPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmJpbmFyeVR5cGUgPSBkZWZhdWx0QmluYXJ5VHlwZTtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlciA9IFtdO1xuICAgICAgICBpZiAodXJpICYmIFwib2JqZWN0XCIgPT09IHR5cGVvZiB1cmkpIHtcbiAgICAgICAgICAgIG9wdHMgPSB1cmk7XG4gICAgICAgICAgICB1cmkgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cmkpIHtcbiAgICAgICAgICAgIHVyaSA9IHBhcnNlKHVyaSk7XG4gICAgICAgICAgICBvcHRzLmhvc3RuYW1lID0gdXJpLmhvc3Q7XG4gICAgICAgICAgICBvcHRzLnNlY3VyZSA9IHVyaS5wcm90b2NvbCA9PT0gXCJodHRwc1wiIHx8IHVyaS5wcm90b2NvbCA9PT0gXCJ3c3NcIjtcbiAgICAgICAgICAgIG9wdHMucG9ydCA9IHVyaS5wb3J0O1xuICAgICAgICAgICAgaWYgKHVyaS5xdWVyeSlcbiAgICAgICAgICAgICAgICBvcHRzLnF1ZXJ5ID0gdXJpLnF1ZXJ5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdHMuaG9zdCkge1xuICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSA9IHBhcnNlKG9wdHMuaG9zdCkuaG9zdDtcbiAgICAgICAgfVxuICAgICAgICBpbnN0YWxsVGltZXJGdW5jdGlvbnModGhpcywgb3B0cyk7XG4gICAgICAgIHRoaXMuc2VjdXJlID1cbiAgICAgICAgICAgIG51bGwgIT0gb3B0cy5zZWN1cmVcbiAgICAgICAgICAgICAgICA/IG9wdHMuc2VjdXJlXG4gICAgICAgICAgICAgICAgOiB0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgXCJodHRwczpcIiA9PT0gbG9jYXRpb24ucHJvdG9jb2w7XG4gICAgICAgIGlmIChvcHRzLmhvc3RuYW1lICYmICFvcHRzLnBvcnQpIHtcbiAgICAgICAgICAgIC8vIGlmIG5vIHBvcnQgaXMgc3BlY2lmaWVkIG1hbnVhbGx5LCB1c2UgdGhlIHByb3RvY29sIGRlZmF1bHRcbiAgICAgICAgICAgIG9wdHMucG9ydCA9IHRoaXMuc2VjdXJlID8gXCI0NDNcIiA6IFwiODBcIjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhvc3RuYW1lID1cbiAgICAgICAgICAgIG9wdHMuaG9zdG5hbWUgfHxcbiAgICAgICAgICAgICAgICAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiID8gbG9jYXRpb24uaG9zdG5hbWUgOiBcImxvY2FsaG9zdFwiKTtcbiAgICAgICAgdGhpcy5wb3J0ID1cbiAgICAgICAgICAgIG9wdHMucG9ydCB8fFxuICAgICAgICAgICAgICAgICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgbG9jYXRpb24ucG9ydFxuICAgICAgICAgICAgICAgICAgICA/IGxvY2F0aW9uLnBvcnRcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLnNlY3VyZVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBcIjQ0M1wiXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFwiODBcIik7XG4gICAgICAgIHRoaXMudHJhbnNwb3J0cyA9IG9wdHMudHJhbnNwb3J0cyB8fCBbXG4gICAgICAgICAgICBcInBvbGxpbmdcIixcbiAgICAgICAgICAgIFwid2Vic29ja2V0XCIsXG4gICAgICAgICAgICBcIndlYnRyYW5zcG9ydFwiLFxuICAgICAgICBdO1xuICAgICAgICB0aGlzLndyaXRlQnVmZmVyID0gW107XG4gICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IDA7XG4gICAgICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF0aDogXCIvZW5naW5lLmlvXCIsXG4gICAgICAgICAgICBhZ2VudDogZmFsc2UsXG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IGZhbHNlLFxuICAgICAgICAgICAgdXBncmFkZTogdHJ1ZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcFBhcmFtOiBcInRcIixcbiAgICAgICAgICAgIHJlbWVtYmVyVXBncmFkZTogZmFsc2UsXG4gICAgICAgICAgICBhZGRUcmFpbGluZ1NsYXNoOiB0cnVlLFxuICAgICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0cnVlLFxuICAgICAgICAgICAgcGVyTWVzc2FnZURlZmxhdGU6IHtcbiAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDEwMjQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNwb3J0T3B0aW9uczoge30sXG4gICAgICAgICAgICBjbG9zZU9uQmVmb3JldW5sb2FkOiBmYWxzZSxcbiAgICAgICAgfSwgb3B0cyk7XG4gICAgICAgIHRoaXMub3B0cy5wYXRoID1cbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoLnJlcGxhY2UoL1xcLyQvLCBcIlwiKSArXG4gICAgICAgICAgICAgICAgKHRoaXMub3B0cy5hZGRUcmFpbGluZ1NsYXNoID8gXCIvXCIgOiBcIlwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdHMucXVlcnkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMub3B0cy5xdWVyeSA9IGRlY29kZSh0aGlzLm9wdHMucXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNldCBvbiBoYW5kc2hha2VcbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXBncmFkZXMgPSBudWxsO1xuICAgICAgICB0aGlzLnBpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXQgPSBudWxsO1xuICAgICAgICAvLyBzZXQgb24gaGVhcnRiZWF0XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXRUaW1lciA9IG51bGw7XG4gICAgICAgIGlmICh0eXBlb2YgYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLmNsb3NlT25CZWZvcmV1bmxvYWQpIHtcbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IGNsb3NlcyB0aGUgY29ubmVjdGlvbiB3aGVuIHRoZSBcImJlZm9yZXVubG9hZFwiIGV2ZW50IGlzIGVtaXR0ZWQgYnV0IG5vdCBDaHJvbWUuIFRoaXMgZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmVzIGV2ZXJ5IGJyb3dzZXIgYmVoYXZlcyB0aGUgc2FtZSAobm8gXCJkaXNjb25uZWN0XCIgZXZlbnQgYXQgdGhlIFNvY2tldC5JTyBsZXZlbCB3aGVuIHRoZSBwYWdlIGlzXG4gICAgICAgICAgICAgICAgLy8gY2xvc2VkL3JlbG9hZGVkKVxuICAgICAgICAgICAgICAgIHRoaXMuYmVmb3JldW5sb2FkRXZlbnRMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaWxlbnRseSBjbG9zZSB0aGUgdHJhbnNwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJiZWZvcmV1bmxvYWRcIiwgdGhpcy5iZWZvcmV1bmxvYWRFdmVudExpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5ob3N0bmFtZSAhPT0gXCJsb2NhbGhvc3RcIikge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmbGluZUV2ZW50TGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25DbG9zZShcInRyYW5zcG9ydCBjbG9zZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJuZXR3b3JrIGNvbm5lY3Rpb24gbG9zdFwiLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJvZmZsaW5lXCIsIHRoaXMub2ZmbGluZUV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0cmFuc3BvcnQgb2YgdGhlIGdpdmVuIHR5cGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRyYW5zcG9ydCBuYW1lXG4gICAgICogQHJldHVybiB7VHJhbnNwb3J0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY3JlYXRlVHJhbnNwb3J0KG5hbWUpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdHMucXVlcnkpO1xuICAgICAgICAvLyBhcHBlbmQgZW5naW5lLmlvIHByb3RvY29sIGlkZW50aWZpZXJcbiAgICAgICAgcXVlcnkuRUlPID0gcHJvdG9jb2w7XG4gICAgICAgIC8vIHRyYW5zcG9ydCBuYW1lXG4gICAgICAgIHF1ZXJ5LnRyYW5zcG9ydCA9IG5hbWU7XG4gICAgICAgIC8vIHNlc3Npb24gaWQgaWYgd2UgYWxyZWFkeSBoYXZlIG9uZVxuICAgICAgICBpZiAodGhpcy5pZClcbiAgICAgICAgICAgIHF1ZXJ5LnNpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdHMsIHtcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgc29ja2V0OiB0aGlzLFxuICAgICAgICAgICAgaG9zdG5hbWU6IHRoaXMuaG9zdG5hbWUsXG4gICAgICAgICAgICBzZWN1cmU6IHRoaXMuc2VjdXJlLFxuICAgICAgICAgICAgcG9ydDogdGhpcy5wb3J0LFxuICAgICAgICB9LCB0aGlzLm9wdHMudHJhbnNwb3J0T3B0aW9uc1tuYW1lXSk7XG4gICAgICAgIHJldHVybiBuZXcgdHJhbnNwb3J0c1tuYW1lXShvcHRzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdHJhbnNwb3J0IHRvIHVzZSBhbmQgc3RhcnRzIHByb2JlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvcGVuKCkge1xuICAgICAgICBsZXQgdHJhbnNwb3J0O1xuICAgICAgICBpZiAodGhpcy5vcHRzLnJlbWVtYmVyVXBncmFkZSAmJlxuICAgICAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyAmJlxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnRzLmluZGV4T2YoXCJ3ZWJzb2NrZXRcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSBcIndlYnNvY2tldFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKDAgPT09IHRoaXMudHJhbnNwb3J0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIEVtaXQgZXJyb3Igb24gbmV4dCB0aWNrIHNvIGl0IGNhbiBiZSBsaXN0ZW5lZCB0b1xuICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgXCJObyB0cmFuc3BvcnRzIGF2YWlsYWJsZVwiKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdHJhbnNwb3J0ID0gdGhpcy50cmFuc3BvcnRzWzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICAvLyBSZXRyeSB3aXRoIHRoZSBuZXh0IHRyYW5zcG9ydCBpZiB0aGUgdHJhbnNwb3J0IGlzIGRpc2FibGVkIChqc29ucDogZmFsc2UpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSB0aGlzLmNyZWF0ZVRyYW5zcG9ydCh0cmFuc3BvcnQpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydHMuc2hpZnQoKTtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyYW5zcG9ydC5vcGVuKCk7XG4gICAgICAgIHRoaXMuc2V0VHJhbnNwb3J0KHRyYW5zcG9ydCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGN1cnJlbnQgdHJhbnNwb3J0LiBEaXNhYmxlcyB0aGUgZXhpc3Rpbmcgb25lIChpZiBhbnkpLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzZXRUcmFuc3BvcnQodHJhbnNwb3J0KSB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zcG9ydCkge1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IHVwIHRyYW5zcG9ydFxuICAgICAgICB0aGlzLnRyYW5zcG9ydCA9IHRyYW5zcG9ydDtcbiAgICAgICAgLy8gc2V0IHVwIHRyYW5zcG9ydCBsaXN0ZW5lcnNcbiAgICAgICAgdHJhbnNwb3J0XG4gICAgICAgICAgICAub24oXCJkcmFpblwiLCB0aGlzLm9uRHJhaW4uYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcInBhY2tldFwiLCB0aGlzLm9uUGFja2V0LmJpbmQodGhpcykpXG4gICAgICAgICAgICAub24oXCJlcnJvclwiLCB0aGlzLm9uRXJyb3IuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcImNsb3NlXCIsIChyZWFzb24pID0+IHRoaXMub25DbG9zZShcInRyYW5zcG9ydCBjbG9zZVwiLCByZWFzb24pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJvYmVzIGEgdHJhbnNwb3J0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSB0cmFuc3BvcnQgbmFtZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJvYmUobmFtZSkge1xuICAgICAgICBsZXQgdHJhbnNwb3J0ID0gdGhpcy5jcmVhdGVUcmFuc3BvcnQobmFtZSk7XG4gICAgICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICBjb25zdCBvblRyYW5zcG9ydE9wZW4gPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5zZW5kKFt7IHR5cGU6IFwicGluZ1wiLCBkYXRhOiBcInByb2JlXCIgfV0pO1xuICAgICAgICAgICAgdHJhbnNwb3J0Lm9uY2UoXCJwYWNrZXRcIiwgKG1zZykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoXCJwb25nXCIgPT09IG1zZy50eXBlICYmIFwicHJvYmVcIiA9PT0gbXNnLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGdyYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGluZ1wiLCB0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRyYW5zcG9ydClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IFwid2Vic29ja2V0XCIgPT09IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5wYXVzZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcImNsb3NlZFwiID09PSB0aGlzLnJlYWR5U3RhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUcmFuc3BvcnQodHJhbnNwb3J0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydC5zZW5kKFt7IHR5cGU6IFwidXBncmFkZVwiIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkZVwiLCB0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBncmFkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKFwicHJvYmUgZXJyb3JcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgZXJyLnRyYW5zcG9ydCA9IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGVFcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBmcmVlemVUcmFuc3BvcnQoKSB7XG4gICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIC8vIEFueSBjYWxsYmFjayBjYWxsZWQgYnkgdHJhbnNwb3J0IHNob3VsZCBiZSBpZ25vcmVkIHNpbmNlIG5vd1xuICAgICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5jbG9zZSgpO1xuICAgICAgICAgICAgdHJhbnNwb3J0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgYW55IGVycm9yIHRoYXQgaGFwcGVucyB3aGlsZSBwcm9iaW5nXG4gICAgICAgIGNvbnN0IG9uZXJyb3IgPSAoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihcInByb2JlIGVycm9yOiBcIiArIGVycik7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBlcnJvci50cmFuc3BvcnQgPSB0cmFuc3BvcnQubmFtZTtcbiAgICAgICAgICAgIGZyZWV6ZVRyYW5zcG9ydCgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJ1cGdyYWRlRXJyb3JcIiwgZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBvblRyYW5zcG9ydENsb3NlKCkge1xuICAgICAgICAgICAgb25lcnJvcihcInRyYW5zcG9ydCBjbG9zZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gV2hlbiB0aGUgc29ja2V0IGlzIGNsb3NlZCB3aGlsZSB3ZSdyZSBwcm9iaW5nXG4gICAgICAgIGZ1bmN0aW9uIG9uY2xvc2UoKSB7XG4gICAgICAgICAgICBvbmVycm9yKFwic29ja2V0IGNsb3NlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGVuIHRoZSBzb2NrZXQgaXMgdXBncmFkZWQgd2hpbGUgd2UncmUgcHJvYmluZ1xuICAgICAgICBmdW5jdGlvbiBvbnVwZ3JhZGUodG8pIHtcbiAgICAgICAgICAgIGlmICh0cmFuc3BvcnQgJiYgdG8ubmFtZSAhPT0gdHJhbnNwb3J0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBmcmVlemVUcmFuc3BvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBvbiB0aGUgdHJhbnNwb3J0IGFuZCBvbiBzZWxmXG4gICAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgICAgICB0cmFuc3BvcnQucmVtb3ZlTGlzdGVuZXIoXCJvcGVuXCIsIG9uVHJhbnNwb3J0T3Blbik7XG4gICAgICAgICAgICB0cmFuc3BvcnQucmVtb3ZlTGlzdGVuZXIoXCJlcnJvclwiLCBvbmVycm9yKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcImNsb3NlXCIsIG9uVHJhbnNwb3J0Q2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJjbG9zZVwiLCBvbmNsb3NlKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKFwidXBncmFkaW5nXCIsIG9udXBncmFkZSk7XG4gICAgICAgIH07XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwib3BlblwiLCBvblRyYW5zcG9ydE9wZW4pO1xuICAgICAgICB0cmFuc3BvcnQub25jZShcImVycm9yXCIsIG9uZXJyb3IpO1xuICAgICAgICB0cmFuc3BvcnQub25jZShcImNsb3NlXCIsIG9uVHJhbnNwb3J0Q2xvc2UpO1xuICAgICAgICB0aGlzLm9uY2UoXCJjbG9zZVwiLCBvbmNsb3NlKTtcbiAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkaW5nXCIsIG9udXBncmFkZSk7XG4gICAgICAgIGlmICh0aGlzLnVwZ3JhZGVzLmluZGV4T2YoXCJ3ZWJ0cmFuc3BvcnRcIikgIT09IC0xICYmXG4gICAgICAgICAgICBuYW1lICE9PSBcIndlYnRyYW5zcG9ydFwiKSB7XG4gICAgICAgICAgICAvLyBmYXZvciBXZWJUcmFuc3BvcnRcbiAgICAgICAgICAgIHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWZhaWxlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnQub3BlbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQub3BlbigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGNvbm5lY3Rpb24gaXMgZGVlbWVkIG9wZW4uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uT3BlbigpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJvcGVuXCI7XG4gICAgICAgIFNvY2tldC5wcmlvcldlYnNvY2tldFN1Y2Nlc3MgPSBcIndlYnNvY2tldFwiID09PSB0aGlzLnRyYW5zcG9ydC5uYW1lO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcIm9wZW5cIik7XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgLy8gd2UgY2hlY2sgZm9yIGByZWFkeVN0YXRlYCBpbiBjYXNlIGFuIGBvcGVuYFxuICAgICAgICAvLyBsaXN0ZW5lciBhbHJlYWR5IGNsb3NlZCB0aGUgc29ja2V0XG4gICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlICYmIHRoaXMub3B0cy51cGdyYWRlKSB7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICBjb25zdCBsID0gdGhpcy51cGdyYWRlcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvYmUodGhpcy51cGdyYWRlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBhIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25QYWNrZXQocGFja2V0KSB7XG4gICAgICAgIGlmIChcIm9wZW5pbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcImNsb3NpbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBhY2tldFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgLy8gU29ja2V0IGlzIGxpdmUgLSBhbnkgcGFja2V0IGNvdW50c1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJoZWFydGJlYXRcIik7XG4gICAgICAgICAgICB0aGlzLnJlc2V0UGluZ1RpbWVvdXQoKTtcbiAgICAgICAgICAgIHN3aXRjaCAocGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwib3BlblwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uSGFuZHNoYWtlKEpTT04ucGFyc2UocGFja2V0LmRhdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcInBpbmdcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kUGFja2V0KFwicG9uZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwaW5nXCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBvbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJlcnJvclwiOlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoXCJzZXJ2ZXIgZXJyb3JcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgZXJyLmNvZGUgPSBwYWNrZXQuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJtZXNzYWdlXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZGF0YVwiLCBwYWNrZXQuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwibWVzc2FnZVwiLCBwYWNrZXQuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGhhbmRzaGFrZSBjb21wbGV0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBoYW5kc2hha2Ugb2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkhhbmRzaGFrZShkYXRhKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiaGFuZHNoYWtlXCIsIGRhdGEpO1xuICAgICAgICB0aGlzLmlkID0gZGF0YS5zaWQ7XG4gICAgICAgIHRoaXMudHJhbnNwb3J0LnF1ZXJ5LnNpZCA9IGRhdGEuc2lkO1xuICAgICAgICB0aGlzLnVwZ3JhZGVzID0gdGhpcy5maWx0ZXJVcGdyYWRlcyhkYXRhLnVwZ3JhZGVzKTtcbiAgICAgICAgdGhpcy5waW5nSW50ZXJ2YWwgPSBkYXRhLnBpbmdJbnRlcnZhbDtcbiAgICAgICAgdGhpcy5waW5nVGltZW91dCA9IGRhdGEucGluZ1RpbWVvdXQ7XG4gICAgICAgIHRoaXMubWF4UGF5bG9hZCA9IGRhdGEubWF4UGF5bG9hZDtcbiAgICAgICAgdGhpcy5vbk9wZW4oKTtcbiAgICAgICAgLy8gSW4gY2FzZSBvcGVuIGhhbmRsZXIgY2xvc2VzIHNvY2tldFxuICAgICAgICBpZiAoXCJjbG9zZWRcIiA9PT0gdGhpcy5yZWFkeVN0YXRlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnJlc2V0UGluZ1RpbWVvdXQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBhbmQgcmVzZXRzIHBpbmcgdGltZW91dCB0aW1lciBiYXNlZCBvbiBzZXJ2ZXIgcGluZ3MuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHJlc2V0UGluZ1RpbWVvdXQoKSB7XG4gICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0Rm4odGhpcy5waW5nVGltZW91dFRpbWVyKTtcbiAgICAgICAgdGhpcy5waW5nVGltZW91dFRpbWVyID0gdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlKFwicGluZyB0aW1lb3V0XCIpO1xuICAgICAgICB9LCB0aGlzLnBpbmdJbnRlcnZhbCArIHRoaXMucGluZ1RpbWVvdXQpO1xuICAgICAgICBpZiAodGhpcy5vcHRzLmF1dG9VbnJlZikge1xuICAgICAgICAgICAgdGhpcy5waW5nVGltZW91dFRpbWVyLnVucmVmKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIG9uIGBkcmFpbmAgZXZlbnRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25EcmFpbigpIHtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlci5zcGxpY2UoMCwgdGhpcy5wcmV2QnVmZmVyTGVuKTtcbiAgICAgICAgLy8gc2V0dGluZyBwcmV2QnVmZmVyTGVuID0gMCBpcyB2ZXJ5IGltcG9ydGFudFxuICAgICAgICAvLyBmb3IgZXhhbXBsZSwgd2hlbiB1cGdyYWRpbmcsIHVwZ3JhZGUgcGFja2V0IGlzIHNlbnQgb3ZlcixcbiAgICAgICAgLy8gYW5kIGEgbm9uemVybyBwcmV2QnVmZmVyTGVuIGNvdWxkIGNhdXNlIHByb2JsZW1zIG9uIGBkcmFpbmBcbiAgICAgICAgdGhpcy5wcmV2QnVmZmVyTGVuID0gMDtcbiAgICAgICAgaWYgKDAgPT09IHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRyYWluXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZsdXNoIHdyaXRlIGJ1ZmZlcnMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGZsdXNoKCkge1xuICAgICAgICBpZiAoXCJjbG9zZWRcIiAhPT0gdGhpcy5yZWFkeVN0YXRlICYmXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC53cml0YWJsZSAmJlxuICAgICAgICAgICAgIXRoaXMudXBncmFkaW5nICYmXG4gICAgICAgICAgICB0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgcGFja2V0cyA9IHRoaXMuZ2V0V3JpdGFibGVQYWNrZXRzKCk7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5zZW5kKHBhY2tldHMpO1xuICAgICAgICAgICAgLy8ga2VlcCB0cmFjayBvZiBjdXJyZW50IGxlbmd0aCBvZiB3cml0ZUJ1ZmZlclxuICAgICAgICAgICAgLy8gc3BsaWNlIHdyaXRlQnVmZmVyIGFuZCBjYWxsYmFja0J1ZmZlciBvbiBgZHJhaW5gXG4gICAgICAgICAgICB0aGlzLnByZXZCdWZmZXJMZW4gPSBwYWNrZXRzLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZmx1c2hcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5zdXJlIHRoZSBlbmNvZGVkIHNpemUgb2YgdGhlIHdyaXRlQnVmZmVyIGlzIGJlbG93IHRoZSBtYXhQYXlsb2FkIHZhbHVlIHNlbnQgYnkgdGhlIHNlcnZlciAob25seSBmb3IgSFRUUFxuICAgICAqIGxvbmctcG9sbGluZylcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0V3JpdGFibGVQYWNrZXRzKCkge1xuICAgICAgICBjb25zdCBzaG91bGRDaGVja1BheWxvYWRTaXplID0gdGhpcy5tYXhQYXlsb2FkICYmXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5uYW1lID09PSBcInBvbGxpbmdcIiAmJlxuICAgICAgICAgICAgdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGggPiAxO1xuICAgICAgICBpZiAoIXNob3VsZENoZWNrUGF5bG9hZFNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndyaXRlQnVmZmVyO1xuICAgICAgICB9XG4gICAgICAgIGxldCBwYXlsb2FkU2l6ZSA9IDE7IC8vIGZpcnN0IHBhY2tldCB0eXBlXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMud3JpdGVCdWZmZXJbaV0uZGF0YTtcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgcGF5bG9hZFNpemUgKz0gYnl0ZUxlbmd0aChkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpID4gMCAmJiBwYXlsb2FkU2l6ZSA+IHRoaXMubWF4UGF5bG9hZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndyaXRlQnVmZmVyLnNsaWNlKDAsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF5bG9hZFNpemUgKz0gMjsgLy8gc2VwYXJhdG9yICsgcGFja2V0IHR5cGVcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy53cml0ZUJ1ZmZlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBtZXNzYWdlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyAtIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICogQHJldHVybiB7U29ja2V0fSBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgd3JpdGUobXNnLCBvcHRpb25zLCBmbikge1xuICAgICAgICB0aGlzLnNlbmRQYWNrZXQoXCJtZXNzYWdlXCIsIG1zZywgb3B0aW9ucywgZm4pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgc2VuZChtc2csIG9wdGlvbnMsIGZuKSB7XG4gICAgICAgIHRoaXMuc2VuZFBhY2tldChcIm1lc3NhZ2VcIiwgbXNnLCBvcHRpb25zLCBmbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlOiBwYWNrZXQgdHlwZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGF0YS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc2VuZFBhY2tldCh0eXBlLCBkYXRhLCBvcHRpb25zLCBmbikge1xuICAgICAgICBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2YgZGF0YSkge1xuICAgICAgICAgICAgZm4gPSBkYXRhO1xuICAgICAgICAgICAgZGF0YSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2Ygb3B0aW9ucykge1xuICAgICAgICAgICAgZm4gPSBvcHRpb25zO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiY2xvc2luZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgfHwgXCJjbG9zZWRcIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIG9wdGlvbnMuY29tcHJlc3MgPSBmYWxzZSAhPT0gb3B0aW9ucy5jb21wcmVzcztcbiAgICAgICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBhY2tldENyZWF0ZVwiLCBwYWNrZXQpO1xuICAgICAgICB0aGlzLndyaXRlQnVmZmVyLnB1c2gocGFja2V0KTtcbiAgICAgICAgaWYgKGZuKVxuICAgICAgICAgICAgdGhpcy5vbmNlKFwiZmx1c2hcIiwgZm4pO1xuICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlcyB0aGUgY29ubmVjdGlvbi5cbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgY29uc3QgY2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2UoXCJmb3JjZWQgY2xvc2VcIik7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5jbG9zZSgpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBjbGVhbnVwQW5kQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9mZihcInVwZ3JhZGVcIiwgY2xlYW51cEFuZENsb3NlKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKFwidXBncmFkZUVycm9yXCIsIGNsZWFudXBBbmRDbG9zZSk7XG4gICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCB3YWl0Rm9yVXBncmFkZSA9ICgpID0+IHtcbiAgICAgICAgICAgIC8vIHdhaXQgZm9yIHVwZ3JhZGUgdG8gZmluaXNoIHNpbmNlIHdlIGNhbid0IHNlbmQgcGFja2V0cyB3aGlsZSBwYXVzaW5nIGEgdHJhbnNwb3J0XG4gICAgICAgICAgICB0aGlzLm9uY2UoXCJ1cGdyYWRlXCIsIGNsZWFudXBBbmRDbG9zZSk7XG4gICAgICAgICAgICB0aGlzLm9uY2UoXCJ1cGdyYWRlRXJyb3JcIiwgY2xlYW51cEFuZENsb3NlKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFwib3BlbmluZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgfHwgXCJvcGVuXCIgPT09IHRoaXMucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJjbG9zaW5nXCI7XG4gICAgICAgICAgICBpZiAodGhpcy53cml0ZUJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uY2UoXCJkcmFpblwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnVwZ3JhZGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FpdEZvclVwZ3JhZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMudXBncmFkaW5nKSB7XG4gICAgICAgICAgICAgICAgd2FpdEZvclVwZ3JhZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHRyYW5zcG9ydCBlcnJvclxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycikge1xuICAgICAgICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgdGhpcy5vbkNsb3NlKFwidHJhbnNwb3J0IGVycm9yXCIsIGVycik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHRyYW5zcG9ydCBjbG9zZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25DbG9zZShyZWFzb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGlmIChcIm9wZW5pbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcImNsb3NpbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAvLyBjbGVhciB0aW1lcnNcbiAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0Rm4odGhpcy5waW5nVGltZW91dFRpbWVyKTtcbiAgICAgICAgICAgIC8vIHN0b3AgZXZlbnQgZnJvbSBmaXJpbmcgYWdhaW4gZm9yIHRyYW5zcG9ydFxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQucmVtb3ZlQWxsTGlzdGVuZXJzKFwiY2xvc2VcIik7XG4gICAgICAgICAgICAvLyBlbnN1cmUgdHJhbnNwb3J0IHdvbid0IHN0YXkgb3BlblxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQuY2xvc2UoKTtcbiAgICAgICAgICAgIC8vIGlnbm9yZSBmdXJ0aGVyIHRyYW5zcG9ydCBjb21tdW5pY2F0aW9uXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVtb3ZlRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihcImJlZm9yZXVubG9hZFwiLCB0aGlzLmJlZm9yZXVubG9hZEV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKFwib2ZmbGluZVwiLCB0aGlzLm9mZmxpbmVFdmVudExpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzZXQgcmVhZHkgc3RhdGVcbiAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgICAgICAvLyBjbGVhciBzZXNzaW9uIGlkXG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIC8vIGVtaXQgY2xvc2UgZXZlbnRcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY2xvc2VcIiwgcmVhc29uLCBkZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAvLyBjbGVhbiBidWZmZXJzIGFmdGVyLCBzbyB1c2VycyBjYW4gc3RpbGxcbiAgICAgICAgICAgIC8vIGdyYWIgdGhlIGJ1ZmZlcnMgb24gYGNsb3NlYCBldmVudFxuICAgICAgICAgICAgdGhpcy53cml0ZUJ1ZmZlciA9IFtdO1xuICAgICAgICAgICAgdGhpcy5wcmV2QnVmZmVyTGVuID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBGaWx0ZXJzIHVwZ3JhZGVzLCByZXR1cm5pbmcgb25seSB0aG9zZSBtYXRjaGluZyBjbGllbnQgdHJhbnNwb3J0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHVwZ3JhZGVzIC0gc2VydmVyIHVwZ3JhZGVzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBmaWx0ZXJVcGdyYWRlcyh1cGdyYWRlcykge1xuICAgICAgICBjb25zdCBmaWx0ZXJlZFVwZ3JhZGVzID0gW107XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgY29uc3QgaiA9IHVwZ3JhZGVzLmxlbmd0aDtcbiAgICAgICAgZm9yICg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh+dGhpcy50cmFuc3BvcnRzLmluZGV4T2YodXBncmFkZXNbaV0pKVxuICAgICAgICAgICAgICAgIGZpbHRlcmVkVXBncmFkZXMucHVzaCh1cGdyYWRlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkVXBncmFkZXM7XG4gICAgfVxufVxuU29ja2V0LnByb3RvY29sID0gcHJvdG9jb2w7XG4iLCJpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJlbmdpbmUuaW8tY2xpZW50XCI7XG4vKipcbiAqIFVSTCBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHVyaSAtIHVybFxuICogQHBhcmFtIHBhdGggLSB0aGUgcmVxdWVzdCBwYXRoIG9mIHRoZSBjb25uZWN0aW9uXG4gKiBAcGFyYW0gbG9jIC0gQW4gb2JqZWN0IG1lYW50IHRvIG1pbWljIHdpbmRvdy5sb2NhdGlvbi5cbiAqICAgICAgICBEZWZhdWx0cyB0byB3aW5kb3cubG9jYXRpb24uXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cmwodXJpLCBwYXRoID0gXCJcIiwgbG9jKSB7XG4gICAgbGV0IG9iaiA9IHVyaTtcbiAgICAvLyBkZWZhdWx0IHRvIHdpbmRvdy5sb2NhdGlvblxuICAgIGxvYyA9IGxvYyB8fCAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiICYmIGxvY2F0aW9uKTtcbiAgICBpZiAobnVsbCA9PSB1cmkpXG4gICAgICAgIHVyaSA9IGxvYy5wcm90b2NvbCArIFwiLy9cIiArIGxvYy5ob3N0O1xuICAgIC8vIHJlbGF0aXZlIHBhdGggc3VwcG9ydFxuICAgIGlmICh0eXBlb2YgdXJpID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGlmIChcIi9cIiA9PT0gdXJpLmNoYXJBdCgwKSkge1xuICAgICAgICAgICAgaWYgKFwiL1wiID09PSB1cmkuY2hhckF0KDEpKSB7XG4gICAgICAgICAgICAgICAgdXJpID0gbG9jLnByb3RvY29sICsgdXJpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJpID0gbG9jLmhvc3QgKyB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEvXihodHRwcz98d3NzPyk6XFwvXFwvLy50ZXN0KHVyaSkpIHtcbiAgICAgICAgICAgIGlmIChcInVuZGVmaW5lZFwiICE9PSB0eXBlb2YgbG9jKSB7XG4gICAgICAgICAgICAgICAgdXJpID0gbG9jLnByb3RvY29sICsgXCIvL1wiICsgdXJpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJpID0gXCJodHRwczovL1wiICsgdXJpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHBhcnNlXG4gICAgICAgIG9iaiA9IHBhcnNlKHVyaSk7XG4gICAgfVxuICAgIC8vIG1ha2Ugc3VyZSB3ZSB0cmVhdCBgbG9jYWxob3N0OjgwYCBhbmQgYGxvY2FsaG9zdGAgZXF1YWxseVxuICAgIGlmICghb2JqLnBvcnQpIHtcbiAgICAgICAgaWYgKC9eKGh0dHB8d3MpJC8udGVzdChvYmoucHJvdG9jb2wpKSB7XG4gICAgICAgICAgICBvYmoucG9ydCA9IFwiODBcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXihodHRwfHdzKXMkLy50ZXN0KG9iai5wcm90b2NvbCkpIHtcbiAgICAgICAgICAgIG9iai5wb3J0ID0gXCI0NDNcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBvYmoucGF0aCA9IG9iai5wYXRoIHx8IFwiL1wiO1xuICAgIGNvbnN0IGlwdjYgPSBvYmouaG9zdC5pbmRleE9mKFwiOlwiKSAhPT0gLTE7XG4gICAgY29uc3QgaG9zdCA9IGlwdjYgPyBcIltcIiArIG9iai5ob3N0ICsgXCJdXCIgOiBvYmouaG9zdDtcbiAgICAvLyBkZWZpbmUgdW5pcXVlIGlkXG4gICAgb2JqLmlkID0gb2JqLnByb3RvY29sICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIG9iai5wb3J0ICsgcGF0aDtcbiAgICAvLyBkZWZpbmUgaHJlZlxuICAgIG9iai5ocmVmID1cbiAgICAgICAgb2JqLnByb3RvY29sICtcbiAgICAgICAgICAgIFwiOi8vXCIgK1xuICAgICAgICAgICAgaG9zdCArXG4gICAgICAgICAgICAobG9jICYmIGxvYy5wb3J0ID09PSBvYmoucG9ydCA/IFwiXCIgOiBcIjpcIiArIG9iai5wb3J0KTtcbiAgICByZXR1cm4gb2JqO1xufVxuIiwiY29uc3Qgd2l0aE5hdGl2ZUFycmF5QnVmZmVyID0gdHlwZW9mIEFycmF5QnVmZmVyID09PSBcImZ1bmN0aW9uXCI7XG5jb25zdCBpc1ZpZXcgPSAob2JqKSA9PiB7XG4gICAgcmV0dXJuIHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IEFycmF5QnVmZmVyLmlzVmlldyhvYmopXG4gICAgICAgIDogb2JqLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyO1xufTtcbmNvbnN0IHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmNvbnN0IHdpdGhOYXRpdmVCbG9iID0gdHlwZW9mIEJsb2IgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICh0eXBlb2YgQmxvYiAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICB0b1N0cmluZy5jYWxsKEJsb2IpID09PSBcIltvYmplY3QgQmxvYkNvbnN0cnVjdG9yXVwiKTtcbmNvbnN0IHdpdGhOYXRpdmVGaWxlID0gdHlwZW9mIEZpbGUgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICh0eXBlb2YgRmlsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICB0b1N0cmluZy5jYWxsKEZpbGUpID09PSBcIltvYmplY3QgRmlsZUNvbnN0cnVjdG9yXVwiKTtcbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIG9iaiBpcyBhIEJ1ZmZlciwgYW4gQXJyYXlCdWZmZXIsIGEgQmxvYiBvciBhIEZpbGUuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQmluYXJ5KG9iaikge1xuICAgIHJldHVybiAoKHdpdGhOYXRpdmVBcnJheUJ1ZmZlciAmJiAob2JqIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgaXNWaWV3KG9iaikpKSB8fFxuICAgICAgICAod2l0aE5hdGl2ZUJsb2IgJiYgb2JqIGluc3RhbmNlb2YgQmxvYikgfHxcbiAgICAgICAgKHdpdGhOYXRpdmVGaWxlICYmIG9iaiBpbnN0YW5jZW9mIEZpbGUpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBoYXNCaW5hcnkob2JqLCB0b0pTT04pIHtcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IG9iai5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChoYXNCaW5hcnkob2JqW2ldKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGlzQmluYXJ5KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChvYmoudG9KU09OICYmXG4gICAgICAgIHR5cGVvZiBvYmoudG9KU09OID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gaGFzQmluYXJ5KG9iai50b0pTT04oKSwgdHJ1ZSk7XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSAmJiBoYXNCaW5hcnkob2JqW2tleV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4iLCJpbXBvcnQgeyBpc0JpbmFyeSB9IGZyb20gXCIuL2lzLWJpbmFyeS5qc1wiO1xuLyoqXG4gKiBSZXBsYWNlcyBldmVyeSBCdWZmZXIgfCBBcnJheUJ1ZmZlciB8IEJsb2IgfCBGaWxlIGluIHBhY2tldCB3aXRoIGEgbnVtYmVyZWQgcGxhY2Vob2xkZXIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldCAtIHNvY2tldC5pbyBldmVudCBwYWNrZXRcbiAqIEByZXR1cm4ge09iamVjdH0gd2l0aCBkZWNvbnN0cnVjdGVkIHBhY2tldCBhbmQgbGlzdCBvZiBidWZmZXJzXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvbnN0cnVjdFBhY2tldChwYWNrZXQpIHtcbiAgICBjb25zdCBidWZmZXJzID0gW107XG4gICAgY29uc3QgcGFja2V0RGF0YSA9IHBhY2tldC5kYXRhO1xuICAgIGNvbnN0IHBhY2sgPSBwYWNrZXQ7XG4gICAgcGFjay5kYXRhID0gX2RlY29uc3RydWN0UGFja2V0KHBhY2tldERhdGEsIGJ1ZmZlcnMpO1xuICAgIHBhY2suYXR0YWNobWVudHMgPSBidWZmZXJzLmxlbmd0aDsgLy8gbnVtYmVyIG9mIGJpbmFyeSAnYXR0YWNobWVudHMnXG4gICAgcmV0dXJuIHsgcGFja2V0OiBwYWNrLCBidWZmZXJzOiBidWZmZXJzIH07XG59XG5mdW5jdGlvbiBfZGVjb25zdHJ1Y3RQYWNrZXQoZGF0YSwgYnVmZmVycykge1xuICAgIGlmICghZGF0YSlcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgaWYgKGlzQmluYXJ5KGRhdGEpKSB7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0geyBfcGxhY2Vob2xkZXI6IHRydWUsIG51bTogYnVmZmVycy5sZW5ndGggfTtcbiAgICAgICAgYnVmZmVycy5wdXNoKGRhdGEpO1xuICAgICAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gICAgfVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgY29uc3QgbmV3RGF0YSA9IG5ldyBBcnJheShkYXRhLmxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbmV3RGF0YVtpXSA9IF9kZWNvbnN0cnVjdFBhY2tldChkYXRhW2ldLCBidWZmZXJzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIgJiYgIShkYXRhIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgY29uc3QgbmV3RGF0YSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGtleSkpIHtcbiAgICAgICAgICAgICAgICBuZXdEYXRhW2tleV0gPSBfZGVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtrZXldLCBidWZmZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG59XG4vKipcbiAqIFJlY29uc3RydWN0cyBhIGJpbmFyeSBwYWNrZXQgZnJvbSBpdHMgcGxhY2Vob2xkZXIgcGFja2V0IGFuZCBidWZmZXJzXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldCAtIGV2ZW50IHBhY2tldCB3aXRoIHBsYWNlaG9sZGVyc1xuICogQHBhcmFtIHtBcnJheX0gYnVmZmVycyAtIGJpbmFyeSBidWZmZXJzIHRvIHB1dCBpbiBwbGFjZWhvbGRlciBwb3NpdGlvbnNcbiAqIEByZXR1cm4ge09iamVjdH0gcmVjb25zdHJ1Y3RlZCBwYWNrZXRcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY29uc3RydWN0UGFja2V0KHBhY2tldCwgYnVmZmVycykge1xuICAgIHBhY2tldC5kYXRhID0gX3JlY29uc3RydWN0UGFja2V0KHBhY2tldC5kYXRhLCBidWZmZXJzKTtcbiAgICBkZWxldGUgcGFja2V0LmF0dGFjaG1lbnRzOyAvLyBubyBsb25nZXIgdXNlZnVsXG4gICAgcmV0dXJuIHBhY2tldDtcbn1cbmZ1bmN0aW9uIF9yZWNvbnN0cnVjdFBhY2tldChkYXRhLCBidWZmZXJzKSB7XG4gICAgaWYgKCFkYXRhKVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICBpZiAoZGF0YSAmJiBkYXRhLl9wbGFjZWhvbGRlciA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBpc0luZGV4VmFsaWQgPSB0eXBlb2YgZGF0YS5udW0gPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgICAgIGRhdGEubnVtID49IDAgJiZcbiAgICAgICAgICAgIGRhdGEubnVtIDwgYnVmZmVycy5sZW5ndGg7XG4gICAgICAgIGlmIChpc0luZGV4VmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBidWZmZXJzW2RhdGEubnVtXTsgLy8gYXBwcm9wcmlhdGUgYnVmZmVyIChzaG91bGQgYmUgbmF0dXJhbCBvcmRlciBhbnl3YXkpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbGxlZ2FsIGF0dGFjaG1lbnRzXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkYXRhW2ldID0gX3JlY29uc3RydWN0UGFja2V0KGRhdGFbaV0sIGJ1ZmZlcnMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSkge1xuICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IF9yZWNvbnN0cnVjdFBhY2tldChkYXRhW2tleV0sIGJ1ZmZlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xufVxuIiwiaW1wb3J0IHsgRW1pdHRlciB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG5pbXBvcnQgeyBkZWNvbnN0cnVjdFBhY2tldCwgcmVjb25zdHJ1Y3RQYWNrZXQgfSBmcm9tIFwiLi9iaW5hcnkuanNcIjtcbmltcG9ydCB7IGlzQmluYXJ5LCBoYXNCaW5hcnkgfSBmcm9tIFwiLi9pcy1iaW5hcnkuanNcIjtcbi8qKlxuICogVGhlc2Ugc3RyaW5ncyBtdXN0IG5vdCBiZSB1c2VkIGFzIGV2ZW50IG5hbWVzLCBhcyB0aGV5IGhhdmUgYSBzcGVjaWFsIG1lYW5pbmcuXG4gKi9cbmNvbnN0IFJFU0VSVkVEX0VWRU5UUyA9IFtcbiAgICBcImNvbm5lY3RcIixcbiAgICBcImNvbm5lY3RfZXJyb3JcIixcbiAgICBcImRpc2Nvbm5lY3RcIixcbiAgICBcImRpc2Nvbm5lY3RpbmdcIixcbiAgICBcIm5ld0xpc3RlbmVyXCIsXG4gICAgXCJyZW1vdmVMaXN0ZW5lclwiLCAvLyB1c2VkIGJ5IHRoZSBOb2RlLmpzIEV2ZW50RW1pdHRlclxuXTtcbi8qKlxuICogUHJvdG9jb2wgdmVyc2lvbi5cbiAqXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBjb25zdCBwcm90b2NvbCA9IDU7XG5leHBvcnQgdmFyIFBhY2tldFR5cGU7XG4oZnVuY3Rpb24gKFBhY2tldFR5cGUpIHtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJDT05ORUNUXCJdID0gMF0gPSBcIkNPTk5FQ1RcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJESVNDT05ORUNUXCJdID0gMV0gPSBcIkRJU0NPTk5FQ1RcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJFVkVOVFwiXSA9IDJdID0gXCJFVkVOVFwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkFDS1wiXSA9IDNdID0gXCJBQ0tcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJDT05ORUNUX0VSUk9SXCJdID0gNF0gPSBcIkNPTk5FQ1RfRVJST1JcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJCSU5BUllfRVZFTlRcIl0gPSA1XSA9IFwiQklOQVJZX0VWRU5UXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQklOQVJZX0FDS1wiXSA9IDZdID0gXCJCSU5BUllfQUNLXCI7XG59KShQYWNrZXRUeXBlIHx8IChQYWNrZXRUeXBlID0ge30pKTtcbi8qKlxuICogQSBzb2NrZXQuaW8gRW5jb2RlciBpbnN0YW5jZVxuICovXG5leHBvcnQgY2xhc3MgRW5jb2RlciB7XG4gICAgLyoqXG4gICAgICogRW5jb2RlciBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmVwbGFjZXIgLSBjdXN0b20gcmVwbGFjZXIgdG8gcGFzcyBkb3duIHRvIEpTT04ucGFyc2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihyZXBsYWNlcikge1xuICAgICAgICB0aGlzLnJlcGxhY2VyID0gcmVwbGFjZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZSBhIHBhY2tldCBhcyBhIHNpbmdsZSBzdHJpbmcgaWYgbm9uLWJpbmFyeSwgb3IgYXMgYVxuICAgICAqIGJ1ZmZlciBzZXF1ZW5jZSwgZGVwZW5kaW5nIG9uIHBhY2tldCB0eXBlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiAtIHBhY2tldCBvYmplY3RcbiAgICAgKi9cbiAgICBlbmNvZGUob2JqKSB7XG4gICAgICAgIGlmIChvYmoudHlwZSA9PT0gUGFja2V0VHlwZS5FVkVOVCB8fCBvYmoudHlwZSA9PT0gUGFja2V0VHlwZS5BQ0spIHtcbiAgICAgICAgICAgIGlmIChoYXNCaW5hcnkob2JqKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVuY29kZUFzQmluYXJ5KHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogb2JqLnR5cGUgPT09IFBhY2tldFR5cGUuRVZFTlRcbiAgICAgICAgICAgICAgICAgICAgICAgID8gUGFja2V0VHlwZS5CSU5BUllfRVZFTlRcbiAgICAgICAgICAgICAgICAgICAgICAgIDogUGFja2V0VHlwZS5CSU5BUllfQUNLLFxuICAgICAgICAgICAgICAgICAgICBuc3A6IG9iai5uc3AsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG9iai5kYXRhLFxuICAgICAgICAgICAgICAgICAgICBpZDogb2JqLmlkLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbdGhpcy5lbmNvZGVBc1N0cmluZyhvYmopXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlIHBhY2tldCBhcyBzdHJpbmcuXG4gICAgICovXG4gICAgZW5jb2RlQXNTdHJpbmcob2JqKSB7XG4gICAgICAgIC8vIGZpcnN0IGlzIHR5cGVcbiAgICAgICAgbGV0IHN0ciA9IFwiXCIgKyBvYmoudHlwZTtcbiAgICAgICAgLy8gYXR0YWNobWVudHMgaWYgd2UgaGF2ZSB0aGVtXG4gICAgICAgIGlmIChvYmoudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfRVZFTlQgfHxcbiAgICAgICAgICAgIG9iai50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9BQ0spIHtcbiAgICAgICAgICAgIHN0ciArPSBvYmouYXR0YWNobWVudHMgKyBcIi1cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiB3ZSBoYXZlIGEgbmFtZXNwYWNlIG90aGVyIHRoYW4gYC9gXG4gICAgICAgIC8vIHdlIGFwcGVuZCBpdCBmb2xsb3dlZCBieSBhIGNvbW1hIGAsYFxuICAgICAgICBpZiAob2JqLm5zcCAmJiBcIi9cIiAhPT0gb2JqLm5zcCkge1xuICAgICAgICAgICAgc3RyICs9IG9iai5uc3AgKyBcIixcIjtcbiAgICAgICAgfVxuICAgICAgICAvLyBpbW1lZGlhdGVseSBmb2xsb3dlZCBieSB0aGUgaWRcbiAgICAgICAgaWYgKG51bGwgIT0gb2JqLmlkKSB7XG4gICAgICAgICAgICBzdHIgKz0gb2JqLmlkO1xuICAgICAgICB9XG4gICAgICAgIC8vIGpzb24gZGF0YVxuICAgICAgICBpZiAobnVsbCAhPSBvYmouZGF0YSkge1xuICAgICAgICAgICAgc3RyICs9IEpTT04uc3RyaW5naWZ5KG9iai5kYXRhLCB0aGlzLnJlcGxhY2VyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNvZGUgcGFja2V0IGFzICdidWZmZXIgc2VxdWVuY2UnIGJ5IHJlbW92aW5nIGJsb2JzLCBhbmRcbiAgICAgKiBkZWNvbnN0cnVjdGluZyBwYWNrZXQgaW50byBvYmplY3Qgd2l0aCBwbGFjZWhvbGRlcnMgYW5kXG4gICAgICogYSBsaXN0IG9mIGJ1ZmZlcnMuXG4gICAgICovXG4gICAgZW5jb2RlQXNCaW5hcnkob2JqKSB7XG4gICAgICAgIGNvbnN0IGRlY29uc3RydWN0aW9uID0gZGVjb25zdHJ1Y3RQYWNrZXQob2JqKTtcbiAgICAgICAgY29uc3QgcGFjayA9IHRoaXMuZW5jb2RlQXNTdHJpbmcoZGVjb25zdHJ1Y3Rpb24ucGFja2V0KTtcbiAgICAgICAgY29uc3QgYnVmZmVycyA9IGRlY29uc3RydWN0aW9uLmJ1ZmZlcnM7XG4gICAgICAgIGJ1ZmZlcnMudW5zaGlmdChwYWNrKTsgLy8gYWRkIHBhY2tldCBpbmZvIHRvIGJlZ2lubmluZyBvZiBkYXRhIGxpc3RcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcnM7IC8vIHdyaXRlIGFsbCB0aGUgYnVmZmVyc1xuICAgIH1cbn1cbi8vIHNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84NTExMjgxL2NoZWNrLWlmLWEtdmFsdWUtaXMtYW4tb2JqZWN0LWluLWphdmFzY3JpcHRcbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBPYmplY3RdXCI7XG59XG4vKipcbiAqIEEgc29ja2V0LmlvIERlY29kZXIgaW5zdGFuY2VcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNsYXNzIERlY29kZXIgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBEZWNvZGVyIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZXZpdmVyIC0gY3VzdG9tIHJldml2ZXIgdG8gcGFzcyBkb3duIHRvIEpTT04uc3RyaW5naWZ5XG4gICAgICovXG4gICAgY29uc3RydWN0b3IocmV2aXZlcikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnJldml2ZXIgPSByZXZpdmVyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIGFuIGVuY29kZWQgcGFja2V0IHN0cmluZyBpbnRvIHBhY2tldCBKU09OLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9iaiAtIGVuY29kZWQgcGFja2V0XG4gICAgICovXG4gICAgYWRkKG9iaikge1xuICAgICAgICBsZXQgcGFja2V0O1xuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImdvdCBwbGFpbnRleHQgZGF0YSB3aGVuIHJlY29uc3RydWN0aW5nIGEgcGFja2V0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFja2V0ID0gdGhpcy5kZWNvZGVTdHJpbmcob2JqKTtcbiAgICAgICAgICAgIGNvbnN0IGlzQmluYXJ5RXZlbnQgPSBwYWNrZXQudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfRVZFTlQ7XG4gICAgICAgICAgICBpZiAoaXNCaW5hcnlFdmVudCB8fCBwYWNrZXQudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfQUNLKSB7XG4gICAgICAgICAgICAgICAgcGFja2V0LnR5cGUgPSBpc0JpbmFyeUV2ZW50ID8gUGFja2V0VHlwZS5FVkVOVCA6IFBhY2tldFR5cGUuQUNLO1xuICAgICAgICAgICAgICAgIC8vIGJpbmFyeSBwYWNrZXQncyBqc29uXG4gICAgICAgICAgICAgICAgdGhpcy5yZWNvbnN0cnVjdG9yID0gbmV3IEJpbmFyeVJlY29uc3RydWN0b3IocGFja2V0KTtcbiAgICAgICAgICAgICAgICAvLyBubyBhdHRhY2htZW50cywgbGFiZWxlZCBiaW5hcnkgYnV0IG5vIGJpbmFyeSBkYXRhIHRvIGZvbGxvd1xuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQuYXR0YWNobWVudHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwiZGVjb2RlZFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG5vbi1iaW5hcnkgZnVsbCBwYWNrZXRcbiAgICAgICAgICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJkZWNvZGVkXCIsIHBhY2tldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNCaW5hcnkob2JqKSB8fCBvYmouYmFzZTY0KSB7XG4gICAgICAgICAgICAvLyByYXcgYmluYXJ5IGRhdGFcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZ290IGJpbmFyeSBkYXRhIHdoZW4gbm90IHJlY29uc3RydWN0aW5nIGEgcGFja2V0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFja2V0ID0gdGhpcy5yZWNvbnN0cnVjdG9yLnRha2VCaW5hcnlEYXRhKG9iaik7XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldCkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZWNlaXZlZCBmaW5hbCBidWZmZXJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWNvbnN0cnVjdG9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwiZGVjb2RlZFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gdHlwZTogXCIgKyBvYmopO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlY29kZSBhIHBhY2tldCBTdHJpbmcgKEpTT04gZGF0YSlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHBhY2tldFxuICAgICAqL1xuICAgIGRlY29kZVN0cmluZyhzdHIpIHtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAvLyBsb29rIHVwIHR5cGVcbiAgICAgICAgY29uc3QgcCA9IHtcbiAgICAgICAgICAgIHR5cGU6IE51bWJlcihzdHIuY2hhckF0KDApKSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFBhY2tldFR5cGVbcC50eXBlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHBhY2tldCB0eXBlIFwiICsgcC50eXBlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb29rIHVwIGF0dGFjaG1lbnRzIGlmIHR5cGUgYmluYXJ5XG4gICAgICAgIGlmIChwLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UIHx8XG4gICAgICAgICAgICBwLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0FDSykge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgIHdoaWxlIChzdHIuY2hhckF0KCsraSkgIT09IFwiLVwiICYmIGkgIT0gc3RyLmxlbmd0aCkgeyB9XG4gICAgICAgICAgICBjb25zdCBidWYgPSBzdHIuc3Vic3RyaW5nKHN0YXJ0LCBpKTtcbiAgICAgICAgICAgIGlmIChidWYgIT0gTnVtYmVyKGJ1ZikgfHwgc3RyLmNoYXJBdChpKSAhPT0gXCItXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIGF0dGFjaG1lbnRzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcC5hdHRhY2htZW50cyA9IE51bWJlcihidWYpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvb2sgdXAgbmFtZXNwYWNlIChpZiBhbnkpXG4gICAgICAgIGlmIChcIi9cIiA9PT0gc3RyLmNoYXJBdChpICsgMSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgICB3aGlsZSAoKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYyA9IHN0ci5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgaWYgKFwiLFwiID09PSBjKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gc3RyLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwLm5zcCA9IHN0ci5zdWJzdHJpbmcoc3RhcnQsIGkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcC5uc3AgPSBcIi9cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb29rIHVwIGlkXG4gICAgICAgIGNvbnN0IG5leHQgPSBzdHIuY2hhckF0KGkgKyAxKTtcbiAgICAgICAgaWYgKFwiXCIgIT09IG5leHQgJiYgTnVtYmVyKG5leHQpID09IG5leHQpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgICB3aGlsZSAoKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYyA9IHN0ci5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgaWYgKG51bGwgPT0gYyB8fCBOdW1iZXIoYykgIT0gYykge1xuICAgICAgICAgICAgICAgICAgICAtLWk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gc3RyLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwLmlkID0gTnVtYmVyKHN0ci5zdWJzdHJpbmcoc3RhcnQsIGkgKyAxKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbG9vayB1cCBqc29uIGRhdGFcbiAgICAgICAgaWYgKHN0ci5jaGFyQXQoKytpKSkge1xuICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IHRoaXMudHJ5UGFyc2Uoc3RyLnN1YnN0cihpKSk7XG4gICAgICAgICAgICBpZiAoRGVjb2Rlci5pc1BheWxvYWRWYWxpZChwLnR5cGUsIHBheWxvYWQpKSB7XG4gICAgICAgICAgICAgICAgcC5kYXRhID0gcGF5bG9hZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgcGF5bG9hZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG4gICAgdHJ5UGFyc2Uoc3RyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShzdHIsIHRoaXMucmV2aXZlcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgaXNQYXlsb2FkVmFsaWQodHlwZSwgcGF5bG9hZCkge1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUOlxuICAgICAgICAgICAgICAgIHJldHVybiBpc09iamVjdChwYXlsb2FkKTtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5ESVNDT05ORUNUOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXlsb2FkID09PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVF9FUlJPUjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIgfHwgaXNPYmplY3QocGF5bG9hZCk7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRVZFTlQ6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0VWRU5UOlxuICAgICAgICAgICAgICAgIHJldHVybiAoQXJyYXkuaXNBcnJheShwYXlsb2FkKSAmJlxuICAgICAgICAgICAgICAgICAgICAodHlwZW9mIHBheWxvYWRbMF0gPT09IFwibnVtYmVyXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICh0eXBlb2YgcGF5bG9hZFswXSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJFU0VSVkVEX0VWRU5UUy5pbmRleE9mKHBheWxvYWRbMF0pID09PSAtMSkpKTtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5BQ0s6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0FDSzpcbiAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShwYXlsb2FkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWFsbG9jYXRlcyBhIHBhcnNlcidzIHJlc291cmNlc1xuICAgICAqL1xuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGlmICh0aGlzLnJlY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgIHRoaXMucmVjb25zdHJ1Y3Rvci5maW5pc2hlZFJlY29uc3RydWN0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBBIG1hbmFnZXIgb2YgYSBiaW5hcnkgZXZlbnQncyAnYnVmZmVyIHNlcXVlbmNlJy4gU2hvdWxkXG4gKiBiZSBjb25zdHJ1Y3RlZCB3aGVuZXZlciBhIHBhY2tldCBvZiB0eXBlIEJJTkFSWV9FVkVOVCBpc1xuICogZGVjb2RlZC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0XG4gKiBAcmV0dXJuIHtCaW5hcnlSZWNvbnN0cnVjdG9yfSBpbml0aWFsaXplZCByZWNvbnN0cnVjdG9yXG4gKi9cbmNsYXNzIEJpbmFyeVJlY29uc3RydWN0b3Ige1xuICAgIGNvbnN0cnVjdG9yKHBhY2tldCkge1xuICAgICAgICB0aGlzLnBhY2tldCA9IHBhY2tldDtcbiAgICAgICAgdGhpcy5idWZmZXJzID0gW107XG4gICAgICAgIHRoaXMucmVjb25QYWNrID0gcGFja2V0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gYmluYXJ5IGRhdGEgcmVjZWl2ZWQgZnJvbSBjb25uZWN0aW9uXG4gICAgICogYWZ0ZXIgYSBCSU5BUllfRVZFTlQgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtCdWZmZXIgfCBBcnJheUJ1ZmZlcn0gYmluRGF0YSAtIHRoZSByYXcgYmluYXJ5IGRhdGEgcmVjZWl2ZWRcbiAgICAgKiBAcmV0dXJuIHtudWxsIHwgT2JqZWN0fSByZXR1cm5zIG51bGwgaWYgbW9yZSBiaW5hcnkgZGF0YSBpcyBleHBlY3RlZCBvclxuICAgICAqICAgYSByZWNvbnN0cnVjdGVkIHBhY2tldCBvYmplY3QgaWYgYWxsIGJ1ZmZlcnMgaGF2ZSBiZWVuIHJlY2VpdmVkLlxuICAgICAqL1xuICAgIHRha2VCaW5hcnlEYXRhKGJpbkRhdGEpIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnB1c2goYmluRGF0YSk7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlcnMubGVuZ3RoID09PSB0aGlzLnJlY29uUGFjay5hdHRhY2htZW50cykge1xuICAgICAgICAgICAgLy8gZG9uZSB3aXRoIGJ1ZmZlciBsaXN0XG4gICAgICAgICAgICBjb25zdCBwYWNrZXQgPSByZWNvbnN0cnVjdFBhY2tldCh0aGlzLnJlY29uUGFjaywgdGhpcy5idWZmZXJzKTtcbiAgICAgICAgICAgIHRoaXMuZmluaXNoZWRSZWNvbnN0cnVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIHBhY2tldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xlYW5zIHVwIGJpbmFyeSBwYWNrZXQgcmVjb25zdHJ1Y3Rpb24gdmFyaWFibGVzLlxuICAgICAqL1xuICAgIGZpbmlzaGVkUmVjb25zdHJ1Y3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVjb25QYWNrID0gbnVsbDtcbiAgICAgICAgdGhpcy5idWZmZXJzID0gW107XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIG9uKG9iaiwgZXYsIGZuKSB7XG4gICAgb2JqLm9uKGV2LCBmbik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHN1YkRlc3Ryb3koKSB7XG4gICAgICAgIG9iai5vZmYoZXYsIGZuKTtcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgUGFja2V0VHlwZSB9IGZyb20gXCJzb2NrZXQuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBvbiB9IGZyb20gXCIuL29uLmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyLCB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG4vKipcbiAqIEludGVybmFsIGV2ZW50cy5cbiAqIFRoZXNlIGV2ZW50cyBjYW4ndCBiZSBlbWl0dGVkIGJ5IHRoZSB1c2VyLlxuICovXG5jb25zdCBSRVNFUlZFRF9FVkVOVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBjb25uZWN0OiAxLFxuICAgIGNvbm5lY3RfZXJyb3I6IDEsXG4gICAgZGlzY29ubmVjdDogMSxcbiAgICBkaXNjb25uZWN0aW5nOiAxLFxuICAgIC8vIEV2ZW50RW1pdHRlciByZXNlcnZlZCBldmVudHM6IGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwjZXZlbnRzX2V2ZW50X25ld2xpc3RlbmVyXG4gICAgbmV3TGlzdGVuZXI6IDEsXG4gICAgcmVtb3ZlTGlzdGVuZXI6IDEsXG59KTtcbi8qKlxuICogQSBTb2NrZXQgaXMgdGhlIGZ1bmRhbWVudGFsIGNsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIHRoZSBzZXJ2ZXIuXG4gKlxuICogQSBTb2NrZXQgYmVsb25ncyB0byBhIGNlcnRhaW4gTmFtZXNwYWNlIChieSBkZWZhdWx0IC8pIGFuZCB1c2VzIGFuIHVuZGVybHlpbmcge0BsaW5rIE1hbmFnZXJ9IHRvIGNvbW11bmljYXRlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICpcbiAqIHNvY2tldC5vbihcImNvbm5lY3RcIiwgKCkgPT4ge1xuICogICBjb25zb2xlLmxvZyhcImNvbm5lY3RlZFwiKTtcbiAqIH0pO1xuICpcbiAqIC8vIHNlbmQgYW4gZXZlbnQgdG8gdGhlIHNlcnZlclxuICogc29ja2V0LmVtaXQoXCJmb29cIiwgXCJiYXJcIik7XG4gKlxuICogc29ja2V0Lm9uKFwiZm9vYmFyXCIsICgpID0+IHtcbiAqICAgLy8gYW4gZXZlbnQgd2FzIHJlY2VpdmVkIGZyb20gdGhlIHNlcnZlclxuICogfSk7XG4gKlxuICogLy8gdXBvbiBkaXNjb25uZWN0aW9uXG4gKiBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIChyZWFzb24pID0+IHtcbiAqICAgY29uc29sZS5sb2coYGRpc2Nvbm5lY3RlZCBkdWUgdG8gJHtyZWFzb259YCk7XG4gKiB9KTtcbiAqL1xuZXhwb3J0IGNsYXNzIFNvY2tldCBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIGBTb2NrZXRgIGNvbnN0cnVjdG9yLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGlvLCBuc3AsIG9wdHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHNvY2tldCBpcyBjdXJyZW50bHkgY29ubmVjdGVkIHRvIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gICAgICAgICAqXG4gICAgICAgICAqIHNvY2tldC5vbihcImNvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5jb25uZWN0ZWQpOyAvLyB0cnVlXG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsICgpID0+IHtcbiAgICAgICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuY29ubmVjdGVkKTsgLy8gZmFsc2VcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgY29ubmVjdGlvbiBzdGF0ZSB3YXMgcmVjb3ZlcmVkIGFmdGVyIGEgdGVtcG9yYXJ5IGRpc2Nvbm5lY3Rpb24uIEluIHRoYXQgY2FzZSwgYW55IG1pc3NlZCBwYWNrZXRzIHdpbGxcbiAgICAgICAgICogYmUgdHJhbnNtaXR0ZWQgYnkgdGhlIHNlcnZlci5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVjb3ZlcmVkID0gZmFsc2U7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCdWZmZXIgZm9yIHBhY2tldHMgcmVjZWl2ZWQgYmVmb3JlIHRoZSBDT05ORUNUIHBhY2tldFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWNlaXZlQnVmZmVyID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCdWZmZXIgZm9yIHBhY2tldHMgdGhhdCB3aWxsIGJlIHNlbnQgb25jZSB0aGUgc29ja2V0IGlzIGNvbm5lY3RlZFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZW5kQnVmZmVyID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcXVldWUgb2YgcGFja2V0cyB0byBiZSBzZW50IHdpdGggcmV0cnkgaW4gY2FzZSBvZiBmYWlsdXJlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBQYWNrZXRzIGFyZSBzZW50IG9uZSBieSBvbmUsIGVhY2ggd2FpdGluZyBmb3IgdGhlIHNlcnZlciBhY2tub3dsZWRnZW1lbnQsIGluIG9yZGVyIHRvIGd1YXJhbnRlZSB0aGUgZGVsaXZlcnkgb3JkZXIuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgICogQSBzZXF1ZW5jZSB0byBnZW5lcmF0ZSB0aGUgSUQgb2YgdGhlIHtAbGluayBRdWV1ZWRQYWNrZXR9LlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcXVldWVTZXEgPSAwO1xuICAgICAgICB0aGlzLmlkcyA9IDA7XG4gICAgICAgIHRoaXMuYWNrcyA9IHt9O1xuICAgICAgICB0aGlzLmZsYWdzID0ge307XG4gICAgICAgIHRoaXMuaW8gPSBpbztcbiAgICAgICAgdGhpcy5uc3AgPSBuc3A7XG4gICAgICAgIGlmIChvcHRzICYmIG9wdHMuYXV0aCkge1xuICAgICAgICAgICAgdGhpcy5hdXRoID0gb3B0cy5hdXRoO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX29wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRzKTtcbiAgICAgICAgaWYgKHRoaXMuaW8uX2F1dG9Db25uZWN0KVxuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHNvY2tldCBpcyBjdXJyZW50bHkgZGlzY29ubmVjdGVkXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5kaXNjb25uZWN0ZWQpOyAvLyBmYWxzZVxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuZGlzY29ubmVjdGVkKTsgLy8gdHJ1ZVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGdldCBkaXNjb25uZWN0ZWQoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5jb25uZWN0ZWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZSB0byBvcGVuLCBjbG9zZSBhbmQgcGFja2V0IGV2ZW50c1xuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdWJFdmVudHMoKSB7XG4gICAgICAgIGlmICh0aGlzLnN1YnMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGlvID0gdGhpcy5pbztcbiAgICAgICAgdGhpcy5zdWJzID0gW1xuICAgICAgICAgICAgb24oaW8sIFwib3BlblwiLCB0aGlzLm9ub3Blbi5iaW5kKHRoaXMpKSxcbiAgICAgICAgICAgIG9uKGlvLCBcInBhY2tldFwiLCB0aGlzLm9ucGFja2V0LmJpbmQodGhpcykpLFxuICAgICAgICAgICAgb24oaW8sIFwiZXJyb3JcIiwgdGhpcy5vbmVycm9yLmJpbmQodGhpcykpLFxuICAgICAgICAgICAgb24oaW8sIFwiY2xvc2VcIiwgdGhpcy5vbmNsb3NlLmJpbmQodGhpcykpLFxuICAgICAgICBdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBTb2NrZXQgd2lsbCB0cnkgdG8gcmVjb25uZWN0IHdoZW4gaXRzIE1hbmFnZXIgY29ubmVjdHMgb3IgcmVjb25uZWN0cy5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAgICAgKlxuICAgICAqIGNvbnNvbGUubG9nKHNvY2tldC5hY3RpdmUpOyAvLyB0cnVlXG4gICAgICpcbiAgICAgKiBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIChyZWFzb24pID0+IHtcbiAgICAgKiAgIGlmIChyZWFzb24gPT09IFwiaW8gc2VydmVyIGRpc2Nvbm5lY3RcIikge1xuICAgICAqICAgICAvLyB0aGUgZGlzY29ubmVjdGlvbiB3YXMgaW5pdGlhdGVkIGJ5IHRoZSBzZXJ2ZXIsIHlvdSBuZWVkIHRvIG1hbnVhbGx5IHJlY29ubmVjdFxuICAgICAqICAgICBjb25zb2xlLmxvZyhzb2NrZXQuYWN0aXZlKTsgLy8gZmFsc2VcbiAgICAgKiAgIH1cbiAgICAgKiAgIC8vIGVsc2UgdGhlIHNvY2tldCB3aWxsIGF1dG9tYXRpY2FsbHkgdHJ5IHRvIHJlY29ubmVjdFxuICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmFjdGl2ZSk7IC8vIHRydWVcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBnZXQgYWN0aXZlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLnN1YnM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFwiT3BlbnNcIiB0aGUgc29ja2V0LlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbyh7XG4gICAgICogICBhdXRvQ29ubmVjdDogZmFsc2VcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5jb25uZWN0KCk7XG4gICAgICovXG4gICAgY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIHRoaXMuc3ViRXZlbnRzKCk7XG4gICAgICAgIGlmICghdGhpcy5pb1tcIl9yZWNvbm5lY3RpbmdcIl0pXG4gICAgICAgICAgICB0aGlzLmlvLm9wZW4oKTsgLy8gZW5zdXJlIG9wZW5cbiAgICAgICAgaWYgKFwib3BlblwiID09PSB0aGlzLmlvLl9yZWFkeVN0YXRlKVxuICAgICAgICAgICAgdGhpcy5vbm9wZW4oKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFsaWFzIGZvciB7QGxpbmsgY29ubmVjdCgpfS5cbiAgICAgKi9cbiAgICBvcGVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgYG1lc3NhZ2VgIGV2ZW50LlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgbWltaWNzIHRoZSBXZWJTb2NrZXQuc2VuZCgpIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYlNvY2tldC9zZW5kXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5zZW5kKFwiaGVsbG9cIik7XG4gICAgICpcbiAgICAgKiAvLyB0aGlzIGlzIGVxdWl2YWxlbnQgdG9cbiAgICAgKiBzb2NrZXQuZW1pdChcIm1lc3NhZ2VcIiwgXCJoZWxsb1wiKTtcbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIHNlbmQoLi4uYXJncykge1xuICAgICAgICBhcmdzLnVuc2hpZnQoXCJtZXNzYWdlXCIpO1xuICAgICAgICB0aGlzLmVtaXQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZSBgZW1pdGAuXG4gICAgICogSWYgdGhlIGV2ZW50IGlzIGluIGBldmVudHNgLCBpdCdzIGVtaXR0ZWQgbm9ybWFsbHkuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5lbWl0KFwiaGVsbG9cIiwgXCJ3b3JsZFwiKTtcbiAgICAgKlxuICAgICAqIC8vIGFsbCBzZXJpYWxpemFibGUgZGF0YXN0cnVjdHVyZXMgYXJlIHN1cHBvcnRlZCAobm8gbmVlZCB0byBjYWxsIEpTT04uc3RyaW5naWZ5KVxuICAgICAqIHNvY2tldC5lbWl0KFwiaGVsbG9cIiwgMSwgXCIyXCIsIHsgMzogW1wiNFwiXSwgNTogVWludDhBcnJheS5mcm9tKFs2XSkgfSk7XG4gICAgICpcbiAgICAgKiAvLyB3aXRoIGFuIGFja25vd2xlZGdlbWVudCBmcm9tIHRoZSBzZXJ2ZXJcbiAgICAgKiBzb2NrZXQuZW1pdChcImhlbGxvXCIsIFwid29ybGRcIiwgKHZhbCkgPT4ge1xuICAgICAqICAgLy8gLi4uXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBlbWl0KGV2LCAuLi5hcmdzKSB7XG4gICAgICAgIGlmIChSRVNFUlZFRF9FVkVOVFMuaGFzT3duUHJvcGVydHkoZXYpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiJyArIGV2LnRvU3RyaW5nKCkgKyAnXCIgaXMgYSByZXNlcnZlZCBldmVudCBuYW1lJyk7XG4gICAgICAgIH1cbiAgICAgICAgYXJncy51bnNoaWZ0KGV2KTtcbiAgICAgICAgaWYgKHRoaXMuX29wdHMucmV0cmllcyAmJiAhdGhpcy5mbGFncy5mcm9tUXVldWUgJiYgIXRoaXMuZmxhZ3Mudm9sYXRpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZFRvUXVldWUoYXJncyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYWNrZXQgPSB7XG4gICAgICAgICAgICB0eXBlOiBQYWNrZXRUeXBlLkVWRU5ULFxuICAgICAgICAgICAgZGF0YTogYXJncyxcbiAgICAgICAgfTtcbiAgICAgICAgcGFja2V0Lm9wdGlvbnMgPSB7fTtcbiAgICAgICAgcGFja2V0Lm9wdGlvbnMuY29tcHJlc3MgPSB0aGlzLmZsYWdzLmNvbXByZXNzICE9PSBmYWxzZTtcbiAgICAgICAgLy8gZXZlbnQgYWNrIGNhbGxiYWNrXG4gICAgICAgIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gdGhpcy5pZHMrKztcbiAgICAgICAgICAgIGNvbnN0IGFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlckFja0NhbGxiYWNrKGlkLCBhY2spO1xuICAgICAgICAgICAgcGFja2V0LmlkID0gaWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXNUcmFuc3BvcnRXcml0YWJsZSA9IHRoaXMuaW8uZW5naW5lICYmXG4gICAgICAgICAgICB0aGlzLmlvLmVuZ2luZS50cmFuc3BvcnQgJiZcbiAgICAgICAgICAgIHRoaXMuaW8uZW5naW5lLnRyYW5zcG9ydC53cml0YWJsZTtcbiAgICAgICAgY29uc3QgZGlzY2FyZFBhY2tldCA9IHRoaXMuZmxhZ3Mudm9sYXRpbGUgJiYgKCFpc1RyYW5zcG9ydFdyaXRhYmxlIHx8ICF0aGlzLmNvbm5lY3RlZCk7XG4gICAgICAgIGlmIChkaXNjYXJkUGFja2V0KSB7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMubm90aWZ5T3V0Z29pbmdMaXN0ZW5lcnMocGFja2V0KTtcbiAgICAgICAgICAgIHRoaXMucGFja2V0KHBhY2tldCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRCdWZmZXIucHVzaChwYWNrZXQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmxhZ3MgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlZ2lzdGVyQWNrQ2FsbGJhY2soaWQsIGFjaykge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAoX2EgPSB0aGlzLmZsYWdzLnRpbWVvdXQpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IHRoaXMuX29wdHMuYWNrVGltZW91dDtcbiAgICAgICAgaWYgKHRpbWVvdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5hY2tzW2lkXSA9IGFjaztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRpbWVyID0gdGhpcy5pby5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuYWNrc1tpZF07XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc2VuZEJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbmRCdWZmZXJbaV0uaWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZEJ1ZmZlci5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWNrLmNhbGwodGhpcywgbmV3IEVycm9yKFwib3BlcmF0aW9uIGhhcyB0aW1lZCBvdXRcIikpO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgdGhpcy5hY2tzW2lkXSA9ICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0aGlzLmlvLmNsZWFyVGltZW91dEZuKHRpbWVyKTtcbiAgICAgICAgICAgIGFjay5hcHBseSh0aGlzLCBbbnVsbCwgLi4uYXJnc10pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbWl0cyBhbiBldmVudCBhbmQgd2FpdHMgZm9yIGFuIGFja25vd2xlZGdlbWVudFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyB3aXRob3V0IHRpbWVvdXRcbiAgICAgKiBjb25zdCByZXNwb25zZSA9IGF3YWl0IHNvY2tldC5lbWl0V2l0aEFjayhcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICpcbiAgICAgKiAvLyB3aXRoIGEgc3BlY2lmaWMgdGltZW91dFxuICAgICAqIHRyeSB7XG4gICAgICogICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHNvY2tldC50aW1lb3V0KDEwMDApLmVtaXRXaXRoQWNrKFwiaGVsbG9cIiwgXCJ3b3JsZFwiKTtcbiAgICAgKiB9IGNhdGNoIChlcnIpIHtcbiAgICAgKiAgIC8vIHRoZSBzZXJ2ZXIgZGlkIG5vdCBhY2tub3dsZWRnZSB0aGUgZXZlbnQgaW4gdGhlIGdpdmVuIGRlbGF5XG4gICAgICogfVxuICAgICAqXG4gICAgICogQHJldHVybiBhIFByb21pc2UgdGhhdCB3aWxsIGJlIGZ1bGZpbGxlZCB3aGVuIHRoZSBzZXJ2ZXIgYWNrbm93bGVkZ2VzIHRoZSBldmVudFxuICAgICAqL1xuICAgIGVtaXRXaXRoQWNrKGV2LCAuLi5hcmdzKSB7XG4gICAgICAgIC8vIHRoZSB0aW1lb3V0IGZsYWcgaXMgb3B0aW9uYWxcbiAgICAgICAgY29uc3Qgd2l0aEVyciA9IHRoaXMuZmxhZ3MudGltZW91dCAhPT0gdW5kZWZpbmVkIHx8IHRoaXMuX29wdHMuYWNrVGltZW91dCAhPT0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgYXJncy5wdXNoKChhcmcxLCBhcmcyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHdpdGhFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFyZzEgPyByZWplY3QoYXJnMSkgOiByZXNvbHZlKGFyZzIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoYXJnMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoZXYsIC4uLmFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkIHRoZSBwYWNrZXQgdG8gdGhlIHF1ZXVlLlxuICAgICAqIEBwYXJhbSBhcmdzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkVG9RdWV1ZShhcmdzKSB7XG4gICAgICAgIGxldCBhY2s7XG4gICAgICAgIGlmICh0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgICAgICAgaWQ6IHRoaXMuX3F1ZXVlU2VxKyssXG4gICAgICAgICAgICB0cnlDb3VudDogMCxcbiAgICAgICAgICAgIHBlbmRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgIGZsYWdzOiBPYmplY3QuYXNzaWduKHsgZnJvbVF1ZXVlOiB0cnVlIH0sIHRoaXMuZmxhZ3MpLFxuICAgICAgICB9O1xuICAgICAgICBhcmdzLnB1c2goKGVyciwgLi4ucmVzcG9uc2VBcmdzKSA9PiB7XG4gICAgICAgICAgICBpZiAocGFja2V0ICE9PSB0aGlzLl9xdWV1ZVswXSkge1xuICAgICAgICAgICAgICAgIC8vIHRoZSBwYWNrZXQgaGFzIGFscmVhZHkgYmVlbiBhY2tub3dsZWRnZWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBoYXNFcnJvciA9IGVyciAhPT0gbnVsbDtcbiAgICAgICAgICAgIGlmIChoYXNFcnJvcikge1xuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQudHJ5Q291bnQgPiB0aGlzLl9vcHRzLnJldHJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIGlmIChhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgYWNrKG51bGwsIC4uLnJlc3BvbnNlQXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFja2V0LnBlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kcmFpblF1ZXVlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKHBhY2tldCk7XG4gICAgICAgIHRoaXMuX2RyYWluUXVldWUoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZCB0aGUgZmlyc3QgcGFja2V0IG9mIHRoZSBxdWV1ZSwgYW5kIHdhaXQgZm9yIGFuIGFja25vd2xlZGdlbWVudCBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICogQHBhcmFtIGZvcmNlIC0gd2hldGhlciB0byByZXNlbmQgYSBwYWNrZXQgdGhhdCBoYXMgbm90IGJlZW4gYWNrbm93bGVkZ2VkIHlldFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZHJhaW5RdWV1ZShmb3JjZSA9IGZhbHNlKSB7XG4gICAgICAgIGlmICghdGhpcy5jb25uZWN0ZWQgfHwgdGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFja2V0ID0gdGhpcy5fcXVldWVbMF07XG4gICAgICAgIGlmIChwYWNrZXQucGVuZGluZyAmJiAhZm9yY2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwYWNrZXQucGVuZGluZyA9IHRydWU7XG4gICAgICAgIHBhY2tldC50cnlDb3VudCsrO1xuICAgICAgICB0aGlzLmZsYWdzID0gcGFja2V0LmZsYWdzO1xuICAgICAgICB0aGlzLmVtaXQuYXBwbHkodGhpcywgcGFja2V0LmFyZ3MpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHBhY2tldChwYWNrZXQpIHtcbiAgICAgICAgcGFja2V0Lm5zcCA9IHRoaXMubnNwO1xuICAgICAgICB0aGlzLmlvLl9wYWNrZXQocGFja2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZW5naW5lIGBvcGVuYC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25vcGVuKCkge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMuYXV0aCA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0aCgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbmRDb25uZWN0UGFja2V0KGRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zZW5kQ29ubmVjdFBhY2tldCh0aGlzLmF1dGgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgQ09OTkVDVCBwYWNrZXQgdG8gaW5pdGlhdGUgdGhlIFNvY2tldC5JTyBzZXNzaW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZW5kQ29ubmVjdFBhY2tldChkYXRhKSB7XG4gICAgICAgIHRoaXMucGFja2V0KHtcbiAgICAgICAgICAgIHR5cGU6IFBhY2tldFR5cGUuQ09OTkVDVCxcbiAgICAgICAgICAgIGRhdGE6IHRoaXMuX3BpZFxuICAgICAgICAgICAgICAgID8gT2JqZWN0LmFzc2lnbih7IHBpZDogdGhpcy5fcGlkLCBvZmZzZXQ6IHRoaXMuX2xhc3RPZmZzZXQgfSwgZGF0YSlcbiAgICAgICAgICAgICAgICA6IGRhdGEsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlbmdpbmUgb3IgbWFuYWdlciBgZXJyb3JgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVyclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25lcnJvcihlcnIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0X2Vycm9yXCIsIGVycik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZW5naW5lIGBjbG9zZWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVhc29uXG4gICAgICogQHBhcmFtIGRlc2NyaXB0aW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmNsb3NlKHJlYXNvbiwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgZGVsZXRlIHRoaXMuaWQ7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZGlzY29ubmVjdFwiLCByZWFzb24sIGRlc2NyaXB0aW9uKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggc29ja2V0IHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ucGFja2V0KHBhY2tldCkge1xuICAgICAgICBjb25zdCBzYW1lTmFtZXNwYWNlID0gcGFja2V0Lm5zcCA9PT0gdGhpcy5uc3A7XG4gICAgICAgIGlmICghc2FtZU5hbWVzcGFjZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgc3dpdGNoIChwYWNrZXQudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkNPTk5FQ1Q6XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldC5kYXRhICYmIHBhY2tldC5kYXRhLnNpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uY29ubmVjdChwYWNrZXQuZGF0YS5zaWQsIHBhY2tldC5kYXRhLnBpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNvbm5lY3RfZXJyb3JcIiwgbmV3IEVycm9yKFwiSXQgc2VlbXMgeW91IGFyZSB0cnlpbmcgdG8gcmVhY2ggYSBTb2NrZXQuSU8gc2VydmVyIGluIHYyLnggd2l0aCBhIHYzLnggY2xpZW50LCBidXQgdGhleSBhcmUgbm90IGNvbXBhdGlibGUgKG1vcmUgaW5mb3JtYXRpb24gaGVyZTogaHR0cHM6Ly9zb2NrZXQuaW8vZG9jcy92My9taWdyYXRpbmctZnJvbS0yLXgtdG8tMy0wLylcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5FVkVOVDpcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5CSU5BUllfRVZFTlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5vbmV2ZW50KHBhY2tldCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQUNLOlxuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkJJTkFSWV9BQ0s6XG4gICAgICAgICAgICAgICAgdGhpcy5vbmFjayhwYWNrZXQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkRJU0NPTk5FQ1Q6XG4gICAgICAgICAgICAgICAgdGhpcy5vbmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUX0VSUk9SOlxuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihwYWNrZXQuZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgZXJyLmRhdGEgPSBwYWNrZXQuZGF0YS5kYXRhO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY29ubmVjdF9lcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGEgc2VydmVyIGV2ZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25ldmVudChwYWNrZXQpIHtcbiAgICAgICAgY29uc3QgYXJncyA9IHBhY2tldC5kYXRhIHx8IFtdO1xuICAgICAgICBpZiAobnVsbCAhPSBwYWNrZXQuaWQpIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaCh0aGlzLmFjayhwYWNrZXQuaWQpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdEV2ZW50KGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWNlaXZlQnVmZmVyLnB1c2goT2JqZWN0LmZyZWV6ZShhcmdzKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZW1pdEV2ZW50KGFyZ3MpIHtcbiAgICAgICAgaWYgKHRoaXMuX2FueUxpc3RlbmVycyAmJiB0aGlzLl9hbnlMaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnMuc2xpY2UoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIuZW1pdC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgaWYgKHRoaXMuX3BpZCAmJiBhcmdzLmxlbmd0aCAmJiB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0T2Zmc2V0ID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFByb2R1Y2VzIGFuIGFjayBjYWxsYmFjayB0byBlbWl0IHdpdGggYW4gZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGFjayhpZCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgbGV0IHNlbnQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgICAvLyBwcmV2ZW50IGRvdWJsZSBjYWxsYmFja3NcbiAgICAgICAgICAgIGlmIChzZW50KVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgc2VsZi5wYWNrZXQoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFBhY2tldFR5cGUuQUNLLFxuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICBkYXRhOiBhcmdzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGEgc2VydmVyIGFja25vd2xlZ2VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25hY2socGFja2V0KSB7XG4gICAgICAgIGNvbnN0IGFjayA9IHRoaXMuYWNrc1twYWNrZXQuaWRdO1xuICAgICAgICBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2YgYWNrKSB7XG4gICAgICAgICAgICBhY2suYXBwbHkodGhpcywgcGFja2V0LmRhdGEpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuYWNrc1twYWNrZXQuaWRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHNlcnZlciBjb25uZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmNvbm5lY3QoaWQsIHBpZCkge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMucmVjb3ZlcmVkID0gcGlkICYmIHRoaXMuX3BpZCA9PT0gcGlkO1xuICAgICAgICB0aGlzLl9waWQgPSBwaWQ7IC8vIGRlZmluZWQgb25seSBpZiBjb25uZWN0aW9uIHN0YXRlIHJlY292ZXJ5IGlzIGVuYWJsZWRcbiAgICAgICAgdGhpcy5jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXRCdWZmZXJlZCgpO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNvbm5lY3RcIik7XG4gICAgICAgIHRoaXMuX2RyYWluUXVldWUodHJ1ZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVtaXQgYnVmZmVyZWQgZXZlbnRzIChyZWNlaXZlZCBhbmQgZW1pdHRlZCkuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGVtaXRCdWZmZXJlZCgpIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlQnVmZmVyLmZvckVhY2goKGFyZ3MpID0+IHRoaXMuZW1pdEV2ZW50KGFyZ3MpKTtcbiAgICAgICAgdGhpcy5yZWNlaXZlQnVmZmVyID0gW107XG4gICAgICAgIHRoaXMuc2VuZEJ1ZmZlci5mb3JFYWNoKChwYWNrZXQpID0+IHtcbiAgICAgICAgICAgIHRoaXMubm90aWZ5T3V0Z29pbmdMaXN0ZW5lcnMocGFja2V0KTtcbiAgICAgICAgICAgIHRoaXMucGFja2V0KHBhY2tldCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNlbmRCdWZmZXIgPSBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gc2VydmVyIGRpc2Nvbm5lY3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZGlzY29ubmVjdCgpIHtcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMub25jbG9zZShcImlvIHNlcnZlciBkaXNjb25uZWN0XCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBmb3JjZWQgY2xpZW50L3NlcnZlciBzaWRlIGRpc2Nvbm5lY3Rpb25zLFxuICAgICAqIHRoaXMgbWV0aG9kIGVuc3VyZXMgdGhlIG1hbmFnZXIgc3RvcHMgdHJhY2tpbmcgdXMgYW5kXG4gICAgICogdGhhdCByZWNvbm5lY3Rpb25zIGRvbid0IGdldCB0cmlnZ2VyZWQgZm9yIHRoaXMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGlmICh0aGlzLnN1YnMpIHtcbiAgICAgICAgICAgIC8vIGNsZWFuIHN1YnNjcmlwdGlvbnMgdG8gYXZvaWQgcmVjb25uZWN0aW9uc1xuICAgICAgICAgICAgdGhpcy5zdWJzLmZvckVhY2goKHN1YkRlc3Ryb3kpID0+IHN1YkRlc3Ryb3koKSk7XG4gICAgICAgICAgICB0aGlzLnN1YnMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pb1tcIl9kZXN0cm95XCJdKHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEaXNjb25uZWN0cyB0aGUgc29ja2V0IG1hbnVhbGx5LiBJbiB0aGF0IGNhc2UsIHRoZSBzb2NrZXQgd2lsbCBub3QgdHJ5IHRvIHJlY29ubmVjdC5cbiAgICAgKlxuICAgICAqIElmIHRoaXMgaXMgdGhlIGxhc3QgYWN0aXZlIFNvY2tldCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIE1hbmFnZXJ9LCB0aGUgbG93LWxldmVsIGNvbm5lY3Rpb24gd2lsbCBiZSBjbG9zZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIChyZWFzb24pID0+IHtcbiAgICAgKiAgIC8vIGNvbnNvbGUubG9nKHJlYXNvbik7IHByaW50cyBcImlvIGNsaWVudCBkaXNjb25uZWN0XCJcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5kaXNjb25uZWN0KCk7XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGFja2V0KHsgdHlwZTogUGFja2V0VHlwZS5ESVNDT05ORUNUIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlbW92ZSBzb2NrZXQgZnJvbSBwb29sXG4gICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIC8vIGZpcmUgZXZlbnRzXG4gICAgICAgICAgICB0aGlzLm9uY2xvc2UoXCJpbyBjbGllbnQgZGlzY29ubmVjdFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWxpYXMgZm9yIHtAbGluayBkaXNjb25uZWN0KCl9LlxuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY29tcHJlc3MgZmxhZy5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LmNvbXByZXNzKGZhbHNlKS5lbWl0KFwiaGVsbG9cIik7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tcHJlc3MgLSBpZiBgdHJ1ZWAsIGNvbXByZXNzZXMgdGhlIHNlbmRpbmcgZGF0YVxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIGNvbXByZXNzKGNvbXByZXNzKSB7XG4gICAgICAgIHRoaXMuZmxhZ3MuY29tcHJlc3MgPSBjb21wcmVzcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgYSBtb2RpZmllciBmb3IgYSBzdWJzZXF1ZW50IGV2ZW50IGVtaXNzaW9uIHRoYXQgdGhlIGV2ZW50IG1lc3NhZ2Ugd2lsbCBiZSBkcm9wcGVkIHdoZW4gdGhpcyBzb2NrZXQgaXMgbm90XG4gICAgICogcmVhZHkgdG8gc2VuZCBtZXNzYWdlcy5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnZvbGF0aWxlLmVtaXQoXCJoZWxsb1wiKTsgLy8gdGhlIHNlcnZlciBtYXkgb3IgbWF5IG5vdCByZWNlaXZlIGl0XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBzZWxmXG4gICAgICovXG4gICAgZ2V0IHZvbGF0aWxlKCkge1xuICAgICAgICB0aGlzLmZsYWdzLnZvbGF0aWxlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgYSBtb2RpZmllciBmb3IgYSBzdWJzZXF1ZW50IGV2ZW50IGVtaXNzaW9uIHRoYXQgdGhlIGNhbGxiYWNrIHdpbGwgYmUgY2FsbGVkIHdpdGggYW4gZXJyb3Igd2hlbiB0aGVcbiAgICAgKiBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCB3aXRob3V0IGFuIGFja25vd2xlZGdlbWVudCBmcm9tIHRoZSBzZXJ2ZXI6XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC50aW1lb3V0KDUwMDApLmVtaXQoXCJteS1ldmVudFwiLCAoZXJyKSA9PiB7XG4gICAgICogICBpZiAoZXJyKSB7XG4gICAgICogICAgIC8vIHRoZSBzZXJ2ZXIgZGlkIG5vdCBhY2tub3dsZWRnZSB0aGUgZXZlbnQgaW4gdGhlIGdpdmVuIGRlbGF5XG4gICAgICogICB9XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBzZWxmXG4gICAgICovXG4gICAgdGltZW91dCh0aW1lb3V0KSB7XG4gICAgICAgIHRoaXMuZmxhZ3MudGltZW91dCA9IHRpbWVvdXQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuIFRoZSBldmVudCBuYW1lIGlzIHBhc3NlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlXG4gICAgICogY2FsbGJhY2suXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5vbkFueSgoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBnb3QgJHtldmVudH1gKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIG9uQW55KGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycyA9IHRoaXMuX2FueUxpc3RlbmVycyB8fCBbXTtcbiAgICAgICAgdGhpcy5fYW55TGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLiBUaGUgZXZlbnQgbmFtZSBpcyBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZVxuICAgICAqIGNhbGxiYWNrLiBUaGUgbGlzdGVuZXIgaXMgYWRkZWQgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdGVuZXJzIGFycmF5LlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQucHJlcGVuZEFueSgoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBnb3QgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIHByZXBlbmRBbnkobGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fYW55TGlzdGVuZXJzID0gdGhpcy5fYW55TGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMudW5zaGlmdChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3QgY2F0Y2hBbGxMaXN0ZW5lciA9IChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYGdvdCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH1cbiAgICAgKlxuICAgICAqIHNvY2tldC5vbkFueShjYXRjaEFsbExpc3RlbmVyKTtcbiAgICAgKlxuICAgICAqIC8vIHJlbW92ZSBhIHNwZWNpZmljIGxpc3RlbmVyXG4gICAgICogc29ja2V0Lm9mZkFueShjYXRjaEFsbExpc3RlbmVyKTtcbiAgICAgKlxuICAgICAqIC8vIG9yIHJlbW92ZSBhbGwgbGlzdGVuZXJzXG4gICAgICogc29ja2V0Lm9mZkFueSgpO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgb2ZmQW55KGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5fYW55TGlzdGVuZXJzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2FueUxpc3RlbmVycztcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyID09PSBsaXN0ZW5lcnNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYW55TGlzdGVuZXJzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRoYXQgYXJlIGxpc3RlbmluZyBmb3IgYW55IGV2ZW50IHRoYXQgaXMgc3BlY2lmaWVkLiBUaGlzIGFycmF5IGNhbiBiZSBtYW5pcHVsYXRlZCxcbiAgICAgKiBlLmcuIHRvIHJlbW92ZSBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgbGlzdGVuZXJzQW55KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYW55TGlzdGVuZXJzIHx8IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuIFRoZSBldmVudCBuYW1lIGlzIHBhc3NlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlXG4gICAgICogY2FsbGJhY2suXG4gICAgICpcbiAgICAgKiBOb3RlOiBhY2tub3dsZWRnZW1lbnRzIHNlbnQgdG8gdGhlIHNlcnZlciBhcmUgbm90IGluY2x1ZGVkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQub25BbnlPdXRnb2luZygoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBzZW50IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBvbkFueU91dGdvaW5nKGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzID0gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLiBUaGUgZXZlbnQgbmFtZSBpcyBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZVxuICAgICAqIGNhbGxiYWNrLiBUaGUgbGlzdGVuZXIgaXMgYWRkZWQgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdGVuZXJzIGFycmF5LlxuICAgICAqXG4gICAgICogTm90ZTogYWNrbm93bGVkZ2VtZW50cyBzZW50IHRvIHRoZSBzZXJ2ZXIgYXJlIG5vdCBpbmNsdWRlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnByZXBlbmRBbnlPdXRnb2luZygoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBzZW50IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcmVwZW5kQW55T3V0Z29pbmcobGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgPSB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyB8fCBbXTtcbiAgICAgICAgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMudW5zaGlmdChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3QgY2F0Y2hBbGxMaXN0ZW5lciA9IChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYHNlbnQgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBzb2NrZXQub25BbnlPdXRnb2luZyhjYXRjaEFsbExpc3RlbmVyKTtcbiAgICAgKlxuICAgICAqIC8vIHJlbW92ZSBhIHNwZWNpZmljIGxpc3RlbmVyXG4gICAgICogc29ja2V0Lm9mZkFueU91dGdvaW5nKGNhdGNoQWxsTGlzdGVuZXIpO1xuICAgICAqXG4gICAgICogLy8gb3IgcmVtb3ZlIGFsbCBsaXN0ZW5lcnNcbiAgICAgKiBzb2NrZXQub2ZmQW55T3V0Z29pbmcoKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBbbGlzdGVuZXJdIC0gdGhlIGNhdGNoLWFsbCBsaXN0ZW5lciAob3B0aW9uYWwpXG4gICAgICovXG4gICAgb2ZmQW55T3V0Z29pbmcobGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycztcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyID09PSBsaXN0ZW5lcnNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdGhhdCBhcmUgbGlzdGVuaW5nIGZvciBhbnkgZXZlbnQgdGhhdCBpcyBzcGVjaWZpZWQuIFRoaXMgYXJyYXkgY2FuIGJlIG1hbmlwdWxhdGVkLFxuICAgICAqIGUuZy4gdG8gcmVtb3ZlIGxpc3RlbmVycy5cbiAgICAgKi9cbiAgICBsaXN0ZW5lcnNBbnlPdXRnb2luZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzIHx8IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBOb3RpZnkgdGhlIGxpc3RlbmVycyBmb3IgZWFjaCBwYWNrZXQgc2VudFxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBub3RpZnlPdXRnb2luZ0xpc3RlbmVycyhwYWNrZXQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzICYmIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMuc2xpY2UoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgcGFja2V0LmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiLyoqXG4gKiBJbml0aWFsaXplIGJhY2tvZmYgdGltZXIgd2l0aCBgb3B0c2AuXG4gKlxuICogLSBgbWluYCBpbml0aWFsIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzIFsxMDBdXG4gKiAtIGBtYXhgIG1heCB0aW1lb3V0IFsxMDAwMF1cbiAqIC0gYGppdHRlcmAgWzBdXG4gKiAtIGBmYWN0b3JgIFsyXVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gQmFja29mZihvcHRzKSB7XG4gICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgdGhpcy5tcyA9IG9wdHMubWluIHx8IDEwMDtcbiAgICB0aGlzLm1heCA9IG9wdHMubWF4IHx8IDEwMDAwO1xuICAgIHRoaXMuZmFjdG9yID0gb3B0cy5mYWN0b3IgfHwgMjtcbiAgICB0aGlzLmppdHRlciA9IG9wdHMuaml0dGVyID4gMCAmJiBvcHRzLmppdHRlciA8PSAxID8gb3B0cy5qaXR0ZXIgOiAwO1xuICAgIHRoaXMuYXR0ZW1wdHMgPSAwO1xufVxuLyoqXG4gKiBSZXR1cm4gdGhlIGJhY2tvZmYgZHVyYXRpb24uXG4gKlxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuQmFja29mZi5wcm90b3R5cGUuZHVyYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1zID0gdGhpcy5tcyAqIE1hdGgucG93KHRoaXMuZmFjdG9yLCB0aGlzLmF0dGVtcHRzKyspO1xuICAgIGlmICh0aGlzLmppdHRlcikge1xuICAgICAgICB2YXIgcmFuZCA9IE1hdGgucmFuZG9tKCk7XG4gICAgICAgIHZhciBkZXZpYXRpb24gPSBNYXRoLmZsb29yKHJhbmQgKiB0aGlzLmppdHRlciAqIG1zKTtcbiAgICAgICAgbXMgPSAoTWF0aC5mbG9vcihyYW5kICogMTApICYgMSkgPT0gMCA/IG1zIC0gZGV2aWF0aW9uIDogbXMgKyBkZXZpYXRpb247XG4gICAgfVxuICAgIHJldHVybiBNYXRoLm1pbihtcywgdGhpcy5tYXgpIHwgMDtcbn07XG4vKipcbiAqIFJlc2V0IHRoZSBudW1iZXIgb2YgYXR0ZW1wdHMuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuQmFja29mZi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5hdHRlbXB0cyA9IDA7XG59O1xuLyoqXG4gKiBTZXQgdGhlIG1pbmltdW0gZHVyYXRpb25cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRNaW4gPSBmdW5jdGlvbiAobWluKSB7XG4gICAgdGhpcy5tcyA9IG1pbjtcbn07XG4vKipcbiAqIFNldCB0aGUgbWF4aW11bSBkdXJhdGlvblxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnNldE1heCA9IGZ1bmN0aW9uIChtYXgpIHtcbiAgICB0aGlzLm1heCA9IG1heDtcbn07XG4vKipcbiAqIFNldCB0aGUgaml0dGVyXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuQmFja29mZi5wcm90b3R5cGUuc2V0Sml0dGVyID0gZnVuY3Rpb24gKGppdHRlcikge1xuICAgIHRoaXMuaml0dGVyID0gaml0dGVyO1xufTtcbiIsImltcG9ydCB7IFNvY2tldCBhcyBFbmdpbmUsIGluc3RhbGxUaW1lckZ1bmN0aW9ucywgbmV4dFRpY2ssIH0gZnJvbSBcImVuZ2luZS5pby1jbGllbnRcIjtcbmltcG9ydCB7IFNvY2tldCB9IGZyb20gXCIuL3NvY2tldC5qc1wiO1xuaW1wb3J0ICogYXMgcGFyc2VyIGZyb20gXCJzb2NrZXQuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBvbiB9IGZyb20gXCIuL29uLmpzXCI7XG5pbXBvcnQgeyBCYWNrb2ZmIH0gZnJvbSBcIi4vY29udHJpYi9iYWNrbzIuanNcIjtcbmltcG9ydCB7IEVtaXR0ZXIsIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmV4cG9ydCBjbGFzcyBNYW5hZ2VyIGV4dGVuZHMgRW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IodXJpLCBvcHRzKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5uc3BzID0ge307XG4gICAgICAgIHRoaXMuc3VicyA9IFtdO1xuICAgICAgICBpZiAodXJpICYmIFwib2JqZWN0XCIgPT09IHR5cGVvZiB1cmkpIHtcbiAgICAgICAgICAgIG9wdHMgPSB1cmk7XG4gICAgICAgICAgICB1cmkgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgICAgIG9wdHMucGF0aCA9IG9wdHMucGF0aCB8fCBcIi9zb2NrZXQuaW9cIjtcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0cztcbiAgICAgICAgaW5zdGFsbFRpbWVyRnVuY3Rpb25zKHRoaXMsIG9wdHMpO1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbihvcHRzLnJlY29ubmVjdGlvbiAhPT0gZmFsc2UpO1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkF0dGVtcHRzKG9wdHMucmVjb25uZWN0aW9uQXR0ZW1wdHMgfHwgSW5maW5pdHkpO1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkRlbGF5KG9wdHMucmVjb25uZWN0aW9uRGVsYXkgfHwgMTAwMCk7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uRGVsYXlNYXgob3B0cy5yZWNvbm5lY3Rpb25EZWxheU1heCB8fCA1MDAwKTtcbiAgICAgICAgdGhpcy5yYW5kb21pemF0aW9uRmFjdG9yKChfYSA9IG9wdHMucmFuZG9taXphdGlvbkZhY3RvcikgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMC41KTtcbiAgICAgICAgdGhpcy5iYWNrb2ZmID0gbmV3IEJhY2tvZmYoe1xuICAgICAgICAgICAgbWluOiB0aGlzLnJlY29ubmVjdGlvbkRlbGF5KCksXG4gICAgICAgICAgICBtYXg6IHRoaXMucmVjb25uZWN0aW9uRGVsYXlNYXgoKSxcbiAgICAgICAgICAgIGppdHRlcjogdGhpcy5yYW5kb21pemF0aW9uRmFjdG9yKCksXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnRpbWVvdXQobnVsbCA9PSBvcHRzLnRpbWVvdXQgPyAyMDAwMCA6IG9wdHMudGltZW91dCk7XG4gICAgICAgIHRoaXMuX3JlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICB0aGlzLnVyaSA9IHVyaTtcbiAgICAgICAgY29uc3QgX3BhcnNlciA9IG9wdHMucGFyc2VyIHx8IHBhcnNlcjtcbiAgICAgICAgdGhpcy5lbmNvZGVyID0gbmV3IF9wYXJzZXIuRW5jb2RlcigpO1xuICAgICAgICB0aGlzLmRlY29kZXIgPSBuZXcgX3BhcnNlci5EZWNvZGVyKCk7XG4gICAgICAgIHRoaXMuX2F1dG9Db25uZWN0ID0gb3B0cy5hdXRvQ29ubmVjdCAhPT0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLl9hdXRvQ29ubmVjdClcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgICByZWNvbm5lY3Rpb24odikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gPSAhIXY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZWNvbm5lY3Rpb25BdHRlbXB0cyh2KSB7XG4gICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHM7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbkF0dGVtcHRzID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJlY29ubmVjdGlvbkRlbGF5KHYpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBpZiAodiA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5O1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb25EZWxheSA9IHY7XG4gICAgICAgIChfYSA9IHRoaXMuYmFja29mZikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnNldE1pbih2KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJhbmRvbWl6YXRpb25GYWN0b3Iodikge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmFuZG9taXphdGlvbkZhY3RvcjtcbiAgICAgICAgdGhpcy5fcmFuZG9taXphdGlvbkZhY3RvciA9IHY7XG4gICAgICAgIChfYSA9IHRoaXMuYmFja29mZikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnNldEppdHRlcih2KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJlY29ubmVjdGlvbkRlbGF5TWF4KHYpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBpZiAodiA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5TWF4O1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb25EZWxheU1heCA9IHY7XG4gICAgICAgIChfYSA9IHRoaXMuYmFja29mZikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnNldE1heCh2KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHRpbWVvdXQodikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGltZW91dDtcbiAgICAgICAgdGhpcy5fdGltZW91dCA9IHY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdGFydHMgdHJ5aW5nIHRvIHJlY29ubmVjdCBpZiByZWNvbm5lY3Rpb24gaXMgZW5hYmxlZCBhbmQgd2UgaGF2ZSBub3RcbiAgICAgKiBzdGFydGVkIHJlY29ubmVjdGluZyB5ZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgbWF5YmVSZWNvbm5lY3RPbk9wZW4oKSB7XG4gICAgICAgIC8vIE9ubHkgdHJ5IHRvIHJlY29ubmVjdCBpZiBpdCdzIHRoZSBmaXJzdCB0aW1lIHdlJ3JlIGNvbm5lY3RpbmdcbiAgICAgICAgaWYgKCF0aGlzLl9yZWNvbm5lY3RpbmcgJiZcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiAmJlxuICAgICAgICAgICAgdGhpcy5iYWNrb2ZmLmF0dGVtcHRzID09PSAwKSB7XG4gICAgICAgICAgICAvLyBrZWVwcyByZWNvbm5lY3Rpb24gZnJvbSBmaXJpbmcgdHdpY2UgZm9yIHRoZSBzYW1lIHJlY29ubmVjdGlvbiBsb29wXG4gICAgICAgICAgICB0aGlzLnJlY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGN1cnJlbnQgdHJhbnNwb3J0IGBzb2NrZXRgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gLSBvcHRpb25hbCwgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgb3Blbihmbikge1xuICAgICAgICBpZiAofnRoaXMuX3JlYWR5U3RhdGUuaW5kZXhPZihcIm9wZW5cIikpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgdGhpcy5lbmdpbmUgPSBuZXcgRW5naW5lKHRoaXMudXJpLCB0aGlzLm9wdHMpO1xuICAgICAgICBjb25zdCBzb2NrZXQgPSB0aGlzLmVuZ2luZTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuX3JlYWR5U3RhdGUgPSBcIm9wZW5pbmdcIjtcbiAgICAgICAgdGhpcy5za2lwUmVjb25uZWN0ID0gZmFsc2U7XG4gICAgICAgIC8vIGVtaXQgYG9wZW5gXG4gICAgICAgIGNvbnN0IG9wZW5TdWJEZXN0cm95ID0gb24oc29ja2V0LCBcIm9wZW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5vbm9wZW4oKTtcbiAgICAgICAgICAgIGZuICYmIGZuKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBvbkVycm9yID0gKGVycikgPT4ge1xuICAgICAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgICAgIGlmIChmbikge1xuICAgICAgICAgICAgICAgIGZuKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGRvIHRoaXMgaWYgdGhlcmUgaXMgbm8gZm4gdG8gaGFuZGxlIHRoZSBlcnJvclxuICAgICAgICAgICAgICAgIHRoaXMubWF5YmVSZWNvbm5lY3RPbk9wZW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gZW1pdCBgZXJyb3JgXG4gICAgICAgIGNvbnN0IGVycm9yU3ViID0gb24oc29ja2V0LCBcImVycm9yXCIsIG9uRXJyb3IpO1xuICAgICAgICBpZiAoZmFsc2UgIT09IHRoaXMuX3RpbWVvdXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0O1xuICAgICAgICAgICAgLy8gc2V0IHRpbWVyXG4gICAgICAgICAgICBjb25zdCB0aW1lciA9IHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBvcGVuU3ViRGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIG9uRXJyb3IobmV3IEVycm9yKFwidGltZW91dFwiKSk7XG4gICAgICAgICAgICAgICAgc29ja2V0LmNsb3NlKCk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICAgICAgdGltZXIudW5yZWYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3Vicy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dEZuKHRpbWVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3Vicy5wdXNoKG9wZW5TdWJEZXN0cm95KTtcbiAgICAgICAgdGhpcy5zdWJzLnB1c2goZXJyb3JTdWIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWxpYXMgZm9yIG9wZW4oKVxuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGNvbm5lY3QoZm4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3Blbihmbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHRyYW5zcG9ydCBvcGVuLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbm9wZW4oKSB7XG4gICAgICAgIC8vIGNsZWFyIG9sZCBzdWJzXG4gICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICAvLyBtYXJrIGFzIG9wZW5cbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwib3BlblwiO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcIm9wZW5cIik7XG4gICAgICAgIC8vIGFkZCBuZXcgc3Vic1xuICAgICAgICBjb25zdCBzb2NrZXQgPSB0aGlzLmVuZ2luZTtcbiAgICAgICAgdGhpcy5zdWJzLnB1c2gob24oc29ja2V0LCBcInBpbmdcIiwgdGhpcy5vbnBpbmcuYmluZCh0aGlzKSksIG9uKHNvY2tldCwgXCJkYXRhXCIsIHRoaXMub25kYXRhLmJpbmQodGhpcykpLCBvbihzb2NrZXQsIFwiZXJyb3JcIiwgdGhpcy5vbmVycm9yLmJpbmQodGhpcykpLCBvbihzb2NrZXQsIFwiY2xvc2VcIiwgdGhpcy5vbmNsb3NlLmJpbmQodGhpcykpLCBvbih0aGlzLmRlY29kZXIsIFwiZGVjb2RlZFwiLCB0aGlzLm9uZGVjb2RlZC5iaW5kKHRoaXMpKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGEgcGluZy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25waW5nKCkge1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBpbmdcIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aXRoIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZGF0YShkYXRhKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmRlY29kZXIuYWRkKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLm9uY2xvc2UoXCJwYXJzZSBlcnJvclwiLCBlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiBwYXJzZXIgZnVsbHkgZGVjb2RlcyBhIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25kZWNvZGVkKHBhY2tldCkge1xuICAgICAgICAvLyB0aGUgbmV4dFRpY2sgY2FsbCBwcmV2ZW50cyBhbiBleGNlcHRpb24gaW4gYSB1c2VyLXByb3ZpZGVkIGV2ZW50IGxpc3RlbmVyIGZyb20gdHJpZ2dlcmluZyBhIGRpc2Nvbm5lY3Rpb24gZHVlIHRvIGEgXCJwYXJzZSBlcnJvclwiXG4gICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGFja2V0XCIsIHBhY2tldCk7XG4gICAgICAgIH0sIHRoaXMuc2V0VGltZW91dEZuKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gc29ja2V0IGVycm9yLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmVycm9yKGVycikge1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgc29ja2V0IGZvciB0aGUgZ2l2ZW4gYG5zcGAuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTb2NrZXR9XG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIHNvY2tldChuc3AsIG9wdHMpIHtcbiAgICAgICAgbGV0IHNvY2tldCA9IHRoaXMubnNwc1tuc3BdO1xuICAgICAgICBpZiAoIXNvY2tldCkge1xuICAgICAgICAgICAgc29ja2V0ID0gbmV3IFNvY2tldCh0aGlzLCBuc3AsIG9wdHMpO1xuICAgICAgICAgICAgdGhpcy5uc3BzW25zcF0gPSBzb2NrZXQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5fYXV0b0Nvbm5lY3QgJiYgIXNvY2tldC5hY3RpdmUpIHtcbiAgICAgICAgICAgIHNvY2tldC5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNvY2tldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gYSBzb2NrZXQgY2xvc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc29ja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZGVzdHJveShzb2NrZXQpIHtcbiAgICAgICAgY29uc3QgbnNwcyA9IE9iamVjdC5rZXlzKHRoaXMubnNwcyk7XG4gICAgICAgIGZvciAoY29uc3QgbnNwIG9mIG5zcHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHNvY2tldCA9IHRoaXMubnNwc1tuc3BdO1xuICAgICAgICAgICAgaWYgKHNvY2tldC5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY2xvc2UoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV3JpdGVzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3BhY2tldChwYWNrZXQpIHtcbiAgICAgICAgY29uc3QgZW5jb2RlZFBhY2tldHMgPSB0aGlzLmVuY29kZXIuZW5jb2RlKHBhY2tldCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW5jb2RlZFBhY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLndyaXRlKGVuY29kZWRQYWNrZXRzW2ldLCBwYWNrZXQub3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xlYW4gdXAgdHJhbnNwb3J0IHN1YnNjcmlwdGlvbnMgYW5kIHBhY2tldCBidWZmZXIuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGNsZWFudXAoKSB7XG4gICAgICAgIHRoaXMuc3Vicy5mb3JFYWNoKChzdWJEZXN0cm95KSA9PiBzdWJEZXN0cm95KCkpO1xuICAgICAgICB0aGlzLnN1YnMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5kZWNvZGVyLmRlc3Ryb3koKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2UgdGhlIGN1cnJlbnQgc29ja2V0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuc2tpcFJlY29ubmVjdCA9IHRydWU7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uY2xvc2UoXCJmb3JjZWQgY2xvc2VcIik7XG4gICAgICAgIGlmICh0aGlzLmVuZ2luZSlcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLmNsb3NlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFsaWFzIGZvciBjbG9zZSgpXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jbG9zZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlbmdpbmUgY2xvc2UuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uY2xvc2UocmVhc29uLCBkZXNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgdGhpcy5iYWNrb2ZmLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuX3JlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNsb3NlXCIsIHJlYXNvbiwgZGVzY3JpcHRpb24pO1xuICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0aW9uICYmICF0aGlzLnNraXBSZWNvbm5lY3QpIHtcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQXR0ZW1wdCBhIHJlY29ubmVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcmVjb25uZWN0KCkge1xuICAgICAgICBpZiAodGhpcy5fcmVjb25uZWN0aW5nIHx8IHRoaXMuc2tpcFJlY29ubmVjdClcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuYmFja29mZi5hdHRlbXB0cyA+PSB0aGlzLl9yZWNvbm5lY3Rpb25BdHRlbXB0cykge1xuICAgICAgICAgICAgdGhpcy5iYWNrb2ZmLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdF9mYWlsZWRcIik7XG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRlbGF5ID0gdGhpcy5iYWNrb2ZmLmR1cmF0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3RpbmcgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuc2tpcFJlY29ubmVjdClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicmVjb25uZWN0X2F0dGVtcHRcIiwgc2VsZi5iYWNrb2ZmLmF0dGVtcHRzKTtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBhZ2FpbiBmb3IgdGhlIGNhc2Ugc29ja2V0IGNsb3NlZCBpbiBhYm92ZSBldmVudHNcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5za2lwUmVjb25uZWN0KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgc2VsZi5vcGVuKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJyZWNvbm5lY3RfZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgICAgICB0aW1lci51bnJlZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdWJzLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0Rm4odGltZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gc3VjY2Vzc2Z1bCByZWNvbm5lY3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ucmVjb25uZWN0KCkge1xuICAgICAgICBjb25zdCBhdHRlbXB0ID0gdGhpcy5iYWNrb2ZmLmF0dGVtcHRzO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5iYWNrb2ZmLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicmVjb25uZWN0XCIsIGF0dGVtcHQpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IHVybCB9IGZyb20gXCIuL3VybC5qc1wiO1xuaW1wb3J0IHsgTWFuYWdlciB9IGZyb20gXCIuL21hbmFnZXIuanNcIjtcbmltcG9ydCB7IFNvY2tldCB9IGZyb20gXCIuL3NvY2tldC5qc1wiO1xuLyoqXG4gKiBNYW5hZ2VycyBjYWNoZS5cbiAqL1xuY29uc3QgY2FjaGUgPSB7fTtcbmZ1bmN0aW9uIGxvb2t1cCh1cmksIG9wdHMpIHtcbiAgICBpZiAodHlwZW9mIHVyaSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBvcHRzID0gdXJpO1xuICAgICAgICB1cmkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgIGNvbnN0IHBhcnNlZCA9IHVybCh1cmksIG9wdHMucGF0aCB8fCBcIi9zb2NrZXQuaW9cIik7XG4gICAgY29uc3Qgc291cmNlID0gcGFyc2VkLnNvdXJjZTtcbiAgICBjb25zdCBpZCA9IHBhcnNlZC5pZDtcbiAgICBjb25zdCBwYXRoID0gcGFyc2VkLnBhdGg7XG4gICAgY29uc3Qgc2FtZU5hbWVzcGFjZSA9IGNhY2hlW2lkXSAmJiBwYXRoIGluIGNhY2hlW2lkXVtcIm5zcHNcIl07XG4gICAgY29uc3QgbmV3Q29ubmVjdGlvbiA9IG9wdHMuZm9yY2VOZXcgfHxcbiAgICAgICAgb3B0c1tcImZvcmNlIG5ldyBjb25uZWN0aW9uXCJdIHx8XG4gICAgICAgIGZhbHNlID09PSBvcHRzLm11bHRpcGxleCB8fFxuICAgICAgICBzYW1lTmFtZXNwYWNlO1xuICAgIGxldCBpbztcbiAgICBpZiAobmV3Q29ubmVjdGlvbikge1xuICAgICAgICBpbyA9IG5ldyBNYW5hZ2VyKHNvdXJjZSwgb3B0cyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoIWNhY2hlW2lkXSkge1xuICAgICAgICAgICAgY2FjaGVbaWRdID0gbmV3IE1hbmFnZXIoc291cmNlLCBvcHRzKTtcbiAgICAgICAgfVxuICAgICAgICBpbyA9IGNhY2hlW2lkXTtcbiAgICB9XG4gICAgaWYgKHBhcnNlZC5xdWVyeSAmJiAhb3B0cy5xdWVyeSkge1xuICAgICAgICBvcHRzLnF1ZXJ5ID0gcGFyc2VkLnF1ZXJ5S2V5O1xuICAgIH1cbiAgICByZXR1cm4gaW8uc29ja2V0KHBhcnNlZC5wYXRoLCBvcHRzKTtcbn1cbi8vIHNvIHRoYXQgXCJsb29rdXBcIiBjYW4gYmUgdXNlZCBib3RoIGFzIGEgZnVuY3Rpb24gKGUuZy4gYGlvKC4uLilgKSBhbmQgYXMgYVxuLy8gbmFtZXNwYWNlIChlLmcuIGBpby5jb25uZWN0KC4uLilgKSwgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbk9iamVjdC5hc3NpZ24obG9va3VwLCB7XG4gICAgTWFuYWdlcixcbiAgICBTb2NrZXQsXG4gICAgaW86IGxvb2t1cCxcbiAgICBjb25uZWN0OiBsb29rdXAsXG59KTtcbi8qKlxuICogUHJvdG9jb2wgdmVyc2lvbi5cbiAqXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCB7IHByb3RvY29sIH0gZnJvbSBcInNvY2tldC5pby1wYXJzZXJcIjtcbi8qKlxuICogRXhwb3NlIGNvbnN0cnVjdG9ycyBmb3Igc3RhbmRhbG9uZSBidWlsZC5cbiAqXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCB7IE1hbmFnZXIsIFNvY2tldCwgbG9va3VwIGFzIGlvLCBsb29rdXAgYXMgY29ubmVjdCwgbG9va3VwIGFzIGRlZmF1bHQsIH07XG4iLCJpbXBvcnQgeyBpbyB9IGZyb20gXCJzb2NrZXQuaW8tY2xpZW50XCI7XHJcbi8vaW1wb3J0IEZpbGVTYXZlciBmcm9tIFwiZmlsZS1zYXZlclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFVSSSB7XHJcbiAgaWQ7IC8vIGlkIGluIFVpbnQ4QXJyYXkhISFcclxuXHJcbiAgdG9TdHIoKSB7XHJcbiAgICBpZiAodGhpcy5pZCAhPSB1bmRlZmluZWQpXHJcbiAgICAgIHJldHVybiBcIltcIiArIHRoaXMuaWQudG9TdHJpbmcoKSArIFwiXVwiO1xyXG4gIH1cclxuXHJcbiAgZnJvbVN0ciggc3RyICkge1xyXG4gICAgdGhpcy5pZCA9IG5ldyBVaW50OEFycmF5KEpTT04ucGFyc2Uoc3RyKSk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZnJvbUFycmF5KCBpbkEgKSB7XHJcbiAgICBsZXQgb3V0QSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbkEubGVuZ3RoOyBpKyspXHJcbiAgICAgIG91dEFbaV0gPSBuZXcgVVJJKGluQVtpXSk7XHJcbiAgICByZXR1cm4gb3V0QTtcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKCBkYXRhICkge1xyXG4gICAgLy8gY29uc29sZS5sb2coXCJVUkkgaW46XCIpO1xyXG4gICAgLy8gY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICBpZiAodHlwZW9mKGRhdGEpID09ICdzdHJpbmcnKVxyXG4gICAgICB0aGlzLmZyb21TdHIoZGF0YSk7XHJcbiAgICBlbHNlIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpXHJcbiAgICAgIHRoaXMuaWQgPSBuZXcgVWludDhBcnJheShkYXRhKTtcclxuICAgIGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5KVxyXG4gICAgICB0aGlzLmlkID0gZGF0YTtcclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgY29uc29sZS5sb2coXCJXUk9ORyBVUkkgVFlQRUw6XCIpO1xyXG4gICAgICBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb25uZWN0aW9uIHtcclxuICBzb2NrZXQ7XHJcblxyXG4gIGdldE5vZGVSZXM7XHJcbiAgZ2V0QWxsTm9kZXNSZXM7XHJcbiAgYWRkTm9kZVJlcztcclxuICBkZWxOb2RlUmVzO1xyXG4gIGNvbm5lY3ROb2Rlc1JlcztcclxuICBkaXNjb25uZWN0Tm9kZXNSZXM7XHJcbiAgc2V0RGVmTm9kZVVSSVJlcztcclxuICBnZXREZWZOb2RlVVJJUmVzO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGVkIHdpdGggc2VydmVyXCIpO1xyXG5cclxuICAgIHRoaXMuc29ja2V0ID0gaW8oKTtcclxuXHJcbiAgICB0aGlzLnNvY2tldC5vbihcImNvbm5lY3RcIiwgKCkgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlNPQ0tFVCBJRDogXCIgKyB0aGlzLnNvY2tldC5pZCk7XHJcblxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBzZW5kKCByZXEsIC4uLmFyZ3MgKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgdGhpcy5zb2NrZXQuZW1pdChyZXEsIC4uLmFyZ3MsIChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVEVTVCBPVVQ6XCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHBpbmcoIHZhbHVlICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcInBpbmdcIiwgdmFsdWUpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0Tm9kZSggdXJpICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImdldE5vZGVSZXFcIiwgdXJpLmlkKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGFkZE5vZGUoIGRhdGEgKSB7XHJcbiAgICByZXR1cm4gbmV3IFVSSShhd2FpdCB0aGlzLnNlbmQoXCJhZGROb2RlUmVxXCIsIGRhdGEpKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHVwZGF0ZU5vZGUoIHVyaSwgZGF0YSApIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJ1cGRhdGVOb2RlUmVxXCIsIHVyaS5pZCwgZGF0YSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRBbGxOb2RlcygpIHtcclxuICAgIHJldHVybiBVUkkuZnJvbUFycmF5KCBhd2FpdCB0aGlzLnNlbmQoXCJnZXRBbGxOb2Rlc1JlcVwiKSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRBbGxDb25uZWN0aW9ucygpIHtcclxuICAgIGxldCBjQSA9IGF3YWl0IHRoaXMuc2VuZChcImdldEFsbENvbm5lY3Rpb25zUmVxXCIpO1xyXG5cclxuICAgIGxldCBvdXRBID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjQS5sZW5ndGg7IGkrKylcclxuICAgICAgb3V0QVtpXSA9IFtuZXcgVVJJKGNBW2ldLmlkMSksIG5ldyBVUkkoY0FbaV0uaWQyKV07XHJcbiAgICByZXR1cm4gb3V0QTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldEFsbE5vZGVzRGF0YSgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlbmQoXCJnZXRBbGxOb2Rlc0RhdGFSZXFcIik7XHJcbiAgfVxyXG5cclxuICBhc3luYyBkZWxOb2RlKCBub2RlICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImRlbE5vZGVSZXFcIiwgbm9kZSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBjb25uZWN0Tm9kZXMoIHVyaTEsIHVyaTIgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiY29ubmVjdE5vZGVzUmVxXCIsIFt1cmkxLmlkLCB1cmkyLmlkXSk7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXROb2RlQ29ubmVjdGlvbnMoIHVyaSApIHtcclxuICAgIGxldCBjQSA9IGF3YWl0IHRoaXMuc2VuZChcImdldE5vZGVDb25uZWN0aW9uc1JlcVwiLCB1cmkuaWQpO1xyXG5cclxuICAgIGxldCBvdXRBID0gW107XHJcbiAgICBcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY0EubGVuZ3RoOyBpKyspXHJcbiAgICAgIG91dEFbaV0gPSBbbmV3IFVSSShjQVtpXS5pZDEpLCBuZXcgVVJJKGNBW2ldLmlkMildO1xyXG4gICAgcmV0dXJuIG91dEE7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXROZWlnaGJvdXJzKCB1cmkgKSB7XHJcbiAgICByZXR1cm4gVVJJLmZyb21BcnJheShhd2FpdCB0aGlzLnNlbmQoXCJnZXROZWlnaGJvdXJzUmVxXCIsIHVyaS5pZCkpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZGlzY29ubmVjdE5vZGVzKCB1cmkxLCB1cmkyICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImRpc2Nvbm5lY3ROb2Rlc1JlcVwiLCBbdXJpMS5pZCwgdXJpMi5pZF0pO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgc2V0RGVmTm9kZVVSSSggdXJpICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcInNldERlZk5vZGVVUklSZXFcIiwgdXJpLmlkKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldERlZk5vZGVVUkkoKSB7XHJcbiAgICByZXR1cm4gbmV3IFVSSShhd2FpdCB0aGlzLnNlbmQoXCJnZXREZWZOb2RlVVJJUmVxXCIpKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGNsZWFyREIoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiY2xlYXJEQlJlcVwiKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldERCKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImdldERCUmVxXCIpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgc2F2ZURCKCBvdXRGaWxlTmFtZSApIHtcclxuICAgIGxldCBkYlRleHQgPSBKU09OLnN0cmluZ2lmeShhd2FpdCB0aGlzLmdldERCKCkpO1xyXG4gIFxyXG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICB2YXIgZmlsZSA9IG5ldyBCbG9iKFtkYlRleHRdLCB7dHlwZTogXCJ0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLThcIn0pO1xyXG4gICAgYS5ocmVmID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcclxuICAgIGEuZG93bmxvYWQgPSBvdXRGaWxlTmFtZTtcclxuICAgIGEuY2xpY2soKTtcclxuICAgIHJldHVybiBkYlRleHQ7XHJcbiAgfVxyXG5cclxuICBhc3luYyBsb2FkREIoIGRiICkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VuZChcImxvYWREQlJlcVwiLCBkYik7XHJcbiAgfVxyXG5cclxuICBhc3luYyBhZGREQiggZGIgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZW5kKFwiYWRkRGF0YVJlcVwiLCBkYik7XHJcbiAgfVxyXG4gIGFzeW5jIGdldE5lYXJlc3QoIHBvcywgZmxvb3IgKSB7XHJcbiAgICByZXR1cm4gbmV3IFVSSShhd2FpdCB0aGlzLnNlbmQoXCJnZXROZWFyZXN0UmVxXCIsIHBvcywgZmxvb3IpKTtcclxuICB9XHJcbiAgXHJcbiAgXHJcbn0gLyogQ29ubmVjdGlvbiAqL1xyXG4iLCJpbXBvcnQgKiBhcyBtdGggZnJvbSBcIi4vc3lzdGVtL210aC5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFyY2JhbGwge1xyXG4gICAgLy8gY2FtZXJhIHVuaXRcclxuICAgIHN0YXRpYyBjcmVhdGUoKSB7XHJcbiAgICBjb25zdCB1cCA9IG5ldyBtdGguVmVjMygwLCAxLCAwKTtcclxuICAgIGxldCBsb2MgPSBuZXcgbXRoLlZlYzMoMzAsIDMwLCAzMCksIGF0ID0gbmV3IG10aC5WZWMzKDAsIDAsIDApO1xyXG4gICAgbGV0IHJhZGl1cyA9IGF0LnN1Yihsb2MpLmxlbmd0aCgpO1xyXG5cclxuICAgIGxldCBjYW1lcmEgPSB7XHJcbiAgICAgIHJlc3BvbnNlKHN5c3RlbSkge1xyXG4gICAgICAgIHN5c3RlbS5jYW1lcmEuc2V0KGxvYywgYXQsIHVwKTtcclxuICAgICAgfSAvKiByZXNwb25zZSAqL1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgY29uc3Qgb25Nb3VzZU1vdmUgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBpZiAoZXZlbnQuYWx0S2V5IHx8IGV2ZW50LnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoKGV2ZW50LmJ1dHRvbnMgJiAxKSA9PSAxKSB7IC8vIHJvdGF0ZVxyXG4gICAgICAgIGxldCBkaXJlY3Rpb24gPSBsb2Muc3ViKGF0KTtcclxuXHJcbiAgICAgICAgLy8gdHVybiBkaXJlY3Rpb24gdG8gcG9sYXIgY29vcmRpbmF0ZSBzeXN0ZW1cclxuICAgICAgICByYWRpdXMgPSBkaXJlY3Rpb24ubGVuZ3RoKCk7XHJcbiAgICAgICAgbGV0XHJcbiAgICAgICAgICBhemltdXRoICA9IE1hdGguc2lnbihkaXJlY3Rpb24ueikgKiBNYXRoLmFjb3MoZGlyZWN0aW9uLnggLyBNYXRoLnNxcnQoZGlyZWN0aW9uLnggKiBkaXJlY3Rpb24ueCArIGRpcmVjdGlvbi56ICogZGlyZWN0aW9uLnopKSxcclxuICAgICAgICAgIGVsZXZhdG9yID0gTWF0aC5hY29zKGRpcmVjdGlvbi55IC8gZGlyZWN0aW9uLmxlbmd0aCgpKTtcclxuXHJcbiAgICAgICAgICAvLyByb3RhdGUgZGlyZWN0aW9uXHJcbiAgICAgICAgICBhemltdXRoICArPSBldmVudC5tb3ZlbWVudFggLyAyMDAuMDtcclxuICAgICAgICBlbGV2YXRvciAtPSBldmVudC5tb3ZlbWVudFkgLyAyMDAuMDtcclxuICAgICAgICBcclxuICAgICAgICBlbGV2YXRvciA9IE1hdGgubWluKE1hdGgubWF4KGVsZXZhdG9yLCAwLjAxKSwgTWF0aC5QSSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gcmVzdG9yZSBkaXJlY3Rpb25cclxuICAgICAgICBkaXJlY3Rpb24ueCA9IHJhZGl1cyAqIE1hdGguc2luKGVsZXZhdG9yKSAqIE1hdGguY29zKGF6aW11dGgpO1xyXG4gICAgICAgIGRpcmVjdGlvbi55ID0gcmFkaXVzICogTWF0aC5jb3MoZWxldmF0b3IpO1xyXG4gICAgICAgIGRpcmVjdGlvbi56ID0gcmFkaXVzICogTWF0aC5zaW4oZWxldmF0b3IpICogTWF0aC5zaW4oYXppbXV0aCk7XHJcblxyXG4gICAgICAgIGxvYyA9IGF0LmFkZChkaXJlY3Rpb24pO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBpZiAoKGV2ZW50LmJ1dHRvbnMgJiAyKSA9PSAyKSB7IC8vIG1vdmVcclxuICAgICAgICBsZXQgZGlyID0gYXQuc3ViKGxvYykubm9ybWFsaXplKCk7XHJcbiAgICAgICAgbGV0IHJnaCA9IGRpci5jcm9zcyh1cCkubm9ybWFsaXplKCk7XHJcbiAgICAgICAgbGV0IHR1cCA9IHJnaC5jcm9zcyhkaXIpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBkZWx0YSA9IHJnaC5tdWwoLWV2ZW50Lm1vdmVtZW50WCAqIHJhZGl1cyAvIDMwMC4wKS5hZGQodHVwLm11bChldmVudC5tb3ZlbWVudFkgKiByYWRpdXMgLyAzMDAuMCkpO1xyXG4gICAgICAgIGxvYyA9IGxvYy5hZGQoZGVsdGEpO1xyXG4gICAgICAgIGF0ID0gYXQuYWRkKGRlbHRhKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBvbldoZWVsID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgbGV0IGRlbHRhID0gZXZlbnQuZGVsdGFZIC8gNTAwMC4wO1xyXG5cclxuICAgICAgbG9jID0gbG9jLnN1YihhdC5zdWIobG9jKS5tdWwoZGVsdGEpKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcclxuICAgIFxyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Nb3VzZU1vdmUpO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCBvbldoZWVsKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGNhbWVyYTtcclxuICB9XHJcbn0gLyogQXJjYmFsbCAqL1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBSb3RhdG9yIHtcclxuICAvLyBjYW1lcmEgdW5pdFxyXG4gIHN0YXRpYyBjcmVhdGUoKSB7XHJcbiAgICBjb25zdCB1cCA9IG5ldyBtdGguVmVjMygwLCAxLCAwKTtcclxuICAgIGxldCByYWRpdXMgPSAxO1xyXG5cclxuICAgIGxldCBjYW1lcmEgPSB7XHJcbiAgICAgIGxvYzogbmV3IG10aC5WZWMzKDMwLCAzMCwgMzApLFxyXG4gICAgICBhdDogbmV3IG10aC5WZWMzKDAsIDAsIDApLFxyXG4gICAgICBwcm9qU2l6ZTogMSxcclxuICAgICAgcmVzcG9uc2Uoc3lzdGVtKSB7XHJcbiAgICAgICAgc3lzdGVtLmNhbWVyYS5zZXQoY2FtZXJhLmxvYywgY2FtZXJhLmF0LCB1cCk7XHJcbiAgICAgICAgc3lzdGVtLmNhbWVyYS5wcm9qU2V0KDEsIDEwMCwgbmV3IG10aC5TaXplKGNhbWVyYS5wcm9qU2l6ZSwgY2FtZXJhLnByb2pTaXplKSk7XHJcbiAgICAgIH0gLyogcmVzcG9uc2UgKi9cclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gbW92ZUN1cnNvcihkZWx0YSkge1xyXG4gICAgICBsZXQgZGlyZWN0aW9uID0gY2FtZXJhLmxvYy5zdWIoY2FtZXJhLmF0KTtcclxuXHJcbiAgICAgIC8vIHR1cm4gZGlyZWN0aW9uIHRvIHBvbGFyIGNvb3JkaW5hdGUgc3lzdGVtXHJcbiAgICAgIHJhZGl1cyA9IGRpcmVjdGlvbi5sZW5ndGgoKTtcclxuICAgICAgbGV0XHJcbiAgICAgICAgYXppbXV0aCAgPSBNYXRoLnNpZ24oZGlyZWN0aW9uLnopICogTWF0aC5hY29zKGRpcmVjdGlvbi54IC8gTWF0aC5zcXJ0KGRpcmVjdGlvbi54ICogZGlyZWN0aW9uLnggKyBkaXJlY3Rpb24ueiAqIGRpcmVjdGlvbi56KSksXHJcbiAgICAgICAgZWxldmF0b3IgPSBNYXRoLmFjb3MoZGlyZWN0aW9uLnkgLyBkaXJlY3Rpb24ubGVuZ3RoKCkpO1xyXG5cclxuICAgICAgLy8gcm90YXRlIGRpcmVjdGlvblxyXG4gICAgICBhemltdXRoICAtPSBkZWx0YS54O1xyXG4gICAgICBlbGV2YXRvciArPSBkZWx0YS55O1xyXG4gICAgICBcclxuICAgICAgZWxldmF0b3IgPSBNYXRoLm1pbihNYXRoLm1heChlbGV2YXRvciwgMC4wMSksIE1hdGguUEkpO1xyXG4gICAgICBcclxuICAgICAgLy8gcmVzdG9yZSBkaXJlY3Rpb25cclxuICAgICAgZGlyZWN0aW9uLnggPSByYWRpdXMgKiBNYXRoLnNpbihlbGV2YXRvcikgKiBNYXRoLmNvcyhhemltdXRoKTtcclxuICAgICAgZGlyZWN0aW9uLnkgPSByYWRpdXMgKiBNYXRoLmNvcyhlbGV2YXRvcik7XHJcbiAgICAgIGRpcmVjdGlvbi56ID0gcmFkaXVzICogTWF0aC5zaW4oZWxldmF0b3IpICogTWF0aC5zaW4oYXppbXV0aCk7XHJcblxyXG4gICAgICBjYW1lcmEubG9jID0gY2FtZXJhLmF0LmFkZChkaXJlY3Rpb24pO1xyXG4gICAgfSAvKiBtb3ZlQ3Vyc29yICovXHJcblxyXG4gICAgY29uc3QgY2xhbXAgPSAobnVtYmVyLCBtaW5Cb3JkZXIsIG1heEJvcmRlcikgPT4ge1xyXG4gICAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgobnVtYmVyLCBtaW5Cb3JkZXIpLCBtYXhCb3JkZXIpO1xyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XHJcblxyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgIGlmICgoZXZlbnQuYnV0dG9ucyAmIDEpID09IDEpIHsgLy8gcm90YXRlXHJcbiAgICAgICAgbW92ZUN1cnNvcigobmV3IG10aC5WZWMyKGV2ZW50Lm1vdmVtZW50WCwgZXZlbnQubW92ZW1lbnRZKSkubXVsKDEuMCAvIDIwMC4wKSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgIGxldCBkZWx0YSA9IGV2ZW50LmRlbHRhWSAvIDcwMC4wO1xyXG5cclxuICAgICAgY2FtZXJhLnByb2pTaXplICs9IGNhbWVyYS5wcm9qU2l6ZSAqIGRlbHRhO1xyXG4gICAgICBjYW1lcmEucHJvalNpemUgPSBjbGFtcChjYW1lcmEucHJvalNpemUsIDAuMSwgMSk7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgbGV0IHRvdWNoUG9zaXRpb24gPSBudWxsO1xyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChldmVudCkgPT4ge1xyXG4gICAgICB0b3VjaFBvc2l0aW9uID0gbmV3IG10aC5WZWMyKFxyXG4gICAgICAgIGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFgsXHJcbiAgICAgICAgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgIGlmICh0b3VjaFBvc2l0aW9uID09PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBsZXQgbmV3VG91Y2hQb3NpdGlvbiA9IG5ldyBtdGguVmVjMihcclxuICAgICAgICBldmVudC5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYLFxyXG4gICAgICAgIGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFlcclxuICAgICAgKTtcclxuXHJcbiAgICAgIG1vdmVDdXJzb3IobmV3VG91Y2hQb3NpdGlvbi5zdWIodG91Y2hQb3NpdGlvbikubXVsKDEuMCAvIDgwMC4wKSk7XHJcbiAgICAgIHRvdWNoUG9zaXRpb24gPSBuZXdUb3VjaFBvc2l0aW9uO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgdG91Y2hQb3NpdGlvbiA9IG51bGw7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gY2FtZXJhO1xyXG4gIH0gLyogY3JlYXRlICovXHJcbn0gLyogQXJjYmFsbCAqL1xyXG5cclxuLyogY2FtZXJhX2NvbnRyb2xsZXIuanMgKi8iLCJpbXBvcnQgKiBhcyBybmQgZnJvbSBcIi4vc3lzdGVtL3N5c3RlbS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNreXNwaGVyZSB7XHJcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZShzeXN0ZW0sIGZpbGVQYXRoID0gbnVsbCkge1xyXG4gICAgbGV0IG10bCwgdGV4LCBwcmltLCBzcGhlcmU7XHJcbiAgICBsZXQgc2xpZGVTdGFydFRpbWUgPSAwLjAsIHNsaWRlRHVyYXRpb24gPSAwLCBzbGlkZVJvdGF0aW9uO1xyXG4gICAgbGV0IGRvU2xpZGUgPSBmYWxzZTtcclxuXHJcbiAgICByZXR1cm4gc3BoZXJlID0ge1xyXG4gICAgICB0eXBlOiBcInNreXNwaGVyZVwiLFxyXG4gICAgICBuYW1lOiBcIlwiLFxyXG4gICAgICB0ZXh0dXJlOiBudWxsLFxyXG4gICAgICByb3RhdGlvbjogMCxcclxuXHJcbiAgICAgIGFzeW5jIGluaXQoc3lzdGVtKSB7XHJcbiAgICAgICAgbXRsID0gYXdhaXQgc3lzdGVtLmNyZWF0ZU1hdGVyaWFsKFwiLi9zaGFkZXJzL3NreXNwaGVyZVwiKTtcclxuXHJcbiAgICAgICAgdGV4ID0gYXdhaXQgc3lzdGVtLmNyZWF0ZVRleHR1cmUoZmlsZVBhdGgpO1xyXG5cclxuICAgICAgICBtdGwudGV4dHVyZXMucHVzaCh0ZXgpO1xyXG4gICAgICAgIG10bC51Ym8gPSBzeXN0ZW0uY3JlYXRlVW5pZm9ybUJ1ZmZlcigpO1xyXG4gICAgICAgIG10bC51Ym9OYW1lT25TaGFkZXIgPSBcInByb2plY3Rpb25JbmZvXCI7XHJcblxyXG4gICAgICAgIHByaW0gPSBhd2FpdCBzeXN0ZW0uY3JlYXRlRW1wdHlQcmltaXRpdmUoNCwgcm5kLlRvcG9sb2d5LlRSSUFOR0xFX1NUUklQLCBtdGwpO1xyXG5cclxuICAgICAgICBzcGhlcmUudGV4dHVyZSA9IHRleDtcclxuICAgICAgICBzcGhlcmUubmFtZSA9IGBza3lzcGhlcmUjJHtmaWxlUGF0aH1gO1xyXG4gICAgICB9LCAvKiBpbml0ICovXHJcblxyXG4gICAgICAvLyBzbGlkaW5nIHRvIGFub3RoZXIgc2t5c3BoZXJlIGZ1bmN0aW9uXHJcbiAgICAgIGFzeW5jIHNsaWRlKG5ld1RleHR1cmVQYXRoLCBuZXdUZXh0dXJlUm90YXRpb24sIGR1cmF0aW9uID0gMC4zMykge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAvLyBhZGQgbmV3IHRleHR1cmVcclxuICAgICAgICAgIGxldCBuZXdUZXh0dXJlID0gYXdhaXQgc3lzdGVtLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgICAgIGF3YWl0IG5ld1RleHR1cmUubG9hZChuZXdUZXh0dXJlUGF0aCk7XHJcbiAgICAgICAgICBtdGwudGV4dHVyZXMucHVzaChuZXdUZXh0dXJlKTtcclxuICBcclxuICAgICAgICAgIHNsaWRlU3RhcnRUaW1lID0gbnVsbDtcclxuICAgICAgICAgIHNsaWRlRHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICAgICAgICAgIHNsaWRlUm90YXRpb24gPSBuZXdUZXh0dXJlUm90YXRpb247XHJcbiAgICAgICAgICBkb1NsaWRlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzbGlkZSBlbmRcIik7XHJcbiAgICAgICAgICAgIG10bC50ZXh0dXJlcy5zaGlmdCgpO1xyXG4gICAgICAgICAgICBkb1NsaWRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHNwaGVyZS5yb3RhdGlvbiA9IHNsaWRlUm90YXRpb247XHJcblxyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9LCBkdXJhdGlvbiAqIDEwMDAuMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sIC8qIHNsaWRlICovXHJcblxyXG4gICAgICByZXNwb25zZShzeXN0ZW0pIHtcclxuICAgICAgICAvLyAncGVyc3BlY3RpdmUtY29ycmVjdCcgZGlyZWN0aW9uIHZlY3RvcnNcclxuICAgICAgICBsZXQgZGlyID0gc3lzdGVtLmNhbWVyYS5kaXIubXVsKHN5c3RlbS5jYW1lcmEubmVhcik7XHJcbiAgICAgICAgbGV0IHJnaCA9IHN5c3RlbS5jYW1lcmEucmlnaHQubXVsKHN5c3RlbS5jYW1lcmEuY29ycmVjdGVkUHJvalNpemUudyk7XHJcbiAgICAgICAgbGV0IHR1cCA9IHN5c3RlbS5jYW1lcmEudXAubXVsKHN5c3RlbS5jYW1lcmEuY29ycmVjdGVkUHJvalNpemUuaCk7XHJcblxyXG4gICAgICAgIGlmIChkb1NsaWRlKSB7XHJcbiAgICAgICAgICBpZiAoc2xpZGVTdGFydFRpbWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgc2xpZGVTdGFydFRpbWUgPSBzeXN0ZW0udGltZXIudGltZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsZXQgc2xpZGVDb2VmZmljZW50ID0gKHN5c3RlbS50aW1lci50aW1lIC0gc2xpZGVTdGFydFRpbWUpIC8gc2xpZGVEdXJhdGlvbjtcclxuXHJcbiAgICAgICAgICBtdGwudWJvLndyaXRlRGF0YShuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgZGlyLngsIGRpci55LCBkaXIueiwgMS4wLFxyXG4gICAgICAgICAgICByZ2gueCwgcmdoLnksIHJnaC56LCBzbGlkZUNvZWZmaWNlbnQsXHJcbiAgICAgICAgICAgIHR1cC54LCB0dXAueSwgdHVwLnosXHJcbiAgICAgICAgICAgIHNwaGVyZS5yb3RhdGlvbixcclxuICAgICAgICAgICAgMS43NSxcclxuICAgICAgICAgICAgc2xpZGVSb3RhdGlvblxyXG4gICAgICAgICAgXSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBtdGwudWJvLndyaXRlRGF0YShuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgZGlyLngsIGRpci55LCBkaXIueiwgMCxcclxuICAgICAgICAgICAgcmdoLngsIHJnaC55LCByZ2gueiwgMCxcclxuICAgICAgICAgICAgdHVwLngsIHR1cC55LCB0dXAueixcclxuICAgICAgICAgICAgc3BoZXJlLnJvdGF0aW9uLFxyXG4gICAgICAgICAgICAxLjc1LFxyXG4gICAgICAgICAgICAwXHJcbiAgICAgICAgICBdKSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgc3lzdGVtLmRyYXdNYXJrZXJQcmltaXRpdmUocHJpbSk7XHJcbiAgICAgIH0gLyogcmVzcG9uc2UgKi9cclxuICAgIH07IC8qIF90aGlzICovXHJcbiAgfSAvKiBjcmVhdGUgKi9cclxufSAvKiBTa3lzcGhlcmUgKi9cclxuXHJcbi8qIHNreXNwaGVyZS5qcyAqLyIsImltcG9ydCAqIGFzIHJuZCBmcm9tIFwiLi9zeXN0ZW0vc3lzdGVtLmpzXCI7XHJcbmltcG9ydCAqIGFzIG10aCBmcm9tIFwiLi9zeXN0ZW0vbXRoLmpzXCI7XHJcblxyXG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vbm9kZXMuanNcIjtcclxuXHJcbmltcG9ydCB7IFJvdGF0b3IgfSBmcm9tIFwiLi9jYW1lcmFfY29udHJvbGxlci5qc1wiO1xyXG5pbXBvcnQgeyBTa3lzcGhlcmUgfSBmcm9tIFwiLi9za3lzcGhlcmUuanNcIjtcclxuXHJcbmxldCBzeXN0ZW0gPSBuZXcgcm5kLlN5c3RlbSgpO1xyXG5sZXQgc2VydmVyID0gbmV3IENvbm5lY3Rpb24oKTtcclxuXHJcbnN5c3RlbS5yZW5kZXJQYXJhbXMuZGVwdGhUZXN0ID0gZmFsc2U7XHJcbnN5c3RlbS5yZW5kZXJQYXJhbXMuY3VsbEZhY2UgPSB0cnVlO1xyXG5cclxuLy8gY2FtZXJhIGNvbnRyb2xsZXJcclxubGV0IHNreXNwaGVyZSA9IGF3YWl0IHN5c3RlbS5hZGRVbml0KFNreXNwaGVyZS5jcmVhdGUsIFwiLi9iaW4vaW1ncy9sYWtodGEucG5nXCIpO1xyXG5sZXQgY2FtZXJhQ29udHJvbGxlciA9IHN5c3RlbS5hZGRVbml0KFJvdGF0b3IuY3JlYXRlKTtcclxuXHJcbnNreXNwaGVyZS5yb3RhdGlvbiA9IE1hdGguUEkgKiAwLjUwO1xyXG5cclxubGV0IGFycm93TWF0ZXJpYWwgPSBhd2FpdCBzeXN0ZW0uY3JlYXRlTWF0ZXJpYWwoXCIuL3NoYWRlcnMvYXJyb3dcIik7XHJcblxyXG5hcnJvd01hdGVyaWFsLnVibyA9IHN5c3RlbS5jcmVhdGVVbmlmb3JtQnVmZmVyKCk7XHJcbmFycm93TWF0ZXJpYWwudWJvTmFtZU9uU2hhZGVyID0gXCJhcnJvd1VCT1wiO1xyXG5cclxuLyogU2V0dXAgd2luZG93IG1hdGVyaWFsICovXHJcbmFycm93TWF0ZXJpYWwudWJvLndyaXRlRGF0YShuZXcgRmxvYXQzMkFycmF5KFt3aW5kb3cuaW5uZXJIZWlnaHQgPiB3aW5kb3cuaW5uZXJXaWR0aCAhPSAwID8gMy4wIDogMS4wXSkpO1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCAoKSA9PiB7XHJcbiAgYXJyb3dNYXRlcmlhbC51Ym8ud3JpdGVEYXRhKG5ldyBGbG9hdDMyQXJyYXkoW210aC5jbGFtcCh3aW5kb3cuaW5uZXJIZWlnaHQgLyB3aW5kb3cuaW5uZXJXaWR0aCwgMC41LCAxLjUpICogMi4wXSkpO1xyXG59KTtcclxuXHJcbmxldCBhcnJvd1ByaW0gPSBhd2FpdCBzeXN0ZW0uY3JlYXRlRW1wdHlQcmltaXRpdmUoNCwgcm5kLlRvcG9sb2d5LlRSSUFOR0xFX0ZBTiwgYXJyb3dNYXRlcmlhbCk7XHJcbmxldCBhcnJvd1VuaXF1ZUlEID0gMDtcclxubGV0IGFycm93cyA9IFtdO1xyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUFycm93KGRpcmVjdGlvbikge1xyXG4gIGxldCB0cmFuc2Zvcm0gPSBtdGguTWF0NC5yb3RhdGVZKC1NYXRoLmF0YW4yKGRpcmVjdGlvbi56LCBkaXJlY3Rpb24ueCkpO1xyXG5cclxuICBsZXQgYXJyb3cgPSBhd2FpdCBzeXN0ZW0uYWRkVW5pdCgoKSA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiBcImFycm93XCIsXHJcbiAgICAgIG5hbWU6IGBhcnJvdyMke2Fycm93VW5pcXVlSUQrK31gLFxyXG4gICAgICBkaXJlY3Rpb246IChuZXcgbXRoLlZlYzIoZGlyZWN0aW9uLngsIGRpcmVjdGlvbi56KSkubm9ybWFsaXplKCksXHJcbiAgICAgIHJlc3BvbnNlKHN5c3RlbSkge1xyXG4gICAgICAgIHN5c3RlbS5kcmF3TWFya2VyUHJpbWl0aXZlKGFycm93UHJpbSwgdHJhbnNmb3JtKTtcclxuICAgICAgfSAvKiByZXNwb25zZSAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBhcnJvd3MucHVzaChhcnJvdyk7XHJcblxyXG4gIHJldHVybiBhcnJvdztcclxufSAvKiBjcmVhdGVBcnJvdyAqL1xyXG5cclxuZnVuY3Rpb24gY2xlYXJBcnJvd3MoKSB7XHJcbiAgZm9yIChsZXQgYXJyb3cgb2YgYXJyb3dzKSB7XHJcbiAgICBhcnJvdy5kb1N1aWNpZGUgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgYXJyb3dzID0gW107XHJcbn0gLyogY2xlYXJBcnJvd3MgKi9cclxuXHJcbmxldCBjdXJyZW50Tm9kZU5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImN1cnJlbnROb2RlTmFtZVwiKTtcclxuLy9sZXQgc2t5c3BoZXJlUm90YXRpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNreXNwaGVyZVJvdGF0aW9uXCIpO1xyXG5cclxuY29uc3Qgc2t5c3BoZXJlRm9sZGVyUGF0aCA9IFwiLi9iaW4vaW1ncy9cIjtcclxuXHJcbmxldCBjdXJyZW50Tm9kZSA9IG51bGw7XHJcbmxldCBjdXJyZW50Tm9kZVVSSSA9IG51bGw7XHJcbmxldCBuZWlnaGJvdXJzID0gW107XHJcbmFzeW5jIGZ1bmN0aW9uIHNldEN1cnJlbnROb2RlKG5vZGVVUkkpIHtcclxuXHJcbiAgY3VycmVudE5vZGUgPSBhd2FpdCBzZXJ2ZXIuZ2V0Tm9kZShub2RlVVJJKTtcclxuICBjdXJyZW50Tm9kZVVSSSA9IG5vZGVVUkk7XHJcblxyXG4gIGN1cnJlbnROb2RlLnBvc2l0aW9uID0gbXRoLlZlYzMuZnJvbU9iamVjdChjdXJyZW50Tm9kZS5wb3NpdGlvbik7XHJcbiAgY3VycmVudE5vZGVOYW1lLmlubmVyVGV4dCA9IGN1cnJlbnROb2RlLm5hbWU7XHJcbiAgc2V0Rmxvb3IoY3VycmVudE5vZGUuZmxvb3IpO1xyXG5cclxuICBjbGVhckFycm93cygpO1xyXG5cclxuICAvLyB3YWl0IHRoZW4gbmV3IG5vZGUgZW52aXJvbWVudCBpcyBsb2FkZWRcclxuXHJcbiAgLy9za3lzcGhlcmVSb3RhdGlvbi52YWx1ZSA9IGN1cnJlbnROb2RlLnNreXNwaGVyZS5yb3RhdGlvbiAvIChNYXRoLlBJICogMikgKiAzMTQ7XHJcbiAgYXdhaXQgUHJvbWlzZS5hbGwoW1xyXG4gICAgc2t5c3BoZXJlLnNsaWRlKHNreXNwaGVyZUZvbGRlclBhdGggKyBjdXJyZW50Tm9kZS5za3lzcGhlcmUucGF0aCwgc2t5c3BoZXJlLnJvdGF0aW9uKSxcclxuXHJcbiAgICBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICBsZXQgbmVpZ2hib3VyVVJJcyA9IGF3YWl0IHNlcnZlci5nZXROZWlnaGJvdXJzKG5vZGVVUkkpO1xyXG4gICAgICAvLyBkZWxldGUgb2xkIG5laWdoYm91cnMuLi5cclxuICAgICAgZm9yIChsZXQgbmVpZ2hib3VyIG9mIG5laWdoYm91cnMpIHtcclxuICAgICAgICBuZWlnaGJvdXIuZG9TdWljaWRlID0gdHJ1ZTsgLy8gU1BiXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGdldCBuZXcgbmVpZ2hib3Vyc1xyXG4gICAgICBuZWlnaGJvdXJzID0gW107XHJcbiAgICAgIGZvciAobGV0IG5laWdoYm91clVSSSBvZiBuZWlnaGJvdXJVUklzKSB7XHJcbiAgICAgICAgbGV0IG5laWdoYm91ciA9IGF3YWl0IHNlcnZlci5nZXROb2RlKG5laWdoYm91clVSSSk7XHJcbiAgICAgICAgbmVpZ2hib3VyLnBvc2l0aW9uID0gbXRoLlZlYzMuZnJvbU9iamVjdChuZWlnaGJvdXIucG9zaXRpb24pOyAvLyB1cGRhdGUgdmVjM1xyXG4gICAgICAgIG5laWdoYm91ci51cmkgPSBuZWlnaGJvdXJVUkk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbmVpZ2hib3Vycy5wdXNoKG5laWdoYm91cik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJlc29sdmUoKTtcclxuICAgIH0pXHJcbiAgXSk7XHJcblxyXG4gIC8vIGFkZCBhcnJvd3NcclxuICBmb3IgKGxldCBuZWlnaGJvdXIgb2YgT2JqZWN0LnZhbHVlcyhuZWlnaGJvdXJzKSkge1xyXG4gICAgbGV0IGFycm93ID0gYXdhaXQgY3JlYXRlQXJyb3cobmVpZ2hib3VyLnBvc2l0aW9uLnN1YihjdXJyZW50Tm9kZS5wb3NpdGlvbikubm9ybWFsaXplKCkpO1xyXG4gICAgYXJyb3cudGFyZ2V0ID0gbmVpZ2hib3VyO1xyXG4gIH1cclxufSAvKiBzZXRDdXJyZW50Tm9kZSAqL1xyXG5cclxuLy8gc3RhcnR1cFxyXG5zZXRDdXJyZW50Tm9kZShhd2FpdCBzZXJ2ZXIuZ2V0RGVmTm9kZVVSSSgpKTtcclxuXHJcbnN5c3RlbS5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xyXG4gIGxldCB1bml0ID0gc3lzdGVtLmdldFVuaXRCeUNvb3JkKGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xyXG5cclxuICAvLyBnbyB0byBuZXh0IG5vZGUgaWYgY3VycmVudCBub2RlIGlzIGFycm93XHJcbiAgaWYgKHVuaXQudHlwZSA9PT0gXCJhcnJvd1wiKSB7XHJcbiAgICBzZXRDdXJyZW50Tm9kZSh1bml0LnRhcmdldC51cmkpO1xyXG4gIH1cclxufSk7IC8qIGV2ZW50IHN5c3RlbS5jYW52YXM6XCJjbGlja1wiICovXHJcblxyXG4vLyByZXR1cm4gdG8gZWRpdG9yXHJcbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9FZGl0b3JcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiLi9lZGl0b3IuaHRtbFwiICsgd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcclxufSk7IC8qIGV2ZW50IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9FZGl0b3JcIik6XCJjbGlja1wiICovXHJcblxyXG4vLyByZXR1cm4gdG8gc2VydmVyXHJcbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9TZXJ2ZXJcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiLi9zZXJ2ZXIuaHRtbFwiICsgd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcclxufSk7IC8qIGV2ZW50IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9TZXJ2ZXJcIik6XCJjbGlja1wiICovXHJcblxyXG5cclxuLy9za3lzcGhlcmVSb3RhdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKGV2ZW50KSA9PiB7XHJcbi8vICBsZXQgYW5nbGUgPSBza3lzcGhlcmVSb3RhdGlvbi52YWx1ZSAvIDMxNCAqIE1hdGguUEkgKiAyO1xyXG4vL1xyXG4vLyAgc2t5c3BoZXJlLnJvdGF0aW9uID0gYW5nbGU7XHJcbi8vICBzZXJ2ZXIudXBkYXRlTm9kZShjdXJyZW50Tm9kZVVSSSwge1xyXG4vLyAgICBza3lzcGhlcmU6IHtcclxuLy8gICAgICByb3RhdGlvbjogYW5nbGUsXHJcbi8vICAgICAgcGF0aDogY3VycmVudE5vZGUuc2t5c3BoZXJlLnBhdGgsXHJcbi8vICAgIH1cclxuLy8gIH0pO1xyXG4vL30pOyAvKiBldmVudCBza3lzcGhlcmVSb3RhdGlvbjpcImlucHV0XCIgKi9cclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGFzeW5jIChldmVudCkgPT4ge1xyXG4gIGxldCBkaXJlY3Rpb24gPSAobmV3IG10aC5WZWMyKHN5c3RlbS5jYW1lcmEuZGlyLngsIHN5c3RlbS5jYW1lcmEuZGlyLnopKS5ub3JtYWxpemUoKTtcclxuXHJcbiAgc3dpdGNoIChldmVudC5rZXkpIHtcclxuICAgIGNhc2UgXCJBcnJvd1VwXCI6XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgXCJBcnJvd0Rvd25cIjpcclxuICAgICAgZGlyZWN0aW9uID0gZGlyZWN0aW9uLm5lZygpO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiQXJyb3dMZWZ0XCI6XHJcbiAgICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbi5yaWdodCgpO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIFwiQXJyb3dSaWdodFwiOlxyXG4gICAgICBkaXJlY3Rpb24gPSBkaXJlY3Rpb24ubGVmdCgpO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBsZXQgbWF4QXJyb3cgPSBudWxsLCBtYXhBcnJvd0NvZWZmaWNlbnQgPSBNYXRoLlNRUlQxXzI7XHJcbiAgZm9yIChsZXQgYXJyb3cgb2YgYXJyb3dzKSB7XHJcbiAgICBsZXQgY29lZmZpY2VudCA9IGFycm93LmRpcmVjdGlvbi5kb3QoZGlyZWN0aW9uKTtcclxuXHJcbiAgICBpZiAoY29lZmZpY2VudCA+IG1heEFycm93Q29lZmZpY2VudCkge1xyXG4gICAgICBtYXhBcnJvdyA9IGFycm93O1xyXG4gICAgICBtYXhBcnJvd0NvZWZmaWNlbnQgPSBjb2VmZmljZW50O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKG1heEFycm93ICE9PSBudWxsKSB7XHJcbiAgICBhd2FpdCBzZXRDdXJyZW50Tm9kZShtYXhBcnJvdy50YXJnZXQudXJpKTtcclxuICB9XHJcbn0pOyAvKiBldmVudCBkb2N1bWVudDpcImtleWRvd25cIiAqL1xyXG5cclxuXHJcbi8vIE1pbmltYXAgcGFydFxyXG5cclxuZnVuY3Rpb24gbG9hZEltZyggZmlsZU5hbWUgKSB7XHJcbiAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gIGltZy5zcmMgPSBcIi4vYmluL2ltZ3MvXCIgKyBmaWxlTmFtZTtcclxuICByZXR1cm4gbmV3IFByb21pc2UoIGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICBpbWcub25sb2FkID0gKCk9PnsgcmVzb2x2ZShpbWcpOyB9O1xyXG4gIH0pO1xyXG59IC8qIGxvYWRJbWcgKi9cclxuXHJcblxyXG4vLyBGbG9vciBtYXBzIGxvYWRpbmdcclxuZnVuY3Rpb24gc2V0QWN0aXZlKCBidXR0b24sIG5ld1ZhbHVlICkge1xyXG4gIGJ1dHRvbi5jbGFzc05hbWUgPSBidXR0b24uY2xhc3NOYW1lLnJlcGxhY2UoXCIgYWN0aXZlXCIsIFwiXCIpO1xyXG5cclxuICBpZiAobmV3VmFsdWUgPT0gMSlcclxuICAgIGJ1dHRvbi5jbGFzc05hbWUgKz0gXCIgYWN0aXZlXCI7XHJcbn0gLyogc2V0QWN0aXZlICovXHJcblxyXG5mdW5jdGlvbiBvbkZsb29yY2hhbmdlKCBuZXdDdXJGbG9vciApIHtcclxuICBjb25zb2xlLmxvZyhcIk5FVyBBQ1RJVkUgRkxPT1I6IFwiICsgbmV3Q3VyRmxvb3IpO1xyXG59IC8qIG9uRmxvb3JjaGFuZ2UgKi9cclxuXHJcbmZ1bmN0aW9uIHNldEZsb29yKCBuZXdGbG9vciApIHtcclxuICBpZiAoY3VyRmxvb3IgIT09IHVuZGVmaW5lZClcclxuICAgIHNldEFjdGl2ZShmbG9vckJ1dHRvbnNbY3VyRmxvb3JdLCAwKTtcclxuICBzZXRBY3RpdmUoZmxvb3JCdXR0b25zW25ld0Zsb29yXSwgMSk7XHJcbiAgb25GbG9vcmNoYW5nZShuZXdGbG9vcik7XHJcbiAgY3VyRmxvb3IgPSBuZXdGbG9vcjtcclxufSAvKiBFbmQgb2YgJ3NldEZsb29yJyBmdW5jdGlvbiAqL1xyXG5cclxuZnVuY3Rpb24gZHJhd0F2YXRhciggY3R4LCBjb29yZHMgKVxyXG57XHJcbiAgY29uc3Qgc2l6ZSA9IDU7XHJcbiAgY3R4LmxpbmVXaWR0aCA9IDM7XHJcbiAgY3R4LnN0cm9rZVN0eWxlID0gJ3JnYigyNTUsIDAsIDApJztcclxuXHJcbiAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gIGN0eC5tb3ZlVG8oY29vcmRzLnggLSBzaXplLCBjb29yZHMueSAtIHNpemUpO1xyXG4gIGN0eC5saW5lVG8oY29vcmRzLnggKyBzaXplLCBjb29yZHMueSArIHNpemUpO1xyXG4gIGN0eC5tb3ZlVG8oY29vcmRzLnggKyBzaXplLCBjb29yZHMueSAtIHNpemUpO1xyXG4gIGN0eC5saW5lVG8oY29vcmRzLnggLSBzaXplLCBjb29yZHMueSArIHNpemUpO1xyXG4gIGN0eC5jbG9zZVBhdGgoKTtcclxuICBjdHguc3Ryb2tlKCk7XHJcbn0gLyogRW5kIG9mICdkcmF3QXZhdGFyJyBmdW5jdGlvbiAqL1xyXG5cclxudmFyIGZsb29yc01hcHMgPSBbXTtcclxudmFyIGZsb29yQnV0dG9ucyA9IFtdO1xyXG52YXIgY3VyRmxvb3I7XHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0dXBNaW5pbWFwKCkge1xyXG4gIHZhciBtYXBDYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWluaW1hcENhbnZhcycpO1xyXG4gIG1hcENhbnZhcy53aWR0aCA9IG1hcENhbnZhcy5oZWlnaHQgPSAyMDA7XHJcbiAgdmFyIG1hcENvbnRleHQgPSBtYXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgdmFyIERCSW5mbyA9IGF3YWl0IHNlcnZlci5zZW5kKFwiZ2V0REJJbmZvXCIsIGF3YWl0IHNlcnZlci5zZW5kKFwiZ2V0Q3VyREJJbmRleFwiKSk7XHJcbiAgY29uc29sZS5sb2coREJJbmZvKTtcclxuXHJcbiAgLy8gQWRkIGZsb29yIGJ1dHRvbnNcclxuICBsZXQgZmxvb3JCdXR0b25CbG9jayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZmxvb3JCdXR0b25CbG9ja1wiKTtcclxuXHJcbiAgbGV0IGJ1dHRvbnNIdG1sID0gXCJcIjtcclxuICBmb3IgKGxldCBpID0gMCwgbGVuID0gREJJbmZvLmZsb29yQ291bnQ7IGkgPCBsZW47IGkrKylcclxuICAgIGJ1dHRvbnNIdG1sICs9IGA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiZmxvb3Ike0RCSW5mby5maXJzdEZsb29yICsgaX1cIiBjbGFzcz1cImJ1dHRvbiBmbG9vclwiIHZhbHVlPVwiJHtEQkluZm8uZmlyc3RGbG9vciArIGl9XCI+YDtcclxuICBmbG9vckJ1dHRvbkJsb2NrLmlubmVySFRNTCA9IGJ1dHRvbnNIdG1sO1xyXG5cclxuICAvLyBMb2FkIGltYWdlc1xyXG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBEQkluZm8uZmxvb3JDb3VudDsgaSA8IGxlbjsgaSsrKVxyXG4gIHtcclxuICAgIC8vIGluZGV4IG9mIGN1cnJlbnQgYnV0dG9uIGZyb20gYnV0dG9uIGJsb2NrXHJcbiAgICBsZXQgZmxvb3JJbmRleCA9IERCSW5mby5maXJzdEZsb29yICsgaTtcclxuICBcclxuICAgIGZsb29yQnV0dG9uc1tmbG9vckluZGV4XSA9IGZsb29yQnV0dG9uQmxvY2suY2hpbGRyZW5baV07XHJcbiAgICBmbG9vckJ1dHRvbnNbZmxvb3JJbmRleF0ub25jbGljayA9ICgpID0+IHtcclxuICAgICAgc2V0Rmxvb3IoZmxvb3JJbmRleCk7XHJcbiAgICB9O1xyXG4gIFxyXG4gICAgZmxvb3JzTWFwc1tmbG9vckluZGV4XSA9IGF3YWl0IGxvYWRJbWcoYG1pbmltYXAvJHtEQkluZm8ubmFtZX0vZiR7Zmxvb3JJbmRleH0ucG5nYCk7XHJcbiAgfVxyXG5cclxuICBjb25zb2xlLmxvZyhmbG9vcnNNYXBzKTtcclxuXHJcbiAgdmFyIG1vZGVsRW5kUG9zID0gbmV3IG10aC5WZWMyKERCSW5mby5tb2RlbEVuZFBvcy54LCBEQkluZm8ubW9kZWxFbmRQb3MueSk7XHJcbiAgdmFyIG1pbmltYXBPZmZzZXQgPSBuZXcgbXRoLlZlYzIoREJJbmZvLm1pbmltYXBPZmZzZXQueCwgREJJbmZvLm1pbmltYXBPZmZzZXQueSk7XHJcbiAgdmFyIG1pbmltYXBTY2FsZSA9IERCSW5mby5taW5pbWFwU2NhbGU7XHJcbiAgdmFyIGltZ0NlbnRlclBvcyA9IG5ldyBtdGguVmVjMihEQkluZm8uaW1nQ2VudGVyUG9zLngsIERCSW5mby5pbWdDZW50ZXJQb3MueSk7XHJcblxyXG4gIHZhciBpbWdFbmRQb3MgPSBuZXcgbXRoLlZlYzIoZmxvb3JzTWFwc1swXS53aWR0aCAtIERCSW5mby5pbWdDZW50ZXJQb3MueCwgZmxvb3JzTWFwc1swXS5oZWlnaHQgLSBEQkluZm8uaW1nQ2VudGVyUG9zLnkpO1xyXG4gIHZhciBtYXBDb2VmID0gbW9kZWxFbmRQb3MubGVuZ3RoKCkgLyBpbWdFbmRQb3MubGVuZ3RoKCk7XHJcblxyXG4gIG1hcENhbnZhcy5vbndoZWVsID0gKGUpID0+IHtcclxuXHJcbiAgICBsZXQgY29lZiA9IE1hdGgucG93KDAuOTUsIGUuZGVsdGFZIC8gMTAwKTtcclxuICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gICAgbGV0IG1vdXNlUG9zID0gbmV3IG10aC5WZWMyKGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcclxuXHJcbiAgICBtaW5pbWFwT2Zmc2V0ID0gbW91c2VQb3Muc3ViKG1vdXNlUG9zLnN1YihtaW5pbWFwT2Zmc2V0KS5tdWwoY29lZikpO1xyXG5cclxuICAgIG1pbmltYXBTY2FsZSAqPSBjb2VmO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKG1pbmltYXBPZmZzZXQpO1xyXG4gICAgY29uc29sZS5sb2cobWluaW1hcFNjYWxlKTtcclxuICB9O1xyXG5cclxuICBtYXBDYW52YXMub25jb250ZXh0bWVudSA9ICggZSApPT57XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfTtcclxuICBtYXBDYW52YXMub25tb3VzZW1vdmUgPSAoIGUgKT0+e1xyXG4gICAgaWYgKGUuYnV0dG9ucyAmIDIpIC8vIERyYWdcclxuICAgIG1pbmltYXBPZmZzZXQgPSBtaW5pbWFwT2Zmc2V0LmFkZChuZXcgbXRoLlZlYzIoZS5tb3ZlbWVudFgsIGUubW92ZW1lbnRZKSk7XHJcbiAgfTtcclxuXHJcbiAgbWFwQ2FudmFzLm9uY2xpY2sgPSBhc3luYyAoIGUgKT0+e1xyXG4gICAgaWYgKGN1ckZsb29yID09PSB1bmRlZmluZWQpXHJcbiAgICAgIHJldHVybjtcclxuXHJcbiAgICBsZXQgbVBvcyA9IG5ldyBtdGguVmVjMihlLm9mZnNldFgsIGUub2Zmc2V0WSkuc3ViKG1pbmltYXBPZmZzZXQpLm11bCgxIC8gbWluaW1hcFNjYWxlKTtcclxuXHJcbiAgICBsZXQgcG9zID0gbVBvcy5zdWIoaW1nQ2VudGVyUG9zKS5tdWwobWFwQ29lZik7XHJcblxyXG4gICAgbGV0IG5lYXJlc3RVUkkgPSBhd2FpdCBzZXJ2ZXIuZ2V0TmVhcmVzdChuZXcgbXRoLlZlYzMocG9zLngsIDAsIHBvcy55KSwgcGFyc2VJbnQoY3VyRmxvb3IpKTtcclxuICAgIGNvbnNvbGUubG9nKG5lYXJlc3RVUkkpO1xyXG5cclxuICAgIGF3YWl0IHNldEN1cnJlbnROb2RlKG5lYXJlc3RVUkkpO1xyXG4gICAgLy9hd2FpdCBzZXRDdXJyZW50Tm9kZSgpO1xyXG4gIH1cclxuXHJcbiAgd2luZG93LnNldEludGVydmFsKCgpPT57XHJcbiAgICAvLyBSZW5kZXJcclxuICAgIG1hcENvbnRleHQuY2xlYXJSZWN0KDAsIDAsIG1hcENhbnZhcy53aWR0aCwgbWFwQ2FudmFzLmhlaWdodCk7XHJcblxyXG4gICAgaWYgKGN1ckZsb29yID09PSB1bmRlZmluZWQpXHJcbiAgICAgIHJldHVybjtcclxuXHJcbiAgICBtYXBDb250ZXh0LmRyYXdJbWFnZShmbG9vcnNNYXBzW2N1ckZsb29yXSwgbWluaW1hcE9mZnNldC54LCBtaW5pbWFwT2Zmc2V0LnksIGZsb29yc01hcHNbY3VyRmxvb3JdLndpZHRoICogbWluaW1hcFNjYWxlLCBmbG9vcnNNYXBzW2N1ckZsb29yXS5oZWlnaHQgKiBtaW5pbWFwU2NhbGUpO1xyXG5cclxuICAgIGlmIChjdXJyZW50Tm9kZSAhPSB1bmRlZmluZWQpXHJcbiAgICB7XHJcbiAgICAgIGxldCBhdmF0YXJQb3MgPSAobmV3IG10aC5WZWMyKGN1cnJlbnROb2RlLnBvc2l0aW9uLngsIGN1cnJlbnROb2RlLnBvc2l0aW9uLnopKS5tdWwoMSAvIG1hcENvZWYpLmFkZChpbWdDZW50ZXJQb3MpO1xyXG4gICAgICBkcmF3QXZhdGFyKG1hcENvbnRleHQsIGF2YXRhclBvcy5tdWwobWluaW1hcFNjYWxlKS5hZGQobWluaW1hcE9mZnNldCkpO1xyXG4gICAgfVxyXG4gIH0sIDEwKTtcclxufVxyXG5cclxuYXdhaXQgc2V0dXBNaW5pbWFwKCk7XHJcblxyXG5zeXN0ZW0ucnVuKCk7XHJcblxyXG4vKiB2aWV3ZXJfbWFpbi5qcyAqLyJdLCJuYW1lcyI6WyJtdGguU2l6ZSIsIm10aC5WZWMzIiwibXRoLlZlYzIiLCJtdGguTWF0NCIsIm10aC5DYW1lcmEiLCJ3aXRoTmF0aXZlQmxvYiIsIndpdGhOYXRpdmVBcnJheUJ1ZmZlciIsImlzVmlldyIsImxvb2t1cCIsImRlY29kZSIsInByb3RvY29sIiwiZ2xvYmFsVGhpcyIsImVuY29kZSIsIlhNTEh0dHBSZXF1ZXN0IiwiU29ja2V0IiwiUkVTRVJWRURfRVZFTlRTIiwiRW5naW5lIiwiaW8iLCJybmQuVG9wb2xvZ3kiLCJybmQuU3lzdGVtIiwibXRoLmNsYW1wIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ2xELEVBQUUsSUFBSSxNQUFNLElB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SSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM5RTtBQUNBLElBQUksT0FBTyxJQUFJLElBQUk7QUFDbkIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUMvRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQy9FLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFDL0UsS0FBSyxDQUFDO0FBQ04sR0FBRztBQUNIO0FBQ0EsRUFBRSxTQUFTLEdBQUc7QUFDZCxJQUFJLE9BQU8sSUFBSSxJQUFJO0FBQ25CLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDcEQsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNwRCxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BELE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDcEQsS0FBSyxDQUFDO0FBQ04sR0FBRztBQUNIO0FBQ0EsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFO0FBQ1YsSUFBSSxPQUFPLElBQUksSUFBSTtBQUNuQixNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkc7QUFDQSxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkc7QUFDQSxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkc7QUFDQSxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25HLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNuRyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDbkcsS0FBSyxDQUFDO0FBQ04sR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLFFBQVEsR0FBRztB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QUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDMUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztBQUMxRyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsZ0NBQWdDLENBQUMsZ0NBQWdDLENBQUM7QUFDMUcsS0FBSyxDQUFDO0FBQ04sR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtBQUMzQixJQUFJO0FBQ0osTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUU7QUFDbkMsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUU7QUFDckMsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQjtBQUNBLElBQUksT0FBTyxJQUFJLElBQUk7QUFDbkIsTUFBTSxHQUFHLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDbkQsTUFBTSxHQUFHLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLFVB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LENBQUM7QUFDM0MsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsR0FBRztBQUNIO0FBQ0EsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFDbkIsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN2QyxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdDO0FBQ0EsSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUMxQixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3hCO0FBQ0EsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0UsSUFBSSxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0UsSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMs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LE1BQU0sQ0FBQyxTQUFTO0FBQ2pELFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQ2pCLFVBQVUsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUMzQyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUNqQixTQUFTLENBQUM7QUFDVixPQUFPO0FBQ1AsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLEdBQUcsQ0FBQztBQUNmLEdBQUc7QUFDSDtBQUNBLEVBQUUsT0FBTyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRTtBQUN6QixJQUFJLElBQUksR0FBRyxHQUFHLElBQUksUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNuQztBQUNBLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ25DLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMzQztBQUNBLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRTtBQUNBLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNqQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ2YsR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO0FBQzNCLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDL0IsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7QUFDbkM7QUFDQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDcEMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QztBQUNBLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDaEQsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNoRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ2YsR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsTUFBTSxHQUFHLEVBQUUsRUFBRTtBQUNyRCxJQUFJLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3BEO0FBQ0EsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3JDLE1BQU0sSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzdDLE1BQU0sSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuQyxNQUFNLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkM7QUFDQSxNQUFNLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDdEMsUUFBUSxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2hEO0FBQ0EsUUFBUSxJQUFJLEVBQUUsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN4QyxRQUFRLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQztBQUN4QixRQUFRLElBQUksRUFBRSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDO0FBQ0EsUUFBUSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLFNBQVM7QUFDakQsVUFBVSxNQUFNLEdBQUcsRUFBRSxFQUFFLE1BQU0sR0FBRyxFQUFFLEVBQUUsTUFBTSxH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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNLEVBQUUsR0FBRyxxUEFBcVAsQ0FBQztBQUNqUSxNQUFNLEtBQUssR0FBRztBQUNkLElBQUksUUFBUSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVE7QUFDakosQ0FBQyxDQUFDO0FBQ0ssU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFO0FBQzNCLElBQUksTUFBTSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQzVCLFFBQVEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFHLEtBQUs7QUFDTCxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNqRCxJQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDaEIsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMs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QUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDblEsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sR0FBRztBQUNiLFFBQVEsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtBQUNqQixRQUFRLElBQUk7QUFDWixZQUFZLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25DLFNBQVM7QUFDVCxRQUFRLE9BQU8sQ0FBQyxFQUFFO0FBQ2xCLFlBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0MsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQ3RCO0FBQ0EsUUFBUSxRQUFRLENBQUMsTUFBTTtBQUN2QixZQUFZLElBQUksQ0FBQyxZQUFZLENBQUMsUUFB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UyxFQUFFLENBQUM7QUFDbEIsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDL0MsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDL0MsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDL0MsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDL0MsRUFBRSxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDbEIsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDZixDQUFDO0FBQ0Q7QUFDQSxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDcEIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLElBQUksUUFBUSxDQUFDO0FBQ2I7QUFDQTtBQUNBLGVBQWUsWUFBWSxHQUFHO0FBQzlCLEVBQUUsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUMzRCxFQUFFLFNBQVMsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFDM0MsRUFBRSxJQUFJLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlDO0FBQ0EsRUFBRSxJQUFJLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBQ2xGLEVBQUUs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QUM7QUFDM0Y7QUFDQSxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2xEO0FBQ0EsSUFBSSxJQUFJLFVBQVUsR0FBRyxNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSUQsSUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUNoRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUI7QUFDQSxJQUFJLE1BQU0sY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDO0FBQ0EsSUFBRztBQUNIO0FBQ0EsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUk7QUFDekI7QUFDQSxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsRTtBQUNBLElBQUksSUFBSSxRQUFRLEtBQUssU0FBUztBQUM5QixNQUFNLE9BQU87QUFDYjtBQUNBLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEdBQUcsWUFBWSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDLENBQUM7QUFDeEs7QUFDQSxJQUFJLElBQUksV0FBVyxJQUFJLFNBQVM7QUFDaEMsSUFBSTtBQUNKLE1BQU0sSUFBSSxTQUFTLEdBQUcsQ0FBQyxJQUFJQyxJQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN4SCxNQUFNLFVBQVUsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUM3RSxLQUFLO0FBQ0wsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ1QsQ0FBQztBQUNEO0FBQ0EsTUFBTSxZQUFZLEVBQUUsQ0FBQztBQUNyQjtBQUNBLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNiO0FBQ0EiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOSwyMCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMSwzMiwzMywzNCwzNSwzNiwzN119
