import { redirect } from "next/navigation";
import Link from "next/link";
import { SearchX, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  formatPrice,
  getStatusColor,
  getStatusLabel,
  formatDateTime,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order History" };

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/history");
  const { status } = await searchParams;

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!restaurant && session.user.role !== "admin") redirect("/admin/settings");

  const where = restaurant
    ? {
        restaurantId: restaurant.id,
        ...(status && status !== "all" ? { status } : {}),
      }
    : {};

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statuses = ["all", "delivered", "cancelled"];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Order History</h1>
        <p className="text-sm text-zinc-500 mt-1">
          All completed and cancelled orders.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/history" : `/admin/history?status=${s}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (status ?? "all") === s
                ? "bg-primary text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-primary/40"
            }`}
          >
            {s === "all" ? "All" : getStatusLabel(s)}
          </Link>
        ))}
        {orders.length > 0 && (
          <span className="ml-auto text-sm text-zinc-400">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 py-16 text-center">
          <SearchX className="h-10 w-10 text-zinc-300 mx-auto" />
          <h2 className="mt-3 font-semibold text-zinc-700">
            No orders found
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Orders that have been delivered or cancelled will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="hidden md:table-cell px-4 py-3 font-semibold">
                  Items
                </th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 max-w-[150px] truncate">
                    {order.user.name ?? order.user.email}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-zinc-500 max-w-[260px] truncate">
                    {order.items
                      .map((item) => `${item.quantity}× ${item.menuItem.name}`)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
        <Package className="h-4 w-4" />
        Only the 100 most recent orders are shown.
      </div>
    </div>
  );
}