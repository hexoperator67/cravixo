import Link from "next/link";
import { Star, Clock, ChevronRight } from "lucide-react";

type RestaurantCardData = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  rating: number;
  totalRatings: number;
  estimatedDeliveryTime: number;
  minimumOrder: number;
};

export default function RestaurantCard({
  restaurant,
}: {
  restaurant: RestaurantCardData;
}) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[4/3] bg-zinc-100 overflow-hidden relative">
        {restaurant.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
            <span className="text-5xl font-bold text-primary/70">
              {restaurant.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold">{restaurant.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
            {restaurant.name}
          </h3>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-primary shrink-0 mt-1" />
        </div>
        {restaurant.description && (
          <p className="text-sm text-zinc-500 line-clamp-1 mt-1">
            {restaurant.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {restaurant.estimatedDeliveryTime} min
          </span>
          <span className="h-1 w-1 bg-zinc-300 rounded-full" />
          <span>
            Min ${(restaurant.minimumOrder / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}