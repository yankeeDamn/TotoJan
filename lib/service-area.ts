import { RAMPURHAT_CITY, RAMPURHAT_LOCALITIES } from "@/constants/rampurhat";
import type { ServiceAreaValidationResult } from "@/types";

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

export function findLocality(name: string) {
  return RAMPURHAT_LOCALITIES.find((locality) => normalizeValue(locality.name) === normalizeValue(name));
}

export function validateRampurhatServiceArea(input: {
  pickupLocality: string;
  dropLocality: string;
}): ServiceAreaValidationResult {
  const pickup = findLocality(input.pickupLocality);
  const drop = findLocality(input.dropLocality);

  if (!pickup || !drop) {
    return {
      valid: false,
      message: `Service is available only inside ${RAMPURHAT_CITY}. Please choose Rampurhat localities.`,
    };
  }

  return {
    valid: true,
    message: `Both locations are serviceable inside ${RAMPURHAT_CITY}.`,
    pickupLocality: pickup.name,
    dropLocality: drop.name,
  };
}

export function getRampurhatLocalities() {
  return RAMPURHAT_LOCALITIES;
}