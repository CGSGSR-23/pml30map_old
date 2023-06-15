import * as rnd from "./system.js";


let bannerShader = null;

export class Banner {
  static async create(system, pos, content) {
    if (bannerShader === null) {
      bannerShader = await system.createShader("./shaders/banner");
    }

    let infoPrim, mtl, _this;
    return system.addUnit(() => {
      return _this = {
        show: true,
        async init(system) {
          mtl = await system.createMaterial(bannerShader);
          mtl.ubo = system.createUniformBuffer();
          mtl.uboNameOnShader = "bannerBuffer";

          infoPrim = system.createEmptyPrimitive(4, rnd.Topology.TRIANGLE_STRIP, mtl);

          mtl.textures.push(system.createTexture());
          _this.updateContent(content);
        }, /* init */

        updateContent(newContent) {
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
        }, /* updateContent */

        response(system) {
          if (_this.show) {
            let up = system.camera.up;
            let rgh = system.camera.right.mul(content.length / 3.0);
            let data = new Float32Array([
              up.x,  up.y,  up.z,  1,
              rgh.x, rgh.y, rgh.z, 1,
              pos.x, pos.y, pos.z, 1
            ]);

            mtl.ubo.writeData(data);
            system.drawMarkerPrimitive(infoPrim);
          }
        } /* response */
      };
    });
  } /* addBanner */
} /* Banner */

/* unit_banner.js */