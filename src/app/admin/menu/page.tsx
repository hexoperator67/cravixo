import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import MenuManager from "@/components/features/admin/MenuManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Manage Menu" };

export default async function AdminMenuPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/menu");

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  });
  if (!restaurant && session.user.role !== "admin") redirect("/admin/settings");

  if (!restaurant) {
    return (
      <div className="text-center py-20 text-zinc-500">
        No restaurant linked to your account.
      </div>
    );
  }

  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: [
          { isVegetarian: "asc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Manage Menu</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Organize your categories and items. Changes reflect on your
          restaurant page instantly.
        </p>
      </div>
      <MenuManager categories={categories} />
    </div>
  );
}