/*
# Tambola 10x Pro — Games, Tickets, and Draws

## Overview
Creates the core data tables for the Tambola 10x Pro game management platform:
- `tambola_games` — each game belongs to an organizer (user), has a name, status, prize config, and ticket settings
- `tambola_tickets` — each ticket belongs to a game, has a unique ticket number, a 3x9 grid of numbers, and claim status
- `tambola_draws` — each draw belongs to a game, tracks the called numbers and current game state

## New Tables

### tambola_games
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, NOT NULL DEFAULT auth.uid())
- `name` (text, NOT NULL) — game name e.g. "Sunday Night Tambola"
- `description` (text, nullable)
- `status` (text, default 'waiting' — one of: waiting, active, paused, completed)
- `max_tickets` (int, default 100) — maximum tickets for this game
- `ticket_price` (numeric, default 0) — price per ticket
- `prizes_config` (jsonb, default) — JSON array of prize definitions (name, line, amount)
- `drawn_numbers` (int[], default '{}') — array of called numbers 1-90
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### tambola_tickets
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, NOT NULL DEFAULT auth.uid())
- `game_id` (uuid, FK → tambola_games ON DELETE CASCADE)
- `ticket_number` (text, NOT NULL) — human-readable ticket ID e.g. "T-001"
- `grid` (jsonb, NOT NULL) — 3x9 grid of numbers (0 = blank cell)
- `claimed_prizes` (text[], default '{}') — array of claimed prize names
- `status` (text, default 'unclaimed' — one of: unclaimed, claimed, winner)
- `created_at` (timestamptz, default now())

### tambola_draws
- `id` (uuid, PK)
- `game_id` (uuid, FK → tambola_games ON DELETE CASCADE, unique — one draw record per game)
- `user_id` (uuid, FK → auth.users, NOT NULL DEFAULT auth.uid())
- `current_number` (int, nullable) — last drawn number
- `drawn_order` (int[], default '{}') — numbers in draw order
- `is_active` (bool, default false)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- Owner-scoped CRUD on all tables (auth.uid() = user_id).
- All policies scoped TO authenticated.

## Notes
1. user_id columns default to auth.uid() so client inserts that omit user_id succeed.
2. tambola_tickets scoped through game ownership for verification.
3. drawn_numbers on the game allows quick access without joining draws table.
4. prizes_config stores flexible prize definitions as JSONB.
*/

-- ── tambola_games ──
CREATE TABLE IF NOT EXISTS tambola_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','paused','completed')),
  max_tickets int NOT NULL DEFAULT 100,
  ticket_price numeric NOT NULL DEFAULT 0,
  prizes_config jsonb NOT NULL DEFAULT '[{"name":"Quick 5","line":"first_5","amount":100},{"name":"Top Line","line":"top_row","amount":200},{"name":"Middle Line","line":"middle_row","amount":200},{"name":"Bottom Line","line":"bottom_row","amount":200},{"name":"Full House","line":"full_house","amount":500}]'::jsonb,
  drawn_numbers int[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tambola_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_games" ON tambola_games;
CREATE POLICY "select_own_games" ON tambola_games FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_games" ON tambola_games;
CREATE POLICY "insert_own_games" ON tambola_games FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_games" ON tambola_games;
CREATE POLICY "update_own_games" ON tambola_games FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_games" ON tambola_games;
CREATE POLICY "delete_own_games" ON tambola_games FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── tambola_tickets ──
CREATE TABLE IF NOT EXISTS tambola_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES tambola_games(id) ON DELETE CASCADE,
  ticket_number text NOT NULL,
  grid jsonb NOT NULL,
  claimed_prizes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed','claimed','winner')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tambola_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON tambola_tickets;
CREATE POLICY "select_own_tickets" ON tambola_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tickets" ON tambola_tickets;
CREATE POLICY "insert_own_tickets" ON tambola_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON tambola_tickets;
CREATE POLICY "update_own_tickets" ON tambola_tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tickets" ON tambola_tickets;
CREATE POLICY "delete_own_tickets" ON tambola_tickets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tambola_tickets_game_id ON tambola_tickets(game_id);
CREATE INDEX IF NOT EXISTS idx_tambola_tickets_user_id ON tambola_tickets(user_id);

-- ── tambola_draws ──
CREATE TABLE IF NOT EXISTS tambola_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES tambola_games(id) ON DELETE CASCADE UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  current_number int,
  drawn_order int[] NOT NULL DEFAULT '{}',
  is_active bool NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tambola_draws ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_draws" ON tambola_draws;
CREATE POLICY "select_own_draws" ON tambola_draws FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_draws" ON tambola_draws;
CREATE POLICY "insert_own_draws" ON tambola_draws FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_draws" ON tambola_draws;
CREATE POLICY "update_own_draws" ON tambola_draws FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_draws" ON tambola_draws;
CREATE POLICY "delete_own_draws" ON tambola_draws FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tambola_draws_game_id ON tambola_draws(game_id);
CREATE INDEX IF NOT EXISTS idx_tambola_games_user_id ON tambola_games(user_id);
