"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDateTime, getServiceLabel, getStatusTone } from "@/lib/utils";
import type { BookingStatus } from "@/types";

type DriverDashboardData = {
  profile: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    isOnline: boolean;
    isVerified: boolean;
  };
  activeJobs: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    serviceType: string;
    pickupLabel: string;
    dropLabel: string;
    status: BookingStatus;
    estimatedFare: number;
    finalFare: number | null;
    createdAt: string;
  }>;
  earnings: {
    completedJobs: number;
    total: number;
  };
};

const nextStatusMap: Partial<Record<BookingStatus, BookingStatus>> = {
  assigned: "accepted",
  accepted: "arriving",
  arriving: "in_progress",
  in_progress: "completed",
};

export function DriverDashboardClient({ data }: { data: DriverDashboardData }) {
  const router = useRouter();

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent-700">Driver profile</p>
              <CardTitle className="mt-3 text-3xl">{data.profile.name}</CardTitle>
              <CardDescription className="mt-2">{data.profile.phone} • {data.profile.vehicleNumber}</CardDescription>
            </div>
            <Button
              variant={data.profile.isOnline ? "secondary" : "ghost"}
              onClick={async () => {
                await fetch(`/api/drivers/${data.profile.id}/availability`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isOnline: !data.profile.isOnline }),
                });
                router.refresh();
              }}
            >
              {data.profile.isOnline ? "Go offline" : "Go online"}
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Badge className={data.profile.isOnline ? "border-accent-200 bg-accent-100 text-accent-800" : "border-slate-200 bg-slate-100 text-slate-700"}>
              {data.profile.isOnline ? "Online" : "Offline"}
            </Badge>
            <Badge className={data.profile.isVerified ? "border-brand-200 bg-brand-50 text-brand-700" : "border-amber-200 bg-amber-100 text-amber-700"}>
              {data.profile.isVerified ? "Verified" : "Verification pending"}
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Earnings summary</p>
          <CardTitle className="mt-3 text-3xl">{formatCurrency(data.earnings.total)}</CardTitle>
          <CardDescription className="mt-2">Collected from {data.earnings.completedJobs} completed jobs.</CardDescription>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-ink">Assigned jobs</h2>
        <div className="mt-4 space-y-4">
          {!data.activeJobs.length ? (
            <EmptyState title="No active jobs" description="New assignments will appear here as soon as the dispatcher connects a booking to this driver." />
          ) : (
            data.activeJobs.map((job) => {
              const nextStatus = nextStatusMap[job.status];

              return (
                <Card key={job.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-ink">{job.orderNumber}</h3>
                        <Badge className={getStatusTone(job.status)}>{job.status.replaceAll("_", " ")}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{job.customerName} • {job.phone}</p>
                      <p className="mt-1 text-sm text-slate-600">{getServiceLabel(job.serviceType as never)}</p>
                      <p className="mt-3 text-sm text-slate-600">Pickup: {job.pickupLabel}</p>
                      <p className="mt-1 text-sm text-slate-600">Drop: {job.dropLabel}</p>
                      <p className="mt-3 text-sm font-semibold text-ink">Estimated fare: {formatCurrency(job.estimatedFare)}</p>
                      <p className="mt-1 text-xs text-slate-500">Assigned {formatDateTime(job.createdAt)}</p>
                    </div>
                    <div className="grid gap-2 sm:min-w-56">
                      {job.status === "assigned" ? (
                        <Button
                          onClick={async () => {
                            await fetch(`/api/orders/${job.id}/status`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "cancelled", note: "Driver rejected booking" }),
                            });
                            router.refresh();
                          }}
                          variant="danger"
                        >
                          Reject booking
                        </Button>
                      ) : null}
                      {nextStatus ? (
                        <Button
                          onClick={async () => {
                            await fetch(`/api/orders/${job.id}/status`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: nextStatus, paymentStatus: nextStatus === "completed" ? "paid" : undefined }),
                            });
                            router.refresh();
                          }}
                        >
                          Mark {nextStatus.replaceAll("_", " ")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}