-- Promote a single user to admin without changing any other metadata keys.
update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb,
  true
)
where email = 'nathan.imboy1@gmail.com';
