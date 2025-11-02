import { useEffect, useRef, useState, useCallback } from 'react';
import type { AudioPlayerState, Reciter, WordTiming } from '../types/quran';
import { getAudioUrl, getSurahAudioUrl } from '../utils/audioTimings';
import { useWordSync } from './useWordSync';

interface UseAudioPlayerProps {
  reciter: Reciter | null;
  surahNumber: number;
  ayahNumber: number;
  timings: WordTiming[] | null;
  timestampFrom?: number; // وقت بداية الآية من بداية السورة بالمللي ثانية (للنظام الجديد)
  onAyahEnd?: () => void;
}

export function useAudioPlayer({
  reciter,
  surahNumber,
  ayahNumber,
  timings,
  timestampFrom,
  onAyahEnd,
}: UseAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentAyah: null,
    currentWord: null,
    playbackSpeed: 1,
    volume: 1,
    repeat: 'none',
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime * 1000; // Convert to milliseconds
      setCurrentTime(time);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isPlaying: false, currentWord: null }));
    if (onAyahEnd) {
      onAyahEnd();
    }
  }, [onAyahEnd]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration * 1000);
    }
  }, []);

  const handleError = useCallback((e: Event) => {
    console.error('خطأ في تحميل الصوت:', e);
    setPlayerState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const syncedWord = useWordSync(audioRef.current, timings);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, [handleTimeUpdate, handleEnded, handleLoadedMetadata, handleError]);

  useEffect(() => {
    setPlayerState((prev) =>
      prev.currentWord === syncedWord ? prev : { ...prev, currentWord: syncedWord }
    );
  }, [syncedWord]);

  const play = useCallback(async () => {
    if (!reciter || !audioRef.current) return;

    let audioUrl: string;
    let startTime: number = 0;

    // إذا كان القارئ يستخدم النظام الجديد (سورة كاملة)
    if (reciter.readerType === 'surah' && reciter.readerFolder) {
      const surahUrl = await getSurahAudioUrl(reciter, surahNumber);
      if (!surahUrl) {
        console.error('لم يتم العثور على رابط الصوت للسورة');
        return;
      }
      audioUrl = surahUrl;

      // الحصول على timestamp_from للآية
      if (timestampFrom !== undefined) {
        startTime = timestampFrom;
      } else if (timings && timings.length > 0) {
        // استخدام أول timing كمرجع في حال عدم وجود timestampFrom
        startTime = timings[0].startTime || 0;
      }
    } else {
      // النظام القديم (آيات فردية)
      audioUrl = getAudioUrl(reciter, surahNumber, ayahNumber);
    }

    console.log('محاولة تشغيل:', audioUrl, 'من الوقت:', startTime);
    
    if (audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }

    audioRef.current.playbackRate = playerState.playbackSpeed;
    audioRef.current.volume = playerState.volume;
    
    try {
      // انتظار تحميل البيانات
      await new Promise((resolve) => {
        if (audioRef.current) {
          if (audioRef.current.readyState >= 2) {
            resolve(null);
          } else {
            audioRef.current.addEventListener('loadedmetadata', () => resolve(null), { once: true });
          }
        }
      });

      if (startTime > 0) {
        audioRef.current.currentTime = startTime / 1000; // تحويل من مللي ثانية إلى ثواني
      }
      
      await audioRef.current.play();
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: true,
        currentAyah: { surahNumber, ayahNumber },
      }));
    } catch (error) {
      console.error('خطأ في تشغيل الصوت:', error);
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [reciter, surahNumber, ayahNumber, playerState.playbackSpeed, playerState.volume, timings, timestampFrom]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: false,
        currentWord: null,
      }));
      setCurrentTime(0);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time / 1000; // Convert from milliseconds
      setCurrentTime(time);
    }
  }, []);

  const setSpeed = useCallback((speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setPlayerState((prev) => ({ ...prev, playbackSpeed: speed }));
  }, []);

  const setVolumeLevel = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setPlayerState((prev) => ({ ...prev, volume }));
  }, []);

  const setRepeatMode = useCallback((repeat: 'none' | 'ayah' | 'continuous') => {
    setPlayerState((prev) => ({ ...prev, repeat }));
  }, []);

  return {
    playerState,
    currentTime,
    duration,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    setVolumeLevel,
    setRepeatMode,
  };
}
