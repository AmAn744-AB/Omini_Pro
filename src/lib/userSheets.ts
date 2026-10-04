import { generateTicketNumber } from '@/lib/omnipro';
import { formatSheetLabel } from '@/utils/sheetParser';

const STORAGE_KEY = 'user_active_sheets';

export type UserSheet = {
  id: string;
  sheet_number: number;
  sheet_name: string;
  grids: number[][][];
  added_at: string;
};

export type UserTicket = {
  id: string;
  sheet_id: string;
  sheet_number: number;
  ticket_index: number;
  ticket_number: string;
  grid: number[][];
};

export function loadUserSheets(userId: string): UserSheet[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as UserSheet[];
  } catch {
    return [];
  }
}

export function saveUserSheets(userId: string, sheets: UserSheet[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(sheets));
  } catch { /* storage full or unavailable */ }
}

export function sheetsToTickets(sheets: UserSheet[]): UserTicket[] {
  const tickets: UserTicket[] = [];
  for (const sheet of sheets) {
    for (let i = 0; i < sheet.grids.length; i++) {
      tickets.push({
        id: `${sheet.id}_t${i}`,
        sheet_id: sheet.id,
        sheet_number: sheet.sheet_number,
        ticket_index: i,
        ticket_number: generateTicketNumber(i + 1),
        grid: sheet.grids[i],
      });
    }
  }
  return tickets;
}

export { formatSheetLabel };
