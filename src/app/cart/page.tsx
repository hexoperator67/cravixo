"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { items, restaurantName, restaurantId, updateQuantity, removeItem, clearCart, subtotal } =
    useCartStore();

  const deliveryFee = items.length > 0 ? 299 : 0;
  const tax = items.length > 0 ? Math.round(subtotal() * 0.08) : 0;
  const total = subtotal() + deliveryFee + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">
          Your cart is empty
        </h1>
        <p className="mt-2 text-zinc-500">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
        >
          Browse Restaurants
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Your Cart</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Clear cart
        </button>
      </div>

      {restaurantName && (
        <div className="mb-6 flex items-center gap-2 bg-zinc-100 rounded-xl px-4 py-3 text-sm">
          <ShoppingBag className="h-4 w-4 text-zinc-500" />
          <span className="text-zinc-600">Ordering from</span>
          <Link
            href={`/restaurants/${restaurantId}`}
            className="font-semibold text-primary hover:underline"
          >
            {restaurantName}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-white rounded-2xl border border-zinc-200 p-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {formatPrice(item.price)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4 text-zinc-600" />
                </button>
                <span className="w-8 text-center font-semibold text-zinc-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4 text-zinc-600" />
                </button>
              </div>
              <span className="w-20 text-right font-semibold text-zinc-900">
                {formatPrice(item.price * item.quantity)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Link
            href={`/restaurants/${restaurantId}`}
            className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:underline"
          >
            <ArrowRight className="h-4 w-4" />
            Add more items
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-20">
            <h2 className="font-bold text-lg text-zinc-900 mb-4">
              Order Summary
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd className="font-medium text-zinc-900">
                  {formatPrice(subtotal())}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Delivery Fee</dt>
                <dd className="font-medium text-zinc-900">
                  {formatPrice(deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Tax (8%)</dt>
                <dd className="font-medium text-zinc-900">
                  {formatPrice(tax)}
                </dd>
              </div>
              <div className="border-t border-zinc-200 pt-3 flex justify-between">
                <dt className="font-semibold text-zinc-900">Total</dt>
                <dd className="font-bold text-lg text-primary">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}