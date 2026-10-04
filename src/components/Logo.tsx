import { Crown } from 'lucide-react';

type LogoProps = {
  size?: number;
  className?: string;
  showGlow?: boolean;
};

export function Logo({ size = 48, className = '', showGlow = true }: LogoProps) {
  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center ${showGlow ? 'glow-cyan' : ''} ${className}`}
      style={{ width: size, height: size, boxShadow: showGlow ? 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(0,242,254,0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.25)' }}
    >
      <Crown className="text-white" strokeWidth={2.5} style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}

export function LogoText({ className = '' }: { className?: string }) {
  return (
    <h1 className={`text-3xl font-black tracking-tight text-white ${className}`}>
OMINI <span className="text-cyan-400 text-glow-cyan">APP</span>
    </h1>
  );
}
