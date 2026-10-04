import { Card } from '@/components/ui';

export function PlansScreen() {
  return (
    <div className="space-y-4 animate-slide-up">
      <h1 className="text-2xl font-bold text-white">Plans</h1>

      <Card className="p-8 text-center border-cyan-500/20 glow-cyan">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 border border-cyan-300/30 text-3xl" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(0,242,254,0.2)' }}>
          👑
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Paid Plans Activation</h2>
        <p className="text-sm text-ink-300 leading-relaxed">
          बहुत जल्द आने वाला है। नए अपडेट जल्द आएंगे।
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <span>🕐</span> Coming Soon
        </div>
      </Card>

      <Card className="p-5 border-emerald-500/20">
        <h3 className="text-sm font-semibold text-white mb-3">Current Plan</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-300">Free Trial</span>
          <span className="text-sm font-bold text-cyan-400">ACTIVE</span>
        </div>
        <div className="mt-3 space-y-2">
          {['Unlimited sheet generation', 'Live draw with 1-90 color-coded board', 'Prize tracking (Early 5, Lines, Corners, Full House)', 'CSV/JSON sheet import & export (admin)'].map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-ink-200">
              <span className="text-sm">✅</span>
              {f}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
