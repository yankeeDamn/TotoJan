"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import type { DriverSummary } from "@/types";

export function DriversManager({ drivers }: { drivers: DriverSummary[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", vehicleNumber: "", password: "Driver@123" });
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <CardTitle>Add driver</CardTitle>
        <CardDescription className="mt-2">Create a new driver account for dispatch and assignment.</CardDescription>
        <form
          className="mt-5 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            await fetch("/api/drivers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            setLoading(false);
            setForm({ name: "", phone: "", vehicleNumber: "", password: "Driver@123" });
            router.refresh();
          }}
        >
          <Input placeholder="Driver name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Input placeholder="Phone number" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <Input placeholder="Vehicle number" value={form.vehicleNumber} onChange={(event) => setForm((current) => ({ ...current, vehicleNumber: event.target.value }))} />
          <Input placeholder="Temporary password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <Button className="w-full" type="submit" disabled={loading}>{loading ? "Saving..." : "Create driver"}</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {!drivers.length ? (
          <EmptyState title="No drivers yet" description="Create the first Rampurhat TOTO driver profile to start assigning bookings." />
        ) : (
          drivers.map((driver) => (
            <Card key={driver.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-ink">{driver.name}</h3>
                    <Badge className={driver.isOnline ? "border-accent-200 bg-accent-100 text-accent-800" : "border-slate-200 bg-slate-100 text-slate-700"}>
                      {driver.isOnline ? "Online" : "Offline"}
                    </Badge>
                    <Badge className={driver.isVerified ? "border-brand-200 bg-brand-50 text-brand-700" : "border-amber-200 bg-amber-100 text-amber-700"}>
                      {driver.isVerified ? "Verified" : "Pending verify"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{driver.phone} • {driver.vehicleNumber}</p>
                  <p className="mt-1 text-sm text-slate-500">Active assigned jobs: {driver.assignedJobs}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await fetch(`/api/drivers/${driver.id}/availability`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isOnline: !driver.isOnline }),
                    });
                    router.refresh();
                  }}
                >
                  Set {driver.isOnline ? "offline" : "online"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}