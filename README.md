# TotoJan

Hyper-local Toto and cab booking for the **Rampurhat ⇄ Tarapith** road (West Bengal, India). Travelers book live or in advance, see the fare before they confirm, and chat or call the driver. Drivers go online, accept requests against a countdown, and track earnings.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS with shadcn-style components · Supabase (Auth, Postgres + RLS, Realtime) · Leaflet + OpenStreetMap · Lucide icons.

## Quick start

```bash
npm install
cp .env.example .env.local     # add your Supabase URL + anon key
```

### 1. Database

Create a Supabase project, then either:

- **CLI:** `supabase link --project-ref <ref> && supabase db push`, or
- **SQL editor:** paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run it.

For local development with the Supabase CLI, `supabase start` followed by `supabase db reset` applies the migration **and** [`supabase/seed.sql`](supabase/seed.sql). The seed is local-only (it creates users with a known password):

| Account | Role | Password |
|---|---|---|
| `traveler@totojan.test` | Traveler | `Password@123` |
| `driver1@totojan.test` | Driver (Toto, online) | `Password@123` |
| `driver2@totojan.test` | Driver (Cab, offline) | `Password@123` |

### 2. Auth settings

In Supabase → Authentication → Providers → Email, turn **Confirm email** off while developing, otherwise new accounts see a "check your email" screen first.

### 3. Run

```bash
npm run dev
```

## How it works

| Area | Where |
|---|---|
| Landing page, Traveler/Driver mode toggle | `app/page.tsx`, `components/auth-form.tsx` |
| Booking (preset routes, Ride Now / Book for Later, fare breakdown, map) | `components/booking-form.tsx` |
| Pricing engine | `lib/pricing.ts` |
| Ride creation (server-side fare) | `app/api/rides/route.ts` |
| Driver dashboard (online toggle, countdown requests, earnings) | `components/driver-dashboard.tsx` |
| Ride tracking + status flow | `components/ride-view.tsx` |
| Realtime chat + `tel:` call button | `components/chat-panel.tsx`, `components/ride-view.tsx` |
| Schema, RLS, RPCs, realtime publication | `supabase/migrations/0001_init.sql` |

### Dynamic pricing

`fare = round to ₹5 of (max(min fare, base + per-km × distance) × multiplier)`. The multiplier is the product of the active factors, **capped at 2×**:

- Amavasya (approximated from the mean lunar cycle, with a ±1 day window) or a festival day from `FESTIVAL_DAYS`: ×1.30 / ×1.35
- Late night (10 pm – 5 am IST): ×1.25. Peak hours (5–9 am, 5–8 pm): ×1.10
- Weekend: ×1.05
- Live demand: when open requests outnumber online drivers, up to ×1.40

Rates live in `RATES` at the top of `lib/pricing.ts`. Add festival dates to `FESTIVAL_DAYS` (Kali Puja 2026 is already there).

### Matching and ride lifecycle

Rides move `pending → accepted → ongoing → completed` (or `cancelled`). Clients cannot update rides directly; every transition goes through two Postgres functions:

- `accept_ride` claims a ride with a single guarded `UPDATE`, so if two drivers tap Accept at once exactly one wins.
- `set_ride_status` enforces who may start, complete or cancel. A driver cancelling an accepted ride releases it back to `pending` for re-dispatch.

All online drivers with a matching vehicle type see new requests in real time (the corridor is one route, so there is no geo-filtering yet). Each live request has a 30-second on-screen countdown per driver.

### Security notes

- Row Level Security is enabled on all four tables. Travelers see only their rides; drivers see their own rides plus open requests; chat is limited to the two people on a ride; a driver's phone number is only visible to the traveler on the same ride, and vice versa.
- Users cannot change their own `role`.
- The fare is computed on the server in `/api/rides`. The `rides` INSERT policy still lets a traveler insert directly with the anon key, so a determined user could write a lower fare; if that matters, move ride creation behind a `security definer` function that computes the fare in SQL.

## Known limitations / next steps

- **Coordinates and distance are approximate** (`lib/routes.ts`): the map draws a guide line, not the road, and every ride uses the same corridor distance. Custom pickup/drop text is passed to the driver as-is. Add geocoding and routing (e.g. OSRM) for true per-trip distance.
- **One vehicle per driver** (unique index in the migration). Drop `vehicles_one_per_driver` to support fleets.
- **Payments are cash/UPI to the driver**, outside the app.
- No push/SMS notifications yet: drivers see requests while the dashboard is open.
- Amavasya detection is approximate; confirm dates against a panchang and add any that matter to `FESTIVAL_DAYS`.
- Not yet verified against a live Supabase project: the app builds, typechecks and lints, but the SQL and realtime flows have not been run end to end.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```
