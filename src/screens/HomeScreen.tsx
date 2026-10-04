import { useEffect, useState } from 'react';
import { Plus, Menu, ChevronRight, X, Hash, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase, type OmniProGame, type OmniProTicket } from '@/lib/supabase';
import type { Route } from '@/lib/router';
import { Card, Badge, Spinner } from '@/components/ui';
import { getAvatarEmoji } from '@/components/AvatarSelector';

const HOW_IT_WORKS_DETAILS: Record<string, { title: string; body: string; emoji: string }> = {
  '1': { title: 'Create a Sheet', body: 'Generate up to 6 tickets per sheet with authentic 3x9 grids. Each ticket follows standard rules: 3 rows, 9 columns, 5 numbers per row with 4 blanks. Numbers are sorted within their column ranges (1-9, 10-19, ..., 80-90).', emoji: '📚' },
  '2': { title: 'Start Playing', body: 'Enter called numbers manually using the input box, or tap directly on the 1-90 color-coded board. The board uses 6 color ranges (Red 1-15, Orange 16-30, Yellow 31-45, Green 46-60, Blue 61-75, Purple 76-90) for easy visual tracking. Toggle the keypad with the HIDE/SHOW KEYPAD button.', emoji: '🎮' },
  '3': { title: 'Track Prizes', body: 'Omini App automatically tracks all standard prize lines: Early 5 (first 5 numbers matched in any row), Top/Middle/Bottom lines, Four Corners, and Full House. Live progress bars show how close each ticket is to winning each prize.', emoji: '🏆' },
};

export function HomeScreen({ navigate }: { navigate: (r: Route) => void }) {
  const { user, profile, isAdmin } = useAuth();
  const [games, setGames] = useState<OmniProGame[]>([]);
  const [tickets, setTickets] = useState<OmniProTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [howItWorksModal, setHowItWorksModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: gameData }, { data: ticketData }] = await Promise.all([
        supabase.from('tambola_games').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('tambola_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setGames(gameData || []);
      setTickets(ticketData || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8 text-cyan-400" />
      </div>
    );
  }

  const totalTickets = tickets.length;
  const totalGames = games.length;
  const coins = totalTickets * 50;
  const gems = games.filter((g) => g.status === 'completed').length;
  const trophies = games.filter((g) => g.status === 'completed').length;
  const activeGames = games.filter((g) => g.status === 'active').length;

  const howItWorks = [
    { step: '1', title: 'Create a Sheet', desc: 'Generate up to 6 tickets per sheet with authentic 3x9 grids.' },
    { step: '2', title: 'Start Playing', desc: 'Enter called numbers manually or use the 1-90 color-coded board.' },
    { step: '3', title: 'Track Prizes', desc: 'Live progress on Early 5, Lines, Corners, and Full House.' },
  ];

  const chestItems = [
    { emoji: '📚', label: 'My Sheets', route: 'games' as Route, count: totalGames, color: 'amber' as const, accent: '#f59e0b' },
    { emoji: '🎁', label: 'Daily Rewards', route: 'plans' as Route, count: 0, color: 'cyan' as const, accent: '#22d3ee' },
    { emoji: '📊', label: 'Leaderboard', route: 'plans' as Route, count: trophies, color: 'cyan' as const, accent: '#3b82f6' },
    { emoji: '💳', label: 'Plans', route: 'plans' as Route, count: 0, color: 'amber' as const, accent: '#f59e0b' },
  ];

  const menuItems: { label: string; route: Route; emoji: string }[] = [
    { label: 'Profile', route: 'profile', emoji: '👥' },
    { label: 'About', route: 'about', emoji: 'ℹ️' },
    { label: 'Plans', route: 'plans', emoji: '👑' },
    { label: 'My Sheets', route: 'games', emoji: '📚' },
  ];

  return (
    <div className="space-y-5 animate-slide-up">
      {/* === TOP GAMING HEADER BAR === */}
      <div className="flex items-center gap-2 pt-1">
        {/* Coins / Balance Pill */}
        <div className="flex items-center gap-1.5 glass rounded-full pl-2.5 pr-1 py-1 border border-yellow-500/25">
          <span className="text-sm">🪙</span>
          <span className="text-sm font-bold text-white tabular-nums">{coins.toLocaleString()}</span>
          <button onClick={() => navigate('plans')} className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border border-emerald-300/30 active:scale-90 transition-transform" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </button>
        </div>

        {/* Sheets Available Pill */}
        <div className="flex items-center gap-1.5 glass rounded-full pl-2.5 pr-1 py-1 border border-cyan-500/25">
          <span className="text-sm">📚</span>
          <span className="text-sm font-bold text-white tabular-nums">{totalGames}</span>
          <button onClick={() => navigate('games')} className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border border-emerald-300/30 active:scale-90 transition-transform" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </button>
        </div>

        {/* Gems / Jackpot Pill with notification + menu */}
        <div className="flex items-center gap-1.5 glass rounded-full pl-2.5 pr-1.5 py-1 border border-purple-500/25 ml-auto">
          <span className="text-sm">💎</span>
          <span className="text-sm font-bold text-white tabular-nums">{gems}</span>
          {gems > 0 && (
            <span className="absolute -mt-3 ml-1 w-4 h-4 rounded-full bg-crimson-500 text-[8px] font-bold text-white flex items-center justify-center border border-crimson-300/30">
              {gems}
            </span>
          )}
          <button onClick={() => setMenuOpen(true)} className="ml-0.5 p-1 text-ink-300 hover:text-cyan-400 transition-colors">
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* === USER PROFILE & BADGE BANNER === */}
      <Card className="p-4 border-cyan-500/20">
        <div className="flex items-center gap-3">
          {/* Avatar in metallic bordered square */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ink-700 to-ink-900 flex items-center justify-center flex-shrink-0 border-2 border-cyan-400/40" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 0 12px rgba(0,242,254,0.15)' }}>
            <span className="text-3xl">{getAvatarEmoji(profile?.avatar_url || null)}</span>
          </div>

          {/* Username + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate uppercase tracking-wide">{profile?.display_name || 'Player'}</h2>
              {isAdmin && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <Shield className="w-2.5 h-2.5" /> ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                👑 LVL {Math.max(1, Math.floor(totalTickets / 6) + 1)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                🏆 {trophies}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                ⚡ VIP
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* === CENTER MAIN GAME CARD (HERO SECTION) === */}
      <Card className="p-6 text-center border-cyan-500/25 relative overflow-hidden" >
        {/* Glow background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(0,242,254,0.12), transparent 60%)' }} />

        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center border border-cyan-300/30 text-base" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
              👑
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">OMINI ROOM</h2>
          </div>
          <p className="text-xs font-semibold text-cyan-400 tracking-[0.2em] mb-4">TOUR {Math.max(1, totalGames + 1)}</p>

          {/* Prize pool details */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="rounded-lg bg-ink-900/60 py-2.5 border border-blue-500/15">
              <div className="text-lg font-bold text-cyan-400">{activeGames}</div>
              <div className="text-[9px] text-ink-400 uppercase tracking-wider">Active</div>
            </div>
            <div className="rounded-lg bg-ink-900/60 py-2.5 border border-emerald-500/15">
              <div className="text-lg font-bold text-emerald-400">{totalTickets}</div>
              <div className="text-[9px] text-ink-400 uppercase tracking-wider">Tickets</div>
            </div>
            <div className="rounded-lg bg-ink-900/60 py-2.5 border border-yellow-500/15">
              <div className="text-lg font-bold text-yellow-400">{coins}</div>
              <div className="text-[9px] text-ink-400 uppercase tracking-wider">Coins</div>
            </div>
          </div>

          {/* Big vibrant green 3D START GAME button */}
          <button
            onClick={() => navigate('draw')}
            className="btn-3d-emerald w-full rounded-2xl py-4 text-lg font-black tracking-wide flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(4,120,87,0.4), 0 6px 20px rgba(16,185,129,0.35), 0 0 40px rgba(16,185,129,0.15)' }}
          >
            <span className="text-2xl">🎮</span> START GAME
          </button>
        </div>
      </Card>

      {/* === BOTTOM REWARD / QUICK CHEST GRID === */}
      <div className="grid grid-cols-4 gap-2.5">
        {chestItems.map((item) => {
          return (
            <Card key={item.label} className="p-3 gaming-card text-center" onClick={() => navigate(item.route)}>
              <div className="relative mx-auto mb-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto border text-xl"
                  style={{
                    background: `linear-gradient(180deg, ${item.accent}22 0%, ${item.accent}08 100%)`,
                    borderColor: `${item.accent}40`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px ${item.accent}15`,
                  }}
                >
                  {item.emoji}
                </div>
                {item.count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-crimson-500 text-[9px] font-bold text-white flex items-center justify-center border border-crimson-300/30">
                    {item.count}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-semibold text-ink-200 leading-tight">{item.label}</p>
            </Card>
          );
        })}
      </div>

      {/* === RECENT SHEETS === */}
      {games.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-ink-200">Recent Sheets</h2>
            <button onClick={() => navigate('games')} className="text-xs text-cyan-400 font-medium">View all</button>
          </div>
          <div className="space-y-2">
            {games.slice(0, 3).map((g) => (
              <Card key={g.id} className="p-3 gaming-card" onClick={() => navigate('draw')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎫</span>
                    <span className="text-sm font-medium text-white">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-400">{g.drawn_numbers?.length || 0}/90</span>
                    <Badge color={g.status === 'active' ? 'cyan' : 'gray'}>{g.status}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* === HOW IT WORKS === */}
      <div>
        <h2 className="text-sm font-semibold text-ink-200 mb-2.5">How it works</h2>
        <div className="space-y-2">
          {howItWorks.map((item) => (
            <Card key={item.step} className="p-4 gaming-card" onClick={() => setHowItWorksModal(item.step)}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-ink-300 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-400 flex-shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* === HOW IT WORKS MODAL === */}
      {howItWorksModal && HOW_IT_WORKS_DETAILS[howItWorksModal] && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm px-4" onClick={() => setHowItWorksModal(null)}>
          <Card className="w-full max-w-sm p-6 space-y-4 animate-slide-up border-cyan-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">
                  {HOW_IT_WORKS_DETAILS[howItWorksModal].emoji}
                </div>
                <h2 className="text-lg font-bold text-white">{HOW_IT_WORKS_DETAILS[howItWorksModal].title}</h2>
              </div>
              <button onClick={() => setHowItWorksModal(null)} className="p-1 text-ink-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-ink-200 leading-relaxed">{HOW_IT_WORKS_DETAILS[howItWorksModal].body}</p>
            <button onClick={() => setHowItWorksModal(null)} className="btn-3d-cyan w-full rounded-xl py-3 text-sm">
              Got it
            </button>
          </Card>
        </div>
      )}

      {/* === HAMBURGER MENU DRAWER === */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div className="w-72 h-full glass border-l border-cyan-500/20 p-5 animate-slide-up flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center border border-cyan-300/30 text-lg" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
                  👑
                </div>
                <div>
                  <h2 className="text-base font-black text-white">OMINI <span className="text-cyan-400">APP</span></h2>
                  <p className="text-[10px] text-ink-400 tracking-wider">PLAY • WIN</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-ink-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User mini-card in menu */}
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-ink-900/60 border border-blue-500/15">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ink-700 to-ink-900 flex items-center justify-center border border-cyan-400/40">
                <span className="text-xl">{getAvatarEmoji(profile?.avatar_url || null)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{profile?.display_name || 'Player'}</p>
                <p className="text-[10px] text-ink-400 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              {menuItems.map((item) => {
                return (
                  <button
                    key={item.label}
                    onClick={() => { navigate(item.route); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-ink-200 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all active:scale-95"
                  >
                    <span className="text-lg">{item.emoji}</span>
                    {item.label}
                    <ChevronRight className="w-4 h-4 ml-auto text-ink-500" />
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  onClick={() => { navigate('admin'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-95"
                >
                  <span className="text-lg">⚙️</span>
                  Admin Panel
                  <ChevronRight className="w-4 h-4 ml-auto text-ink-500" />
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-blue-500/10">
              <p className="text-[10px] text-center text-ink-400">
                OMINI <span className="text-cyan-400">APP</span> — Online Tickets
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
