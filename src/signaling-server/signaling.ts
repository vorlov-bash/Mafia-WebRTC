import express from "express"
import http from "http"
import bodyParser from "body-parser"
import s_io from "socket.io"


const PORT: number = 10800;
const IP: string = '172.16.15.135';


let app = express();
let server = http.createServer(app);
let io = s_io.listen(server);


server.listen(PORT, IP, () => {
    console.log(`Started signaling server: ${IP}:${PORT}`)
});


let channels = {};
let sockets = {};
const ROOM_ID: string = "";

io.sockets.on('connection', async (socket) => {
    socket.on('disconnect', async () => {
        console.log(`User ${socket.id} has disconnected`)
    });
});