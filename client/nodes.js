import { io } from "socket.io-client";

export class Connection {
  socket;

  getNodeRes;
  getAllNodesRes;
  addNodeRes;
  delNodeRes;
  connectNodesRes;
  disconnectNodesRes;
  setDefNodeURIRes;
  getDefNodeURIRes;

  constructor() {
    console.log("Connection constructor");

    this.socket = io();

    this.socket.on("connect", () => {
      console.log("SOCKET ID: " + this.socket.id);

      this.socket.on("getNodeRes", (msg)=>{
        console.log(msg);
        if (this.getNodeRes != undefined)
          this.getNodeRes(msg);
      });
      
      this.socket.on("addNodeRes", (msg)=>{
        console.log(msg);
        if (this.addNodeRes != undefined)
          this.addNodeRes(msg);
      });

      this.socket.on("delNodeRes", (msg)=>{
        console.log(msg);
        if (this.delNodeRes != undefined)
          this.delNodeRes(msg);
      });

      this.socket.on("connectNodesRes", (msg)=>{
        console.log(msg);
        if (this.connectNodesRes != undefined)
          this.connectNodesRes(msg);
      });

      this.socket.on("disconnectNodesRes", (msg)=>{
        console.log(msg);
        if (this.disconnectNodesRes != undefined)
          this.disconnectNodesRes(msg);
      });
      
      this.socket.on("setDefNodeURIRes", (msg)=>{
        console.log(msg);
        if (this.setDefNodeURIRes != undefined)
          this.setDefNodeURIRes(msg);
      });

      this.socket.on("getDefNodeURIRes", (msg)=>{
        console.log(msg);
        if (this.getDefNodeURIRes != undefined)
          this.getDefNodeURIRes(msg);
      });

      this.socket.on("getNodeConnectionsReq", (msg)=>{
        console.log(msg);
        if (this.getNodeConnectionsReq != undefined)
          this.getNodeConnectionsReq(msg);
      });
      
      this.socket.on("getAllNodesRes", (msg)=>{
        console.log(msg);
        if (this.getAllNodesRes != undefined)
          this.getAllNodesRes(msg);
      });

    });
  }


  async send( req, ...args ) {
    //let out;
//
    //await this.socket.emit(req, ( result )=>{
    //  out = result;
    //  console.log(result);
    //});
//
    //return out;

    console.log("TEST ARGS:");
    console.log(args);

    return await new Promise((resolve) => {
      this.socket.emit(req, ...args, function (response) {
        console.log("TEST OUT:");
        console.log(response);
        resolve(response);
      });
    });
  }

  async ping( value ) {
    return await this.send("ping", value );
  }

  async getNode( uri ) {
    return await this.send("getNodeReq", uri);
  }
  async addNode( data ) {

    return await this.send("addNodeReq", data);
  }

  async getAllNodes() {
    return await this.send("getAllNodesReq");
  }

  async delNode( node ) {
    return await this.send("delNodeReq", node);
  }

  async connectNodes( uri1, uri2 ) {
    return await this.send("connectNodesReq", [uri1, uri2]);
  }

  async getNodeConnections( uri ) {
    return await this.send("getNodeConnectionsReq", uri);
  }

  async disconnectNodes( uri1, uri2 ) {
    return await this.send("disconnectNodesReq", [uri1, uri2]);
  }

  async setDefNodeURI( uri ) {
    return await this.send("setDefNodeURIReq", uri);
  }

  async getDefNodeURI() {
    return await this.send("getDefNodeURIReq");
  }
}
