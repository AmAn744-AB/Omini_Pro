import { useState } from 'react';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui';
import { Logo, LogoText } from '@/components/Logo';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, displayName);
    setBusy(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} />
          </div>
          <LogoText />
          <p className="mt-1 text-xs font-semibold tracking-[0.3em] text-cyan-500">PLAY • WIN</p>
          <p className="mt-3 text-sm text-ink-300">
            {mode === 'signin' ? 'Welcome back. Sign in to your dashboard.' : 'Create your account and get started.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-ink-200 mb-1.5">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full rounded-xl bg-ink-800/80 border border-blue-500/20 pl-11 pr-4 py-3 text-white placeholder-ink-400 outline-none transition-all focus:border-cyan-500 focus:shadow-sm focus:shadow-cyan-500/20"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl bg-ink-800/80 border border-blue-500/20 pl-11 pr-4 py-3 text-white placeholder-ink-400 outline-none transition-all focus:border-cyan-500 focus:shadow-sm focus:shadow-cyan-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl bg-ink-800/80 border border-blue-500/20 pl-11 pr-11 py-3 text-white placeholder-ink-400 outline-none transition-all focus:border-cyan-500 focus:shadow-sm focus:shadow-cyan-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-cyan-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-crimson-400 bg-crimson-500/10 border border-crimson-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-3d-cyan w-full rounded-xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Spinner className="h-5 w-5" /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-300">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="text-cyan-400 font-semibold hover:text-cyan-300"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
