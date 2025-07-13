import http from "http";
import { Server } from "socket.io";
import { decode } from "./utils/jwt";

const emailToSocketMap = new Map();
const socketToEmailMap = new Map();

function setupSocketIO(httpServer: http.Server) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });


    io.on("connection", (socket) => {
        console.log("New Socket Joined: ", socket.id);

        const { token } = socket.handshake.auth;
        const user = decode(token);

        emailToSocketMap.set(user.email, socket.id);
        socketToEmailMap.set(socket.id, user.email);

        /* Room Joining */
        socket.on("create-room", data => {
            console.log("Room created");
            const { roomId } = data;
            socket.join(roomId);
        });

        socket.on("join-room", data => {
            console.log("Room Joined");
            const { roomId } = data;
            socket.join(roomId);
            const email = socketToEmailMap.get(socket.id);
            socket.broadcast.to(roomId).emit("user-joined", { emailId: email });
        });

        socket.on("call-user", data => {
            const { emailId, sdp: offer } = data;
            console.log("Offer Created:", offer);

            const fromEmail = socketToEmailMap.get(socket.id);
            const socketId = emailToSocketMap.get(emailId);

            console.log("from:", fromEmail, "to:", socketId);
            socket.to(socketId).emit("incoming-call", { from: fromEmail, sdp: offer });
        });

        socket.on("call-accepted", data => {
            const { emailId, ans } = data;
            console.log("New ans:", ans);
            const socketId = emailToSocketMap.get(emailId);
            socket.to(socketId).emit("call-accepted", { ans });
        });

        socket.on("disconnect", () => {
            console.log(`User deleted: ${socket.id}`);
        });
    });
}

export default setupSocketIO;