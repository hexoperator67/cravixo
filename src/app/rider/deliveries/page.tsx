import { redirect } from "next/navigation";
import { Bike, BellRing } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import RiderDeliveries from "@/components/features/rider/RiderDeliveries";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Deliveries" };

export default async function RiderDeliveriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/rider/deliveries");

  const deliveries = await prisma.order.findMany({
    where: {
      riderId: session.user.id,
      status: { in: ["ready", "out_for_delivery"] },
    },
    include: {
      restaurant: { select: { id: true, name: true, address: true, phone: true } },
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Deliveries</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Orders assigned to you by restaurants — manage them live.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          <BellRing className="h-4 w-4" />
          Live
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Bike className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 font-semibold text-zinc-800">No deliveries yet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            When a restaurant assigns you an order, it will appear here instantly.
          </p>
        </div>
      ) : (
        <RiderDeliveries orders={deliveries} riderId={session.user.id} />
      )}
    </div>
  );
}