'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { VideoProgress } from '@/lib/api/videos';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
  startTime?: number;
  lessonId?: string;
  videoProgress?: VideoProgress | null;
  onTimeUpdate?: (currentTime: number, duration: number, settings?: {
    playbackSpeed?: number;
    volume?: number;
    muted?: boolean;
    captionsEnabled?: boolean;
    captionsLanguage?: string;
  }) => void;
  onEnded?: () => void;
  videoSource?: 'upload' | 'youtube';
  videoId?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoplay = false,
  controls = true,
  className,
  startTime,
  lessonId,
  videoProgress,
  onTimeUpdate,
  onEnded,
  videoSource,
  videoId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(videoProgress?.playbackSpeed || 1);
  const [volume, setVolume] = useState(videoProgress?.volume !== undefined ? videoProgress.volume : 1);
  const [muted, setMuted] = useState(videoProgress?.muted || false);
  const [captionsEnabled, setCaptionsEnabled] = useState(videoProgress?.captionsEnabled || false);
  const [showSettings, setShowSettings] = useState(false);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isYouTube = videoSource === 'youtube' || src.includes('youtube.com') || src.includes('youtu.be');
  
  // Initialize video settings from progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;
    
    // Set initial time from progress or startTime prop
    const initialTime = startTime !== undefined && startTime > 0 
      ? startTime 
      : (videoProgress?.currentTime || 0);
    
    if (initialTime > 0) {
      video.currentTime = initialTime;
    }
    
    // Set playback settings
    video.playbackRate = playbackRate;
    video.volume = volume;
    video.muted = muted;
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialTime > 0 && initialTime < video.duration) {
        video.currentTime = initialTime;
      }
    };
    
    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      
      // Throttle progress updates to every 5 seconds
      if (onTimeUpdate && lessonId) {
        if (!timeUpdateIntervalRef.current) {
          timeUpdateIntervalRef.current = setTimeout(() => {
            onTimeUpdate(current, video.duration, {
              playbackSpeed: playbackRate,
              volume: volume,
              muted: muted,
              captionsEnabled: captionsEnabled,
              captionsLanguage: videoProgress?.captionsLanguage,
            });
            timeUpdateIntervalRef.current = null;
          }, 5000);
        }
      } else if (onTimeUpdate) {
        onTimeUpdate(current, video.duration);
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', () => {
      setIsPlaying(false);
      onEnded?.();
    });
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (timeUpdateIntervalRef.current) {
        clearTimeout(timeUpdateIntervalRef.current);
      }
    };
  }, [onTimeUpdate, onEnded, startTime, videoProgress, lessonId, playbackRate, volume, muted, captionsEnabled, isYouTube]);
  
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, isYouTube]);
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || isYouTube) return;
    
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    const video = videoRef.current;
    if (video && !isYouTube) {
      video.playbackRate = rate;
    }
  };
  
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    const video = videoRef.current;
    if (video && !isYouTube) {
      video.volume = newVolume;
    }
  };
  
  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    const video = videoRef.current;
    if (video && !isYouTube) {
      video.muted = newMuted;
    }
  };
  
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // YouTube embed URL
  const getYouTubeUrl = useCallback(() => {
    if (!videoId && !src) return '';
    const id = videoId || src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!id) return src;
    const resumeTime = videoProgress?.currentTime ?? (startTime ?? 0);
    return `https://www.youtube.com/embed/${id}?enablejsapi=1&start=${Math.floor(resumeTime)}&rel=0`;
  }, [videoId, src, videoProgress?.currentTime, startTime]);
  
  if (isYouTube) {
    return (
      <div className={cn('relative w-full bg-black rounded-lg overflow-hidden aspect-video', className)}>
        <iframe
          ref={iframeRef}
          src={getYouTubeUrl()}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video player"
        />
        {videoProgress && videoProgress.currentTime > 0 && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Resuming from {formatTime(videoProgress.currentTime)}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn('relative w-full bg-black rounded-lg overflow-hidden', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoplay}
        className="w-full h-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {videoProgress && videoProgress.currentTime > 0 && videoProgress.currentTime < duration && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          Resuming from {formatTime(videoProgress.currentTime)}
        </div>
      )}
      
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-2 slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${duration ? (currentTime / duration) * 100 : 0}%, #4b5563 ${duration ? (currentTime / duration) * 100 : 0}%, #4b5563 100%)`
            }}
          />
          
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="hover:text-gray-300 transition-colors p-1"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              <span className="text-xs">{formatTime(currentTime)} / {formatTime(duration)}</span>
              
              <button
                onClick={toggleMute}
                className="hover:text-gray-300 transition-colors p-1"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-xs"
                aria-label="Playback speed"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="hover:text-gray-300 transition-colors p-1"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </button>
          </div>
          
          {showSettings && (
            <div className="absolute bottom-16 right-4 bg-black/90 text-white p-3 rounded-lg text-sm space-y-2 min-w-[200px]">
              <div className="flex items-center justify-between">
                <label>Captions</label>
                <input
                  type="checkbox"
                  checked={captionsEnabled}
                  onChange={(e) => setCaptionsEnabled(e.target.checked)}
                  className="rounded"
                />
              </div>
              {videoProgress?.progressPercentage !== undefined && (
                <div className="text-xs text-gray-400">
                  Progress: {Math.round(videoProgress.progressPercentage)}%
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

