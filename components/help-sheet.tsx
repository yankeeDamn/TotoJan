"use client";

import { useState } from "react";
import { LifeBuoy, Phone, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMERGENCY_PHONE, SUPPORT_PHONE } from "@/lib/utils";

/** Always-reachable emergency and support options, as the UX rules ask for. */
export function HelpSheet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="h-10 gap-1.5 px-3"
      >
        <ShieldAlert className="!size-4" aria-hidden />
        SOS
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Emergency and support"
          onClick={() => setOpen(false)}
        >
          <div
            className="pb-safe w-full max-w-md animate-in slide-in-from-bottom-8 rounded-2xl bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Need help?</h2>
                <p className="text-sm text-muted-foreground">Reach someone right away.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X />
              </Button>
            </div>

            <div className="grid gap-3">
              <Button asChild variant="destructive" size="lg">
                <a href={`tel:${EMERGENCY_PHONE}`}>
                  <ShieldAlert /> Emergency: call {EMERGENCY_PHONE}
                </a>
              </Button>
              {SUPPORT_PHONE ? (
                <Button asChild variant="outline" size="lg">
                  <a href={`tel:${SUPPORT_PHONE}`}>
                    <Phone /> Call TotoJan support
                  </a>
                </Button>
              ) : (
                <p className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  <LifeBuoy className="size-4 shrink-0" aria-hidden />
                  Support line not configured yet (set NEXT_PUBLIC_SUPPORT_PHONE).
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
