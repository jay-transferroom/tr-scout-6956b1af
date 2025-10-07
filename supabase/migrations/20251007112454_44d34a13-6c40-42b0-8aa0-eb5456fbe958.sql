-- Add AI summary and language columns to reports table
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS summary_language VARCHAR(10) DEFAULT 'en';