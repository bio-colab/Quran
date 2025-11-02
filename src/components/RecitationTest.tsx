import { useState } from 'react';
import { Mic, MicOff, Eye, EyeOff, RotateCcw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { compareRecitation } from '../utils/textComparison';
import type { RecitationTestResult } from '../types/quran';

interface RecitationTestProps {
  originalText: string;
  ayahNumber: number;
  surahName: string;
  hideTextMode: boolean;
  onToggleHideText: () => void;
}

export default function RecitationTest({
  originalText,
  ayahNumber,
  surahName,
  hideTextMode,
  onToggleHideText,
}: RecitationTestProps) {
  const [testResult, setTestResult] = useState<RecitationTestResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleRecitationResult = (result: { transcript: string; confidence: number }) => {
    console.log('نتيجة التعرف على الكلام:', result);
    
    const comparisonResult = compareRecitation(originalText, result.transcript);
    setTestResult(comparisonResult);
    setConfidence(result.confidence);
    setShowResult(true);
    setError(null);

    // عرض تحذير إذا كانت الثقة منخفضة
    if (result.confidence < 0.7) {
      setWarning(
        `مستوى الثقة في التعرف: ${Math.round(result.confidence * 100)}%. ` +
        'النتيجة قد لا تكون دقيقة تماماً. يُنصح بإعادة المحاولة بصوت أوضح.'
      );
    } else {
      setWarning(null);
    }
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    setWarning(null);
  };

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: handleRecitationResult,
    onError: handleError,
    minConfidence: 0.3, // قبول نتائج أقل ثقة لكن مع تحذير
  });

  const resetTest = () => {
    setTestResult(null);
    setShowResult(false);
    setError(null);
    setWarning(null);
    setConfidence(null);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
          التحقق من القراءة بالذكاء الاصطناعي
        </h3>
        <button
          onClick={onToggleHideText}
          className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          title={hideTextMode ? 'إظهار النص' : 'إخفاء النص'}
        >
          {hideTextMode ? (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-sm">إظهار</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="text-sm">إخفاء</span>
            </>
          )}
        </button>
      </div>

      {/* معلومات حول الميزة */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">نصائح للحصول على أفضل نتيجة:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>تأكد من وجود اتصال بالإنترنت (مطلوب للتعرف على الكلام)</li>
              <li>اقرأ بصوت واضح ومسموع بالقرب من الميكروفون</li>
              <li>تجنب الضوضاء في الخلفية</li>
              <li>اقرأ بسرعة معتدلة مع مراعاة التجويد</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center mb-4 text-gray-700 dark:text-gray-300">
        <p className="text-sm">
          {surahName} - الآية {ayahNumber}
        </p>
      </div>

      {!hideTextMode && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 text-center">
          <p className="text-xl leading-loose font-arabic text-gray-900 dark:text-gray-100" dir="rtl">
            {originalText}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {!showResult ? (
          <>
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!navigator.mediaDevices}
              className={`flex items-center gap-3 px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6" />
                  <span>إيقاف التسجيل</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  <span>ابدأ القراءة</span>
                </>
              )}
            </button>

            {!navigator.mediaDevices && (
              <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-700 dark:text-yellow-300 text-center text-sm">
                  الميكروفون غير متاح. يرجى التحقق من إعدادات المتصفح.
                </p>
              </div>
            )}

            {isListening && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="font-medium text-lg">جاري التسجيل...</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  اقرأ الآية بصوت واضح ومسموع
                </p>
                <div className="mt-3 flex justify-center">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 bg-red-500 rounded-full animate-pulse"
                        style={{
                          height: `${20 + Math.random() * 30}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 dark:text-red-300 font-medium mb-2">{error}</p>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      <p className="font-medium mb-1">الحلول المقترحة:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {error.includes('الميكروفون') && (
                          <>
                            <li>تحقق من توصيل الميكروفون</li>
                            <li>امنح المتصفح إذن الوصول للميكروفون</li>
                          </>
                        )}
                        {error.includes('اتصال') && (
                          <>
                            <li>تحقق من اتصالك بالإنترنت</li>
                            <li>حاول إعادة تحميل الصفحة</li>
                          </>
                        )}
                        {error.includes('متصفح') && (
                          <>
                            <li>استخدم متصفح Chrome أو Edge للحصول على أفضل أداء</li>
                            <li>تأكد من تحديث متصفحك لآخر إصدار</li>
                          </>
                        )}
                        <li>جرب المحاولة مرة أخرى</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          testResult && (
            <ResultsDisplay 
              result={testResult} 
              confidence={confidence} 
              warning={warning}
              onReset={resetTest} 
            />
          )
        )}
      </div>
    </div>
  );
}

interface ResultsDisplayProps {
  result: RecitationTestResult;
  confidence: number | null;
  warning: string | null;
  onReset: () => void;
}

function ResultsDisplay({ result, confidence, warning, onReset }: ResultsDisplayProps) {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 80) return 'text-blue-600 dark:text-blue-400';
    if (accuracy >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 95) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
    if (accuracy >= 80) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
    if (accuracy >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
  };

  const getAccuracyMessage = (accuracy: number) => {
    if (accuracy >= 95) return 'ممتاز! قراءة دقيقة ومتقنة';
    if (accuracy >= 80) return 'جيد جداً! قراءة جيدة مع أخطاء بسيطة';
    if (accuracy >= 60) return 'جيد، لكن يمكنك التحسين';
    return 'يحتاج إلى المزيد من التدريب';
  };

  return (
    <div className="w-full space-y-4">
      {/* عرض تحذير مستوى الثقة إذا كان منخفضاً */}
      {warning && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</p>
          </div>
        </div>
      )}

      {/* نتيجة الدقة */}
      <div className={`${getAccuracyBg(result.accuracy)} border-2 rounded-lg p-6 text-center`}>
        <div className={`text-5xl font-bold mb-2 ${getAccuracyColor(result.accuracy)}`}>
          {result.accuracy}%
        </div>
        <div className="text-gray-700 dark:text-gray-300 font-medium text-lg mb-2">
          {getAccuracyMessage(result.accuracy)}
        </div>
        {confidence !== null && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            مستوى ثقة التعرف على الكلام: {Math.round(confidence * 100)}%
          </div>
        )}
      </div>

      {/* عرض الأخطاء */}
      {result.errors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            الأخطاء المكتشفة ({result.errors.length})
          </h4>
          <div className="space-y-2">
            {result.errors.map((error, index) => (
              <div
                key={index}
                className="bg-red-50 dark:bg-red-900/20 rounded p-3 text-sm border border-red-100 dark:border-red-800"
                dir="rtl"
              >
                <div className="font-medium text-red-600 dark:text-red-400 mb-1">
                  الكلمة {error.wordNumber}:
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  {error.type === 'missing' && (
                    <>
                      <span className="font-bold">الكلمة المفقودة:</span> "{error.expected}"
                    </>
                  )}
                  {error.type === 'extra' && (
                    <>
                      <span className="font-bold">كلمة زائدة:</span> "{error.received}"
                    </>
                  )}
                  {error.type === 'wrong' && (
                    <>
                      <span className="font-bold">الصحيح:</span> "{error.expected}" •{' '}
                      <span className="font-bold">قرأت:</span> "{error.received}"
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* الإرشادات */}
      {result.suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            إرشادات للتحسين
          </h4>
          <ul className="space-y-2" dir="rtl">
            {result.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm"
              >
                <span className="text-emerald-500 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium shadow-lg hover:shadow-xl"
      >
        <RotateCcw className="w-5 h-5" />
        <span>محاولة جديدة</span>
      </button>
    </div>
  );
}
