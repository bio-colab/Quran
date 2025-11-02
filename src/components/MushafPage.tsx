import type { MushafPage as MushafPageData, MushafLine, MushafWord, Surah } from '../types/quran';

interface MushafPageProps {
  page: MushafPageData;
  surahMap: Map<number, Surah>;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  onToggleBookmark: (surahNumber: number, ayahNumber: number) => void;
  activeAyah?: { surahNumber: number; ayahNumber: number } | null;
  activeWord?: number | null;
  onAyahSelect?: (ayahNumber: number) => void;
}

const BASMALLAH_GLYPH = '﷽';

const formatNumber = (value: number) => value.toLocaleString('ar-EG');

function renderBasmalah() {
  return <span className="inline-block text-3xl text-amber-800 dark:text-amber-300">{BASMALLAH_GLYPH}</span>;
}

function renderSurahName(line: MushafLine, surahMap: Map<number, Surah>) {
  const surah = line.surahReference ? surahMap.get(line.surahReference) : undefined;
  return (
    <span className="inline-flex items-center justify-center px-6 py-3 text-xl text-amber-900 dark:text-amber-100 border-2 border-amber-300 dark:border-amber-700 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 font-semibold">
      {surah?.arabicName || `سورة ${formatNumber(line.surahReference || 0)}`}
    </span>
  );
}

function renderWord(
  word: MushafWord,
  props: Pick<MushafPageProps, 'isBookmarked' | 'onToggleBookmark' | 'activeAyah' | 'activeWord' | 'onAyahSelect'>,
) {
  const { isBookmarked, onToggleBookmark, activeAyah, activeWord, onAyahSelect } = props;
  const isActiveAyah =
    !!activeAyah && word.surahNumber === activeAyah.surahNumber && word.ayahNumber === activeAyah.ayahNumber;
  const isActiveWord = isActiveAyah && activeWord !== null && !word.isAyahMarker && activeWord === word.wordNumber;

  if (word.isAyahMarker) {
    const bookmarked = isBookmarked(word.surahNumber, word.ayahNumber);
    return (
      <button
        key={`ayah-marker-${word.wordNumberAll}`}
        onClick={() => {
          onToggleBookmark(word.surahNumber, word.ayahNumber);
          if (onAyahSelect) {
            onAyahSelect(word.ayahNumber);
          }
        }}
        className={`mx-0.5 inline-flex items-center justify-center text-xl transition-transform duration-200 focus:outline-none ${
          bookmarked ? 'text-amber-600 dark:text-amber-400' : 'text-amber-800 dark:text-amber-300 hover:text-amber-600 dark:hover:text-amber-400'
        } ${isActiveAyah ? 'scale-110' : ''}`}
        title={bookmarked ? 'إزالة الإشارة المرجعية' : 'إضافة إشارة مرجعية'}
      >
        <span className="font-quran leading-none" aria-hidden="true">
          {word.text}
        </span>
        <span className="sr-only">
          {`سورة ${formatNumber(word.surahNumber)} الآية ${formatNumber(word.ayahNumber)}`}
        </span>
      </button>
    );
  }

  return (
    <span
      key={`word-${word.wordNumberAll}`}
      className={`mx-0.5 inline-block transition-colors duration-150 ${
        isActiveWord
          ? 'bg-emerald-400 dark:bg-emerald-600 text-white px-1 rounded'
          : isActiveAyah
          ? 'text-emerald-700 dark:text-emerald-400 font-medium'
          : 'text-gray-900 dark:text-amber-50'
      }`}
    >
      {word.text}
    </span>
  );
}

function renderLineContent(line: MushafLine, props: Omit<MushafPageProps, 'page'>) {
  if (line.type === 'basmallah') {
    return renderBasmalah();
  }

  if (line.type === 'surah_name') {
    return renderSurahName(line, props.surahMap);
  }

  return line.words.map((word) => renderWord(word, props));
}

export default function MushafPage({ page, ...props }: MushafPageProps) {
  return (
    <div className="relative bg-amber-50 dark:bg-amber-950/20 border-l-2 border-r-2 border-amber-200 dark:border-amber-800 shadow-lg">
      {/* رأس الصفحة */}
      <div className="absolute top-2 left-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
        ص {formatNumber(page.pageNumber)}
      </div>
      <div className="absolute top-2 right-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
        صفحة
      </div>
      
      {/* محتوى الصفحة */}
      <div className="px-8 py-6 space-y-3 min-h-[600px]" dir="rtl">
        {page.lines.map((line) => (
          <div
            key={`${page.pageNumber}-${line.line}`}
            className={`text-2xl leading-[3rem] font-quran text-gray-900 dark:text-amber-50 ${
              line.isCentered ? 'text-center' : 'text-right'
            }`}
            style={{
              letterSpacing: '0.02em',
            }}
          >
            {renderLineContent(line, props)}
          </div>
        ))}
      </div>
      
      {/* أسفل الصفحة */}
      <div className="h-2 bg-gradient-to-b from-transparent to-amber-100 dark:to-amber-900/30"></div>
    </div>
  );
}
