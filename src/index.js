const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketio(server);

const publicDirPath = path.join(__dirname, "../public");
app.use(express.static(publicDirPath));

let count = 0;
io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.emit("serverMessage", "Welcome! You are connected to the chat app!");

  //this will send a message to everyone except the current connection
  socket.broadcast.emit("serverMessage", "A new user has joined!");

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    io.emit("serverMessage", message);
    callback();
  });
  // socket.emit("countUpdated", count);

  // socket.on("increment", () => {
  //   count++;
  //   // socket.emit("countUpdated", count); // emit to a specific connection
  //   io.emit("countUpdated", count); // emit to all connections
  // });

  //location
  socket.on("sendLocation", (coords, callback) => {
    io.emit(
      "serverMessage",
      `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
    );
    callback();
  });

  //for disconnecting
  socket.on("disconnect", () => {
    //no need to broadcast because the connection is already closed
    io.emit("serverMessage", "A user has left!");
  });
});

server.listen(port, () => {
  console.log("Server is up on port " + port);
});
