import type { Route } from '@/lib/router';

const navItems: { route: Route; label: string; emoji: string }[] = [
  { route: 'home', label: 'Home', emoji: '🏠' },
  { route: 'games', label: 'My Sheets', emoji: '📚' },
  { route: 'draw', label: 'Play', emoji: '🎮' },
  { route: 'plans', label: 'Plans', emoji: '👑' },
  { route: 'profile', label: 'Profile', emoji: '👥' },
];

export function BottomNav({ route, navigate }: { route: Route; navigate: (r: Route) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="mx-auto max-w-md glass border-t border-blue-500/20">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const active = route === item.route;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
                  active ? 'text-cyan-400' : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 text-base ${active ? 'bg-cyan-500/15 border border-cyan-500/30' : ''}`}
                  style={active ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px rgba(0,242,254,0.15)' } : undefined}
                >
                  {item.emoji}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'font-bold text-glow-cyan' : ''}`}>{item.label}</span>
                {active && <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-cyan-400 glow-cyan" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
