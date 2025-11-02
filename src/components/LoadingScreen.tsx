import { useEffect, useState } from 'react';
import { BookOpen, Loader2, CheckCircle } from 'lucide-react';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'db', label: 'تحميل قاعدة بيانات القرآن الكريم', status: 'pending' },
    { id: 'timing', label: 'تحميل بيانات التوقيت الصوتي', status: 'pending' },
    { id: 'reciters', label: 'تحميل معلومات القراء', status: 'pending' },
    { id: 'init', label: 'تهيئة التطبيق', status: 'pending' },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResources();
  }, []);

  const updateStep = (index: number, status: LoadingStep['status']) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status } : step
    ));
  };

  const loadResources = async () => {
    try {
      // خطوة 1: تحميل قاعدة البيانات الرئيسية
      setCurrentStepIndex(0);
      updateStep(0, 'loading');
      setProgress(10);
      
      const dbResponse = await fetch('/quran-data.sqlite');
      if (!dbResponse.ok) throw new Error('فشل تحميل قاعدة البيانات');
      await dbResponse.arrayBuffer(); // تحميل البيانات فعلياً
      
      setProgress(25);
      updateStep(0, 'completed');

      // خطوة 2: تحميل قاعدة بيانات التوقيت
      setCurrentStepIndex(1);
      updateStep(1, 'loading');
      setProgress(40);
      
      const timingResponse = await fetch('/reciter-audio-timing.sqlite');
      if (!timingResponse.ok) throw new Error('فشل تحميل بيانات التوقيت');
      await timingResponse.arrayBuffer(); // تحميل البيانات فعلياً
      
      setProgress(55);
      updateStep(1, 'completed');

      // خطوة 3: تحميل معلومات القراء
      setCurrentStepIndex(2);
      updateStep(2, 'loading');
      setProgress(70);
      
      const recitersResponse = await fetch('/reciters-data.json');
      if (!recitersResponse.ok) throw new Error('فشل تحميل معلومات القراء');
      await recitersResponse.json();
      
      setProgress(85);
      updateStep(2, 'completed');

      // خطوة 4: تهيئة التطبيق
      setCurrentStepIndex(3);
      updateStep(3, 'loading');
      setProgress(95);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStep(3, 'completed');
      setProgress(100);

      // الانتقال للتطبيق
      await new Promise(resolve => setTimeout(resolve, 400));
      onLoadComplete();

    } catch (err) {
      console.error('خطأ في التحميل:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات';
      setError(errorMessage);
      updateStep(currentStepIndex, 'error');
    }
  };

  const retryLoading = () => {
    setError(null);
    setProgress(0);
    setCurrentStepIndex(0);
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    loadResources();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <BookOpen className="w-20 h-20 text-emerald-600 dark:text-emerald-400" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <BookOpen className="w-20 h-20 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2" dir="rtl">
            القرآن الكريم
          </h1>
          <p className="text-gray-600 dark:text-gray-400" dir="rtl">
            تطبيق متطور لقراءة القرآن مع التلاوة المتزامنة
          </p>
        </div>

        {/* شريط التقدم */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300" dir="rtl">
                جاري التحميل...
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="h-full w-full bg-white/30 animate-pulse" />
              </div>
            </div>
          </div>

          {/* خطوات التحميل */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  step.status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : step.status === 'loading'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                    : step.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  {step.status === 'loading' && (
                    <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  )}
                  {step.status === 'error' && (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                      !
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    step.status === 'completed'
                      ? 'text-green-700 dark:text-green-300 font-medium'
                      : step.status === 'loading'
                      ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                      : step.status === 'error'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                  dir="rtl"
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm mb-3" dir="rtl">
                {error}
              </p>
              <button
                onClick={retryLoading}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          )}
        </div>

        {/* معلومات إضافية */}
        {!error && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p dir="rtl">
              يتم تحميل جميع البيانات للعمل بدون اتصال بالإنترنت
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
