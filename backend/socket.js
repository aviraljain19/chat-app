const socket = (io) => {
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    v;
    const user = socket.handshake.auth.user;

    socket.on("join room", (groupId) => {
      socket.join(groupId);
      connectedUsers.set(socket.id, { user, room: groupId });
      const usersInRoom = Array.from(connectedUsers.values())
        .filter((u) => u.room === groupId)
        .map((u) => u.user);
      io.in(groupId).emit("users in room", usersInRoom);
      socket.to(groupId).emit("notification", {
        type: "USER_JOINED",
        message: `${user.username} has joined the chat`,
        user: user,
      });
    });

    socket.on("leave room", (groupId) => {
      socket.leave(groupId);

      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
        socket.to(groupId).emit("user left", user?.user.username);
      }
    });

    socket.on("new message", (message) => {
      socket.to(message.groupId).emit("message received", message);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      if (connectedUsers.has(socket.id)) {
        const userData = connectedUsers.get(socket.id);
        socket.to(userData.room).emit("user left", user?._id);
        connectedUsers.delete(socket.id);
      }
    });

    socket.on("typing", (groupId, username) => {
      socket.to(groupId).emit("user typing", { username });
    });

    socket.on("stop typing", (groupId) => {
      socket.to(groupId).emit("user stop typing", { username: user?.username });
    });
  });
};

module.exports = socket;
