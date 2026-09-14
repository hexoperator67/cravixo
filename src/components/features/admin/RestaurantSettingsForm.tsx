"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { upsertRestaurant } from "@/actions/restaurants";

type RestaurantData = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string;
  email: string;
  image: string | null;
  coverImage: string | null;
  estimatedDeliveryTime: number;
  minimumOrder: number;
  openingTime: string | null;
  closingTime: string | null;
};

export default function RestaurantSettingsForm({
  restaurant,
}: {
  restaurant: RestaurantData | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: restaurant?.name ?? "",
    description: restaurant?.description ?? "",
    address: restaurant?.address ?? "",
    phone: restaurant?.phone ?? "",
    email: restaurant?.email ?? "",
    image: restaurant?.image ?? "",
    coverImage: restaurant?.coverImage ?? "",
    estimatedDeliveryTime: String(restaurant?.estimatedDeliveryTime ?? 30),
    minimumOrder: String(restaurant?.minimumOrder ?? 0),
    openingTime: restaurant?.openingTime ?? "",
    closingTime: restaurant?.closingTime ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await upsertRestaurant({
      name: form.name,
      description: form.description || undefined,
      address: form.address,
      phone: form.phone,
      email: form.email,
      image: form.image || undefined,
      coverImage: form.coverImage || undefined,
      estimatedDeliveryTime: parseInt(form.estimatedDeliveryTime, 10) || 30,
      minimumOrder: Math.round(parseFloat(form.minimumOrder) * 100) || 0,
      openingTime: form.openingTime || undefined,
      closingTime: form.closingTime || undefined,
    });

    if (result.success) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(result.error ?? "Could not save.");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-zinc-900">Basic Info</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Restaurant Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Curry House"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="What makes your restaurant special?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Contact Email *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Phone *
            </label>
            <input
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-zinc-900">Location & Timing</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Address *
            </label>
            <input
              required
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className={inputClass}
              placeholder="Street, City, State, PIN"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Opens at
              </label>
              <input
                type="time"
                value={form.openingTime}
                onChange={(e) => update("openingTime", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Closes at
              </label>
              <input
                type="time"
                value={form.closingTime}
                onChange={(e) => update("closingTime", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Delivery time (min)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={form.estimatedDeliveryTime}
                onChange={(e) => update("estimatedDeliveryTime", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Min order ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minimumOrder}
                onChange={(e) => update("minimumOrder", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Logo Image URL
          </label>
          <input
            type="url"
            value={form.image}
            onChange={(e) => update("image", e.target.value)}
            className={inputClass}
            placeholder="https://...  (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Cover Image URL
          </label>
          <input
            type="url"
            value={form.coverImage}
            onChange={(e) => update("coverImage", e.target.value)}
            className={inputClass}
            placeholder="https://...  (optional)"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : restaurant ? (
            "Save Changes"
          ) : (
            "Create Restaurant"
          )}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Saved successfully!
          </span>
        )}
      </div>

      {!restaurant && (
        <p className="text-sm text-zinc-500">
          Set up your restaurant profile to start receiving orders on the
          dashboard. You can customize your menu once this is saved.
        </p>
      )}
    </form>
  );
}