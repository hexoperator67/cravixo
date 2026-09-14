"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  generateOrderNumber,
  isValidStatusTransition,
} from "@/lib/utils";
import {
  emitNewOrder,
  emitOrderStatusUpdate,
  emitRiderAssignment,
} from "@/lib/socket-events";

const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  deliveryAddress: z.string().min(10),
  specialInstructions: z.string().optional(),
});

export async function createOrder(input: z.infer<typeof createOrderSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "You must be logged in to place an order.",
    };
  }

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid order details." };
  }

  const data = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: data.restaurantId },
    include: { items: true },
  });

  if (!restaurant || !restaurant.isActive) {
    return { success: false as const, error: "Restaurant is not available." };
  }

  const itemMap = new Map(restaurant.items.map((item) => [item.id, item]));
  const orderItems: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }> = [];

  for (const line of data.items) {
    const menuItem = itemMap.get(line.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      return {
        success: false as const,
        error: "One of the items in your cart is no longer available.",
      };
    }
    const subtotal = menuItem.price * line.quantity;
    orderItems.push({
      menuItemId: menuItem.id,
      quantity: line.quantity,
      price: menuItem.price,
      subtotal,
    });
  }

  const subtotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
  const deliveryFee = 299;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + deliveryFee + tax;

  const orderNumber = generateOrderNumber(
    Math.floor(Math.random() * 90000) + 10000
  );

  try {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "pending",
        subtotal,
        deliveryFee,
        tax,
        total,
        deliveryAddress: data.deliveryAddress,
        specialInstructions: data.specialInstructions,
        estimatedDeliveryTime: new Date(
          Date.now() + (restaurant.estimatedDeliveryTime || 30) * 60 * 1000
        ),
        userId: session.user.id,
        restaurantId: restaurant.id,
        items: {
          create: orderItems.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    revalidatePath("/orders");
    revalidatePath("/restaurants");

    emitNewOrder(restaurant.id, order.id);

    return { success: true as const, orderId: order.id };
  } catch (err) {
    console.error("Failed to create order:", err);
    return {
      success: false as const,
      error: "Could not place your order. Please try again.",
    };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Not authenticated." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: { select: { ownerId: true } } },
  });

  if (!order) {
    return { success: false as const, error: "Order not found." };
  }

  const isOwnerOrAdmin =
    session.user.role === "admin" ||
    order.restaurant.ownerId === session.user.id;

  const isAssignedRider =
    session.user.role === "delivery_rider" && order.riderId === session.user.id;

  if (!isOwnerOrAdmin && !isAssignedRider) {
    return { success: false as const, error: "Not authorized." };
  }

  if (!isValidStatusTransition(order.status, newStatus)) {
    return {
      success: false as const,
      error: `Cannot change status from "${order.status}" to "${newStatus}".`,
    };
  }

  const data: Record<string, unknown> = { status: newStatus };
  if (newStatus === "out_for_delivery" || newStatus === "delivered") {
    data.actualDeliveryTime = new Date();
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data,
    });

    revalidatePath("/orders");
    revalidatePath("/admin/orders");

    emitOrderStatusUpdate(orderId, newStatus);

    return { success: true as const };
  } catch (err) {
    console.error("Failed to update order:", err);
    return { success: false as const, error: "Could not update order." };
  }
}

export async function cancelOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Not authenticated." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: { select: { ownerId: true } } },
  });

  if (!order) {
    return { success: false as const, error: "Order not found." };
  }

  const isOwner = order.userId === session.user.id;
  const isRestaurant = order.restaurant.ownerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isRestaurant && !isAdmin) {
    return { success: false as const, error: "Not authorized." };
  }

  if (!isValidStatusTransition(order.status, "cancelled")) {
    return {
      success: false as const,
      error: "This order can no longer be cancelled.",
    };
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });

    revalidatePath("/orders");
    revalidatePath("/admin/orders");

    emitOrderStatusUpdate(orderId, "cancelled");

    return { success: true as const };
  } catch (err) {
    console.error("Failed to cancel order:", err);
    return { success: false as const, error: "Could not cancel order." };
  }
}

export async function assignRider(orderId: string, riderId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Not authenticated." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: { select: { ownerId: true } } },
  });

  if (!order) {
    return { success: false as const, error: "Order not found." };
  }

  const isOwnerOrAdmin =
    session.user.role === "admin" || order.restaurant.ownerId === session.user.id;

  if (!isOwnerOrAdmin) {
    return { success: false as const, error: "Not authorized." };
  }

  if (["cancelled", "delivered", "out_for_delivery"].includes(order.status)) {
    return {
      success: false as const,
      error: "A rider can only be assigned while the order is being prepared.",
    };
  }

  const rider = await prisma.user.findFirst({
    where: { id: riderId, role: "delivery_rider" },
    select: { id: true },
  });

  if (!rider) {
    return { success: false as const, error: "Rider not found." };
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { riderId: rider.id },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/rider/deliveries");

    emitRiderAssignment(rider.id, orderId);

    return { success: true as const };
  } catch (err) {
    console.error("Failed to assign rider:", err);
    return { success: false as const, error: "Could not assign rider." };
  }
}