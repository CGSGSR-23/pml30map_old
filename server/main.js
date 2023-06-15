const http = require("http");
const express = require("express");
const morgan = require("morgan");
const ws = require("ws");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
app.use(morgan("combined"));
app.use('/', express.static("../client"));
app.use('/bin', express.static("../bin"));

const server = http.createServer(app);
const io = new Server(server);

//app.get("/", (req, res)=>{
//    res.sendFile(path.normalize(__dirname + "/../client/index.html"));
//});
//
//app.get("/favicon.ico", (req, res)=>{
//    res.sendFile(path.normalize(__dirname + "/../client/favicon.ico"));
//});

io.on("connection", (socket) => {
    console.log(`Client connected with id: ${socket.id}`);
    
    socket.on("disconnect", () => {
      console.log(`Client disconnected with id: ${socket.id}`);
    });
  });
  
server.listen(3047, () => {
    console.log(`Server started on port ${server.address().port}`);
  });