-- Mock data for LOCAL DEVELOPMENT ONLY (`supabase db reset` runs this automatically).
-- Do not run against production: it creates users with a known password.
--
-- Logins (password for all: Password@123)
--   traveler@totojan.test   - Traveler
--   driver1@totojan.test    - Driver (Toto, online)
--   driver2@totojan.test    - Driver (Cab, offline)

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'traveler@totojan.test', crypt('Password@123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"role":"traveler","full_name":"Ananya Das","phone_number":"+919000000001"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'driver1@totojan.test', crypt('Password@123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"role":"driver","full_name":"Bapi Mondal","phone_number":"+919000000002","vehicle_type":"toto","vehicle_number":"WB 56 T 1042","vehicle_model":"Mahindra Treo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
   'driver2@totojan.test', crypt('Password@123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"role":"driver","full_name":"Sukumar Saha","phone_number":"+919000000003","vehicle_type":"cab","vehicle_number":"WB 56 C 7788","vehicle_model":"Maruti Dzire"}',
   now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email in ('traveler@totojan.test', 'driver1@totojan.test', 'driver2@totojan.test');

-- The signup trigger has created the profiles and vehicles. Put driver1 online.
update public.vehicles set is_active = true where driver_id = '22222222-2222-2222-2222-222222222222';

insert into public.rides
  (traveler_id, driver_id, pickup_location, drop_location, booking_type, scheduled_for,
   vehicle_type, distance_km, fare, demand_multiplier, status, created_at, updated_at)
values
  -- history
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Rampurhat Railway Station', 'Tarapith Temple', 'live', null,
   'toto', 6.5, 110, 1.00, 'completed', now() - interval '3 days', now() - interval '3 days'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Tarapith Temple', 'Rampurhat Railway Station', 'live', null,
   'toto', 6.5, 145, 1.30, 'completed', now() - interval '1 day', now() - interval '1 day'),
  -- an open live request drivers can accept
  ('11111111-1111-1111-1111-111111111111', null,
   'Rampurhat Railway Station', 'Tarapith Temple', 'live', null,
   'toto', 6.5, 110, 1.00, 'pending', now(), now()),
  -- an advance booking
  ('11111111-1111-1111-1111-111111111111', null,
   'Rampurhat Bus Stand', 'Tarapith Temple', 'scheduled', now() + interval '2 days',
   'toto', 6.5, 120, 1.10, 'pending', now(), now());
