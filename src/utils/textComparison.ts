import type { RecitationTestResult } from '../types/quran';

// تطبيع النص العربي للمقارنة
function normalizeArabic(text: string): string {
  // إزالة التشكيل
  text = text.replace(/[\u064B-\u0652]/g, '');
  
  // توحيد الهمزات
  text = text.replace(/[إأآ]/g, 'ا');
  text = text.replace(/[ؤ]/g, 'و');
  text = text.replace(/[ئ]/g, 'ي');
  text = text.replace(/[ة]/g, 'ه');
  
  // إزالة المسافات الزائدة
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// حساب مسافة Levenshtein للمقارنة بين النصوص
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// مقارنة النص المقروء مع النص الأصلي
export function compareRecitation(
  originalText: string,
  recitedText: string
): RecitationTestResult {
  const normalizedOriginal = normalizeArabic(originalText);
  const normalizedRecited = normalizeArabic(recitedText);

  const originalWords = normalizedOriginal.split(/\s+/);
  const recitedWords = normalizedRecited.split(/\s+/);

  const errors: RecitationTestResult['errors'] = [];
  const suggestions: string[] = [];

  // مقارنة الكلمات
  const maxLength = Math.max(originalWords.length, recitedWords.length);
  let correctWords = 0;

  for (let i = 0; i < maxLength; i++) {
    const originalWord = originalWords[i] || '';
    const recitedWord = recitedWords[i] || '';

    if (!recitedWord && originalWord) {
      errors.push({
        wordNumber: i + 1,
        expected: originalWord,
        received: '',
        type: 'missing',
      });
      suggestions.push(`الكلمة "${originalWord}" مفقودة`);
    } else if (recitedWord && !originalWord) {
      errors.push({
        wordNumber: i + 1,
        expected: '',
        received: recitedWord,
        type: 'extra',
      });
      suggestions.push(`الكلمة "${recitedWord}" زائدة`);
    } else if (originalWord !== recitedWord) {
      const distance = levenshteinDistance(originalWord, recitedWord);
      const similarity = 1 - distance / Math.max(originalWord.length, recitedWord.length);

      if (similarity < 0.7) {
        errors.push({
          wordNumber: i + 1,
          expected: originalWord,
          received: recitedWord,
          type: 'wrong',
        });
        suggestions.push(`الكلمة الصحيحة: "${originalWord}" وليس "${recitedWord}"`);
      } else {
        correctWords++;
      }
    } else {
      correctWords++;
    }
  }

  const accuracy = (correctWords / originalWords.length) * 100;

  // إضافة اقتراحات عامة
  if (accuracy < 50) {
    suggestions.push('يُنصح بالتركيز على حفظ الآية بشكل أفضل');
  } else if (accuracy < 80) {
    suggestions.push('أداء جيد، مع التركيز على الكلمات الصعبة');
  } else if (accuracy < 95) {
    suggestions.push('أداء ممتاز، انتبه للتفاصيل الصغيرة');
  } else {
    suggestions.push('ما شاء الله، إتقان ممتاز!');
  }

  return {
    success: errors.length === 0,
    accuracy: Math.round(accuracy),
    errors,
    suggestions,
  };
}

// حساب التشابه بين كلمتين
export function calculateSimilarity(word1: string, word2: string): number {
  const normalized1 = normalizeArabic(word1);
  const normalized2 = normalizeArabic(word2);
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  return maxLength === 0 ? 100 : Math.round((1 - distance / maxLength) * 100);
}
