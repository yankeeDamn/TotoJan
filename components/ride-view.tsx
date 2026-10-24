"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, Check, Clock, Loader2, Navigation, Phone, RotateCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatPanel } from "@/components/chat-panel";
import { RideStatusBadge, VehicleIcon } from "@/components/ride-status";
import { RouteMap } from "@/components/route-map";
import { PRESET_ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import type { Message, Ride, RideStatus, Role, Vehicle } from "@/lib/types";

interface Counterpart {
  id: string;
  full_name: string;
  phone_number: string | null;
}

interface RideViewProps {
  initialRide: Ride;
  initialMessages: Message[];
  me: { id: string; role: Role };
}

const STEPS: { status: RideStatus; label: string }[] = [
  { status: "pending", label: "Requested" },
  { status: "accepted", label: "Accepted" },
  { status: "ongoing", label: "On trip" },
  { status: "completed", label: "Done" },
];

function mapRoute(ride: Ride) {
  const startsAtTarapith = ride.pickup_location.toLowerCase().includes("tarapith");
  return PRESET_ROUTES[startsAtTarapith ? 1 : 0];
}

export function RideView({ initialRide, initialMessages, me }: RideViewProps) {
  const router = useRouter();
  const [ride, setRide] = useState<Ride>(initialRide);
  const [counterpart, setCounterpart] = useState<Counterpart | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [busy, setBusy] = useState(false);
  const [waitedMin, setWaitedMin] = useState(0);
  const previousStatus = useRef<RideStatus>(initialRide.status);

  const isTraveler = me.role === "traveler";
  const backHref = isTraveler ? "/traveler" : "/driver";
  const counterpartId = isTraveler ? ride.driver_id : ride.driver_id === me.id ? ride.traveler_id : null;

  // Live updates to this ride (accepted, started, completed, cancelled, released).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ride-${initialRide.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${initialRide.id}` },
        (payload) => setRide(payload.new as Ride),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialRide.id]);

  // Toast on every status change so nobody has to keep staring at the screen.
  useEffect(() => {
    const prev = previousStatus.current;
    if (prev === ride.status) return;
    previousStatus.current = ride.status;

    if (ride.status === "accepted") toast.success(isTraveler ? "A driver accepted your ride!" : "Ride confirmed");
    else if (ride.status === "ongoing") toast.info("Trip started. Have a safe ride!");
    else if (ride.status === "completed") toast.success("Trip completed. Thank you for riding with TotoJan!");
    else if (ride.status === "cancelled") toast.error("This ride was cancelled.");
    else if (ride.status === "pending" && prev === "accepted") {
      toast.warning(isTraveler ? "Your driver had to cancel. Finding you another one…" : "Ride released.");
    }
  }, [ride.status, isTraveler]);

  // A driver who released the ride (or lost it) has nothing left to do here.
  useEffect(() => {
    if (!isTraveler && ride.driver_id !== me.id) {
      toast.info("This ride is no longer assigned to you.");
      router.replace("/driver");
    }
  }, [isTraveler, ride.driver_id, me.id, router]);

  // Load the other person's contact details whenever the pairing changes.
  useEffect(() => {
    let cancelled = false;
    if (!counterpartId) {
      setCounterpart(null);
      setVehicle(null);
      return;
    }
    const supabase = createClient();

    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number")
        .eq("id", counterpartId)
        .maybeSingle();
      if (!cancelled) setCounterpart((p as Counterpart | null) ?? null);

      if (isTraveler) {
        const { data: v } = await supabase.from("vehicles").select("*").eq("driver_id", counterpartId).maybeSingle();
        if (!cancelled) setVehicle((v as Vehicle | null) ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [counterpartId, isTraveler]);

  // Gentle nudge if a live request sits unanswered.
  useEffect(() => {
    if (ride.status !== "pending" || ride.booking_type !== "live") return;
    const tick = () => setWaitedMin(Math.floor((Date.now() - new Date(ride.created_at).getTime()) / 60_000));
    tick();
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
  }, [ride.status, ride.booking_type, ride.created_at]);

  async function changeStatus(next: "ongoing" | "completed" | "cancelled", confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    const { data, error } = await createClient().rpc("set_ride_status", { p_ride: ride.id, p_status: next });
    setBusy(false);
    if (error) return toast.error(error.message);
    setRide(data as Ride);
  }

  const route = mapRoute(ride);
  const stepIndex = STEPS.findIndex((s) => s.status === ride.status);
  const scheduled = ride.booking_type === "scheduled";
  const chatOpen = Boolean(ride.driver_id) && (ride.status === "accepted" || ride.status === "ongoing");
  const otherName = counterpart?.full_name || (isTraveler ? "your driver" : "the traveler");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid content-start gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={backHref}>
            <ArrowLeft /> Back
          </Link>
        </Button>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div className="min-w-0">
              <CardTitle className="text-xl">
                {ride.pickup_location} → {ride.drop_location}
              </CardTitle>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs uppercase">#{ride.id.slice(0, 6)}</span>
                {scheduled && ride.scheduled_for ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-4" aria-hidden /> {formatDateTime(ride.scheduled_for)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-4" aria-hidden /> {formatDateTime(ride.created_at)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 capitalize">
                  <VehicleIcon type={ride.vehicle_type} className="size-4" /> {ride.vehicle_type}
                </span>
                <span>{Number(ride.distance_km)} km</span>
              </p>
            </div>
            <RideStatusBadge status={ride.status} scheduled={scheduled} />
          </CardHeader>

          <CardContent className="grid gap-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isTraveler ? "Fare (pay driver)" : "Fare you earn"}</p>
                <p className="text-4xl font-black text-primary">{formatINR(Number(ride.fare))}</p>
              </div>
              {Number(ride.demand_multiplier) > 1 && (
                <p className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary">
                  ×{Number(ride.demand_multiplier).toFixed(2)} demand
                </p>
              )}
            </div>

            {ride.status === "cancelled" ? (
              <p className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 font-semibold text-destructive" role="status">
                <XCircle className="size-5" aria-hidden /> This ride was cancelled.
              </p>
            ) : (
              <ol className="grid grid-cols-4 gap-1" aria-label="Ride progress">
                {STEPS.map((s, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={s.status} className="flex flex-col items-center gap-1.5 text-center">
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-full text-xs font-bold transition-colors",
                          done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                        )}
                        aria-current={i === stepIndex ? "step" : undefined}
                      >
                        {done && i < stepIndex ? <Check className="size-4" aria-hidden /> : i + 1}
                      </span>
                      <span className={cn("text-xs font-semibold", done ? "text-foreground" : "text-muted-foreground")}>
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {isTraveler && ride.status === "pending" && (
              <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4" role="status">
                <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" aria-hidden />
                <div className="text-sm">
                  <p className="font-bold">
                    {scheduled ? "Waiting for a driver to take this booking" : "Looking for a driver near you…"}
                  </p>
                  <p className="text-muted-foreground">
                    {scheduled
                      ? "We'll notify you here as soon as someone accepts. You can close this page."
                      : waitedMin >= 2
                        ? "Taking longer than usual. Keep waiting, or cancel and try again."
                        : "Drivers online now are seeing your request."}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              {!isTraveler && (ride.status === "accepted" || ride.status === "ongoing") && (
                <Button asChild variant="outline">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${ride.status === "accepted" ? ride.pickup_location : ride.drop_location}, West Bengal, India`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation /> Navigate to {ride.status === "accepted" ? "pickup" : "drop"}
                  </a>
                </Button>
              )}
              {!isTraveler && ride.status === "accepted" && (
                <Button size="lg" variant="accent" loading={busy} onClick={() => changeStatus("ongoing")}>
                  Start trip
                </Button>
              )}
              {isTraveler && (ride.status === "completed" || ride.status === "cancelled") && (
                <Button asChild size="lg">
                  <Link
                    href={{
                      pathname: "/traveler",
                      query: { pickup: ride.pickup_location, drop: ride.drop_location, vehicle: ride.vehicle_type },
                    }}
                  >
                    <RotateCw /> Book again
                  </Link>
                </Button>
              )}
              {!isTraveler && ride.status === "ongoing" && (
                <Button size="lg" variant="accent" loading={busy} onClick={() => changeStatus("completed")}>
                  Complete trip · collect {formatINR(Number(ride.fare))}
                </Button>
              )}
              {isTraveler && (ride.status === "pending" || ride.status === "accepted") && (
                <Button
                  variant="outline"
                  loading={busy}
                  onClick={() => changeStatus("cancelled", "Cancel this ride?")}
                >
                  Cancel ride
                </Button>
              )}
              {!isTraveler && ride.status === "accepted" && (
                <Button
                  variant="outline"
                  loading={busy}
                  onClick={() => changeStatus("cancelled", "Release this ride so another driver can take it?")}
                >
                  Can&apos;t make it · release ride
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {counterpart && (
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/15 text-lg font-black text-primary">
                {counterpart.full_name.slice(0, 1).toUpperCase() || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{counterpart.full_name || "Unnamed"}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {isTraveler && vehicle
                    ? `${vehicle.vehicle_type === "cab" ? "Cab" : "Toto"} · ${vehicle.vehicle_number}${vehicle.model ? ` · ${vehicle.model}` : ""}`
                    : isTraveler
                      ? "Your driver"
                      : "Traveler"}
                </p>
              </div>
              {counterpart.phone_number && (
                <Button asChild variant="accent" size="icon" aria-label={`Call ${counterpart.full_name}`}>
                  <a href={`tel:${counterpart.phone_number}`}>
                    <Phone />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid content-start gap-4">
        <RouteMap from={route.from} to={route.to} caption={`${ride.distance_km} km · guide line, not the exact road`} />
        {(chatOpen || initialMessages.length > 0 || ride.driver_id) && (
          <ChatPanel
            rideId={ride.id}
            meId={me.id}
            otherName={otherName}
            initialMessages={initialMessages}
            canSend={chatOpen}
            disabledReason={ride.status === "completed" || ride.status === "cancelled" ? "This ride has ended" : "Chat opens once a driver accepts"}
          />
        )}
      </div>
    </div>
  );
}
