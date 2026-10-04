import { type ReactNode } from 'react';
import { Trophy, X, Eye } from 'lucide-react';

export type WinnerInfo = {
  sheetNumber: number;
  sheetLabel: string;
  ticketNumber: string;
  prizeName: string;
  prizeCode: string;
  grid: number[][];
  matchedNumbers: number[];
};

function HighlightedGrid({ grid, matched }: { grid: number[][]; matched: Set<number> }) {
  return (
    <div className="inline-block rounded-lg overflow-hidden border border-cyan-500/30">
      {grid.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((val, ci) => {
            const isMatched = val > 0 && matched.has(val);
            const isBlank = val === 0;
            return (
              <div
                key={ci}
                className={`w-8 h-8 flex items-center justify-center text-xs font-bold border-r border-b border-cyan-500/20 ${
                  isBlank
                    ? 'bg-ink-900'
                    : isMatched
                    ? 'bg-cyan-500/30 text-cyan-100 ring-1 ring-cyan-400/50'
                    : 'bg-ink-800 text-ink-300'
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

export function WinnerPopup({
  winner,
  onDismiss,
  onView,
}: {
  winner: WinnerInfo;
  onDismiss: () => void;
  onView?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/85 backdrop-blur-md px-4 animate-fade-in">
      <div
        className="relative w-full max-w-sm rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-ink-900 to-ink-950 shadow-2xl shadow-cyan-500/20 animate-pop overflow-hidden"
      >
        {/* Glow header */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-cyan-500/15 to-transparent pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 text-ink-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-6 text-center">
          {/* Trophy icon with pulse */}
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center border border-yellow-300/30 animate-pulse" style={{ boxShadow: '0 0 24px rgba(245,158,11,0.4)' }}>
            <Trophy className="w-8 h-8 text-white" />
          </div>

          {/* Winner text */}
          <h2 className="text-xl font-black text-white tracking-wide mb-1">WINNER!</h2>
          <p className="text-sm font-bold text-cyan-400 mb-3">{winner.prizeName} Completed!</p>

          {/* Sheet & ticket info */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="rounded-lg bg-ink-800/80 border border-blue-500/20 px-3 py-1.5">
              <p className="text-[10px] text-ink-400 uppercase tracking-wider">Sheet</p>
              <p className="text-sm font-bold text-white">{winner.sheetLabel}</p>
            </div>
            <div className="rounded-lg bg-ink-800/80 border border-blue-500/20 px-3 py-1.5">
              <p className="text-[10px] text-ink-400 uppercase tracking-wider">Ticket</p>
              <p className="text-sm font-bold text-white">{winner.ticketNumber}</p>
            </div>
          </div>

          {/* Highlighted grid preview */}
          <div className="flex justify-center mb-4 overflow-x-auto">
            <HighlightedGrid grid={winner.grid} matched={new Set(winner.matchedNumbers)} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl bg-ink-700/80 text-ink-200 border border-ink-600 py-2.5 text-sm font-semibold hover:bg-ink-700 transition-all"
            >
              Dismiss
            </button>
            {onView && (
              <button
                onClick={onView}
                className="flex-1 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 py-2.5 text-sm font-semibold hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> View Ticket
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
