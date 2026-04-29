alter table public.trip_logs enable row level security;

drop policy if exists "users can read own trip logs" on public.trip_logs;
drop policy if exists "users can insert own trip logs" on public.trip_logs;
drop policy if exists "admins can delete any trip logs, employees can delete own" on public.trip_logs;
drop policy if exists "admins can update any trip logs, employees can update own" on public.trip_logs;

create policy "users can read own trip logs"
  on public.trip_logs
  for select
  using (
    auth.uid() = created_by
    or (auth.jwt() ->> 'role') = 'admin'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "users can insert own trip logs"
  on public.trip_logs
  for insert
  with check (auth.uid() = created_by);

create policy "admins can delete any trip logs, employees can delete own"
  on public.trip_logs
  for delete
  using (
    auth.uid() = created_by
    or (auth.jwt() ->> 'role') = 'admin'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "admins can update any trip logs, employees can update own"
  on public.trip_logs
  for update
  using (
    auth.uid() = created_by
    or (auth.jwt() ->> 'role') = 'admin'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    auth.uid() = created_by
    or (auth.jwt() ->> 'role') = 'admin'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
