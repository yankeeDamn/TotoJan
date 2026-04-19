import type { FareRule } from "@prisma/client";

import { DISTANCE_BANDS } from "@/constants/rampurhat";
import { findLocality } from "@/lib/service-area";
import { decimalToNumber } from "@/lib/utils";
import type { ServiceType } from "@/types";

type FareEstimateInput = {
  serviceType: ServiceType;
  pickupLocality: string;
  dropLocality: string;
  priority?: boolean;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(pickupLocality: string, dropLocality: string) {
  const pickup = findLocality(pickupLocality);
  const drop = findLocality(dropLocality);

  if (!pickup || !drop) {
    return 0;
  }

  const earthRadius = 6371;
  const latitudeDelta = toRadians(drop.latitude - pickup.latitude);
  const longitudeDelta = toRadians(drop.longitude - pickup.longitude);
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(pickup.latitude)) *
      Math.cos(toRadians(drop.latitude)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadius * c).toFixed(2));
}

export function getDistanceBand(distanceKm: number) {
  if (distanceKm <= DISTANCE_BANDS.short) {
    return "short" as const;
  }

  if (distanceKm <= DISTANCE_BANDS.medium) {
    return "medium" as const;
  }

  return "long" as const;
}

export function estimateFareFromRule(rule: FareRule, input: FareEstimateInput) {
  const distanceKm = calculateDistanceKm(input.pickupLocality, input.dropLocality);
  const band = getDistanceBand(distanceKm);

  let fare = decimalToNumber(rule.baseFare) ?? 0;

  if (band === "short") {
    fare = decimalToNumber(rule.shortDistanceFare) ?? fare;
  }

  if (band === "medium") {
    fare = decimalToNumber(rule.mediumDistanceFare) ?? fare;
  }

  if (band === "long") {
    fare = decimalToNumber(rule.longDistanceFare) ?? fare;
  }

  if (input.priority) {
    fare += decimalToNumber(rule.priorityCharge) ?? 0;
  }

  return {
    distanceKm,
    band,
    fare,
    serviceType: input.serviceType,
  };
}