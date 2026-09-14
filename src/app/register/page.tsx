"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { registerUser } from "@/actions/auth";

function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const requestedRole = searchParams.get("role");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "restaurant_owner" | "delivery_rider">(
    requestedRole === "restaurant_owner" ? "restaurant_owner" : requestedRole === "delivery_rider" ? "delivery_rider" : "customer"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await registerUser({ name, email, password, role });
    if (result && !result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Join CRAVIXO to order food, run a restaurant, or deliver orders
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-700 mb-2">
            I want to
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                role === "customer"
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              Order Food
            </button>
            <button
              type="button"
              onClick={() => setRole("restaurant_owner")}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                role === "restaurant_owner"
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              Run a Restaurant
            </button>
            <button
              type="button"
              onClick={() => setRole("delivery_rider")}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                role === "delivery_rider"
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              Deliver
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-zinc-200 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-primary hover:underline"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-gradient-to-b from-zinc-50 to-white">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="py-20 text-center text-zinc-400">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}