import { ArrowLeft, Shield, Users, Trophy, Ticket, Hash, Heart } from 'lucide-react';
import type { Route } from '@/lib/router';
import { Logo } from '@/components/Logo';

export function AboutScreen({ navigate }: { navigate: (r: Route) => void }) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('profile')} className="p-2 -ml-2 text-ink-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Logo size={48} showGlow={false} />
        <div>
          <h1 className="text-2xl font-bold text-white">Omini App</h1>
          <p className="text-sm text-ink-300">The all-in-one game management platform</p>
        </div>
      </div>

      <div className="glass border border-blue-500/15 rounded-2xl p-6 space-y-3 shadow-lg shadow-black/20">
        <p className="text-sm text-ink-100 leading-relaxed">
          Omini App brings your game hosting into one beautifully designed platform. Create sheets,
          generate authentic tickets, run live draws with animated number calling, and track prize
          winners — all from your phone.
        </p>
        <p className="text-sm text-ink-200 leading-relaxed">
          Whether you're hosting a casual game night with friends or running a large-scale event,
          Omini App gives you the tools to manage tickets, prizes, and draws with ease. The standard
          90-number format with 3x9 ticket grids follows authentic Housie rules.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Ticket, title: 'Ticket Generation', desc: 'Authentic 3x9 grid tickets' },
          { icon: Hash, title: 'Live Draw System', desc: 'Manual & keypad number calling' },
          { icon: Trophy, title: 'Prize Tracking', desc: 'Early 5, Lines, Corners, Full House' },
          { icon: Hash, title: 'Number Board', desc: 'Real-time 1-90 color-coded board' },
          { icon: Users, title: 'Multi-Game Support', desc: 'Host multiple games' },
          { icon: Shield, title: 'Secure & Private', desc: 'Your games, your data' },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="glass border border-blue-500/15 rounded-2xl p-4 shadow-lg shadow-black/20">
              <Icon className="w-5 h-5 text-cyan-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="text-xs text-ink-300 mt-0.5">{f.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-ink-400">
          Built with <Heart className="inline w-3 h-3 text-cyan-400" /> by the Omini App team
        </p>
        <p className="text-xs text-ink-400 mt-1">Version 1.0.0 — © 2026 Omini App</p>
      </div>
    </div>
  );
}
