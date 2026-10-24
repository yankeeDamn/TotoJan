import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export const homeFor = (role: Role) => (role === "driver" ? "/driver" : "/traveler");

const hasSupabaseEnv = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Returns the signed-in user's profile, or null. */
export async function getProfile(): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
}

/**
 * For pages that need a signed-in user. Pass a role to also keep travelers out of the driver
 * dashboard and vice versa (they are sent to their own home instead).
 */
export async function requireProfile(role?: Role): Promise<Profile> {
  // Not configured yet: the login page explains what to set up.
  if (!hasSupabaseEnv()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  // Signed in but no profile row: the signup trigger did not run. Don't bounce between /login and the app.
  if (!data) redirect("/account-issue");

  const profile = data as Profile;
  if (role && profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}
