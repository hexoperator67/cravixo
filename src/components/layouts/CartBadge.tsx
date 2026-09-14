"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export default function CartBadge() {
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:block">Cart</span>
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full">
          {totalItems}
        </span>
      )}
    </Link>
  );
}