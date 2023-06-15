import * as rnd from "./system.js";
import * as mth from "./mth.js";
import * as cameraController from "./unit_camera_controller.js";
import {Banner} from "./unit_banner.js";
import {Skysphere} from "./unit_skysphere.js";

let system = new rnd.System();

// add necessary
system.addUnit(cameraController.Arcball.create);
let currentSkysphere = system.addUnit(Skysphere.create);

let spherePrim = await system.createPrimitive(
  rnd.Topology.sphere(),
  await system.createMaterial("./shaders/point_sphere")
);
// sphere
let sphereCount = 0;

async function createNode(location) {
  let matr = mth.Mat4.translate(location);

  let banner = await Banner.create(system, location.add(new mth.Vec3(0, 2, 0)), "{}");
  let unit = await system.addUnit(function() {
    return {
      name: "",
      type: "node",
      pos:  location.copy(),
      banner: banner,
      response(system) {
        system.drawMarkerPrimitive(spherePrim, matr);
      },
    };
  });

  unit.name = `node#${sphereCount++}`;
  unit.banner.show = false;

  return unit;
} /* createNode */



const nodeEditorPositions = "pointSetter";
const nodeEditorContents = "pointContents";
const nodeEditorConnections = "pointConnections";

// current editor enum value
let nodeEditor = nodeEditorPositions;

// nodes
let nodes = [];
// connections between nodes
let connections = [];

// node pointing unit
const nodeContentShower = system.addUnit(async function() {
  let localX = 0, localY = 0;
  
  system.canvas.addEventListener("mousemove", (event) => {
    localX = event.clientX;
    localY = event.clientY;
  });
  
  let activeUnit = undefined;
  
  return {
    response(system) {
      let unit = system.getUnitByCoord(localX, localY);
      
      if (activeUnit !== undefined) {
        activeUnit.banner.show = false;
        activeUnit = undefined;
      }
      
      if (unit !== undefined && unit.type === "node") {
        unit.banner.show = true;
        activeUnit = unit;
      }
    } /* response */
  }
});

// add point setter unit
const editorPositions = system.addUnit(async function() {
  let pointEvents = [];

  system.canvas.addEventListener("mousedown", (event) => {
    if (nodeEditor !== nodeEditorPositions) {
      return;
    }

    if ((event.buttons & 1) == 1) {
      pointEvents.push({
        x: event.clientX,
        y: event.clientY
      });
    }
  });

  return {
    response(system) {
      if (nodeEditor !== nodeEditorPositions) {
        return;
      }

      // handle pointEvents
      for (let i = 0; i < pointEvents.length; i++) {
        let p = pointEvents[i];
        let coord = system.getPositionByCoord(p.x, p.y);
        let name = system.getUnitByCoord(p.x, p.y).name;
        
        if (name === "baseConstruction" && (coord.x !== coord.y || coord.y !== coord.z)) {
          let add = true;

          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].pos.distance(coord) <= 3) {
              add = false;
              break;
            }
          }
          if (add) {
            createNode(coord).then((sphereUnit) => {
              nodes.push(sphereUnit);
            });
          }

        }
      }

      pointEvents = [];
    } /* response */
  };
});

// shows basic construction, will be handling minimap
const baseConstructionShower = system.addUnit(async function() {
  let pointPlane = await system.createPrimitive(
    rnd.Topology.plane(30, 30),
    await system.createMaterial("./shaders/default")
  );

  return {
    name: "baseConstruction",
    response(system) {
      system.drawPrimitive(pointPlane);
    }
  };
});

const editorConnections = system.addUnit(async function() {
  let edges = {
    first: null,
    second: null
  };

  system.canvas.addEventListener("mousedown", (event) => {
    if (edges.first === null) {
      edges.first = {
        x: event.clientX,
        y: event.clientY
      };
    } else {
      edges.second = {
        x: event.clientX,
        y: event.clientY,
      };
    }
  });

  return {
    response(system) {
      if (nodeEditor != nodeEditorConnections) {
        return;
      }

      // handle point events
      for (let i = 0; i < pointEventPairs.length; i++) {
        let eventPair = pointEventPairs[i];
      }
    } /* response */
  };
});

system.run();

/* main.js */