import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getAdminSession } from "@/lib/auth";

const adminLinks: Array<{ href: Route; label: string }> = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/fares", label: "Fares" },
  { href: "/admin/settings", label: "Service area" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      {session ? (
        <div className="mx-auto mb-6 flex max-w-6xl flex-col gap-4 rounded-4xl border border-white/70 bg-white/80 px-6 py-5 shadow-soft backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Rampurhat TOTO Admin</p>
            <p className="mt-2 text-sm text-slate-600">Signed in as {session.name} • {session.role}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {adminLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                {link.label}
              </Link>
            ))}
            <form action="/api/auth/logout" method="post">
              <Button variant="ghost" type="submit">Logout</Button>
            </form>
          </div>
        </div>
      ) : null}
      {children}
    </main>
  );
}