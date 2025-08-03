import express from 'express';
import "dotenv/config"
import http from 'http';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import {Server} from 'socket.io';

// Create express app and HTTP Server
const app = express();
const server = http.createServer(app);

//Initialize socket.io server
export const io = new Server(server,{
    cors: {origin: "*"}
});

//store online users
export const userSocketMap = {}; //{userId: socketID}

//Socket.io connection handler
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected",userId);

    if(userId) userSocketMap[userId] = socket.id;

    //Emit online users to all connected client
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect",()=>{
        console.log("User Disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

//Middleware setup
app.use(cors());
app.use(express.json({limit: "4mb"}));

//Routes Setup
app.use("/api/status",(req,res)=> {
    res.send("Server is live")
})
app.use("/api/auth",userRouter);
app.use("/api/messages", messageRouter);

//Connect to MongoDB
await connectDB();



const PORT = process.env.PORT || 5000;

server.listen(PORT,(req,res)=>{
   console.log("Server is running on PORT:" + PORT);
});