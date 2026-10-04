import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onComplete(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 30%, #1a0b2e 60%, #0a0e1a 100%)',
      }}
    >
      {/* Animated background orbs */}
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0,242,254,0.15), transparent 70%)',
          top: '10%',
          left: '10%',
          animation: 'splash-orb-1 3s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(121,40,202,0.15), transparent 70%)',
          bottom: '10%',
          right: '5%',
          animation: 'splash-orb-2 3s ease-in-out infinite 0.5s',
        }}
      />

      {/* Logo */}
      <div
        className="relative flex flex-col items-center"
        style={{
          animation: phase === 'enter' ? 'splash-logo-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both'
                   : phase === 'hold' ? 'splash-logo-float 2s ease-in-out infinite'
                   : 'splash-logo-out 0.7s ease-in both',
        }}
      >
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5"
          style={{
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #7928ca 100%)',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), 0 0 40px rgba(0,242,254,0.4), 0 0 80px rgba(121,40,202,0.2)',
            border: '2px solid rgba(255,255,255,0.15)',
          }}
        >
          <Crown className="w-12 h-12 text-white" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
        </div>
        <h1
          className="text-4xl font-black tracking-tight text-white"
          style={{ animation: 'splash-text-in 0.8s ease-out 0.3s both' }}
        >
          OMINI <span style={{ background: 'linear-gradient(90deg, #00f2fe, #7928ca)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>APP</span>
        </h1>
        <p
          className="mt-2 text-sm font-semibold tracking-[0.4em] text-cyan-300/80"
          style={{ animation: 'splash-text-in 0.8s ease-out 0.5s both' }}
        >
          PLAY • WIN
        </p>
      </div>

      {/* Loading bar */}
      <div
        className="absolute bottom-32 w-48 h-1 rounded-full bg-white/10 overflow-hidden"
        style={{ animation: 'splash-text-in 0.8s ease-out 0.7s both' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #00f2fe, #7928ca)',
            animation: 'splash-bar 2s ease-in-out 0.5s both',
          }}
        />
      </div>
    </div>
  );
}
