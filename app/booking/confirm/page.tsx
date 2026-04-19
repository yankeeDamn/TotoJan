import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent-700">Booking confirmed</p>
        <CardTitle className="mt-4 text-3xl">Your Rampurhat TOTO request is now in queue.</CardTitle>
        <CardDescription className="mt-3 text-base">
          Use the order ID below to track assignment and status updates. Payment will be collected by cash or UPI after completion.
        </CardDescription>
        <div className="mt-8 rounded-4xl border border-brand-100 bg-brand-50 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-700">Order ID</p>
          <p className="mt-2 text-3xl font-bold text-ink">{orderId || "Pending"}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/booking/${orderId}`}>
            <Button className="w-full sm:w-auto">Track this booking</Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto" variant="ghost">
              Book another TOTO
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}