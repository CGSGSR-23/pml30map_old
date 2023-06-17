// system imports
import * as rnd from "./system/system.js";
import * as mth from "./system/mth.js";

import * as cameraController from "./camera_controller.js";
import {Banner} from "./banner.js";
import {Skysphere} from "./skysphere.js";

import {Connection, URI} from "./nodes.js";

export {Connection, URI};

let system = new rnd.System();
let server = new Connection();

// add necessary
system.addUnit(cameraController.Arcball.create);
system.addUnit(Skysphere.create, "./bin/imgs/lakhta.png");

// node and connection units collection
let nodes = {};
let connections = {};

// creates new node on this location
let nodePrim = await system.createPrimitive(rnd.Topology.sphere(), await system.createMaterial("./shaders/point_sphere"));
async function createNode(location, oldName = null, oldSkysphere = null, addedOnServer = false, oldNodeID = null) {
  let transform = mth.Mat4.translate(location);

  let position = location.copy();
  let unit = await system.addUnit(function() {
    return {
      skysphere: {
        rotation: 0,
      },
      type: "node",
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
      for (const value of Object.values(nodes)) {
        if (value !== unit &&  value.pos.distance(newPosition) <= 2) {
          return false;
        }
      }

      // place node
      position = newPosition.copy();
      transform = mth.Mat4.translate(position);
      unit.banner.pos = position.add(new mth.Vec3(0, 2, 0));
      updateConnectionTransforms(unit);

      // update server data
      server.updateNode(unit.nodeID, {position: position});
    } /* set */
  });

  // name property
  let name = oldName;
  Object.defineProperty(unit, "name", {
    get: function() {
      return name;
    }, /* get */

    set: function(newName) {
      unit.banner.content = newName;
      name = newName;
      // update server data

      server.updateNode(unit.nodeID, {name: name});
    } /* set */
  });

  let skyspherePath;
  if (oldSkysphere !== null) {
    skyspherePath = oldSkysphere.path;
    unit.skysphere.rotation = oldSkysphere.rotation;
  }
  Object.defineProperty(unit.skysphere, "path", {
    get: function() {
      return skyspherePath;
    }, /* get */

    set: function(newSkyspherePath) {
      skyspherePath = newSkyspherePath;

      // update server data
      server.updateNode(unit.nodeID, {
        skysphere: {
          path: skyspherePath,
          rotation: unit.skysphere.rotation,
        }
      });
    } /* set */
  });
  
  // get node id
  if (addedOnServer) {
    unit.nodeID = oldNodeID;
  } else {
    unit.nodeID = await server.addNode({
      name: unit.name,
      position: position,
      skysphere: {
        path: unit.skysphere.path,
        rotation: unit.skysphere.rotation
      }
    });
  }

  // add name if it's undefined
  if (name === null) {
    name = `node#${unit.nodeID}`;
  }

  unit.banner = await Banner.create(system, name, location, 2);
  unit.banner.show = false;

  nodes[unit.nodeID.toStr()] = unit;
  unit.banner.nodeID = unit.nodeID;

  return unit;
} /* createNode */

function destroyNode(node) {
  breakNodeConnections(node);
  node.doSuicide = true;
  node.banner.doSuicide = true;
  server.delNode(node.nodeID);

  delete nodes[node.nodeID];
} /* destroyNode */

let connectionPrimitive = await system.createPrimitive(rnd.Topology.cylinder(), await system.createMaterial("./shaders/connection"));
let connectionUniqueID = 0;
async function createConnection(firstNode, secondNode, addedOnServer = false) {
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
        let elevation = Math.acos(dir.y);

        transform = mth.Mat4.scale(new mth.Vec3(0.5, dist, 0.5)).mul(mth.Mat4.rotate(elevation, new mth.Vec3(-dir.z, 0, dir.x))).mul(mth.Mat4.translate(unit.first.pos));
      }, /* updateTransform */

      response(system) {
        system.drawMarkerPrimitive(connectionPrimitive, transform);
      } /* response */
    };
  });
  unit.updateTransform();

  // Working with backend
  if (!addedOnServer) {
    await server.connectNodes(firstNode.nodeID, secondNode.nodeID);
  }

  connections[unit.connectionID] = unit;

  return unit;
} /* createConnection */

function destroyConnection(connection) {
  connection.doSuicide = true;
  console.log(connection.first.nodeID.toStr(), connection.second.nodeID.toStr());
  server.disconnectNodes(connection.first.nodeID, connection.second.nodeID);
  delete connections[connection.connectionID];
} /* destroyConnection */

// update transform matrices of all connections with node.
function updateConnectionTransforms(node = null) {
  for (const value of Object.values(connections)) {
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
    destroyConnection(connections[key]);
  }
} /* breakNodeConnections */

// add previous session nodes and connections
async function addServerData() {
  let serverNodeIDs = await server.getAllNodes();

  for (let nodeID of serverNodeIDs) {
    let serverNode = await server.getNode(nodeID);

    await createNode(mth.Vec3.fromObject(serverNode.position), serverNode.name, serverNode.skysphere, true, nodeID);
  }

  // same shit, but with nice sth
  let serverConnections = await server.getAllConnections();

  for (let connection of serverConnections) {
    let node1 = nodes[connection[0].toStr()];
    let node2 = nodes[connection[1].toStr()];

    createConnection(
      node1,
      node2,
      true
    );
  }
} /* addServerData */
await addServerData();

// shows basic construction, will be handling minimap
const baseConstructionShower = await system.addUnit(async function() {
  let baseConstructionMaterial = await system.createMaterial("./shaders/default");

  let pointPlane = await system.createPrimitive(rnd.Topology.plane(2, 2), baseConstructionMaterial);
  let transform = mth.Mat4.scale(new mth.Vec3(400, 1, 400)).mul(mth.Mat4.translate(new mth.Vec3(-200, 0, -200)));

  return {
    name: "baseConstruction",
    response(system) {
      system.drawPrimitive(pointPlane, transform);
    } /* response */
  };
}); /* baseConstructionShower */

system.canvas.addEventListener("mousedown", (event) => {
  if ((event.buttons & 1) !== 1 || !event.altKey) {
    return;
  }

  let coord = system.getPositionByCoord(event.clientX, event.clientY);
  let name = system.getUnitByCoord(event.clientX, event.clientY).name;

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
}); /* event system.canvas:"mousedown" */

// edit connections between nodes
const editorConnections = await system.addUnit(async function() {
  let pointEvent = null;
  let eventPair = null;

  system.canvas.addEventListener("mousedown", (event) => {
    if ((event.buttons & 2) === 2 && !event.shiftKey && event.altKey) {
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
          eventPair.first.bannerPromise = Banner.create(system, "First element", unit.pos, 4);
        } else {
          eventPair.second = pointEvent;

          // erase banner
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

let nodeParameters = document.getElementById("nodeParameters");
let nodeInputParameters = {
  nodeID: document.getElementById("nodeID"),
  nodeName: document.getElementById("nodeName"),
  skyspherePath: document.getElementById("skyspherePath"),
  makeDefault: document.getElementById("makeDefault"),
  deleteNode: document.getElementById("deleteNode")
};

let connectionParameters = document.getElementById("connectionParameters");
let connectionInputParameters = {
  deleteConnection: document.getElementById("deleteConnection")
};

// node pointing unit
let doMoveNode = true;
let activeContentShowNode = null;
let activeContentShowConnection = null;

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
  if ((event.buttons & 1) !== 1) {
    return;
  }

  let unit = system.getUnitByCoord(event.clientX, event.clientY);

  nodeInputParameters.nodeID.innerText = "";
  nodeInputParameters.nodeName.value = "";
  nodeInputParameters.skyspherePath.value = "";

  activeContentShowNode = null;
  activeContentShowConnection = null;
  doMoveNode = false;

  if (unit === undefined) {
    return;
  }

  if (unit.type === "node") {
    nodeParameters.removeAttribute("hidden");
    connectionParameters.setAttribute("hidden", "");

    nodeInputParameters.nodeID.innerText = unit.nodeID.toStr();
    nodeInputParameters.nodeName.value = unit.name;
    nodeInputParameters.skyspherePath.value = unit.skysphere.path;

    activeContentShowNode = unit;
    if (event.shiftKey) {
      doMoveNode = true;
    }
  } else if (unit.type === "connection") {
    nodeParameters.setAttribute("hidden", "");
    connectionParameters.removeAttribute("hidden");

    activeContentShowConnection = unit;
  } else {
    nodeParameters.setAttribute("hidden", "");
    connectionParameters.setAttribute("hidden", "");
  }
}); /* event system.canvas:"mousedown" */

system.canvas.addEventListener("mouseup", (event) => {
  doMoveNode = false;
}); /* event system.canvas:"mouseup" */

system.canvas.addEventListener("mousemove", (event) => {
  if (activeContentShowNode !== null && doMoveNode) {
    let position = system.getPositionByCoord(event.clientX, event.clientY);

    if (position.x !== position.y && position.y !== position.z) {
      activeContentShowNode.pos = position;
    } else {
      doMoveNode = false;
    }
  }
}); /* event system.canvas:"mousemove" */


// current unit controls

nodeInputParameters.nodeName.addEventListener("change", () => {
  if (activeContentShowNode !== null) {
    activeContentShowNode.name = nodeInputParameters.nodeName.value;
  }
}); /* event nodeInputParameters.nodeName:"change" */

nodeInputParameters.skyspherePath.addEventListener("change", () => {
  if (activeContentShowNode !== null) {
    activeContentShowNode.skysphere.path = nodeInputParameters.skyspherePath.value;
  }
}); /* event nodeInputParameters.skyspherePath:"change" */

nodeInputParameters.makeDefault.addEventListener("click", () => {
  if (activeContentShowNode !== null) {
    server.setDefNodeURI(activeContentShowNode.nodeID).then(() => {console.log(`new default node: ${activeContentShowNode.name}`)});
  }
}); /* event nodeInputParameters.makeDefault:"click" */

nodeInputParameters.deleteNode.addEventListener("click", () => {
  if (activeContentShowNode !== null) {
    destroyNode(activeContentShowNode);
    activeContentShowNode = null;
  }
}); /* event nodeInputParameters.deleteNode:"click" */

connectionInputParameters.deleteConnection.addEventListener("click", () => {
  if (activeContentShowConnection !== null) {
    destroyConnection(activeContentShowConnection);
    activeContentShowConnection = null;
  }
}); /* event connectionInputParameters.deleteConnection:"click" */

// preview mode redirecting button
document.getElementById("toPreview").addEventListener("click", () => {
  window.location.href = "./viewer.html";
}); /* event document.getElementById("preview"):"click" */

// start system
system.run();

/* main.js */