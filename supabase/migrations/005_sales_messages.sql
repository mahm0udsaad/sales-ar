-- Sales Messages & Call Scripts with star ratings
CREATE TABLE sales_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  category text NOT NULL CHECK (category IN ('new_client', 'renewal_client', 'cashier_client')),
  msg_type text NOT NULL CHECK (msg_type IN ('message', 'script')),
  title text NOT NULL,
  content text NOT NULL,
  avg_rating numeric NOT NULL DEFAULT 0,
  ratings_count integer NOT NULL DEFAULT 0,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sales_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_messages_org ON sales_messages(org_id);
CREATE INDEX idx_sales_messages_type ON sales_messages(org_id, msg_type, category);
CREATE POLICY "sales_messages_all" ON sales_messages FOR ALL USING (true) WITH CHECK (true);

-- Ratings & comments on messages
CREATE TABLE sales_message_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES sales_messages(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  rated_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sales_message_ratings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_message_ratings_msg ON sales_message_ratings(message_id);
CREATE POLICY "sales_message_ratings_all" ON sales_message_ratings FOR ALL USING (true) WITH CHECK (true);
