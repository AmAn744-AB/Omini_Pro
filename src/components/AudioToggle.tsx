import { useAudio } from '@/lib/audio';
import { Volume2, VolumeX } from 'lucide-react';

export function AudioToggle() {
  const { muted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? 'Unmute background music' : 'Mute background music'}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full glass border border-blue-500/20 flex items-center justify-center transition-all hover:border-cyan-500/40 active:scale-90"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
    >
      {muted ? (
        <VolumeX className="w-4 h-4 text-ink-400" />
      ) : (
        <Volume2 className="w-4 h-4 text-cyan-400" />
      )}
    </button>
  );
}
