import { useMemo } from 'react';
import { useMemorization } from './useMemorization';
import type { MemorizationStats } from '../types/memorization';

export function useProgress() {
  const { progress } = useMemorization();

  const stats: MemorizationStats = useMemo(() => {
    const totalSurahs = 114;
    const memorizedSurahs = progress.filter((p) => p.status === 'memorized').length;
    const learningSurahs = progress.filter((p) => p.status === 'learning').length;
    const masteredSurahs = progress.filter((p) => p.status === 'mastered').length;
    
    const totalProgress = totalSurahs > 0 
      ? Math.round(((memorizedSurahs + masteredSurahs) / totalSurahs) * 100)
      : 0;

    const totalStudyTime = progress.reduce((sum, p) => sum + (p.totalStudyTime || 0), 0);

    // حساب Streak (أيام متتالية)
    const studyDates = progress
      .map((p) => p.lastStudyDate)
      .filter((d): d is number => d !== undefined)
      .map((d) => new Date(d).toDateString())
      .filter((d, i, arr) => arr.indexOf(d) === i)
      .sort()
      .reverse();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (studyDates.length > 0) {
      const today = new Date().toDateString();
      let checkDate = new Date();

      // حساب current streak
      for (let i = 0; i < studyDates.length; i++) {
        const dateStr = checkDate.toDateString();
        if (studyDates.includes(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // حساب longest streak
      for (let i = 0; i < studyDates.length - 1; i++) {
        const date1 = new Date(studyDates[i]);
        const date2 = new Date(studyDates[i + 1]);
        const diffDays = Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak + 1);
          tempStreak = 0;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak + 1, currentStreak);
    }

    const lastStudyDate = studyDates.length > 0 
      ? new Date(studyDates[0]).getTime() 
      : undefined;

    const allTestResults = progress.flatMap((p) => p.testResults);
    const totalTests = allTestResults.length;
    const averageAccuracy =
      totalTests > 0
        ? Math.round(
            allTestResults.reduce((sum, r) => sum + r.accuracy, 0) / totalTests
          )
        : 0;

    return {
      totalSurahs,
      memorizedSurahs,
      learningSurahs,
      masteredSurahs,
      totalProgress,
      totalStudyTime,
      currentStreak,
      longestStreak,
      lastStudyDate,
      totalTests,
      averageAccuracy,
    };
  }, [progress]);

  return { stats, progress };
}

