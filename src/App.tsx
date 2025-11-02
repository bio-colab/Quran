import { useState, useEffect } from 'react';
import { BookOpen, Search, Bookmark, Settings as SettingsIcon, BarChart3, GraduationCap, RotateCcw } from 'lucide-react';
import LoadingScreen from './components/LoadingScreen';
import SurahList from './components/SurahList';
import EnhancedSurahViewer from './components/EnhancedSurahViewer';
import SearchComponent from './components/Search';
import Bookmarks from './components/Bookmarks';
import Settings from './components/Settings';
import MemorizationCenter from './components/Memorization/MemorizationCenter';
import { useBookmarks } from './hooks/useBookmarks';
import { useSettings } from './hooks/useSettings';
import { useNotifications } from './hooks/useNotifications';
import { loadReciters } from './utils/audioTimings';
import type { ViewMode, Surah, Reciter } from './types/quran';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('surahs');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [initialAyah, setInitialAyah] = useState<number | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  
  const { bookmarks, addBookmark, removeBookmark, isBookmarked, getBookmark } = useBookmarks();
  const { settings, updateSettings } = useSettings();
  const { reviewStats } = useNotifications();

  useEffect(() => {
    fetch('/surahs-data.json')
      .then((res) => res.json())
      .then((data) => setSurahs(data))
      .catch((error) => console.error('خطأ في تحميل بيانات السور:', error));

    loadReciters()
      .then((data) => {
        setReciters(data);
        // اختيار القارئ الافتراضي
        const defaultReciter = data.find((r) => r.id === (settings.selectedReciter || 20));
        if (defaultReciter) {
          setSelectedReciter(defaultReciter);
        } else if (data.length > 0) {
          setSelectedReciter(data[0]);
        }
      })
      .catch((error) => console.error('خطأ في تحميل القراء:', error));
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleSurahSelect = (surahNumber: number, ayahNumber?: number) => {
    setSelectedSurah(surahNumber);
    setInitialAyah(ayahNumber ?? null);
    setViewMode('surah');
  };

  const handleBackToList = () => {
    setViewMode('surahs');
    setSelectedSurah(null);
    setInitialAyah(null);
  };

  const toggleBookmark = (surahNumber: number, ayahNumber: number) => {
    if (isBookmarked(surahNumber, ayahNumber)) {
      const bookmark = getBookmark(surahNumber, ayahNumber);
      if (bookmark) {
        removeBookmark(bookmark.id);
      }
    } else {
      addBookmark(surahNumber, ayahNumber);
    }
  };

  const handleReciterChange = (reciter: Reciter) => {
    setSelectedReciter(reciter);
    updateSettings({ selectedReciter: reciter.id });
  };


  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  // عرض شاشة التحميل
  if (isLoading) {
    return <LoadingScreen onLoadComplete={handleLoadComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" dir="rtl">
              القرآن الكريم
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('surahs')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'surahs' || viewMode === 'surah'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="قائمة السور"
              >
                <BookOpen className="w-6 h-6" />
              </button>
              <button
                onClick={() => setViewMode('search')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'search'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="البحث"
              >
                <Search className="w-6 h-6" />
              </button>
              <button
                onClick={() => setViewMode('bookmarks')}
                className={`p-2 rounded-lg transition-colors relative ${
                  viewMode === 'bookmarks'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="الإشارات المرجعية"
              >
                <Bookmark className="w-6 h-6" />
                {bookmarks.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {bookmarks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('memorization')}
                className={`p-2 rounded-lg transition-colors relative ${
                  viewMode === 'memorization'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="مركز الحفظ"
              >
                <GraduationCap className="w-6 h-6" />
                {reviewStats.today > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {reviewStats.today}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('settings')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'settings'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="الإعدادات"
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'surahs' && (
          <SurahList
            onSurahSelect={handleSurahSelect}
            onSearch={() => setViewMode('search')}
          />
        )}

        {viewMode === 'surah' && selectedSurah && (
          <EnhancedSurahViewer
            surahNumber={selectedSurah}
            onBack={handleBackToList}
            surahs={surahs}
            isBookmarked={isBookmarked}
            toggleBookmark={toggleBookmark}
            fontSize={settings.fontSize}
            selectedReciter={selectedReciter}
            onReciterChange={handleReciterChange}
            initialAyah={initialAyah}
          />
        )}

        {viewMode === 'search' && (
          <SearchComponent
            onBack={() => setViewMode('surahs')}
            surahs={surahs}
            onAyahClick={handleSurahSelect}
            fontSize={settings.fontSize}
          />
        )}

        {viewMode === 'bookmarks' && (
          <Bookmarks
            onBack={() => setViewMode('surahs')}
            bookmarks={bookmarks}
            surahs={surahs}
            onRemoveBookmark={removeBookmark}
            onAyahClick={handleSurahSelect}
            fontSize={settings.fontSize}
          />
        )}

        {viewMode === 'memorization' && (
          <MemorizationCenter
            surahs={surahs}
            onBack={() => setViewMode('surahs')}
            onSurahSelect={handleSurahSelect}
          />
        )}

        {viewMode === 'settings' && (
          <Settings
            onBack={() => setViewMode('surahs')}
            settings={settings}
            updateSettings={updateSettings}
          />
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
          <p dir="rtl">تطبيق القرآن الكريم • يعمل بدون اتصال بالإنترنت</p>
        </div>
      </footer>
    </div>
  );
}

export default App;