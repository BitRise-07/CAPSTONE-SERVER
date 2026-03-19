const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");

const database = require("./config/databse");
const { cloudinaryConnect } = require("./config/cloudinary");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");

// 🔥 Load env
dotenv.config();
const PORT = process.env.PORT || 4000;

// 🔥 Create HTTP server (IMPORTANT for socket)
const server = http.createServer(app);

// 🔥 Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

// 🔥 Store online users
const onlineUsers = new Map();

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // register user
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("User registered:", userId);
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// ================= DATABASE =================
database.connect();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// ================= CLOUDINARY =================
cloudinaryConnect();

// ================= ROUTES =================

// 👉 import your routes
const userRoutes = require("./routes/user");
const transactionRoutes = require("./routes/transaction");

// 👉 use routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/transaction", transactionRoutes);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Server is running 🚀",
  });
});

// ================= START SERVER =================
server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

// 🔥 EXPORT for controllers
module.exports = { io, onlineUsers };