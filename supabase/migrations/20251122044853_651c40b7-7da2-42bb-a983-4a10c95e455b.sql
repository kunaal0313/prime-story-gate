-- Add date_of_birth column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN date_of_birth date;

-- Add index for better query performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);