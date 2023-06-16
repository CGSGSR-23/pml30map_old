// system imports
import * as rnd from "./system/system.js";
import * as mth from "./system/mth.js";

import * as cameraController from "./camera_controller.js";
import {Banner} from "./banner.js";
import {Skysphere} from "./skysphere.js";

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
  let transform = mth.Mat4.translate(location);

  let id = nodeUniqueID++;
  let name = `node#${id}`;
  let banner = await Banner.create(system, location.add(new mth.Vec3(0, 2, 0)), name);
  let position = location.copy();
  let unit = await system.addUnit(function() {
    return {
      type: "node",
      nodeID: id,
      banner: banner,
      skyspherePath: "",
      response(system) {
        system.drawMarkerPrimitive(nodePrim, transform);
      }, /* response */
    };
  });

  // position property
  Object.defineProperty(unit, "pos", {
    get: function() {
      return position;
    }, /* get */

    set: function(newPosition) {
      // check if node is possible to move here
      for (const [key, value] of Object.entries(nodes)) {
        if (value !== unit &&  value.pos.distance(newPosition) <= 2) {
          return false;
        }
      }

      // place node
      position = newPosition.copy();
      transform = mth.Mat4.translate(position);
      unit.banner.pos = position.add(new mth.Vec3(0, 2, 0));
      updateConnectionTransforms(unit);
    } /* set */
  });

  // name property
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

function destroyNode(node) {
  breakNodeConnections(node);
  node.doSuicide = true;
  node.banner.doSuicide = true;

  delete nodes[node.nodeID];
} /* destroyNode */

let connectionPrimitive = await system.createPrimitive(rnd.Topology.cylinder(), await system.createMaterial("./shaders/connection"));
let connectionUniqueID = 0;
async function createConnection(firstNode, secondNode) {
  // check if connection is possible
  if (firstNode === secondNode) {
    console.error("can't connect node with node itself");
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
        system.drawMarkerPrimitive(connectionPrimitive, transform);
      } /* response */
    };
  });
  unit.updateTransform();

  // Working with backend
  connections[unit.connectionID] = unit;

  return unit;
} /* createConnection */

// update transform matrices of all connections with node.
function updateConnectionTransforms(node = null) {
  for (const [key, value] of Object.entries(connections)) {
    if (value.first === node || value.second === node) {
      value.updateTransform();
    }
  }
} /* updateConnectionTransforms */

// delete all connections with node
function breakNodeConnections(node = null) {
  let keyList = [];
  for (const [key, value] of Object.entries(connections)) {
    if (value.first === node || value.second === node) {
      value.doSuicide = true;
      keyList.push(key);
    }
  }

  for (let key of keyList) {
    delete connections[key];
  }
} /* breakNodeConnections */

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
    if (event.buttons & 1 === 1 && !event.shiftKey) {
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
          // refuse connection with invalid banner
          if (eventPair.first.unit.doSuicide) {
            eventPair = null;
            return;
          }

          createConnection(eventPair.first.unit, eventPair.second.unit);

          eventPair = null;
        }
      }
      pointEvent = null;
    } /* response */
  };
}); /* editorConnections */

let inputElements = {
  nodeID: document.getElementById("nodeID"),
  nodeName: document.getElementById("nodeName"),
  skyspherePath: document.getElementById("skyspherePath"),
  deleteNode: document.getElementById("deleteNode")
};

// node pointing unit
let doMoveUnit = true;
let activeContentShowNode = null;

// current unit selector
let activeBannerShowUnit = null;
system.canvas.addEventListener("mousemove", (event) => {
  let unit = system.getUnitByCoord(event.clientX, event.clientY);

  if (unit === activeBannerShowUnit) {
    return;
  }

  if (unit !== undefined && unit.type === "banner") {
    return;
  }

  if (activeBannerShowUnit !== null) {
    activeBannerShowUnit.banner.show = false;
    activeBannerShowUnit = null;
  }

  if (unit !== undefined && unit.type === "node") {
    unit.banner.show = true;
    activeBannerShowUnit = unit;
  }
});

// unit content show selector
system.canvas.addEventListener("mousedown", (event) => {
  let unit = system.getUnitByCoord(event.clientX, event.clientY);

  if (unit === undefined || unit.type != "node") {
    inputElements.nodeID.innerText = "";
    inputElements.nodeName.value = "";
    inputElements.skyspherePath.value = "";

    activeContentShowNode = null;
    doMoveUnit = false;
  } else {
    inputElements.nodeID.innerText = unit.nodeID;
    inputElements.nodeName.value = unit.name;
    inputElements.skyspherePath.value = unit.skyspherePath;

    activeContentShowNode = unit;
    if (event.shiftKey) {
      doMoveUnit = true;
    }
  }
}); /* event system.canvas:"mousedown" */

system.canvas.addEventListener("mouseup", (event) => {
  doMoveUnit = false;
}); /* event system.canvas:"mouseup" */

system.canvas.addEventListener("mousemove", (event) => {
  if (activeContentShowNode !== null && doMoveUnit) {
    let position = system.getPositionByCoord(event.clientX, event.clientY);

    if (position.x !== position.y && position.y !== position.z) {
      activeContentShowNode.pos = position;
    } else {
      doMoveUnit = false;
    }
  }
}); /* event system.canvas:"mousemove" */


// current unit controls

inputElements.nodeName.addEventListener("change", () => {
  if (currentUnit !== null) {
    activeContentShowNode.name = inputElements.nodeName.value;
  }
}); /* event inputElements.nodeName:"change" */

inputElements.skyspherePath.addEventListener("change", () => {
  if (currentUnit !== null) {
    activeContentShowNode.skyspherePath = inputElements.skyspherePath.value;
  }
  console.log(Object.keys(connections).length);
}); /* event inputElements.skyspherePath:"change" */

inputElements.deleteNode.addEventListener("click", () => {
  if (currentUnit !== null) {
    destroyNode(activeContentShowNode);
    activeContentShowNode = null;
  }
}); /* event inputElements.deleteNode:"click" */

// start system
system.run();

/* main.js */