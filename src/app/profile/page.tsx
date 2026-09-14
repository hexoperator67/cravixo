import { redirect } from "next/navigation";
import { User, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: true,
      _count: { select: { orders: true } },
    },
  });

  if (!user) redirect("/login");

  const roleLabel =
    user.role === "admin"
      ? "Administrator"
      : user.role === "restaurant_owner"
      ? "Restaurant Owner"
      : "Customer";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-accent" />
        <div className="p-6 -mt-10">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-2xl font-bold text-primary shadow-sm">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-zinc-900">
                {user.name ?? "No name set"}
              </h2>
              <p className="text-sm text-zinc-500">{roleLabel}</p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-400" />
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd className="font-medium text-zinc-900">{user.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-zinc-400" />
              <div>
                <dt className="text-zinc-500">Phone</dt>
                <dd className="font-medium text-zinc-900">
                  {user.phone ?? "Not set"}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-zinc-400" />
              <div>
                <dt className="text-zinc-500">Orders placed</dt>
                <dd className="font-medium text-zinc-900">
                  {user._count.orders}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {user.addresses.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-3">Saved Addresses</h2>
          <div className="space-y-3">
            {user.addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-zinc-900 flex items-center gap-2">
                    {address.label}
                    {address.isDefault && (
                      <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {address.street}, {address.city}, {address.state}{" "}
                    {address.zipCode}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}