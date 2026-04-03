-- Add issue category and subcategory columns to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS issue_category text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS issue_subcategory text;
