'use client';
import { useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';

export const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [shuffle, setShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const repeatOptions: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
  const repeatLabels = { none: '🔁', all: '🔁', one: '🔁 1' };

  const nextRepeat = () => {
    const currentIndex = repeatOptions.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % repeatOptions.length;
    setRepeatMode(repeatOptions[nextIndex]);
  };

  // Mock track info
  const currentTrack = {
    title: 'Midnight Dreams',
    artist: 'The Midnight Waves',
    album: 'Dreamscape',
    coverImage: '/images/track1.jpg',
    duration: 235, // 3:55
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-gray-800 p-4 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-[180px]">
          <div className="w-14 h-14 bg-gray-700 rounded-md flex-shrink-0 overflow-hidden">
            <img
              src={currentTrack.coverImage}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-text-secondary text-xs truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center w-1/2 max-w-[722px]">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setShuffle(!shuffle)}
              className="text-text-secondary hover:text-white transition"
            >
              <ArrowsRightLeftIcon className={`w-4 h-4 ${shuffle ? 'text-primary' : ''}`} />
            </button>
            <button className="text-text-secondary hover:text-white transition">
              <BackwardIcon className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="bg-white rounded-full p-2 hover:scale-105 transition transform"
            >
              {isPlaying ? (
                <PauseIcon className="w-5 h-5 text-black" />
              ) : (
                <PlayIcon className="w-5 h-5 text-black" />
              )}
            </button>
            <button className="text-text-secondary hover:text-white transition">
              <ForwardIcon className="w-5 h-5" />
            </button>
            <button
              onClick={nextRepeat}
              className={`text-text-secondary hover:text-white transition text-sm ${
                repeatMode !== 'none' ? 'text-primary' : ''
              }`}
            >
              {repeatLabels[repeatMode]}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full mt-2">
            <span className="text-xs text-text-secondary font-mono">
              {formatTime(progress)}
            </span>
            <input
              type="range"
              min="0"
              max={currentTrack.duration}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
            <span className="text-xs text-text-secondary font-mono">
              {formatTime(currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 w-1/4 justify-end min-w-[130px]">
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
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>
    </div>
  );
};