/*
# Create tambola_sheets master table — official 1,500 sheet database

## Overview
Creates a new `tambola_sheets` table that stores the pre-generated official
1,500 Tambola sheets (Sheet #1 to Sheet #1500). Each sheet contains exactly
6 tickets, each ticket being a 3x9 grid (stored as JSONB array of 6 grids).

This is a shared read-only reference table — all authenticated users (and anon)
can browse and search these sheets, but only the system can insert/update/delete.

## New Table: tambola_sheets
- `id` (uuid, PK)
- `sheet_number` (int, NOT NULL, UNIQUE) — 1 to 1500
- `sheet_name` (text, NOT NULL) — e.g. "Sheet #1"
- `grids` (jsonb, NOT NULL) — array of 6 grids, each grid is 3x9 number array
- `created_at` (timestamptz, default now())

## Security
- RLS enabled.
- SELECT: public (anon + authenticated) — all users can browse the master sheet library.
- INSERT/UPDATE/DELETE: service role only (no anon/authenticated policies).
- The frontend will copy sheets from this master table into the user's own
  tambola_games/tambola_tickets tables when a user "adds" a sheet.

## Notes
1. This table is the canonical source of the 1,500 official sheets.
2. Users never write to this table — they copy sheets into their own games.
3. Seeding is done separately via execute_sql in batched INSERT statements.
*/

CREATE TABLE IF NOT EXISTS tambola_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_number int NOT NULL UNIQUE,
  sheet_name text NOT NULL,
  grids jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tambola_sheets ENABLE ROW LEVEL SECURITY;

-- All users can browse the master sheet library
DROP POLICY IF EXISTS "anon_select_sheets" ON tambola_sheets;
CREATE POLICY "anon_select_sheets" ON tambola_sheets FOR SELECT
  TO anon, authenticated USING (true);

-- Add index for fast sheet_number lookups (search by number)
CREATE INDEX IF NOT EXISTS idx_tambola_sheets_number ON tambola_sheets(sheet_number);
