import Link from "next/link";
import { LayoutDashboard, Bike } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function DashboardLink({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      ownedRestaurant: { select: { id: true } },
    },
  });

  if (!user) return null;

  if (user.role === "delivery_rider") {
    return (
      <Link
        href="/rider"
        className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
      >
        <Bike className="h-4 w-4" />
        Rider Dashboard
      </Link>
    );
  }

  if (!user.ownedRestaurant && user.role !== "admin") return null;

  return (
    <Link
      href="/admin"
      className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
    >
      <LayoutDashboard className="h-4 w-4" />
      Dashboard
    </Link>
  );
}