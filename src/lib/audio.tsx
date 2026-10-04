import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

interface AudioContextValue {
  muted: boolean;
  toggleMute: () => void;
  setRoute: (route: string) => void;
}

const Ctx = createContext<AudioContextValue>({ muted: false, toggleMute: () => {}, setRoute: () => {} });

export function useAudio() {
  return useContext(Ctx);
}

const LOFI_URL = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';

export function AudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const routeRef = useRef<string>('home');
  const mutedRef = useRef(false);
  const startedRef = useRef(false);

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const startMusic = useCallback(() => {
    if (!audioRef.current || mutedRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Initialize audio element on mount
  useEffect(() => {
    const audio = new Audio(LOFI_URL);
    audio.loop = true;
    audio.volume = 0.25;
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Start audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const startOnInteraction = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      if (audioRef.current && routeRef.current !== 'draw' && !mutedRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', startOnInteraction, { once: true });
    window.addEventListener('touchstart', startOnInteraction, { once: true });
    window.addEventListener('keydown', startOnInteraction, { once: true });

    return () => {
      window.removeEventListener('click', startOnInteraction);
      window.removeEventListener('touchstart', startOnInteraction);
      window.removeEventListener('keydown', startOnInteraction);
    };
  }, []);

  // Route-based auto-pause: stop on 'draw', resume elsewhere
  const setRoute = useCallback((route: string) => {
    routeRef.current = route;
    if (route === 'draw') {
      stopMusic();
    } else {
      startMusic();
    }
  }, [stopMusic, startMusic]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      if (next) {
        stopMusic();
      } else {
        if (routeRef.current !== 'draw') startMusic();
      }
      return next;
    });
  }, [stopMusic, startMusic]);

  return (
    <Ctx.Provider value={{ muted, toggleMute, setRoute }}>
      {children}
    </Ctx.Provider>
  );
}
