-- Add user_id to reports for ownership tracking
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports (user_id);

-- Update RLS: anyone can still read (for shared links), but only the owner can list their own
DROP POLICY IF EXISTS "Reports are publicly readable" ON public.reports;

CREATE POLICY "Anyone can read a specific report by id"
  ON public.reports FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- API for listing user's reports
CREATE OR REPLACE FUNCTION public.my_reports(p_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  brands text[],
  created_at timestamptz,
  duration integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT r.id, r.brands, r.created_at, r.duration
  FROM public.reports r
  WHERE r.user_id = auth.uid()
  ORDER BY r.created_at DESC
  LIMIT p_limit;
$$;
