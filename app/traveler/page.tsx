import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookingForm } from "@/components/booking-form";
import { RideStatusBadge } from "@/components/ride-status";
import { SiteHeader } from "@/components/site-header";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Ride } from "@/lib/types";

export const metadata: Metadata = { title: "Book a ride" };

export default async function TravelerPage() {
  const profile = await requireProfile("traveler");
  const supabase = await createClient();

  // A ride in progress deserves a prominent way back to it.
  const { data } = await supabase
    .from("rides")
    .select("*")
    .eq("traveler_id", profile.id)
    .in("status", ["accepted", "ongoing"])
    .order("created_at", { ascending: false })
    .limit(1);
  const active = (data as Ride[] | null)?.[0];

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="container py-6">
        <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">Hi {profile.full_name.split(" ")[0] || "there"} 👋</h1>
        <p className="mb-5 text-muted-foreground">Where are we going today?</p>

        {active && (
          <Link
            href={`/rides/${active.id}`}
            className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-accent p-4 font-bold text-accent-foreground shadow-sm"
          >
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold opacity-90">Ride in progress</span>
              <span>
                {active.pickup_location} → {active.drop_location}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <RideStatusBadge status={active.status} />
              <ArrowRight aria-hidden />
            </span>
          </Link>
        )}

        <BookingForm />
      </main>
    </>
  );
}
