import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { Logo } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Account setup problem" };

export default function AccountIssuePage() {
  return (
    <main className="container grid min-h-dvh place-items-center py-10">
      <div className="grid w-full max-w-md gap-6">
        <Logo />
        <Card>
          <CardContent className="grid gap-4 p-6">
            <TriangleAlert className="size-10 text-primary" aria-hidden />
            <h1 className="text-2xl font-extrabold">We couldn&apos;t finish setting up your account</h1>
            <p className="text-muted-foreground">
              You&apos;re signed in, but your TotoJan profile wasn&apos;t created. This usually means the database setup
              hasn&apos;t been applied yet. Sign out, ask the site owner to check the setup, then sign up again.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SignOutButton /> Sign out
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
