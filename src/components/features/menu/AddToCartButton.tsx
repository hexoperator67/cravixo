"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export default function AddToCartButton({
  itemId,
  itemName,
  itemPrice,
  restaurantId,
  restaurantName,
}: {
  itemId: string;
  itemName: string;
  itemPrice: number;
  restaurantId: string;
  restaurantName: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const result = addItem({
      id: itemId,
      name: itemName,
      price: itemPrice,
      restaurantId,
      restaurantName,
    });
    if (result.ok) {
      setAdded(true);
      setError(null);
      setTimeout(() => setAdded(false), 1500);
    } else {
      setError(result.error ?? "Could not add item");
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleAdd}
        className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
          added
            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
            : "bg-white border-primary text-primary hover:bg-primary hover:text-white"
        }`}
      >
        {added ? "Added" : (
          <>
            <Plus className="h-4 w-4" />
            Add
          </>
        )}
      </button>
      {error && <span className="text-[11px] text-red-600 text-center max-w-[140px]">{error}</span>}
    </div>
  );
}