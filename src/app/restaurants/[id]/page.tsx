import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Clock, MapPin, Phone, BadgeCheck, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import MenuSection from "@/components/features/menu/MenuSection";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getRestaurant(id: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: [{ isVegetarian: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  return restaurant;
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);

  if (!restaurant) notFound();

  const availableItems = restaurant.categories.reduce(
    (acc, category) => acc + category.items.length,
    0
  );

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Cover section */}
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-primary/80 to-accent/70 overflow-hidden">
        {restaurant.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="max-w-7xl mx-auto px-4 relative h-full flex items-end pb-16">
          <Link
            href="/"
            className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-sm font-medium text-zinc-800 hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </div>

      {/* Restaurant info card */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 -mt-10 relative shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
                  {restaurant.name}
                </h1>
                {restaurant.rating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                    <BadgeCheck className="h-4 w-4" />
                    Rated
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded-lg text-sm font-semibold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {restaurant.rating.toFixed(1)}
                </span>
                <span className="text-sm text-zinc-500">
                  {restaurant.totalRatings} ratings
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-zinc-600">
                {restaurant.description && (
                  <p>{restaurant.description}</p>
                )}
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                  {restaurant.address}
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                  {restaurant.phone}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span className="font-semibold text-zinc-700">
                  {restaurant.estimatedDeliveryTime} min
                </span>
              </div>
              <span className="text-sm text-zinc-500">
                Min order {formatPrice(restaurant.minimumOrder)}
              </span>
              {(restaurant.openingTime || restaurant.closingTime) && (
                <span className="text-xs text-zinc-400">
                  {restaurant.openingTime} - {restaurant.closingTime}
                </span>
              )}
              <span className="text-xs text-zinc-400">
                {availableItems} items on the menu
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {restaurant.categories.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {restaurant.categories.map((category) => (
                <MenuSection
                  key={category.id}
                  category={category}
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                />
              ))}
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-white rounded-2xl border border-zinc-200 p-5">
                <h3 className="font-semibold text-zinc-900 mb-3">Menu Index</h3>
                <ul className="space-y-2">
                  {restaurant.categories.map((category) => (
                    <li key={category.id}>
                      <a
                        href={`#category-${category.id}`}
                        className="text-sm text-zinc-600 hover:text-primary transition-colors inline-flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                        {category.name}
                        <span className="text-zinc-400">
                          ({category.items.length})
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
            <p className="text-zinc-500">
              This restaurant hasn&apos;t added any menu items yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}