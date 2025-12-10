-- Add image_url column to advertisements
ALTER TABLE public.advertisements 
ADD COLUMN image_url text;

-- Create storage bucket for advertisement images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('advertisements', 'advertisements', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for advertisement images
CREATE POLICY "Anyone can view advertisement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'advertisements');

CREATE POLICY "Admins can upload advertisement images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update advertisement images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete advertisement images"
ON storage.objects FOR DELETE
USING (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));