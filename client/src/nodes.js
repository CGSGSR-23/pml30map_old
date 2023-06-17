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
    console.log("Connected with server");

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
  } /* constructor */


  async send( req, ...args ) {
    //let out;

    //await this.socket.emit(req, ( result )=>{
    //  out = result;
    //  console.log(result);
    //});

    //return out;

    console.log("TEST ARGS:");
    console.log(args);

    return new Promise((resolve) => {
      this.socket.emit(req, ...args, (response) => {
        console.log("TEST OUT:");
        console.log(response);
        resolve(response);
      });
    });
  } /* send */

  async ping( value ) {
    return this.send("ping", value );
  } /* ping */

  async getNode( uri ) {
    return this.send("getNodeReq", uri);
  } /* getNode */

  async addNode( data ) {
    return this.send("addNodeReq", data);
  } /* addNode */

  async getAllNodes() {
    return this.send("getAllNodesReq");
  } /* getAllNodes */

  async delNode( node ) {
    return this.send("delNodeReq", node);
  } /* delNode */

  async connectNodes( uri1, uri2 ) {
    return this.send("connectNodesReq", [uri1, uri2]);
  } /* connectNodes */

  async getNodeConnections( uri ) {
    return this.send("getNodeConnectionsReq", uri);
  } /* getNodeConnections */

  async disconnectNodes( uri1, uri2 ) {
    return this.send("disconnectNodesReq", [uri1, uri2]);
  } /* disconnectNodes */

  async setDefNodeURI( uri ) {
    return this.send("setDefNodeURIReq", uri);
  } /* setDefNodeURI */

  async getDefNodeURI() {
    return this.send("getDefNodeURIReq");
  } /* getDefNodeURI */
} /* Connection */
