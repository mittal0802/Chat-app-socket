const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketio(server);

const publicDirPath = path.join(__dirname, "../public");
app.use(express.static(publicDirPath));

let count = 0;
io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.emit("welcomeMessage", "Welcome! You are connected to the chat app!");

  socket.on("sendMessage", (message) => {
    io.emit("welcomeMessage", message);
  });
  // socket.emit("countUpdated", count);

  // socket.on("increment", () => {
  //   count++;
  //   // socket.emit("countUpdated", count); // emit to a specific connection
  //   io.emit("countUpdated", count); // emit to all connections
  // });
});

server.listen(port, () => {
  console.log("Server is up on port " + port);
});
