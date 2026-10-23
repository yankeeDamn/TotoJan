import type { Metadata } from "next";
import { DriverDashboard } from "@/components/driver-dashboard";
import { SiteHeader } from "@/components/site-header";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/lib/types";

export const metadata: Metadata = { title: "Driver dashboard" };

export default async function DriverPage() {
  const profile = await requireProfile("driver");
  const supabase = await createClient();

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("driver_id", profile.id).maybeSingle();

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="container max-w-2xl py-6">
        <DriverDashboard profile={profile} initialVehicle={(vehicle as Vehicle | null) ?? null} />
      </main>
    </>
  );
}
