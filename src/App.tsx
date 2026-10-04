import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRoute } from '@/lib/router';
import { AudioProvider, useAudio } from '@/lib/audio';
import { AuthScreen } from '@/screens/AuthScreen';
import { ResetPasswordScreen } from '@/screens/ResetPasswordScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { MySheetsScreen } from '@/screens/MySheetsScreen';
import { PlayScreen } from '@/screens/PlayScreen';
import { PlansScreen } from '@/screens/PlansScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { AboutScreen } from '@/screens/AboutScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { BottomNav } from '@/components/BottomNav';
import { AudioToggle } from '@/components/AudioToggle';
import { Spinner } from '@/components/ui';
import { SplashScreen } from '@/components/SplashScreen';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Shield } from 'lucide-react';

function AppInner() {
  const { user, loading, passwordRecovery, isAdmin } = useAuth();
  const [route, navigate] = useRoute();
  const [showSplash, setShowSplash] = useState(true);
  const { setRoute: setAudioRoute } = useAudio();

  useEffect(() => {
    if (!showSplash) return;
    const seen = sessionStorage.getItem('omnipro_splash_seen');
    if (seen) setShowSplash(false);
  }, []);

  useEffect(() => {
    setAudioRoute(route);
  }, [route, setAudioRoute]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('omnipro_splash_seen', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-cyan-400" />
      </div>
    );
  }

  if (passwordRecovery) {
    return <ResetPasswordScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  const showNav = route !== 'about' && route !== 'admin';
  const canAccessAdmin = isAdmin && route === 'admin';
  const adminBlocked = route === 'admin' && !isAdmin;

  return (
    <div className="min-h-screen grid-bg">
      <AudioToggle />
      <main className={`mx-auto max-w-md px-4 ${showNav ? 'pb-24 pt-6' : 'pb-8 pt-6'} safe-top`}>
        {route === 'home' && <HomeScreen navigate={navigate} />}
        {route === 'games' && <MySheetsScreen />}
        {route === 'draw' && <PlayScreen navigate={navigate} />}
        {route === 'plans' && <PlansScreen />}
        {route === 'profile' && <ProfileScreen navigate={navigate} />}
        {route === 'about' && <AboutScreen navigate={navigate} />}
        {canAccessAdmin && <AdminScreen />}
        {adminBlocked && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl glass border border-crimson-500/20 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-crimson-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Access Denied</h2>
            <p className="mt-1 text-sm text-ink-300 max-w-xs">The Admin Panel is restricted to authorized accounts only.</p>
            <button onClick={() => navigate('home')} className="btn-3d-cyan mt-6 rounded-xl px-6 py-3 text-sm">
              Back to Home
            </button>
          </div>
        )}
      </main>

      {showNav && <BottomNav route={route} navigate={navigate} />}
      {showNav && <InstallPrompt />}
    </div>
  );
}

function App() {
  return (
    <AudioProvider>
      <AppInner />
    </AudioProvider>
  );
}

export default App;
