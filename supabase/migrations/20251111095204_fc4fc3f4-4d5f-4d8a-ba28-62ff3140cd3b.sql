-- Add watch_method column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS watch_method text CHECK (watch_method IN ('Live', 'Video', 'Data'));