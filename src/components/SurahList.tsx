import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, Target, Flame, RotateCcw, Play } from 'lucide-react';
import type { Surah, ReferenceIndex, ReferencePoint } from '../types/quran';
import { getMushafReferenceIndex } from '../utils/database';
import { useMemorization } from '../hooks/useMemorization';
import { useProgress } from '../hooks/useProgress';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';

interface SurahListProps {
  onSurahSelect: (surahNumber: number, ayahNumber?: number) => void;
  onSearch: () => void;
}

const TAB_ITEMS = [
  { id: 'surahs', label: 'السور', shortcut: 'Alt+1' },
  { id: 'juz', label: 'الأجزاء', shortcut: 'Alt+2' },
  { id: 'hizb', label: 'الأحزاب', shortcut: 'Alt+3' },
  { id: 'rub', label: 'الأرباع', shortcut: 'Alt+4' },
  { id: 'pages', label: 'الصفحات', shortcut: 'Alt+5' },
] as const;

type TabKey = (typeof TAB_ITEMS)[number]['id'];

const toArabicDigits = (value: number) => value.toLocaleString('ar-EG');

const normalizeSearchTerm = (term: string) => term.trim();

const getEntryHeading = (entry: ReferencePoint) => {
  switch (entry.type) {
    case 'juz':
      return `الجزء ${toArabicDigits(entry.index)}`;
    case 'hizb':
      return `الحزب ${toArabicDigits(entry.index)}`;
    case 'rub':
      return `الربع ${toArabicDigits(entry.index)}`;
    case 'page':
      return `الصفحة ${toArabicDigits(entry.page)}`;
    default:
      return '';
  }
};

function filterSurahs(surahs: Surah[], term: string) {
  if (!term) return surahs;
  return surahs.filter(
    (surah) =>
      surah.name.includes(term) ||
      surah.arabicName.includes(term) ||
      surah.number.toString().includes(term),
  );
}

function filterReferenceEntries(
  entries: ReferencePoint[],
  term: string,
  surahMap: Map<number, Surah>,
): ReferencePoint[] {
  if (!term) return entries;
  const arabicDigits = term
    .split('')
    .map((char) => {
      if (/[0-9]/.test(char)) {
        return toArabicDigits(parseInt(char, 10)).slice(-1);
      }
      return char;
    })
    .join('');

  return entries.filter((entry) => {
    const surah = surahMap.get(entry.surahNumber);
    const surahName = surah?.arabicName || '';
    const latinSummary = `${entry.index} ${entry.page} ${entry.ayahNumber}`;
    const arabicSummary = `${toArabicDigits(entry.index)} ${toArabicDigits(entry.page)} ${toArabicDigits(entry.ayahNumber)}`;

    return (
      surahName.includes(term) ||
      surahName.includes(arabicDigits) ||
      latinSummary.includes(term) ||
      arabicSummary.includes(term)
    );
  });
}

export default function SurahList({ onSurahSelect, onSearch }: SurahListProps) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [referenceIndex, setReferenceIndex] = useState<ReferenceIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('surahs');
  const [error, setError] = useState<string | null>(null);
  
  const { getProgress } = useMemorization();
  const { stats } = useProgress();
  const { reviewStats } = useSpacedRepetition();

  const surahMap = useMemo(() => new Map(surahs.map((surah) => [surah.number, surah])), [surahs]);
  
  const getStatusColor = (surahNumber: number) => {
    const progress = getProgress(surahNumber);
    if (!progress) return '';
    switch (progress.status) {
      case 'learning':
        return 'border-l-yellow-500';
      case 'memorized':
        return 'border-l-green-500';
      case 'mastered':
        return 'border-l-blue-500';
      default:
        return '';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [surahResponse, references] = await Promise.all([
          fetch('/surahs-data.json').then((res) => {
            if (!res.ok) {
              throw new Error('فشل تحميل بيانات السور');
            }
            return res.json();
          }),
          getMushafReferenceIndex(),
        ]);

        if (!isMounted) return;

        setSurahs(surahResponse);
        setReferenceIndex(references);
      } catch (err) {
        console.error('خطأ في تحميل بيانات الفهرس:', err);
        if (isMounted) {
          setError('تعذر تحميل بيانات الفهرسة');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey) return;

      switch (event.key) {
        case '1':
          setActiveTab('surahs');
          break;
        case '2':
          setActiveTab('juz');
          break;
        case '3':
          setActiveTab('hizb');
          break;
        case '4':
          setActiveTab('rub');
          break;
        case '5':
          setActiveTab('pages');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const normalizedTerm = normalizeSearchTerm(searchTerm);

  const filteredSurahs = useMemo(
    () => filterSurahs(surahs, normalizedTerm),
    [surahs, normalizedTerm],
  );

  const filteredJuz = useMemo(
    () =>
      referenceIndex
        ? filterReferenceEntries(referenceIndex.juz, normalizedTerm, surahMap)
        : [],
    [referenceIndex, normalizedTerm, surahMap],
  );

  const filteredHizb = useMemo(
    () =>
      referenceIndex
        ? filterReferenceEntries(referenceIndex.hizb, normalizedTerm, surahMap)
        : [],
    [referenceIndex, normalizedTerm, surahMap],
  );

  const filteredRub = useMemo(
    () =>
      referenceIndex
        ? filterReferenceEntries(referenceIndex.rub, normalizedTerm, surahMap)
        : [],
    [referenceIndex, normalizedTerm, surahMap],
  );

  const filteredPages = useMemo(
    () =>
      referenceIndex
        ? filterReferenceEntries(referenceIndex.pages, normalizedTerm, surahMap)
        : [],
    [referenceIndex, normalizedTerm, surahMap],
  );

  const renderReferenceList = (entries: ReferencePoint[]) => {
    if (!referenceIndex) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          يتم تجهيز البيانات المرجعية...
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          لا توجد عناصر مطابقة
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry) => {
          const surah = surahMap.get(entry.surahNumber);
          return (
            <button
              key={`${entry.type}-${entry.index}-${entry.page}-${entry.wordIndex}`}
              onClick={() => onSurahSelect(entry.surahNumber, entry.ayahNumber)}
              className="w-full flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors text-right"
            >
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {getEntryHeading(entry)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {surah?.arabicName || 'سورة غير معروفة'} • الآية {toArabicDigits(entry.ayahNumber)}
                </p>
              </div>
              <div className="flex flex-col items-end text-sm text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" /> ص {toArabicDigits(entry.page)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quick Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <Target className="w-8 h-8" />
            <span className="text-2xl font-bold">{stats.totalProgress}%</span>
          </div>
          <p className="text-emerald-50 text-sm mt-2">التقدم الإجمالي</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <Flame className="w-8 h-8" />
            <span className="text-2xl font-bold">{stats.currentStreak}</span>
          </div>
          <p className="text-orange-50 text-sm mt-2">أيام متتالية</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <RotateCcw className="w-8 h-8" />
            <span className="text-2xl font-bold">{reviewStats.today}</span>
          </div>
          <p className="text-blue-50 text-sm mt-2">مراجعات اليوم</p>
        </div>
      </div>

      {/* Daily Session Access */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-500" />
            الجلسة اليومية
          </h3>
          <button 
            onClick={() => {
              // This would navigate to a daily session page or modal
              // For now, we'll just show an alert
              alert('بدء الجلسة اليومية - سيتم تنفيذ هذه الميزة لاحقاً');
            }}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
          >
            بدء الجلسة
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
          استمر في تقدمك مع جلسة مخصصة بناءً على تقدمك الحالي
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن سورة أو مرجع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            dir="rtl"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6" role="tablist">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white shadow'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
            }`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tab-${tab.id}`}
          >
            <span className="ml-2">{tab.label}</span>
            <span className="text-xs text-emerald-900 dark:text-emerald-200">{tab.shortcut}</span>
          </button>
        ))}

        <button
          onClick={onSearch}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>بحث متقدم</span>
        </button>
      </div>

      <div id={`tab-${activeTab}`}>
        {activeTab === 'surahs' && (
          <div className="grid gap-3">
            {filteredSurahs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">لم يتم العثور على سور مطابقة</div>
            ) : (
              filteredSurahs.map((surah) => {
                const progress = getProgress(surah.number);
                const statusBadge = progress && progress.status !== 'new' ? (
                  <span className={`text-xs px-2 py-1 rounded ${
                    progress.status === 'learning' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                    progress.status === 'memorized' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  }`}>
                    {progress.status === 'learning' ? 'قيد الحفظ' :
                     progress.status === 'memorized' ? 'محفوظ' :
                     'متقن'}
                  </span>
                ) : null;
                
                return (
                  <button
                    key={surah.number}
                    onClick={() => onSurahSelect(surah.number)}
                    className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 ${getStatusColor(surah.number)} border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200`}
                    dir="rtl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold">
                        {surah.number}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{surah.arabicName}</h3>
                          {statusBadge}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {surah.revelationType} • {surah.numberOfAyahs} آية
                          {progress && progress.masteryScore > 0 && (
                            <span className="mr-2">• {progress.masteryScore}%</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <BookOpen className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'juz' && renderReferenceList(filteredJuz)}
        {activeTab === 'hizb' && renderReferenceList(filteredHizb)}
        {activeTab === 'rub' && renderReferenceList(filteredRub)}
        {activeTab === 'pages' && renderReferenceList(filteredPages)}
      </div>
    </div>
  );
}