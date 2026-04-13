-- Add edit tracking fields to follow_up_notes
ALTER TABLE follow_up_notes
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS edited_by text;
