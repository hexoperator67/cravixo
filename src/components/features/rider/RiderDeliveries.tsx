"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  MapPin,
  Smartphone,
  Truck,
  Check,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import {
  formatPrice,
  getStatusColor,
  getStatusLabel,
  formatDateTime,
} from "@/lib/utils";
import { updateOrderStatus } from "@/actions/orders";

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryFee: number;
  deliveryAddress: string;
  specialInstructions: string | null;
  createdAt: Date | string;
  items: Array<{ quantity: number; subtotal: number; menuItem: { name: string } }>;
  restaurant: { id: string; name: string; address: string; phone: string };
  user: { name: string | null; email: string; phone: string | null };
};

export default function RiderDeliveries({
  orders: initialOrders,
  riderId,
}: {
  orders: DeliveryOrder[];
  riderId: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [flashBorder, setFlashBorder] = useState<string | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const { joinRider, joinOrder, onOrderUpdate, onRiderAssignment } = useSocket();

  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    joinRider(riderId);
  }, [riderId, joinRider]);

  const joinedOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    orders.forEach((o) => {
      if (!joinedOrderIdsRef.current.has(o.id)) {
        joinOrder(o.id);
        joinedOrderIdsRef.current = new Set(joinedOrderIdsRef.current).add(o.id);
      }
    });
  }, [orders, joinOrder]);

  useEffect(() => {
    const unsubRider = onRiderAssignment((data) => {
      if (notifiedIdsRef.current.has(data.orderId)) return;
      notifiedIdsRef.current = new Set(notifiedIdsRef.current).add(data.orderId);
      setFlashBorder(data.orderId);
      router.refresh();
      setTimeout(() => setFlashBorder(null), 3000);
    });

    const unsubStatus = onOrderUpdate((data) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === data.orderId);
        if (exists) {
          if (data.status === "cancelled" || data.status === "delivered") {
            return prev.filter((o) => o.id !== data.orderId);
          }
          return prev.map((o) =>
            o.id === data.orderId ? { ...o, status: data.status } : o
          );
        }
        router.refresh();
        return prev;
      });
    });

    return () => {
      unsubRider();
      unsubStatus();
    };
  }, [onRiderAssignment, onOrderUpdate, router]);

  async function handleStatus(orderId: string, nextStatus: string) {
    const result = await updateOrderStatus(orderId, nextStatus);
    if (result.success) {
      if (nextStatus === "delivered") {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        router.refresh();
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
      }
    }
  }

  const getStatusAction = (status: string) => {
    if (status === "ready")
      return { next: "out_for_delivery", label: "Start Delivery", icon: Truck };
    if (status === "out_for_delivery")
      return { next: "delivered", label: "Mark Delivered", icon: Check };
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-zinc-200 px-4 py-3">
          <span className="text-2xl font-bold text-emerald-600">
            {orders.filter((o) => o.status === "ready").length}
          </span>
          <p className="text-xs text-zinc-500 font-medium">Ready to Pick Up</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 px-4 py-3">
          <span className="text-2xl font-bold text-indigo-600">
            {orders.filter((o) => o.status === "out_for_delivery").length}
          </span>
          <p className="text-xs text-zinc-500 font-medium">Out for Delivery</p>
        </div>
      </div>

      {orders.map((order) => {
        const action = getStatusAction(order.status);
        const flash = flashBorder === order.id;

        return (
          <div
            key={order.id}
            className={`bg-white rounded-2xl border p-5 transition-all ${
              flash
                ? "border-primary shadow-lg shadow-primary/10 animate-pulse"
                : "border-zinc-200"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    order.status === "ready"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-bold text-zinc-900 hover:text-primary"
                    >
                      {order.orderNumber}
                    </Link>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    {formatDateTime(order.createdAt)} · {order.restaurant.name}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-lg text-zinc-900">
                  {formatPrice(order.total)}
                </p>
                <p className="text-xs text-zinc-400">
                  earnings: {formatPrice(order.deliveryFee)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-50 rounded-xl p-4">
                <ul className="space-y-1.5">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm gap-2">
                      <span className="text-zinc-700">
                        {item.quantity} × {item.menuItem.name}
                      </span>
                      <span className="font-medium text-zinc-900 whitespace-nowrap">
                        {formatPrice(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-zinc-50 rounded-xl p-4 text-sm space-y-2">
                <p className="flex items-start gap-2 text-zinc-600">
                  <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                  {order.deliveryAddress}
                </p>
                <p className="flex items-center gap-2 text-zinc-600">
                  <Smartphone className="h-4 w-4 text-zinc-400 shrink-0" />
                  {order.user.phone ?? "No phone"}
                </p>
                {order.specialInstructions && (
                  <p className="text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
                    &ldquo;{order.specialInstructions}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {action && (() => {
                const Icon = action.icon;
                return (
                  <button
                    type="button"
                    onClick={() => handleStatus(order.id, action.next)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                      action.next === "out_for_delivery"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </button>
                );
              })()}
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex px-3 py-2 text-sm font-medium text-zinc-600 hover:text-primary transition-colors"
              >
                View details
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}