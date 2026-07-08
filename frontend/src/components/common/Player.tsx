'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  QueueListIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { mockTracks } from '@/utils/mockData';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ---------- Types ----------
interface Track {
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

type RepeatMode = 'none' | 'all' | 'one';

// ---------- Main Component ----------
export default function Player() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // ---------- State ----------
  const [queue] = useState<Track[]>(() => [...mockTracks]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => mockTracks[0] ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffled, setIsShuffled] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  function getNextIndex(): number {
    if (isShuffled) {
      // Random track from queue
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === queueIndex && queue.length > 1);
      return randomIndex;
    }

    if (queueIndex < queue.length - 1) {
      return queueIndex + 1;
    }

    if (repeatMode === 'all') {
      return 0; // Loop back to start
    }

    return -1; // End of queue
  }

  function getPrevIndex(): number {
    if (queueIndex > 0) {
      return queueIndex - 1;
    }
    if (repeatMode === 'all' || isShuffled) {
      return queue.length - 1;
    }
    return -1;
  }

  function handleTrackEnd() {

    const nextIndex = getNextIndex();
    if (nextIndex === -1) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      return;
    }

    setQueueIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setProgress(0);
    setCurrentTime(0);
  }

  // ---------- Audio element setup ----------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.preload = 'metadata'; // ✅ Preload metadata

    const handleLoadedMetadata = () => {
      console.log('Audio loaded, duration:', audio.duration);
      setDuration(audio.duration);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      console.log('Failed URL:', audio.src);
    };

    const handleEnded = () => {
      handleTrackEnd();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // ---------- Load track when currentTrack changes ----------
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    const audio = audioRef.current;
    
    // ✅ Reset duration before loading
    setDuration(0);
    setProgress(0);
    
    // ✅ Set the source and load
    audio.src = currentTrack.audioUrl || '/audio/mock.mp3';
    audio.load();

    // ✅ Progress tracking
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(() => {
      if (audio.duration > 0 && !isNaN(audio.duration)) {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    }, 100);

    // If was playing, resume
    if (isPlaying) {
      audio.play().catch(err => console.log('Playback error:', err));
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentTrack, isPlaying]);

  // ---------- Handle play/pause ----------
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.log('Playback error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // ---------- Handle repeat one ----------
  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.loop = repeatMode === "one";
  }, [repeatMode]);
  
  // ---------- Handle volume ----------
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!currentTrack) {
      // Select first track if none selected
      setCurrentTrack(queue[0]);
      setQueueIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    const nextIndex = getNextIndex();
    if (nextIndex !== -1) {
      setQueueIndex(nextIndex);
      setCurrentTrack(queue[nextIndex]);
      setProgress(0);
      if (isPlaying) {
        // Keep playing
      } else {
        setIsPlaying(true);
      }
    } else {
      toast.success(t('player.end_of_queue') || 'End of queue');
    }
  };

  const prevTrack = () => {
    const prevIndex = getPrevIndex();
    if (prevIndex !== -1) {
      setQueueIndex(prevIndex);
      setCurrentTrack(queue[prevIndex]);
      setProgress(0);
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
  };

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    toast.success(
      nextMode === 'none'
        ? t('player.repeat_off')
        : nextMode === 'all'
        ? t('player.repeat_all')
        : t('player.repeat_one')
    );
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    toast.success(isShuffled ? t('player.shuffle_off') : t('player.shuffle_on'));
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && duration > 0) {
      const nextTime = (newProgress / 100) * duration;
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // ---------- Format time ----------
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------- Get repeat icon ----------
  const getRepeatIcon = () => {
    if (repeatMode === 'none') return '🔁';
    if (repeatMode === 'all') return '🔁';
    return '🔂';
  };

  const getRepeatLabel = () => {
    if (repeatMode === 'none') return t('player.repeat_off') || 'Repeat off';
    if (repeatMode === 'all') return t('player.repeat_all') || 'Repeat all';
    return t('player.repeat_one') || 'Repeat one';
  };

  // ---------- Render ----------
  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-gray-800 p-4 z-50">
        <div className="flex items-center justify-center text-text-secondary">
          <p>{t('player.no_track') || 'No track selected'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-gray-800 z-50">
      {/* Main Player */}
      <div className="flex items-center justify-between max-w-7xl mx-auto p-4 gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-[180px]">
          <div
            className="w-14 h-14 bg-gray-700 rounded-md overflow-hidden flex-shrink-0 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <img
              src={currentTrack.coverImage}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate cursor-pointer hover:text-primary transition">
              {currentTrack.title}
            </p>
            <Link
              href={`/artist/${currentTrack.artist.id}`}
              className="text-text-secondary text-xs hover:text-primary transition truncate block"
            >
              {currentTrack.artist.name}
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center w-1/2 max-w-[722px]">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`text-sm transition ${isShuffled ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
              title={t('player.shuffle') || 'Shuffle'}
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={prevTrack}
              className="text-text-secondary hover:text-white transition"
              title={t('player.previous') || 'Previous'}
            >
              <BackwardIcon className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="bg-white rounded-full p-2 hover:scale-105 transition transform"
              title={isPlaying ? t('player.pause') || 'Pause' : t('player.play') || 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="w-5 h-5 text-black" />
              ) : (
                <PlayIcon className="w-5 h-5 text-black" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="text-text-secondary hover:text-white transition"
              title={t('player.next') || 'Next'}
            >
              <ForwardIcon className="w-5 h-5" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`text-sm transition ${repeatMode !== 'none' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
              title={getRepeatLabel()}
            >
              {getRepeatIcon()}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full mt-1">
            <span className="text-xs text-text-secondary font-mono">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
            <span className="text-xs text-text-secondary font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 w-1/4 justify-end min-w-[130px]">
          {/* Queue button */}
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`text-text-secondary hover:text-white transition ${showQueue ? 'text-primary' : ''}`}
            title={t('player.queue') || 'Queue'}
          >
            <QueueListIcon className="w-5 h-5" />
          </button>

          {/* Gold-only stats */}
          {user?.subscriptionType === 'gold' && (
            <div className="hidden md:flex gap-2 text-xs text-text-secondary">
              <span>👂 {currentTrack.listeners.toLocaleString()}</span>
              <span>▶️ {currentTrack.streams.toLocaleString()}</span>
            </div>
          )}

          {/* Volume */}
          <button
            onClick={toggleMute}
            className="text-text-secondary hover:text-white transition"
          >
            {isMuted || volume === 0 ? (
              <SpeakerXMarkIcon className="w-5 h-5" />
            ) : (
              <SpeakerWaveIcon className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hidden sm:block"
          />
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="absolute bottom-full right-0 w-80 bg-[#1a1a1a] border border-gray-800 rounded-t-lg shadow-xl max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a]">
            <h3 className="text-white font-medium">
              {t('player.queue') || 'Queue'}
            </h3>
            <button
              onClick={() => setShowQueue(false)}
              className="text-text-secondary hover:text-white transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="p-2">
            {queue.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a2a2a] transition cursor-pointer ${
                  index === queueIndex ? 'bg-[#2a2a2a] border-l-2 border-primary' : ''
                }`}
                onClick={() => {
                  setQueueIndex(index);
                  setCurrentTrack(track);
                  setProgress(0);
                  if (!isPlaying) setIsPlaying(true);
                  setShowQueue(false);
                }}
              >
                <span className="text-text-secondary text-xs w-6 text-center font-mono">
                  {index + 1}
                </span>
                <div className="w-8 h-8 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={track.coverImage}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm truncate">{track.title}</p>
                  <p className="text-text-secondary text-xs truncate">
                    {track.artist.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden audio element used for playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Lyrics Popup (Optional) */}
      {showLyrics && currentTrack.lyrics && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-96 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl p-4 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">{t('player.lyrics') || 'Lyrics'}</h4>
            <button
              onClick={() => setShowLyrics(false)}
              className="text-text-secondary hover:text-white transition"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <pre className="text-text-secondary text-sm whitespace-pre-wrap">
            {currentTrack.lyrics}
          </pre>
        </div>
      )}
    </div>
  );
} 