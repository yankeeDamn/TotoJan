import Link from "next/link";
import { ArrowRight, CalendarClock, CarTaxiFront, MessageCircle, ReceiptIndianRupee, ShieldCheck, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RATES } from "@/lib/pricing";
import { CORRIDOR_DISTANCE_KM } from "@/lib/routes";
import { formatINR } from "@/lib/utils";

const steps = [
  { icon: Zap, title: "Pick your ride", text: "Choose Toto or cab, Ride Now or Book for Later." },
  { icon: ReceiptIndianRupee, title: "See the fare first", text: "No haggling. The price is shown before you book." },
  { icon: MessageCircle, title: "Chat or call your driver", text: "Once a driver accepts, talk in the app or tap to call." },
];

export default function LandingPage() {
  const totoBase = Math.max(RATES.toto.minFare, RATES.toto.base + RATES.toto.perKm * CORRIDOR_DISTANCE_KM);
  const cabBase = Math.max(RATES.cab.minFare, RATES.cab.base + RATES.cab.perKm * CORRIDOR_DISTANCE_KM);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="container relative py-12 sm:py-20">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent">
              <span className="size-2 animate-pulse rounded-full bg-accent" aria-hidden />
              Rampurhat ⇄ Tarapith
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Skip the Stand Hassle.
              <span className="block text-primary">Book Your Toto or Cab from Rampurhat to Tarapith Instantly.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              No more bargaining at the stand. Ride now or book in advance, see the fare up front, and talk to your driver
              before they arrive.
            </p>

            <div className="mt-8 grid max-w-md gap-3 sm:grid-cols-2">
              <Button asChild size="lg">
                <Link href="/signup?role=traveler">
                  I need a ride <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup?role=driver">I&apos;m a driver</Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-primary underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </section>

        <section className="container pb-12" aria-labelledby="how">
          <h2 id="how" className="mb-5 text-2xl font-extrabold">
            How it works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <Card key={title} className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icon aria-hidden />
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-muted-foreground">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="container pb-12" aria-labelledby="fares">
          <Card className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <div>
              <h2 id="fares" className="text-2xl font-extrabold">
                Fair, transparent fares
              </h2>
              <p className="mt-2 text-muted-foreground">
                Fares rise a little during pilgrim rushes (Amavasya, festivals), late at night and when many people are
                booking at once, and never by more than 2x. You always see the price before you confirm.
              </p>
              <ul className="mt-4 grid gap-2 text-sm font-semibold">
                <li className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" aria-hidden /> Book ahead for a fixed time
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" aria-hidden /> SOS and support always one tap away
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 self-center">
              <div className="rounded-xl bg-muted p-4">
                <Zap className="mb-2 text-primary" aria-hidden />
                <p className="font-bold">Toto</p>
                <p className="text-2xl font-black">from {formatINR(Math.round(totoBase / 5) * 5)}</p>
                <p className="text-xs text-muted-foreground">Station ⇄ Temple, off-peak</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <CarTaxiFront className="mb-2 text-accent" aria-hidden />
                <p className="font-bold">Cab</p>
                <p className="text-2xl font-black">from {formatINR(Math.round(cabBase / 5) * 5)}</p>
                <p className="text-xs text-muted-foreground">Station ⇄ Temple, off-peak</p>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>TotoJan - made for the Rampurhat–Tarapith road.</p>
      </footer>
    </>
  );
}
