import { prisma } from "@/lib/prisma";
import RestaurantCard from "@/components/features/restaurant/RestaurantCard";
import SearchBar from "@/components/features/restaurant/SearchBar";
import { UtensilsCrossed, Flame, Timer } from "lucide-react";

// Force dynamic so we always show fresh restaurant data
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const restaurants = await prisma.restaurant.findMany({
    where: {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: 24,
  });

  return (
    <div>
      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary via-primary to-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Craving something delicious?
            </h1>
            <p className="mt-4 text-lg text-white/85">
              Order food from the best local restaurants, delivered hot to your
              doorstep.
            </p>
          </div>
          <SearchBar />
        </div>
      </section>

      {/* Feature highlights */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">300+ Restaurants</p>
              <p className="text-xs text-zinc-500">Wide selection of cuisines</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">30 min delivery</p>
              <p className="text-xs text-zinc-500">Hot and fresh, guaranteed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Live order tracking</p>
              <p className="text-xs text-zinc-500">Know exactly when it arrives</p>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant listing */}
      <section className="bg-zinc-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Restaurants near you
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Browse our handpicked restaurants ready to serve you
              </p>
            </div>
          </div>

          {restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <UtensilsCrossed className="h-12 w-12 mx-auto text-zinc-300" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-700">
                No restaurants yet
              </h3>
              <p className="text-zinc-500 text-sm mt-1">
                Check back soon — restaurants are being added every day!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}