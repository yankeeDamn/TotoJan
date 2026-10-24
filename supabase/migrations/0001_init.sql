-- TotoJan: initial schema, RLS policies, RPCs and realtime setup.
-- Run with `supabase db push` / `supabase db reset`, or paste into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  phone_number text,
  role         text not null check (role in ('traveler', 'driver')),
  created_at   timestamptz not null default now()
);

create table public.vehicles (
  id             uuid primary key default gen_random_uuid(),
  driver_id      uuid not null references public.profiles (id) on delete cascade,
  vehicle_type   text not null check (vehicle_type in ('toto', 'cab')),
  vehicle_number text not null,
  model          text,
  -- is_active doubles as the driver's online/offline switch.
  is_active      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- MVP rule: one vehicle per driver (the online toggle and matching assume it).
-- Drop this index to allow fleets.
create unique index vehicles_one_per_driver on public.vehicles (driver_id);

create table public.rides (
  id                uuid primary key default gen_random_uuid(),
  traveler_id       uuid not null references public.profiles (id) on delete cascade,
  driver_id         uuid references public.profiles (id) on delete set null,
  pickup_location   text not null check (char_length(pickup_location) between 2 and 200),
  drop_location     text not null check (char_length(drop_location) between 2 and 200),
  booking_type      text not null check (booking_type in ('live', 'scheduled')),
  scheduled_for     timestamptz,
  vehicle_type      text not null default 'toto' check (vehicle_type in ('toto', 'cab')),
  distance_km       numeric(5, 2) not null default 0,
  fare              numeric(8, 2) not null check (fare between 10 and 5000),
  demand_multiplier numeric(4, 2) not null default 1.00 check (demand_multiplier between 1 and 2),
  status            text not null default 'pending'
                      check (status in ('pending', 'accepted', 'ongoing', 'completed', 'cancelled')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check ((booking_type = 'scheduled') = (scheduled_for is not null))
);

create index rides_traveler_idx on public.rides (traveler_id, created_at desc);
create index rides_driver_idx on public.rides (driver_id, created_at desc);
create index rides_pending_idx on public.rides (created_at desc) where status = 'pending';

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  ride_id    uuid not null references public.rides (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index messages_ride_idx on public.messages (ride_id, created_at);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies never recurse into each other)
-- ---------------------------------------------------------------------------

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_ride_participant(p_ride uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rides r
    where r.id = p_ride and auth.uid() in (r.traveler_id, r.driver_id)
  )
$$;

-- ---------------------------------------------------------------------------
-- Create a profile (and the driver's vehicle) when someone signs up.
-- The signup form passes role / name / phone / vehicle details as user metadata.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role text := coalesce(v_meta ->> 'role', 'traveler');
begin
  if v_role not in ('traveler', 'driver') then
    v_role := 'traveler';
  end if;

  insert into public.profiles (id, email, full_name, phone_number, role)
  values (new.id, new.email, coalesce(v_meta ->> 'full_name', ''), v_meta ->> 'phone_number', v_role);

  if v_role = 'driver' and coalesce(v_meta ->> 'vehicle_number', '') <> '' then
    insert into public.vehicles (driver_id, vehicle_type, vehicle_number, model)
    values (
      new.id,
      case when v_meta ->> 'vehicle_type' = 'cab' then 'cab' else 'toto' end,
      upper(v_meta ->> 'vehicle_number'),
      nullif(v_meta ->> 'vehicle_model', '')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.rides    enable row level security;
alter table public.messages enable row level security;

-- profiles: you see yourself and the other party of any ride you share.
create policy "profiles: read own or ride counterpart" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.rides r
      where (r.traveler_id = auth.uid() and r.driver_id = profiles.id)
         or (r.driver_id = auth.uid() and r.traveler_id = profiles.id)
    )
  );

-- Users may edit their own details but never change their role.
create policy "profiles: update own (role locked)" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());

-- vehicles: drivers manage their own; travelers can see the vehicle of their driver.
create policy "vehicles: read own or assigned driver's" on public.vehicles
  for select to authenticated
  using (
    driver_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.traveler_id = auth.uid() and r.driver_id = vehicles.driver_id
    )
  );

create policy "vehicles: drivers insert own" on public.vehicles
  for insert to authenticated
  with check (driver_id = auth.uid() and public.my_role() = 'driver');

create policy "vehicles: drivers update own" on public.vehicles
  for update to authenticated
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

create policy "vehicles: drivers delete own" on public.vehicles
  for delete to authenticated
  using (driver_id = auth.uid());

-- rides: participants can read; drivers can read open requests; only travelers can create.
-- There is deliberately NO update policy: every state change goes through the RPCs below.
create policy "rides: read own, assigned or open requests" on public.rides
  for select to authenticated
  using (
    traveler_id = auth.uid()
    or driver_id = auth.uid()
    or (status = 'pending' and public.my_role() = 'driver')
  );

create policy "rides: travelers create pending rides" on public.rides
  for insert to authenticated
  with check (
    traveler_id = auth.uid()
    and public.my_role() = 'traveler'
    and status = 'pending'
    and driver_id is null
  );

-- messages: only the two people on a ride.
create policy "messages: participants read" on public.messages
  for select to authenticated
  using (public.is_ride_participant(ride_id));

create policy "messages: participants send" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_ride_participant(ride_id));

-- ---------------------------------------------------------------------------
-- RPCs: all ride state transitions
-- ---------------------------------------------------------------------------

-- A driver claims a pending ride. The single UPDATE ... WHERE status = 'pending' makes the
-- race between two drivers safe: exactly one wins.
create or replace function public.accept_ride(p_ride uuid)
returns public.rides
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_vehicle public.vehicles;
  v_ride public.rides;
begin
  if public.my_role() is distinct from 'driver' then
    raise exception 'Only drivers can accept rides';
  end if;

  select * into v_vehicle from public.vehicles where driver_id = v_uid;
  if not found or not v_vehicle.is_active then
    raise exception 'Go online before accepting rides';
  end if;

  update public.rides r
     set driver_id = v_uid, status = 'accepted', updated_at = now()
   where r.id = p_ride
     and r.status = 'pending'
     and r.driver_id is null
     and r.vehicle_type = v_vehicle.vehicle_type
  returning * into v_ride;

  if v_ride.id is null then
    raise exception 'This ride is no longer available';
  end if;

  return v_ride;
end;
$$;

-- Status changes:
--   accepted -> ongoing    (assigned driver)
--   ongoing  -> completed  (assigned driver)
--   pending/accepted -> cancelled (traveler)
--   accepted -> cancelled by the DRIVER releases the ride back to 'pending' for re-dispatch
create or replace function public.set_ride_status(p_ride uuid, p_status text)
returns public.rides
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ride public.rides;
begin
  select * into v_ride from public.rides where id = p_ride for update;
  -- Strangers get the same answer as for a ride that does not exist.
  if not found or v_uid not in (v_ride.traveler_id, coalesce(v_ride.driver_id, v_ride.traveler_id)) then
    raise exception 'Ride not found';
  end if;

  if p_status = 'ongoing' then
    if v_ride.driver_id is distinct from v_uid or v_ride.status <> 'accepted' then
      raise exception 'You cannot start this ride';
    end if;

  elsif p_status = 'completed' then
    if v_ride.driver_id is distinct from v_uid or v_ride.status <> 'ongoing' then
      raise exception 'You cannot complete this ride';
    end if;

  elsif p_status = 'cancelled' then
    if v_ride.traveler_id = v_uid and v_ride.status in ('pending', 'accepted') then
      null; -- traveler cancels
    elsif v_ride.driver_id = v_uid and v_ride.status = 'accepted' then
      update public.rides
         set status = 'pending', driver_id = null, updated_at = now()
       where id = p_ride
      returning * into v_ride;
      return v_ride;
    else
      raise exception 'You cannot cancel this ride';
    end if;

  else
    raise exception 'Invalid status';
  end if;

  update public.rides
     set status = p_status, updated_at = now()
   where id = p_ride
  returning * into v_ride;

  return v_ride;
end;
$$;

-- Aggregate supply/demand numbers for the pricing engine (no personal data).
create or replace function public.market_stats()
returns table (online_drivers int, pending_rides int)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::int from public.vehicles where is_active),
    (select count(*)::int from public.rides
      where status = 'pending'
        and booking_type = 'live'
        and created_at > now() - interval '30 minutes')
$$;

revoke all on function public.my_role() from public, anon;
revoke all on function public.is_ride_participant(uuid) from public, anon;
revoke all on function public.accept_ride(uuid) from public, anon;
revoke all on function public.set_ride_status(uuid, text) from public, anon;
revoke all on function public.market_stats() from public, anon;

grant execute on function public.my_role() to authenticated;
grant execute on function public.is_ride_participant(uuid) to authenticated;
grant execute on function public.accept_ride(uuid) to authenticated;
grant execute on function public.set_ride_status(uuid, text) to authenticated;
grant execute on function public.market_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (ride matching + chat). Realtime still applies the SELECT policies above.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.rides, public.messages;
