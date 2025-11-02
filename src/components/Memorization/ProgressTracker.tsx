import { useState } from 'react';
import { BookOpen, Clock, Target, TrendingUp, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { useMemorization } from '../../hooks/useMemorization';
import type { MemorizationStatus } from '../../types/memorization';
import type { Surah } from '../../types/quran';

interface ProgressTrackerProps {
  surahNumber: number;
  surah?: Surah;
  onStatusChange?: () => void;
}

const statusConfig: Record<MemorizationStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  new: {
    label: 'جديد',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: BookOpen,
  },
  learning: {
    label: 'قيد الحفظ',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    icon: AlertCircle,
  },
  memorized: {
    label: 'محفوظ',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    icon: CheckCircle,
  },
  mastered: {
    label: 'متقن',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    icon: Star,
  },
};

export default function ProgressTracker({
  surahNumber,
  surah,
  onStatusChange,
}: ProgressTrackerProps) {
  const { getProgress, setStatus, updateNotes } = useMemorization();
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const progress = getProgress(surahNumber);
  const status = progress?.status || 'new';
  const config = statusConfig[status];

  const handleStatusChange = (newStatus: MemorizationStatus) => {
    setStatus(surahNumber, newStatus);
    if (onStatusChange) {
      onStatusChange();
    }
  };

  const handleSaveNotes = () => {
    updateNotes(surahNumber, notes);
    setShowNotes(false);
  };

  const masteryScore = progress?.masteryScore || 0;
  const reviewCount = progress?.reviewCount || 0;
  const studyTime = progress?.totalStudyTime || 0;
  const difficultiesCount = progress?.difficulties?.length || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          تتبع التقدم
        </h3>
        {surah && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {surah.arabicName}
          </span>
        )}
      </div>

      {/* الحالة الحالية */}
      <div className={`${config.bgColor} rounded-lg p-4 border-2 ${config.color.replace('text-', 'border-')}`}>
        <div className="flex items-center gap-3 mb-3">
          <config.icon className={`w-6 h-6 ${config.color}`} />
          <span className={`font-bold ${config.color}`}>الحالة: {config.label}</span>
        </div>

        {/* أزرار تغيير الحالة */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key as MemorizationStatus)}
              disabled={status === key}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                status === key
                  ? `${cfg.bgColor} ${cfg.color} font-bold`
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
              } disabled:cursor-default`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              مستوى الإتقان
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {masteryScore}%
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${masteryScore}%` }}
            />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              عدد المراجعات
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {reviewCount}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              وقت الدراسة
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {studyTime} د
          </div>
        </div>

        {difficultiesCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                آيات صعبة
              </span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {difficultiesCount}
            </div>
          </div>
        )}
      </div>

      {/* الملاحظات */}
      <div>
        <button
          onClick={() => {
            setShowNotes(!showNotes);
            if (!showNotes && progress?.notes) {
              setNotes(progress.notes);
            }
          }}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {showNotes ? 'إخفاء الملاحظات' : 'إظهار/إضافة ملاحظات'}
        </button>
        {showNotes && (
          <div className="mt-4 space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="w-full min-h-[100px] p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-right"
              dir="rtl"
            />
            <button
              onClick={handleSaveNotes}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              حفظ الملاحظات
            </button>
          </div>
        )}
      </div>

      {/* معلومات إضافية */}
      {progress && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          {progress.startDate && (
            <p>تاريخ البدء: {new Date(progress.startDate).toLocaleDateString('ar-SA')}</p>
          )}
          {progress.lastReviewDate && (
            <p>آخر مراجعة: {new Date(progress.lastReviewDate).toLocaleDateString('ar-SA')}</p>
          )}
        </div>
      )}
    </div>
  );
}

