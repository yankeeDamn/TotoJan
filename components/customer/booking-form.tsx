"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { bookingSchema } from "@/lib/validations";
import type { BookingFormValues, LocalityOption } from "@/types";

type BookingFormProps = {
  localities: LocalityOption[];
};

type FareResponse = {
  fare: number;
  band: string;
  distanceKm: number;
};

export function BookingForm({ localities }: BookingFormProps) {
  const router = useRouter();
  const [fare, setFare] = useState<FareResponse | null>(null);
  const [fareError, setFareError] = useState<string | null>(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceType: "travel",
      bookingTime: "now",
      priority: false,
    },
  });

  const serviceType = watch("serviceType");
  const pickupLocality = watch("pickupLocality");
  const dropLocality = watch("dropLocality");
  const priority = watch("priority");
  const bookingTime = watch("bookingTime");

  useEffect(() => {
    if (!pickupLocality || !dropLocality) {
      setFare(null);
      setFareError(null);
      return;
    }

    let active = true;
    setFareLoading(true);
    setFareError(null);

    fetch("/api/fare-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType, pickupLocality, dropLocality, priority }),
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not estimate fare");
        }

        if (active) {
          setFare(payload.data);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setFare(null);
          setFareError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setFareLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [dropLocality, pickupLocality, priority, serviceType]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setSubmitError(payload.error ?? "Booking failed. Please try again.");
      return;
    }

    router.push(`/booking/confirm?orderId=${payload.data.orderNumber}`);
  });

  const showGoodsField = serviceType === "transport" || serviceType === "delivery";

  return (
    <Card className="p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl">Book Your TOTO</CardTitle>
          <CardDescription className="mt-2">Travel, market transport, or small delivery inside Rampurhat in a few taps.</CardDescription>
        </div>
        <div className="hidden rounded-full bg-brand-50 p-3 text-brand-600 sm:block">
          <MapPinned className="h-6 w-6" />
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" error={errors.customerName?.message}>
            <Input placeholder="Enter full name" {...register("customerName")} />
          </Field>
          <Field label="Phone number" error={errors.phone?.message}>
            <Input placeholder="10-digit mobile number" {...register("phone")} />
          </Field>
        </div>

        <Field label="Service type" error={errors.serviceType?.message}>
          <Select {...register("serviceType")}>
            <option value="travel">Passenger travel</option>
            <option value="transport">Market / goods transport</option>
            <option value="delivery">Small parcel / electronics delivery</option>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup locality" error={errors.pickupLocality?.message}>
            <Select defaultValue="" {...register("pickupLocality")}>
              <option value="" disabled>
                Select locality
              </option>
              {localities.map((locality) => (
                <option key={locality.name} value={locality.name}>
                  {locality.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Drop locality" error={errors.dropLocality?.message}>
            <Select defaultValue="" {...register("dropLocality")}>
              <option value="" disabled>
                Select locality
              </option>
              {localities.map((locality) => (
                <option key={locality.name} value={locality.name}>
                  {locality.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup details" error={errors.pickupAddress?.message}>
            <Input placeholder="Landmark, lane, building" {...register("pickupAddress")} />
          </Field>
          <Field label="Drop details" error={errors.dropAddress?.message}>
            <Input placeholder="Landmark, lane, building" {...register("dropAddress")} />
          </Field>
        </div>

        {showGoodsField ? (
          <Field label="Goods / parcel details" error={errors.goodsDetails?.message}>
            <Textarea placeholder="Items, weight, fragile note" {...register("goodsDetails")} />
          </Field>
        ) : null}

        <Field label="Additional note" error={errors.specialNote?.message}>
          <Textarea placeholder="Optional instructions for the driver" {...register("specialNote")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Field label="Booking time" error={errors.bookingTime?.message}>
            <Select {...register("bookingTime")}>
              <option value="now">Now</option>
              <option value="schedule">Schedule later</option>
            </Select>
          </Field>
          {bookingTime === "schedule" ? (
            <Field label="Scheduled for" error={errors.scheduledAt?.message}>
              <Input type="datetime-local" min={new Date().toISOString().slice(0, 16)} {...register("scheduledAt")} />
            </Field>
          ) : (
            <Card className="border-dashed p-4">
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-accent-600" />
                <p>Pay by cash or UPI after trip completion. No advance payment in the MVP.</p>
              </div>
            </Card>
          )}
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input className="h-4 w-4 accent-brand-500" type="checkbox" {...register("priority")} />
          Priority pickup for urgent bookings
        </label>

        <Card className="bg-ink p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Estimated fare</p>
              <p className="mt-2 text-3xl font-bold">{fare ? formatCurrency(fare.fare) : "Select route"}</p>
              <p className="mt-2 text-sm text-white/75">
                {fare ? `${fare.distanceKm} km • ${fare.band} distance band` : "Fare updates automatically after pickup and drop are selected."}
              </p>
            </div>
            <Sparkles className="h-6 w-6 text-brand-200" />
          </div>
          {fareLoading ? <p className="mt-3 text-sm text-white/75">Updating fare estimate...</p> : null}
          {fareError ? <p className="mt-3 text-sm text-rose-200">{fareError}</p> : null}
        </Card>

        {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}

        <Button className="w-full" size="lg" type="submit" disabled={isSubmitting || fareLoading}>
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirm booking
            </span>
          ) : (
            "Confirm booking"
          )}
        </Button>
      </form>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}