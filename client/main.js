import * as rnd from "./system.js";
import * as mth from "./mth.js";

let system = new rnd.System();

// skysphere unit
system.addUnit(async function() {
  let tpl = rnd.Topology.square();
  let mtl = await system.createMaterial("./shaders/skysphere");

  let tex = system.createTexture();
  tex.load("./bin/imgs/lakhta.png");

  mtl.textures.push(tex);
  mtl.ubo = system.createUniformBuffer();
  mtl.uboNameOnShader = "projectionInfo";

  let prim = await system.createPrimitive(tpl, mtl);

  return {
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

      system.drawPrimitive(prim);
    }
  };
});

// model test
system.addUnit(async function() {
  let mtl = await system.createMaterial("./shaders/default");
  let prim = await system.createPrimitive(await rnd.Topology.model_obj("./cow.obj"), mtl);

  return {
    response(system) {
      system.drawPrimitive(prim);
    } /* response */
  };
});

// camera unit
system.addUnit(function() {
  const up = new mth.Vec3(0, 1, 0);
  let loc = new mth.Vec3(19.88, 11.67, 9.20), at = new mth.Vec3(8.90, 5.32, -4.65);
  let radius = at.sub(loc).length();

  let camera = {
    response(system) {
      system.camera.set(loc, at, up);
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