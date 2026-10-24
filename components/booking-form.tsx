"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownUp, CalendarClock, CarTaxiFront, Clock, Info, Route as RouteIcon, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { RouteMap } from "@/components/route-map";
import { estimateFare } from "@/lib/pricing";
import { PRESET_ROUTES, type Place } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn, formatINR, toLocalInputValue } from "@/lib/utils";
import type { BookingType, MarketStats, VehicleType } from "@/lib/types";

const NO_PRESSURE: MarketStats = { onlineDrivers: 0, pendingRides: 0 };

export function BookingForm() {
  const router = useRouter();

  const [routeId, setRouteId] = useState<string>(PRESET_ROUTES[0].id);
  const [pickup, setPickup] = useState(PRESET_ROUTES[0].from.name);
  const [drop, setDrop] = useState(PRESET_ROUTES[0].to.name);
  const [vehicleType, setVehicleType] = useState<VehicleType>("toto");
  const [bookingType, setBookingType] = useState<BookingType>("live");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [stats, setStats] = useState<MarketStats>(NO_PRESSURE);
  const [submitting, setSubmitting] = useState(false);

  // Which end of the corridor the map should show. Custom text keeps the last chosen preset.
  const route = PRESET_ROUTES.find((r) => r.id === routeId) ?? PRESET_ROUTES[0];
  const mapFrom: Place = route.from;
  const mapTo: Place = route.to;

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

  const minLocal = useMemo(() => toLocalInputValue(new Date(Date.now() + 30 * 60_000)), []);

  const scheduledDate = scheduledLocal ? new Date(scheduledLocal) : null;
  const scheduledValid = scheduledDate !== null && !Number.isNaN(scheduledDate.getTime());

  const estimate = useMemo(() => {
    const when = bookingType === "scheduled" && scheduledValid ? scheduledDate! : new Date();
    return estimateFare({ vehicleType, when, stats: bookingType === "live" ? stats : NO_PRESSURE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, bookingType, scheduledLocal, scheduledValid, stats]);

  function applyPreset(id: string) {
    const r = PRESET_ROUTES.find((p) => p.id === id);
    if (!r) return;
    setRouteId(id);
    setPickup(r.from.name);
    setDrop(r.to.name);
  }

  function swap() {
    const matching = PRESET_ROUTES.find((r) => r.id !== routeId);
    setPickup(drop);
    setDrop(pickup);
    if (matching) setRouteId(matching.id);
  }

  async function book() {
    if (pickup.trim().length < 2 || drop.trim().length < 2) return toast.error("Enter pickup and drop locations.");
    if (bookingType === "scheduled" && !scheduledValid) return toast.error("Choose a date and time for your ride.");
    if (bookingType === "scheduled" && scheduledDate!.getTime() < Date.now() + 15 * 60_000) {
      return toast.error("Pick a time at least 15 minutes from now.");
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
    });
    const body = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) return toast.error(body.error ?? "Could not book the ride. Please try again.");

    toast.success(bookingType === "live" ? "Looking for a driver near you…" : "Ride scheduled!");
    router.push(`/rides/${body.id}`);
  }

  const noDrivers = bookingType === "live" && stats.onlineDrivers === 0;

  return (
    <div className="grid gap-4 pb-28 lg:grid-cols-[1fr_380px] lg:pb-0">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="size-5 text-primary" aria-hidden /> Where to?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick routes">
              {PRESET_ROUTES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => applyPreset(r.id)}
                  className={cn(
                    "h-12 rounded-full border-2 px-4 text-sm font-bold transition-colors",
                    routeId === r.id && pickup === r.from.name && drop === r.to.name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              <div>
                <Label htmlFor="pickup">Pickup</Label>
                <Input id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Landmark or address" />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={swap} className="mx-auto -my-1">
                <ArrowDownUp /> Swap
              </Button>
              <div>
                <Label htmlFor="drop">Drop</Label>
                <Input id="drop" value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="Landmark or address" />
              </div>
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
              <div>
                <Label htmlFor="when">Pickup date &amp; time</Label>
                <Input
                  id="when"
                  type="datetime-local"
                  min={minLocal}
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                />
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
          from={mapFrom}
          to={mapTo}
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
              <p className="text-5xl font-black tracking-tight text-primary">{formatINR(estimate.fare)}</p>
              <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" aria-hidden /> ~{estimate.etaMinutes} min
                </span>
                <span>{estimate.distanceKm} km</span>
              </p>
            </div>

            <dl className="grid gap-1.5 rounded-xl bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Base fare</dt>
                <dd className="font-semibold">{formatINR(estimate.baseFare)}</dd>
              </div>
              {estimate.factors.map((f) => (
                <div key={f.key} className="flex justify-between">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="size-3.5 text-primary" aria-hidden /> {f.label}
                  </dt>
                  <dd className="font-semibold">×{f.multiplier.toFixed(2)}</dd>
                </div>
              ))}
              {estimate.factors.length === 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Demand</dt>
                  <dd className="font-semibold text-accent">Normal</dd>
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
            <p className="text-xs text-muted-foreground">
              Final fare is confirmed when you book and paid to the driver. Prices never exceed 2× the base fare.
            </p>
          </CardContent>
        </Card>
      </aside>

      {/* Sticky booking bar keeps the primary action one tap away on phones. */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:static lg:col-start-1 lg:border-0 lg:bg-transparent lg:p-0">
        <div className="container flex items-center gap-3 lg:px-0">
          <div className="lg:hidden">
            <p className="text-xs text-muted-foreground">Estimated</p>
            <p className="text-2xl font-black leading-none">{formatINR(estimate.fare)}</p>
          </div>
          <Button size="lg" className="flex-1" onClick={book} loading={submitting}>
            {bookingType === "live" ? "Book ride now" : "Schedule ride"}
          </Button>
        </div>
      </div>
    </div>
  );
}
