import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, BookmarkCheck, Headphones, GraduationCap, Brain, Target } from 'lucide-react';
import { getSurahAyahs, getMushafPagesForSurah } from '../utils/database';
import { getAyahTimings } from '../utils/audioTimings';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import AudioControls from './AudioPlayer/AudioControls';
import ReciterSelector from './AudioPlayer/ReciterSelector';
import RecitationTest from './RecitationTest';
import MushafPage from './MushafPage';
import StudyMode from './Memorization/StudyMode';
import MemorizationTest from './Memorization/MemorizationTest';
import ProgressTracker from './Memorization/ProgressTracker';
import { useMemorization } from '../hooks/useMemorization';
import type { Ayah, Surah, Reciter, WordTiming, MushafPage as MushafPageData } from '../types/quran';

interface EnhancedSurahViewerProps {
  surahNumber: number;
  onBack: () => void;
  surahs: Surah[];
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  toggleBookmark: (surahNumber: number, ayahNumber: number) => void;
  fontSize: string;
  selectedReciter: Reciter | null;
  onReciterChange: (reciter: Reciter) => void;
  hideTextMode: boolean;
  onToggleHideText: () => void;
  initialAyah?: number | null;
}

export default function EnhancedSurahViewer({
  surahNumber,
  onBack,
  surahs,
  isBookmarked,
  toggleBookmark,
  fontSize,
  selectedReciter,
  onReciterChange,
  hideTextMode,
  onToggleHideText,
  initialAyah = null,
}: EnhancedSurahViewerProps) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [currentTimings, setCurrentTimings] = useState<WordTiming[] | null>(null);
  const [currentTimestampFrom, setCurrentTimestampFrom] = useState<number | undefined>(undefined);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showRecitationTest, setShowRecitationTest] = useState(false);
  const [showStudyMode, setShowStudyMode] = useState(false);
  const [showMemorizationTest, setShowMemorizationTest] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [pages, setPages] = useState<MushafPageData[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [contentMode, setContentMode] = useState<'mushaf' | 'text'>('mushaf');
  
  const { addStudyTime } = useMemorization();
  
  // تتبع وقت الدراسة
  useEffect(() => {
    if (showStudyMode || showMemorizationTest) {
      const startTime = Date.now();
      return () => {
        const endTime = Date.now();
        const minutes = Math.floor((endTime - startTime) / 60000);
        if (minutes > 0) {
          addStudyTime(surahNumber, minutes);
        }
      };
    }
  }, [showStudyMode, showMemorizationTest, surahNumber, addStudyTime]);

  const surah = surahs.find((s) => s.number === surahNumber);
  const currentAyah = ayahs[currentAyahIndex];
  const surahMap = useMemo(() => new Map(surahs.map((s) => [s.number, s])), [surahs]);

  useEffect(() => {
    setLoading(true);
    getSurahAyahs(surahNumber)
      .then((data) => {
        setAyahs(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('خطأ في تحميل الآيات:', error);
        setLoading(false);
      });
  }, [surahNumber]);

  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    getMushafPagesForSurah(surahNumber)
      .then((data) => {
        if (!isMounted) return;
        setPages(data);
        setPageError(null);
        setContentMode((prev) => {
          if (data.length === 0) return 'text';
          return prev === 'text' ? prev : 'mushaf';
        });
      })
      .catch((error) => {
        console.error('خطأ في تحميل صفحات المصحف:', error);
        if (!isMounted) return;
        setPages([]);
        setPageError('تعذر تحميل صفحات المصحف');
        setContentMode('text');
      })
      .finally(() => {
        if (isMounted) {
          setPageLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [surahNumber]);

  useEffect(() => {
    if (!initialAyah || ayahs.length === 0) {
      return;
    }

    const targetIndex = ayahs.findIndex((ayah) => ayah.ayahNumber === initialAyah);
    if (targetIndex !== -1) {
      setCurrentAyahIndex(targetIndex);
    }
  }, [initialAyah, ayahs]);

  useEffect(() => {
    if (selectedReciter && currentAyah) {
      getAyahTimings(selectedReciter.id, currentAyah.surahNumber, currentAyah.ayahNumber, selectedReciter)
        .then((timingData) => {
          if (timingData) {
            setCurrentTimings(timingData.timings);
            setCurrentTimestampFrom(timingData.timestampFrom);
          }
        })
        .catch((error) => console.error('خطأ في تحميل التوقيتات:', error));
    }
  }, [selectedReciter, currentAyah]);

  const {
    playerState,
    currentTime,
    duration,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    setVolumeLevel,
    setRepeatMode,
  } = useAudioPlayer({
    reciter: selectedReciter,
    surahNumber: currentAyah?.surahNumber || surahNumber,
    ayahNumber: currentAyah?.ayahNumber || 1,
    timings: currentTimings,
    timestampFrom: currentTimestampFrom,
    onAyahEnd: () => {
      if (playerState.repeat === 'continuous' && currentAyahIndex < ayahs.length - 1) {
        setCurrentAyahIndex((prev) => prev + 1);
      } else if (playerState.repeat === 'ayah') {
        play();
      }
    },
  });

  const handleNextAyah = () => {
    if (currentAyahIndex < ayahs.length - 1) {
      setCurrentAyahIndex((prev) => prev + 1);
      stop();
    }
  };

  const handlePreviousAyah = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex((prev) => prev - 1);
      stop();
    }
  };

  const handleAyahSelectFromPage = (ayahNumber: number) => {
    const targetIndex = ayahs.findIndex((ayah) => ayah.ayahNumber === ayahNumber);
    if (targetIndex !== -1) {
      setCurrentAyahIndex(targetIndex);
    }
  };

  const fontSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
    xlarge: 'text-4xl',
  };

  const highlightedAyah =
    playerState.currentAyah ||
    (currentAyah
      ? { surahNumber: currentAyah.surahNumber, ayahNumber: currentAyah.ayahNumber }
      : null);
  const highlightedWord = playerState.currentWord;
  const hasMushafPages = pages.length > 0 && !pageError;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري تحميل السورة...</div>
      </div>
    );
  }

  if (!surah) {
    return <div className="text-center text-red-500">السورة غير موجودة</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-4"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة إلى قائمة السور</span>
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg p-6 text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">{surah.arabicName}</h1>
          <p className="text-emerald-100">
            {surah.revelationType} • {surah.numberOfAyahs} آية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setShowAudioPlayer(!showAudioPlayer)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
          >
            <Headphones className="w-5 h-5" />
            <span>التلاوة الصوتية</span>
          </button>

          <button
            onClick={() => setShowRecitationTest(!showRecitationTest)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
          >
            <span>التحقق من القراءة</span>
          </button>

          <button
            onClick={() => {
              setShowStudyMode(!showStudyMode);
              setShowMemorizationTest(false);
              setShowProgressTracker(false);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <GraduationCap className="w-5 h-5" />
            <span>وضع الدراسة</span>
          </button>

          <button
            onClick={() => {
              setShowMemorizationTest(!showMemorizationTest);
              setShowStudyMode(false);
              setShowProgressTracker(false);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
          >
            <Brain className="w-5 h-5" />
            <span>اختبار الحفظ</span>
          </button>

          <button
            onClick={() => {
              setShowProgressTracker(!showProgressTracker);
              setShowStudyMode(false);
              setShowMemorizationTest(false);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
          >
            <Target className="w-5 h-5" />
            <span>تتبع التقدم</span>
          </button>
        </div>

        {showAudioPlayer && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <ReciterSelector
                selectedReciterId={selectedReciter?.id || null}
                onReciterChange={onReciterChange}
              />
            </div>

            {currentAyah && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  الآية الحالية: {currentAyah.ayahNumber}
                </p>
                {!hideTextMode && (
                  <p
                    className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-quran text-gray-900 dark:text-gray-100`}
                    dir="rtl"
                  >
                    {currentTimings && playerState.isPlaying ? (
                      currentAyah.text.split(' ').map((word, index) => (
                        <span
                          key={index}
                          className={`${
                            playerState.currentWord === index + 1
                              ? 'bg-emerald-400 dark:bg-emerald-600 text-white font-bold scale-110'
                              : 'bg-transparent'
                          } transition-all duration-200 px-1 rounded inline-block`}
                        >
                          {word}
                        </span>
                      ))
                    ) : (
                      currentAyah.text
                    )}
                  </p>
                )}
              </div>
            )}

            <AudioControls
              isPlaying={playerState.isPlaying}
              currentTime={currentTime}
              duration={duration}
              playbackSpeed={playerState.playbackSpeed}
              repeat={playerState.repeat}
              reciter={selectedReciter}
              onPlay={play}
              onPause={pause}
              onSeek={seek}
              onSpeedChange={setSpeed}
              onRepeatChange={setRepeatMode}
              onNext={handleNextAyah}
              onPrevious={handlePreviousAyah}
            />
          </div>
        )}

        {showRecitationTest && currentAyah && (
          <div className="mb-6">
            <RecitationTest
              originalText={currentAyah.text}
              ayahNumber={currentAyah.ayahNumber}
              surahName={surah.name}
              hideTextMode={hideTextMode}
              onToggleHideText={onToggleHideText}
            />
          </div>
        )}

        {showStudyMode && ayahs.length > 0 && (
          <div className="mb-6">
            <StudyMode
              surahNumber={surahNumber}
              ayahs={ayahs}
              fontSize={fontSize}
            />
          </div>
        )}

        {showMemorizationTest && ayahs.length > 0 && (
          <div className="mb-6">
            <MemorizationTest
              surahNumber={surahNumber}
              ayahs={ayahs}
              onComplete={() => {
                setShowMemorizationTest(false);
              }}
            />
          </div>
        )}

        {showProgressTracker && (
          <div className="mb-6">
            <ProgressTracker
              surahNumber={surahNumber}
              surah={surah}
              onStatusChange={() => {
                // يمكن إضافة أي إجراء عند تغيير الحالة
              }}
            />
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2">
            <button
              type="button"
              onClick={() => setContentMode('mushaf')}
              disabled={!hasMushafPages || pageLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                contentMode === 'mushaf'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40'
              } disabled:text-gray-400 disabled:dark:text-gray-600 disabled:cursor-not-allowed`}
            >
              عرض المصحف
            </button>
            <button
              type="button"
              onClick={() => setContentMode('text')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                contentMode === 'text'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40'
              }`}
            >
              عرض نصي
            </button>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 min-h-[1.5rem]">
            {pageLoading && 'جاري تحميل صفحات المصحف...'}
            {!pageLoading && pageError && (
              <span className="text-red-500 dark:text-red-400">{pageError}</span>
            )}
          </div>
        </div>
      </div>

      {contentMode === 'mushaf' && hasMushafPages && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-2xl bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20 rounded-lg shadow-2xl overflow-hidden">
            {pages.map((pageData, index) => (
              <div key={pageData.pageNumber}>
                <MushafPage
                  page={pageData}
                  surahMap={surahMap}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                  activeAyah={highlightedAyah}
                  activeWord={highlightedWord}
                  onAyahSelect={handleAyahSelectFromPage}
                />
                {index < pages.length - 1 && (
                  <div className="h-1 bg-amber-200 dark:bg-amber-800 border-t border-b border-amber-300 dark:border-amber-700"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(contentMode === 'text' || !hasMushafPages) && (
        <div className="space-y-6">
          {surahNumber !== 1 && surahNumber !== 9 && (
            <div className="text-center py-4">
              <p
                className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} font-quran text-gray-900 dark:text-gray-100`}
              >
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          )}

          {ayahs.map((ayah, index) => {
            const isActive =
              highlightedAyah &&
              highlightedAyah.surahNumber === ayah.surahNumber &&
              highlightedAyah.ayahNumber === ayah.ayahNumber;

            return (
              <div
                key={`${ayah.surahNumber}-${ayah.ayahNumber}`}
                className={`bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/20'
                    : 'border-gray-200 dark:border-gray-700'
                } cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md`}
                onClick={() => {
                  setCurrentAyahIndex(index);
                  if (playerState.isPlaying) {
                    stop();
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1" dir="rtl">
                    {!hideTextMode && (
                      <p
                        className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-quran ${
                          isActive ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-gray-100'
                        } mb-3`}
                      >
                        {ayah.text}{' '}
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm mr-2 ${
                            isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {ayah.ayahNumber}
                        </span>
                      </p>
                    )}
                    {hideTextMode && (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                        <p className="text-lg">النص مخفي - الآية {ayah.ayahNumber}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(ayah.surahNumber, ayah.ayahNumber);
                    }}
                    className={`flex-shrink-0 transition-colors ${
                      isBookmarked(ayah.surahNumber, ayah.ayahNumber)
                        ? 'text-amber-500'
                        : 'text-gray-400 hover:text-emerald-500'
                    }`}
                    title={
                      isBookmarked(ayah.surahNumber, ayah.ayahNumber)
                        ? 'إزالة الإشارة المرجعية'
                        : 'إضافة إشارة مرجعية'
                    }
                  >
                    {isBookmarked(ayah.surahNumber, ayah.ayahNumber) ? (
                      <BookmarkCheck className="w-6 h-6" />
                    ) : (
                      <Bookmark className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
