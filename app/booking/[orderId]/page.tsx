import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingTimeline } from "@/components/customer/booking-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime, getServiceLabel, getStatusTone } from "@/lib/utils";
import { getOrderById } from "@/services/order-service";

export default async function BookingDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Track booking</p>
          <CardTitle className="mt-3 text-3xl">{order.orderNumber}</CardTitle>
          <CardDescription className="mt-2">Check live progress of your Rampurhat TOTO booking.</CardDescription>
          <div className="mt-6 flex items-center gap-3">
            <Badge className={getStatusTone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
            <span className="text-sm text-slate-500">Booked on {formatDateTime(order.createdAt)}</span>
          </div>
          <div className="mt-6 space-y-4 rounded-4xl border border-slate-200 p-5">
            <SummaryRow label="Customer" value={`${order.customerName} • ${order.phone}`} />
            <SummaryRow label="Service" value={getServiceLabel(order.serviceType)} />
            <SummaryRow label="Pickup" value={order.pickupLabel} />
            <SummaryRow label="Drop" value={order.dropLabel} />
            <SummaryRow label="Estimated fare" value={formatCurrency(order.estimatedFare)} />
            <SummaryRow label="Final fare" value={order.finalFare ? formatCurrency(order.finalFare) : "To be confirmed"} />
            <SummaryRow label="Assigned driver" value={order.driverName ?? "Pending assignment"} />
            <SummaryRow label="Scheduled" value={formatDateTime(order.scheduledAt)} />
          </div>
          <div className="mt-6">
            <Link href="/">
              <Button variant="ghost">Back to home</Button>
            </Link>
          </div>
        </Card>
        <BookingTimeline logs={order.statusLogs} />
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-ink sm:text-right">{value}</span>
    </div>
  );
}