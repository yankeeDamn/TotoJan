import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { estimateFare } from "@/lib/pricing";
import type { MarketStats } from "@/lib/types";

const bodySchema = z
  .object({
    pickup: z.string().trim().min(2).max(200),
    drop: z.string().trim().min(2).max(200),
    vehicleType: z.enum(["toto", "cab"]),
    bookingType: z.enum(["live", "scheduled"]),
    scheduledFor: z.string().datetime({ offset: true }).optional(),
  })
  .refine((v) => (v.bookingType === "scheduled") === Boolean(v.scheduledFor), {
    message: "scheduledFor is required for scheduled rides and not allowed for live rides",
    path: ["scheduledFor"],
  });

const MAX_OPEN_RIDES = 3;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in to book a ride." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid booking details." }, { status: 400 });
  }
  const { pickup, drop, vehicleType, bookingType, scheduledFor } = parsed.data;

  const now = new Date();
  let when = now;
  if (bookingType === "scheduled") {
    when = new Date(scheduledFor!);
    const minutesAhead = (when.getTime() - now.getTime()) / 60_000;
    if (minutesAhead < 15) {
      return NextResponse.json({ error: "Scheduled rides must be at least 15 minutes from now." }, { status: 400 });
    }
    if (minutesAhead > 30 * 24 * 60) {
      return NextResponse.json({ error: "You can book up to 30 days ahead." }, { status: 400 });
    }
  }

  // Basic abuse guard: a traveler can only have a few open rides at once.
  const { count } = await supabase
    .from("rides")
    .select("id", { count: "exact", head: true })
    .eq("traveler_id", user.id)
    .in("status", ["pending", "accepted", "ongoing"]);
  if ((count ?? 0) >= MAX_OPEN_RIDES) {
    return NextResponse.json(
      { error: `You already have ${MAX_OPEN_RIDES} open rides. Complete or cancel one first.` },
      { status: 429 },
    );
  }

  // Live demand only applies to rides happening now.
  let stats: MarketStats = { onlineDrivers: 0, pendingRides: 0 };
  if (bookingType === "live") {
    const { data } = await supabase.rpc("market_stats");
    const row = Array.isArray(data) ? data[0] : data;
    if (row) stats = { onlineDrivers: row.online_drivers ?? 0, pendingRides: row.pending_rides ?? 0 };
  }

  // The fare is always computed here, never taken from the client.
  const estimate = estimateFare({ vehicleType, when, stats });

  const { data: ride, error } = await supabase
    .from("rides")
    .insert({
      traveler_id: user.id,
      pickup_location: pickup,
      drop_location: drop,
      booking_type: bookingType,
      scheduled_for: bookingType === "scheduled" ? when.toISOString() : null,
      vehicle_type: vehicleType,
      distance_km: estimate.distanceKm,
      fare: estimate.fare,
      demand_multiplier: estimate.multiplier,
    })
    .select("id, fare, demand_multiplier")
    .single();

  if (error) {
    const message = error.code === "42501" ? "Only traveler accounts can book rides." : error.message;
    return NextResponse.json({ error: message }, { status: error.code === "42501" ? 403 : 500 });
  }

  return NextResponse.json({ id: ride.id, fare: ride.fare, multiplier: ride.demand_multiplier }, { status: 201 });
}
