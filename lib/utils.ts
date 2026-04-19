import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

import type { BookingStatus, ServiceType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  return format(new Date(value), "dd MMM yyyy, hh:mm a");
}

export function createOrderNumber() {
  return `RHT-${Date.now().toString().slice(-6)}`;
}

export function getStatusTone(status: BookingStatus) {
  switch (status) {
    case "completed":
      return "bg-accent-100 text-accent-800 border-accent-200";
    case "cancelled":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getServiceLabel(serviceType: ServiceType) {
  switch (serviceType) {
    case "travel":
      return "Passenger travel";
    case "transport":
      return "Market transport";
    case "delivery":
      return "Parcel delivery";
  }
}

export function decimalToNumber(value: { toNumber(): number } | number | null | undefined) {
  if (value == null) {
    return null;
  }

  return typeof value === "number" ? value : value.toNumber();
}