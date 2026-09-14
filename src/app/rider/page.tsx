import { redirect } from "next/navigation";
import {
  Bike,
  PackageCheck,
  Clock,
  Wallet,
  MapPin,
  Smartphone,
  ChevronRight,
} from "lucide-react";
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

export const metadata = { title: "Overview" };

export default async function RiderOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/rider");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [activeDeliveries, readyCount, deliveringCount, deliveredToday, earningsAgg] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          riderId: session.user.id,
          status: { in: ["ready", "out_for_delivery"] },
        },
        include: {
          restaurant: { select: { name: true, address: true } },
          user: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.count({
        where: { riderId: session.user.id, status: "ready" },
      }),
      prisma.order.count({
        where: { riderId: session.user.id, status: "out_for_delivery" },
      }),
      prisma.order.count({
        where: {
          riderId: session.user.id,
          status: "delivered",
          updatedAt: { gte: startOfDay },
        },
      }),
      prisma.order.aggregate({
        where: {
          riderId: session.user.id,
          status: "delivered",
          updatedAt: { gte: startOfDay },
        },
        _sum: { deliveryFee: true },
      }),
    ]);

  const earningsToday = earningsAgg._sum.deliveryFee ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Here&apos;s what&apos;s happening with your deliveries today.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Bike className="h-5 w-5" />}
          label="Ready to Pick Up"
          value={String(readyCount)}
          accent="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          icon={<PackageCheck className="h-5 w-5" />}
          label="Out for Delivery"
          value={String(deliveringCount)}
          accent="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Delivered Today"
          value={String(deliveredToday)}
          accent="text-blue-600 bg-blue-50"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Earnings Today"
          value={formatPrice(earningsToday)}
          accent="text-green-600 bg-green-50"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-zinc-900">Active deliveries</h2>
          <Link
            href="/rider/deliveries"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Bike className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 font-semibold text-zinc-800">No active deliveries</h2>
            <p className="mt-1 text-sm text-zinc-500">
              When restaurants assign you an order, it will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeliveries.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-zinc-200 p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                  <span className="text-sm text-zinc-500">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <p className="flex items-start gap-2 text-zinc-600">
                    <Smartphone className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                    {order.restaurant.name} → {order.user.name ?? "Customer"}
                  </p>
                  <p className="flex items-start gap-2 text-zinc-600">
                    <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                    {order.user.phone ?? "No phone"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${accent}`}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}