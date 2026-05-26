
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'samson.osias@hellosya.fr' AND email_confirmed_at IS NULL;

INSERT INTO public.user_roles (user_id, role)
VALUES ('127fb78c-3d7c-4936-a598-041b255873c5', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
