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

// add base construction
let floorBase = 0.0;
let floorHeight = 4.5;
let cuttingHeight;

let cuttingHeightElement = document.getElementById("baseConstructionCuttingHeight");
cuttingHeight = floorBase + cuttingHeightElement.value * floorHeight;

let baseConstructionMaterial = await system.createMaterial("./shaders/baseConstruction");
cuttingHeightElement.addEventListener("input", () => {
  cuttingHeight = floorBase + cuttingHeightElement.value * floorHeight;
  baseConstructionMaterial.ubo.writeData(new Float32Array([cuttingHeight]));
});

// displays basic construction
const baseConstructionDisplayer = await system.addUnit(async function() {
  let buildingModel = await system.createPrimitive(
    await rnd.Topology.model_obj("./bin/models/worldmap"),
    baseConstructionMaterial
  );

  baseConstructionMaterial.uboNameOnShader = "materialUBO";
  baseConstructionMaterial.ubo = system.createUniformBuffer();

  // initialization
  baseConstructionMaterial.ubo.writeData(new Float32Array([cuttingHeight]));

  return {
    type: "baseConstruction",
    response(system) {
      system.drawPrimitive(buildingModel);
    } /* response */
  };
}); /* baseConstructionDisplayer */

// node and connection units collection
let nodes = {};
let connections = {};


let nodePrim = await system.createPrimitive(rnd.Topology.sphere(0.2), await system.createMaterial("./shaders/point_sphere")); // primitive of any node displayed

// creates new node
async function createNode(data, addedOnServer = false) {
  // check if new node is possible to be placed
  if (!addedOnServer) {
    for (let oldNode of Object.values(nodes)) {
      if (data.position.distance(oldNode.position) <= 0.3) {
        return null;
      }
    }
  }

  let transform = mth.Mat4.translate(data.position);

  let position = data.position.copy();
  let unit = await system.addUnit(function() {
    return {
      skysphere: {
        rotation: 0,
      },

      type: "node",
      response(system) {
        if (data.position.y <= cuttingHeight) {
          system.drawMarkerPrimitive(nodePrim, transform);
        }
      }, /* response */
    };
  });

  // position property
  Object.defineProperty(unit, "position", {
    get() {
      return position;
    }, /* get */

    set(newPosition) {
      // check if node is possible to move here
      for (const value of Object.values(nodes)) {
        if (value !== unit &&  value.position.distance(newPosition) <= 0.3) {
          return false;
        }
      }

      // place node
      position = newPosition.copy();
      transform = mth.Mat4.translate(position);
      unit.banner.position = position.add(new mth.Vec3(0, 2, 0));
      updateConnectionTransforms(unit);

      // update server data
      server.updateNode(unit.nodeURI, {position: position});
    } /* set */
  });

  // name property
  let name = data.name;
  Object.defineProperty(unit, "name", {
    get() {
      return name;
    }, /* get */

    set(newName) {
      unit.banner.content = newName;
      name = newName;
      // update server data

      server.updateNode(unit.nodeURI, {name: name});
    } /* set */
  }); /* property unit:"name" */

  let floor = 0;
  Object.defineProperty(unit, "floor", {
    get() {
      return floor;
    }, /* get */

    set(newFloor) {
      floor = newFloor;
      server.updateNode(unit.nodeURI, {floor: floor});
    } /* set */
  }); /* property unit:"floor" */

  let skyspherePath;
  if (data.skysphere !== undefined) {
    skyspherePath = data.skysphere.path;
    unit.skysphere.rotation = data.skysphere.rotation;
  }

  // skysphere.path property
  Object.defineProperty(unit.skysphere, "path", {
    get: function() {
      return skyspherePath;
    }, /* get */

    set: function(newSkyspherePath) {
      skyspherePath = newSkyspherePath;

      // update server data
      server.updateNode(unit.nodeURI, {
        skysphere: {
          path: skyspherePath,
          rotation: unit.skysphere.rotation,
        }
      });
    } /* set */
  }); /* property unit.skysphere:"path" */

  // get node id
  if (addedOnServer) {
    unit.nodeURI = data.nodeURI;
  } else {
    unit.nodeURI = await server.addNode({
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
    name = `node#${unit.nodeURI}`;
  }

  // set floor
  unit.floor = data.floor === undefined ? 0 : data.floor;

  // set banner
  unit.banner = await Banner.create(system, name, position, 2);
  unit.banner.show = false;

  nodes[unit.nodeURI.toStr()] = unit;
  unit.banner.nodeURI = unit.nodeURI;

  return unit;
} /* createNode */

// destroy node
function destroyNode(node) {
  breakNodeConnections(node);
  node.doSuicide = true;
  node.banner.doSuicide = true;
  server.delNode(node.nodeURI);

  delete nodes[node.nodeURI];
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


  // Working with backend
  if (!addedOnServer) {
    if (!(await server.connectNodes(firstNode.nodeURI, secondNode.nodeURI))) {
      return null;
    }
  }

  let unit = await system.addUnit(function() {
    return {
      first: firstNode,
      second: secondNode,
      type: "connection",
      connectionID: connectionUniqueID++,

      updateTransform() {
        let dir = unit.second.position.sub(unit.first.position);
        let dist = dir.length();
        dir = dir.mul(1.0 / dist);
        let elevation = Math.acos(dir.y);

        transform = mth.Mat4.scale(new mth.Vec3(0.1, dist, 0.1)).mul(mth.Mat4.rotate(elevation, new mth.Vec3(-dir.z, 0, dir.x))).mul(mth.Mat4.translate(unit.first.position));
      }, /* updateTransform */

      response(system) {
        if (firstNode.position.y <= cuttingHeight || secondNode.position.y <= cuttingHeight) {
          system.drawMarkerPrimitive(connectionPrimitive, transform);
        }
      } /* response */
    };
  });
  unit.updateTransform();

  connections[unit.connectionID] = unit;

  return unit;
} /* createConnection */


function destroyConnection(connection) {
  connection.doSuicide = true;
  console.log(connection.first.nodeURI.toStr(), connection.second.nodeURI.toStr());
  server.disconnectNodes(connection.first.nodeURI, connection.second.nodeURI);
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


// delete all connections with specified node
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


// load previous session nodes and connections
async function addServerData() {
  let serverNodeURIs = await server.getAllNodes();
  let serverNodes = await server.getAllNodesData();

  for (let i = 0, count = serverNodes.length; i < count; i++) {
    let serverNode = serverNodes[i];
    await createNode({
      position  : mth.Vec3.fromObject(serverNode.position),
      name      : serverNode.name,
      skysphere : serverNode.skysphere,
      nodeURI   : serverNodeURIs[i],
      floor     : serverNode.floor == undefined ? 0 : serverNode.floor,
    }, true);
  }

  // same shit, but with nice sth
  let serverConnections = await server.getAllConnections();

  for (let connection of serverConnections) {
    createConnection(nodes[connection[0].toStr()], nodes[connection[1].toStr()], true);
  }
} /* addServerData */
await addServerData();

// adding node
system.canvas.addEventListener("mousedown", (event) => {
  if ((event.buttons & 1) === 1 && event.altKey) {
    let unit = system.getUnitByCoord(event.clientX, event.clientY);
  
    if (unit !== undefined && unit.type === "baseConstruction") {
      createNode({
        position: system.getPositionByCoord(event.clientX, event.clientY),
        name: "<empty_node>",
        floor: 0,
      });
    }
  }
}); /* event system.canvas:"mousedown" */

let eventPair = null;

// adding connection between nodes
system.canvas.addEventListener("mousedown", (event) => {
  if ((event.buttons & 2) === 2 && !event.shiftKey && event.altKey) {
    let pointEvent = {
      x: event.clientX,
      y: event.clientY
    };

    let unit = system.getUnitByCoord(pointEvent.x, pointEvent.y);

    if (unit !== undefined && unit.type === "node") {
  
      pointEvent.unit = unit;
  
      if (eventPair === null) {
        eventPair = {
          first: pointEvent,
          second: null
        };
        eventPair.first.bannerPromise = Banner.create(system, "First element", unit.position, 4);
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
  }
}); /* event system.canvas:"mousedown" */



// UI handling

let nodeParameters = document.getElementById("nodeParameters");
let nodeInputParameters = {
  nodeURI: document.getElementById("nodeURI"),
  nodeName: document.getElementById("nodeName"),
  skyspherePath: document.getElementById("skyspherePath"),
  nodeFloor: document.getElementById("nodeFloor"),
  nodeFloorValue: document.getElementById("nodeFloorValue"),
  makeDefault: document.getElementById("makeDefault"),
  deleteNode: document.getElementById("deleteNode")
}; /* nodeInputParameters */

let connectionParameters = document.getElementById("connectionParameters");
let connectionInputParameters = {
  nodesURI: document.getElementById("connectionNodesURI"),
  deleteConnection: document.getElementById("deleteConnection")
}; /* connectionInputParameters */

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

// unit name shower
system.canvas.addEventListener("mousedown", (event) => {
  if ((event.buttons & 1) !== 1 || event.ctrlKey) {
    return;
  }

  let unit = system.getUnitByCoord(event.clientX, event.clientY);

  nodeInputParameters.nodeURI.innerText = "";
  nodeInputParameters.nodeName.value = "";
  nodeInputParameters.skyspherePath.value = "";
  nodeInputParameters.nodeFloorValue.innerText = "";

  activeContentShowNode = null;
  activeContentShowConnection = null;
  doMoveNode = false;

  if (unit === undefined) {
    return;
  }

  if (unit.type === "node") {
    nodeParameters.removeAttribute("hidden");
    connectionParameters.setAttribute("hidden", "");

    nodeInputParameters.nodeURI.innerText = unit.nodeURI.toStr();
    nodeInputParameters.nodeName.value = unit.name;
    nodeInputParameters.skyspherePath.value = unit.skysphere.path;
    nodeInputParameters.nodeFloor.value = unit.floor;
    nodeInputParameters.nodeFloorValue.innerText = `${unit.floor}`;

    activeContentShowNode = unit;
    if (event.shiftKey) {
      doMoveNode = true;
    }
  } else if (unit.type === "connection") {
    connectionInputParameters.nodesURI.innerText = `${unit.first.nodeURI.toStr()} - ${unit.second.nodeURI.toStr()}`;

    nodeParameters.setAttribute("hidden", "");
    connectionParameters.removeAttribute("hidden");

    activeContentShowConnection = unit;
  } else {
    nodeParameters.setAttribute("hidden", "");
    connectionParameters.setAttribute("hidden", "");
  }
}); /* event system.canvas:"mousedown" */

// movement handler
system.canvas.addEventListener("mouseup", (event) => {
  doMoveNode = false;
}); /* event system.canvas:"mouseup" */

// node movement handler
system.canvas.addEventListener("mousemove", (event) => {
  if (activeContentShowNode !== null && doMoveNode) {
    let position = system.getPositionByCoord(event.clientX, event.clientY);

    if (position.x !== position.y && position.y !== position.z) {
      activeContentShowNode.position = position;
    } else {
      doMoveNode = false;
    }
  }
}); /* event system.canvas:"mousemove" */

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

nodeInputParameters.nodeFloor.addEventListener("input", () => {
  if (activeContentShowNode !== null) {
    activeContentShowNode.floor = nodeInputParameters.nodeFloor.value;
    nodeInputParameters.nodeFloorValue.innerText = activeContentShowNode.floor;
  }
}); /* event nodeInputParameters.nodeFloor:"input" */

nodeInputParameters.makeDefault.addEventListener("click", () => {
  if (activeContentShowNode !== null) {
    server.setDefNodeURI(activeContentShowNode.nodeURI).then(() => {console.log(`new default node: ${activeContentShowNode.name}`)});
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
  window.location.href = "./index.html" + window.location.search;
}); /* event document.getElementById("preview"):"click" */

// preview mode redirecting button
document.getElementById("toServer").addEventListener("click", () => {
  window.location.href = "./server.html" + window.location.search;
}); /* event document.getElementById("preview"):"click" */

// start system
system.run();

/* main.js */