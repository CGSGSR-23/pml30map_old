import * as rnd from "./system/system.js";
import * as mth from "./system/mth.js";

import { Connection } from "./nodes.js";

import { Rotator } from "./camera_controller.js";
import { Skysphere } from "./skysphere.js";

let system = new rnd.System();
let server = new Connection();

system.renderParams.depthTest = false;
system.renderParams.cullFace = true;

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
      direction: (new mth.Vec2(direction.x, direction.z)).normalize(),
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
//let skysphereRotation = document.getElementById("skysphereRotation");

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

  //skysphereRotation.value = currentNode.skysphere.rotation / (Math.PI * 2) * 314;
  await Promise.all([
    skysphere.slide(skysphereFolderPath + currentNode.skysphere.path, currentNode.skysphere.rotation),

    new Promise(async (resolve) => {
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
      }

      resolve();
    })
  ]);

  // add arrows
  for (let neighbour of Object.values(neighbours)) {
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
  window.location.href = "./editor.html";
}); /* event document.getElementById("toEditor"):"click" */

//skysphereRotation.addEventListener("input", (event) => {
//  let angle = skysphereRotation.value / 314 * Math.PI * 2;
//
//  skysphere.rotation = angle;
//  server.updateNode(currentNodeURI, {
//    skysphere: {
//      rotation: angle,
//      path: currentNode.skysphere.path,
//    }
//  });
//}); /* event skysphereRotation:"input" */

document.addEventListener("keydown", async (event) => {
  let direction = (new mth.Vec2(system.camera.dir.x, system.camera.dir.z)).normalize();

  switch (event.key) {
    case "ArrowUp":
      break;

    case "ArrowDown":
      direction = direction.neg();
      break;

    case "ArrowLeft":
      direction = direction.right();
      break;

    case "ArrowRight":
      direction = direction.left();
      break;

    default:
      return;
  }

  let maxArrow = null, maxArrowCoefficent = Math.SQRT1_2;
  for (let arrow of arrows) {
    let coefficent = arrow.direction.dot(direction);

    if (coefficent > maxArrowCoefficent) {
      maxArrow = arrow;
      maxArrowCoefficent = coefficent;
    }
  }

  if (maxArrow !== null) {
    await setCurrentNode(maxArrow.target.uri);
  }
}); /* event document:"keydown" */



var mapCanvas = document.getElementById('minimapCanvas');
mapCanvas.width = mapCanvas.height = 200;
var mapContext = mapCanvas.getContext('2d');

function loadImg( fileName ) {
  var img = new Image();
  img.src = "./bin/imgs/" + fileName;
  return new Promise( async (resolve) => {
    img.onload = ()=>{ resolve(img); };
  });
}

var floorsMaps = [];

function setActive( button, newValue ) {
  button.className = button.className.replace(" active", "");

  if (newValue == 1)
  {
    button.className += " active";
  }
  else if (newValue == 0) {
  }
}

function onFloorchange( newCurFloor ) {
  console.log("NEW ACTIVE FLOOR: " + newCurFloor);
}

var floorButtons = [];
var curFloor = 0;
for (let i = -1; i <= 4; i++)
{
  let floor = document.getElementById("floor" + i);
  
  if (floor == undefined)
  {
    console.log("FUCK YOU, FLOOR " + i);
    continue;
  }
  floor.onclick = ()=>{
    if (curFloor !== undefined)
      setActive(floorButtons[curFloor], 0);
    setActive(floor, 1);
    onFloorchange(i);
    curFloor = i;
  };

  floorsMaps[i] = await loadImg(`minimap/f${i}.png`);
  
  floorButtons[i] = floor;
}
console.log(floorsMaps);
//console.log(minimapF1);

var miniMapScale = .2;
var miniMapOffset = new mth.Vec2(0, 0);
var centerPos = new mth.Vec2(710, 340);
var mapPos1 = new mth.Vec2(11.5, 16.5);
var minimapPos1 = new mth.Vec2(floorsMaps[0].width - centerPos.x, floorsMaps[0].height - centerPos.y);
var mapCoef = mapPos1.length() / minimapPos1.length();

var minimapGraph = await server.getAllNodesData();

mapCanvas.onwheel = (e)=>{
  
  let coef = Math.pow(0.95, e.deltaY / 100);
  console.log(e);
  let mousePos = new mth.Vec2(e.offsetX, e.offsetY);

  miniMapOffset = mousePos.sub(mousePos.sub(miniMapOffset).mul(coef));

  miniMapScale *= coef;

  console.log(miniMapOffset);
  console.log(miniMapScale);
};

mapCanvas.oncontextmenu = ( e )=>{
  e.preventDefault();
};
mapCanvas.onmousemove = ( e )=>{
  if (e.buttons & 2) // Drag
    miniMapOffset = miniMapOffset.add(new mth.Vec2(e.movementX, e.movementY));   
};

mapCanvas.onclick = async ( e )=>{
  if (curFloor === undefined)
    return;
    
  let mPos = new mth.Vec2(e.offsetX, e.offsetY).sub(miniMapOffset).mul(1 / miniMapScale);

  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAaaa");
  console.log(mapCoef);
  console.log("In");
  console.log(mPos);
  console.log(mPos.sub(centerPos));
  let pos = mPos.sub(centerPos).mul(mapCoef);
  console.log("Out");
  console.log(pos);

  let y = 0;

  switch (curFloor) {
    case -1:
      y = -2.5;
      break;
    case 0:
      y = 0;
      break;
    case 1:
      y = 1.5;
      break;
    case 2:
      y = 6;
      break;
    case 3:
      y = 11;
      break;
    case 4:
      y = 16;
      break;
  }

  let nearestURI = await server.getNearest(new mth.Vec3(pos.x, y, pos.y));
  console.log(nearestURI);
  
  await setCurrentNode(nearestURI);
  //await setCurrentNode();
}

window.setInterval(()=>{
  // Render
  mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  
  if (curFloor === undefined)
    return;

  mapContext.drawImage(floorsMaps[curFloor], miniMapOffset.x, miniMapOffset.y, floorsMaps[curFloor].width * miniMapScale, floorsMaps[curFloor].height * miniMapScale);
}, 10);

system.run();

/* viewer_main.js */