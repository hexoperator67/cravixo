import { Server as SocketServer } from "socket.io";

// The socket.io server instance is stored on globalThis so that it is
// shared between the custom server (server.ts) and Next.js's bundled
// route handlers / server actions, which live in the same Node process
// but in separate module contexts.

declare global {
  var __cravixoSocketServer: SocketServer | undefined;
}

export function setSocketServer(server: SocketServer | null) {
  globalThis.__cravixoSocketServer = server ?? undefined;
}

export function getSocketServer(): SocketServer | undefined {
  return globalThis.__cravixoSocketServer;
}

export function emitNewOrder(restaurantId: string, orderId: string) {
  getSocketServer()
    ?.to(`restaurant:${restaurantId}`)
    .emit("new-order", { orderId });
}

export function emitOrderStatusUpdate(orderId: string, status: string) {
  getSocketServer()
    ?.to(`order:${orderId}`)
    .emit("order-status-update", { orderId, status });
}

export function emitRiderAssignment(riderId: string, orderId: string) {
  getSocketServer()
    ?.to(`rider:${riderId}`)
    .emit("rider-assignment", { orderId });
}