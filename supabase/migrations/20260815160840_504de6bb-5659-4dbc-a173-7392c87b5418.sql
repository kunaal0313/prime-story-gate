CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  suffix int := 0;
BEGIN
  base_username := COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), NULLIF(split_part(COALESCE(NEW.email,''), '@', 1), ''), 'user');
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, final_username)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;