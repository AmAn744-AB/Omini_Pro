import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}) {
  const base = 'w-full rounded-xl py-3 font-bold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2';
  const variants: Record<string, string> = {
    primary: 'btn-3d-cyan',
    secondary: 'btn-3d-dark',
    danger: 'btn-3d-crimson',
    ghost: 'text-ink-200 hover:text-white',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-200 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl bg-ink-800 border border-blue-500/20 px-4 py-3 text-white placeholder-ink-400 outline-none transition-all focus:border-cyan-500 focus:shadow-sm focus:shadow-cyan-500/20"
      />
    </div>
  );
}

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`glass border border-blue-500/15 rounded-2xl shadow-lg shadow-black/20 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-cyan-500/30 hover:shadow-cyan-500/10 active:scale-[0.98]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, color = 'cyan' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-crimson-500/10 text-crimson-400 border-crimson-500/20',
    gray: 'bg-ink-500/20 text-ink-300 border-ink-500/30',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.cyan}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl glass border border-blue-500/20 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-ink-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-ink-300 max-w-xs">{desc}</p>
    </div>
  );
}

export function getBallColor(n: number): string {
  if (n <= 15) return 'ball-red';
  if (n <= 30) return 'ball-orange';
  if (n <= 45) return 'ball-yellow';
  if (n <= 60) return 'ball-green';
  if (n <= 75) return 'ball-blue';
  return 'ball-purple';
}

export function getBallColorName(n: number): string {
  if (n <= 15) return 'Red';
  if (n <= 30) return 'Orange';
  if (n <= 45) return 'Yellow';
  if (n <= 60) return 'Green';
  if (n <= 75) return 'Blue';
  return 'Purple';
}

export function getBallSolidColor(n: number): string {
  if (n <= 15) return '#ef4444';
  if (n <= 30) return '#f97316';
  if (n <= 45) return '#eab308';
  if (n <= 60) return '#22c55e';
  if (n <= 75) return '#3b82f6';
  return '#a855f7';
}
