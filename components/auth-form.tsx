"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CarTaxiFront, MailCheck, Route as RouteIcon, TriangleAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeIndianPhone } from "@/lib/utils";
import type { Role, VehicleType } from "@/lib/types";

interface AuthFormProps {
  mode: "login" | "signup";
  initialRole: Role;
  next?: string;
}

const safeNext = (next?: string) => (next && next.startsWith("/") && !next.startsWith("//") ? next : null);

export function AuthForm({ mode, initialRole, next }: AuthFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("toto");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();

    if (isSignup) {
      const normalizedPhone = normalizeIndianPhone(phone);
      if (!fullName.trim()) return toast.error("Please enter your name.");
      if (!normalizedPhone) return toast.error("Enter a valid 10-digit mobile number.");
      if (password.length < 8) return toast.error("Use a password with at least 8 characters.");
      if (role === "driver" && !vehicleNumber.trim()) return toast.error("Enter your vehicle number.");

      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim(),
            phone_number: normalizedPhone,
            ...(role === "driver"
              ? { vehicle_type: vehicleType, vehicle_number: vehicleNumber.trim(), vehicle_model: vehicleModel.trim() }
              : {}),
          },
        },
      });
      setLoading(false);

      if (error) return toast.error(error.message);

      if (data.session) {
        toast.success("Welcome to TotoJan!");
        router.push(role === "driver" ? "/driver" : "/traveler");
        router.refresh();
      } else {
        setConfirmEmail(email.trim());
      }
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      setLoading(false);
      return toast.error(error?.message ?? "Could not log in.");
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    setLoading(false);

    const actualRole = (profile?.role as Role | undefined) ?? role;
    if (actualRole !== role) toast.info(`This account is a ${actualRole} account, so we opened that for you.`);

    const dest = safeNext(next);
    const home = actualRole === "driver" ? "/driver" : "/traveler";
    router.push(dest && (dest.startsWith("/rides/") || dest.startsWith(home)) ? dest : home);
    router.refresh();
  }

  if (confirmEmail) {
    return (
      <Card className="mx-auto w-full max-w-md text-center">
        <CardContent className="grid gap-4 p-8">
          <MailCheck className="mx-auto size-12 text-accent" aria-hidden />
          <h1 className="text-2xl font-extrabold">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a confirmation link to <strong className="text-foreground">{confirmEmail}</strong>. Open it, then log in.
          </p>
          <Button asChild size="lg">
            <Link href="/login">Go to log in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-extrabold">{isSignup ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignup ? "Pick how you will use TotoJan." : "Log in to book or manage rides."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!isSupabaseConfigured && (
          <p className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Supabase isn&apos;t configured. Copy .env.example to .env.local and add your project keys.
          </p>
        )}

        <Segmented<Role>
          label="Account type"
          value={role}
          onChange={setRole}
          options={[
            { value: "traveler", label: "Traveler Mode", icon: <RouteIcon /> },
            { value: "driver", label: "Driver Mode", icon: <Zap /> },
          ]}
        />

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          {isSignup && (
            <>
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="phone">Mobile number</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignup && role === "driver" && (
            <fieldset className="grid gap-4 rounded-xl border-2 border-dashed p-4">
              <legend className="px-2 text-sm font-bold text-primary">Your vehicle</legend>
              <Segmented<VehicleType>
                label="Vehicle type"
                value={vehicleType}
                onChange={setVehicleType}
                options={[
                  { value: "toto", label: "Toto", icon: <Zap /> },
                  { value: "cab", label: "Cab", icon: <CarTaxiFront /> },
                ]}
              />
              <div>
                <Label htmlFor="vnum">Vehicle number</Label>
                <Input
                  id="vnum"
                  className="uppercase"
                  placeholder="WB 56 T 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vmodel">Model (optional)</Label>
                <Input id="vmodel" placeholder="e.g. Mahindra Treo" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
              </div>
            </fieldset>
          )}

          <Button type="submit" size="lg" loading={loading} disabled={!isSupabaseConfigured}>
            {isSignup ? (role === "driver" ? "Register as driver" : "Create traveler account") : "Log in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignup ? "Already registered?" : "New to TotoJan?"}{" "}
          <Link
            href={`${isSignup ? "/login" : "/signup"}?role=${role}`}
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
