import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Logo } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container grid min-h-dvh place-items-center py-10">
      <div className="grid max-w-md justify-items-center gap-5 text-center">
        <Logo />
        <MapPinOff className="size-14 text-primary" aria-hidden />
        <h1 className="text-3xl font-black">Wrong turn</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t find that page, or that ride isn&apos;t yours to view. Let&apos;s get you back on the road.
        </p>
        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
