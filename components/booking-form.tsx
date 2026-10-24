"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownUp,
  CalendarClock,
  CarTaxiFront,
  Clock,
  Info,
  Lock,
  Route as RouteIcon,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { RouteMap } from "@/components/route-map";
import { estimateFare } from "@/lib/pricing";
import { LANDMARKS, PRESET_ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDateTime, formatINR, toLocalInputValue } from "@/lib/utils";
import type { BookingType, MarketStats, VehicleType } from "@/lib/types";

const NO_PRESSURE: MarketStats = { onlineDrivers: 0, pendingRides: 0 };

interface BookingFormProps {
  /** Prefill, used by "Book again". */
  initialPickup?: string;
  initialDrop?: string;
  initialVehicle?: VehicleType;
}

function demandLevel(multiplier: number) {
  if (multiplier <= 1.05) return { label: "Normal", tone: "text-accent", bar: "bg-accent", filled: 1 };
  if (multiplier <= 1.3) return { label: "Busy", tone: "text-primary", bar: "bg-primary", filled: 2 };
  return { label: "Very busy", tone: "text-destructive", bar: "bg-destructive", filled: 3 };
}

export function BookingForm({ initialPickup, initialDrop, initialVehicle }: BookingFormProps) {
  const router = useRouter();

  const [pickup, setPickup] = useState(initialPickup || PRESET_ROUTES[0].from.name);
  const [drop, setDrop] = useState(initialDrop || PRESET_ROUTES[0].to.name);
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialVehicle ?? "toto");
  const [bookingType, setBookingType] = useState<BookingType>("live");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [stats, setStats] = useState<MarketStats>(NO_PRESSURE);
  const [now, setNow] = useState(() => new Date());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Keep the clock fresh so the estimate reacts when the hour (and its surge factor) changes.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Poll live supply/demand so the estimate reflects the current rush.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase.rpc("market_stats");
      const row = Array.isArray(data) ? data[0] : data;
      if (!cancelled && row) setStats({ onlineDrivers: row.online_drivers ?? 0, pendingRides: row.pending_rides ?? 0 });
    }

    load();
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Which end of the corridor the map shows: starts at Tarapith -> temple-to-station.
  const route = pickup.toLowerCase().includes("tarapith") && !drop.toLowerCase().includes("tarapith") ? PRESET_ROUTES[1] : PRESET_ROUTES[0];

  const minLocal = useMemo(() => toLocalInputValue(new Date(Date.now() + 30 * 60_000)), []);
  const scheduledDate = scheduledLocal ? new Date(scheduledLocal) : null;
  const scheduledValid = scheduledDate !== null && !Number.isNaN(scheduledDate.getTime());
  const scheduledTooSoon = scheduledValid && scheduledDate!.getTime() < Date.now() + 15 * 60_000;

  const needsTime = bookingType === "scheduled" && !scheduledValid;
  const estimate = useMemo(() => {
    const when = bookingType === "scheduled" && scheduledValid ? scheduledDate! : now;
    return estimateFare({ vehicleType, when, stats: bookingType === "live" ? stats : NO_PRESSURE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, bookingType, scheduledLocal, scheduledValid, stats, now]);

  const level = demandLevel(estimate.multiplier);

  const errors = {
    pickup: pickup.trim().length < 2 ? "Enter where we should pick you up." : "",
    drop: drop.trim().length < 2 ? "Enter where you are going." : "",
    sameSpot: pickup.trim() && pickup.trim().toLowerCase() === drop.trim().toLowerCase() ? "Pickup and drop can't be the same." : "",
    when: needsTime ? "Choose a date and time." : scheduledTooSoon ? "Pick a time at least 15 minutes from now." : "",
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function applyPreset(index: number) {
    setPickup(PRESET_ROUTES[index].from.name);
    setDrop(PRESET_ROUTES[index].to.name);
  }

  function swap() {
    setPickup(drop);
    setDrop(pickup);
  }

  async function book() {
    setSubmitted(true);
    if (hasErrors) {
      toast.error(errors.pickup || errors.drop || errors.sameSpot || errors.when);
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup: pickup.trim(),
        drop: drop.trim(),
        vehicleType,
        bookingType,
        scheduledFor: bookingType === "scheduled" ? scheduledDate!.toISOString() : undefined,
      }),
    }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    setSubmitting(false);

    if (!res) return toast.error("No connection. Check your internet and try again.");
    if (!res.ok) return toast.error(body?.error ?? "Could not book the ride. Please try again.");

    toast.success(bookingType === "live" ? "Looking for a driver near you…" : "Ride scheduled!");
    router.push(`/rides/${body.id}`);
  }

  const noDrivers = bookingType === "live" && stats.onlineDrivers === 0;
  const bookLabel = bookingType === "live" ? `Book ${vehicleType === "cab" ? "cab" : "Toto"} now` : "Schedule ride";

  return (
    <div className="grid gap-4 pb-28 lg:grid-cols-[1fr_380px] lg:pb-0">
      <div className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="size-5 text-primary" aria-hidden /> Where to?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick routes">
              {PRESET_ROUTES.map((r, i) => {
                const selected = pickup === r.from.name && drop === r.to.name;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => applyPreset(i)}
                    aria-pressed={selected}
                    className={cn(
                      "h-12 rounded-full border-2 px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted",
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3">
              <div>
                <Label htmlFor="pickup">Pickup</Label>
                <Input
                  id="pickup"
                  list="landmarks"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Landmark or address"
                  maxLength={200}
                  aria-invalid={submitted && Boolean(errors.pickup)}
                  aria-describedby="pickup-error"
                />
                <FieldError id="pickup-error" message={submitted ? errors.pickup : ""} />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={swap} className="mx-auto -my-1">
                <ArrowDownUp /> Swap
              </Button>
              <div>
                <Label htmlFor="drop">Drop</Label>
                <Input
                  id="drop"
                  list="landmarks"
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  placeholder="Landmark or address"
                  maxLength={200}
                  aria-invalid={submitted && Boolean(errors.drop || errors.sameSpot)}
                  aria-describedby="drop-error"
                />
                <FieldError id="drop-error" message={submitted ? errors.drop || errors.sameSpot : ""} />
              </div>
              <datalist id="landmarks">
                {LANDMARKS.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 p-5">
            <Segmented<BookingType>
              label="Booking type"
              value={bookingType}
              onChange={setBookingType}
              options={[
                { value: "live", label: "Ride Now", icon: <Zap /> },
                { value: "scheduled", label: "Book for Later", icon: <CalendarClock /> },
              ]}
            />
            {bookingType === "scheduled" && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="when">Pickup date &amp; time</Label>
                <Input
                  id="when"
                  type="datetime-local"
                  min={minLocal}
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                  aria-invalid={(submitted || scheduledTooSoon) && Boolean(errors.when)}
                  aria-describedby="when-error"
                />
                <FieldError id="when-error" message={submitted || scheduledTooSoon ? errors.when : ""} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Advance bookings are priced for the time you choose, and you can book up to 30 days ahead.
                </p>
              </div>
            )}
            <Segmented<VehicleType>
              label="Vehicle type"
              value={vehicleType}
              onChange={setVehicleType}
              options={[
                { value: "toto", label: "Toto", icon: <Zap /> },
                { value: "cab", label: "Cab", icon: <CarTaxiFront /> },
              ]}
            />
          </CardContent>
        </Card>

        <RouteMap
          from={route.from}
          to={route.to}
          caption="Guide line between the two ends of the route. Your driver finds the exact road."
        />
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Estimated fare</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <p key={estimate.fare} className="animate-in fade-in zoom-in-95 text-5xl font-black tracking-tight text-primary">
                {needsTime ? "—" : formatINR(estimate.fare)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" aria-hidden /> ~{estimate.etaMinutes} min
                </span>
                <span>{estimate.distanceKm} km</span>
                {bookingType === "scheduled" && scheduledValid && <span>for {formatDateTime(scheduledDate!.toISOString())}</span>}
              </p>
              {needsTime && <p className="mt-1 text-sm text-muted-foreground">Pick a date and time to see the fare.</p>}
            </div>

            <div aria-label={`Demand: ${level.label}`}>
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Demand</span>
                <span className={level.tone}>{level.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-1" aria-hidden>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={cn("h-1.5 rounded-full", n <= level.filled ? level.bar : "bg-muted")} />
                ))}
              </div>
            </div>

            <dl className="grid gap-1.5 rounded-xl bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Base fare ({estimate.distanceKm} km)</dt>
                <dd className="font-semibold">{formatINR(estimate.baseFare)}</dd>
              </div>
              {estimate.factors.map((f) => (
                <div key={f.key} className="flex justify-between gap-3">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="size-3.5 shrink-0 text-primary" aria-hidden /> {f.label}
                  </dt>
                  <dd className="font-semibold">×{f.multiplier.toFixed(2)}</dd>
                </div>
              ))}
              {estimate.factors.length === 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Demand surcharge</dt>
                  <dd className="font-semibold text-accent">None</dd>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t pt-2">
                <dt className="font-bold">Total multiplier</dt>
                <dd className="font-bold">×{estimate.multiplier.toFixed(2)}</dd>
              </div>
            </dl>

            {noDrivers && (
              <p className="flex gap-2 text-sm text-muted-foreground" role="status">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                No drivers are online right now. You can still book and one may accept shortly, or schedule for later.
              </p>
            )}
            <p className="flex gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              The fare is confirmed and locked when you book, then paid to the driver. It never exceeds 2× the base fare.
            </p>

            <Button size="lg" onClick={book} loading={submitting} className="hidden lg:inline-flex">
              {bookLabel}
            </Button>
          </CardContent>
        </Card>
      </aside>

      {/* Sticky booking bar keeps the primary action one tap away on phones. */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="container flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Estimated</p>
            <p className="text-2xl font-black leading-none">{needsTime ? "—" : formatINR(estimate.fare)}</p>
          </div>
          <Button size="lg" className="flex-1" onClick={book} loading={submitting}>
            {bookLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role={message ? "alert" : undefined} className={cn("text-sm font-semibold text-destructive", message ? "mt-1.5" : "hidden")}>
      {message}
    </p>
  );
}
