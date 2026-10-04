export type ParsedSheet = {
  sheet_number: number;
  sheet_name: string;
  grids: number[][][];
};

export type ParsedRow = {
  sheet_number: number;
  ticket_number: string;
  grid: number[][];
};

type RawCSVRow = {
  sheet_no: number;
  ticket_no: string;
  row1: number[];
  row2: number[];
  row3: number[];
};

const PIPE_OR_COMMA = /[|,]/;

function parseNumberList(cell: string): number[] {
  return cell
    .split(PIPE_OR_COMMA)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => !isNaN(n) && n >= 0);
}

function padGridRow(row: number[], targetLen = 9): number[] {
  const padded = row.slice(0, targetLen);
  while (padded.length < targetLen) padded.push(0);
  return padded;
}

/**
 * Parses CSV text with structure: SheetNo,TicketNo,Row1,Row2,Row3
 * - Delimiters: comma, tab, or semicolon
 * - Row1/Row2/Row3 may be pipe-separated or comma-separated within a quoted cell
 * - Strips all branding, filenames, and source headers
 * - Labels sheets generically as "Sheet #N"
 */
export function parseSheetCSV(text: string): ParsedSheet[] {
  const delimiter = text.includes('\t') ? '\t' : text.includes(';') && !text.includes(',') ? ';' : ',';
  const rawLines = text.split(/\r?\n/).filter((l) => l.trim());
  if (rawLines.length === 0) return [];

  // Detect and skip header row
  const firstCols = rawLines[0].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
  const hasHeader = firstCols.some((c) => /sheet|ticket|row|number|grid/i.test(c) && isNaN(Number(c)));
  const dataLines = hasHeader ? rawLines.slice(1) : rawLines;

  const rowMap = new Map<number, RawCSVRow[]>();

  for (const line of dataLines) {
    const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) continue;

    const sheetNo = parseInt(cols[0], 10);
    if (isNaN(sheetNo) || sheetNo < 1) continue;

    const ticketNo = cols[1] || '';
    // Row1, Row2, Row3 are the remaining columns
    // They may be 3 separate columns, or combined with pipes
    let row1: number[], row2: number[], row3: number[];

    if (cols.length >= 5) {
      row1 = parseNumberList(cols[2]);
      row2 = parseNumberList(cols[3]);
      row3 = parseNumberList(cols[4]);
    } else if (cols.length === 4) {
      // Maybe Row1+Row2 combined, Row3 separate, or Row1 separate and Row2+Row3 combined
      row1 = parseNumberList(cols[2]);
      row2 = parseNumberList(cols[3]);
      row3 = [];
    } else if (cols.length === 3) {
      // All numbers in one column, pipe-separated — 27 numbers total
      const allNums = parseNumberList(cols[2]);
      row1 = allNums.slice(0, 9);
      row2 = allNums.slice(9, 18);
      row3 = allNums.slice(18, 27);
    } else {
      continue;
    }

    const existing = rowMap.get(sheetNo) || [];
    existing.push({ sheet_no: sheetNo, ticket_no: ticketNo, row1, row2, row3 });
    rowMap.set(sheetNo, existing);
  }

  // Group every 6 tickets per sheet number into a sheet
  const sheets: ParsedSheet[] = [];
  const sortedSheetNos = [...rowMap.keys()].sort((a, b) => a - b);

  for (const sheetNo of sortedSheetNos) {
    const rows = rowMap.get(sheetNo)!;
    // Take first 6 tickets per sheet
    const tickets = rows.slice(0, TICKETS_PER_SHEET);
    const grids: number[][][] = tickets.map((r) => [
      padGridRow(r.row1),
      padGridRow(r.row2),
      padGridRow(r.row3),
    ]);

    sheets.push({
      sheet_number: sheetNo,
      sheet_name: `Sheet #${sheetNo}`,
      grids,
    });
  }

  return sheets;
}

export const TICKETS_PER_SHEET = 6;

/**
 * Formats a sheet number for display: 1 -> "SHEET 01", 12 -> "SHEET 12", 500 -> "SHEET 500"
 */
export function formatSheetLabel(sheetNumber: number): string {
  if (sheetNumber < 100) return `SHEET ${String(sheetNumber).padStart(2, '0')}`;
  return `SHEET ${sheetNumber}`;
}
