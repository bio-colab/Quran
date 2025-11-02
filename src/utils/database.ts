import initSqlJs, { Database, SqlValue } from 'sql.js';
import type {
  Ayah,
  Word,
  MushafPage,
  MushafLine,
  MushafLineType,
  MushafWord,
  ReferenceIndex,
  ReferencePoint,
} from '../types/quran';
import { JUZ_BOUNDARIES, HIZB_BOUNDARIES } from '../data/referenceBoundaries';

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  const response = await fetch('/quran-data.sqlite');
  const buffer = await response.arrayBuffer();
  db = new SQL.Database(new Uint8Array(buffer));

  return db;
}

export async function getSurahAyahs(surahNumber: number): Promise<Ayah[]> {
  const database = await initDatabase();
  
  const query = `
    SELECT 
      surah_number, 
      ayah_number, 
      GROUP_CONCAT(uthmani, ' ') as text
    FROM words
    WHERE surah_number = ? AND is_ayah_marker = 0
    GROUP BY surah_number, ayah_number
    ORDER BY ayah_number
  `;
  
  const result = database.exec(query, [surahNumber]);
  
  if (result.length === 0) return [];
  
  const ayahs: Ayah[] = [];
  const rows = result[0].values;
  
  for (const row of rows) {
    ayahs.push({
      surahNumber: row[0] as number,
      ayahNumber: row[1] as number,
      text: row[2] as string,
    });
  }
  
  return ayahs;
}

export async function getAyah(surahNumber: number, ayahNumber: number): Promise<Ayah | null> {
  const database = await initDatabase();
  
  const query = `
    SELECT 
      surah_number, 
      ayah_number, 
      GROUP_CONCAT(uthmani, ' ') as text
    FROM words
    WHERE surah_number = ? AND ayah_number = ? AND is_ayah_marker = 0
    GROUP BY surah_number, ayah_number
  `;
  
  const result = database.exec(query, [surahNumber, ayahNumber]);
  
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const row = result[0].values[0];
  
  return {
    surahNumber: row[0] as number,
    ayahNumber: row[1] as number,
    text: row[2] as string,
  };
}

// دالة لإزالة الحركات من النص للبحث
function removeDiacritics(text: string): string {
  // إزالة الحركات العربية الأساسية
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

// دالة لإنشاء أنماط البحث مع دعم الحركات
function createSearchPatterns(searchTerm: string): string[] {
  const patterns = [];
  
  // النص الأصلي
  patterns.push(searchTerm);
  
  // النص بدون حركات
  const withoutDiacritics = removeDiacritics(searchTerm);
  if (withoutDiacritics !== searchTerm) {
    patterns.push(withoutDiacritics);
  }
  
  return patterns;
}

type SortOption = 'surah' | 'relevance';

export async function searchAyahs(searchTerm: string, limit: number = 10, offset: number = 0, sortBy: SortOption = 'surah'): Promise<{ ayahs: Ayah[], totalCount: number }> {
  const database = await initDatabase();
  
  // إنشاء أنماط البحث
  const patterns = createSearchPatterns(searchTerm);
  const patternConditions = patterns.map(() => `uthmani LIKE ?`).join(' OR ');
  const patternParams = patterns.map(pattern => `%${pattern}%`);
  
  // تحديد ترتيب النتائج
  const orderByClause = sortBy === 'surah' 
    ? 'ORDER BY surah_number, ayah_number' 
    : 'ORDER BY surah_number, ayah_number'; // يمكن تحسين هذا لاحقًا لترتيب حسب الصلة
  
  // First get the total count
  const countQuery = `
    SELECT COUNT(DISTINCT surah_number, ayah_number) as count
    FROM words
    WHERE (${patternConditions}) AND is_ayah_marker = 0
  `;
  
  const countResult = database.exec(countQuery, patternParams);
  const totalCount = countResult.length > 0 && countResult[0].values.length > 0 
    ? (countResult[0].values[0][0] as number) 
    : 0;
  
  // البحث في الكلمات الفردية أولاً لإيجاد الآيات المطابقة
  const searchQuery = `
    SELECT DISTINCT surah_number, ayah_number
    FROM words
    WHERE (${patternConditions}) AND is_ayah_marker = 0
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;
  
  const searchParams = [...patternParams, limit, offset];
  const searchResult = database.exec(searchQuery, searchParams);
  
  if (searchResult.length === 0 || searchResult[0].values.length === 0) return { ayahs: [], totalCount };
  
  const ayahs: Ayah[] = [];
  
  // جمع النص الكامل لكل آية
  for (const row of searchResult[0].values) {
    const surahNumber = row[0] as number;
    const ayahNumber = row[1] as number;
    
    const textQuery = `
      SELECT GROUP_CONCAT(uthmani, ' ') as text
      FROM words
      WHERE surah_number = ? AND ayah_number = ? AND is_ayah_marker = 0
    `;
    
    const textResult = database.exec(textQuery, [surahNumber, ayahNumber]);
    
    if (textResult.length > 0 && textResult[0].values.length > 0) {
      ayahs.push({
        surahNumber,
        ayahNumber,
        text: textResult[0].values[0][0] as string,
      });
    }
  }
  
  return { ayahs, totalCount };
}

// دالة جديدة للبحث في سورة محددة مع دعم الترقيم ودعم الحركات وترتيب النتائج
export async function searchAyahsInSurah(surahNumber: number, searchTerm: string, limit: number = 10, offset: number = 0, sortBy: SortOption = 'surah'): Promise<{ ayahs: Ayah[], totalCount: number }> {
  const database = await initDatabase();
  
  // إنشاء أنماط البحث
  const patterns = createSearchPatterns(searchTerm);
  const patternConditions = patterns.map(() => `uthmani LIKE ?`).join(' OR ');
  const patternParams = patterns.map(pattern => `%${pattern}%`);
  
  // تحديد ترتيب النتائج
  const orderByClause = sortBy === 'surah' 
    ? 'ORDER BY ayah_number' 
    : 'ORDER BY ayah_number'; // يمكن تحسين هذا لاحقًا لترتيب حسب الصلة
  
  // First get the total count
  const countQuery = `
    SELECT COUNT(DISTINCT surah_number, ayah_number) as count
    FROM words
    WHERE surah_number = ? AND (${patternConditions}) AND is_ayah_marker = 0
  `;
  
  const countResult = database.exec(countQuery, [surahNumber, ...patternParams]);
  const totalCount = countResult.length > 0 && countResult[0].values.length > 0 
    ? (countResult[0].values[0][0] as number) 
    : 0;
  
  // البحث في كلمات سورة محددة
  const searchQuery = `
    SELECT DISTINCT surah_number, ayah_number
    FROM words
    WHERE surah_number = ? AND (${patternConditions}) AND is_ayah_marker = 0
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;
  
  const searchParams = [surahNumber, ...patternParams, limit, offset];
  const searchResult = database.exec(searchQuery, searchParams);
  
  if (searchResult.length === 0 || searchResult[0].values.length === 0) return { ayahs: [], totalCount };
  
  const ayahs: Ayah[] = [];
  
  // جمع النص الكامل لكل آية
  for (const row of searchResult[0].values) {
    const surahNum = row[0] as number;
    const ayahNumber = row[1] as number;
    
    const textQuery = `
      SELECT GROUP_CONCAT(uthmani, ' ') as text
      FROM words
      WHERE surah_number = ? AND ayah_number = ? AND is_ayah_marker = 0
    `;
    
    const textResult = database.exec(textQuery, [surahNum, ayahNumber]);
    
    if (textResult.length > 0 && textResult[0].values.length > 0) {
      ayahs.push({
        surahNumber: surahNum,
        ayahNumber,
        text: textResult[0].values[0][0] as string,
      });
    }
  }
  
  return { ayahs, totalCount };
}

export async function getAllWords(): Promise<Word[]> {
  const database = await initDatabase();

  const query = 'SELECT * FROM words LIMIT 1000';
  const result = database.exec(query);
  
  if (result.length === 0) return [];
  
  const words: Word[] = [];
  const rows = result[0].values;
  const columns = result[0].columns;
  
  for (const row of rows) {
    const word: any = {};
    columns.forEach((col, idx) => {
      word[col] = row[idx];
    });
    words.push(word as Word);
  }

  return words;
}

function mapLayoutRow(
  row: SqlValue[],
  words: MushafWord[],
): MushafLine {
  const [page, line, type, isCentered, rangeStart, rangeEnd] = row;
  const mushafType = type as MushafLineType;

  return {
    page: page as number,
    line: line as number,
    type: mushafType,
    isCentered: Boolean(isCentered),
    rangeStart: rangeStart === null ? null : (rangeStart as number),
    rangeEnd: rangeEnd === null ? null : (rangeEnd as number),
    words,
    surahReference:
      mushafType === 'surah_name' && typeof rangeStart === 'number'
        ? (rangeStart as number)
        : undefined,
  };
}

function fetchWordsInRange(database: Database, start: number, end: number): MushafWord[] {
  const wordQuery = `
    SELECT
      surah_number,
      ayah_number,
      word_number,
      word_number_all,
      qpc_v1,
      uthmani,
      is_ayah_marker
    FROM words
    WHERE word_number_all BETWEEN ? AND ?
    ORDER BY word_number_all
  `;

  const wordResult = database.exec(wordQuery, [start, end]);

  if (wordResult.length === 0) return [];

  return wordResult[0].values.map((wordRow) => ({
    surahNumber: wordRow[0] as number,
    ayahNumber: wordRow[1] as number,
    wordNumber: wordRow[2] as number,
    wordNumberAll: wordRow[3] as number,
    text: (wordRow[4] as string) || (wordRow[5] as string),
    uthmani: wordRow[5] as string,
    isAyahMarker: Boolean(wordRow[6]),
  }));
}

function getAyahForWordIndex(
  database: Database,
  wordIndex: number,
): { surahNumber: number; ayahNumber: number; wordIndex: number } | null {
  const result = database.exec(
    `
      SELECT surah_number, ayah_number, word_number_all
      FROM words
      WHERE word_number_all <= ? AND word_number = 1
      ORDER BY word_number_all DESC
      LIMIT 1
    `,
    [wordIndex],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  return {
    surahNumber: row[0] as number,
    ayahNumber: row[1] as number,
    wordIndex: row[2] as number,
  };
}

function getAyahStartFromIndex(
  database: Database,
  wordIndex: number,
): { surahNumber: number; ayahNumber: number; wordIndex: number } | null {
  const result = database.exec(
    `
      SELECT surah_number, ayah_number, word_number_all
      FROM words
      WHERE word_number_all >= ? AND word_number = 1
      ORDER BY word_number_all
      LIMIT 1
    `,
    [wordIndex],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  return {
    surahNumber: row[0] as number,
    ayahNumber: row[1] as number,
    wordIndex: row[2] as number,
  };
}

function getWordIndexForAyahInternal(
  database: Database,
  surahNumber: number,
  ayahNumber: number,
): number | null {
  const result = database.exec(
    `
      SELECT word_number_all
      FROM words
      WHERE surah_number = ? AND ayah_number = ? AND word_number = 1
      LIMIT 1
    `,
    [surahNumber, ayahNumber],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  return result[0].values[0][0] as number;
}

function getPageForWordIndex(database: Database, wordIndex: number): number | null {
  const result = database.exec(
    `
      SELECT page
      FROM qpc_v1_layout
      WHERE type = 'ayah'
        AND range_start IS NOT NULL
        AND range_end IS NOT NULL
        AND range_start <= ?
        AND range_end >= ?
      LIMIT 1
    `,
    [wordIndex, wordIndex],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  return result[0].values[0][0] as number;
}

function getMaxWordIndex(database: Database): number {
  const result = database.exec('SELECT MAX(word_number_all) FROM words');
  if (result.length === 0 || result[0].values.length === 0 || result[0].values[0][0] === null) {
    return 0;
  }
  return result[0].values[0][0] as number;
}

function uniqueByWordIndex(points: ReferencePoint[]): ReferencePoint[] {
  const seen = new Set<number>();
  const unique: ReferencePoint[] = [];

  for (const point of points) {
    if (seen.has(point.wordIndex)) continue;
    seen.add(point.wordIndex);
    unique.push(point);
  }

  return unique;
}

export async function getPageLayout(pageNumber: number): Promise<MushafPage | null> {
  const database = await initDatabase();

  const layoutResult = database.exec(
    `
      SELECT page, line, type, is_centered, range_start, range_end
      FROM qpc_v1_layout
      WHERE page = ?
      ORDER BY line
    `,
    [pageNumber],
  );

  if (layoutResult.length === 0 || layoutResult[0].values.length === 0) {
    return null;
  }

  const lines: MushafLine[] = layoutResult[0].values.map((row) => {
    const type = row[2] as MushafLineType;
    let words: MushafWord[] = [];
    const rangeStart = row[4] as number | null;
    const rangeEnd = row[5] as number | null;

    if (type === 'ayah' && typeof rangeStart === 'number' && typeof rangeEnd === 'number') {
      words = fetchWordsInRange(database, rangeStart, rangeEnd);
    }

    return mapLayoutRow(row, words);
  });

  return {
    pageNumber,
    lines,
  };
}

export async function getMushafPagesForSurah(surahNumber: number): Promise<MushafPage[]> {
  const database = await initDatabase();

  const boundsResult = database.exec(
    `
      SELECT MIN(word_number_all) as min_word, MAX(word_number_all) as max_word
      FROM words
      WHERE surah_number = ?
    `,
    [surahNumber],
  );

  if (boundsResult.length === 0 || boundsResult[0].values.length === 0) {
    return [];
  }

  const [minWord, maxWord] = boundsResult[0].values[0];

  if (minWord === null || maxWord === null) {
    return [];
  }

  const pagesResult = database.exec(
    `
      SELECT DISTINCT page
      FROM qpc_v1_layout
      WHERE type = 'ayah'
        AND range_start IS NOT NULL
        AND range_end IS NOT NULL
        AND NOT (range_end < ? ? OR range_start > ?)
      ORDER BY page
    `,
    [minWord, maxWord],
  );

  if (pagesResult.length === 0 || pagesResult[0].values.length === 0) {
    return [];
  }

  const pages: MushafPage[] = [];

  for (const [pageValue] of pagesResult[0].values) {
    const pageNumber = pageValue as number;
    const layout = await getPageLayout(pageNumber);
    if (layout) {
      pages.push(layout);
    }
  }

  return pages;
}

function buildPageReferences(database: Database): ReferencePoint[] {
  const pageRows = database.exec(
    `
      SELECT page, MIN(range_start) as start_index
      FROM qpc_v1_layout
      WHERE type = 'ayah' AND range_start IS NOT NULL
      GROUP BY page
      ORDER BY page
    `,
  );

  if (pageRows.length === 0) {
    return [];
  }

  return pageRows[0].values.reduce<ReferencePoint[]>((acc, row) => {
    const page = Number(row[0]);
    const startIndex = Number(row[1]);
    if (Number.isNaN(page) || Number.isNaN(startIndex)) {
      return acc;
    }

    const ayah =
      getAyahForWordIndex(database, startIndex) ||
      getAyahStartFromIndex(database, startIndex);

    if (!ayah) {
      return acc;
    }

    acc.push({
      type: 'page',
      index: page,
      page,
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumber,
      wordIndex: ayah.wordIndex,
    });

    return acc;
  }, []);
}

function buildBoundaryReferences(
  database: Database,
  boundaries: { index: number; surah: number; ayah: number }[],
  type: 'juz' | 'hizb',
): ReferencePoint[] {
  const references: ReferencePoint[] = [];

  for (const boundary of boundaries) {
    const wordIndex = getWordIndexForAyahInternal(database, boundary.surah, boundary.ayah);
    if (wordIndex === null) continue;

    const page = getPageForWordIndex(database, wordIndex) ?? 0;

    references.push({
      type,
      index: boundary.index,
      page,
      surahNumber: boundary.surah,
      ayahNumber: boundary.ayah,
      wordIndex,
    });
  }

  return references.sort((a, b) => a.wordIndex - b.wordIndex);
}

function buildRubReferences(database: Database, hizbReferences: ReferencePoint[]): ReferencePoint[] {
  if (hizbReferences.length === 0) {
    return [];
  }

  const maxWord = getMaxWordIndex(database);
  const rubEntries: ReferencePoint[] = [];

  for (let i = 0; i < hizbReferences.length; i += 1) {
    const current = hizbReferences[i];
    const next = hizbReferences[i + 1];
    const endWord = next ? next.wordIndex : maxWord + 1;
    const length = Math.max(endWord - current.wordIndex, 1);
    const fractions = [0, 0.25, 0.5, 0.75];

    fractions.forEach((fraction, fractionIndex) => {
      const rawTarget = current.wordIndex + Math.floor(length * fraction);
      const safeTarget = Math.min(Math.max(rawTarget, current.wordIndex), endWord - 1);
      const ayah = getAyahStartFromIndex(database, safeTarget);

      if (!ayah) return;

      const page = getPageForWordIndex(database, ayah.wordIndex) ?? current.page;

      rubEntries.push({
        type: 'rub',
        index: i * 4 + fractionIndex + 1,
        page,
        surahNumber: ayah.surahNumber,
        ayahNumber: ayah.ayahNumber,
        wordIndex: ayah.wordIndex,
      });
    });
  }

  const unique = uniqueByWordIndex(rubEntries);
  unique.sort((a, b) => a.wordIndex - b.wordIndex);
  unique.forEach((entry, idx) => {
    entry.index = idx + 1;
  });

  return unique;
}

export async function getMushafReferenceIndex(): Promise<ReferenceIndex> {
  const database = await initDatabase();

  const pages = buildPageReferences(database);
  const juz = buildBoundaryReferences(database, JUZ_BOUNDARIES, 'juz');
  const hizb = buildBoundaryReferences(database, HIZB_BOUNDARIES, 'hizb');
  const rub = buildRubReferences(database, hizb);

  return {
    pages,
    juz,
    hizb,
    rub,
  };
}
