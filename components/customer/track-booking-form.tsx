"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TrackBookingForm() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (!orderId.trim()) {
          return;
        }

        router.push(`/booking/${orderId.trim()}`);
      }}
    >
      <Input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Enter order ID like RHT-1001" />
      <Button className="sm:w-auto" type="submit">
        <span className="inline-flex items-center gap-2">
          <Search className="h-4 w-4" />
          Track booking
        </span>
      </Button>
    </form>
  );
}