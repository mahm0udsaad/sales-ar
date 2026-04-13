-- Add sales_type column to deals (office vs support)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sales_type text NOT NULL DEFAULT 'office';
UPDATE deals SET sales_type = 'office' WHERE sales_type IS NULL OR sales_type = '';
CREATE INDEX IF NOT EXISTS idx_deals_sales_type ON deals(sales_type);
