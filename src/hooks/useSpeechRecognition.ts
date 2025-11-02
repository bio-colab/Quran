import { useState, useRef, useCallback } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface UseSpeechRecognitionProps {
  onResult: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  minConfidence?: number;
}

export function useSpeechRecognition({ 
  onResult, 
  onError,
  minConfidence = 0.5
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    // التحقق من دعم المتصفح
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const errorMsg = 'عذراً، متصفحك لا يدعم ميزة التعرف على الكلام. يرجى استخدام متصفح Chrome أو Edge للحصول على أفضل تجربة.';
      if (onError) onError(errorMsg);
      return;
    }

    // التحقق من دعم الميكروفون
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'لا يمكن الوصول إلى الميكروفون. يرجى التحقق من إعدادات المتصفح.';
      if (onError) onError(errorMsg);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    // إعدادات محسّنة للغة العربية
    recognitionRef.current.lang = 'ar-SA'; // اللغة العربية السعودية
    recognitionRef.current.continuous = false; // إيقاف بعد التعرف
    recognitionRef.current.interimResults = false; // نتائج نهائية فقط
    recognitionRef.current.maxAlternatives = 3; // الحصول على بدائل متعددة

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognitionRef.current.onresult = (event: any) => {
      const results = event.results[0];
      const bestResult = results[0];
      const transcript = bestResult.transcript;
      const confidence = bestResult.confidence;

      console.log('نتيجة التعرف:', { transcript, confidence });

      setTranscript(transcript);

      // التحقق من مستوى الثقة
      if (confidence < minConfidence) {
        if (onError) {
          onError(`مستوى الثقة منخفض (${Math.round(confidence * 100)}%). يرجى القراءة بصوت أوضح وأبطأ قليلاً.`);
        }
      }

      // إرسال النتيجة حتى لو كانت الثقة منخفضة
      onResult({ transcript, confidence });
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('خطأ في التعرف على الكلام:', event.error);
      setIsListening(false);
      
      if (onError) {
        let errorMsg = 'حدث خطأ في التعرف على الكلام';
        
        switch (event.error) {
          case 'no-speech':
            errorMsg = 'لم يتم اكتشاف أي كلام. يرجى التحدث بصوت واضح والتأكد من عمل الميكروفون.';
            break;
          case 'audio-capture':
            errorMsg = 'لا يمكن الوصول إلى الميكروفون. يرجى التحقق من توصيل الميكروفون وإعداداته.';
            break;
          case 'not-allowed':
            errorMsg = 'يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح حتى تتمكن من استخدام ميزة التحقق من القراءة.';
            break;
          case 'network':
            errorMsg = 'خطأ في الاتصال بالإنترنت. ميزة التعرف على الكلام تتطلب اتصال بالإنترنت.';
            break;
          case 'aborted':
            errorMsg = 'تم إيقاف التسجيل. يرجى المحاولة مرة أخرى.';
            break;
          case 'language-not-supported':
            errorMsg = 'اللغة العربية غير مدعومة في متصفحك. يرجى استخدام متصفح Chrome أو Edge.';
            break;
          default:
            errorMsg = `خطأ غير متوقع: ${event.error}. يرجى المحاولة مرة أخرى.`;
        }
        
        onError(errorMsg);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('خطأ في بدء التسجيل:', error);
      setIsListening(false);
      if (onError) {
        onError('حدث خطأ في بدء التسجيل. يرجى المحاولة مرة أخرى.');
      }
    }
  }, [onResult, onError, minConfidence]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('خطأ في إيقاف التسجيل:', error);
      }
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}
