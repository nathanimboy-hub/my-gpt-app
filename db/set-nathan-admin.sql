-- Promote a single existing user to admin without changing default role logic or table permissions.
-- This updates persisted auth metadata (backend data), not frontend code.
update auth.users
set
  raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb,
    true
  ),
  raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb,
    true
  )
where lower(email) = 'nathan.imboy1@gmail.com';
