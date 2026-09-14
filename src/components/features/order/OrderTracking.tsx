"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  MapPin,
  Smartphone,
  Clock,
  Loader2,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import {
  ORDER_STATUS_FLOW,
  formatPrice,
  getStatusColor,
  getStatusLabel,
  formatDateTime,
} from "@/lib/utils";
import { updateOrderStatus } from "@/actions/orders";

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
  estimatedDeliveryTime: Date | string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  items: Array<{
    quantity: number;
    price: number;
    subtotal: number;
    menuItem: { name: string };
  }>;
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone: string;
    estimatedDeliveryTime: number;
  };
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string;
  };
};

export default function OrderTracking({
  order: initialOrder,
  isRestaurantView = false,
}: {
  order: OrderData;
  isRestaurantView?: boolean;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { joinOrder, onOrderUpdate } = useSocket();

  useEffect(() => {
    joinOrder(order.id);
  }, [order.id, joinOrder]);

  useEffect(() => {
    const unsubscribe = onOrderUpdate((data) => {
      if (data.orderId !== order.id) return;
      setOrder((prev) => ({ ...prev, status: data.status }));
    });
    return unsubscribe;
  }, [order.id, onOrderUpdate]);

  const statusIndex = useMemo(
    () => ORDER_STATUS_FLOW.indexOf(order.status as never),
    [order.status]
  );

  const isCancelled = order.status === "cancelled";

  async function handleStatusChange(nextStatus: string) {
    setUpdating(nextStatus);
    setError(null);
    const result = await updateOrderStatus(order.id, nextStatus);
    if (result.success) {
      setOrder((prev) => ({ ...prev, status: nextStatus }));
    } else {
      setError(result.error ?? "Could not update order status.");
    }
    setUpdating(null);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {order.restaurant.name} · Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
            order.status
          )}`}
        >
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <h2 className="font-bold text-zinc-900 mb-6">Order Status</h2>
        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-700">Order Cancelled</p>
              <p className="text-sm text-red-600">
                This order was cancelled on {formatDateTime(order.updatedAt ?? order.createdAt)}.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            {ORDER_STATUS_FLOW.map((status, index) => {
              const isReached = index <= statusIndex;
              const isCurrent = index === statusIndex;
              return (
                <div key={status} className="flex-1 flex flex-col items-center relative">
                  {/* connector line */}
                  {index < ORDER_STATUS_FLOW.length - 1 && (
                    <div
                      className={`absolute top-4 left-[50%] w-full h-0.5 -translate-y-1/2 ${
                        index < statusIndex ? "bg-emerald-500" : "bg-zinc-200"
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                      isReached
                        ? isCurrent
                          ? "bg-primary border-primary text-white"
                          : "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-zinc-300 text-zinc-400"
                    }`}
                  >
                    {isReached ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-center text-xs font-medium leading-tight ${
                      isReached ? "text-zinc-900" : "text-zinc-400"
                    }`}
                  >
                    {getStatusLabel(status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="font-bold text-zinc-900 mb-4">Items</h2>
            <ul className="divide-y divide-zinc-100">
              {order.items.map((item, i) => (
                <li key={i} className="py-3 flex justify-between gap-3">
                  <span className="text-zinc-700">
                    {item.quantity} × {item.menuItem.name}
                  </span>
                  <span className="font-medium text-zinc-900">
                    {formatPrice(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2.5 text-sm border-t border-zinc-200 pt-4">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd className="font-medium">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Delivery Fee</dt>
                <dd className="font-medium">{formatPrice(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Tax</dt>
                <dd className="font-medium">{formatPrice(order.tax)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200">
                <dt className="font-semibold text-zinc-900">Total</dt>
                <dd className="font-bold text-lg text-primary">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </div>

          {order.specialInstructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="font-semibold text-amber-800 mb-1">
                Special Instructions
              </p>
              <p className="text-sm text-amber-700">{order.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="font-bold text-zinc-900 mb-4">Delivery Details</h2>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-zinc-900">Deliver to</p>
                <p className="text-sm text-zinc-600 mt-1">{order.deliveryAddress}</p>
                <p className="text-sm text-zinc-600 mt-2 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-zinc-400" />
                  {order.user?.phone ?? order.user?.email ?? "No contact info"}
                </p>
              </div>
            </div>
            {order.estimatedDeliveryTime && (
              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="h-4 w-4" />
                ETA: {formatDateTime(order.estimatedDeliveryTime)}
              </div>
            )}
          </div>

          {/* Restaurant controls */}
          {isRestaurantView && !isCancelled && statusIndex < ORDER_STATUS_FLOW.length - 1 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h2 className="font-bold text-zinc-900 mb-4">Update Status</h2>
              {error && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                {ORDER_STATUS_FLOW.filter(
                  (s) => ORDER_STATUS_FLOW.indexOf(s) === statusIndex + 1
                ).map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={updating !== null}
                    onClick={() => handleStatusChange(next)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {updating === next ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>Mark as {getStatusLabel(next)}</>
                    )}
                  </button>
                ))}
                {statusIndex >= 0 && (
                  <button
                    type="button"
                    disabled={updating !== null}
                    onClick={() => handleStatusChange("cancelled")}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-white border border-red-200 text-red-600 font-semibold rounded-xl text-sm hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}

          <Link
            href="/orders"
            className="block text-center text-sm text-zinc-500 hover:text-primary font-medium transition-colors"
          >
            ← Back to all orders
          </Link>
        </div>
      </div>
    </div>
  );
}