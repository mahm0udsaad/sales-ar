-- Add timer fields to employee_tasks
ALTER TABLE employee_tasks
  ADD COLUMN IF NOT EXISTS time_estimate integer,
  ADD COLUMN IF NOT EXISTS time_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS time_spent_minutes integer;
