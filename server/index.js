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
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const transactionRoutes = require("./routes/Transaction");
const analyticsRoutes = require("./routes/Analytics");

dotenv.config();
const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

const onlineUsers = new Map();


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

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

database.connect();

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

cloudinaryConnect();



app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/transaction", transactionRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Server is running ",
  });
});

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

module.exports = { io, onlineUsers };