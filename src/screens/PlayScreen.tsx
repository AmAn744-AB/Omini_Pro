import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { RotateCcw, Undo2, Trophy, Hash, Grid3x3, ChevronDown, CheckCircle2, AlertCircle, Plus, Layers, X, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { checkPrize, getPrizeProgress, getCalledCount } from '@/lib/omnipro';
import { loadUserSheets, sheetsToTickets, type UserSheet, type UserTicket } from '@/lib/userSheets';
import { formatSheetLabel } from '@/utils/sheetParser';
import { WinnerPopup, type WinnerInfo } from '@/components/WinnerPopup';
import type { Route } from '@/lib/router';
import { Card, Badge, Spinner, getBallColor, getBallColorName, getBallSolidColor } from '@/components/ui';

const ALL_NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1);

const PRIZE_LINES: { code: string; badge: string; name: string; line: string }[] = [
  { code: 'E5', badge: '5', name: 'Early 5', line: 'first_5' },
  { code: 'TL', badge: 'TL', name: 'Top Line', line: 'top_row' },
  { code: 'ML', badge: 'ML', name: 'Middle Line', line: 'middle_row' },
  { code: 'BL', badge: 'BL', name: 'Bottom Line', line: 'bottom_row' },
  { code: 'FH', badge: 'FH', name: 'Full House', line: 'full_house' },
];

const LEGEND_COLORS = [
  { range: '1-15', dot: '#ef4444' },
  { range: '16-30', dot: '#f97316' },
  { range: '31-45', dot: '#eab308' },
  { range: '46-60', dot: '#22c55e' },
  { range: '61-75', dot: '#3b82f6' },
  { range: '76-90', dot: '#a855f7' },
];

function HighlightedTicketGrid({ grid, matched, compact }: { grid: number[][]; matched: Set<number>; compact?: boolean }) {
  const cellSize = compact ? 'w-5 h-5 text-[8px]' : 'w-7 h-7 text-[10px]';
  return (
    <div className="inline-block rounded-lg overflow-hidden border border-blue-500/20">
      {grid.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((val, ci) => {
            const isMatched = val > 0 && matched.has(val);
            const isBlank = val === 0;
            return (
              <div
                key={ci}
                className={`${cellSize} flex items-center justify-center font-bold border-r border-b border-blue-500/20 ${
                  isBlank
                    ? 'bg-ink-900'
                    : isMatched
                    ? 'bg-cyan-500/30 text-cyan-100 ring-1 ring-cyan-400/40'
                    : 'bg-ink-800 text-white'
                }`}
              >
                {isBlank ? '' : val}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function PlayScreen({ navigate }: { navigate: (r: Route) => void }) {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<UserSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [showKeypad, setShowKeypad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [showSheetPicker, setShowSheetPicker] = useState(false);
  const [winnerPopup, setWinnerPopup] = useState<WinnerInfo | null>(null);
  const [claimedPrizes, setClaimedPrizes] = useState<Set<string>>(new Set());
  const [viewingTicket, setViewingTicket] = useState<{ grid: number[][]; matched: number[]; matchedNumbers: number[]; label: string; ticketNumber: string } | null>(null);

  // Load user sheets from localStorage
  useEffect(() => {
    if (!user) return;
    const stored = loadUserSheets(user.id);
    setSheets(stored);
    if (stored.length > 0) setSelectedSheetId(stored[0].id);
    setLoading(false);
  }, [user]);

  const allTickets: UserTicket[] = useMemo(() => sheetsToTickets(sheets), [sheets]);
  const selectedSheet = sheets.find((s) => s.id === selectedSheetId) || null;
  const activeTickets: UserTicket[] = useMemo(() => {
    if (!selectedSheet) return [];
    return allTickets.filter((t) => t.sheet_id === selectedSheet.id);
  }, [allTickets, selectedSheet]);

  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);
  const drawnCount = drawnNumbers.length;
  const currentNumber = drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;

  // Automated prize checker — runs every time a new number is entered
  const checkAllPrizes = useCallback((newDrawn: number[], tickets: UserTicket[], alreadyClaimed: Set<string>) => {
    for (const ticket of tickets) {
      for (const prize of PRIZE_LINES) {
        const prizeKey = `${ticket.id}_${prize.line}`;
        if (alreadyClaimed.has(prizeKey)) continue;
        if (checkPrize(ticket.grid, newDrawn, prize.line)) {
          const matchedNumbers = ticket.grid.flat().filter((v) => v > 0 && new Set(newDrawn).has(v));
          setWinnerPopup({
            sheetNumber: ticket.sheet_number,
            sheetLabel: formatSheetLabel(ticket.sheet_number),
            ticketNumber: ticket.ticket_number,
            prizeName: prize.name,
            prizeCode: prize.code,
            grid: ticket.grid,
            matchedNumbers,
          });
          setClaimedPrizes((prev) => new Set(prev).add(prizeKey));
          return;
        }
      }
    }
  }, []);

  const enterNumber = async (num: number) => {
    if (entering) return;
    if (num < 1 || num > 90) { setError('Number must be 1-90'); return; }
    if (drawnSet.has(num)) { setError(`${num} already called`); return; }

    setEntering(true);
    setError(null);

    const newDrawn = [...drawnNumbers, num];
    setDrawnNumbers(newDrawn);

    // Check all active tickets for new prizes
    if (activeTickets.length > 0) {
      checkAllPrizes(newDrawn, activeTickets, claimedPrizes);
    }

    setManualNumber('');
    setEntering(false);
  };

  const undoNumber = () => {
    if (entering || drawnNumbers.length === 0) return;
    setDrawnNumbers((prev) => prev.slice(0, -1));
    setError(null);
  };

  const resetGame = () => {
    if (entering) return;
    setDrawnNumbers([]);
    setClaimedPrizes(new Set());
    setError(null);
    setWinnerPopup(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8 text-cyan-400" />
      </div>
    );
  }

  const remaining = 90 - drawnCount;

  return (
    <div className="space-y-4 animate-slide-up">
      <h1 className="text-2xl font-bold text-white">Play</h1>

      {/* Sheet selector */}
      <Card className="p-3 border-cyan-500/20">
        <button
          onClick={() => setShowSheetPicker(!showSheetPicker)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">
              {selectedSheet ? formatSheetLabel(selectedSheet.sheet_number) : 'Free Play (no sheet)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedSheet ? (
              <Badge color="cyan">{activeTickets.length} tickets</Badge>
            ) : (
              <Badge color="gray">no sheet</Badge>
            )}
            <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform ${showSheetPicker ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showSheetPicker && (
          <div className="mt-3 space-y-2 animate-slide-up">
            <button
              onClick={() => { setSelectedSheetId(null); setDrawnNumbers([]); setClaimedPrizes(new Set()); setShowSheetPicker(false); }}
              className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left ${
                !selectedSheetId ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-ink-900/60 text-ink-200 border border-blue-500/10 hover:border-cyan-500/20'
              }`}
            >
              Free Play (no sheet)
            </button>
            {sheets.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedSheetId(s.id); setDrawnNumbers([]); setClaimedPrizes(new Set()); setShowSheetPicker(false); }}
                className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left flex items-center justify-between ${
                  selectedSheetId === s.id ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-ink-900/60 text-ink-200 border border-blue-500/10 hover:border-cyan-500/20'
                }`}
              >
                <span>{formatSheetLabel(s.sheet_number)}</span>
                <span className="text-xs text-ink-400">6 tickets</span>
              </button>
            ))}
            <button
              onClick={() => { setShowSheetPicker(false); navigate('games'); }}
              className="w-full rounded-lg px-3 py-2.5 text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add New Sheet
            </button>
          </div>
        )}
      </Card>

      {/* Top stats bar */}
      <Card className="p-4 border-cyan-500/20">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center rounded-lg bg-ink-900/60 py-2.5 border border-blue-500/15">
            <div className="text-xl font-bold text-cyan-400">{drawnCount}</div>
            <div className="text-[10px] text-ink-400 uppercase tracking-wider">Count</div>
          </div>
          <div className="text-center rounded-lg bg-ink-900/60 py-2.5 border border-blue-500/15">
            <div className="text-xl font-bold text-white">{activeTickets.length}</div>
            <div className="text-[10px] text-ink-400 uppercase tracking-wider">Tickets</div>
          </div>
        </div>
      </Card>

      {/* Current Number Display + Called Numbers History */}
      {currentNumber && (
        <Card className="p-5 text-center border-cyan-500/20">
          <p className="text-xs text-ink-300 uppercase tracking-wider mb-2">Current Number</p>
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-2 animate-pop ${getBallColor(currentNumber)}`}>
            <span className="text-3xl font-bold">{currentNumber}</span>
          </div>
          <p className="text-sm text-ink-300">
            <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ background: getBallSolidColor(currentNumber) }} />
            {getBallColorName(currentNumber)} range
          </p>

          {drawnCount > 0 && (
            <div className="mt-4 pt-3 border-t border-blue-500/10">
              <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-2">Called Numbers ({drawnCount})</p>
              <div className="flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto">
                {drawnNumbers.map((n, i) => (
                  <div
                    key={`${n}-${i}`}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 ${getBallColor(n)} ${i === drawnCount - 1 ? 'ring-2 ring-cyan-400/50' : 'opacity-70'}`}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-crimson-400 bg-crimson-500/10 border border-crimson-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Manual Number Entry */}
      <div className="flex gap-2">
        <input
          type="number"
          value={manualNumber}
          onChange={(e) => setManualNumber(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && manualNumber) enterNumber(parseInt(manualNumber)); }}
          placeholder="# Enter called number"
          min={1}
          max={90}
          className="flex-1 rounded-xl bg-ink-800/80 border border-blue-500/20 px-4 py-3 text-white placeholder-ink-400 outline-none transition-all focus:border-cyan-500 focus:shadow-sm focus:shadow-cyan-500/20"
        />
        <button
          onClick={() => manualNumber && enterNumber(parseInt(manualNumber))}
          disabled={entering || !manualNumber}
          className="btn-3d-emerald rounded-xl px-6 py-3 disabled:opacity-50"
        >
          {entering ? <Spinner className="h-5 w-5" /> : 'Enter'}
        </button>
      </div>

      {/* Keypad Toggle */}
      <button
        onClick={() => setShowKeypad(!showKeypad)}
        className="btn-3d-dark w-full rounded-xl py-3 text-sm flex items-center justify-center gap-2"
      >
        <Grid3x3 className="w-4 h-4" />
        {showKeypad ? '# HIDE KEYPAD' : '# SHOW KEYPAD'}
        <ChevronDown className={`w-4 h-4 transition-transform ${showKeypad ? 'rotate-180' : ''}`} />
      </button>

      {/* 1-90 Color-coded number board */}
      {showKeypad && (
        <Card className="p-3 animate-slide-up border-cyan-500/20">
          <div className="grid grid-cols-9 gap-1.5">
            {ALL_NUMBERS.map((n) => {
              const isDrawn = drawnSet.has(n);
              const isCurrent = n === currentNumber;
              const colorCls = getBallColor(n);
              return (
                <button
                  key={n}
                  onClick={() => enterNumber(n)}
                  disabled={isDrawn || entering}
                  className={`aspect-square rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 active:scale-90 ${colorCls} ${
                    isCurrent
                      ? 'ball-current animate-pop'
                      : isDrawn
                      ? 'ball-drawn'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-1 px-1">
            {LEGEND_COLORS.map((lc) => (
              <div key={lc.range} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ background: lc.dot }} />
                <span className="text-[9px] text-ink-400">{lc.range}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button onClick={undoNumber} disabled={entering || drawnCount === 0} className="btn-3d-dark flex-1 rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50">
          <Undo2 className="w-4 h-4" /> Undo
        </button>
        <button onClick={resetGame} disabled={entering || drawnCount === 0} className="btn-3d-crimson flex-1 rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50">
          <RotateCcw className="w-4 h-4" /> Reset Game
        </button>
      </div>

      {/* Active tickets display with highlighted numbers */}
      {activeTickets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center border border-cyan-300/30 flex-shrink-0">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Your Tickets</h3>
              <p className="text-[10px] text-ink-400">Matched numbers highlighted in cyan</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {activeTickets.map((t) => {
              const called = getCalledCount(t.grid, drawnNumbers);
              return (
                <Card key={t.id} className="p-2.5 border-cyan-500/15">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-white">{t.ticket_number}</span>
                    <span className="text-[10px] text-cyan-400">{called}/15</span>
                  </div>
                  <div className="overflow-x-auto">
                    <HighlightedTicketGrid grid={t.grid} matched={drawnSet} compact />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Prize Status */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center border border-yellow-300/30 flex-shrink-0" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 0 12px rgba(245,158,11,0.2)' }}>
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Prize Status</h3>
            <p className="text-[10px] text-ink-400">Auto-detected as numbers are called</p>
          </div>
        </div>

        <div className="space-y-2">
          {PRIZE_LINES.map((prize) => {
            const isClaimed = activeTickets.some((t) => claimedPrizes.has(`${t.id}_${prize.line}`));
            const claimer = activeTickets.find((t) => claimedPrizes.has(`${t.id}_${prize.line}`));

            let bestProgress = { matched: 0, total: 0 };
            let canClaim = false;
            for (const t of activeTickets) {
              const prog = getPrizeProgress(t.grid, drawnNumbers, prize.line);
              if (prog.total > 0 && prog.matched / prog.total > bestProgress.matched / (bestProgress.total || 1)) {
                bestProgress = prog;
              }
              if (!claimedPrizes.has(`${t.id}_${prize.line}`) && checkPrize(t.grid, drawnNumbers, prize.line)) {
                canClaim = true;
              }
            }
            const pct = bestProgress.total > 0 ? Math.round((bestProgress.matched / bestProgress.total) * 100) : 0;
            const hasTickets = activeTickets.length > 0;

            return (
              <Card key={prize.line} className={`p-3 ${isClaimed ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 border ${
                      isClaimed
                        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        : 'bg-gradient-to-br from-ink-700 to-ink-900 text-cyan-400 border-cyan-500/25'
                    }`} style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                      {prize.badge}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate">{prize.name}</span>
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 flex-shrink-0">{prize.code}</span>
                      </div>
                      {hasTickets && !isClaimed && (
                        <span className="text-[10px] text-ink-400">{bestProgress.matched}/{bestProgress.total} matched</span>
                      )}
                      {isClaimed && claimer && (
                        <span className="text-[10px] text-cyan-400">by {claimer.ticket_number}</span>
                      )}
                    </div>
                  </div>

                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> CLAIMED
                    </span>
                  ) : hasTickets && canClaim ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex-shrink-0 animate-pulse">
                      <CheckCircle2 className="w-3 h-3" /> READY
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold bg-ink-700 text-ink-400 border border-ink-600 flex-shrink-0">
                      {hasTickets ? `${pct}%` : '--'}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Free play hint */}
      {!selectedSheet && (
        <p className="text-xs text-center text-ink-400 pt-2">
          Free Play mode — numbers are called locally. Select a sheet to track prizes and tickets.
        </p>
      )}

      {/* Winner Popup */}
      {winnerPopup && (
        <WinnerPopup
          winner={winnerPopup}
          onDismiss={() => setWinnerPopup(null)}
          onView={() => {
            setViewingTicket({
              grid: winnerPopup.grid,
              matched: winnerPopup.matchedNumbers,
              label: winnerPopup.sheetLabel,
              ticketNumber: winnerPopup.ticketNumber,
              matchedNumbers: winnerPopup.matchedNumbers,
            });
            setWinnerPopup(null);
          }}
        />
      )}

      {/* View Ticket modal from winner popup */}
      {viewingTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/85 backdrop-blur-md px-4" onClick={() => setViewingTicket(null)}>
          <Card className="p-6 max-w-sm w-full border-cyan-500/30 animate-pop" >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-white">{viewingTicket.label}</p>
                <p className="text-xs text-ink-400">{viewingTicket.ticketNumber}</p>
              </div>
              <button onClick={() => setViewingTicket(null)} className="p-1 text-ink-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center overflow-x-auto">
              <HighlightedTicketGrid grid={viewingTicket.grid} matched={new Set(viewingTicket.matched)} />
            </div>
            <p className="text-xs text-center text-ink-400 mt-3">
              {new Set(viewingTicket.matched).size} numbers matched
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
