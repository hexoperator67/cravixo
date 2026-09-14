import http from "http";
import next from "next";
import { Server } from "socket.io";
import { setSocketServer } from "./src/lib/socket-events";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = Number(process.env.PORT || 3000);
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${PORT}`,
      methods: ["GET", "POST"],
    },
  });

  setSocketServer(io);

  io.on("connection", (socket) => {
    socket.on("join-restaurant", (restaurantId: string) => {
      socket.join(`restaurant:${restaurantId}`);
    });

    socket.on("join-order", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("join-rider", (riderId: string) => {
      socket.join(`rider:${riderId}`);
    });

    socket.on("leave-restaurant", (restaurantId: string) => {
      socket.leave(`restaurant:${restaurantId}`);
    });

    socket.on("leave-order", (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on("leave-rider", (riderId: string) => {
      socket.leave(`rider:${riderId}`);
    });
  });

  server.listen(PORT, HOSTNAME, () => {
    console.log(`> Ready on http://${HOSTNAME}:${PORT}`);
  });
});