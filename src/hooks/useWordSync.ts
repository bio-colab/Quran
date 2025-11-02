import { useEffect, useRef, useState } from 'react';
import type { WordTiming } from '../types/quran';

export function useWordSync(
  audioElement: HTMLAudioElement | null,
  timings: WordTiming[] | null,
): number | null {
  const frameRef = useRef<number | null>(null);
  const lastIndexRef = useRef<number>(0);
  const [currentWord, setCurrentWord] = useState<number | null>(null);

  useEffect(() => {
    if (!audioElement || !timings || timings.length === 0) {
      setCurrentWord(null);
      return () => undefined;
    }

    let mounted = true;

    const update = () => {
      if (!mounted || !audioElement || !timings || timings.length === 0) {
        return;
      }

      // تحويل الوقت من ثواني إلى مللي ثانية
      // في النظام الجديد، currentTime من بداية السورة الكاملة
      // والتوقيتات في timings أيضاً من بداية السورة الكاملة
      const currentTime = audioElement.currentTime * 1000; // بالمللي ثانية
      let index = lastIndexRef.current;

      if (index >= timings.length) {
        index = timings.length - 1;
      }

      let timing = timings[index];

      while (timing && currentTime > timing.endTime && index < timings.length - 1) {
        index += 1;
        timing = timings[index];
      }

      while (timing && currentTime < timing.startTime && index > 0) {
        index -= 1;
        timing = timings[index];
      }

      if (timing && currentTime >= timing.startTime && currentTime <= timing.endTime) {
        lastIndexRef.current = index;
        setCurrentWord((prev) => (prev === timing!.wordNumber ? prev : timing!.wordNumber));
      } else if (!audioElement.paused) {
        setCurrentWord((prev) => (prev === null ? prev : null));
      }

      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);

    return () => {
      mounted = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastIndexRef.current = 0;
    };
  }, [audioElement, timings]);

  useEffect(() => {
    lastIndexRef.current = 0;
  }, [timings]);

  return currentWord;
}
