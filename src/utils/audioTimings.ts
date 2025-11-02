import initSqlJs, { Database } from 'sql.js';
import type { AyahTiming, WordTiming, Reciter } from '../types/quran';

let timingDb: Database | null = null;

// Cache for segments data
interface SegmentsData {
  [key: string]: {
    segments: number[][];
    duration_sec: number;
    duration_ms: number;
    timestamp_from: number;
    timestamp_to: number;
  };
}

let segmentsCache: { [readerFolder: string]: SegmentsData | null } = {};
let surahDataCache: { [readerFolder: string]: any | null } = {};

export async function initTimingDatabase(): Promise<Database> {
  if (timingDb) return timingDb;

  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  const response = await fetch('/reciter-audio-timing.sqlite');
  const buffer = await response.arrayBuffer();
  timingDb = new SQL.Database(new Uint8Array(buffer));

  return timingDb;
}

// دالة لتحميل بيانات segments.json من مجلد القارئ
async function loadSegmentsData(readerFolder: string): Promise<SegmentsData | null> {
  if (segmentsCache[readerFolder] !== undefined) {
    return segmentsCache[readerFolder];
  }

  try {
    const response = await fetch(`/Readers/${readerFolder}/segments.json`);
    if (!response.ok) {
      segmentsCache[readerFolder] = null;
      return null;
    }
    const data = await response.json();
    segmentsCache[readerFolder] = data;
    return data;
  } catch (error) {
    console.error(`خطأ في تحميل segments.json للقارئ ${readerFolder}:`, error);
    segmentsCache[readerFolder] = null;
    return null;
  }
}

// دالة لتحميل بيانات surah.json من مجلد القارئ
async function loadSurahData(readerFolder: string): Promise<any | null> {
  if (surahDataCache[readerFolder] !== undefined) {
    return surahDataCache[readerFolder];
  }

  try {
    const response = await fetch(`/Readers/${readerFolder}/surah.json`);
    if (!response.ok) {
      surahDataCache[readerFolder] = null;
      return null;
    }
    const data = await response.json();
    surahDataCache[readerFolder] = data;
    return data;
  } catch (error) {
    console.error(`خطأ في تحميل surah.json للقارئ ${readerFolder}:`, error);
    surahDataCache[readerFolder] = null;
    return null;
  }
}

export async function getAyahTimings(
  reciterId: number,
  surahNumber: number,
  ayahNumber: number,
  reciter?: Reciter
): Promise<AyahTiming | null> {
  // إذا كان القارئ يستخدم النظام الجديد (segments.json)
  if (reciter?.readerType === 'surah' && reciter.readerFolder) {
    const segmentsData = await loadSegmentsData(reciter.readerFolder);
    if (!segmentsData) return null;

    const key = `${surahNumber}:${ayahNumber}`;
    const ayahData = segmentsData[key];
    if (!ayahData || !ayahData.segments) return null;

    // تحويل segments إلى WordTiming[]
    // segments format: [[wordNumber, startTime, endTime], ...]
    // التوقيتات هنا من بداية السورة الكاملة بالمللي ثانية
    const timings: WordTiming[] = ayahData.segments
      .filter((seg: number[]) => seg.length >= 3 && seg[0] && seg[0] > 0) // تصفية القيم الفارغة
      .map((seg: number[]) => ({
        wordNumber: seg[0],
        startTime: seg[1], // بالمللي ثانية من بداية السورة
        endTime: seg[2], // بالمللي ثانية من بداية السورة
      }));

    return {
      reciter: reciterId,
      surahNumber,
      ayahNumber,
      timings,
      timestampFrom: ayahData.timestamp_from, // وقت بداية الآية من بداية السورة
    };
  }

  // النظام القديم (SQLite)
  const database = await initTimingDatabase();

  const query = `
    SELECT reciter, surah_number, ayah_number, timings
    FROM ayah_timing
    WHERE reciter = ? AND surah_number = ? AND ayah_number = ?
  `;

  const result = database.exec(query, [reciterId, surahNumber, ayahNumber]);

  if (result.length === 0 || result[0].values.length === 0) return null;

  const row = result[0].values[0];
  const timingsJson = row[3] as string;
  const timingsArray = JSON.parse(timingsJson);

  const timings: WordTiming[] = timingsArray.map((t: number[]) => ({
    wordNumber: t[0],
    startTime: t[1],
    endTime: t[2],
  }));

  return {
    reciter: row[0] as number,
    surahNumber: row[1] as number,
    ayahNumber: row[2] as number,
    timings,
  };
}

export async function getSurahTimings(
  reciterId: number,
  surahNumber: number,
  reciter?: Reciter
): Promise<AyahTiming[]> {
  // إذا كان القارئ يستخدم النظام الجديد (segments.json)
  if (reciter?.readerType === 'surah' && reciter.readerFolder) {
    const segmentsData = await loadSegmentsData(reciter.readerFolder);
    if (!segmentsData) return [];

    const ayahTimings: AyahTiming[] = [];
    
    // البحث عن جميع الآيات في السورة
    const surahPrefix = `${surahNumber}:`;
    const ayahNumbers = new Set<number>();

    // جمع أرقام الآيات
    for (const key in segmentsData) {
      if (key.startsWith(surahPrefix)) {
        const ayahNum = parseInt(key.split(':')[1]);
        if (!isNaN(ayahNum)) {
          ayahNumbers.add(ayahNum);
        }
      }
    }

    // ترتيب الآيات
    const sortedAyahNumbers = Array.from(ayahNumbers).sort((a, b) => a - b);

    // تحميل توقيتات كل آية
    for (const ayahNumber of sortedAyahNumbers) {
      const timing = await getAyahTimings(reciterId, surahNumber, ayahNumber, reciter);
      if (timing) {
        ayahTimings.push(timing);
      }
    }

    return ayahTimings;
  }

  // النظام القديم (SQLite)
  const database = await initTimingDatabase();

  const query = `
    SELECT reciter, surah_number, ayah_number, timings
    FROM ayah_timing
    WHERE reciter = ? AND surah_number = ?
    ORDER BY ayah_number
  `;

  const result = database.exec(query, [reciterId, surahNumber]);

  if (result.length === 0) return [];

  const ayahTimings: AyahTiming[] = [];
  const rows = result[0].values;

  for (const row of rows) {
    const timingsJson = row[3] as string;
    const timingsArray = JSON.parse(timingsJson);

    const timings: WordTiming[] = timingsArray.map((t: number[]) => ({
      wordNumber: t[0],
      startTime: t[1],
      endTime: t[2],
    }));

    ayahTimings.push({
      reciter: row[0] as number,
      surahNumber: row[1] as number,
      ayahNumber: row[2] as number,
      timings,
    });
  }

  return ayahTimings;
}

// دالة للحصول على رابط الصوت للسورة الكاملة من surah.json
export async function getSurahAudioUrl(
  reciter: Reciter,
  surahNumber: number
): Promise<string | null> {
  if (reciter.readerType !== 'surah' || !reciter.readerFolder) {
    return null;
  }

  const surahData = await loadSurahData(reciter.readerFolder);
  if (!surahData || !surahData[surahNumber.toString()]) {
    return null;
  }

  return surahData[surahNumber.toString()].audio_url || null;
}

export function getAudioUrl(reciter: Reciter, surahNumber: number, ayahNumber: number): string {
  // إذا كان القارئ يستخدم النظام الجديد (سورة كاملة)
  if (reciter.readerType === 'surah' && reciter.readerFolder) {
    // سنستخدم ملف السورة الكاملة، لكن سنقوم بمعالجة التوقيت في useAudioPlayer
    // للحصول على رابط الصوت للسورة، نحتاج لتحميل surah.json أولاً
    return `Readers/${reciter.readerFolder}/surah.json`; // سيتم استبداله برابط الصوت الفعلي
  }
  
  // النظام القديم (آيات فردية)
  const paddedSurah = surahNumber.toString().padStart(3, '0');
  const paddedAyah = ayahNumber.toString().padStart(3, '0');
  return `${reciter.audioUrl}/${paddedSurah}${paddedAyah}.mp3`;
}

export async function loadReciters(): Promise<Reciter[]> {
  const response = await fetch('/reciters-data.json');
  return response.json();
}
