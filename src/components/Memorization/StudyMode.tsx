import { useState, useEffect } from 'react';
import { Repeat, Focus, FileText, ChevronRight, ChevronLeft, Eye, EyeOff, Maximize, Minimize, X } from 'lucide-react';
import type { Ayah } from '../../types/quran';
import type { StudyModeConfig } from '../../types/memorization';

interface StudyModeProps {
  surahNumber: number;
  ayahs: Ayah[];
  fontSize: string;
  surahName?: string;
  onExit?: () => void;
}

type ModeType = 'focus' | 'repeat' | 'compare' | 'write';

export default function StudyMode({ surahNumber, ayahs, fontSize, surahName, onExit }: StudyModeProps) {
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [mode, setMode] = useState<ModeType>('focus');
  const [showText, setShowText] = useState(true);
  const [repeatCount, setRepeatCount] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [studyTime, setStudyTime] = useState(0);

  const currentAyah = ayahs[currentAyahIndex];
  const previousAyah = currentAyahIndex > 0 ? ayahs[currentAyahIndex - 1] : null;
  const nextAyah = currentAyahIndex < ayahs.length - 1 ? ayahs[currentAyahIndex + 1] : null;

  // Track study time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isFullscreen) {
      timer = setInterval(() => {
        setStudyTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isFullscreen]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fontSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
    xlarge: 'text-4xl',
  };

  const handlePrevious = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(currentAyahIndex - 1);
      setShowText(true);
    }
  };

  const handleNext = () => {
    if (currentAyahIndex < ayahs.length - 1) {
      setCurrentAyahIndex(currentAyahIndex + 1);
      setShowText(true);
    }
  };

  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode);
    setShowText(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderContent = () => {
    switch (mode) {
      case 'focus':
        return (
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            {showText ? (
              <>
                <p
                  className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-quran text-gray-900 dark:text-gray-100 text-center mb-6`}
                  dir="rtl"
                >
                  {currentAyah.text}
                </p>
                <button
                  onClick={() => setShowText(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>إخفاء</span>
                </button>
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  اقرأ الآية من ذاكرتك
                </p>
                <button
                  onClick={() => setShowText(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors mx-auto"
                >
                  <Eye className="w-4 h-4" />
                  <span>إظهار</span>
                </button>
              </div>
            )}
          </div>
        );

      case 'repeat':
        return (
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                كرر هذه الآية <strong>{repeatCount}</strong> مرات
              </p>
            </div>
            <p
              className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-quran text-gray-900 dark:text-gray-100 text-center`}
              dir="rtl"
            >
              {currentAyah.text}
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                -
              </button>
              <span className="px-4 py-1">{repeatCount}</span>
              <button
                onClick={() => setRepeatCount(repeatCount + 1)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        );

      case 'compare':
        return (
          <div className="space-y-6">
            {previousAyah && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  الآية السابقة ({previousAyah.ayahNumber})
                </p>
                <p
                  className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-quran text-gray-600 dark:text-gray-400`}
                  dir="rtl"
                >
                  {previousAyah.text}
                </p>
              </div>
            )}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border-2 border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2 font-medium">
                الآية الحالية ({currentAyah.ayahNumber})
              </p>
              <p
                className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-quran text-gray-900 dark:text-gray-100`}
                dir="rtl"
              >
                {currentAyah.text}
              </p>
            </div>
            {nextAyah && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  الآية التالية ({nextAyah.ayahNumber})
                </p>
                <p
                  className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-quran text-gray-600 dark:text-gray-400`}
                  dir="rtl"
                >
                  {nextAyah.text}
                </p>
              </div>
            )}
          </div>
        );

      case 'write':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                اكتب الآية من ذاكرتك في الحقل أدناه
              </p>
              <textarea
                className="w-full min-h-[200px] p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-right text-lg font-quran focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="rtl"
                placeholder="اكتب الآية هنا..."
              />
            </div>
            {showText ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">النص الصحيح:</p>
                <p
                  className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-quran text-gray-900 dark:text-gray-100`}
                  dir="rtl"
                >
                  {currentAyah.text}
                </p>
                <button
                  onClick={() => setShowText(false)}
                  className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  إخفاء النص
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowText(true)}
                className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                إظهار النص الصحيح
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Fullscreen mode component
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
        {/* Fullscreen header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {surahName} - الآية {currentAyah.ayahNumber}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatTime(studyTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="الخروج من وضع ملء الشاشة"
            >
              <Minimize className="w-5 h-5" />
            </button>
            {onExit && (
              <button
                onClick={onExit}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="إنهاء الجلسة"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Fullscreen content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-4xl">
            {renderContent()}
          </div>
        </div>

        {/* Fullscreen footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
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
          </div>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentAyahIndex + 1} / {ayahs.length}
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleNext}
              disabled={currentAyahIndex === ayahs.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentAyahIndex === ayahs.length - 1
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header with surah info and fullscreen button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {surahName && `${surahName} - `} الآية {currentAyah.ayahNumber}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            الوضع: {mode === 'focus' ? 'تركيز' : mode === 'repeat' ? 'تكرار' : mode === 'compare' ? 'مقارنة' : 'كتابة'} • 
            الوقت: {formatTime(studyTime)}
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="وضع ملء الشاشة"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      {/* أزرار اختيار الوضع */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleModeChange('focus')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'focus'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Focus className="w-4 h-4" />
          <span>تركيز</span>
        </button>
        <button
          onClick={() => handleModeChange('repeat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'repeat'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>تكرار</span>
        </button>
        <button
          onClick={() => handleModeChange('compare')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'compare'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>مقارنة</span>
        </button>
        <button
          onClick={() => handleModeChange('write')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'write'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>كتابة</span>
        </button>
      </div>

      {/* محتوى الوضع */}
      {renderContent()}

      {/* أزرار التنقل */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePrevious}
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
          {currentAyahIndex + 1} / {ayahs.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentAyahIndex === ayahs.length - 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentAyahIndex === ayahs.length - 1
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <span>التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}