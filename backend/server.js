const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const userRouter = require("./routes/userRoute");
const socketIo = require("./socket");
const groupRouter = require("./routes/groupRoute");
const messageRouter = require("./routes/messageRoute");
dotenv.config();

const app = express();

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

socketIo(io);

app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter);
app.use("/api/messages", messageRouter);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
