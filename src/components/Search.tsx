import { useState, useEffect } from 'react';
import { Search as SearchIcon, ArrowRight, Loader } from 'lucide-react';
import { searchAyahs, searchAyahsInSurah } from '../utils/database';
import type { Ayah, Surah } from '../types/quran';

interface SearchProps {
  onBack: () => void;
  surahs: Surah[];
  onAyahClick: (surahNumber: number, ayahNumber?: number) => void;
  fontSize: string;
}

export default function Search({ onBack, surahs, onAyahClick, fontSize }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'surah' | 'relevance'>('surah');
  const [results, setResults] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  const handleSearch = async (page: number = 1) => {
    if (searchTerm.trim().length < 2) {
      alert('يرجى إدخال كلمتين على الأقل للبحث');
      return;
    }

    setLoading(true);
    setSearched(true);
    setCurrentPage(page);
    
    try {
      const offset = (page - 1) * resultsPerPage;
      let searchResult: { ayahs: Ayah[], totalCount: number };
      
      if (selectedSurah !== '') {
        // البحث في سورة محددة
        searchResult = await searchAyahsInSurah(selectedSurah as number, searchTerm.trim(), resultsPerPage, offset, sortBy);
      } else {
        // البحث في جميع السور
        searchResult = await searchAyahs(searchTerm.trim(), resultsPerPage, offset, sortBy);
      }
      
      setResults(searchResult.ayahs);
      setTotalCount(searchResult.totalCount);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      alert('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  // إعادة تعيين الصفحة عند تغيير معايير البحث
  useEffect(() => {
    if (searched) {
      handleSearch(1);
    }
  }, [selectedSurah, searchTerm, sortBy]);

  const getSurahName = (surahNumber: number) => {
    return surahs.find((s) => s.number === surahNumber)?.name || '';
  };

  const fontSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
    xlarge: 'text-3xl',
  };

  // حساب عدد الصفحات
  const totalPages = Math.ceil(totalCount / resultsPerPage);

  // إنشاء أرقام الصفحات للعرض
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // دائمًا إظهار الصفحة الأولى
      pages.push(1);
      
      // حساب الصفحات المجاورة للصفحة الحالية
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // تعديل النطاق إذا كانت الصفحة الحالية قريبة من البداية أو النهاية
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }
      
      // إضافة النقاط المAttributeValueة إذا لزم الأمر
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // إضافة النقاط المAttributeValueة إذا لزم الأمر
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // دائمًا إظهار الصفحة الأخيرة
      pages.push(totalPages);
    }
    
    return pages;
  };

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

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          البحث في القرآن الكريم
        </h1>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="ابحث عن كلمة أو عبارة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            dir="rtl"
          />
          <button
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <SearchIcon className="w-5 h-5" />
            )}
            <span>بحث</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* خيار البحث في سورة محددة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              البحث في سورة محددة:
            </label>
            <select
              value={selectedSurah}
              onChange={(e) => setSelectedSurah(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              dir="rtl"
            >
              <option value="">جميع السور</option>
              {surahs.map((surah) => (
                <option key={surah.number} value={surah.number}>
                  {surah.number}. {surah.name}
                </option>
              ))}
            </select>
          </div>

          {/* خيار ترتيب النتائج */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ترتيب النتائج:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'surah' | 'relevance')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              dir="rtl"
            >
              <option value="surah">حسب السورة</option>
              <option value="relevance">حسب الصلة</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">جاري البحث...</div>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">لم يتم العثور على نتائج</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            تم العثور على {totalCount} نتيجة
            {selectedSurah !== '' && ` في سورة ${getSurahName(selectedSurah as number)}`}
          </p>
          
          {results.map((ayah, index) => (
            <div
              key={`${ayah.surahNumber}-${ayah.ayahNumber}-${index}`}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
              onClick={() => onAyahClick(ayah.surahNumber, ayah.ayahNumber)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {getSurahName(ayah.surahNumber)}
                  </span>
                  <span>•</span>
                  <span>الآية {ayah.ayahNumber}</span>
                </div>
              </div>
              <p
                className={`${fontSizeClasses[fontSize as keyof typeof fontSizeClasses]} leading-loose font-arabic text-gray-900 dark:text-gray-100`}
                dir="rtl"
              >
                {ayah.text}
              </p>
            </div>
          ))}

          {/* ترقيم الصفحات */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                السابق
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handleSearch(page)}
                  className={`px-3 py-2 rounded-md ${
                    page === currentPage
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${page === '...' ? 'cursor-default' : ''}`}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handleSearch(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}