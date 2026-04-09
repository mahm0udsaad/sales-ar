CREATE TABLE IF NOT EXISTS weekly_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  week_label TEXT NOT NULL,
  week_start DATE NOT NULL DEFAULT CURRENT_DATE,
  data JSONB NOT NULL DEFAULT '{}',
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_meetings_org_week ON weekly_meetings (org_id, week_start DESC);

ALTER TABLE weekly_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly_meetings_select" ON weekly_meetings FOR SELECT USING (true);
CREATE POLICY "weekly_meetings_insert" ON weekly_meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "weekly_meetings_update" ON weekly_meetings FOR UPDATE USING (true);
CREATE POLICY "weekly_meetings_delete" ON weekly_meetings FOR DELETE USING (true);
