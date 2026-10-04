/*
# OmniPro — Projects, Tasks, and Profiles

## Overview
Creates the core data tables for the OmniPro SaaS dashboard:
- `projects` — each project belongs to a user, has a name, description, status, and color
- `tasks` — each task belongs to a project, has a title, status, priority, and due date
- `profiles` — extends auth.users with display name, avatar URL, and subscription tier

## New Tables

### projects
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, NOT NULL DEFAULT auth.uid())
- `name` (text, NOT NULL)
- `description` (text, nullable)
- `status` (text, default 'active' — one of: active, paused, completed, archived)
- `color` (text, default 'emerald' — for UI accent)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### tasks
- `id` (uuid, PK)
- `project_id` (uuid, FK → projects ON DELETE CASCADE)
- `user_id` (uuid, FK → auth.users, NOT NULL DEFAULT auth.uid())
- `title` (text, NOT NULL)
- `description` (text, nullable)
- `status` (text, default 'todo' — one of: todo, in_progress, done)
- `priority` (text, default 'medium' — one of: low, medium, high)
- `due_date` (date, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### profiles
- `id` (uuid, PK, FK → auth.users ON DELETE CASCADE)
- `display_name` (text, default '')
- `avatar_url` (text, nullable)
- `subscription_tier` (text, default 'free' — one of: free, pro, enterprise)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- Owner-scoped CRUD on projects and tasks (auth.uid() = user_id).
- Profiles: users can read/update only their own profile.
- All policies scoped TO authenticated.

## Notes
1. user_id columns default to auth.uid() so client inserts that omit user_id succeed.
2. Tasks are scoped through the project's user_id for ownership verification.
3. A trigger auto-creates a profile row when a new auth.users record is created.
*/

-- ── projects ──
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  color text NOT NULL DEFAULT 'emerald',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── tasks ──
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- ── profiles ──
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free','pro','enterprise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
