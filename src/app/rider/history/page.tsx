import { redirect } from "next/navigation";
import { History, Package } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  formatPrice,
  getStatusColor,
  getStatusLabel,
  formatDateTime,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Delivery History" };

export default async function RiderHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/rider/history");

  const orders = await prisma.order.findMany({
    where: {
      riderId: session.user.id,
      status: { in: ["delivered", "cancelled"] },
    },
    include: {
      restaurant: { select: { name: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Delivery History</h1>
        <p className="text-sm text-zinc-500 mt-1">Your completed and cancelled deliveries.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
            <History className="h-7 w-7 text-zinc-400" />
          </div>
          <h2 className="mt-4 font-semibold text-zinc-800">No history yet</h2>
          <p className="mt-1 text-sm text-zinc-500">Complete a delivery to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-zinc-500" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-zinc-900">{order.orderNumber}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {formatDateTime(order.updatedAt)} · {order.restaurant.name}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-zinc-900">{formatPrice(order.total)}</p>
                <p className="text-xs text-emerald-600 font-medium">
                  +{formatPrice(order.deliveryFee)} earned
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}