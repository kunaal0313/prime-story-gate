
CREATE TABLE public.reading_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_reading_history_user_part ON public.reading_history(user_id, part_id);
CREATE INDEX idx_reading_history_user ON public.reading_history(user_id);

ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reading history"
ON public.reading_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading history"
ON public.reading_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading history"
ON public.reading_history FOR DELETE
USING (auth.uid() = user_id);
