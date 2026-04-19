import { Clock3, PackageCheck, ShieldCheck, Truck, Users } from "lucide-react";

import { BookingForm } from "@/components/customer/booking-form";
import { TrackBookingForm } from "@/components/customer/track-booking-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { RAMPURHAT_CITY, SERVICE_COPY } from "@/constants/rampurhat";
import { getRampurhatLocalities } from "@/lib/service-area";

const highlights = [
  {
    title: "Passenger trips",
    description: "Short local travel across Rampurhat for work, family, and daily errands.",
    icon: Users,
  },
  {
    title: "Market transport",
    description: "Move grocery bags, shop stock, or household items with a dedicated TOTO.",
    icon: Truck,
  },
  {
    title: "Parcel delivery",
    description: "Same-city delivery for electronics, medicines, and urgent small parcels.",
    icon: PackageCheck,
  },
];

export default function HomePage() {
  const localities = getRampurhatLocalities();

  return (
    <main className="pb-16 pt-6 sm:pt-8">
      <section className="px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/75 px-6 py-8 shadow-soft backdrop-blur sm:px-8 sm:py-10">
            <Badge className="border-brand-200 bg-brand-50 text-brand-700">Rampurhat only service</Badge>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">{SERVICE_COPY.shortName}</p>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-tight text-ink sm:text-6xl">
              Trusted TOTO booking for travel, market trips, and local delivery.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{SERVICE_COPY.tagline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#book-now">
                <Button size="lg" className="w-full sm:w-auto">
                  Book inside Rampurhat
                </Button>
              </a>
              <a href="#track-booking">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  Track existing booking
                </Button>
              </a>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Metric label="Local support" value={SERVICE_COPY.supportPhone} icon={ShieldCheck} />
              <Metric label="Service window" value={SERVICE_COPY.supportHours} icon={Clock3} />
              <Metric label="Coverage" value={RAMPURHAT_CITY} icon={Users} />
            </div>
          </div>

          <div id="book-now">
            <BookingForm localities={localities} />
          </div>
        </div>
      </section>

      <section className="px-4 pt-8 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-brand-100 bg-brand-900 px-6 py-6 text-white shadow-soft sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-brand-200">Important service notice</p>
              <p className="mt-2 text-lg font-semibold">Bookings are accepted only for pickup and drop locations inside Rampurhat localities.</p>
            </div>
            <p className="max-w-xl text-sm leading-6 text-brand-100">
              If either location is outside the Rampurhat service area, the system will block the booking and ask the customer to choose a supported locality.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pt-8 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Services</p>
              <h2 className="mt-2 text-3xl font-bold text-ink">Built for daily local movement</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <Card key={item.title} className="p-6">
                <div className="inline-flex rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <item.icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-5">{item.title}</CardTitle>
                <CardDescription className="mt-2">{item.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="track-booking" className="px-4 pt-8 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-white/70 bg-white/80 px-6 py-8 shadow-soft backdrop-blur sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent-700">Track by order ID</p>
              <h2 className="mt-3 text-3xl font-bold text-ink">Already booked? Check your ride or delivery status.</h2>
              <p className="mt-3 max-w-xl text-slate-600">Use the order number shared on your booking confirmation screen to track assignment, arrival, and completion updates.</p>
            </div>
            <TrackBookingForm />
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-accent-50 p-2 text-accent-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}