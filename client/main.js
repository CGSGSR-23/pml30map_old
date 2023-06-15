import * as tcgl from "./system.js";
import * as mth from "./mth.js";

let system = new tcgl.System();

system.addUnit(async function() {
  let tpl = tcgl.rnd.Topology.square();
  let mtl = await system.render.createMaterial("./shaders/skysphere");

  let tex = system.render.createTexture();
  tex.load("./lakhta.png");

  mtl.textures.push(tex);
  mtl.ubo = system.render.createUniformBuffer();
  mtl.uboNameOnShader = "projectionInfo";

  let prim = await system.render.createPrimitive(tpl, mtl);

  return {
    response(system) {
      // 'perspective-correct' direction vectors
      let dir = system.render.camera.dir.mul(system.render.camera.near);
      let rgh = system.render.camera.right.mul(system.render.camera.projSize.w);
      let tup = system.render.camera.up.mul(system.render.camera.projSize.h);
      
      mtl.ubo.writeData(new Float32Array([
        dir.x, dir.y, dir.z, 0,
        rgh.x, rgh.y, rgh.z, 0,
        tup.x, tup.y, tup.z, 0
      ]));

      system.render.drawPrimitive(prim);
    }
  };
});

// io unit
system.addUnit(async function() {
  // let mtl = system.render.createMaterial("./model");

  let canvas = document.getElementById("canvas");
  canvas.addEventListener();
});

// camera unit
system.addUnit(function() {
  const up = new mth.Vec3(0, 1, 0);
  let loc = new mth.Vec3(19.88, 11.67, 9.20), at = new mth.Vec3(8.90, 5.32, -4.65);
  let radius = at.sub(loc).length();

  let camera = {
    response(system) {
      system.render.camera.set(loc, at, up);
    } /* response */
  };

  const onMouseMove = function(event) {
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
    let delta = event.deltaY / 100.0;

    loc = loc.add(at.sub(loc).mul(delta * system.timer.deltaTime));
  };

  let canvas = document.getElementById("canvas");

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("wheel", onWheel);

  return camera;
});

system.run();

/* main.js */