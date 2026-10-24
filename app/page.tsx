import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  CalendarClock,
  CarTaxiFront,
  ChevronDown,
  MessageCircle,
  Moon,
  ReceiptIndianRupee,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RATES } from "@/lib/pricing";
import { CORRIDOR_DISTANCE_KM } from "@/lib/routes";
import { formatINR } from "@/lib/utils";

const steps = [
  { icon: Zap, title: "Pick your ride", text: "Choose Toto or cab, then Ride Now or Book for Later." },
  { icon: ReceiptIndianRupee, title: "See the fare first", text: "No haggling. The full price and why it is that price, before you book." },
  { icon: MessageCircle, title: "Chat or call your driver", text: "Once a driver accepts, message in the app or tap to call." },
];

const features = [
  { icon: CalendarClock, title: "Book ahead for pilgrim days", text: "Heading for Amavasya or a festival? Lock in a driver for a time you choose, up to 30 days ahead." },
  { icon: Moon, title: "Late-night rides, sorted", text: "Arriving on a late train? Book from your seat and know the fare before you step out." },
  { icon: ShieldCheck, title: "Safety within one tap", text: "SOS is always in the header: call 112 or our support line without hunting for a number." },
  { icon: BadgeIndianRupee, title: "Capped, explained pricing", text: "Prices can rise at busy times, never beyond 2× the base fare, and every extra is itemised." },
];

const faqs = [
  {
    q: "How do I pay?",
    a: "Pay the driver directly in cash or UPI when the trip ends. TotoJan doesn't take payments in the app yet.",
  },
  {
    q: "Why does the fare change?",
    a: "Fares go up a little during pilgrim rushes (Amavasya and festivals), late at night, at peak hours, on weekends, and when many people are booking at once. The breakdown is shown before you confirm, and the total never exceeds 2× the base fare.",
  },
  {
    q: "What if no driver accepts?",
    a: "You'll see the status on your ride page and can cancel any time before pickup. For advance bookings, we show them to drivers right away so someone can claim them early.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Travelers can cancel until the trip starts. If your driver cancels, your request goes back out to other drivers automatically.",
  },
  {
    q: "I'm a driver. How do I get rides?",
    a: "Sign up in Driver Mode with your vehicle details, go online, and requests for your vehicle type appear on your dashboard. Accept within the countdown to claim the ride.",
  },
];

export default function LandingPage() {
  const totoBase = Math.round(Math.max(RATES.toto.minFare, RATES.toto.base + RATES.toto.perKm * CORRIDOR_DISTANCE_KM) / 5) * 5;
  const cabBase = Math.round(Math.max(RATES.cab.minFare, RATES.cab.base + RATES.cab.perKm * CORRIDOR_DISTANCE_KM) / 5) * 5;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-accent/15 blur-3xl" />
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

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
              <li className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary" aria-hidden /> Works in your phone browser
              </li>
              <li className="flex items-center gap-2">
                <ReceiptIndianRupee className="size-4 text-primary" aria-hidden /> Fare shown before you book
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden /> SOS one tap away
              </li>
            </ul>
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
                booking at once, and never by more than 2×. You always see the price before you confirm.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 self-center">
              <div className="rounded-xl bg-muted p-4">
                <Zap className="mb-2 text-primary" aria-hidden />
                <p className="font-bold">Toto</p>
                <p className="text-2xl font-black">from {formatINR(totoBase)}</p>
                <p className="text-xs text-muted-foreground">Station ⇄ Temple, off-peak</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <CarTaxiFront className="mb-2 text-accent" aria-hidden />
                <p className="font-bold">Cab</p>
                <p className="text-2xl font-black">from {formatINR(cabBase)}</p>
                <p className="text-xs text-muted-foreground">Station ⇄ Temple, off-peak</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="container pb-12" aria-labelledby="why">
          <h2 id="why" className="mb-5 text-2xl font-extrabold">
            Built for the Tarapith road
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Icon aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="container pb-12" aria-labelledby="drivers">
          <div className="grid gap-5 rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
            <div>
              <h2 id="drivers" className="text-2xl font-extrabold sm:text-3xl">
                Drive a Toto or cab on this route?
              </h2>
              <p className="mt-2 max-w-xl opacity-90">
                Stop waiting in the queue. Go online when you want, get requests with the fare and distance upfront, and
                track your earnings every day.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup?role=driver">
                Register as a driver <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        <section className="container pb-16" aria-labelledby="faq">
          <h2 id="faq" className="mb-5 text-2xl font-extrabold">
            Questions
          </h2>
          <div className="grid gap-3">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group rounded-2xl border bg-card p-5 open:shadow-sm">
                <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>TotoJan · made for the Rampurhat–Tarapith road.</p>
        <p className="mt-1">In an emergency, call 112.</p>
      </footer>
    </>
  );
}
