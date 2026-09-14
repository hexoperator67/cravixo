"use client";

import { io, type Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});