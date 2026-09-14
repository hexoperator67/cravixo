import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Home } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/lib/auth";
import RiderNavLink from "@/components/features/rider/RiderNavLink";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Rider Dashboard",
    template: "%s | Rider Dashboard",
  },
};

const navItems: Array<{
  href: string;
  label: string;
  icon: "dashboard" | "bike" | "history";
  exact?: boolean;
}> = [
  { href: "/rider", label: "Overview", icon: "dashboard", exact: true },
  { href: "/rider/deliveries", label: "My Deliveries", icon: "bike" },
  { href: "/rider/history", label: "History", icon: "history" },
];

export default async function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/rider");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  });

  if (!user || user.role !== "delivery_rider") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto">
            <Home className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-zinc-900">
            Rider Access Required
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            This dashboard is for delivery riders. Register as a rider to access deliveries.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const activeCount = await prisma.order.count({
    where: {
      riderId: user.id,
      status: { in: ["ready", "out_for_delivery"] },
    },
  });

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
                {user.name ?? "Rider"}
              </p>
              <p className="text-xs text-zinc-400 leading-tight">Rider Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 md:px-3 py-4 space-y-1 overflow-y-auto">
          <RiderNavLink href="/" icon="home" label="Go to Site" exact />
          {navItems.map((item) => (
            <RiderNavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              exact={item.exact}
              badge={item.icon === "bike" ? activeCount : undefined}
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
        <header className="bg-white border-b border-zinc-200 px-4 md:px-8 py-4 sticky top-0 z-40">
          <h2 className="font-bold text-zinc-900 text-base md:text-lg">
            Rider Dashboard
          </h2>
          <p className="text-xs text-zinc-500 hidden md:block">
            Manage your deliveries in real-time
          </p>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}