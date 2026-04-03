-- Add issue category, subcategory, and open_time columns to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS issue_category text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS issue_subcategory text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS open_time text;
