"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
};

type CartState = {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, "quantity">) => { ok: boolean; error?: string };
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,

      addItem: (item) => {
        const state = get();
        if (state.restaurantId && state.restaurantId !== item.restaurantId) {
          return {
            ok: false,
            error:
              "Your cart already has items from another restaurant. Clear it first to order from this restaurant.",
          };
        }

        const existing = state.items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [...state.items, { ...item, quantity: 1 }],
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
          });
        }
        return { ok: true };
      },

      removeItem: (id) => {
        const state = get();
        const remaining = state.items.filter((i) => i.id !== id);
        set({
          items: remaining,
          restaurantId: remaining.length > 0 ? state.restaurantId : null,
          restaurantName: remaining.length > 0 ? state.restaurantName : null,
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () =>
        set({ items: [], restaurantId: null, restaurantName: null }),

      totalItems: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "cravixo-cart",
    }
  )
);