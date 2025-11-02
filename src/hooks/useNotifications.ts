import { useEffect, useCallback } from 'react';
import { useSpacedRepetition } from './useSpacedRepetition';
import type { MemorizationProgress } from '../types/memorization';

// نظام الإشعارات للمراجعات
export function useNotifications() {
  const { reviewStats } = useSpacedRepetition();
  
  // طلب الإذن بالإشعارات
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);
  
  // إظهار إشعار للمراجعة
  const showReviewNotification = useCallback((dueCount: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('مراجعات القرآن مستحقة', {
        body: `لديك ${dueCount} مراجعة مستحقة اليوم. اضغط للمراجعة الآن.`,
        icon: '/favicon.ico',
        tag: 'quran-review-notification',
      });
      
      // عند النقر على الإشعار، نوجه المستخدم إلى وضع المراجعة
      notification.onclick = () => {
        window.focus();
        // يمكن إضافة توجيه إلى صفحة المراجعة هنا
        window.location.hash = '#review';
      };
      
      return notification;
    }
    return null;
  }, []);
  
  // جدولة إشعارات المراجعة اليومية
  const scheduleDailyReviewNotification = useCallback(() => {
    if (reviewStats.today > 0) {
      // إظهار إشعار فوري إذا كانت هناك مراجعات مستحقة
      showReviewNotification(reviewStats.today);
      
      // جدولة إشعارات إضافية في أوقات محددة
      const scheduleNotification = (hours: number, minutes: number) => {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // إذا كان الوقت المجدول قد مر اليوم، نجدوله للغد
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const delay = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
          if (reviewStats.today > 0) {
            showReviewNotification(reviewStats.today);
          }
        }, delay);
      };
      
      // جدولة إشعارات في أوقات مختلفة من اليوم
      scheduleNotification(9, 0);   // 9:00 صباحاً
      scheduleNotification(13, 0);  // 1:00 ظهراً
      scheduleNotification(18, 0);  // 6:00 مساءً
    }
  }, [reviewStats.today, showReviewNotification]);
  
  // التحقق من المراجعات المتأخرة
  const checkOverdueReviews = useCallback(() => {
    if (reviewStats.overdue > 0) {
      // إشعار خاص بالمراجعات المتأخرة
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('مراجعات متأخرة', {
          body: `لديك ${reviewStats.overdue} مراجعة متأخرة. قم بالمراجعة الآن لتجنب النسيان.`,
          icon: '/favicon.ico',
          tag: 'quran-overdue-notification',
        });
        
        notification.onclick = () => {
          window.focus();
          window.location.hash = '#review';
        };
        
        return notification;
      }
    }
    return null;
  }, [reviewStats.overdue]);
  
  // بدء نظام الإشعارات
  const startNotificationSystem = useCallback(async () => {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      // جدولة إشعارات المراجعة اليومية
      scheduleDailyReviewNotification();
      
      // التحقق من المراجعات المتأخرة
      checkOverdueReviews();
      
      // التحقق من المراجعات كل ساعة
      setInterval(() => {
        scheduleDailyReviewNotification();
        checkOverdueReviews();
      }, 60 * 60 * 1000); // كل ساعة
    }
  }, [requestNotificationPermission, scheduleDailyReviewNotification, checkOverdueReviews]);
  
  // استخدام النظام عند تحميل التطبيق
  useEffect(() => {
    // التحقق إذا كان النظام يدعم الإشعارات
    if ('Notification' in window) {
      // بدء النظام بعد تأخير قليل لضمان تحميل التطبيق
      const timer = setTimeout(() => {
        startNotificationSystem();
      }, 5000); // بعد 5 ثوانٍ
      
      return () => clearTimeout(timer);
    }
  }, [startNotificationSystem]);
  
  return {
    requestNotificationPermission,
    showReviewNotification,
    scheduleDailyReviewNotification,
    checkOverdueReviews,
    reviewStats,
  };
}