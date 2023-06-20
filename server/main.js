const http = require("http");
const express = require("express");
const morgan = require("morgan");
const ws = require("ws");
const path = require("path");
const { Server } = require("socket.io");
const fileupload = require('express-fileupload');
const MongoDB = require('./mongodb.js');

const app = express();
app.use(morgan("combined"));
app.use(fileupload());
app.use('/', express.static("../client"));
app.use('/bin', express.static("../bin"));

const server = http.createServer(app);
const io = new Server(server);

async function main() {
  var DB = new MongoDB;

  await DB.init("mongodb://127.0.0.1:27017");

  app.post('/addNode', (req, res) => {
    console.log("POST 'addNode':");
    const imgName = "NODE_IMG" + getValidImageURI() + ".png";
    const imgPath = path.normalize(__dirname + '/../bin/imgs/' + imgName);
    const image = req.files.img;

    image.mv(imgPath, (error) => {
      if (error) { // ERROR
        console.error("IMAGE LOAD ERROR: " + error);
        res.writeHead(500, {
          'Content-Type': 'application/json'
        })
        res.end(JSON.stringify({status: 'error', message: error}));
        return;
      }

      // Add node
      var nodeURI = addNode({
        image: imgName,
        pos: req.body.pos,
        connections: req.body.connections,
      });

      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({status: 'success', node_uri: nodeURI}));
    });
  });

  // For test
  
  //var addedURI = await nodesDB.addNode({
  //  image: "lakhta.png",
  //  pos: [0, 0, 0],
  //  connections: [],
  //});
  //await nodesDB.setDefNodeURI(addedURI);
  
  io.on("connection", (socket) => {
    console.log(`Client connected with id: ${socket.id}`);

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

  });

  server.listen(3047, () => {
    console.log(`Server started on port ${server.address().port}`);
  });
}

main();