import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DollarSign,
  Inbox,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  });
  if (!restaurant && session.user.role !== "admin") redirect("/admin/settings");

  const where = restaurant
    ? { restaurantId: restaurant.id }
    : {};

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalOrders, pendingOrders, todayOrders, revenue, menuStats] =
    await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: "pending" } }),
      prisma.order.count({ where: { ...where, createdAt: { gte: todayStart } } }),
      prisma.order.aggregate({
        where: { ...where, status: { not: "cancelled" } },
        _sum: { total: true },
      }),
      restaurant
        ? prisma.menuItem.count({ where: { restaurantId: restaurant.id } })
        : Promise.resolve(0),
    ]);

  const stats = [
    {
      label: "Today's Orders",
      value: String(todayOrders),
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pending Orders",
      value: String(pendingOrders),
      icon: Inbox,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Total Orders",
      value: String(totalOrders),
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Revenue",
      value: formatPrice(revenue._sum.total ?? 0),
      icon: DollarSign,
      color: "text-primary bg-primary/10",
    },
  ];

  const recentOrders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Welcome back{restaurant ? `, ${restaurant.name}` : ""}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-zinc-200 p-5"
          >
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color}`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-zinc-900">{stat.value}</p>
            <p className="text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {restaurant && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/orders"
            className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-6 flex items-center justify-between group hover:shadow-lg transition-shadow"
          >
            <div>
              <Inbox className="h-8 w-8 opacity-90" />
              <p className="mt-3 font-bold text-lg">Incoming Orders</p>
              <p className="text-sm text-white/80 mt-1">
                {pendingOrders > 0
                  ? `${pendingOrders} order${pendingOrders > 1 ? "s" : ""} waiting for action`
                  : "No pending orders"}
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-white/70 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/admin/menu"
            className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-center justify-between group hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div>
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <p className="mt-3 font-bold text-lg text-zinc-900">Manage Menu</p>
              <p className="text-sm text-zinc-500 mt-1">
                {menuStats} items across your categories
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-zinc-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {recentOrders.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="hidden md:table-cell px-4 py-3 font-semibold">
                    Items
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-semibold text-primary">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 max-w-[150px] truncate">
                      {order.user.name ?? order.user.email}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-zinc-500 max-w-[240px] truncate">
                      {order.items
                        .map(
                          (item) => `${item.quantity}× ${item.menuItem.name}`
                        )
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-zinc-400 text-sm">
              No orders yet. Share your restaurant link to start receiving
              orders!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}