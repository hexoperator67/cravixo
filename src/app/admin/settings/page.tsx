import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import RestaurantSettingsForm from "@/components/features/admin/RestaurantSettingsForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin/settings");

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          {restaurant ? "Restaurant Settings" : "Set Up Your Restaurant"}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {restaurant
            ? "Update your restaurant profile details."
            : "Create your restaurant profile to activate your dashboard."}
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <RestaurantSettingsForm restaurant={restaurant} />
      </div>
    </div>
  );
}