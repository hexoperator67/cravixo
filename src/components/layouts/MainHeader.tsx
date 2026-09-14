import Link from "next/link";
import { auth } from "@/lib/auth";
import CartBadge from "@/components/layouts/CartBadge";
import UserMenu from "@/components/layouts/UserMenu";
import DashboardLink from "@/components/layouts/AdminDashboardLink";

export default async function MainHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="bg-primary text-white text-lg font-bold px-2.5 py-1 rounded-xl tracking-tight">
            CX
          </span>
          <div className="hidden sm:block">
            <span className="text-xl font-bold tracking-tight text-primary">
              CRAVIXO
            </span>
            <span className="block text-[10px] text-zinc-400 -mt-0.5 font-medium tracking-wide">
              Find Your Next Craving
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {session?.user ? (
            <>
              <DashboardLink userId={session.user.id!} />
              <UserMenu
                name={session.user.name}
                email={session.user.email}
                image={session.user.image}
              />
              <CartBadge />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
              >
                Sign Up
              </Link>
              <CartBadge />
            </>
          )}
        </div>
      </div>
    </header>
  );
}