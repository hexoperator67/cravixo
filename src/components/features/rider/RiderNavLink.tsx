"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Bike,
  History,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  home: Home,
  dashboard: LayoutDashboard,
  bike: Bike,
  history: History,
  packageCheck: PackageCheck,
} as const;

export type RiderIconName = keyof typeof icons;

export default function RiderNavLink({
  href,
  icon,
  label,
  exact = false,
  badge,
}: {
  href: string;
  icon: RiderIconName;
  label: string;
  exact?: boolean;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  const Icon = icons[icon] ?? Home;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        "justify-center md:justify-start"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden md:inline truncate">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="ml-auto hidden md:inline-block bg-primary text-white text-[11px] font-bold h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}