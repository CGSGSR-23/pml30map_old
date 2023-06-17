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
      if (!event.ctrlKey) {
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
      
      loc = loc.add(at.sub(loc).mul(delta));
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
      response(system) {
        system.camera.set(camera.loc, camera.at, up);
      } /* response */
    };

    const onMouseMove = function(event) {
      if ((event.buttons & 1) == 1) { // rotate
        let direction = camera.loc.sub(camera.at);

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

        camera.loc = camera.at.add(direction);
      }
      
      /*
      if ((event.buttons & 2) == 2) { // move
        let dir = at.sub(loc).normalize();
        let rgh = dir.cross(up).normalize();
        let tup = rgh.cross(dir);
        
        let delta = rgh.mul(-event.movementX * radius / 300.0).add(tup.mul(event.movementY * radius / 300.0));
        loc = loc.add(delta);
        at = at.add(delta);
      }
      */
    }; /* onMouseMove */

    const onWheel = function(event) {
      let delta = event.deltaY / 2000.0;
      
      camera.loc = camera.loc.add(camera.at.sub(camera.loc).mul(delta));
    }; /* onWheel */
    
    let canvas = document.getElementById("canvas");
    
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel);
    
    return camera;
  } /* create */
} /* Arcball */

/* camera_controller.js */