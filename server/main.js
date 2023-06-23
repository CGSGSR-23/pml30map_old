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


async function main() {
  var DB = new MongoDB;

  await DB.init("mongodb+srv://doadmin:i04J9b2t1X853Cuy@db-mongodb-pml30-75e49c39.mongo.ondigitalocean.com/admin?tls=true&authSource=admin");
  //await DB.init("mongodb://127.0.0.1:27017");

  //app.post('/addNode', (req, res) => {
  //  console.log("POST 'addNode':");
  //  const imgName = "NODE_IMG" + getValidImageURI() + ".png";
  //  const imgPath = path.normalize(__dirname + '/../bin/imgs/' + imgName);
  //  const image = req.files.img;
//
  //  image.mv(imgPath, (error) => {
  //    if (error) { // ERROR
  //      console.error("IMAGE LOAD ERROR: " + error);
  //      res.writeHead(500, {
  //        'Content-Type': 'application/json'
  //      })
  //      res.end(JSON.stringify({status: 'error', message: error}));
  //      return;
  //    }
//
  //    // Add node
  //    var nodeURI = addNode({
  //      image: imgName,
  //      pos: req.body.pos,
  //      connections: req.body.connections,
  //    });
//
  //    res.writeHead(200, {
  //      'Content-Type': 'application/json'
  //    });
  //    res.end(JSON.stringify({status: 'success', node_uri: nodeURI}));
  //  });
  //});

  // For test
  app.use("/index.html", (req, res)=>{
    debugger;
    res.sendFile("../client/index.html");
  });
  
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

    socket.on("getNearestReq", async ( inPos, res )=>{
      //let result = await DB.addDB(db);
      let pos = new mth.Vec3(inPos.x, inPos.y, inPos.z);
      let nodesData = await DB.getAllNodesData();
      
      if (nodesData.length <= 0)
        return null;
  
      let nearest = nodesData[0];
  
      for (let i = 0; i < nodesData.length; i++)
      {
        let nPos = new mth.Vec3(nearest.position.x, nearest.position.y, nearest.position.z);
        let iPos = new mth.Vec3(nodesData[i].position.x, nodesData[i].position.y, nodesData[i].position.z);
      
        if (pos.sub(iPos).length() < pos.sub(nPos).length())  
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
