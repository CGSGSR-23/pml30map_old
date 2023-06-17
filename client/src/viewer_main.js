import * as rnd from "./system/system.js";
import * as mth from "./system/mth.js";

import { Connection, URI } from "./nodes.js";

import { Rotator } from "./camera_controller.js";
import { Skysphere } from "./skysphere.js";

let system = new rnd.System();
let server = new Connection();

// camera controller
let skysphere = await system.addUnit(Skysphere.create, "./bin/imgs/lakhta.png");
let cameraController = system.addUnit(Rotator.create);

let arrowMaterial = await system.createMaterial("./shaders/arrow");
let arrowPrim = await system.createPrimitive(rnd.Topology.square(), arrowMaterial);//system.createEmptyPrimitive(4, rnd.Topology.TRIANGLE_STRIP, arrowMaterial);
let arrowUniqueID = 0;
let arrows = [];

async function createArrow(direction) {
  let transform = mth.Mat4.rotateY(Math.atan2(direction.z, direction.x));

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

let currentNode = null;
let currentNodeURI = null;
let neighbours = [];
async function setCurrentNode(nodeURI) {
  clearArrows();

  currentNode = await server.getNode(nodeURI);
  currentNodeURI = nodeURI;
  console.log(currentNode);
  currentNode.position = mth.Vec3.fromObject(currentNode.position);
  currentNodeName.innerText = currentNode.name;

  skysphere.texture.load(currentNode.skysphere.path);
  skysphere.rotation = currentNode.skysphere.rotation;

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

let skysphereRotation = document.getElementById("skysphereRotation");
skysphereRotation.addEventListener("input", (event) => {
  let angle = skysphereRotation.value * (Math.PI * 2 / 100.0);

  skysphere.rotation = angle;
  server.updateNode(currentNodeURI, {
    skysphere: {
      rotation: currentNode.skysphere.rotation + angle,
      path: currentNode.skysphere.path,
    }
  });
}); /* event skysphereRotation:"input" */

system.run();

/* viewer_main.js */