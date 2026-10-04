import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, X, AlertCircle, Search, ChevronLeft, ChevronRight, Ticket as TicketIcon, Crown, Check, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase, type PrizeConfig, type TambolaSheet } from '@/lib/supabase';
import { generateTicketNumber } from '@/lib/omnipro';
import { formatSheetLabel } from '@/utils/sheetParser';
import { getLocalSheetPage, getLocalSheetByNumber } from '@/data/sheetsData';
import { Card, Badge, Button, EmptyState, Spinner } from '@/components/ui';


const DEFAULT_PRIZES: PrizeConfig[] = [
  { name: 'Early 5', line: 'first_5', amount: 100 },
  { name: 'Top Line', line: 'top_row', amount: 200 },
  { name: 'Middle Line', line: 'middle_row', amount: 200 },
  { name: 'Bottom Line', line: 'bottom_row', amount: 200 },
  { name: 'Four Corners', line: 'four_corners', amount: 300 },
  { name: 'Full House', line: 'full_house', amount: 500 },
];

const MAX_FREE_SHEETS = 15;
const BROWSE_PER_PAGE = 100;
const TOTAL_SHEETS = 500;
const TOTAL_BROWSE_PAGES = Math.ceil(TOTAL_SHEETS / BROWSE_PER_PAGE);
const STORAGE_KEY = 'user_active_sheets';

type ModalTab = 'search' | 'browse';

type LocalSheet = {
  id: string;
  sheet_number: number;
  sheet_name: string;
  grids: number[][][];
  added_at: string;
};

type LocalTicket = {
  id: string;
  sheet_id: string;
  ticket_number: string;
  grid: number[][];
  status: 'unclaimed' | 'claimed' | 'winner';
};

function TicketGrid({ grid, compact }: { grid: number[][]; compact?: boolean }) {
  const cellSize = compact ? 'w-5 h-5 text-[8px]' : 'w-7 h-7 text-[10px]';
  return (
    <div className="inline-block rounded-lg overflow-hidden border border-blue-500/20">
      {grid.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((val, ci) => (
            <div
              key={ci}
              className={`${cellSize} flex items-center justify-center font-bold border-r border-b border-blue-500/20 ${
                val === 0 ? 'bg-ink-900' : 'bg-ink-800 text-white'
              }`}
            >
              {val === 0 ? '' : val}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function loadStoredSheets(userId: string): LocalSheet[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as LocalSheet[];
  } catch {
    return [];
  }
}

function saveStoredSheets(userId: string, sheets: LocalSheet[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(sheets));
  } catch { /* storage full or unavailable — state still works in-memory */ }
}

function sheetsToTickets(sheets: LocalSheet[]): LocalTicket[] {
  const tickets: LocalTicket[] = [];
  for (const sheet of sheets) {
    for (let i = 0; i < sheet.grids.length; i++) {
      tickets.push({
        id: `${sheet.id}_t${i}`,
        sheet_id: sheet.id,
        ticket_number: generateTicketNumber(i + 1),
        grid: sheet.grids[i],
        status: 'unclaimed' as const,
      });
    }
  }
  return tickets;
}

export function MySheetsScreen() {
  const { user, isAdmin } = useAuth();
  const [sheets, setSheets] = useState<LocalSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modalTab, setModalTab] = useState<ModalTab>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [browsePage, setBrowsePage] = useState(1);
  const [masterSheets, setMasterSheets] = useState<TambolaSheet[]>([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<Set<number>>(new Set());
  const [previewSheet, setPreviewSheet] = useState<TambolaSheet | null>(null);

  const maxSheets = isAdmin ? Infinity : MAX_FREE_SHEETS;
  const usedSheets = sheets.length;
  const availableSheets = Math.max(0, maxSheets === Infinity ? Infinity : maxSheets - usedSheets);

  // Load from localStorage on mount — no DB dependency, no error banners
  useEffect(() => {
    if (!user) return;
    const stored = loadStoredSheets(user.id);
    setSheets(stored);
    setLoading(false);

    // Silently try DB sync in background — errors are swallowed
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('tambola_games')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!err && data && data.length > 0 && stored.length === 0) {
          // DB has data but localStorage is empty — import from DB
          const dbSheets: LocalSheet[] = [];
          for (const game of data) {
            const { data: ticketData } = await supabase
              .from('tambola_tickets')
              .select('grid, ticket_number')
              .eq('game_id', game.id);
            if (ticketData && ticketData.length > 0) {
              const grids = ticketData.map((t) => (t as { grid: number[][] }).grid);
              const sheetNum = parseInt(game.name.replace(/^Sheet #/, ''), 10) || dbSheets.length + 1;
              dbSheets.push({
                id: game.id,
                sheet_number: sheetNum,
                sheet_name: game.name,
                grids,
                added_at: game.created_at,
              });
            }
          }
          if (dbSheets.length > 0) {
            setSheets(dbSheets);
            saveStoredSheets(user.id, dbSheets);
          }
        }
      } catch { /* silent — localStorage is source of truth */ }
    })();
  }, [user]);

  // Load master sheets when modal opens — falls back to local data if table unavailable
  const loadMasterSheets = useCallback(async (page: number) => {
    setMasterLoading(true);
    const from = (page - 1) * BROWSE_PER_PAGE;
    const to = from + BROWSE_PER_PAGE - 1;
    try {
      const { data, error: err } = await supabase
        .from('tambola_sheets')
        .select('*')
        .order('sheet_number', { ascending: true })
        .range(from, to);
      if (err || !data || data.length === 0) {
        setMasterSheets(getLocalSheetPage(page));
        setMasterLoading(false);
        return;
      }
      setMasterSheets(data as TambolaSheet[]);
    } catch {
      setMasterSheets(getLocalSheetPage(page));
    }
    setMasterLoading(false);
  }, []);

  const handleSearch = async () => {
    const q = searchQuery.trim().replace(/[#]/g, '').trim();
    if (!q) return;
    const num = parseInt(q, 10);
    if (isNaN(num) || num < 1 || num > TOTAL_SHEETS) {
      setError(`Invalid sheet number. Please enter a number between 1 and ${TOTAL_SHEETS}.`);
      return;
    }
    setError(null);
    setMasterLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('tambola_sheets')
        .select('*')
        .eq('sheet_number', num)
        .maybeSingle();
      if (err || !data) {
        const local = getLocalSheetByNumber(num);
        if (local) {
          setMasterSheets([local]);
        } else {
          setMasterSheets([]);
          setError(`SHEET ${String(num).padStart(2, '0')} not found.`);
        }
        setMasterLoading(false);
        return;
      }
      setMasterSheets([data as TambolaSheet]);
    } catch {
      const local = getLocalSheetByNumber(num);
      if (local) {
        setMasterSheets([local]);
      } else {
        setMasterSheets([]);
      }
    }
    setMasterLoading(false);
  };

  useEffect(() => {
    if (showAdd) {
      setModalTab('browse');
      setBrowsePage(1);
      setSearchQuery('');
      setSelectedSheets(new Set());
      setPreviewSheet(null);
      loadMasterSheets(1);
    }
  }, [showAdd, loadMasterSheets]);

  useEffect(() => {
    if (showAdd && modalTab === 'browse') {
      loadMasterSheets(browsePage);
    }
  }, [showAdd, modalTab, browsePage, loadMasterSheets]);

  const toggleSelectSheet = (sheetNumber: number) => {
    setSelectedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(sheetNumber)) {
        next.delete(sheetNumber);
      } else {
        if (!isAdmin && usedSheets + next.size >= MAX_FREE_SHEETS) {
          setError(`Free Trial Limit Reached: You can add up to ${MAX_FREE_SHEETS} sheets during trial.`);
          return prev;
        }
        next.add(sheetNumber);
      }
      return next;
    });
  };

  const addSelectedSheets = async () => {
    if (!user || selectedSheets.size === 0) return;

    // Check limit for non-admin
    if (!isAdmin && usedSheets + selectedSheets.size > MAX_FREE_SHEETS) {
      setError(`Free Trial Limit Reached: You can add up to ${MAX_FREE_SHEETS} sheets during trial.`);
      return;
    }

    setBusy(true);
    setError(null);

    // Resolve sheet data from master table or local fallback
    const sheetNums = [...selectedSheets].sort((a, b) => a - b);
    let sheetsData: TambolaSheet[] = [];
    try {
      const { data, error: fetchErr } = await supabase
        .from('tambola_sheets')
        .select('*')
        .in('sheet_number', sheetNums);
      if (fetchErr || !data || data.length === 0) throw new Error('fallback');
      sheetsData = data as TambolaSheet[];
    } catch {
      sheetsData = sheetNums.map((n) => getLocalSheetByNumber(n)).filter(Boolean) as TambolaSheet[];
    }

    // Build local sheet objects
    const now = new Date().toISOString();
    const newSheets: LocalSheet[] = sheetsData.map((sheet, idx) => ({
      id: `local_${Date.now()}_${sheet.sheet_number}_${idx}`,
      sheet_number: sheet.sheet_number,
      sheet_name: sheet.sheet_name,
      grids: sheet.grids as number[][][],
      added_at: now,
    }));

    // 1. Instantly store in state + localStorage
    const updatedSheets = [...sheets, ...newSheets];
    setSheets(updatedSheets);
    saveStoredSheets(user.id, updatedSheets);

    // 2. Close modal instantly
    setShowAdd(false);
    setSelectedSheets(new Set());
    setBusy(false);

    // 3. Silently attempt DB sync in background — errors swallowed
    (async () => {
      try {
        for (const sheet of newSheets) {
          const { data: gameData, error: gameError } = await supabase.from('tambola_games').insert({
            name: sheet.sheet_name,
            description: `${formatSheetLabel(sheet.sheet_number)} from master library`,
            max_tickets: 30,
            ticket_price: 10,
            prizes_config: DEFAULT_PRIZES,
          }).select().maybeSingle();

          if (gameError || !gameData) continue;
          const game = gameData as { id: string };

          const rows = sheet.grids.map((grid, i) => ({
            game_id: game.id,
            ticket_number: generateTicketNumber(i + 1),
            grid,
          }));

          await supabase.from('tambola_tickets').insert(rows);
        }
      } catch { /* silent — localStorage is the source of truth */ }
    })();
  };

  const deleteSheet = async (id: string) => {
    if (!user) return;
    // Remove from state + localStorage immediately
    const updated = sheets.filter((s) => s.id !== id);
    setSheets(updated);
    saveStoredSheets(user.id, updated);
    if (expandedSheet === id) setExpandedSheet(null);

    // Silently attempt DB delete
    try {
      await supabase.from('tambola_games').delete().eq('id', id);
    } catch { /* silent */ }
  };

  const ticketsBySheet = useMemo(() => {
    const map = new Map<string, LocalTicket[]>();
    for (const sheet of sheets) {
      const tickets: LocalTicket[] = sheet.grids.map((grid, i) => ({
        id: `${sheet.id}_t${i}`,
        sheet_id: sheet.id,
        ticket_number: generateTicketNumber(i + 1),
        grid,
        status: 'unclaimed' as const,
      }));
      map.set(sheet.id, tickets);
    }
    return map;
  }, [sheets]);

  const paginatedSheets = sheets.slice((currentPage - 1) * 10, currentPage * 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8 text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Sheets</h1>
        <button onClick={() => setShowAdd(true)} className="btn-3d-cyan h-11 px-4 rounded-xl flex items-center justify-center gap-2">
          <Plus className="w-5 h-5 strokeWidth-2.5" />
          <span className="text-sm font-bold">ADD</span>
        </button>
      </div>

      {error && !showAdd && (
        <div className="flex items-center gap-2 text-sm text-crimson-400 bg-crimson-500/10 border border-crimson-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 border-cyan-500/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">📚</span>
            <span className="text-xs text-ink-300">TOTAL Sheets</span>
          </div>
          <div className="text-2xl font-bold text-white">{usedSheets}</div>
        </Card>
        <Card className={`p-4 ${isAdmin ? 'border-amber-500/30' : 'border-emerald-500/20'}`}>
          <div className="flex items-center gap-2 mb-1">
            {isAdmin ? <Crown className="w-4 h-4 text-amber-400" /> : <span className="text-sm">⚡</span>}
            <span className="text-xs text-ink-300">{isAdmin ? 'Admin Access' : 'Available'}</span>
          </div>
          <div className={`text-2xl font-bold ${isAdmin ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isAdmin ? 'UNLIMITED' : `${availableSheets} / ${MAX_FREE_SHEETS}`}
          </div>
          {isAdmin && <div className="text-[10px] text-amber-400/70 mt-0.5">Permanent Admin Access</div>}
        </Card>
      </div>

      {isAdmin && (
        <Card className="p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">ADMIN ACCESS</p>
              <p className="text-xs text-ink-300">Unlimited sheets & ticket generation enabled</p>
            </div>
          </div>
        </Card>
      )}

      {sheets.length === 0 ? (
        <>
          <EmptyState icon={() => <span className="text-3xl">📚</span>} title="No sheets yet" desc="Add your sheets from the master library of sheets." />
          <Button onClick={() => setShowAdd(true)} variant="primary">
            <span className="text-lg">➕</span> Add Your First Sheet
          </Button>
        </>
      ) : (
        <>
          {/* My sheets list with pagination */}
          <div className="space-y-2">
            {paginatedSheets.map((sheet) => {
              const sheetTickets = ticketsBySheet.get(sheet.id) || [];
              const isExpanded = expandedSheet === sheet.id;
              return (
                <Card key={sheet.id} className={`p-4 ${isExpanded ? 'border-cyan-500/50 shadow-cyan-500/10' : ''}`}>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white tracking-wide">{formatSheetLabel(sheet.sheet_number)}</span>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-ink-400 flex items-center gap-1">
                          <TicketIcon className="w-3 h-3" /> {sheetTickets.length} tickets
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setExpandedSheet(isExpanded ? null : sheet.id); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 active:scale-95 transition-all">
                        <Eye className="w-3 h-3" /> VIEW
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSheet(sheet.id); }} className="p-2 text-ink-400 hover:text-crimson-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 space-y-3 animate-slide-up">
                      <div className="grid grid-cols-2 gap-3">
                        {sheetTickets.map((t) => (
                          <div key={t.id} className="rounded-lg bg-ink-900/50 p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-white">{t.ticket_number}</span>
                            </div>
                            <div className="overflow-x-auto">
                              <TicketGrid grid={t.grid} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* My sheets pagination */}
          {Math.ceil(sheets.length / 10) > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-9 h-9 rounded-lg glass border border-blue-500/20 flex items-center justify-center text-ink-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(Math.ceil(sheets.length / 10), 7) }, (_, i) => {
                const tp = Math.ceil(sheets.length / 10);
                let page: number;
                if (tp <= 7) page = i + 1;
                else if (currentPage <= 4) page = i + 1;
                else if (currentPage >= tp - 3) page = tp - 6 + i;
                else page = currentPage - 3 + i;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${page === currentPage ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'glass border border-blue-500/15 text-ink-300 hover:text-white'}`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage((p) => Math.min(Math.ceil(sheets.length / 10), p + 1))} disabled={currentPage === Math.ceil(sheets.length / 10)}
                className="w-9 h-9 rounded-lg glass border border-blue-500/20 flex items-center justify-center text-ink-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Sheets Modal with dual tabs */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm px-4" onClick={() => !busy && setShowAdd(false)}>
          <Card className="w-full max-w-2xl p-0 animate-slide-up border-cyan-500/30 overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-blue-500/15 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Add Sheets</h2>
                  <p className="text-xs text-ink-400">
                    {isAdmin ? `Unlimited access — ${TOTAL_SHEETS} sheets available` : `${availableSheets} of ${MAX_FREE_SHEETS} remaining`}
                  </p>
                </div>
              </div>
              <button onClick={() => !busy && setShowAdd(false)} disabled={busy} className="p-1 text-ink-400 hover:text-white transition-colors disabled:opacity-30">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-3 border-b border-blue-500/15 bg-ink-900/40 flex-shrink-0">
              <button onClick={() => { setModalTab('search'); setMasterSheets([]); setSearchQuery(''); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${modalTab === 'search' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-ink-400 hover:text-ink-200 border border-transparent'}`}>
                <Search className="w-4 h-4" /> SEARCH
              </button>
              <button onClick={() => { setModalTab('browse'); setBrowsePage(1); setSearchQuery(''); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${modalTab === 'browse' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-ink-400 hover:text-ink-200 border border-transparent'}`}>
                <TicketIcon className="w-4 h-4" /> BROWSE
              </button>
            </div>

            {/* Modal Body - scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <div className="mb-3 flex items-center gap-2 text-sm text-crimson-400 bg-crimson-500/10 border border-crimson-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  <button onClick={() => setError(null)} className="ml-auto p-0.5"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}

              {/* Search Tab */}
              {modalTab === 'search' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                      placeholder={`Search by sheet number (#1 to #${TOTAL_SHEETS})...`}
                      autoFocus
                      className="w-full rounded-xl bg-ink-800/80 border border-blue-500/20 pl-10 pr-4 py-3 text-sm text-white placeholder-ink-400 outline-none transition-all focus:border-cyan-500"
                    />
                  </div>
                  <button onClick={handleSearch} disabled={masterLoading || !searchQuery.trim()}
                    className="btn-3d-cyan w-full rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {masterLoading ? <Spinner className="h-4 w-4" /> : <Search className="w-4 h-4" />}
                    Search Sheets
                  </button>

                  {masterLoading ? (
                    <div className="flex justify-center py-8"><Spinner className="h-8 w-8 text-cyan-400" /></div>
                  ) : masterSheets.length > 0 ? (
                    <div className="space-y-2">
                      {masterSheets.map((sheet) => {
                        const isSelected = selectedSheets.has(sheet.sheet_number);
                        return (
                          <div key={sheet.id} className={`rounded-xl border p-3 transition-all cursor-pointer ${isSelected ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-blue-500/15 bg-ink-900/40 hover:border-blue-500/30'}`}
                            onClick={() => toggleSelectSheet(sheet.sheet_number)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-ink-500'}`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-ink-950 strokeWidth-3" />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white tracking-wide">{formatSheetLabel(sheet.sheet_number)}</p>
                                  <p className="text-xs text-ink-400">6 tickets · 3x9 grid</p>
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setPreviewSheet(previewSheet?.id === sheet.id ? null : sheet); }}
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                                {previewSheet?.id === sheet.id ? 'Hide' : 'Preview'}
                              </button>
                            </div>
                            {previewSheet?.id === sheet.id && (
                              <div className="mt-3 grid grid-cols-3 gap-2 animate-slide-up">
                                {(sheet.grids as number[][][]).map((grid, i) => (
                                  <div key={i} className="flex flex-col items-center gap-1">
                                    <TicketGrid grid={grid} compact />
                                    <span className="text-[9px] text-ink-400">T-{String(i+1).padStart(3,'0')}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    !masterLoading && searchQuery && !error && (
                      <div className="text-center py-8">
                        <p className="text-sm text-ink-400">Enter a sheet number and click Search</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Browse Tab */}
              {modalTab === 'browse' && (
                <div className="space-y-3">
                  {masterLoading ? (
                    <div className="flex justify-center py-12"><Spinner className="h-8 w-8 text-cyan-400" /></div>
                  ) : (
                    <>
                      {/* 10x10 grid of sheet buttons */}
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {masterSheets.map((sheet) => {
                          const isSelected = selectedSheets.has(sheet.sheet_number);
                          return (
                            <button
                              key={sheet.id}
                              onClick={() => toggleSelectSheet(sheet.sheet_number)}
                              onDoubleClick={() => setPreviewSheet(previewSheet?.id === sheet.id ? null : sheet)}
                              className={`aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                                  : 'bg-ink-800/60 text-ink-300 border border-blue-500/15 hover:border-blue-500/30 hover:text-white'
                              }`}
                              title={formatSheetLabel(sheet.sheet_number)}
                            >
                              {String(sheet.sheet_number).padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>

                      {/* Preview panel */}
                      {previewSheet && (
                        <div className="rounded-xl border border-cyan-500/20 bg-ink-900/60 p-3 animate-slide-up">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-white tracking-wide">{formatSheetLabel(previewSheet.sheet_number)}</span>
                            <button onClick={() => setPreviewSheet(null)} className="p-0.5 text-ink-400 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(previewSheet.grids as number[][][]).map((grid, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <TicketGrid grid={grid} compact />
                                <span className="text-[9px] text-ink-400">T-{String(i+1).padStart(3,'0')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Browse pagination */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                          disabled={browsePage === 1 || masterLoading}
                          className="flex items-center gap-1 rounded-lg glass border border-blue-500/20 px-3 py-2 text-xs text-ink-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" /> PREV
                        </button>
                        <span className="text-xs text-ink-400">
                          Page {browsePage} / {TOTAL_BROWSE_PAGES}
                        </span>
                        <button
                          onClick={() => setBrowsePage((p) => Math.min(TOTAL_BROWSE_PAGES, p + 1))}
                          disabled={browsePage === TOTAL_BROWSE_PAGES || masterLoading}
                          className="flex items-center gap-1 rounded-lg glass border border-blue-500/20 px-3 py-2 text-xs text-ink-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          NEXT <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-blue-500/15 p-4 bg-ink-900/40 flex-shrink-0">
              <button
                onClick={addSelectedSheets}
                disabled={busy || selectedSheets.size === 0}
                className="btn-3d-cyan w-full rounded-xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? (
                  <><Spinner className="h-5 w-5" /> Adding {selectedSheets.size} sheet(s)...</>
                ) : (
                  <><Plus className="w-5 h-5" /> Add {selectedSheets.size > 0 ? `${selectedSheets.size} ` : ''}Selected Sheet{selectedSheets.size !== 1 ? 's' : ''}</>
                )}
              </button>
              {selectedSheets.size > 0 && (
                <p className="text-xs text-center text-ink-400 mt-2">
                  {selectedSheets.size} sheet(s) selected
                  {!isAdmin && ` · ${availableSheets - selectedSheets.size} remaining after add`}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
