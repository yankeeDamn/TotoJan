"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/lib/routes";

interface RouteMapInnerProps {
  from: Place;
  to: Place;
}

export default function RouteMapInner({ from, to }: RouteMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const a: L.LatLngTuple = [from.lat, from.lng];
    const b: L.LatLngTuple = [to.lat, to.lng];

    // Straight guide line between the two ends (the road itself is not traced).
    L.polyline([a, b], { color: "#d9560b", weight: 5, opacity: 0.85, dashArray: "2 10", lineCap: "round" }).addTo(map);

    L.circleMarker(a, { radius: 10, color: "#fff", weight: 3, fillColor: "#d9560b", fillOpacity: 1 })
      .bindTooltip(from.short, { permanent: true, direction: "right", offset: [12, 0] })
      .addTo(map);
    L.circleMarker(b, { radius: 10, color: "#fff", weight: 3, fillColor: "#0f8a5f", fillOpacity: 1 })
      .bindTooltip(to.short, { permanent: true, direction: "right", offset: [12, 0] })
      .addTo(map);

    map.fitBounds(L.latLngBounds([a, b]), { padding: [48, 48] });

    return () => {
      map.remove();
    };
  }, [from, to]);

  return <div ref={containerRef} className="h-full w-full" role="img" aria-label={`Map from ${from.short} to ${to.short}`} />;
}
