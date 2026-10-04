import { useState } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { Route } from '@/lib/router';
import { Card, Button, Input, Spinner } from '@/components/ui';
import { AvatarSelector, getAvatarEmoji } from '@/components/AvatarSelector';

export function ProfileScreen({ navigate }: { navigate: (r: Route) => void }) {
  const { user, profile, signOut, updateProfile, isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);

  const avatarEmoji = getAvatarEmoji(profile?.avatar_url || null);

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    const result = await updateProfile({ display_name: displayName });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    setEditing(false);
  };

  const handleAvatarSelect = async (avatarId: string) => {
    await updateProfile({ avatar_url: avatarId });
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      <Card className="p-6 text-center border-cyan-500/20">
        <button
          onClick={() => setShowAvatars(true)}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-3 border-2 border-cyan-300/30 hover:scale-105 active:scale-95 transition-transform"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(0,242,254,0.2)' }}
        >
          <span className="text-4xl">{avatarEmoji}</span>
        </button>
        <p className="text-xs text-cyan-400 font-medium mb-2">Tap avatar to change</p>
        <h2 className="text-lg font-bold text-white">{profile?.display_name || 'Omini Host'}</h2>
        <p className="text-sm text-ink-300 flex items-center justify-center gap-1.5 mt-1">
          <span>✉️</span> {user?.email}
        </p>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span>🛡️</span> Dealer / Member
          </span>
        </div>
      </Card>

      <Card className="p-4 border-blue-500/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🆔</span>
            <span className="text-xs text-ink-300">User ID</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs text-ink-200 font-mono">{user?.id.slice(0, 12)}...</code>
            <button onClick={copyUserId} className="p-1.5 rounded-lg text-ink-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
              {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {editing ? (
          <div className="space-y-3">
            <Input label="Display Name" value={displayName} onChange={setDisplayName} placeholder="Your name" />
            {error && <p className="text-sm text-crimson-400">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setEditing(false); setError(null); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={busy}>
                {busy ? <Spinner className="h-5 w-5 mx-auto" /> : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="w-full flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Display Name</p>
              <p className="text-xs text-ink-300">{profile?.display_name || 'Not set'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-400" />
          </button>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        <button onClick={() => navigate('about')} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-blue-500/10 hover:bg-cyan-500/5 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-lg">ℹ️</span>
            <span className="text-sm font-medium text-white">About Omini App</span>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-400" />
        </button>
        {isAdmin && (
          <button onClick={() => navigate('admin')} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-blue-500/10 hover:bg-emerald-500/5 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg">⚙️</span>
              <span className="text-sm font-medium text-white">Admin Panel</span>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-400" />
          </button>
        )}
        <button onClick={signOut} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-crimson-500/10 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-lg">🚪</span>
            <span className="text-sm font-medium text-crimson-400">Sign Out</span>
          </div>
        </button>
      </Card>

      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-ink-400">
          OMINI <span className="text-cyan-400">APP</span> — Online Tickets
        </p>
      </div>

      {showAvatars && (
        <AvatarSelector
          currentAvatar={profile?.avatar_url || null}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatars(false)}
        />
      )}
    </div>
  );
}
