import * as rnd from "./system/system.js";

export class Skysphere {
  static async create() {
    let mtl, tex, prim, _this;

    return _this = {
      name: "skysphere",
      texture: null,

      async init(system) {
        mtl = await system.createMaterial("./shaders/skysphere");

        tex = system.createTexture();
        tex.load("./bin/imgs/lakhta.png");

        mtl.textures.push(tex);
        mtl.ubo = system.createUniformBuffer();
        mtl.uboNameOnShader = "projectionInfo";

        prim = await system.createEmptyPrimitive(4, rnd.Topology.TRIANGLE_STRIP, mtl);

        _this.texture = tex;
      },

      response(system) {
        // 'perspective-correct' direction vectors
        let dir = system.camera.dir.mul(system.camera.near);
        let rgh = system.camera.right.mul(system.camera.projSize.w);
        let tup = system.camera.up.mul(system.camera.projSize.h);

        mtl.ubo.writeData(new Float32Array([
          dir.x, dir.y, dir.z, 0,
          rgh.x, rgh.y, rgh.z, 0,
          tup.x, tup.y, tup.z, 0
        ]));

        system.drawMarkerPrimitive(prim);
      }
    };
  } /* create */
} /* Skysphere */

/* skysphere.js */