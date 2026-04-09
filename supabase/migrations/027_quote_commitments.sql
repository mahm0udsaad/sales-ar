CREATE TABLE IF NOT EXISTS quote_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  user_name TEXT NOT NULL,
  quote_date TEXT NOT NULL,
  sales_type TEXT NOT NULL DEFAULT 'office',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_name, quote_date, sales_type)
);

ALTER TABLE quote_commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote_commitments_select" ON quote_commitments FOR SELECT USING (true);
CREATE POLICY "quote_commitments_insert" ON quote_commitments FOR INSERT WITH CHECK (true);
CREATE POLICY "quote_commitments_delete" ON quote_commitments FOR DELETE USING (true);
