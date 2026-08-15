-- 1. Profiles: remove public read access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.profiles FROM anon;

-- Safe username availability check (returns only a boolean)
CREATE OR REPLACE FUNCTION public.username_exists(_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username))
$$;

GRANT EXECUTE ON FUNCTION public.username_exists(text) TO anon, authenticated;

-- 2. admin_otp_codes: explicit deny-all for app roles
REVOKE ALL ON public.admin_otp_codes FROM anon, authenticated;
GRANT ALL ON public.admin_otp_codes TO service_role;

ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to admin OTP codes" ON public.admin_otp_codes;
CREATE POLICY "No client access to admin OTP codes"
ON public.admin_otp_codes
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 3. user_activity: restrict policies to authenticated users
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity;
CREATE POLICY "Users can insert their own activity"
ON public.user_activity
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all activity" ON public.user_activity;
CREATE POLICY "Admins can view all activity"
ON public.user_activity
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public.user_activity FROM anon;