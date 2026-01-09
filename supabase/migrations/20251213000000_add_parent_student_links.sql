-- Create parent_student_links table to link parents to students
-- parent_id and student_id reference auth.users
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_parent_student UNIQUE (parent_id, student_id)
);

-- Recommended: add RLS policies so only parent can insert and only parent/authorized can view
-- Example policy (apply in Supabase SQL editor):
-- ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "parents_manage_links" ON public.parent_student_links
--   FOR ALL USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
