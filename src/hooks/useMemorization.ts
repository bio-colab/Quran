import { useLocalStorage } from './useLocalStorage';
import type { MemorizationProgress, MemorizationStatus, TestResult } from '../types/memorization';

export function useMemorization() {
  const [progress, setProgress] = useLocalStorage<MemorizationProgress[]>('quran-memorization-progress', []);

  const getProgress = (surahNumber: number): MemorizationProgress | undefined => {
    return progress.find((p) => p.surahNumber === surahNumber);
  };

  const updateProgress = (
    surahNumber: number,
    updates: Partial<MemorizationProgress>
  ) => {
    setProgress((prev) => {
      const existing = prev.find((p) => p.surahNumber === surahNumber);
      if (existing) {
        return prev.map((p) =>
          p.surahNumber === surahNumber ? { ...p, ...updates } : p
        );
      } else {
        const newProgress: MemorizationProgress = {
          id: `progress-${surahNumber}-${Date.now()}`,
          surahNumber,
          status: 'new',
          reviewCount: 0,
          masteryScore: 0,
          difficulties: [],
          totalStudyTime: 0,
          testResults: [],
          ...updates,
        };
        return [...prev, newProgress];
      }
    });
  };

  const setStatus = (surahNumber: number, status: MemorizationStatus) => {
    const updates: Partial<MemorizationProgress> = {
      status,
      lastStudyDate: Date.now(),
    };

    if (status === 'new') {
      updates.startDate = undefined;
      updates.masteryScore = 0;
    } else if (status === 'learning' && !getProgress(surahNumber)?.startDate) {
      updates.startDate = Date.now();
    }

    updateProgress(surahNumber, updates);
  };

  const addTestResult = (
    surahNumber: number,
    testResult: Omit<TestResult, 'id'>
  ) => {
    const progressItem = getProgress(surahNumber);
    const newTestResult: TestResult = {
      id: `test-${Date.now()}-${Math.random()}`,
      ...testResult,
    };

    updateProgress(surahNumber, {
      testResults: [...(progressItem?.testResults || []), newTestResult],
      lastReviewDate: Date.now(),
      reviewCount: (progressItem?.reviewCount || 0) + 1,
    });

    // تحديث masteryScore بناءً على النتيجة
    const allResults = [...(progressItem?.testResults || []), newTestResult];
    const averageAccuracy =
      allResults.reduce((sum, r) => sum + r.accuracy, 0) / allResults.length;

    const newMasteryScore = Math.min(100, Math.round(averageAccuracy));

    updateProgress(surahNumber, {
      masteryScore: newMasteryScore,
    });

    // تحديث الحالة بناءً على النتيجة
    if (testResult.passed && testResult.accuracy >= 95) {
      setStatus(surahNumber, 'mastered');
    } else if (testResult.passed && testResult.accuracy >= 80) {
      setStatus(surahNumber, 'memorized');
    } else if (progressItem?.status === 'new') {
      setStatus(surahNumber, 'learning');
    }
  };

  const addDifficulty = (surahNumber: number, ayahNumber: number) => {
    const progressItem = getProgress(surahNumber);
    if (progressItem && !progressItem.difficulties.includes(ayahNumber)) {
      updateProgress(surahNumber, {
        difficulties: [...progressItem.difficulties, ayahNumber],
      });
    }
  };

  const removeDifficulty = (surahNumber: number, ayahNumber: number) => {
    const progressItem = getProgress(surahNumber);
    if (progressItem) {
      updateProgress(surahNumber, {
        difficulties: progressItem.difficulties.filter((a) => a !== ayahNumber),
      });
    }
  };

  const addStudyTime = (surahNumber: number, minutes: number) => {
    const progressItem = getProgress(surahNumber);
    updateProgress(surahNumber, {
      totalStudyTime: (progressItem?.totalStudyTime || 0) + minutes,
      lastStudyDate: Date.now(),
    });
  };

  const updateNotes = (surahNumber: number, notes: string) => {
    updateProgress(surahNumber, { notes });
  };

  return {
    progress,
    getProgress,
    updateProgress,
    setStatus,
    addTestResult,
    addDifficulty,
    removeDifficulty,
    addStudyTime,
    updateNotes,
  };
}

