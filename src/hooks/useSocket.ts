"use client";

import { useEffect, useCallback } from "react";
import { socket } from "@/lib/socket";

export type OrderStatusEvent = {
  orderId: string;
  status: string;
};

export function useSocket() {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  const joinOrder = useCallback((orderId: string) => {
    socket.emit("join-order", orderId);
  }, []);

  const joinRestaurant = useCallback((restaurantId: string) => {
    socket.emit("join-restaurant", restaurantId);
  }, []);

  const joinRider = useCallback((riderId: string) => {
    socket.emit("join-rider", riderId);
  }, []);

  const onRiderAssignment = useCallback(
    (callback: (data: { orderId: string }) => void) => {
      socket.on("rider-assignment", callback);
      return () => {
        socket.off("rider-assignment", callback);
      };
    },
    []
  );

  const onOrderUpdate = useCallback(
    (callback: (data: OrderStatusEvent) => void) => {
      socket.on("order-status-update", callback);
      return () => {
        socket.off("order-status-update", callback);
      };
    },
    []
  );

  const onNewOrder = useCallback(
    (callback: (data: { orderId: string }) => void) => {
      socket.on("new-order", callback);
      return () => {
        socket.off("new-order", callback);
      };
    },
    []
  );

  return { socket, joinOrder, joinRestaurant, joinRider, onOrderUpdate, onNewOrder, onRiderAssignment };
}