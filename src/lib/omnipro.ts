// Omni Pro ticket generation utility
// Generates a standard 3x9 Omni Pro/Housie ticket grid:
// - 3 rows, 9 columns
// - Each row has exactly 5 numbers and 4 blanks
// - Column ranges: col 0 -> 1-9, col 1 -> 10-19, ..., col 8 -> 80-90
// - Numbers in each column are sorted ascending

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function columnRange(col: number): [number, number] {
  if (col === 0) return [1, 9];
  if (col === 8) return [80, 90];
  return [col * 10, col * 10 + 9];
}

export function generateTicketGrid(): number[][] {
  const grid: number[][] = Array.from({ length: 3 }, () => Array(9).fill(0));
  const numbersPerCol: number[] = Array(9).fill(0);

  const cols = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  let remaining = 15;
  for (const col of cols) {
    const maxForCol = Math.min(remaining, 2);
    const minForCol = Math.max(0, remaining - (8 - cols.indexOf(col)) * 2);
    const count = minForCol > 0 ? Math.max(minForCol, Math.min(maxForCol, 1 + Math.floor(Math.random() * 2))) : Math.min(maxForCol, Math.floor(Math.random() * 2) + 1);
    const actual = Math.min(count, maxForCol);
    numbersPerCol[col] = actual;
    remaining -= actual;
  }

  if (remaining > 0) {
    for (const col of cols) {
      if (remaining <= 0) break;
      if (numbersPerCol[col] < 2) {
        numbersPerCol[col]++;
        remaining--;
      }
    }
  }
  if (remaining < 0) {
    for (const col of cols) {
      if (remaining >= 0) break;
      if (numbersPerCol[col] > 0) {
        numbersPerCol[col]--;
        remaining++;
      }
    }
  }

  for (let col = 0; col < 9; col++) {
    const count = numbersPerCol[col];
    if (count === 0) continue;
    const [min, max] = columnRange(col);
    const pool = shuffle(Array.from({ length: max - min + 1 }, (_, i) => min + i));
    const picked = pool.slice(0, count).sort((a, b) => a - b);

    const rowOrder = shuffle([0, 1, 2]);
    const chosenRows = rowOrder.slice(0, count).sort((a, b) => a - b);

    for (let i = 0; i < count; i++) {
      grid[chosenRows[i]][col] = picked[i];
    }
  }

  for (let row = 0; row < 3; row++) {
    const count = grid[row].filter((v) => v > 0).length;
    if (count > 5) {
      const filledCols = grid[row].map((v, c) => v > 0 ? c : -1).filter((c) => c >= 0);
      const toRemove = shuffle(filledCols).slice(0, count - 5);
      for (const c of toRemove) grid[row][c] = 0;
    } else if (count < 5) {
      const blankCols = grid[row].map((v, c) => v === 0 ? c : -1).filter((c) => c >= 0);
      const needed = 5 - count;
      const toFill = shuffle(blankCols).slice(0, needed);
      for (const c of toFill) {
        const [min, max] = columnRange(c);
        const existing = new Set<number>();
        for (let r = 0; r < 3; r++) if (grid[r][c] > 0) existing.add(grid[r][c]);
        const pool = shuffle(Array.from({ length: max - min + 1 }, (_, i) => min + i).filter((n) => !existing.has(n)));
        if (pool.length > 0) grid[row][c] = pool[0];
      }
    }
  }

  for (let col = 0; col < 9; col++) {
    const vals: { row: number; val: number }[] = [];
    for (let row = 0; row < 3; row++) {
      if (grid[row][col] > 0) vals.push({ row, val: grid[row][col] });
    }
    vals.sort((a, b) => a.val - b.val);
    for (let row = 0; row < 3; row++) grid[row][col] = 0;
    vals.forEach((v, i) => { grid[vals[i].row][col] = v.val; });
  }

  return grid;
}

export function generateTicketNumber(index: number): string {
  return `T-${String(index).padStart(3, '0')}`;
}

export function checkPrize(grid: number[][], drawnNumbers: number[], prizeLine: string): boolean {
  const drawnSet = new Set(drawnNumbers);

  if (prizeLine === 'first_5') {
    for (let row = 0; row < 3; row++) {
      let count = 0;
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] > 0 && drawnSet.has(grid[row][col])) count++;
      }
      if (count >= 5) return true;
    }
    return false;
  }

  if (prizeLine === 'top_row') {
    return grid[0].every((v) => v === 0 || drawnSet.has(v));
  }

  if (prizeLine === 'middle_row') {
    return grid[1].every((v) => v === 0 || drawnSet.has(v));
  }

  if (prizeLine === 'bottom_row') {
    return grid[2].every((v) => v === 0 || drawnSet.has(v));
  }

  if (prizeLine === 'full_house') {
    return grid.every((row) => row.every((v) => v === 0 || drawnSet.has(v)));
  }

  if (prizeLine === 'four_corners') {
    const corners = [grid[0][0], grid[0][8], grid[2][0], grid[2][8]];
    return corners.every((v) => v > 0 && drawnSet.has(v));
  }

  if (prizeLine === 'ticket_corner') {
    const corners = [grid[0][0], grid[0][8], grid[2][0], grid[2][8]];
    return corners.every((v) => v > 0 && drawnSet.has(v));
  }

  if (prizeLine === 'sheet_corner') {
    const corners = [grid[0][0], grid[0][8], grid[2][0], grid[2][8]];
    return corners.every((v) => v > 0 && drawnSet.has(v));
  }

  if (prizeLine === 'full_house_1' || prizeLine === 'full_house_2' || prizeLine === 'full_house_3' || prizeLine === 'full_house_4') {
    return grid.every((row) => row.every((v) => v === 0 || drawnSet.has(v)));
  }

  return false;
}

export function getCalledCount(grid: number[][], drawnNumbers: number[]): number {
  const drawnSet = new Set(drawnNumbers);
  let count = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] > 0 && drawnSet.has(grid[row][col])) count++;
    }
  }
  return count;
}

export function getPrizeProgress(grid: number[][], drawnNumbers: number[], prizeLine: string): { matched: number; total: number } {
  const drawnSet = new Set(drawnNumbers);

  if (prizeLine === 'first_5') {
    let maxCount = 0;
    for (let row = 0; row < 3; row++) {
      let count = 0;
      let total = 0;
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] > 0) {
          total++;
          if (drawnSet.has(grid[row][col])) count++;
        }
      }
      if (count > maxCount) maxCount = count;
    }
    return { matched: maxCount, total: 5 };
  }

  if (prizeLine === 'top_row') {
    const nums = grid[0].filter((v) => v > 0);
    return { matched: nums.filter((v) => drawnSet.has(v)).length, total: nums.length };
  }

  if (prizeLine === 'middle_row') {
    const nums = grid[1].filter((v) => v > 0);
    return { matched: nums.filter((v) => drawnSet.has(v)).length, total: nums.length };
  }

  if (prizeLine === 'bottom_row') {
    const nums = grid[2].filter((v) => v > 0);
    return { matched: nums.filter((v) => drawnSet.has(v)).length, total: nums.length };
  }

  if (prizeLine === 'full_house') {
    const nums = grid.flat().filter((v) => v > 0);
    return { matched: nums.filter((v) => drawnSet.has(v)).length, total: nums.length };
  }

  if (prizeLine === 'four_corners') {
    const corners = [grid[0][0], grid[0][8], grid[2][0], grid[2][8]].filter((v) => v > 0);
    return { matched: corners.filter((v) => drawnSet.has(v)).length, total: corners.length };
  }

  if (prizeLine === 'ticket_corner' || prizeLine === 'sheet_corner') {
    const corners = [grid[0][0], grid[0][8], grid[2][0], grid[2][8]].filter((v) => v > 0);
    return { matched: corners.filter((v) => drawnSet.has(v)).length, total: corners.length };
  }

  if (prizeLine === 'full_house_1' || prizeLine === 'full_house_2' || prizeLine === 'full_house_3' || prizeLine === 'full_house_4') {
    const nums = grid.flat().filter((v) => v > 0);
    return { matched: nums.filter((v) => drawnSet.has(v)).length, total: nums.length };
  }

  return { matched: 0, total: 0 };
}
