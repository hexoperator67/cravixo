import { redirect } from "next/navigation";
import { Inbox, BellRing } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import AdminOrders from "@/components/features/admin/AdminOrders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Incoming Orders" };

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/orders");

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!restaurant && session.user.role !== "admin") redirect("/admin/settings");

  const where = restaurant ? { restaurantId: restaurant.id } : {};

  const activeOrders = await prisma.order.findMany({
    where: {
      ...where,
      status: { in: ["pending", "confirmed", "preparing", "ready", "out_for_delivery"] },
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { menuItem: { select: { name: true } } } },
      restaurant: { select: { id: true, name: true } },
      rider: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const riders = await prisma.user.findMany({
    where: { role: "delivery_rider" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Incoming Orders</h1>
          <p className="text-sm text-zinc-500 mt-1">
            New orders appear here in real-time. Accept or manage them as they
            come in.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          <BellRing className="h-4 w-4" />
          Live
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Inbox className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 font-semibold text-zinc-800">
            No active orders
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            When customers place orders, they&apos;ll appear here instantly.
          </p>
        </div>
      ) : (
        <AdminOrders orders={activeOrders} riders={riders} />
      )}
    </div>
  );
}