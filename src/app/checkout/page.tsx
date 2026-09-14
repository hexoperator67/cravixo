"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, StickyNote, Banknote } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { createOrder } from "@/actions/orders";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, restaurantId, restaurantName, clearCart, subtotal, totalItems } =
    useCartStore();

  const [address, setAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = items.length > 0 ? 299 : 0;
  const tax = items.length > 0 ? Math.round(subtotal() * 0.08) : 0;
  const total = subtotal() + deliveryFee + tax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) {
      setError("Your cart is empty. Add items before checking out.");
      return;
    }
    if (address.trim().length < 10) {
      setError("Please enter a complete delivery address.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createOrder({
      restaurantId,
      items: items.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
      })),
      deliveryAddress: address,
      specialInstructions: specialInstructions || undefined,
    });

    if (result.success) {
      clearCart();
      try {
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: result.orderId }),
        });

        if (checkoutRes.ok) {
          const data = await checkoutRes.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          }
        }
      } catch {
        // Stripe unavailable — fall through to COD flow
      }

      // Fallback: cash on delivery via order tracking page
      router.push(`/orders/${result.orderId}?payment=success`);
    } else {
      setError(result.error ?? "Could not place order. Please try again.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <MapPin className="h-10 w-10 text-zinc-300" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900">
          Nothing to check out
        </h1>
        <p className="mt-2 text-zinc-500 text-sm">
          Head back to restaurants and add something tasty to your cart.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delivery details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="font-bold text-lg text-zinc-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Delivery Details
            </h2>
            <label htmlFor="address" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Delivery Address *
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              required
              placeholder="House/Flat number, Street, Area, City, PIN code"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <div className="mt-4">
              <label htmlFor="instructions" className="block text-sm font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <StickyNote className="h-4 w-4 text-zinc-400" />
                Special Instructions (optional)
              </label>
              <textarea
                id="instructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                placeholder="e.g. Ring the bell twice, no onions please..."
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="font-bold text-lg text-zinc-900 mb-4 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Payment
            </h2>
            <div className="flex items-center gap-3 border-2 border-primary/30 bg-primary/5 rounded-xl px-4 py-3">
              <Banknote className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm text-zinc-900">Cash on Delivery</p>
                <p className="text-xs text-zinc-500">
                  Pay when your order arrives. Online payments coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-20">
            <h2 className="font-bold text-lg text-zinc-900 mb-4">Order Summary</h2>
            <p className="text-sm text-zinc-600 mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-zinc-400" />
              {restaurantName}
            </p>
            <ul className="space-y-2 text-sm max-h-56 overflow-y-auto mb-4">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="text-zinc-600">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="font-medium text-zinc-900 whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 text-sm border-t border-zinc-200 pt-4">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Item total ({totalItems()} items)</dt>
                <dd className="font-medium">{formatPrice(subtotal())}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Delivery Fee</dt>
                <dd className="font-medium">{formatPrice(deliveryFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Tax</dt>
                <dd className="font-medium">{formatPrice(tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-3">
                <dt className="font-semibold text-zinc-900">Total</dt>
                <dd className="font-bold text-lg text-primary">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>
            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing order...
                </>
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}