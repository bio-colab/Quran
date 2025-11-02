import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, RotateCcw, Play, Pause } from 'lucide-react';
import { useMemorization } from '../../hooks/useMemorization';
import type { Ayah } from '../../types/quran';

interface MemorizationTestProps {
  surahNumber: number;
  ayahs: Ayah[];
  onComplete?: () => void;
}

export default function MemorizationTest({
  surahNumber,
  ayahs,
  onComplete,
}: MemorizationTestProps) {
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [showText, setShowText] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testResults, setTestResults] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [difficultAyahs, setDifficultAyahs] = useState<Set<number>>(new Set());

  const { addTestResult, addDifficulty, removeDifficulty, getProgress } = useMemorization();

  const currentAyah = ayahs[currentAyahIndex];
  const progress = getProgress(surahNumber);

  useEffect(() => {
    if (progress?.difficulties) {
      setDifficultAyahs(new Set(progress.difficulties));
    }
  }, [progress]);

  const handleStartTest = () => {
    setTestStarted(true);
    setStartTime(Date.now());
    setShowText(false);
    setTestResults([]);
  };

  const handleShowText = () => {
    setShowText(true);
  };

  const handlePass = () => {
    const newResults = [...testResults, true];
    setTestResults(newResults);

    if (difficultAyahs.has(currentAyah.ayahNumber)) {
      removeDifficulty(surahNumber, currentAyah.ayahNumber);
      setDifficultAyahs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentAyah.ayahNumber);
        return newSet;
      });
    }

    moveToNext();
  };

  const handleFail = () => {
    const newResults = [...testResults, false];
    setTestResults(newResults);

    if (!difficultAyahs.has(currentAyah.ayahNumber)) {
      addDifficulty(surahNumber, currentAyah.ayahNumber);
      setDifficultAyahs((prev) => new Set(prev).add(currentAyah.ayahNumber));
    }

    moveToNext();
  };

  const moveToNext = () => {
    if (currentAyahIndex < ayahs.length - 1) {
      setCurrentAyahIndex(currentAyahIndex + 1);
      setShowText(false);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    const endTime = Date.now();
    const timeSpent = Math.floor((endTime - startTime) / 1000);
    const passed = testResults.filter((r) => r).length;
    const total = testResults.length;
    const accuracy = total > 0 ? Math.round((passed / total) * 100) : 0;

    addTestResult(surahNumber, {
      date: Date.now(),
      ayahNumber: currentAyah.ayahNumber,
      passed: accuracy >= 80,
      accuracy,
      mistakes: ayahs
        .map((a, i) => (testResults[i] === false ? a.ayahNumber : -1))
        .filter((n) => n !== -1),
      timeSpent,
    });

    if (onComplete) {
      onComplete();
    }
  };

  const resetTest = () => {
    setCurrentAyahIndex(0);
    setShowText(false);
    setTestStarted(false);
    setTestResults([]);
    setStartTime(0);
  };

  if (!currentAyah) return null;

  const progressPercentage = ayahs.length > 0 
    ? Math.round(((currentAyahIndex + (showText ? 1 : 0)) / ayahs.length) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {!testStarted ? (
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            اختبار الحفظ
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            ستحاول تسميع كل آية بدون النظر إلى النص. اضغط "إظهار النص" للتحقق من إجابتك.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>العدد الإجمالي:</strong> {ayahs.length} آية
            </p>
          </div>
          <button
            onClick={handleStartTest}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>بدء الاختبار</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* شريط التقدم */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                الآية {currentAyahIndex + 1} من {ayahs.length}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* عرض الآية */}
          <div className="min-h-[200px] flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-900/20 rounded-lg p-8 border-2 border-amber-200 dark:border-amber-800">
            {showText ? (
              <>
                <p
                  className="text-3xl leading-loose font-quran text-gray-900 dark:text-gray-100 text-center"
                  dir="rtl"
                >
                  {currentAyah.text}
                </p>
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handlePass}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>صحيح</span>
                  </button>
                  <button
                    onClick={handleFail}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>خطأ</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleShowText}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors mb-4"
                >
                  <Eye className="w-5 h-5" />
                  <span>إظهار النص للتحقق</span>
                </button>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  اقرأ الآية من ذاكرتك، ثم اضغط الزر أعلاه للتحقق
                </p>
                {difficultAyahs.has(currentAyah.ayahNumber) && (
                  <div className="mt-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg px-4 py-2">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ هذه الآية تحتاج مزيد من التركيز
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* الإحصائيات */}
          {testResults.length > 0 && (
            <div className="flex gap-4 justify-center">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-2">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>صحيح:</strong> {testResults.filter((r) => r).length}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-2">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>خطأ:</strong> {testResults.filter((r) => !r).length}
                </p>
              </div>
            </div>
          )}

          {/* زر إعادة */}
          <button
            onClick={resetTest}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة الاختبار</span>
          </button>
        </div>
      )}
    </div>
  );
}

