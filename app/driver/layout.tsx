import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getDriverSession } from "@/lib/auth";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getDriverSession();

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      {session ? (
        <div className="mx-auto mb-6 flex max-w-4xl flex-col gap-4 rounded-4xl border border-white/70 bg-white/80 px-6 py-5 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent-700">
              Rampurhat TOTO Driver
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {session.name} • {session.phone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/driver/dashboard"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Dashboard
            </Link>
            <form action="/api/auth/logout" method="post">
              <Button variant="ghost" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      ) : null}
      {children}
    </main>
  );
}
