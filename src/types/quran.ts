export interface Surah {
  number: number;
  name: string;
  arabicName: string;
  englishName: string;
  revelationType: string;
  numberOfAyahs: number;
}

export interface Ayah {
  surahNumber: number;
  ayahNumber: number;
  text: string;
}

export interface Reciter {
  id: number;
  name: string;
  arabicName: string;
  style: string;
  country: string;
  audioUrl: string;
  readerFolder?: string;
  readerType: 'ayah' | 'surah';
}

export interface Word {
  surah_number: number;
  ayah_number: number;
  word_number: number;
  word_number_all: number;
  qpc_v1: string;
  uthmani: string;
  is_ayah_marker: number;
}

export interface MushafWord {
  surahNumber: number;
  ayahNumber: number;
  wordNumber: number;
  wordNumberAll: number;
  text: string;
  uthmani: string;
  isAyahMarker: boolean;
}

export type MushafLineType = 'ayah' | 'surah_name' | 'basmalah' | 'sajdah' | 'juz' | 'hizb';

export interface MushafLine {
  page: number;
  line: number;
  type: MushafLineType;
  isCentered: boolean;
  rangeStart: number | null;
  rangeEnd: number | null;
  words: MushafWord[];
  surahReference?: number;
}

export interface MushafPage {
  pageNumber: number;
  lines: MushafLine[];
}

export type ViewMode = 'surahs' | 'surah' | 'search' | 'bookmarks' | 'dashboard' | 'settings' | 'review';

export type ReciterType = 'ayah' | 'surah'; // 'ayah' = آيات فردية, 'surah' = سورة كاملة

export interface WordTiming {
  wordNumber: number;
  startTime: number;
  endTime: number;
}

export interface AyahTiming {
  reciter: number;
  surahNumber: number;
  ayahNumber: number;
  timings: WordTiming[];
  timestampFrom?: number; // وقت بداية الآية من بداية السورة بالمللي ثانية (للنظام الجديد)
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentAyah: { surahNumber: number; ayahNumber: number } | null;
  currentWord: number | null;
  playbackSpeed: number;
  volume: number;
  repeat: 'none' | 'ayah' | 'continuous';
}

export interface RecitationTestResult {
  success: boolean;
  accuracy: number;
  errors: Array<{
    wordNumber: number;
    expected: string;
    received: string;
    type: 'missing' | 'wrong' | 'extra';
  }>;
  suggestions: string[];
}

export type ReferenceType = 'page' | 'juz' | 'hizb' | 'rub';

export interface ReferencePoint {
  type: ReferenceType;
  index: number;
  page: number;
  surahNumber: number;
  ayahNumber: number;
  wordIndex: number;
}

export interface ReferenceIndex {
  pages: ReferencePoint[];
  juz: ReferencePoint[];
  hizb: ReferencePoint[];
  rub: ReferencePoint[];
}
