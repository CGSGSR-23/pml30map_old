import * as rnd from "./system.js";
import * as mth from "./mth.js";
import * as cameraController from "./unit_camera_controller.js";
import {Banner} from "./unit_banner.js";
import {Skysphere} from "./unit_skysphere.js";

let system = new rnd.System();

// add necessary
system.addUnit(cameraController.Arcball.create);
system.addUnit(Skysphere.create);

// node and connection units collection
let nodes = {};
let connections = {};

// creates new node on this location
let nodeUniqueID = 0;
let nodePrim = await system.createPrimitive(rnd.Topology.sphere(), await system.createMaterial("./shaders/point_sphere"));
async function createNode(location) {
  let matr = mth.Mat4.translate(location);

  let id = nodeUniqueID++;
  let name = `node#${id}`;
  let banner = await Banner.create(system, location.add(new mth.Vec3(0, 2, 0)), name);
  let unit = await system.addUnit(function() {
    return {
      type: "node",
      nodeID: id,
      pos:  location.copy(),
      banner: banner,
      skyspherePath: "",
      response(system) {
        system.drawMarkerPrimitive(nodePrim, matr);
      }, /* response */
    };
  });

  Object.defineProperty(unit, "name", {
    get: function() {
      return name;
    }, /* get */

    set: function(newName) {
      banner.content = newName;
      name = newName;
    } /* set */
  });

  banner.nodeID = unit.nodeID;

  // working with backend
  nodes[unit.nodeID] = unit;

  return unit;
} /* createNode */

let connectionPrimitive = await system.createPrimitive(rnd.Topology.cylinder(), await system.createMaterial("./shaders/connection"));
let connectionUniqueID = 0;
async function createConnection(firstNode, secondNode) {
  // check if connection is possible
  if (firstNode === secondNode) {
    console.error("Can't create connection between same nodes");
    return null;
  }
  for (const index in connections) {
    let connection = connections[index];

    if (firstNode === connection.first && secondNode === connection.second ||
        firstNode === connection.second && secondNode === connection.first) {
      console.error(`connection {${firstNode.name}, ${secondNode.name}} already exists`);
      return connection;
    }
  }

  let transform = mth.Mat4.identity();

  let unit = await system.addUnit(function() {
    return {
      first: firstNode,
      second: secondNode,
      type: "connection",
      connectionID: connectionUniqueID++,

      updateTransform() {
        let dir = unit.second.pos.sub(unit.first.pos);
        let dist = dir.length();
        dir = dir.mul(1.0 / dist);
      
        transform = mth.Mat4.scale(new mth.Vec3(0.5, dist, 0.5)).mul(mth.Mat4.rotate(Math.PI / 2, new mth.Vec3(-dir.z, 0, dir.x))).mul(mth.Mat4.translate(unit.first.pos));
      }, /* updateTransform */

      response(system) {
        system.drawPrimitive(connectionPrimitive, transform);
      } /* response */
    };
  });
  unit.updateTransform();

  // Working with backend
  connections[unit.connectionID] = unit;

  return unit;
} /* createConnection */

// shows basic construction, will be handling minimap
const baseConstructionShower = await system.addUnit(async function() {
  let pointPlane = await system.createPrimitive(
    rnd.Topology.plane(2, 2),
    await system.createMaterial("./shaders/default")
  );
  let transform = mth.Mat4.scale(new mth.Vec3(60, 1, 60)).mul(mth.Mat4.translate(new mth.Vec3(-30, 0, -30)));

  return {
    name: "baseConstruction",
    response(system) {
      system.drawPrimitive(pointPlane, transform);
    } /* response */
  };
}); /* baseConstructionShower */

// node pointing unit
const nodeContentShower = await system.addUnit(async function() {
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
const editorPositions = await system.addUnit(async function() {
  let pointEvents = [];

  system.canvas.addEventListener("mousedown", (event) => {
    if ((event.buttons & 1) == 1 && event.altKey) {
      pointEvents.push({
        x: event.clientX,
        y: event.clientY
      });
    }
  });

  return {
    response(system) {
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
const editorConnections = await system.addUnit(async function() {
  let pointEvent = null;
  let eventPair = null;

  system.canvas.addEventListener("mousedown", (event) => {
    if (event.buttons & 1 === 1) {
      pointEvent = {
        x: event.clientX,
        y: event.clientY
      };
    }
  });

  return {
    response(system) {
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

const editorContents = await system.addUnit(() => {
  let contentEditor = document.getElementById("nodeContentsEditor");
  let inputElements = {
    nodeID: document.getElementById("nodeID"),
    nodeName: document.getElementById("nodeName"),
    skyspherePath: document.getElementById("skyspherePath")
  };

  let currentUnit = null;
  system.canvas.addEventListener("mousedown", (event) => {
    let clickPosition = { x: event.clientX, y: event.clientY };

    let unit = system.getUnitByCoord(clickPosition.x, clickPosition.y);

    if (unit === undefined || unit.type != "node") {
      inputElements.nodeID.innerText = "";
      inputElements.nodeName.value = "";
      inputElements.skyspherePath.value = "";

      currentUnit = null;
      delta = {x: 0, y: 0};
    } else {
      inputElements.nodeID.innerText = unit.nodeID;
      inputElements.nodeName.value = unit.name;
      inputElements.skyspherePath.value = unit.skyspherePath;

      currentUnit = unit;
    }
  }); /* event system.canvas:"mousedown" */

  inputElements.nodeName.addEventListener("change", () => {
    if (currentUnit !== null) {
      currentUnit.name = inputElements.nodeName.value;
    }
  }); /* event inputElements.nodeName:"change" */

  inputElements.skyspherePath.addEventListener("change", () => {
    if (currentUnit !== null) {
      currentUnit.skyspherePath = inputElements.skyspherePath.value;
    }
  }); /* event inputElements.skyspherePath:"change" */

  let delta = {
    x: 0,
    y: 0
  };
  system.canvas.addEventListener("mousemove", (event) => {
    if (currentUnit !== null && event.buttons & 1 === 1) {
      delta.x += event.movementX;
      delta.y += event.movementY;
    }
  }); /* event system.canvas:"mousemove" */

  return {
    response(system) {

    }, /* response */
  };
}); /* editorContents */

// start system
system.run();

/* main.js */