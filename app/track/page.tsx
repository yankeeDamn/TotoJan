import { TrackBookingForm } from "@/components/customer/track-booking-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function TrackPage() {
  return (
    <main className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent-700">Track booking</p>
          <CardTitle className="mt-3 text-3xl">Enter your order ID</CardTitle>
          <CardDescription className="mt-2">Track assignment, arrival, and completion updates for any active Rampurhat TOTO booking.</CardDescription>
          <div className="mt-6">
            <TrackBookingForm />
          </div>
        </Card>
      </div>
    </main>
  );
}