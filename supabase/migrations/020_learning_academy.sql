-- Learning Academy dynamic content tables

-- Stages (المراحل)
CREATE TABLE IF NOT EXISTS learning_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  stage_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  icon text NOT NULL DEFAULT '📦',
  color text NOT NULL DEFAULT '#3B82F6',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ls_all" ON learning_stages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ls_anon_select" ON learning_stages FOR SELECT TO anon USING (true);
CREATE POLICY "ls_anon_insert" ON learning_stages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ls_anon_update" ON learning_stages FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ls_anon_delete" ON learning_stages FOR DELETE TO anon USING (true);

-- Lessons (الدروس)
CREATE TABLE IF NOT EXISTS learning_lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES learning_stages(id) ON DELETE CASCADE,
  lesson_key text NOT NULL,
  title text NOT NULL,
  duration text NOT NULL DEFAULT '10 د',
  points text[] DEFAULT '{}',
  task text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ll_all" ON learning_lessons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ll_anon_select" ON learning_lessons FOR SELECT TO anon USING (true);
CREATE POLICY "ll_anon_insert" ON learning_lessons FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ll_anon_update" ON learning_lessons FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ll_anon_delete" ON learning_lessons FOR DELETE TO anon USING (true);

-- Quiz questions (الاختبارات)
CREATE TABLE IF NOT EXISTS learning_quizzes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES learning_lessons(id) ON DELETE CASCADE,
  question text NOT NULL,
  options text[] NOT NULL DEFAULT '{}',
  correct_answer integer NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lq_all" ON learning_quizzes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "lq_anon_select" ON learning_quizzes FOR SELECT TO anon USING (true);
CREATE POLICY "lq_anon_insert" ON learning_quizzes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "lq_anon_update" ON learning_quizzes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "lq_anon_delete" ON learning_quizzes FOR DELETE TO anon USING (true);

-- Learning progress table
CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  org_id text NOT NULL,
  completed_lessons text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_all" ON learning_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "lp_anon_select" ON learning_progress FOR SELECT TO anon USING (true);
CREATE POLICY "lp_anon_insert" ON learning_progress FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "lp_anon_update" ON learning_progress FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "lp_anon_delete" ON learning_progress FOR DELETE TO anon USING (true);
