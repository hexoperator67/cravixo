"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  MapPin,
  Smartphone,
  Clock,
  Check,
  X,
  BellRing,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import {
  formatPrice,
  getStatusColor,
  getStatusLabel,
  formatDateTime,
  ORDER_STATUS_FLOW,
} from "@/lib/utils";
import { updateOrderStatus, cancelOrder, assignRider } from "@/actions/orders";

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  deliveryAddress: string;
  specialInstructions: string | null;
  createdAt: Date | string;
  items: Array<{
    quantity: number;
    subtotal: number;
    menuItem: { name: string };
  }>;
  user: { name: string | null; email: string; phone: string | null };
  restaurant: { id: string; name: string };
  rider: { id: string; name: string | null } | null;
};

type RiderData = { id: string; name: string | null; email: string };

export default function AdminOrders({
  orders: initialOrders,
  riders,
}: {
  orders: OrderData[];
  riders: RiderData[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [flashBorder, setFlashBorder] = useState<string | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const { joinRestaurant, onNewOrder, onOrderUpdate } = useSocket();

  const restaurantId = initialOrders[0]?.restaurant?.id;

  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    if (restaurantId) {
      joinRestaurant(restaurantId);
    }
  }, [restaurantId, joinRestaurant]);

  useEffect(() => {
    const unsubNew = onNewOrder(async (data) => {
      if (notifiedIdsRef.current.has(data.orderId)) return;
      const alreadyListed = ordersRef.current.some((o) => o.id === data.orderId);
      if (!alreadyListed) {
        notifiedIdsRef.current = new Set(notifiedIdsRef.current).add(data.orderId);
        setFlashBorder(data.orderId);
        try {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("New Order!", {
              body: "A new order just arrived. Check your dashboard.",
            });
          }
        } catch {
          // ignore notification errors
        }
        router.refresh();
        setTimeout(() => setFlashBorder(null), 3000);
      }
    });
    const unsubStatus = onOrderUpdate((data) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
      );
    });
    return () => {
      unsubNew();
      unsubStatus();
    };
  }, [onNewOrder, onOrderUpdate, router]);

  async function handleStatus(orderId: string, nextStatus: string) {
    const result = await updateOrderStatus(orderId, nextStatus);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    }
  }

  async function handleCancel(orderId: string) {
    const result = await cancelOrder(orderId);
    if (result.success) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      router.refresh();
    }
  }

  async function handleAssignRider(orderId: string, riderId: string) {
    const result = await assignRider(orderId, riderId);
    if (result.success) {
      const rider = riders.find((r) => r.id === riderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, rider: { id: riderId, name: rider?.name ?? null } } : o
        )
      );
    }
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = (s: string) =>
      s === "pending" ? 0 : s === "confirmed" ? 1 : s === "preparing" ? 2 : 3;
    return statusOrder(a.status) - statusOrder(b.status);
  });

  return (
    <div className="space-y-4">
      <OrderCounts orders={orders} />
      {sortedOrders.map((order) => {
        const isPending = order.status === "pending";
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
                    isPending ? "bg-amber-50 text-amber-600" : "bg-zinc-100 text-zinc-500"
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
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <BellRing className="h-3 w-3" />
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    {formatDateTime(order.createdAt)} ·{" "}
                    {order.user.name ?? order.user.email}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-lg text-zinc-900">
                  {formatPrice(order.total)}
                </p>
                <p className="text-xs text-zinc-400">
                  incl. delivery {formatPrice(order.deliveryFee)}
                </p>
              </div>
            </div>

            {/* Items */}
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
                    “{order.specialInstructions}”
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isPending && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatus(order.id, "confirmed")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(order.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </button>
                </>
              )}

              {order.status !== "pending" && order.status !== "cancelled" && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const idx = ORDER_STATUS_FLOW.indexOf(
                      order.status as never
                    );
                    const next = ORDER_STATUS_FLOW[idx + 1];
                    if (next) {
                      return (
                        <button
                          type="button"
                          onClick={() => handleStatus(order.id, next)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                        >
                          <Clock className="h-4 w-4" />
                          Mark {getStatusLabel(next)}
                        </button>
                      );
                    }
                    return null;
                  })()}
                  {!order.rider && riders.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <label className="sr-only">Assign rider</label>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleAssignRider(order.id, e.target.value);
                          e.target.value = "";
                        }}
                        className="text-sm font-medium border border-zinc-200 rounded-lg px-2 py-1.5 text-zinc-700 hover:border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="" disabled>
                          Assign rider
                        </option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name ?? r.email}
                          </option>
                        ))}
                      </select>
                    </span>
                  )}
                  {order.rider && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                      Rider: {order.rider.name ?? order.rider.id.slice(0, 6)}
                    </span>
                  )}
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex px-3 py-2 text-sm font-medium text-zinc-600 hover:text-primary transition-colors"
                  >
                    View details
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCounts({ orders }: { orders: OrderData[] }) {
  const pending = orders.filter((o) => o.status === "pending").length;
  const preparing = orders.filter((o) =>
    ["confirmed", "preparing", "ready"].includes(o.status)
  ).length;
  const delivering = orders.filter((o) => o.status === "out_for_delivery").length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-xl border border-zinc-200 px-4 py-3">
        <span className="text-2xl font-bold text-amber-600">{pending}</span>
        <p className="text-xs text-zinc-500 font-medium">New</p>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 px-4 py-3">
        <span className="text-2xl font-bold text-blue-600">{preparing}</span>
        <p className="text-xs text-zinc-500 font-medium">Preparing</p>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 px-4 py-3">
        <span className="text-2xl font-bold text-indigo-600">{delivering}</span>
        <p className="text-xs text-zinc-500 font-medium">Delivering</p>
      </div>
    </div>
  );
}