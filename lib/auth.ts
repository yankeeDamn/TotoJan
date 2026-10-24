import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export const homeFor = (role: Role) => (role === "driver" ? "/driver" : "/traveler");

/** Returns the signed-in user's profile, or null. */
export async function getProfile(): Promise<Profile | null> {
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
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (role && profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}
