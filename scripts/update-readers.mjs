import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readersDir = path.join(__dirname, '..', 'public', 'Readers');
const outputFile = path.join(__dirname, '..', 'public', 'reciters-data.json');

// خريطة أسماء القراء العربية من أسماء المجلدات
const nameMapping = {
  'abdur-rahman-as-sudais': { name: 'عبد الرحمن السديس', arabicName: 'عبد الرحمن السديس', country: 'السعودية' },
  'abu-bakr-al-shatri-murattal-hafs-952': { name: 'أبو بكر الشاطري', arabicName: 'أبو بكر الشاطري', country: 'السعودية' },
  'hani-ar-rifai-recitation-murattal-hafs-68': { name: 'هاني الرفاعي', arabicName: 'هاني الرفاعي', country: 'السعودية' },
  'mishari-rashid-al-afasy': { name: 'مشاري راشد العفاسي', arabicName: 'مشاري راشد العفاسي', country: 'الكويت' },
  'muhammad-siddiq-al-minshawi-with-kids': { name: 'محمد صديق المنشاوي', arabicName: 'محمد صديق المنشاوي (مع الأطفال)', country: 'مصر' },
  'sa-ud-ash-shuraym': { name: 'سعود الشريم', arabicName: 'سعود الشريم', country: 'السعودية' },
  'hady-toure': { name: 'هادي توريه', arabicName: 'هادي توريه', country: 'مالي' },
};

function extractNameFromFolder(folderName) {
  // محاولة استخراج الاسم من اسم المجلد
  const parts = folderName.split('-');
  
  // البحث في خريطة الأسماء
  for (const key in nameMapping) {
    if (folderName.includes(key)) {
      return nameMapping[key];
    }
  }
  
  // محاولة استخراج الاسم يدوياً
  const cleanName = folderName
    .replace(/^(surah|ayah)-recitation-/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    name: cleanName,
    arabicName: cleanName,
    country: 'غير محدد'
  };
}

async function scanReadersDirectory() {
  const reciters = [];
  let nextId = 100; // بدء من 100 لتجنب التضارب مع الأرقام الموجودة

  if (!fs.existsSync(readersDir)) {
    console.error(`المجلد ${readersDir} غير موجود`);
    return reciters;
  }

  const folders = fs.readdirSync(readersDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folder of folders) {
    const folderPath = path.join(readersDir, folder);
    const files = fs.readdirSync(folderPath);

    // تحديد نوع القارئ بناءً على الملفات الموجودة
    const hasSurahJson = files.includes('surah.json');
    const hasSegmentsJson = files.includes('segments.json');
    const hasAyahJson = files.some(f => f.endsWith('.json') && !f.includes('surah') && !f.includes('segments'));

    let readerType = 'ayah';
    let readerFolder = null;

    if (hasSurahJson && hasSegmentsJson) {
      // نظام السورة الكاملة
      readerType = 'surah';
      readerFolder = folder;
    } else if (hasAyahJson) {
      // نظام الآيات الفردية (JSON واحد)
      readerType = 'ayah';
      // يمكننا قراءة معلومات القارئ من الملف JSON
      const jsonFile = files.find(f => f.endsWith('.json'));
      if (jsonFile) {
        try {
          const jsonPath = path.join(folderPath, jsonFile);
          const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
          const data = JSON.parse(jsonContent);
          
          // محاولة استخراج معلومات القارئ من الملف
          // هذا يعتمد على بنية الملف الفعلية
          const nameInfo = extractNameFromFolder(folder);
          
          reciters.push({
            id: nextId++,
            name: nameInfo.name,
            arabicName: nameInfo.arabicName || nameInfo.name,
            style: 'مرتل',
            country: nameInfo.country,
            audioUrl: '', // سيتم ملؤه من الملف JSON
            readerType: readerType,
            ...(readerFolder && { readerFolder })
          });
        } catch (error) {
          console.error(`خطأ في قراءة ${jsonFile}:`, error.message);
        }
      }
      continue; // تخطي لأننا أضفناه
    }

    // للمجلدات التي تحتوي على surah.json و segments.json
    if (readerType === 'surah') {
      const nameInfo = extractNameFromFolder(folder);
      
      reciters.push({
        id: nextId++,
        name: nameInfo.name,
        arabicName: nameInfo.arabicName || nameInfo.name,
        style: 'مرتل',
        country: nameInfo.country,
        audioUrl: '', // غير مطلوب للنظام الجديد
        readerFolder: folder,
        readerType: 'surah'
      });
    }
  }

  return reciters.sort((a, b) => a.arabicName.localeCompare(b.arabicName, 'ar'));
}

async function main() {
  console.log('جارٍ فحص مجلد Readers...');
  const scannedReciters = await scanReadersDirectory();
  
  console.log(`تم العثور على ${scannedReciters.length} قارئ في مجلد Readers:`);
  scannedReciters.forEach(r => {
    console.log(`  - ${r.arabicName} (${r.readerType === 'surah' ? 'سورة كاملة' : 'آيات فردية'})`);
  });

  // قراءة القراء الموجودين من الملف
  let existingReciters = [];
  if (fs.existsSync(outputFile)) {
    try {
      existingReciters = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      console.log(`\nتم العثور على ${existingReciters.length} قارئ في reciters-data.json`);
    } catch (error) {
      console.warn('خطأ في قراءة reciters-data.json الحالي:', error.message);
    }
  }

  // فصل القراء إلى مجموعتين: من Readers ومن خارجها
  const readersFromFolders = existingReciters.filter(r => r.readerFolder);
  const readersNotFromFolders = existingReciters.filter(r => !r.readerFolder);
  
  console.log(`  - القراء من خارج Readers: ${readersNotFromFolders.length}`);
  console.log(`  - القراء من مجلد Readers (موجودون مسبقاً): ${readersFromFolders.length}`);

  // إنشاء خريطة للقراء الممسوحين من المجلدات (readerFolder -> reciter)
  const scannedMap = new Map();
  scannedReciters.forEach(r => {
    if (r.readerFolder) {
      scannedMap.set(r.readerFolder, r);
    }
  });

  // تحديث القراء الموجودين من المجلدات
  const updatedFromFolders = readersFromFolders.map(existing => {
    if (existing.readerFolder && scannedMap.has(existing.readerFolder)) {
      // تحديث مع الحفاظ على id الموجود
      return { ...scannedMap.get(existing.readerFolder), id: existing.id };
    }
    return existing;
  });

  // إضافة القراء الجدد من المجلدات (الذين لم يكونوا موجودين مسبقاً)
  const existingFolders = new Set(readersFromFolders.map(r => r.readerFolder));
  const newFromFolders = scannedReciters.filter(r => 
    r.readerFolder && !existingFolders.has(r.readerFolder)
  );

  // دمج كل القراء
  const allReciters = [
    ...readersNotFromFolders,
    ...updatedFromFolders,
    ...newFromFolders
  ].sort((a, b) => {
    // ترتيب حسب الاسم العربي
    return (a.arabicName || a.name).localeCompare(b.arabicName || b.name, 'ar');
  });

  // كتابة الملف بتشفير UTF-8
  fs.writeFileSync(outputFile, JSON.stringify(allReciters, null, 2) + '\n', { encoding: 'utf8' });
  console.log(`\n✓ تم تحديث ${outputFile} بنجاح!`);
  console.log(`  - القراء من خارج Readers: ${readersNotFromFolders.length}`);
  console.log(`  - القراء من مجلد Readers: ${updatedFromFolders.length + newFromFolders.length}`);
  console.log(`  - إجمالي القراء: ${allReciters.length}`);
}

main().catch(console.error);

