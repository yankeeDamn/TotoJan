import Link from "next/link";
import { CalendarClock, CarTaxiFront, ChevronRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { Ride, RideStatus } from "@/lib/types";

export const STATUS_LABEL: Record<RideStatus, string> = {
  pending: "Finding driver",
  accepted: "Driver on the way",
  ongoing: "On trip",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<RideStatus, "default" | "success" | "muted" | "destructive"> = {
  pending: "default",
  accepted: "success",
  ongoing: "success",
  completed: "muted",
  cancelled: "destructive",
};

export function RideStatusBadge({ status, scheduled }: { status: RideStatus; scheduled?: boolean }) {
  const label = status === "pending" && scheduled ? "Awaiting driver" : STATUS_LABEL[status];
  return <Badge variant={STATUS_VARIANT[status]}>{label}</Badge>;
}

export function VehicleIcon({ type, className }: { type: "toto" | "cab"; className?: string }) {
  return type === "cab" ? <CarTaxiFront className={className} aria-hidden /> : <Zap className={className} aria-hidden />;
}

/** One row in a list of rides. Links to the shared ride screen. */
export function RideCard({ ride }: { ride: Ride }) {
  const scheduled = ride.booking_type === "scheduled";
  return (
    <Link
      href={`/rides/${ride.id}`}
      className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        <VehicleIcon type={ride.vehicle_type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {ride.pickup_location} → {ride.drop_location}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {scheduled && ride.scheduled_for ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden /> {formatDateTime(ride.scheduled_for)}
            </span>
          ) : (
            <span>{formatDateTime(ride.created_at)}</span>
          )}
          <span aria-hidden>·</span>
          <span className="font-semibold text-foreground">{formatINR(Number(ride.fare))}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <RideStatusBadge status={ride.status} scheduled={scheduled} />
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </div>
    </Link>
  );
}
