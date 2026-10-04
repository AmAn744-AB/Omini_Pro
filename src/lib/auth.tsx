import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from './supabase';

// Admin access is restricted to this specific email address only.
const ADMIN_EMAIL = 'aman.begraj@gmail.com';

type AuthState = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  passwordRecovery: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const fetchProfile = async (uid: string, userMeta?: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error || !data) {
      const meta = userMeta?.user_metadata || {};
      setProfile({
        id: uid,
        display_name: meta.display_name || meta.name || '',
        avatar_url: meta.avatar_url || null,
        subscription_tier: 'free',
      });
      return;
    }
    setProfile(data as Profile);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (data.session) {
        setUser(data.session.user);
        fetchProfile(data.session.user.id, data.session.user);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true);
          return;
        }
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setPasswordRecovery(false);
          return;
        }
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user);
          setPasswordRecovery(false);
        } else {
          setUser(null);
          setProfile(null);
        }
      })();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName,
        });
      } catch { /* table may not exist yet — user_metadata has the name */ }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error || !data) {
      const metaData: Record<string, string> = {};
      if ('display_name' in updates && updates.display_name !== undefined) metaData.display_name = updates.display_name;
      if ('avatar_url' in updates && updates.avatar_url !== undefined) metaData.avatar_url = updates.avatar_url || '';
      const { error: authErr } = await supabase.auth.updateUser({ data: metaData });
      if (authErr) return { error: authErr.message };
      setProfile((prev) => ({
        id: user.id,
        display_name: updates.display_name ?? prev?.display_name ?? '',
        avatar_url: updates.avatar_url ?? prev?.avatar_url ?? null,
        subscription_tier: prev?.subscription_tier ?? 'free',
      }));
      return { error: null };
    }

    setProfile(data as Profile);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, passwordRecovery, isAdmin: user ? user.email === ADMIN_EMAIL : false, signIn, signUp, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
