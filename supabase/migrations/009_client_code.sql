-- Add client_code column to deals and renewals tables
-- Format: S-0001 for deals (Sales), R-0001 for renewals

-- Add column to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS client_code text;

-- Add column to renewals
ALTER TABLE renewals ADD COLUMN IF NOT EXISTS client_code text;

-- Backfill existing deals with sequential codes per org
WITH numbered AS (
  SELECT id, org_id,
    'S-' || LPAD(ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at ASC)::text, 4, '0') AS code
  FROM deals
  WHERE client_code IS NULL
)
UPDATE deals SET client_code = numbered.code
FROM numbered WHERE deals.id = numbered.id;

-- Backfill existing renewals with sequential codes per org
WITH numbered AS (
  SELECT id, org_id,
    'R-' || LPAD(ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at ASC)::text, 4, '0') AS code
  FROM renewals
  WHERE client_code IS NULL
)
UPDATE renewals SET client_code = numbered.code
FROM numbered WHERE renewals.id = numbered.id;

-- Create unique index per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_client_code_org ON deals(org_id, client_code) WHERE client_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_renewals_client_code_org ON renewals(org_id, client_code) WHERE client_code IS NOT NULL;
