-- Create user activity tracking table
CREATE TABLE public.user_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text NOT NULL,
  action text NOT NULL,
  details text,
  page text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
ON public.user_activity
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
ON public.user_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);