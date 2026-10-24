import { AVG_SPEED_KMPH, CORRIDOR_DISTANCE_KM } from "@/lib/routes";
import type { MarketStats, VehicleType } from "@/lib/types";

/**
 * Dynamic pricing engine.
 *
 *   fare = round5( max(minFare, base + perKm * distance) * multiplier )
 *   multiplier = min(MAX_MULTIPLIER, product of all active factors)
 *
 * This module is pure and shared: the booking screen uses it for the live estimate and the
 * /api/rides route re-runs it on the server so the stored fare cannot be chosen by the client.
 */

export const RATES: Record<VehicleType, { base: number; perKm: number; minFare: number }> = {
  toto: { base: 30, perKm: 12, minFare: 40 },
  cab: { base: 70, perKm: 18, minFare: 120 },
};

/** Never charge more than 2x the base fare, however busy it gets. Keeps pricing trustworthy. */
export const MAX_MULTIPLIER = 2;

/**
 * Festival / special days (IST calendar dates, yyyy-mm-dd) that attract pilgrim crowds.
 * Amavasya (new moon) days are detected automatically below; add other dates here.
 */
export const FESTIVAL_DAYS: { date: string; label: string }[] = [
  { date: "2026-11-08", label: "Kali Puja" },
];

export interface FareFactor {
  key: string;
  label: string;
  multiplier: number;
}

export interface FareEstimate {
  distanceKm: number;
  etaMinutes: number;
  baseFare: number;
  multiplier: number;
  fare: number;
  factors: FareFactor[];
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Shifts a timestamp so that the UTC getters return Indian Standard Time values. */
function toIst(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

const SYNODIC_MONTH_DAYS = 29.530588853;
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14); // a known new moon

/**
 * Approximate Amavasya check from the mean lunar cycle. Real tithi timings drift by up to
 * ~half a day, so we treat the day before, of and after the new moon as Amavasya rush.
 */
export function isAmavasyaWindow(date: Date) {
  const days = (date.getTime() - REFERENCE_NEW_MOON_MS) / 86_400_000;
  const age = ((days % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  return age < 1 || age > SYNODIC_MONTH_DAYS - 1;
}

export function getFestivalLabel(date: Date): string | null {
  const ist = toIst(date).toISOString().slice(0, 10);
  return FESTIVAL_DAYS.find((f) => f.date === ist)?.label ?? null;
}

export function getFareFactors(when: Date, stats: MarketStats): FareFactor[] {
  const factors: FareFactor[] = [];
  const ist = toIst(when);
  const hour = ist.getUTCHours();
  const weekday = ist.getUTCDay(); // 0 = Sunday

  // Occasion: festival beats Amavasya, they do not stack.
  const festival = getFestivalLabel(when);
  if (festival) {
    factors.push({ key: "festival", label: `${festival} rush`, multiplier: 1.35 });
  } else if (isAmavasyaWindow(when)) {
    factors.push({ key: "amavasya", label: "Amavasya pilgrim rush", multiplier: 1.3 });
  }

  if (hour >= 22 || hour < 5) {
    factors.push({ key: "late-night", label: "Late-night ride", multiplier: 1.25 });
  } else if ((hour >= 5 && hour < 9) || (hour >= 17 && hour < 20)) {
    factors.push({ key: "peak-hours", label: "Peak hours", multiplier: 1.1 });
  }

  if (weekday === 0 || weekday === 6) {
    factors.push({ key: "weekend", label: "Weekend", multiplier: 1.05 });
  }

  // Live supply vs. demand: only surge when open requests outnumber drivers online.
  if (stats.onlineDrivers > 0 && stats.pendingRides > stats.onlineDrivers) {
    const ratio = stats.pendingRides / stats.onlineDrivers;
    const surge = 1 + Math.min(0.4, (ratio - 1) * 0.15);
    factors.push({ key: "demand", label: "High demand right now", multiplier: Math.round(surge * 100) / 100 });
  }

  return factors;
}

const roundTo5 = (n: number) => Math.round(n / 5) * 5;

export function estimateFare(opts: {
  vehicleType: VehicleType;
  when: Date;
  stats: MarketStats;
  distanceKm?: number;
}): FareEstimate {
  const distanceKm = opts.distanceKm ?? CORRIDOR_DISTANCE_KM;
  const rate = RATES[opts.vehicleType];
  const baseFare = roundTo5(Math.max(rate.minFare, rate.base + rate.perKm * distanceKm));

  const factors = getFareFactors(opts.when, opts.stats);
  const raw = factors.reduce((acc, f) => acc * f.multiplier, 1);
  const multiplier = Math.round(Math.min(MAX_MULTIPLIER, raw) * 100) / 100;

  const etaMinutes = Math.max(5, Math.round((distanceKm / AVG_SPEED_KMPH[opts.vehicleType]) * 60));

  return {
    distanceKm,
    etaMinutes,
    baseFare,
    multiplier,
    fare: roundTo5(baseFare * multiplier),
    factors,
  };
}
