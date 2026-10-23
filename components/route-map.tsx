"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/routes";

// Leaflet touches `window`, so it only loads in the browser.
const RouteMapInner = dynamic(() => import("@/components/route-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-muted text-muted-foreground">
      <Loader2 className="animate-spin" aria-label="Loading map" />
    </div>
  ),
});

export function RouteMap({
  from,
  to,
  className,
  caption,
}: {
  from: Place;
  to: Place;
  className?: string;
  caption?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border", className)}>
      <div className="h-56 sm:h-64">
        <RouteMapInner from={from} to={to} />
      </div>
      {caption && <p className="border-t bg-card px-3 py-2 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}
