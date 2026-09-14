import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import OrderTracking from "@/components/features/order/OrderTracking";

export const dynamic = "force-dynamic";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
      restaurant: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          estimatedDeliveryTime: true,
        },
      },
      user: {
        select: { id: true, name: true, phone: true, email: true },
      },
    },
  });

  if (!order) notFound();

  const isOwner = order.userId === session.user.id;
  const isAdmin = session.user.role === "admin";

  let isRestaurantView = false;
  if (!isOwner && !isAdmin) {
    const ownerRestaurant = await prisma.restaurant.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (ownerRestaurant && ownerRestaurant.id === order.restaurant.id) {
      isRestaurantView = true;
    } else {
      notFound();
    }
  }

  return <OrderTracking order={order} isRestaurantView={isRestaurantView} />;
}