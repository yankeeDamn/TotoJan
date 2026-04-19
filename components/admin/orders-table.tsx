"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDateTime, getServiceLabel, getStatusTone } from "@/lib/utils";
import type { DriverSummary, OrderSummary } from "@/types";

type OrdersTableProps = {
  orders: OrderSummary[];
  drivers: DriverSummary[];
};

export function OrdersTable({ orders, drivers }: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [driverSelections, setDriverSelections] = useState<Record<string, string>>({});
  const [statusSelections, setStatusSelections] = useState<Record<string, string>>({});

  if (!orders.length) {
    return <EmptyState title="No orders found" description="New bookings will appear here for manual driver assignment and status tracking." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-ink">Orders</h2>
        <Select
          className="sm:max-w-56"
          defaultValue={searchParams.get("status") ?? "all"}
          onChange={(event) => {
            const next = new URLSearchParams(searchParams.toString());
            next.set("status", event.target.value);
            router.push(`/admin/orders?${next.toString()}`);
          }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="accepted">Accepted</option>
          <option value="arriving">Arriving</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-ink">{order.orderNumber}</h3>
                  <Badge className={getStatusTone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="text-sm text-slate-600">{order.customerName} • {order.phone} • {getServiceLabel(order.serviceType)}</p>
                <p className="text-sm text-slate-600">Pickup: {order.pickupLabel}</p>
                <p className="text-sm text-slate-600">Drop: {order.dropLabel}</p>
                <p className="text-sm text-slate-500">Created {formatDateTime(order.createdAt)}</p>
              </div>

              <div className="grid gap-3 sm:min-w-80">
                <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-slate-700">Estimated fare: {formatCurrency(order.estimatedFare)}</p>
                  <p className="mt-1 text-slate-500">Driver: {order.driverName ?? "Not assigned"}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Select
                    value={driverSelections[order.id] ?? ""}
                    onChange={(event) => setDriverSelections((current) => ({ ...current, [order.id]: event.target.value }))}
                  >
                    <option value="">Assign driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} • {driver.vehicleNumber}
                      </option>
                    ))}
                  </Select>
                  <Button
                    disabled={!driverSelections[order.id] || assigningId === order.id}
                    onClick={async () => {
                      setAssigningId(order.id);
                      await fetch(`/api/orders/${order.id}/assign-driver`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ driverId: driverSelections[order.id] }),
                      });
                      setAssigningId(null);
                      router.refresh();
                    }}
                  >
                    {assigningId === order.id ? "Assigning..." : "Assign"}
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Select
                    value={statusSelections[order.id] ?? order.status}
                    onChange={(event) => setStatusSelections((current) => ({ ...current, [order.id]: event.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="accepted">Accepted</option>
                    <option value="arriving">Arriving</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  <Button
                    variant="ghost"
                    disabled={updatingId === order.id}
                    onClick={async () => {
                      setUpdatingId(order.id);
                      await fetch(`/api/orders/${order.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: statusSelections[order.id] ?? order.status }),
                      });
                      setUpdatingId(null);
                      router.refresh();
                    }}
                  >
                    {updatingId === order.id ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}