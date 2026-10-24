"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" onClick={signOut} loading={loading} aria-label="Sign out" className="h-10 w-10">
      {!loading && <LogOut />}
    </Button>
  );
}
