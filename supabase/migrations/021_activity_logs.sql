-- Activity/Audit log for tracking all CRUD operations

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  section TEXT NOT NULL,
  section_label TEXT NOT NULL,
  entity_id TEXT,
  entity_title TEXT,
  user_name TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON activity_logs
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

CREATE INDEX idx_activity_logs_org_created ON activity_logs (org_id, created_at DESC);
CREATE INDEX idx_activity_logs_section ON activity_logs (org_id, section, created_at DESC);
