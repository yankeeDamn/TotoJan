"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Header links for public pages. The pages stay static (fast), and this swaps
 * "Log in / Sign up" for "Open app" once it sees an existing session.
 */
export function PublicNav() {
  const [home, setHome] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setHome(data.user.user_metadata?.role === "driver" ? "/driver" : "/traveler");
      });
  }, []);

  if (home) {
    return (
      <Button asChild size="sm">
        <Link href={home}>Open app</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">Sign up</Link>
      </Button>
    </>
  );
}
