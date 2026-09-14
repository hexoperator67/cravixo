"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="mt-8 flex items-center gap-3 bg-white rounded-2xl p-2 max-w-xl shadow-lg shadow-black/10"
    >
      <Search className="h-5 w-5 text-zinc-400 ml-3 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for restaurants or cuisines..."
        className="flex-1 bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 text-sm sm:text-base py-1.5"
      />
      <button
        type="submit"
        className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 sm:px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        Search
      </button>
    </form>
  );
}