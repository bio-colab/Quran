export type MemorizationStatus = 'new' | 'learning' | 'memorized' | 'mastered';

export interface MemorizationProgress {
  id: string;
  surahNumber: number;
  status: MemorizationStatus;
  startDate?: number;
  lastReviewDate?: number;
  lastStudyDate?: number;
  reviewCount: number;
  masteryScore: number; // 0-100
  nextReviewDate?: number;
  notes?: string;
  difficulties: number[]; // أرقام الآيات الصعبة
  totalStudyTime: number; // بالدقائق
  testResults: TestResult[];
}

export interface TestResult {
  id: string;
  date: number;
  ayahNumber: number;
  passed: boolean;
  accuracy: number;
  mistakes: number[];
  timeSpent: number; // بالثواني
}

export interface StudySession {
  id: string;
  date: number;
  surahNumber: number;
  startTime: number;
  endTime?: number;
  duration: number; // بالدقائق
  ayahsStudied: number[];
  mode: 'study' | 'test' | 'review';
  completed: boolean;
}

export interface MemorizationStats {
  totalSurahs: number;
  memorizedSurahs: number;
  learningSurahs: number;
  masteredSurahs: number;
  totalProgress: number; // النسبة المئوية
  totalStudyTime: number; // بالدقائق
  currentStreak: number; // أيام متتالية
  longestStreak: number;
  lastStudyDate?: number;
  totalTests: number;
  averageAccuracy: number;
}

export interface StudyModeConfig {
  mode: 'focus' | 'repeat' | 'compare' | 'write';
  ayahRange?: { start: number; end: number };
  repeatCount?: number;
  showPrevious?: boolean;
  showNext?: boolean;
}

