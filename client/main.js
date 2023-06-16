import * as rnd from "./system.js";
import * as mth from "./mth.js";
import * as cameraController from "./unit_camera_controller.js";
import {Banner} from "./unit_banner.js";
import {Skysphere} from "./unit_skysphere.js";
import { loadShader } from "./shader.js";

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


// nodes
let nodes = {};
// connections between nodes
let connections = {};

// creates new node on this location
let nodeUniqueID = 0;
async function createNode(location) {
  let matr = mth.Mat4.translate(location);

  let id = nodeUniqueID++;
  let banner = await Banner.create(system, location.add(new mth.Vec3(0, 2, 0)), `node#${id}`);
  let unit = await system.addUnit(function() {
    return {
      name: "",
      type: "node",
      nodeID: id,
      pos:  location.copy(),
      banner: banner,
      response(system) {
        system.drawMarkerPrimitive(spherePrim, matr);
      },
    };
  });

  unit.name = `node#${sphereCount++}`;
  banner.nodeID = unit.nodeID;

  // working with backend
  nodes[unit.nodeID] = unit;

  return unit;
} /* createNode */

// primitive is same for all connections of this location
let connectionPrimitive = await system.createPrimitive(rnd.Topology.cone(), await system.createMaterial("./shaders/connection"));
let connectionUniqueID = 0;
async function createConnection(firstNode, secondNode) {
  if (firstNode === secondNode) {
    console.log("Can't create connection between same nodes");
    return null;
  }

  let dir = secondNode.pos.sub(firstNode.pos);
  let dist = firstNode.pos.distance(secondNode.pos);
  dir = dir.mul(1.0 / dist);
  let right = new mth.Vec3(-dir.z, 0, dir.x);

  let transform = mth.Mat4.scale(new mth.Vec3(0.5, dist, 0.5)).mul(mth.Mat4.rotate(Math.PI / 2, right)).mul(mth.Mat4.translate(firstNode.pos.add(right.mul(0.5))));

  let unit = await system.addUnit(function() {
    return {
      first: firstNode,
      second: secondNode,
      type: "connection",
      connectionID: connectionUniqueID++,
      
      response(system) {
        system.drawPrimitive(connectionPrimitive, transform);
      } /* response */
    };
  });

  // Working with backend
  connections[unit.connectionID] = unit;

  return unit;
} /* createConnection */

const nodeEditorPositions = "pointSetter";
const nodeEditorContents = "pointContents";
const nodeEditorConnections = "pointConnections";

// current editor enum value
let nodeEditor = nodeEditorPositions;

let modeSelector = document.getElementById("selectEditorMode");
modeSelector.addEventListener("change", () => {
  nodeEditor = modeSelector.value;
});

// shows basic construction, will be handling minimap
const baseConstructionShower = system.addUnit(async function() {
  let pointPlane = await system.createPrimitive(
    rnd.Topology.plane(2, 2),
    await system.createMaterial("./shaders/default")
  );
  let transform = mth.Mat4.scale(new mth.Vec3(50, 1, 50));

  return {
    name: "baseConstruction",
    response(system) {
      system.drawPrimitive(pointPlane, transform);
    }
  };
}); /* baseConstructionShower */

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

      if (unit !== undefined && unit.type === "banner") {
        return;
      }

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
}); /* nodeConnectionShower */

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
            createNode(coord);
          }

        }
      }

      pointEvents = [];
    } /* response */
  };
}); /* editorPositions */

// edit connections between nodes
const editorConnections = system.addUnit(async function() {
  let pointEvent = null;
  let eventPair = null;

  system.canvas.addEventListener("mousedown", (event) => {
    if (nodeEditor != nodeEditorConnections) {
      return;
    }
    
    pointEvent = {
      x: event.clientX,
      y: event.clientY
    };
  });

  return {
    response(system) {
      if (nodeEditor != nodeEditorConnections) {
        return;
      }

      if (pointEvent === null) {
        return;
      }

      let unit = system.getUnitByCoord(pointEvent.x, pointEvent.y);

      if (unit !== undefined && unit.type === "node") {

        pointEvent.unit = unit;

        if (eventPair === null) {
          eventPair = {
            first: pointEvent,
            second: null
          };
          eventPair.first.bannerPromise = Banner.create(system, unit.pos.add(new mth.Vec3(0, 4, 0)), "First element");
        } else {
          eventPair.second = pointEvent;

          eventPair.first.bannerPromise.then(banner => banner.doSuicide = true);
          createConnection(eventPair.first.unit, eventPair.second.unit);

          eventPair = null;
        }
      }
      pointEvent = null;
    } /* response */
  };
}); /* editorConnections */

system.run();

/* main.js */