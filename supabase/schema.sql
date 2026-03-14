-- CommandCenter Database Schema
-- Run this in Supabase SQL Editor

-- Organization / Account
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users / Managers who login
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Employees (sales reps, support agents, team members)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'نشط',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deals (Sales Pipeline)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  deal_value NUMERIC NOT NULL DEFAULT 0,
  source TEXT,
  stage TEXT NOT NULL DEFAULT 'تواصل',
  probability INTEGER DEFAULT 50,
  assigned_rep_id UUID REFERENCES employees(id),
  assigned_rep_name TEXT,
  cycle_days INTEGER DEFAULT 0,
  deal_date DATE,
  close_date DATE,
  loss_reason TEXT,
  notes TEXT,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  ticket_number INTEGER,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  issue TEXT NOT NULL,
  priority TEXT DEFAULT 'عادي',
  status TEXT DEFAULT 'مفتوح',
  assigned_agent_id UUID REFERENCES employees(id),
  assigned_agent_name TEXT,
  open_date DATE,
  due_date DATE,
  resolved_date DATE,
  response_time TEXT,
  response_time_minutes INTEGER,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly KPI Snapshots
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_revenue NUMERIC DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  closed_deals INTEGER DEFAULT 0,
  close_rate NUMERIC DEFAULT 0,
  avg_deal_value NUMERIC DEFAULT 0,
  avg_cycle_days NUMERIC DEFAULT 0,
  avg_probability NUMERIC DEFAULT 0,
  target_revenue NUMERIC DEFAULT 0,
  revenue_gap NUMERIC DEFAULT 0,
  stage_contact INTEGER DEFAULT 0,
  stage_quote INTEGER DEFAULT 0,
  stage_negotiate INTEGER DEFAULT 0,
  stage_closed INTEGER DEFAULT 0,
  total_tickets INTEGER DEFAULT 0,
  tickets_open INTEGER DEFAULT 0,
  tickets_in_progress INTEGER DEFAULT 0,
  tickets_resolved INTEGER DEFAULT 0,
  tickets_urgent INTEGER DEFAULT 0,
  tickets_high INTEGER DEFAULT 0,
  tickets_normal INTEGER DEFAULT 0,
  resolution_rate NUMERIC DEFAULT 0,
  urgent_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, month, year)
);

-- Employee Performance Scores
CREATE TABLE IF NOT EXISTS employee_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  employee_id UUID REFERENCES employees(id),
  month INTEGER,
  year INTEGER,
  overall_score INTEGER DEFAULT 0,
  close_rate_score NUMERIC DEFAULT 0,
  revenue_score NUMERIC DEFAULT 0,
  deal_count_score NUMERIC DEFAULT 0,
  cycle_speed_score NUMERIC DEFAULT 0,
  consistency_score NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  close_rate NUMERIC DEFAULT 0,
  avg_deal_value NUMERIC DEFAULT 0,
  avg_cycle_days NUMERIC DEFAULT 0,
  ai_summary TEXT,
  ai_strengths JSONB,
  ai_improvements JSONB,
  ai_tip TEXT,
  ai_forecast TEXT,
  ai_comparison JSONB,
  ai_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, employee_id, month, year)
);

-- AI Column Mapping Templates
CREATE TABLE IF NOT EXISTS ai_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  headers_hash TEXT NOT NULL,
  sheet_type TEXT NOT NULL,
  mappings JSONB NOT NULL,
  stage_mapping JSONB,
  confidence INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, headers_hash)
);

-- AI Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  suggested_questions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  employee_id UUID REFERENCES employees(id),
  deal_id UUID REFERENCES deals(id),
  ticket_id UUID REFERENCES tickets(id),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Excel Upload History
CREATE TABLE IF NOT EXISTS excel_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  filename TEXT NOT NULL,
  file_url TEXT,
  sheets_count INTEGER DEFAULT 0,
  deals_imported INTEGER DEFAULT 0,
  tickets_imported INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  mapping_result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Development Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  team TEXT,
  start_date DATE,
  progress INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  remaining_tasks INTEGER DEFAULT 0,
  status_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partnerships
CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT,
  status TEXT,
  value NUMERIC DEFAULT 0,
  manager_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Targets / Goals
CREATE TABLE IF NOT EXISTS targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  month INTEGER,
  year INTEGER,
  revenue_target NUMERIC DEFAULT 0,
  close_rate_target NUMERIC DEFAULT 35,
  avg_deal_target NUMERIC DEFAULT 45000,
  cycle_days_target NUMERIC DEFAULT 14,
  response_time_target NUMERIC DEFAULT 5,
  resolution_rate_target NUMERIC DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, month, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_org_month ON deals(org_id, year, month);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_rep ON deals(assigned_rep_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org_month ON tickets(org_id, year, month);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(org_id, status);
CREATE INDEX IF NOT EXISTS idx_kpi_org_period ON kpi_snapshots(org_id, year, month);
CREATE INDEX IF NOT EXISTS idx_scores_emp_period ON employee_scores(org_id, employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON alerts(org_id, is_dismissed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mappings_hash ON ai_mappings(org_id, headers_hash);
