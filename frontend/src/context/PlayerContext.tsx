'use client';

import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';
import { mockTracks } from '@/utils/mockData';

export interface PlayerTrack {
  id: string;
  title: string;
  artist: { id: string; name: string };
  coverImage: string;
  duration: number;
  album?: { id: string; title: string };
  listeners: number;
  streams: number;
  audioUrl: string;
  lyrics?: string;
}

interface PlayerContextType {
  currentTrack: PlayerTrack | null;
  setCurrentTrack: (track: PlayerTrack | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playTrack: (track: PlayerTrack) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(mockTracks[0] ?? null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = useCallback((track: PlayerTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const value = useMemo(
    () => ({ currentTrack, setCurrentTrack, isPlaying, setIsPlaying, playTrack }),
    [currentTrack, isPlaying, playTrack]
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
