import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  formatPrice,
  getStatusColor,
  getStatusLabel,
  formatDateTime,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      restaurant: { select: { name: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 font-semibold text-zinc-800">No orders yet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            When you place an order, you&apos;ll find it here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors"
          >
            Order Food
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-2xl border border-zinc-200 p-5 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    {order.restaurant.name} · {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-sm text-zinc-600 mt-1.5">
                    {order.items
                      .map(
                        (item) =>
                          `${item.quantity} × ${item.menuItem.name}`
                      )
                      .join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-zinc-900">
                    {formatPrice(order.total)}
                  </span>
                  <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}