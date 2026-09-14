import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatOrderNumber(n: number): string {
  return `ORD-${String(n).padStart(5, "0")}`;
}

export function generateOrderNumber(seq: number): string {
  return `ORD-${String(seq).padStart(5, "0")}`;
}

export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_FLOW)[number];

export const CANCELLED = "cancelled" as const;

export function isValidStatusTransition(
  current: string,
  next: string
): boolean {
  if (current === CANCELLED) return false;
  if (next === CANCELLED) return current === "pending" || current === "confirmed";

  const currentIdx = ORDER_STATUS_FLOW.indexOf(current as OrderStatus);
  const nextIdx = ORDER_STATUS_FLOW.indexOf(next as OrderStatus);

  return currentIdx !== -1 && nextIdx === currentIdx + 1;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    ready: "bg-emerald-100 text-emerald-800",
    out_for_delivery: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}