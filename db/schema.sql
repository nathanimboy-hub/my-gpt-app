-- Lite Shipping MVP Schema for Supabase/PostgreSQL

create table if not exists public.trip_logs (
  id uuid primary key default gen_random_uuid(),
  vessel_name text not null check (vessel_name in ('Lite Cat 1', 'Lite Cat 2')),
  route_direction text not null check (route_direction in ('Cebu to Tubigon', 'Tubigon to Cebu')),
  scheduled_departure_time timestamptz not null,
  actual_departure_time timestamptz not null,
  actual_arrival_time timestamptz not null,
  passenger_count integer not null default 0 check (passenger_count >= 0),
  ticket_sales_php numeric(12,2) not null default 0 check (ticket_sales_php >= 0),
  cargo_count integer not null default 0 check (cargo_count >= 0),
  motorcycles_count integer not null default 0 check (motorcycles_count >= 0),
  cars_count integer not null default 0 check (cars_count >= 0),
  trucks_count integer not null default 0 check (trucks_count >= 0),
  fuel_steaming_liters numeric(10,2) not null default 0 check (fuel_steaming_liters >= 0),
  fuel_maneuvering_liters numeric(10,2) not null default 0 check (fuel_maneuvering_liters >= 0),
  generator_fuel_liters numeric(10,2) not null default 0 check (generator_fuel_liters >= 0),
  total_fuel_liters numeric(10,2) generated always as (
    fuel_steaming_liters + fuel_maneuvering_liters + generator_fuel_liters
  ) stored,
  trip_duration_minutes integer generated always as (
    greatest(extract(epoch from (actual_arrival_time - actual_departure_time)) / 60, 0)::integer
  ) stored,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.trip_logs enable row level security;

create policy "users can read own trip logs"
  on public.trip_logs
  for select
  using (auth.uid() = created_by);

create policy "users can insert own trip logs"
  on public.trip_logs
  for insert
  with check (auth.uid() = created_by);
