const http = require("http");
const express = require("express");
const morgan = require("morgan");
const ws = require("ws");
const path = require("path");
const { Server } = require("socket.io");
const fileupload = require('express-fileupload');
const MongoDB = require('./mongodb.js');
const mth = require("./mth.js");
const { MongoDBCollectionNamespace } = require("mongodb");
const { allowedNodeEnvironmentFlags } = require("process");

const app = express();
app.use(morgan("combined"));
app.use(fileupload());

const availableDB = [
  {
    name: "pml30map",
    floorCount: 6,
    firstFloor: -1,
    minimapScale: 0.2,
    minimapOffset: new mth.Vec2(0, 0),
    imgCenterPos: new mth.Vec2(710, 340),
    modelEndPos: new mth.Vec2(11.5, 16.5),
  },
  {
    name: "camp23map",
    floorCount: 1,
    firstFloor: 0,
    minimapScale: 0.2,
    minimapOffset: new mth.Vec2(0, 0),
    imgCenterPos: new mth.Vec2(645, 575),
    modelEndPos: new mth.Vec2(22.48, -26.1),
  }
];
var curDBIndex = -1;

app.use('/bin/models/worldmap', (req, res, next )=>{
  res.sendFile(path.normalize(__dirname + `/../bin/models/${availableDB[curDBIndex].name}.obj`));
});

app.use('/bin', express.static("../bin"));

const enableKeys = 1; // 0 - no check
                      // 1- simple 404 page
                      // 2 - redirect to rickroll

const studentKey = "R1BNTDMwTUFQX0FDQ0VTU19LRVlfQURNSU4=";
const adminKey = "R1BNTDMwTUFQX0FDQ0VTU19LRVlfU1RVREVOVA==";

app.use('/', (req, res, next )=>{
  if (enableKeys > 0)
    switch(req.path) {
      case '/server.html':
        if (req.query.key != adminKey)
        {
          if (enableKeys === 2)
            res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
          else
            res.sendStatus(404);
          return;
        }
      case '/editor.html':
        if (req.query.key != adminKey)
        {
          if (enableKeys === 2)
            res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
          else
            res.sendStatus(404);
          return;
        }
    }
  next(); 
}, express.static("../client"));

const server = http.createServer(app);
const io = new Server(server);

async function InitMongoDB( DB, newCurrent ) {
  if (curDBIndex == newCurrent)
    return 0;

  if (newCurrent < 0 || newCurrent >= availableDB.length)
    return 0;
  
  curDBIndex = newCurrent;
  await DB.init("mongodb+srv://doadmin:i04J9b2t1X853Cuy@db-mongodb-pml30-75e49c39.mongo.ondigitalocean.com/admin?tls=true&authSource=admin", availableDB[newCurrent].name);
  return 1;
}

async function main() {
  var DB = new MongoDB;

  //await DB.init("mongodb+srv://doadmin:i04J9b2t1X853Cuy@db-mongodb-pml30-75e49c39.mongo.ondigitalocean.com/admin?tls=true&authSource=admin", "pml30map");
  await InitMongoDB(DB, 0);
  //await DB.init("mongodb://127.0.0.1:27017");

  // For test
  io.on("connection", (socket) => {
    console.log(`Client connected with id: ${socket.id}`);

    var accessLevel = 0;
    // 0 - guest
    // 1 - student
    // 2 - admin
    if (socket.request._query.key === studentKey)
      accessLevel = 1; // Student
    else if (socket.request._query.key === adminKey)
      accessLevel = 2; // Admin

    function LogMsg( msgName, input, output ) {
      console.log(`<--- MESSAGE '${msgName}' --->`);
      console.log("INPUT:");
      console.log(input);
      console.log("OUTPUT:");
      console.log(output);
    }

    socket.on("ping", (value, res)=>{
      res(value);
    });

    // Nodes

    socket.on("getNodeReq", async ( uri, res )=>{
      let outData = await DB.getNode(uri);
      LogMsg("getNodeReq", uri, outData);
      res(outData);
    });

    socket.on("addNodeReq", async ( data, res )=>{
      let newURI = await DB.addNode(data);
      LogMsg("addNodeReq", data, newURI);
      res(newURI);
    });

    socket.on("updateNodeReq", async ( uri, data, res )=>{
      let result = await DB.updateNode(uri, data);
    
      if (result.modifiedCount === 1)
        result = true;
      else
        result = false;
      LogMsg("updateNodeReq", {uri, data}, result);
      res(result)
    });

    socket.on("delNodeReq", async ( uri, res )=>{
      let result = await DB.delNode(uri);
      if (result.deletedCount === 1)
        result = true;
      else
        result = false;

      LogMsg("delNodeReq", uri, result);
      res(result);
    });

    // Connections

    socket.on("connectNodesReq", async ( uris, res )=>{
      let result = await DB.addConnection(uris[0], uris[1]);
      LogMsg("connectNodesReq", uris, result);
      res(result);
    });

    socket.on("disconnectNodesReq", async ( uris, res )=>{
      let result = await DB.delConnection(uris[0], uris[1]);
      LogMsg("disconnectNodesReq", uris, result);
      res(result);
    });

    // Graph info

    socket.on("getNodeConnectionsReq", async ( uri, res )=>{
      let cs = await DB.getNodeConnections(uri);
      LogMsg("getNodeConnectionsReq", uri, cs);
      res(cs);
    });

    socket.on("getNeighboursReq", async ( uri, res )=>{
      let nNodes = await DB.getNeighbours(uri);
      LogMsg("getNeighboursReq", uri, nNodes);
      res(nNodes);
    });

    socket.on("getAllNodesReq", async ( res )=>{
      let outData = await DB.getAllNodeURIs();
      LogMsg("getAllNodesReq", "", outData);
      res(outData);
    });

    socket.on("getAllNodesDataReq", async ( res )=>{
      let outData = await DB.getAllNodesData();
      LogMsg("getAllNodesDataReq", "", outData);
      res(outData);
    });
    
    socket.on("getAllConnectionsReq", async ( res )=>{
      let cs = await DB.getAllConnections();
      LogMsg("getAllConnectionsReq", "", cs);
      res(cs);
    });

    // Def node 

    socket.on("setDefNodeURIReq", async ( uri, res )=>{
      let result = await DB.setDefNodeURI(uri);
      LogMsg("setDefNodeURIReq", uri, result);
      res(result);
    });

    socket.on("getDefNodeURIReq", async ( res )=>{
      let outURI = await DB.getDefNodeURI();
      LogMsg("getDefNodeURIReq", "", outURI);
      res(outURI);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected with id: ${socket.id}`);
    });

    // Global DB requests

    socket.on("getAvailableDBs", ( res )=>{
      let availableDBNames = [];
      for (let i = 0; i < availableDB.length; i++)
        availableDBNames[i] = availableDB[i].name;
      LogMsg("getAvailableDBs", "", availableDBNames);
      res(availableDBNames);
    });

    socket.on("getCurDBIndex", async ( res )=>{
      LogMsg("getCurDBIndex", "", curDBIndex);
      res(curDBIndex);
    });

    socket.on("getDBInfo", async ( i, res )=>{
      if (i < 0 || i >= availableDB.length)
        return;

      let info = availableDB[i];
      LogMsg("getDBInfo", i, info);
      res(info);
    });

    socket.on("setCurrentDB", async ( newCurrent, res )=>{
      let result = await InitMongoDB(DB, newCurrent);
      LogMsg("setCurrentDB", newCurrent, result);
      res(result);
    });

    socket.on("clearDBReq", async ( res )=>{
      let result = await DB.clearDB();
      LogMsg("getDefNodeURIReq", "", result);
      res(result);
    });

    socket.on("getDBReq", async ( res )=>{
      let db = await DB.getDB();
      LogMsg("getDefNodeURIReq", "", db);
      res(db);
    });

    socket.on("loadDBReq", async ( db, res )=>{
      let result = await DB.loadDB(db);
      LogMsg("getDefNodeURIReq", db, result);
      res(result);
    });

    socket.on("addDataReq", async ( db, res )=>{
      let result = await DB.addDB(db);
      LogMsg("addDataReq", db, result);
      res(result);
    });

    socket.on("getNearestReq", async ( inPos, floor, res )=>{
      //let result = await DB.addDB(db);
      let pos = new mth.Vec3(inPos.x, 0, inPos.z);
      let nodesData = await DB.getAllNodesData();
      
      if (nodesData.length <= 0)
        return null;
  
      let nearest = nodesData[0];
  
      for (let i = 0; i < nodesData.length; i++)
      {
        let nPos = new mth.Vec3(nearest.position.x, 0, nearest.position.z);
        let iPos = new mth.Vec3(nodesData[i].position.x, 0, nodesData[i].position.z);
      
        if (pos.sub(iPos).length() < pos.sub(nPos).length() && nodesData[i].floor === floor)  
          nearest = nodesData[i];
      }
      let out = nearest._id.id;
      LogMsg("getNearestReq", pos, out);
      res(out);
    });

  });

  server.listen(3047, () => {
    console.log(`Server started on port ${server.address().port}`);
  });
}

main();
