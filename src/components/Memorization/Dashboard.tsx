import { TrendingUp, BookOpen, Clock, Target, Flame, Award } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { useMemorization } from '../../hooks/useMemorization';
import type { Surah } from '../../types/quran';

interface DashboardProps {
  surahs: Surah[];
  onSurahSelect?: (surahNumber: number) => void;
}

export default function Dashboard({ surahs, onSurahSelect }: DashboardProps) {
  const { stats } = useProgress();
  const { progress } = useMemorization();

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${hours} ساعة`;
  };

  // حساب التقدم حسب الحالة
  const surahsByStatus = {
    new: progress.filter((p) => p.status === 'new').length,
    learning: progress.filter((p) => p.status === 'learning').length,
    memorized: progress.filter((p) => p.status === 'memorized').length,
    mastered: progress.filter((p) => p.status === 'mastered').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          لوحة المعلومات
        </h2>
      </div>

      {/* البطاقات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.totalProgress}%</span>
          </div>
          <p className="text-emerald-50 text-sm">التقدم الإجمالي</p>
          <p className="text-emerald-100 text-xs mt-1">
            {stats.memorizedSurahs + stats.masteredSurahs} من {stats.totalSurahs} سورة
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.masteredSurahs}</span>
          </div>
          <p className="text-blue-50 text-sm">سورة متقنة</p>
          <p className="text-blue-100 text-xs mt-1">
            {stats.learningSurahs} قيد الحفظ
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8" />
            <span className="text-3xl font-bold">{Math.floor(stats.totalStudyTime / 60)}</span>
          </div>
          <p className="text-purple-50 text-sm">ساعات الدراسة</p>
          <p className="text-purple-100 text-xs mt-1">
            {stats.totalStudyTime} دقيقة إجمالي
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Flame className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.currentStreak}</span>
          </div>
          <p className="text-orange-50 text-sm">أيام متتالية</p>
          <p className="text-orange-100 text-xs mt-1">
            أطول سلسلة: {stats.longestStreak} يوم
          </p>
        </div>
      </div>

      {/* إحصائيات مفصلة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* توزيع الحالة */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            توزيع الحفظ
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">جديد</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {surahsByStatus.new}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full"
                  style={{
                    width: `${(surahsByStatus.new / stats.totalSurahs) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-yellow-600 dark:text-yellow-400">قيد الحفظ</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {surahsByStatus.learning}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${(surahsByStatus.learning / stats.totalSurahs) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-green-600 dark:text-green-400">محفوظ</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {surahsByStatus.memorized}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(surahsByStatus.memorized / stats.totalSurahs) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-blue-600 dark:text-blue-400">متقن</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {surahsByStatus.mastered}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${(surahsByStatus.mastered / stats.totalSurahs) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            الإحصائيات
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">الاختبارات المكتملة</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.totalTests}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">معدل الدقة</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.averageAccuracy}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">وقت الدراسة الإجمالي</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatTime(stats.totalStudyTime)}
              </span>
            </div>
            {stats.lastStudyDate && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">آخر دراسة</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {new Date(stats.lastStudyDate).toLocaleDateString('ar-SA')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* السور المحفوظة */}
      {progress.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            السور المحفوظة
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {progress
              .filter((p) => p.status !== 'new')
              .sort((a, b) => {
                const order = { learning: 0, memorized: 1, mastered: 2 };
                return order[a.status] - order[b.status];
              })
              .map((p) => {
                const surah = surahs.find((s) => s.number === p.surahNumber);
                const config = {
                  learning: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300' },
                  memorized: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
                  mastered: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
                }[p.status];

                return (
                  <button
                    key={p.id}
                    onClick={() => onSurahSelect?.(p.surahNumber)}
                    className={`${config.bg} ${config.text} rounded-lg p-3 text-sm font-medium hover:opacity-80 transition-opacity text-center`}
                  >
                    {surah?.arabicName || `سورة ${p.surahNumber}`}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}


