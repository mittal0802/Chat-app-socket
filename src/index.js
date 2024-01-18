const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketio(server);

const publicDirPath = path.join(__dirname, "../public");
app.use(express.static(publicDirPath));

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  //io.to.emit - emits an event to everybody in a specific room
  //socket.broadcast.to.emit - emits an event to everybody in a specific room except the current connection
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit("serverMessage", generateMessage("admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "serverMessage",
        generateMessage("admin", `${user.username} has joined!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    io.to(user.room).emit(
      "serverMessage",
      generateMessage(user.username, message)
    );
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
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  //for disconnecting
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "serverMessage",
        generateMessage("admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
    //no need to broadcast because the connection is already closed
    // io.emit("serverMessage", generateMessage("A user has left!"));
  });
});

server.listen(port, () => {
  console.log("Server is up on port " + port);
});
