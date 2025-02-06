const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");

const StudentUser = require("./models/StudentUser");
const StudentGroupMessage = require("./models/StudentGroupMessage");
const StudentPrivateMessage = require("./models/StudentPrivateMessage");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const userSocketMap = {};

mongoose
  .connect(
    "mongodb+srv://hapoves:041104iii@cluster.t2yhh.mongodb.net/labtest1?retryWrites=true&w=majority&appName=Cluster"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "view")));

app.post("/api/signup", async (req, res) => {
  const { username, firstname, lastname, password } = req.body;
  try {
    const userExists = await StudentUser.findOne({ username });
    if (userExists) return res.status(400).json({ error: "Username exists" });
    let newUser = new StudentUser({
      username,
      firstname,
      lastname,
      password,
      createon: new Date().toLocaleString(),
    });
    await newUser.save();
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const validUser = await StudentUser.findOne({ username, password });
    if (!validUser)
      return res.status(400).json({ error: "Invalid username or password" });
    res.json({ message: "Login successful", user: validUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("setUsername", (username) => {
    socket.username = username;
    userSocketMap[username] = socket.id;
    console.log(`${username} connected with socket ID ${socket.id}`);
  });
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`${socket.username} joined room: ${room}`);
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    console.log(`${socket.username} left room: ${room}`);
  });

  socket.on("groupMessage", async (data) => {
    let newMsg = new StudentGroupMessage({
      from_user: data.fromUser,
      room: data.room,
      message: data.message,
      date_sent: data.timestamp,
    });
    try {
      await newMsg.save();
      io.to(data.room).emit("newGroupMessage", {
        ...data,
        timestamp: data.timestamp,
      }); 
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("privateMessage", async (data) => {
    let newPMsg = new StudentPrivateMessage({
      from_user: data.fromUser,
      to_user: data.toUser,
      message: data.message,
      date_sent: data.timestamp,
    });

    try {
      await newPMsg.save();

      let recipientSocketId = userSocketMap[data.toUser];

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("newPrivateMessage", data);
      } else {
        console.log("Recipient not connected");
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      delete userSocketMap[socket.username];
      console.log(`${socket.username} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
