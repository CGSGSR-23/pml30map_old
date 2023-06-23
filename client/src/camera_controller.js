import * as mth from "./system/mth.js";

export class Arcball {
    // camera unit
    static create() {
    const up = new mth.Vec3(0, 1, 0);
    let loc = new mth.Vec3(30, 30, 30), at = new mth.Vec3(0, 0, 0);
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


export class Rotator {
  // camera unit
  static create() {
    const up = new mth.Vec3(0, 1, 0);
    let radius = 1;

    let camera = {
      loc: new mth.Vec3(30, 30, 30),
      at: new mth.Vec3(0, 0, 0),
      projSize: 1,
      response(system) {
        system.camera.set(camera.loc, camera.at, up);
        system.camera.projSet(1, 100, new mth.Size(camera.projSize, camera.projSize));
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
        moveCursor((new mth.Vec2(event.movementX, event.movementY)).mul(1.0 / 200.0));
      }
    });

    canvas.addEventListener("wheel", (event) => {
      let delta = event.deltaY / 700.0;

      camera.projSize += camera.projSize * delta;
      camera.projSize = clamp(camera.projSize, 0.1, 1);
    });


    let touchPosition = null;
    canvas.addEventListener("touchstart", (event) => {
      touchPosition = new mth.Vec2(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      );
    });

    canvas.addEventListener("touchmove", (event) => {
      if (touchPosition === null) {
        return;
      }

      let newTouchPosition = new mth.Vec2(
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