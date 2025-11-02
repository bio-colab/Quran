import { ArrowRight, Sun, Moon, Type, Info } from 'lucide-react';
import type { Settings as SettingsType } from '../types/quran';

import { useCapacitor } from '../hooks/useCapacitor';

interface SettingsProps {
  onBack: () => void;
  settings: SettingsType;
  updateSettings: (settings: Partial<SettingsType>) => void;
}

function Settings({ onBack, settings, updateSettings }: SettingsProps) {
  const { isNative, platform } = useCapacitor();
  
  const fontSizes = [
    { value: 'small', label: 'صغير' },
    { value: 'medium', label: 'متوسط' },
    { value: 'large', label: 'كبير' },
    { value: 'xlarge', label: 'كبير جداً' },
  ];

  const fontFamilies = [
    { value: 'uthmanic', label: 'الخط العثماني' },
    { value: 'naskh', label: 'خط النسخ' },
    { value: 'kufi', label: 'الخط الكوفي' },
  ];

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

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">الإعدادات</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            {settings.theme === 'dark' ? (
              <Moon className="w-6 h-6 text-emerald-500" />
            ) : (
              <Sun className="w-6 h-6 text-emerald-500" />
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">المظهر</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                settings.theme === 'light'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">النهاري</span>
            </button>
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                settings.theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm">الليلي</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">حجم الخط</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fontSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => updateSettings({ fontSize: size.value as any })}
                className={`py-3 px-4 rounded-lg border-2 transition-colors ${
                  settings.fontSize === size.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">نوع الخط</h2>
          </div>
          <div className="space-y-3">
            {fontFamilies.map((font) => (
              <button
                key={font.value}
                onClick={() => updateSettings({ fontFamily: font.value as any })}
                className={`w-full py-3 px-4 rounded-lg border-2 transition-colors text-right ${
                  settings.fontFamily === font.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
                dir="rtl"
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">معلومات عن التطبيق</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">المنصة</h3>
              <p className="text-blue-600 dark:text-blue-300">
                {isNative ? `تطبيق أندرويد (${platform})` : 'تطبيق ويب تقدمي'}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-200">حالة الاتصال</h3>
              <p className="text-green-600 dark:text-green-300">
                {isNative ? 'يعمل دون اتصال' : 'يعمل دون اتصال'}
              </p>
            </div>
          </div>
          
          {isNative && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">ميزة التطبيق الأصلي</h3>
              <p className="text-yellow-600 dark:text-yellow-300">
                أنت تستخدم الآن النسخة الأصلية من التطبيق التي توفر أداءً أفضل واستجابةً أسرع.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">حول التطبيق</h2>
          </div>
          <div className="space-y-2 text-gray-700 dark:text-gray-300" dir="rtl">
            <p>تطبيق القرآن الكريم - نسخة 1.0</p>
            <p className="text-sm text-gray-500">
              تطبيق ويب تقدمي لقراءة القرآن الكريم بميزات متقدمة
            </p>
            <p className="text-sm text-gray-500">
              يعمل بدون اتصال بالإنترنت • يدعم الإشارات المرجعية • بحث متقدم
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
