import { generateTicketGrid } from '@/lib/omnipro';
import type { TambolaSheet } from '@/lib/supabase';

export const TOTAL_SHEETS = 500;
export const BROWSE_PER_PAGE = 100;

let cachedSheets: TambolaSheet[] | null = null;

export function getLocalSheets(): TambolaSheet[] {
  if (cachedSheets) return cachedSheets;
  const sheets: TambolaSheet[] = [];
  for (let i = 1; i <= TOTAL_SHEETS; i++) {
    const grids: number[][][] = [];
    for (let t = 0; t < 6; t++) {
      grids.push(generateTicketGrid());
    }
    sheets.push({
      id: `local-${i}`,
      sheet_number: i,
      sheet_name: `Sheet #${i}`,
      grids,
      created_at: new Date().toISOString(),
    });
  }
  cachedSheets = sheets;
  return sheets;
}

export function getLocalSheetPage(page: number): TambolaSheet[] {
  const all = getLocalSheets();
  const from = (page - 1) * BROWSE_PER_PAGE;
  return all.slice(from, from + BROWSE_PER_PAGE);
}

export function getLocalSheetByNumber(num: number): TambolaSheet | null {
  const all = getLocalSheets();
  return all.find((s) => s.sheet_number === num) || null;
}
