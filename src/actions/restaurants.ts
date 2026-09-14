"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const restaurantSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  address: z.string().min(5),
  phone: z.string().min(5),
  email: z.string().email(),
  image: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  estimatedDeliveryTime: z.number().int().min(1).max(180).default(30),
  minimumOrder: z.number().int().min(0).max(10000).default(0),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

export async function upsertRestaurant(input: z.infer<typeof restaurantSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Not authenticated." };

  const parsed = restaurantSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid data." };

  const existing = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  });

  const data = {
    name: parsed.data.name,
    description: parsed.data.description,
    address: parsed.data.address,
    phone: parsed.data.phone,
    email: parsed.data.email,
    image: parsed.data.image || undefined,
    coverImage: parsed.data.coverImage || undefined,
    estimatedDeliveryTime: parsed.data.estimatedDeliveryTime,
    minimumOrder: parsed.data.minimumOrder,
    openingTime: parsed.data.openingTime || null,
    closingTime: parsed.data.closingTime || null,
  };

  try {
    const restaurant = existing
      ? await prisma.restaurant.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.restaurant.create({
          data: {
            ...data,
            slug: slugify(parsed.data.name) + "-" + Math.floor(Math.random() * 10000),
            ownerId: session.user.id,
          },
        });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "restaurant_owner" },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true as const, restaurantId: restaurant.id };
  } catch (err) {
    console.error("Failed to save restaurant:", err);
    return { success: false as const, error: "Could not save restaurant." };
  }
}