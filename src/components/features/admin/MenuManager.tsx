"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Leaf,
  Sprout,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
} from "@/actions/menu";

type Category = {
  id: string;
  name: string;
  description: string | null;
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    isAvailable: boolean;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    spiceLevel: number;
  }>;
};

type ActionResult = { success: boolean; error?: string };

export default function MenuManager({
  categories,
}: {
  categories: Category[];
}) {
  const [mode, setMode] = useState<"view" | "category" | "item">("view");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<Category["items"][number] | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function run(action: () => Promise<ActionResult>) {
    const result = await action();
    if (!result.success) {
      setErrorMessage(result.error ?? "Something went wrong.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }

  return (
    <div className="space-y-8">
      {errorMessage && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {errorMessage}
        </p>
      )}

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900">Categories</h2>
          <button
            type="button"
            onClick={() => {
              setMode("category");
              setEditingCategory(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-zinc-200 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900 truncate">
                    {category.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {category.items.length} item
                    {category.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("category");
                      setEditingCategory(category);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => deleteCategory(category.id))}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Items */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-zinc-900">Menu Items</h2>
          <div className="flex items-center gap-2">
            <select
              value={itemCategoryId}
              onChange={(e) => setItemCategoryId(e.target.value)}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setMode("item");
                setEditingItem(null);
                setItemCategoryId((prev) => prev);
              }}
              disabled={!itemCategoryId}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>

        {categories.map((category) => {
          if (category.items.length === 0) return null;
          return (
            <div key={category.id} className="mb-8">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                {category.name}
              </h3>
              <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                {category.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-zinc-900 truncate">
                          {item.name}
                        </h4>
                        {item.isVegetarian && (
                          <Leaf className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        {item.isVegan && (
                          <Sprout className="h-4 w-4 text-green-700 shrink-0" />
                        )}
                        {item.isGlutenFree && (
                          <UtensilsCrossed className="h-4 w-4 text-amber-600 shrink-0" />
                        )}
                        {item.spiceLevel > 0 && (
                          <span className="text-xs text-red-500">
                            {"🌶".repeat(item.spiceLevel)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => run(() => toggleItemAvailability(item.id))}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        title={
                          item.isAvailable ? "Mark unavailable" : "Mark available"
                        }
                      >
                        {item.isAvailable ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-red-500" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("item");
                          setEditingItem(item);
                          setItemCategoryId(category.id);
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => run(() => deleteMenuItem(item.id))}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Modals */}
      {mode === "category" && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setMode("view")}
          onSave={async (name, desc) => {
            await run(() =>
              editingCategory
                ? updateCategory(editingCategory.id, { name, description: desc })
                : createCategory({ name, description: desc })
            );
            setMode("view");
          }}
        />
      )}
      {mode === "item" && (
        <ItemModal
          item={editingItem}
          categoryId={itemCategoryId}
          categories={categories}
          onClose={() => setMode("view")}
          onSave={async (payload) => {
            await run(() =>
              editingItem
                ? updateMenuItem(editingItem.id, payload)
                : createMenuItem(payload)
            );
            setMode("view");
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell title={category ? "Edit Category" : "Add Category"} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSave(name, description);
          setSaving(false);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Name *
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. Starters, Main Course, Desserts"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {category ? "Save Changes" : "Create Category"}
        </button>
      </form>
    </ModalShell>
  );
}

export interface MenuItemPayload {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  image?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: number;
  preparationTime?: number;
  isAvailable: boolean;
}

function ItemModal({
  item,
  categoryId,
  categories,
  onClose,
  onSave,
}: {
  item: Category["items"][number] | null;
  categoryId: string;
  categories: Category[];
  onClose: () => void;
  onSave: (payload: MenuItemPayload) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? String(item.price / 100) : "");
  const [image, setImage] = useState(item?.image ?? "");
  const [category, setCategory] = useState(categoryId);
  const [isVegetarian, setIsVegetarian] = useState(item?.isVegetarian ?? false);
  const [isVegan, setIsVegan] = useState(item?.isVegan ?? false);
  const [isGlutenFree, setIsGlutenFree] = useState(item?.isGlutenFree ?? false);
  const [spiceLevel, setSpiceLevel] = useState(item?.spiceLevel ?? 0);
  const [preparationTime, setPreparationTime] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell title={item ? "Edit Item" : "Add Item"} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSave({
            name,
            description,
            price: Math.round(parseFloat(price) * 100),
            categoryId: category,
            image,
            isVegetarian,
            isVegan,
            isGlutenFree,
            spiceLevel,
            preparationTime: preparationTime ? parseInt(preparationTime, 10) : undefined,
            isAvailable: item?.isAvailable ?? true,
          });
          setSaving(false);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Name *
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. Margherita Pizza"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Price ($) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="9.99"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Prep time (min)
            </label>
            <input
              type="number"
              min="1"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="15"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Category *
          </label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="https://...  (optional)"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Toggle label="Veg" checked={isVegetarian} onChange={setIsVegetarian} />
          <Toggle label="Vegan" checked={isVegan} onChange={setIsVegan} />
          <Toggle label="Gluten Free" checked={isGlutenFree} onChange={setIsGlutenFree} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Spice Level
          </label>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSpiceLevel(level)}
                className={`h-9 flex-1 rounded-lg text-sm font-semibold border transition-colors ${
                  spiceLevel === level
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400"
                }`}
              >
                {level === 0 ? "Mild" : "🌶".repeat(level)}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {item ? "Save Changes" : "Create Item"}
        </button>
      </form>
    </ModalShell>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
        checked
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
      }`}
    >
      {checked && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
      {label}
    </button>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}