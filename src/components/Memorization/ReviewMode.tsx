import { useState, useEffect, useRef } from 'react';
import { BookOpen, RotateCcw, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemorization } from '../../hooks/useMemorization';
import { useSpacedRepetition } from '../../hooks/useSpacedRepetition';
import type { Ayah, Surah } from '../../types/quran';
import type { MemorizationProgress } from '../../types/memorization';

interface ReviewModeProps {
  surahs: Surah[];
  onBack: () => void;
  onAyahReview: (surahNumber: number, ayahNumber: number, correct: boolean) => void;
}

export default function ReviewMode({ surahs, onBack, onAyahReview }: ReviewModeProps) {
  const [reviewMode, setReviewMode] = useState<'selection' | 'review' | 'results'>('selection');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [reviewType, setReviewType] = useState<'all' | 'difficult' | 'due'>('due');
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [showText, setShowText] = useState(false);
  const [reviewResults, setReviewResults] = useState<{ correct: boolean; ayahNumber: number; surahNumber: number }[]>([]);
  
  const { getProgress } = useMemorization();
  const { getDueReviews } = useSpacedRepetition();
  
  // Reference for smooth scrolling
  const reviewContentRef = useRef<HTMLDivElement>(null);
  
  // الحصول على السور ذات المراجعات المستحقة
  const dueReviews = getDueReviews();
  const dueSurahs = dueReviews.map(item => item.surahNumber);
  
  // الحصول على الآيات للمراجعة
  const getAyahsForReview = (): { surahNumber: number; ayahNumber: number; text: string }[] => {
    if (!selectedSurah) return [];
    
    const progress = getProgress(selectedSurah);
    if (!progress) return [];
    
    // تحميل نص الآيات (هذا مبسط - في التطبيق الحقيقي يجب تحميل النص من قاعدة البيانات)
    const surah = surahs.find(s => s.number === selectedSurah);
    if (!surah) return [];
    
    // محاكاة الآيات - في التطبيق الحقيقي يجب استرجاعها من قاعدة البيانات
    const mockAyahs = Array.from({ length: surah.numberOfAyahs }, (_, i) => ({
      surahNumber: selectedSurah,
      ayahNumber: i + 1,
      text: `آية ${i + 1} من سورة ${surah.name}` // نص تجريبي
    }));
    
    // تصفية حسب نوع المراجعة
    if (reviewType === 'difficult' && progress.difficulties.length > 0) {
      return mockAyahs.filter(ayah => progress.difficulties.includes(ayah.ayahNumber));
    }
    
    return mockAyahs;
  };
  
  const ayahsForReview = getAyahsForReview();
  const currentAyah = ayahsForReview[currentAyahIndex];
  
  // Scroll to top when changing ayah
  useEffect(() => {
    if (reviewContentRef.current && reviewMode === 'review') {
      reviewContentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentAyahIndex, reviewMode]);
  
  const handleStartReview = () => {
    if (selectedSurah) {
      setReviewMode('review');
      setCurrentAyahIndex(0);
      setShowText(false);
      setReviewResults([]);
    }
  };
  
  const handleShowText = () => {
    setShowText(true);
  };
  
  const handleCorrect = () => {
    if (currentAyah) {
      setReviewResults(prev => [...prev, { 
        correct: true, 
        ayahNumber: currentAyah.ayahNumber, 
        surahNumber: currentAyah.surahNumber 
      }]);
      moveToNext();
    }
  };
  
  const handleIncorrect = () => {
    if (currentAyah) {
      setReviewResults(prev => [...prev, { 
        correct: false, 
        ayahNumber: currentAyah.ayahNumber, 
        surahNumber: currentAyah.surahNumber 
      }]);
      moveToNext();
    }
  };
  
  const moveToNext = () => {
    if (currentAyahIndex < ayahsForReview.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
      setShowText(false);
    } else {
      setReviewMode('results');
    }
  };
  
  const moveToPrevious = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(prev => prev - 1);
      setShowText(false);
    }
  };
  
  const handleReset = () => {
    setReviewMode('selection');
    setSelectedSurah(null);
    setCurrentAyahIndex(0);
    setShowText(false);
    setReviewResults([]);
  };
  
  const getSurahName = (surahNumber: number) => {
    return surahs.find(s => s.number === surahNumber)?.name || `سورة ${surahNumber}`;
  };
  
  // إحصائيات المراجعة
  const correctCount = reviewResults.filter(r => r.correct).length;
  const totalCount = reviewResults.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  
  // Calculate progress percentage
  const progressPercentage = ayahsForReview.length > 0 
    ? Math.round(((currentAyahIndex + (showText ? 1 : 0)) / ayahsForReview.length) * 100)
    : 0;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-4"
        >
          <BookOpen className="w-5 h-5" />
          <span>العودة إلى القائمة</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          وضع المراجعة
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          راجع ما حفظته باستخدام نظام المراجعة المتكررة
        </p>
      </div>
      
      {reviewMode === 'selection' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            اختر سورة للمراجعة
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                السور ذات المراجعات المستحقة
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dueSurahs.length > 0 ? (
                  dueSurahs.map(surahNumber => (
                    <button
                      key={surahNumber}
                      onClick={() => setSelectedSurah(surahNumber)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        selectedSurah === surahNumber
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{getSurahName(surahNumber)}</span>
                        <span className="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded">
                          مراجعة مستحقة
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>لا توجد مراجعات مستحقة حالياً</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                جميع السور المحفوظة
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {surahs
                  .filter(surah => {
                    const progress = getProgress(surah.number);
                    return progress && (progress.status === 'memorized' || progress.status === 'mastered');
                  })
                  .map(surah => (
                    <button
                      key={surah.number}
                      onClick={() => setSelectedSurah(surah.number)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        selectedSurah === surah.number
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{surah.name}</span>
                        {!dueSurahs.includes(surah.number) && (
                          <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            مراجعة عادية
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
          
          {selectedSurah && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                نوع المراجعة
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setReviewType('due')}
                  className={`p-4 rounded-lg border transition-colors text-center ${
                    reviewType === 'due'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <h4 className="font-medium mb-1">المراجعات المستحقة</h4>
                  <p className="text-sm opacity-80">الآيات التي تحتاج مراجعة حسب الخوارزمية</p>
                </button>
                
                <button
                  onClick={() => setReviewType('difficult')}
                  className={`p-4 rounded-lg border transition-colors text-center ${
                    reviewType === 'difficult'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <h4 className="font-medium mb-1">الآيات الصعبة</h4>
                  <p className="text-sm opacity-80">مراجعة الآيات التي تم تحديدها كصعبة</p>
                </button>
                
                <button
                  onClick={() => setReviewType('all')}
                  className={`p-4 rounded-lg border transition-colors text-center ${
                    reviewType === 'all'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <h4 className="font-medium mb-1">جميع الآيات</h4>
                  <p className="text-sm opacity-80">مراجعة جميع آيات السورة</p>
                </button>
              </div>
              
              <button
                onClick={handleStartReview}
                className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                بدء المراجعة
              </button>
            </div>
          )}
        </div>
      )}
      
      {reviewMode === 'review' && currentAyah && (
        <div ref={reviewContentRef} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              مراجعة: {getSurahName(currentAyah.surahNumber)}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentAyahIndex + 1} من {ayahsForReview.length}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                التقدم
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="min-h-[300px] flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-900/20 rounded-lg p-8 border-2 border-amber-200 dark:border-amber-800">
            {showText ? (
              <>
                <p
                  className="text-3xl leading-loose font-quran text-gray-900 dark:text-gray-100 text-center mb-8"
                  dir="rtl"
                >
                  {currentAyah.text}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleCorrect}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>صحيح</span>
                  </button>
                  <button
                    onClick={handleIncorrect}
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
                  <span>إظهار الآية للمراجعة</span>
                </button>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  اقرأ الآية من ذاكرتك، ثم اضغط الزر أعلاه للتحقق
                </p>
              </>
            )}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إلغاء المراجعة</span>
            </button>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                accuracy >= 80 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                  : accuracy >= 60 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}>
                <span>{accuracy}%</span>
                <span>دقة</span>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {correctCount}/{totalCount}
              </div>
            </div>
          </div>
          
          {/* Navigation buttons with smooth scrolling */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={moveToPrevious}
              disabled={currentAyahIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentAyahIndex === 0
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابقة</span>
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentAyahIndex + 1} / {ayahsForReview.length}
            </span>

            <button
              onClick={moveToNext}
              disabled={currentAyahIndex === ayahsForReview.length - 1 && showText}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentAyahIndex === ayahsForReview.length - 1 && showText
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {reviewMode === 'results' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            نتائج المراجعة
          </h2>
          
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-2">
              {accuracy}%
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {correctCount} من {totalCount} إجابات صحيحة
            </div>
            
            <div className={`inline-block px-4 py-2 rounded-full mt-4 ${
              accuracy >= 90 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                : accuracy >= 70 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' 
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
            }`}>
              {accuracy >= 90 ? 'ممتاز!' : accuracy >= 70 ? 'جيد جداً' : 'يمكنك التحسين'}
            </div>
          </div>
          
          {/* Progress visualization */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 text-center">أداء المراجعة</h3>
            <div className="flex justify-center gap-1">
              {Array.from({ length: Math.min(20, totalCount) }).map((_, index) => {
                const resultIndex = Math.floor((index / 20) * totalCount);
                const result = reviewResults[resultIndex];
                return (
                  <div 
                    key={index}
                    className={`w-3 h-8 rounded-sm ${
                      result?.correct 
                        ? 'bg-green-500' 
                        : result !== undefined 
                          ? 'bg-red-500' 
                          : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">الآيات التي تحتاج مزيد من المراجعة</h3>
            
            {reviewResults.filter(r => !r.correct).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {reviewResults
                  .filter(r => !r.correct)
                  .map((result, index) => (
                    <div 
                      key={index}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 text-center"
                    >
                      <div className="text-sm font-medium text-red-800 dark:text-red-200">
                        {getSurahName(result.surahNumber)}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-300">
                        آية {result.ayahNumber}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-green-600 dark:text-green-400">
                لا توجد آيات تحتاج مراجعة إضافية. أحسنت!
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleReset}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
            >
              مراجعة جديدة
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              العودة للقائمة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}