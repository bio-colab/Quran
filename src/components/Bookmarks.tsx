import { ArrowRight, Trash2 } from 'lucide-react';
import type { Bookmark, Surah } from '../types/quran';

interface BookmarksProps {
  onBack: () => void;
  bookmarks: Bookmark[];
  surahs: Surah[];
  onRemoveBookmark: (id: string) => void;
  onAyahClick: (surahNumber: number, ayahNumber?: number) => void;
  fontSize: string;
}

export default function Bookmarks({
  onBack,
  bookmarks,
  surahs,
  onRemoveBookmark,
  onAyahClick,
  fontSize,
}: BookmarksProps) {
  const getSurahName = (surahNumber: number) => {
    return surahs.find((s) => s.number === surahNumber)?.name || '';
  };

  const sortedBookmarks = [...bookmarks].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-4"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          الإشارات المرجعية
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {bookmarks.length} إشارة مرجعية محفوظة
        </p>
      </div>

      {sortedBookmarks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">لا توجد إشارات مرجعية محفوظة</p>
          <p className="text-sm text-gray-400 mt-2">
            يمكنك إضافة إشارات مرجعية من صفحة السورة
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onAyahClick(bookmark.surahNumber, bookmark.ayahNumber)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {getSurahName(bookmark.surahNumber)}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      الآية {bookmark.ayahNumber}
                    </span>
                  </div>
                  {bookmark.note && (
                    <p className="text-gray-700 dark:text-gray-300 mt-2" dir="rtl">
                      {bookmark.note}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    تم الحفظ في: {new Date(bookmark.timestamp).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveBookmark(bookmark.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  title="حذف الإشارة المرجعية"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
