import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpSheet } from "@/components/help-sheet";
import { SignOutButton } from "@/components/sign-out-button";
import { homeFor } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <Zap className="size-5" aria-hidden />
      </span>
      <span className="text-xl">
        Toto<span className="text-primary">Jan</span>
      </span>
    </Link>
  );
}

/** Pass `profile` on signed-in pages; omit it on public pages. */
export function SiteHeader({ profile }: { profile?: Profile | null }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Main">
          {profile ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href={homeFor(profile.role)}>{profile.role === "driver" ? "Dashboard" : "Book"}</Link>
              </Button>
              {profile.role === "traveler" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/traveler/rides">My rides</Link>
                </Button>
              )}
              <HelpSheet />
              <SignOutButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
