"use client";

import { Loader2, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function DriverLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("+919000011111");
  const [password, setPassword] = useState("Driver@123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-md p-8">
      <div className="inline-flex rounded-2xl bg-accent-50 p-3 text-accent-700">
        <Smartphone className="h-6 w-6" />
      </div>
      <CardTitle className="mt-5 text-3xl">Driver login</CardTitle>
      <CardDescription className="mt-2">Check assigned jobs, update ride status, and track your earnings.</CardDescription>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setIsLoading(true);
          setError(null);

          const response = await fetch("/api/auth/driver/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password }),
          });

          const payload = await response.json();

          if (!response.ok) {
            setError(payload.error ?? "Login failed");
            setIsLoading(false);
            return;
          }

          router.push("/driver/dashboard");
          router.refresh();
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Phone</span>
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button className="w-full" type="submit" size="lg" disabled={isLoading}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Card>
  );
}