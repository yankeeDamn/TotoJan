import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { getProfile, homeFor } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const { role, next } = await searchParams;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const profile = await getProfile();
    if (profile) redirect(homeFor(profile.role));
  }

  return (
    <>
      <SiteHeader />
      <main className="container py-8">
        <AuthForm mode="login" initialRole={(role === "driver" ? "driver" : "traveler") as Role} next={next} />
      </main>
    </>
  );
}
