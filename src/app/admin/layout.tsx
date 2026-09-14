import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Home } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/lib/auth";
import AdminNavLink, { AdminIconName } from "@/components/features/admin/AdminNavLink";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Restaurant Dashboard",
    template: "%s | Dashboard",
  },
};

const navItems: Array<{
  href: string;
  label: string;
  icon: AdminIconName;
  exact?: boolean;
  isOrders?: boolean;
}> = [
  { href: "/admin", label: "Overview", icon: "dashboard", exact: true },
  { href: "/admin/orders", label: "Incoming Orders", icon: "inbox", isOrders: true },
  { href: "/admin/menu", label: "Menu", icon: "menu" },
  { href: "/admin/history", label: "Order History", icon: "history" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
    include: {
      _count: {
        select: {
          orders: { where: { status: "pending" } },
        },
      },
    },
  });

  const isOwner = Boolean(restaurant);
  const isAdmin = session.user.role === "admin";

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-16 md:w-60 shrink-0 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-4 hidden md:block">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-white font-bold px-2 py-1 rounded-lg text-sm">
              CX
            </span>
<div>
            <p className="font-bold text-zinc-900 leading-tight truncate">
              {restaurant?.name ?? (isAdmin ? "CRAVIXO Admin" : "Dashboard")}
            </p>
            <p className="text-xs text-zinc-400 leading-tight">
              {restaurant ? "Admin Panel" : isAdmin ? "Platform Admin" : "Pending Setup"}
            </p>
          </div>
          </div>
        </div>

        <nav className="flex-1 px-2 md:px-3 py-4 space-y-1 overflow-y-auto">
          <AdminNavLink
            href="/"
            icon="home"
            label="Go to Site"
            exact
          />
          {!isOwner && !isAdmin && (
            <AdminNavLink
              href="/admin/settings"
              icon="settings"
              label="Setup Restaurant"
              exact
            />
          )}
          {navItems.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              exact={item.exact}
              badge={
                item.isOrders
                  ? restaurant?._count.orders
                  : undefined
              }
            />
          ))}
        </nav>

        <div className="p-2 md:p-3 border-t border-zinc-200">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-red-50 hover:text-red-600 font-medium transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-zinc-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h2 className="font-bold text-zinc-900 text-base md:text-lg">
              Restaurant Dashboard
            </h2>
            <p className="text-xs text-zinc-500 hidden md:block">
              Manage your restaurant and receive orders in real-time
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {restaurant && (
              <Link
                href={`/restaurants/${restaurant.id}`}
                target="_blank"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                View Restaurant
              </Link>
            )}
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}