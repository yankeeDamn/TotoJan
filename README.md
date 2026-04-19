# Rampurhat TOTO

Hyperlocal TOTO booking platform for passenger travel, market transport, and parcel delivery inside **Rampurhat, West Bengal**.

Built with **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, and **Prisma ORM**.

---

## Architecture overview

```
app/
  page.tsx                  ← Customer landing + booking form
  booking/
    confirm/page.tsx        ← Booking confirmation screen
    [orderId]/page.tsx      ← Order tracking detail page
  track/page.tsx            ← Quick-track form by order ID
  admin/                    ← Protected admin panel
    login/                  ← Admin authentication
    dashboard/              ← Summary cards + recent orders
    orders/                 ← Order table, driver assign, status update
    drivers/                ← Driver list + create driver
    fares/                  ← Distance-band fare config per service type
    settings/               ← Service area localities viewer
    analytics/              ← Revenue and order breakdown charts
  driver/                   ← Protected driver panel
    login/                  ← Driver authentication
    dashboard/              ← Assigned jobs + accept/reject + status flow
  api/
    bookings/               ← POST create booking, GET by id
    orders/                 ← List, assign driver, update status
    drivers/                ← CRUD + availability toggle
    fare-estimate/          ← POST fare calculation
    fares/                  ← GET/PUT fare rules
    service-area/validate/  ← POST Rampurhat locality check
    auth/admin/login        ← Admin JWT login
    auth/driver/login       ← Driver JWT login
    auth/logout             ← Clear both session cookies
    admin/me                ← Current admin session info
    admin/summary           ← Dashboard summary counts
    driver/me               ← Current driver dashboard data

components/customer/        ← Booking form, timeline, track form
components/admin/           ← Orders table, drivers manager, fare form, login form
components/driver/          ← Driver dashboard client, login form
components/ui/              ← Badge, Button, Card, Input, Select, Textarea, EmptyState

lib/                        ← auth (JWT/cookies), db (Prisma singleton), env,
                               fare (Haversine + band calc), service-area (locality lookup),
                               utils, validations (Zod schemas)

services/order-service.ts   ← All Prisma data access functions

prisma/
  schema.prisma             ← Customer, Driver, Order, FareRule, ServiceArea,
                               OrderStatusLog, AdminUser
  seed.ts                   ← Admin, 3 drivers, 3 fare rules, 12 Rampurhat localities,
                               1 sample order

constants/rampurhat.ts      ← Localities, city name, service copy, distance bands
types/index.ts              ← Shared domain types
```

---

## Getting started

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or Supabase/Neon/Railway)
- `pnpm` or `npm`

### 2. Clone and install

```bash
git clone https://github.com/your-org/rampurhat-toto.git
cd rampurhat-toto
npm install
```

### 3. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/rampurhat_toto"
AUTH_SECRET="your-32-char-secret-here"
APP_URL="http://localhost:3000"
```

> `AUTH_SECRET` must be at least 32 characters. Generate one with:
> `openssl rand -base64 32`

### 4. Set up the database

```bash
# Push schema and generate Prisma client
npx prisma migrate dev --name init

# Seed with admin, drivers, fare rules, and Rampurhat localities
npx prisma db seed
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Default seed credentials

| Role    | Email / Phone        | Password    |
|---------|---------------------|-------------|
| Admin   | admin@rampurhattoto.in | Admin@123 |
| Driver  | +919000011111        | Driver@123  |
| Driver  | +919000022222        | Driver@123  |
| Driver  | +919000033333        | Driver@123  |

---

## Application routes

| URL | Description |
|-----|-------------|
| `/` | Customer landing page with booking form |
| `/booking/confirm?orderId=RHT-...` | Post-booking confirmation screen |
| `/booking/[orderId]` | Live order tracking page |
| `/track` | Quick-track by order ID |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Ops summary |
| `/admin/orders` | Order management + driver assignment |
| `/admin/drivers` | Driver registry |
| `/admin/fares` | Fare rule editor |
| `/admin/settings` | Service area localities |
| `/admin/analytics` | Revenue + breakdown |
| `/driver/login` | Driver login |
| `/driver/dashboard` | Driver job view |

---

## Key business rules

- **Rampurhat-only**: All bookings validate pickup and drop against a list of 12 Rampurhat localities. Orders with unrecognised areas are rejected at API level before the database is touched.
- **Three service types**: `travel`, `transport`, `delivery` — each with independent fare rules.
- **Fare bands**: Haversine distance → short (≤2.5 km), medium (≤5 km), long (>5 km). Optional priority surcharge.
- **Status flow**: `pending → assigned → accepted → arriving → in_progress → completed` (cancellation allowed at any step).
- **Payment**: Cash or UPI, collected after trip completion. No online gateway in MVP.
- **Auth**: JWT stored in `httpOnly` cookies. Admin and driver sessions are independent. Driver can only toggle their own availability.

---

## Available scripts

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build
npm run lint          # ESLint
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
```

---

## Extending the MVP

| Feature | Where to add |
|---------|-------------|
| SMS/WhatsApp notification on assign | `services/order-service.ts → assignDriver()` |
| Google Maps locality autocomplete | Replace `Select` locality dropdown in `BookingForm` |
| Driver GPS tracking | Extend `Driver` model, new `/api/drivers/[id]/location` route |
| UPI payment deeplink | Add at `/booking/[orderId]` once status is `completed` |
| New service area | Add entries to `RAMPURHAT_LOCALITIES` in `constants/rampurhat.ts`, re-seed |
| Multi-city expansion | Remove single-city lock in `validateRampurhatServiceArea()` |

Rampurhat TOTO is a mobile-first hyperlocal booking MVP for TOTO rides, goods transport, and parcel delivery inside Rampurhat.

The repository is scaffolded with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, and Prisma.

Further setup, features, and run instructions are documented as the app implementation is completed.