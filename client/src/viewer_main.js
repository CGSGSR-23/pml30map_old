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

let arrowMaterial = await system.createMaterial("./shaders/arrow");

arrowMaterial.ubo = system.createUniformBuffer();
arrowMaterial.uboNameOnShader = "arrowUBO";

/* Setup window material */
arrowMaterial.ubo.writeData(new Float32Array([window.innerHeight > window.innerWidth != 0 ? 3.0 : 1.0]));
window.addEventListener("resize", () => {
  arrowMaterial.ubo.writeData(new Float32Array([mth.clamp(window.innerHeight / window.innerWidth, 0.5, 1.5) * 2.0]));
});

let arrowPrim = await system.createEmptyPrimitive(4, rnd.Topology.TRIANGLE_FAN, arrowMaterial);
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
  setFloor(currentNode.floor);

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
  window.location.href = "./editor.html" + window.location.search;
}); /* event document.getElementById("toEditor"):"click" */

// return to server
document.getElementById("toServer").addEventListener("click", () => {
  window.location.href = "./server.html" + window.location.search;
}); /* event document.getElementById("toServer"):"click" */


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


// Minimap part

function loadImg( fileName ) {
  var img = new Image();
  img.src = "./bin/imgs/" + fileName;
  return new Promise( async (resolve) => {
    img.onload = ()=>{ resolve(img); };
  });
} /* loadImg */


// Floor maps loading
function setActive( button, newValue ) {
  button.className = button.className.replace(" active", "");

  if (newValue == 1)
    button.className += " active";
} /* setActive */

function onFloorchange( newCurFloor ) {
  console.log("NEW ACTIVE FLOOR: " + newCurFloor);
} /* onFloorchange */

function setFloor( newFloor ) {
  if (curFloor !== undefined)
    setActive(floorButtons[curFloor], 0);
  setActive(floorButtons[newFloor], 1);
  onFloorchange(newFloor);
  curFloor = newFloor;
} /* End of 'setFloor' function */

function drawAvatar( ctx, coords )
{
  const size = 5;
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgb(255, 0, 0)';

  ctx.beginPath();
  ctx.moveTo(coords.x - size, coords.y - size);
  ctx.lineTo(coords.x + size, coords.y + size);
  ctx.moveTo(coords.x + size, coords.y - size);
  ctx.lineTo(coords.x - size, coords.y + size);
  ctx.closePath();
  ctx.stroke();
} /* End of 'drawAvatar' function */

var floorsMaps = [];
var floorButtons = [];
var curFloor;


async function setupMinimap() {
  var mapCanvas = document.getElementById('minimapCanvas');
  mapCanvas.width = mapCanvas.height = 200;
  var mapContext = mapCanvas.getContext('2d');

  var DBInfo = await server.send("getDBInfo", await server.send("getCurDBIndex"));
  console.log(DBInfo);

  // Add floor buttons
  let floorButtonBlock = document.getElementById("floorButtonBlock");

  let buttonsHtml = "";
  for (let i = 0, len = DBInfo.floorCount; i < len; i++)
    buttonsHtml += `<input type="button" id="floor${DBInfo.firstFloor + i}" class="button floor" value="${DBInfo.firstFloor + i}">`;
  floorButtonBlock.innerHTML = buttonsHtml;

  // Load images
  for (let i = 0, len = DBInfo.floorCount; i < len; i++)
  {
    // index of current button from button block
    let floorIndex = DBInfo.firstFloor + i;
  
    floorButtons[floorIndex] = floorButtonBlock.children[i];
    floorButtons[floorIndex].onclick = () => {
      setFloor(floorIndex);
    };
  
    floorsMaps[floorIndex] = await loadImg(`minimap/${DBInfo.name}/f${floorIndex}.png`);
  }

  console.log(floorsMaps);

  var modelEndPos = new mth.Vec2(DBInfo.modelEndPos.x, DBInfo.modelEndPos.y);
  var minimapOffset = new mth.Vec2(DBInfo.minimapOffset.x, DBInfo.minimapOffset.y);
  var minimapScale = DBInfo.minimapScale;
  var imgCenterPos = new mth.Vec2(DBInfo.imgCenterPos.x, DBInfo.imgCenterPos.y);

  var imgEndPos = new mth.Vec2(floorsMaps[0].width - DBInfo.imgCenterPos.x, floorsMaps[0].height - DBInfo.imgCenterPos.y);
  var mapCoef = modelEndPos.length() / imgEndPos.length();

  mapCanvas.onwheel = (e) => {

    let coef = Math.pow(0.95, e.deltaY / 100);
    console.log(e);
    let mousePos = new mth.Vec2(e.offsetX, e.offsetY);

    minimapOffset = mousePos.sub(mousePos.sub(minimapOffset).mul(coef));

    minimapScale *= coef;

    console.log(minimapOffset);
    console.log(minimapScale);
  };

  mapCanvas.oncontextmenu = ( e )=>{
    e.preventDefault();
  };
  mapCanvas.onmousemove = ( e )=>{
    if (e.buttons & 2) // Drag
    minimapOffset = minimapOffset.add(new mth.Vec2(e.movementX, e.movementY));
  };

  mapCanvas.onclick = async ( e )=>{
    if (curFloor === undefined)
      return;

    let mPos = new mth.Vec2(e.offsetX, e.offsetY).sub(minimapOffset).mul(1 / minimapScale);

    let pos = mPos.sub(imgCenterPos).mul(mapCoef);

    let nearestURI = await server.getNearest(new mth.Vec3(pos.x, 0, pos.y), parseInt(curFloor));
    console.log(nearestURI);

    await setCurrentNode(nearestURI);
    //await setCurrentNode();
  }

  window.setInterval(()=>{
    // Render
    mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    if (curFloor === undefined)
      return;

    mapContext.drawImage(floorsMaps[curFloor], minimapOffset.x, minimapOffset.y, floorsMaps[curFloor].width * minimapScale, floorsMaps[curFloor].height * minimapScale);

    if (currentNode != undefined)
    {
      let avatarPos = (new mth.Vec2(currentNode.position.x, currentNode.position.z)).mul(1 / mapCoef).add(imgCenterPos);
      drawAvatar(mapContext, avatarPos.mul(minimapScale).add(minimapOffset));
    }
  }, 10);
}

await setupMinimap();

system.run();

/* viewer_main.js */