import { useMemo } from 'react';
import { useMemorization } from './useMemorization';
import type { MemorizationProgress } from '../types/memorization';

// خوارزمية Spaced Repetition
// تحدد مواعيد المراجعة بناءً على أداء المستخدم
export function useSpacedRepetition() {
  const { progress } = useMemorization();

  // حساب تاريخ المراجعة التالي بناءً على الأداء
  const calculateNextReviewDate = (
    lastReviewDate: number,
    masteryScore: number,
    reviewCount: number
  ): number => {
    // تحديد الفاصل الزمني بناءً على مستوى الإتقان وعدد المراجعات
    let interval: number;
    
    if (masteryScore >= 95) {
      // للمستخدمين المتقنين - فترات أطول
      interval = Math.pow(2, reviewCount) * 30; // 30, 60, 120, 240 يوم
    } else if (masteryScore >= 80) {
      // للمستخدمين الجيدين - فترات متوسطة
      interval = Math.pow(1.8, reviewCount) * 15; // 15, 27, 49, 88 يوم
    } else if (masteryScore >= 60) {
      // للمستخدمين المتوسطين - فترات أقصر
      interval = Math.pow(1.5, reviewCount) * 7; // 7, 11, 16, 24 يوم
    } else {
      // للمستخدمين الأقل إتقاناً - مراجعات متكررة
      interval = Math.min(3, Math.pow(1.2, reviewCount) * 1); // 1, 1.2, 1.4, 1.7 يوم
    }
    
    // تحويل الأيام إلى ميلي ثانية
    return lastReviewDate + (interval * 24 * 60 * 60 * 1000);
  };

  // الحصول على قائمة المراجعات المستحقة اليوم
  const getDueReviews = (): MemorizationProgress[] => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    return progress.filter((item) => {
      // فقط العناصر المحفوظة أو المتقنة
      if (item.status !== 'memorized' && item.status !== 'mastered') {
        return false;
      }
      
      // إذا لم يكن هناك تاريخ مراجعة سابق، نعتبرها مستحقة
      if (!item.lastReviewDate) {
        return true;
      }
      
      // إذا لم يكن هناك تاريخ مراجعة محدد، نحسبه
      if (!item.nextReviewDate) {
        const nextReview = calculateNextReviewDate(
          item.lastReviewDate,
          item.masteryScore,
          item.reviewCount
        );
        return nextReview <= now + oneDay; // ضمن 24 ساعة القادمة
      }
      
      // التحقق إذا كانت المراجعة مستحقة (خلال اليوم الحالي أو متأخرة)
      return item.nextReviewDate <= now + oneDay;
    });
  };

  // تحديث تاريخ المراجعة التالي
  const updateNextReviewDate = (
    surahNumber: number,
    masteryScore: number,
    reviewCount: number
  ): number => {
    const lastReviewDate = Date.now();
    return calculateNextReviewDate(lastReviewDate, masteryScore, reviewCount);
  };

  // إحصائيات المراجعات
  const reviewStats = useMemo(() => {
    const dueReviews = getDueReviews();
    const today = new Date().toDateString();
    
    const todayReviews = dueReviews.filter((item) => {
      if (!item.nextReviewDate) return true;
      return new Date(item.nextReviewDate).toDateString() === today;
    });
    
    const overdueReviews = dueReviews.filter((item) => {
      if (!item.nextReviewDate) return false;
      return item.nextReviewDate < Date.now() && 
             new Date(item.nextReviewDate).toDateString() !== today;
    });
    
    return {
      totalDue: dueReviews.length,
      today: todayReviews.length,
      overdue: overdueReviews.length,
    };
  }, [progress]);

  return {
    getDueReviews,
    updateNextReviewDate,
    calculateNextReviewDate,
    reviewStats,
  };
}