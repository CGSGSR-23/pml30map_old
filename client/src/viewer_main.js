import * as rnd from "./system/system.js";
import * as mth from "./system/mth.js";

import { Connection } from "./nodes.js";

import { Rotator } from "./camera_controller.js";
import { Skysphere } from "./skysphere.js";

let system = new rnd.System();
let server = new Connection();

// camera controller
let skysphere = await system.addUnit(Skysphere.create, "./bin/imgs/lakhta.png");
let cameraController = system.addUnit(Rotator.create);

let arrowPrim = await system.createEmptyPrimitive(4, rnd.Topology.TRIANGLE_FAN, await system.createMaterial("./shaders/arrow"));
let arrowUniqueID = 0;
let arrows = [];

async function createArrow(direction) {
  let transform = mth.Mat4.rotateY(-Math.atan2(direction.z, direction.x));

  let arrow = await system.addUnit(() => {
    return {
      type: "arrow",
      name: `arrow#${arrowUniqueID++}`,
      response(system) {
        system.drawMarkerPrimitive(arrowPrim, transform);
      } /* response */
    }
  });

  arrows.push(arrow);

  return arrow;
} /* createArrow */

function clearArrows() {
  for (let arrow of arrows) {
    arrow.doSuicide = true;
  }

  arrows = [];
} /* clearArrows */

let currentNodeName = document.getElementById("currentNodeName");
let skysphereRotation = document.getElementById("skysphereRotation");

const skysphereFolderPath = "./bin/imgs/";

let currentNode = null;
let currentNodeURI = null;
let neighbours = [];
async function setCurrentNode(nodeURI) {

  currentNode = await server.getNode(nodeURI);
  currentNodeURI = nodeURI;

  currentNode.position = mth.Vec3.fromObject(currentNode.position);
  currentNodeName.innerText = currentNode.name;

  clearArrows();

  // wait then new node enviroment is loaded
  skysphereRotation.value = currentNode.skysphere.rotation / (Math.PI * 2) * 314;
  await skysphere.slide(skysphereFolderPath + currentNode.skysphere.path, currentNode.skysphere.rotation);
  // await skysphere.texture.load(skysphereFolderPath + currentNode.skysphere.path);

  let neighbourURIs = await server.getNeighbours(nodeURI);

  // delete old neighbours...
  for (let neighbour of neighbours) {
    neighbour.doSuicide = true; // SPb
  }
  // get new neighbours
  neighbours = [];
  for (let neighbourURI of neighbourURIs) {
    let neighbour = await server.getNode(neighbourURI);
    neighbour.position = mth.Vec3.fromObject(neighbour.position); // update vec3
    neighbour.uri = neighbourURI;

    neighbours.push(neighbour);

    // add arrow pointing to neighbour
    let arrow = await createArrow(neighbour.position.sub(currentNode.position).normalize());
    arrow.target = neighbour;
  }
} /* setCurrentNode */

// startup
setCurrentNode(await server.getDefNodeURI());

system.canvas.addEventListener("click", (event) => {
  let unit = system.getUnitByCoord(event.clientX, event.clientY);

  // go to next node if current node is arrow
  if (unit.type === "arrow") {
    setCurrentNode(unit.target.uri);
  }
}); /* event system.canvas:"click" */

// return to editor
document.getElementById("toEditor").addEventListener("click", () => {
  window.location.href = "./index.html";
}); /* event document.getElementById("toEditor"):"click" */

skysphereRotation.addEventListener("input", (event) => {
  let angle = skysphereRotation.value / 314 * Math.PI * 2;

  skysphere.rotation = angle;
  server.updateNode(currentNodeURI, {
    skysphere: {
      rotation: angle,
      path: currentNode.skysphere.path,
    }
  });
}); /* event skysphereRotation:"input" */

// Mini map part

var mapCanvas = document.getElementById('mapCanvas');
var mapContext = mapCanvas.getContext('2d');

console.log("MAPA:");
console.log(mapContext);


mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

system.run();

/* viewer_main.js */