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

  getNodeReq( uri ) {
    this.socket.emit("getNodeReq", uri);
  }
  addNodeReq( data ) {
    this.socket.emit("addNodeReq", data);
  }

  getAllNodesReq() {
    this.socket.emit("getAllNodesReq");
  }

  delNodeReq( node ) {
    this.socket.emit("delNodeReq", node);
  }

  connectNodesReq( uri1, uri2 ) {
    this.socket.emit("connectNodesReq", [uri1, uri2]);
  }

  getNodeConnectionsReq( uri ) {
    this.socket.emit("getNodeConnectionsReq", uri);
  }

  disconnectNodesReq( uri1, uri2 ) {
    this.socket.emit("disconnectNodesReq", [uri1, uri2]);
  }

  setDefNodeURIReq( uri ) {
    this.socket.emit("setDefNodeURIReq", uri);
  }

  getDefNodeURIReq() {
    this.socket.emit("getDefNodeURIReq");
  }
}
