import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RideCard } from "@/components/ride-status";
import { SiteHeader } from "@/components/site-header";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Ride } from "@/lib/types";

export const metadata: Metadata = { title: "My rides" };

export default async function RideHistoryPage() {
  const profile = await requireProfile("traveler");
  const supabase = await createClient();

  const { data } = await supabase
    .from("rides")
    .select("*")
    .eq("traveler_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const rides = (data as Ride[] | null) ?? [];

  const upcoming = rides.filter((r) => r.booking_type === "scheduled" && ["pending", "accepted"].includes(r.status));
  const rest = rides.filter((r) => !upcoming.includes(r));

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="container max-w-2xl py-6">
        <h1 className="mb-5 text-2xl font-extrabold sm:text-3xl">My rides</h1>

        {rides.length === 0 && (
          <div className="grid gap-4 rounded-2xl border-2 border-dashed p-10 text-center">
            <p className="text-lg font-bold">No rides yet</p>
            <p className="text-muted-foreground">Your bookings will show up here.</p>
            <Button asChild className="mx-auto">
              <Link href="/traveler">Book your first ride</Link>
            </Button>
          </div>
        )}

        {upcoming.length > 0 && (
          <section className="mb-6" aria-labelledby="upcoming">
            <h2 id="upcoming" className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Upcoming
            </h2>
            <div className="grid gap-2">
              {upcoming.map((r) => (
                <RideCard key={r.id} ride={r} />
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section aria-labelledby="past">
            <h2 id="past" className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              History
            </h2>
            <div className="grid gap-2">
              {rest.map((r) => (
                <RideCard key={r.id} ride={r} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
