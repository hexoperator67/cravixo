"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

async function getOwnedRestaurant() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
  });
  return restaurant;
}

const categorySchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(300).optional(),
});

export async function createCategory(input: z.infer<typeof categorySchema>) {
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) return { success: false as const, error: "Not authorized." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid input." };

  await prisma.menuCategory.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      restaurantId: restaurant.id,
      sortOrder:
        (await prisma.menuCategory.count({ where: { restaurantId: restaurant.id } })) + 1,
    },
  });

  revalidatePath("/admin/menu");
  revalidatePath(`/restaurants/${restaurant.id}`);
  return { success: true as const };
}

export async function updateCategory(
  categoryId: string,
  input: z.infer<typeof categorySchema>
) {
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) return { success: false as const, error: "Not authorized." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid input." };

  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId: restaurant.id },
  });
  if (!category) return { success: false as const, error: "Category not found." };

  await prisma.menuCategory.update({
    where: { id: categoryId },
    data: parsed.data,
  });

  revalidatePath("/admin/menu");
  revalidatePath(`/restaurants/${restaurant.id}`);
  return { success: true as const };
}

export async function deleteCategory(categoryId: string) {
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) return { success: false as const, error: "Not authorized." };

  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId: restaurant.id },
    include: { _count: { select: { items: true } } },
  });
  if (!category) return { success: false as const, error: "Category not found." };

  if (category._count.items > 0) {
    return {
      success: false as const,
      error: "This category still has items. Move or delete them first.",
    };
  }

  await prisma.menuCategory.delete({ where: { id: categoryId } });

  revalidatePath("/admin/menu");
  revalidatePath(`/restaurants/${restaurant.id}`);
  return { success: true as const };
}

const itemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().int().positive(),
  categoryId: z.string().min(1),
  image: z.string().url().optional().or(z.literal("")),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  spiceLevel: z.number().int().min(0).max(3).default(0),
  preparationTime: z.number().int().positive().optional(),
  isAvailable: z.boolean().default(true),
});

export async function createMenuItem(input: z.infer<typeof itemSchema>) {
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) return { success: false as const, error: "Not authorized." };

  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid input." };

  const category = await prisma.menuCategory.findFirst({
    where: { id: parsed.data.categoryId, restaurantId: restaurant.id },
  });
  if (!category) return { success: false as const, error: "Invalid category." };

  await prisma.menuItem.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      image: parsed.data.image || undefined,
      isVegetarian: parsed.data.isVegetarian,
      isVegan: parsed.data.isVegan,
      isGlutenFree: parsed.data.isGlutenFree,
      spiceLevel: parsed.data.spiceLevel,
      preparationTime: parsed.data.preparationTime,
      isAvailable: parsed.data.isAvailable,
      categoryId: category.id,
      restaurantId: restaurant.id,
    },
  });

  revalidatePath("/admin/menu");
  revalidatePath(`/restaurants/${restaurant.id}`);
  return { success: true as const };
}

export async function updateMenuItem(
  itemId: string,
  input: z.infer<typeof itemSchema>
) {
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) return { success: false as const, error: "Not authorized." };

  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid input." };

  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId: restaurant.id },
  });
  if (!item) return { success: false as const, error: "Item not found." };

  const category = await prisma.menuCategory.findFirst({
    where: { id: parsed.data.categoryId, restaurantId: restaurant.id },
  });
  if (!category) return { success: false as const, error: "Invalid category." };

  await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      image: parsed.data.image || undefined,
      isVegetarian: parsed.data.isVegetarian,
      isVegan: parsed.data.isVegan,
      isGlutenFree: parsed.data.isGlutenFree,
      spiceLevel: parsed.data.spiceLevel,
      preparationTime: parsed.data.preparationTime,
      isAvailable: parsed.data.isAvailable,
      categoryId: category.id,
    },
  });

  revalidatePath("/admin/menu");
  revalidatePath(`/restaurants/${restaurant.id}`);
  return { success: true as const };
}

export async function deleteMenuItem(itemId: string) {
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) return { success: false as const, error: "Not authorized." };

  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId: restaurant.id },
  });
  if (!item) return { success: false as const, error: "Item not found." };

  await prisma.menuItem.delete({ where: { id: itemId } });

  revalidatePath("/admin/menu");
  revalidatePath(`/restaurants/${restaurant.id}`);
  return { success: true as const };
}

export async function toggleItemAvailability(itemId: string) {
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) return { success: false as const, error: "Not authorized." };

  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId: restaurant.id },
  });
  if (!item) return { success: false as const, error: "Item not found." };

  await prisma.menuItem.update({
    where: { id: itemId },
    data: { isAvailable: !item.isAvailable },
  });

  revalidatePath("/admin/menu");
  revalidatePath(`/restaurants/${restaurant.id}`);
  return { success: true as const };
}

export async function ensureSlug(name: string) {
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) return null;
  const base = slugify(name) || slugify(restaurant.name) || restaurant.id;
  return base;
}