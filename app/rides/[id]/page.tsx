import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RideView } from "@/components/ride-view";
import { SiteHeader } from "@/components/site-header";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Message, Ride } from "@/lib/types";

export const metadata: Metadata = { title: "Your ride" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS only returns the ride if this user is the traveler, the assigned driver, or a driver viewing an open request.
  const { data: ride } = await supabase.from("rides").select("*").eq("id", id).maybeSingle();
  if (!ride) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("ride_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="container py-4 pb-10">
        <RideView
          initialRide={ride as Ride}
          initialMessages={(messages as Message[] | null) ?? []}
          me={{ id: profile.id, role: profile.role }}
        />
      </main>
    </>
  );
}
