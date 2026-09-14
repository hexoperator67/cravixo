"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const parsed = registerSchema.safeParse({
    name: input.name,
    email: input.email,
    password: input.password,
  });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid registration details.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) {
    return { success: false as const, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    const role =
      input.role === "restaurant_owner"
        ? "restaurant_owner"
        : input.role === "delivery_rider"
        ? "delivery_rider"
        : "customer";
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name,
        passwordHash,
        role,
      },
    });

    const result = await signIn("credentials", {
      email: user.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false as const, error: "Account created but could not sign you in. Please log in." };
    }

    if (role === "restaurant_owner") redirect("/admin");
    if (role === "delivery_rider") redirect("/rider");
    redirect("/");
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false as const, error: "Could not sign you in. Please try logging in." };
    }
    // A redirect is thrown on success — rethrow handled redirects
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Registration failed:", error);
    return { success: false as const, error: "Could not create your account." };
  }
}

export async function signInWithCredentials(input: {
  email: string;
  password: string;
  redirectTo?: string;
}) {
  try {
    const result = await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false as const,
        error: "Invalid email or password. Please try again.",
      };
    }

    redirect(input.redirectTo ?? "/");
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false as const,
        error: "Invalid email or password. Please try again.",
      };
    }
    // A redirect is thrown on success — rethrow handled redirects
    if (
      error instanceof Error &&
      error.message.includes("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      success: false as const,
      error: "Something went wrong. Please try again.",
    };
  }
}