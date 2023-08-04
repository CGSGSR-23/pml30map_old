const { MongoClient, ObjectId } = require("mongodb");

class MongoDB { // Nodes data base
  db;
  nodesC; // Nodes collection
  connectionsC; // Connection collection
  varsC; // Variables collection
  mongodbConnection;

  async init( mongodbURL, DNName ) {
    const mongodbClient = new MongoClient(mongodbURL);
    this.mongodbConnection = await mongodbClient.connect();
    
    this.db = await this.mongodbConnection.db(DNName);
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
    if (uri1 == uri2) // Check for connecting node with itself
      return; 

    let uri1Str = "[" + new Uint8Array(uri1).toString() + "]";
    let uri2Str = "[" + new Uint8Array(uri2).toString() + "]";

    let n1 = this.getNode(uri1);
    let n2 = this.getNode(uri2);
  
    if (n1 == null || n2 == null) // Check for nodes validity
      return;

    var c1 = await this.connectionsC.findOne({ id1: uri1Str, id2: uri2Str }),
        c2 = await this.connectionsC.findOne({ id1: uri2Str, id2: uri1Str });

    if (c1 != null || c1 != null) // Check for connections existing
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

  // Global data base functions
  async clearDB() {
    await this.nodesC.deleteMany({});
    await this.connectionsC.deleteMany({});
    await this.varsC.deleteMany({});

    return true;
  }

  async getDB() {
    return {
      nodes: await this.nodesC.find({}).toArray(),
      connections: await this.connectionsC.find({}).toArray(),
      variables: await this.varsC.find({}).toArray(),
    };
  }

  static recreateID( array ) {
    for (let i = 0; i < array.length; i++)
      if (array[i] != undefined)
        if (array[i]._id != undefined)
          array[i]._id = new ObjectId(array[i]._id);//delete array[i]._id;
    return array;
  }

  async loadDB( newDB ) {
    // Clear Collection
    await this.clearDB();
    // Load nodes
    if (newDB.nodes.length > 0)
      await this.nodesC.insertMany(MongoDB.recreateID(newDB.nodes));
    // Load connections
    if (newDB.connections.length > 0)
      await this.connectionsC.insertMany(MongoDB.recreateID(newDB.connections));
    // Load variables
    if (newDB.variables.length > 0)
      await this.varsC.insertMany(MongoDB.recreateID(newDB.variables));
    
    return true;
  }

  async addDB( newDB ) {
    // Load nodes
    if (newDB.nodes.length > 0)
      await this.nodesC.insertMany(MongoDB.recreateID(newDB.nodes));
    // Load connections
    if (newDB.connections.length > 0)
      await this.connectionsC.insertMany(MongoDB.recreateID(newDB.connections));
    
    return true;
  }
}

module.exports = MongoDB;