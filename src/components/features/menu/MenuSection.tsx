import { Leaf, Sprout, UtensilsCrossed } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "@/components/features/menu/AddToCartButton";

export default async function MenuSection({
  category,
  restaurantId,
  restaurantName,
}: {
  category: {
    id: string;
    name: string;
    description: string | null;
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      image: string | null;
      isVegetarian: boolean;
      isVegan: boolean;
      isGlutenFree: boolean;
      spiceLevel: number;
      isAvailable: boolean;
    }>;
  };
  restaurantId: string;
  restaurantName: string;
}) {
  return (
    <section id={`category-${category.id}`} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-zinc-900">{category.name}</h2>
        {category.description && (
          <p className="text-sm text-zinc-500 mt-1">{category.description}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
        {category.items.map((item) => (
          <div key={item.id} className="p-5 flex gap-4 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                {item.isVegetarian && (
                  <span className="inline-flex items-center text-emerald-600" title="Vegetarian">
                    <Leaf className="h-4 w-4" />
                  </span>
                )}
                {item.isVegan && (
                  <span className="inline-flex items-center text-green-700" title="Vegan">
                    <Sprout className="h-4 w-4" />
                  </span>
                )}
                {item.isGlutenFree && (
                  <span className="inline-flex items-center text-amber-600" title="Gluten Free">
                    <UtensilsCrossed className="h-4 w-4" />
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="font-semibold text-zinc-900">
                  {formatPrice(item.price)}
                </span>
                {item.spiceLevel > 0 && (
                  <span className="text-xs text-red-600 font-medium">
                    {"🌶".repeat(Math.min(item.spiceLevel, 3))}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              {item.image && (
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <AddToCartButton
                itemId={item.id}
                itemName={item.name}
                itemPrice={item.price}
                restaurantId={restaurantId}
                restaurantName={restaurantName}
              />
            </div>
          </div>
        ))}

        {category.items.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-400">
            No items in this category yet.
          </p>
        )}
      </div>
    </section>
  );
}