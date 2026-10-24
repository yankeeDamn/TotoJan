"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container grid min-h-dvh place-items-center py-10">
      <div className="grid max-w-md justify-items-center gap-5 text-center" role="alert">
        <TriangleAlert className="size-14 text-destructive" aria-hidden />
        <h1 className="text-3xl font-black">Something went wrong</h1>
        <p className="text-muted-foreground">
          That didn&apos;t work. Check your connection and try again. If you are in the middle of a ride, your driver can
          still be reached from the ride page or by phone.
        </p>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
