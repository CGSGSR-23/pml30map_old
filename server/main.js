const http = require("http");
const express = require("express");
const morgan = require("morgan");
const ws = require("ws");
const path = require("path");
const { Server } = require("socket.io");
const fileupload = require('express-fileupload');
const { MongoClient, ObjectId } = require("mongodb");
const mongodbURL = "mongodb://127.0.0.1:27017";

const app = express();
app.use(morgan("combined"));
app.use(fileupload());
app.use('/', express.static("../client"));
app.use('/bin', express.static("../bin"));
const mongodbClient = new MongoClient(mongodbURL);
var mongodbConnection = mongodbClient.connect();

const server = http.createServer(app);
const io = new Server(server);

var nodesStorage = [];
var URICounter = 0;

class NodesDB { // Nodes data base
  db;
  nodesC; // Nodes collection
  connectionsC; // Connection collection
  varsC; // Variables collection

  async init() {
    if (mongodbConnection instanceof Promise)
      mongodbConnection = await mongodbConnection;
    this.db = await mongodbConnection.db("pml30map");
    //if (this.db.nodes == undefined)
    this.nodesC = await this.db.collection("nodes");
    this.connectionsC = await this.db.collection("connections");
    this.varsC = await this.db.collection("variables");
  }
  
  //////////// Nodes

  async getNode( uri ) {
    var node = await this.nodesC.findOne({_id: new ObjectId(uri)});
    return node;
  }

  async updateNode( uri, newData ) {
    var result = await this.nodesC.updateOne({_id: new ObjectId(uri)}, { $set: newData });
    return result;
  }
  
  async delNode( uri ) {
    return await this.nodesC.deleteOne({_id: new ObjectId(uri)});
  }
  
  async addNode( data ) {
    var insertedURI = (await this.nodesC.insertOne(data)).insertedId;
    console.log("Inserted URI: ");
    console.log(insertedURI);

    return insertedURI.id;
  }

  async getNodeConnections( uri ) {
    let uriStr = "[" + new Uint8Array(uri).toString() + "]";
    
    let cs = (await (await this.connectionsC.find({ id1: uriStr })).toArray()).concat((await (await this.connectionsC.find({ id2: uriStr })).toArray()));
    
    return cs;
  }

  async getAllConnections() {
    let cs = await (await this.connectionsC.find({})).toArray();
    
    return cs;
  }

  async getNeighbours( uri ) {
    let uriStr = "[" + new Uint8Array(uri).toString() + "]";
    
    let right = await (await this.connectionsC.find({ id1: uriStr })).toArray();
    let left = await (await this.connectionsC.find({ id2: uriStr })).toArray();

    let outN = [];
    for (let i = 0; i < right.length; i++)
      outN[outN.length] = right[i].id2;
    for (let i = 0; i < left.length; i++)
      outN[outN.length] = left[i].id1;
    return outN;
  }
  //////////////////// Connections

  async addConnection( uri1, uri2 ) {
    let uri1Str = "[" + new Uint8Array(uri1).toString() + "]";
    let uri2Str = "[" + new Uint8Array(uri2).toString() + "]";
    var c1 = await this.connectionsC.findOne({ id1: uri1Str, id2: uri2Str }),
        c2 = await this.connectionsC.findOne({ id1: uri2Str, id2: uri1Str });

    if (c1 != null || c1 != null)
      return false;
    var insertedURI = (await this.connectionsC.insertOne({ id1: uri1Str, id2: uri2Str })).insertedId;
    console.log("Inserted URI: ");
    console.log(insertedURI);
    return true;
  }

  async delConnection( uri1, uri2 ) {
    let uri1Str = "[" + new Uint8Array(uri1).toString() + "]";
    let uri2Str = "[" + new Uint8Array(uri2).toString() + "]";
    
    this.connectionsC.deleteOne({ id1: uri1Str, id2: uri2Str });
    this.connectionsC.deleteOne({ id1: uri2Str, id2: uri1Str });
    return true;
  }

  ////////////// Indexes 

  async getDefNodeURI() {
    var node = await this.varsC.findOne({var_name: "DefNodeURI" });
    if (node != null)
      return node.uri.buffer;
    return null;
  }
  
  async setDefNodeURI( newURI ) {
    if ((await this.getNode(newURI)) == null)
      return false;

    var node = await this.varsC.findOne({var_name: "DefNodeURI" });
    if (node == null)
    {
      await this.varsC.insertOne({var_name: "DefNodeURI", uri: newURI});
    }
    else
      await this.varsC.updateOne({var_name: "DefNodeURI" }, { $set: { uri: newURI }});
    return true;
  }

  async getAllNodeURIs() {
    let nodes = await (await this.nodesC.find({})).toArray();
    
    let outURIs = [];
    for (var i = 0; i < nodes.length; i++)
      outURIs[i] = nodes[i]._id.id;
    
    return outURIs;
  }

  async getAllNodesData() {
    let nodes = await (await this.nodesC.find({})).toArray();
    
    return nodes;
  }
}

async function main() {
  var nodesDB = new NodesDB;

  await nodesDB.init();

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
      let outData = await nodesDB.getNode(uri);
      LogMsg("getNodeReq", uri, outData);
      res(outData);
    });

    socket.on("addNodeReq", async ( data, res )=>{
      let newURI = await nodesDB.addNode(data);
      LogMsg("addNodeReq", data, newURI);
      res(newURI);
    });

    socket.on("updateNodeReq", async ( uri, data, res )=>{
      let result = await nodesDB.updateNode(uri, data);
    
      if (result.modifiedCount === 1)
        result = true;
      else
        result = false;
      LogMsg("updateNodeReq", {uri, data}, result);
      res(result)
    });

    socket.on("delNodeReq", async ( uri, res )=>{
      let result = await nodesDB.delNode(uri);
      if (result.deletedCount === 1)
        result = true;
      else
        result = false;

      LogMsg("delNodeReq", uri, result);
      res(result);
    });

    // Connections

    socket.on("connectNodesReq", async ( uris, res )=>{
      let result = await nodesDB.addConnection(uris[0], uris[1]);
      LogMsg("connectNodesReq", uris, result);
      res(result);
    });

    socket.on("disconnectNodesReq", async ( uris, res )=>{
      let result = await nodesDB.delConnection(uris[0], uris[1]);
      LogMsg("disconnectNodesReq", uris, result);
      res(result);
    });

    // Graph info

    socket.on("getNodeConnectionsReq", async ( uri, res )=>{
      let cs = await nodesDB.getNodeConnections(uri);
      LogMsg("getNodeConnectionsReq", uri, cs);
      res(cs);
    });

    socket.on("getNeighboursReq", async ( uri, res )=>{
      let nNodes = await nodesDB.getNeighbours(uri);
      LogMsg("getNeighboursReq", uri, nNodes);
      res(nNodes);
    });

    socket.on("getAllNodesReq", async ( res )=>{
      let outData = await nodesDB.getAllNodeURIs();
      LogMsg("getAllNodesReq", "", outData);
      res(outData);
    });

    socket.on("getAllNodesDataReq", async ( res )=>{
      let outData = await nodesDB.getAllNodesData();
      LogMsg("getAllNodesDataReq", "", outData);
      res(outData);
    });
    
    socket.on("getAllConnectionsReq", async ( res )=>{
      let cs = await nodesDB.getAllConnections();
      LogMsg("getAllConnectionsReq", "", cs);
      res(cs);
    });

    // Def node 

    socket.on("setDefNodeURIReq", async ( uri, res )=>{
      let result = await nodesDB.setDefNodeURI(uri);
      LogMsg("setDefNodeURIReq", uri, result);
      res(result);
    });

    socket.on("getDefNodeURIReq", async ( res )=>{
      let outURI = await nodesDB.getDefNodeURI();
      LogMsg("getDefNodeURIReq", "", outURI);
      res(outURI);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected with id: ${socket.id}`);
    });
  });

  server.listen(3047, () => {
    console.log(`Server started on port ${server.address().port}`);
  });
}

main();