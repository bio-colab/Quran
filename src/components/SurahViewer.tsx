import { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { getSurahAyahs } from '../utils/database';
import type { Ayah, Surah } from '../types/quran';

interface SurahViewerProps {
  surahNumber: number;
  onBack: () => void;
  surahs: Surah[];
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  toggleBookmark: (surahNumber: number, ayahNumber: number) => void;
  fontSize: string;
}

export default function SurahViewer({
  surahNumber,
  onBack,
  surahs,
  isBookmarked,
  toggleBookmark,
  fontSize,
}: SurahViewerProps) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);

  const surah = surahs.find((s) => s.number === surahNumber);

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

  const fontSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
    xlarge: 'text-4xl',
  };

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-4"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة إلى قائمة السور</span>
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">{surah.arabicName}</h1>
          <p className="text-emerald-100">
            {surah.revelationType} • {surah.numberOfAyahs} آية
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {surahNumber !== 1 && surahNumber !== 9 && (
          <div className="text-center py-4">
            <p className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} font-arabic text-gray-900 dark:text-gray-100`}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
          </div>
        )}

        {ayahs.map((ayah) => (
          <div
            key={`${ayah.surahNumber}-${ayah.ayahNumber}`}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1" dir="rtl">
                <p
                  className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-arabic text-gray-900 dark:text-gray-100 mb-3`}
                >
                  {ayah.text}{' '}
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full text-sm mr-2">
                    {ayah.ayahNumber}
                  </span>
                </p>
              </div>
              <button
                onClick={() => toggleBookmark(ayah.surahNumber, ayah.ayahNumber)}
                className="flex-shrink-0 text-gray-400 hover:text-emerald-500 transition-colors"
                title={isBookmarked(ayah.surahNumber, ayah.ayahNumber) ? 'إزالة الإشارة المرجعية' : 'إضافة إشارة مرجعية'}
              >
                {isBookmarked(ayah.surahNumber, ayah.ayahNumber) ? (
                  <BookmarkCheck className="w-6 h-6 text-emerald-500 fill-emerald-500" />
                ) : (
                  <Bookmark className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
