import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookingForm } from "@/components/booking-form";
import { RideStatusBadge } from "@/components/ride-status";
import { SiteHeader } from "@/components/site-header";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Ride, VehicleType } from "@/lib/types";

export const metadata: Metadata = { title: "Book a ride" };

type SearchParams = Promise<{ pickup?: string; drop?: string; vehicle?: string }>;

export default async function TravelerPage({ searchParams }: { searchParams: SearchParams }) {
  const { pickup, drop, vehicle } = await searchParams;
  const profile = await requireProfile("traveler");
  const supabase = await createClient();

  // Rides still in flight deserve a prominent way back to them.
  const { data } = await supabase
    .from("rides")
    .select("*")
    .eq("traveler_id", profile.id)
    .in("status", ["pending", "accepted", "ongoing"])
    .order("created_at", { ascending: false })
    .limit(3);
  const openRides = (data as Ride[] | null) ?? [];

  const firstName = profile.full_name.split(" ")[0] || "there";

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="container py-6">
        <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">Hi {firstName} 👋</h1>
        <p className="mb-5 text-muted-foreground">Where are we going today?</p>

        {openRides.length > 0 && (
          <section className="mb-5 grid gap-2" aria-label="Rides in progress">
            {openRides.map((r) => (
              <Link
                key={r.id}
                href={`/rides/${r.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-accent p-4 font-bold text-accent-foreground shadow-sm transition-transform active:scale-[0.99]"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-semibold opacity-90">
                    {r.booking_type === "scheduled" ? "Upcoming ride" : "Ride in progress"}
                  </span>
                  <span className="truncate">
                    {r.pickup_location} → {r.drop_location}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <RideStatusBadge status={r.status} scheduled={r.booking_type === "scheduled"} />
                  <ArrowRight aria-hidden />
                </span>
              </Link>
            ))}
          </section>
        )}

        <BookingForm
          initialPickup={pickup?.slice(0, 200)}
          initialDrop={drop?.slice(0, 200)}
          initialVehicle={vehicle === "cab" || vehicle === "toto" ? (vehicle as VehicleType) : undefined}
        />
      </main>
    </>
  );
}
