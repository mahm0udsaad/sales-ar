-- Create referrals table for tracking customer referral program
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  referrer_name TEXT NOT NULL,
  referrer_phone TEXT,
  referred_name TEXT NOT NULL,
  referred_phone TEXT,
  status TEXT DEFAULT 'جديدة',
  reward_amount NUMERIC DEFAULT 0,
  reward_paid BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_org ON referrals(org_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(org_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(org_id, created_at);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);
