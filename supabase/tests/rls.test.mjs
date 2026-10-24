import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Runs the real migration on an in-process Postgres (PGlite) with minimal Supabase auth stubs,
// then checks RLS policies and ride RPCs. Usage: npm run test:db

const migration = readFileSync(fileURLToPath(new URL("../migrations/0001_init.sql", import.meta.url)), "utf8");
const db = new PGlite();

// ---- Minimal Supabase stand-ins -------------------------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create publication supabase_realtime;
  grant usage on schema public, auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);

await db.exec(migration);
await db.exec(`grant all on all tables in schema public to anon, authenticated;`);

// ---- helpers --------------------------------------------------------------------
let passed = 0;
let failed = 0;
const ok = (name) => { passed++; console.log("  ok  ", name); };
const bad = (name, extra = "") => { failed++; console.log("  FAIL", name, extra); };
const check = (name, cond, extra) => (cond ? ok(name) : bad(name, extra));

async function as(uid, sql, params = []) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}
async function fails(name, uid, sql, params, msgPart) {
  try {
    await as(uid, sql, params);
    bad(name, "(expected an error, got success)");
  } catch (e) {
    check(name, !msgPart || String(e.message).includes(msgPart), `(got: ${e.message})`);
  }
}

const T1 = "11111111-1111-1111-1111-111111111111";
const T2 = "11111111-1111-1111-1111-222222222222";
const D1 = "22222222-2222-2222-2222-111111111111"; // toto
const D2 = "22222222-2222-2222-2222-222222222222"; // toto
const D3 = "22222222-2222-2222-2222-333333333333"; // cab

await db.query(
  `insert into auth.users (id, email, raw_user_meta_data) values
   ($1,'t1@x.test','{"role":"traveler","full_name":"Tia","phone_number":"+919000000001"}'),
   ($2,'t2@x.test','{"role":"traveler","full_name":"Tom","phone_number":"+919000000002"}'),
   ($3,'d1@x.test','{"role":"driver","full_name":"Dev","phone_number":"+919000000003","vehicle_type":"toto","vehicle_number":"wb 56 t 1","vehicle_model":"Treo"}'),
   ($4,'d2@x.test','{"role":"driver","full_name":"Dan","phone_number":"+919000000004","vehicle_type":"toto","vehicle_number":"WB 56 T 2"}'),
   ($5,'d3@x.test','{"role":"driver","full_name":"Dia","phone_number":"+919000000005","vehicle_type":"cab","vehicle_number":"WB 56 C 3"}')`,
  [T1, T2, D1, D2, D3],
);

console.log("\nSignup trigger");
const profiles = await db.query(`select id, role, full_name, phone_number from public.profiles order by email`);
check("5 profiles created", profiles.rows.length === 5);
const vehicles = await db.query(`select driver_id, vehicle_type, vehicle_number, is_active from public.vehicles`);
check("3 vehicles created for the drivers", vehicles.rows.length === 3);
check("vehicle number upper-cased", vehicles.rows.some((v) => v.vehicle_number === "WB 56 T 1"));
check("vehicles start offline", vehicles.rows.every((v) => v.is_active === false));

console.log("\nProfiles RLS");
let r = await as(T1, `select id from public.profiles`);
check("traveler sees only own profile before any ride", r.rows.length === 1 && r.rows[0].id === T1);
r = await as(T1, `update public.profiles set role = 'driver' where id = $1 returning id`, [T1]).catch((e) => ({ err: e }));
check("cannot escalate own role to driver", r.err || r.rows.length === 0, JSON.stringify(r.rows));
r = await as(T1, `update public.profiles set full_name = 'Tia R' where id = $1 returning full_name`, [T1]);
check("can edit own name", r.rows[0]?.full_name === "Tia R");
r = await as(T1, `update public.profiles set full_name = 'hack' where id = $1 returning id`, [T2]);
check("cannot edit someone else's profile", r.rows.length === 0);

console.log("\nRide creation");
const rideSql = `insert into public.rides (traveler_id, pickup_location, drop_location, booking_type, vehicle_type, distance_km, fare, demand_multiplier)
                 values ($1,'Rampurhat Railway Station','Tarapith Temple','live','toto',6.5,110,1.0) returning id`;
r = await as(T1, rideSql, [T1]);
const ride1 = r.rows[0].id;
check("traveler can create a live ride", Boolean(ride1));
await fails("driver cannot create rides", D1, rideSql, [D1]);
await fails("traveler cannot create a ride for someone else", T1, rideSql, [T2]);
await fails(
  "traveler cannot pre-assign a driver",
  T1,
  `insert into public.rides (traveler_id, driver_id, pickup_location, drop_location, booking_type, fare) values ($1,$2,'a a','b b','live',100)`,
  [T1, D1],
);
await fails(
  "scheduled ride requires scheduled_for",
  T1,
  `insert into public.rides (traveler_id, pickup_location, drop_location, booking_type, fare) values ($1,'a a','b b','scheduled',100)`,
  [T1],
);
await fails(
  "fare outside 10..5000 is rejected",
  T1,
  `insert into public.rides (traveler_id, pickup_location, drop_location, booking_type, fare) values ($1,'a a','b b','live',9000)`,
  [T1],
);
r = await as(T1, `update public.rides set fare = 10 where id = $1 returning id`, [ride1]);
check("traveler cannot update ride fields directly (no UPDATE policy)", r.rows.length === 0);

console.log("\nRide visibility");
r = await as(T2, `select id from public.rides`);
check("other traveler cannot see the ride", r.rows.length === 0);
r = await as(D1, `select id from public.rides`);
check("drivers can see open pending requests", r.rows.length === 1);
r = await as(D1, `select id from public.profiles where id = $1`, [T1]);
check("driver cannot read traveler profile before accepting", r.rows.length === 0);

console.log("\nmarket_stats + accept_ride");
r = await as(T1, `select * from public.market_stats()`);
check("market_stats returns counts", r.rows[0].online_drivers === 0 && r.rows[0].pending_rides === 1, JSON.stringify(r.rows));
await db.exec(`set role anon;`);
try {
  await db.query(`select * from public.market_stats()`);
  bad("anon cannot call market_stats");
} catch {
  ok("anon cannot call market_stats");
}
await db.exec(`reset role;`);

await fails("offline driver cannot accept", D1, `select * from public.accept_ride($1)`, [ride1], "Go online");
await fails("traveler cannot accept", T2, `select * from public.accept_ride($1)`, [ride1], "Only drivers");
await db.query(`update public.vehicles set is_active = true where driver_id in ($1,$2,$3)`, [D1, D2, D3]);
await fails("cab driver cannot accept a toto ride", D3, `select * from public.accept_ride($1)`, [ride1], "no longer available");

r = await as(T1, `select * from public.market_stats()`);
check("market_stats counts 3 online drivers", r.rows[0].online_drivers === 3);

r = await as(D1, `select id, status, driver_id from public.accept_ride($1)`, [ride1]);
check("driver 1 accepts", r.rows[0].status === "accepted" && r.rows[0].driver_id === D1);
await fails("second driver loses the race", D2, `select * from public.accept_ride($1)`, [ride1], "no longer available");

r = await as(D2, `select id from public.rides`);
check("other drivers no longer see the accepted ride", r.rows.length === 0);
r = await as(T1, `select full_name, phone_number from public.profiles where id = $1`, [D1]);
check("traveler can read assigned driver's profile", r.rows[0]?.full_name === "Dev");
r = await as(T1, `select vehicle_number from public.vehicles where driver_id = $1`, [D1]);
check("traveler can read assigned driver's vehicle", r.rows[0]?.vehicle_number === "WB 56 T 1");
r = await as(D1, `select full_name, phone_number from public.profiles where id = $1`, [T1]);
check("driver can read traveler profile after accepting", r.rows[0]?.full_name === "Tia R");
r = await as(T2, `select id from public.vehicles where driver_id = $1`, [D1]);
check("unrelated traveler cannot read the vehicle", r.rows.length === 0);
r = await as(D2, `select id from public.profiles where id = $1`, [T1]);
check("unrelated driver cannot read traveler profile", r.rows.length === 0);

console.log("\nStatus transitions");
await fails("traveler cannot start a ride", T1, `select * from public.set_ride_status($1,'ongoing')`, [ride1], "cannot start");
await fails("other driver cannot start (sees 'not found')", D2, `select * from public.set_ride_status($1,'ongoing')`, [ride1], "Ride not found");
await fails("cannot complete before starting", D1, `select * from public.set_ride_status($1,'completed')`, [ride1], "cannot complete");
await fails("invalid status rejected", D1, `select * from public.set_ride_status($1,'bogus')`, [ride1], "Invalid");
r = await as(D1, `select status from public.set_ride_status($1,'ongoing')`, [ride1]);
check("driver starts ride", r.rows[0].status === "ongoing");
await fails("traveler cannot cancel an ongoing ride", T1, `select * from public.set_ride_status($1,'cancelled')`, [ride1], "cannot cancel");
await fails("driver cannot release an ongoing ride", D1, `select * from public.set_ride_status($1,'cancelled')`, [ride1], "cannot cancel");
r = await as(D1, `select status from public.set_ride_status($1,'completed')`, [ride1]);
check("driver completes ride", r.rows[0].status === "completed");
await fails("completed ride cannot be cancelled", T1, `select * from public.set_ride_status($1,'cancelled')`, [ride1], "cannot cancel");

console.log("\nRelease / cancel flows");
r = await as(T1, rideSql, [T1]);
const ride2 = r.rows[0].id;
await as(D1, `select * from public.accept_ride($1)`, [ride2]);
r = await as(D1, `select status, driver_id from public.set_ride_status($1,'cancelled')`, [ride2]);
check("driver cancelling an accepted ride releases it to pending", r.rows[0].status === "pending" && r.rows[0].driver_id === null);
r = await as(D2, `select status, driver_id from public.accept_ride($1)`, [ride2]);
check("another driver can pick up the released ride", r.rows[0].driver_id === D2);
r = await as(T1, `select status from public.set_ride_status($1,'cancelled')`, [ride2]);
check("traveler can cancel an accepted ride", r.rows[0].status === "cancelled");
await fails("other traveler cannot cancel", T2, `select * from public.set_ride_status($1,'cancelled')`, [ride2], "Ride not found");

console.log("\nMessages RLS");
r = await as(T1, rideSql, [T1]);
const ride3 = r.rows[0].id;
await as(D1, `select * from public.accept_ride($1)`, [ride3]);
r = await as(T1, `insert into public.messages (ride_id, sender_id, content) values ($1,$2,'hello') returning id`, [ride3, T1]);
check("traveler can message on own ride", Boolean(r.rows[0].id));
r = await as(D1, `insert into public.messages (ride_id, sender_id, content) values ($1,$2,'on my way') returning id`, [ride3, D1]);
check("assigned driver can reply", Boolean(r.rows[0].id));
r = await as(D1, `select content from public.messages where ride_id = $1 order by created_at`, [ride3]);
check("driver reads both messages", r.rows.length === 2);
r = await as(D2, `select id from public.messages where ride_id = $1`, [ride3]);
check("outsider driver cannot read messages", r.rows.length === 0);
r = await as(T2, `select id from public.messages where ride_id = $1`, [ride3]);
check("outsider traveler cannot read messages", r.rows.length === 0);
await fails("outsider cannot send", T2, `insert into public.messages (ride_id, sender_id, content) values ($1,$2,'spam')`, [ride3, T2]);
await fails("cannot spoof sender", T1, `insert into public.messages (ride_id, sender_id, content) values ($1,$2,'fake')`, [ride3, D1]);
await fails("empty message rejected", T1, `insert into public.messages (ride_id, sender_id, content) values ($1,$2,'')`, [ride3, T1]);

console.log("\nVehicles");
r = await as(D1, `update public.vehicles set is_active = false where driver_id = $1 returning is_active`, [D1]);
check("driver can toggle own vehicle offline", r.rows[0]?.is_active === false);
r = await as(D1, `update public.vehicles set is_active = true where driver_id = $1 returning id`, [D2]);
check("driver cannot toggle someone else's vehicle", r.rows.length === 0);
await fails(
  "only one vehicle per driver",
  D2,
  `insert into public.vehicles (driver_id, vehicle_type, vehicle_number) values ($1,'toto','X')`,
  [D2],
);
await fails(
  "traveler cannot register a vehicle",
  T1,
  `insert into public.vehicles (driver_id, vehicle_type, vehicle_number) values ($1,'toto','X')`,
  [T1],
);

console.log("\nScheduled ride");
r = await as(
  T1,
  `insert into public.rides (traveler_id, pickup_location, drop_location, booking_type, scheduled_for, vehicle_type, fare, demand_multiplier)
   values ($1,'a a','b b','scheduled', now() + interval '2 days','toto',120,1.1) returning id`,
  [T1],
);
check("scheduled ride created", Boolean(r.rows[0].id));
r = await as(T1, `select * from public.market_stats()`);
check("scheduled rides are not counted as live demand", r.rows[0].pending_rides === 0, JSON.stringify(r.rows)); // ride3 accepted, ride2 cancelled, so no open live rides remain

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
