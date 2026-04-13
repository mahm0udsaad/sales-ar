CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  user_name TEXT NOT NULL,
  topic_key TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'menu',
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed')),
  message_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_training_sessions_org_date ON training_sessions (org_id, started_at DESC);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_sessions_select" ON training_sessions FOR SELECT USING (true);
CREATE POLICY "training_sessions_insert" ON training_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "training_sessions_update" ON training_sessions FOR UPDATE USING (true);
