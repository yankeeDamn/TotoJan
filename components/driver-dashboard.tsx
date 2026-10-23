"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CalendarClock, CarTaxiFront, IndianRupee, Navigation, Power, Timer, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { RideStatusBadge, VehicleIcon } from "@/components/ride-status";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import type { Profile, Ride, Vehicle, VehicleType } from "@/lib/types";

/** Seconds a driver has to accept a live request before it drops off their screen. */
const REQUEST_SECONDS = 30;

const istDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);

const navigateUrl = (place: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, West Bengal, India`)}`;

interface Props {
  profile: Profile;
  initialVehicle: Vehicle | null;
}

export function DriverDashboard({ profile, initialVehicle }: Props) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(initialVehicle);
  const [open, setOpen] = useState<Ride[]>([]);
  const [active, setActive] = useState<Ride[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, total: 0, trips: 0 });
  const [loaded, setLoaded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());

  // When each live request first appeared on this screen (drives the countdown).
  const seenAt = useRef<Map<string, number>>(new Map());
  const knownIds = useRef<Set<string> | null>(null);

  const online = Boolean(vehicle?.is_active);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const [openRes, activeRes, doneRes] = await Promise.all([
      supabase.from("rides").select("*").eq("status", "pending").is("driver_id", null).order("created_at", { ascending: true }),
      supabase
        .from("rides")
        .select("*")
        .eq("driver_id", profile.id)
        .in("status", ["accepted", "ongoing"])
        .order("created_at", { ascending: true }),
      supabase.from("rides").select("fare, updated_at").eq("driver_id", profile.id).eq("status", "completed"),
    ]);

    const openRides = ((openRes.data as Ride[] | null) ?? []).filter(
      (r) => !vehicle || r.vehicle_type === vehicle.vehicle_type,
    );

    // Announce requests that arrived since the last refresh (not the first load).
    const ids = new Set(openRides.map((r) => r.id));
    if (knownIds.current && vehicle?.is_active) {
      const fresh = openRides.filter((r) => !knownIds.current!.has(r.id));
      for (const r of fresh) {
        toast(r.booking_type === "live" ? "New ride request!" : "New advance booking", {
          description: `${r.pickup_location} → ${r.drop_location} · ${formatINR(Number(r.fare))}`,
        });
      }
    }
    knownIds.current = ids;

    setOpen(openRides);
    setActive((activeRes.data as Ride[] | null) ?? []);

    const done = (doneRes.data as { fare: number; updated_at: string }[] | null) ?? [];
    const today = istDay(new Date());
    setEarnings({
      trips: done.length,
      total: done.reduce((s, r) => s + Number(r.fare), 0),
      today: done.filter((r) => istDay(new Date(r.updated_at)) === today).reduce((s, r) => s + Number(r.fare), 0),
    });
    setLoaded(true);
  }, [profile.id, vehicle]);

  // Realtime: any change to a ride this driver can see triggers a refresh. A slow poll is the safety net.
  useEffect(() => {
    refresh();
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const debounced = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    };

    const channel = supabase
      .channel("driver-rides")
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, debounced)
      .subscribe();
    const poll = setInterval(refresh, 45_000);

    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // One-second clock for countdowns, only while there is something to count down.
  const hasLive = online && open.some((r) => r.booking_type === "live");
  useEffect(() => {
    if (!hasLive) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasLive]);

  async function toggleOnline() {
    if (!vehicle) return;
    setToggling(true);
    const next = !vehicle.is_active;
    const { data, error } = await createClient()
      .from("vehicles")
      .update({ is_active: next })
      .eq("id", vehicle.id)
      .select()
      .single();
    setToggling(false);
    if (error) return toast.error("Could not change your status. Try again.");

    seenAt.current.clear();
    setVehicle(data as Vehicle);
    toast.success(next ? "You're online. Requests will appear here." : "You're offline.");
  }

  async function accept(ride: Ride) {
    setAcceptingId(ride.id);
    const { error } = await createClient().rpc("accept_ride", { p_ride: ride.id });
    setAcceptingId(null);
    if (error) {
      toast.error(error.message);
      refresh();
      return;
    }
    toast.success("Ride accepted!");
    router.push(`/rides/${ride.id}`);
  }

  const decline = (id: string) => setDeclined((prev) => new Set(prev).add(id));

  if (!vehicle) {
    return <VehicleSetup onSaved={setVehicle} />;
  }

  // Start the countdown the first time a live request is on screen while online.
  const liveRequests = open
    .filter((r) => r.booking_type === "live" && !declined.has(r.id))
    .map((r) => {
      if (!seenAt.current.has(r.id)) seenAt.current.set(r.id, Date.now());
      const elapsed = (now - seenAt.current.get(r.id)!) / 1000;
      return { ride: r, secondsLeft: Math.max(0, Math.ceil(REQUEST_SECONDS - elapsed)) };
    })
    .filter((x) => x.secondsLeft > 0);

  const advance = open.filter((r) => r.booking_type === "scheduled" && !declined.has(r.id));

  return (
    <div className="grid gap-4">
      <Card className={cn("overflow-hidden", online && "border-accent")}>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">{profile.full_name || "Driver"}</p>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <VehicleIcon type={vehicle.vehicle_type} className="size-4" />
              <span className="capitalize">{vehicle.vehicle_type}</span> · {vehicle.vehicle_number}
            </p>
          </div>
          <Button
            size="lg"
            variant={online ? "accent" : "outline"}
            loading={toggling}
            onClick={toggleOnline}
            aria-pressed={online}
            className="shrink-0"
          >
            {!toggling && <Power />}
            {online ? "Online" : "Go online"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<IndianRupee />} label="Today" value={formatINR(earnings.today)} />
        <Stat icon={<Wallet />} label="Total" value={formatINR(earnings.total)} />
        <Stat icon={<Zap />} label="Trips" value={String(earnings.trips)} />
      </div>

      {active.length > 0 && (
        <section aria-labelledby="active" className="grid gap-3">
          <h2 id="active" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Your current rides
          </h2>
          {active.map((r) => (
            <Card key={r.id} className="border-accent">
              <CardContent className="grid gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold">
                    {r.pickup_location} → {r.drop_location}
                  </p>
                  <RideStatusBadge status={r.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatINR(Number(r.fare))} · {Number(r.distance_km)} km
                  {r.scheduled_for ? ` · ${formatDateTime(r.scheduled_for)}` : ""}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <a href={navigateUrl(r.pickup_location)} target="_blank" rel="noopener noreferrer">
                      <Navigation /> Navigate
                    </a>
                  </Button>
                  <Button asChild>
                    <Link href={`/rides/${r.id}`}>
                      Open <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section aria-labelledby="requests" className="grid gap-3">
        <h2 id="requests" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Ride requests
        </h2>

        {!online ? (
          <EmptyState title="You're offline" text="Go online to start receiving live ride requests." />
        ) : !loaded ? (
          <p className="text-sm text-muted-foreground">Loading requests…</p>
        ) : liveRequests.length === 0 ? (
          <EmptyState title="Waiting for requests" text="New rides show up here the moment a traveler books." pulse />
        ) : (
          liveRequests.map(({ ride, secondsLeft }) => (
            <RequestCard
              key={ride.id}
              ride={ride}
              secondsLeft={secondsLeft}
              accepting={acceptingId === ride.id}
              onAccept={() => accept(ride)}
              onDecline={() => decline(ride.id)}
            />
          ))
        )}
      </section>

      {online && advance.length > 0 && (
        <section aria-labelledby="advance" className="grid gap-3">
          <h2 id="advance" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Advance bookings
          </h2>
          {advance.map((r) => (
            <RequestCard
              key={r.id}
              ride={r}
              accepting={acceptingId === r.id}
              onAccept={() => accept(r)}
              onDecline={() => decline(r.id)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="grid gap-1 p-4 [&_svg]:size-4 [&_svg]:text-primary">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-black leading-none">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, text, pulse }: { title: string; text: string; pulse?: boolean }) {
  return (
    <div className="grid gap-1 rounded-2xl border-2 border-dashed p-8 text-center">
      {pulse && <span className="mx-auto mb-2 size-3 animate-ping rounded-full bg-accent" aria-hidden />}
      <p className="font-bold">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function RequestCard({
  ride,
  secondsLeft,
  accepting,
  onAccept,
  onDecline,
}: {
  ride: Ride;
  secondsLeft?: number;
  accepting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const live = secondsLeft !== undefined;
  return (
    <Card className="overflow-hidden border-primary/40 shadow-soft">
      {live && (
        <div className="h-1.5 bg-muted" aria-hidden>
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${(secondsLeft / REQUEST_SECONDS) * 100}%` }}
          />
        </div>
      )}
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-base">
            {ride.pickup_location} → {ride.drop_location}
          </CardTitle>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span>{Number(ride.distance_km)} km</span>
            {ride.scheduled_for && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" aria-hidden /> {formatDateTime(ride.scheduled_for)}
              </span>
            )}
            {Number(ride.demand_multiplier) > 1 && <span>×{Number(ride.demand_multiplier).toFixed(2)} demand</span>}
          </p>
        </div>
        <p className="shrink-0 text-2xl font-black text-primary">{formatINR(Number(ride.fare))}</p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {live && (
          <p className="flex items-center gap-1.5 text-sm font-semibold" aria-live="off">
            <Timer className="size-4 text-primary" aria-hidden /> {secondsLeft}s left to accept
          </p>
        )}
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button variant="outline" size="lg" onClick={onDecline} disabled={accepting}>
            Decline
          </Button>
          <Button size="lg" onClick={onAccept} loading={accepting}>
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VehicleSetup({ onSaved }: { onSaved: (v: Vehicle) => void }) {
  const [type, setType] = useState<VehicleType>("toto");
  const [number, setNumber] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!number.trim()) return toast.error("Enter your vehicle number.");

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        driver_id: user?.id,
        vehicle_type: type,
        vehicle_number: number.trim().toUpperCase(),
        model: model.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (error) return toast.error("Could not save your vehicle. Please try again.");
    onSaved(data as Vehicle);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add your vehicle</CardTitle>
        <p className="text-sm text-muted-foreground">We need this before you can go online and accept rides.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4">
          <Segmented<VehicleType>
            label="Vehicle type"
            value={type}
            onChange={setType}
            options={[
              { value: "toto", label: "Toto", icon: <Zap /> },
              { value: "cab", label: "Cab", icon: <CarTaxiFront /> },
            ]}
          />
          <div>
            <Label htmlFor="v-number">Vehicle number</Label>
            <Input id="v-number" className="uppercase" placeholder="WB 56 T 1234" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="v-model">Model (optional)</Label>
            <Input id="v-model" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <Button type="submit" size="lg" loading={saving}>
            Save vehicle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
