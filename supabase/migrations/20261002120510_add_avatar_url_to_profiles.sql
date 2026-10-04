-- Add avatar_url column to profiles for gaming avatar selection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
