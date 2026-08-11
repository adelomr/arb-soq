/**
 * Arabic to English Romanization & Transliteration Slug Engine
 * Converts Arabic titles and phrases into clean, human-readable English URL slugs.
 * Example: "الماسة الزرقاء" -> "al-masa-al-zarqa"
 */

// Common Arabic Words & Terms Dictionary Mapping to exact English/Phonetic terms
const ARABIC_DICTIONARY: Record<string, string> = {
  // Common terms & descriptors
  الماسة: 'al-masa',
  الزرقاء: 'al-zarqa',
  شركة: 'sharikat',
  مؤسسة: 'muassasat',
  مركز: 'markaz',
  خدمة: 'khadmat',
  خدمات: 'khadamat',
  أفضل: 'afdal',
  احسن: 'ahsan',
  ممتاز: 'momtaz',
  محترف: 'mohtaraf',
  متخصص: 'motakhasas',
  شامل: 'shamel',
  سريع: 'sarea',
  ارخص: 'arkhas',
  سعر: 'sear',
  اسعار: 'as-ar',
  خصم: 'khasm',
  عروض: 'orood',
  جديد: 'jadid',
  مستعمل: 'mostamal',
  للبيع: 'lilbei',
  بيع: 'bei',
  للإيجار: 'lilejar',
  إيجار: 'ejar',
  مطلوب: 'matloob',
  مجانا: 'majanan',
  حراج: 'haraj',
  سوق: 'sooq',

  // Service Types & Professions
  تنظيف: 'tanzif',
  نظافة: 'nazafa',
  غسيل: 'ghasil',
  نقل: 'naql',
  تغليف: 'taghlif',
  عفش: 'afash',
  أثاث: 'athath',
  صيانة: 'siyana',
  تركيب: 'tarkib',
  فك: 'fak',
  سباكة: 'sabaka',
  سباك: 'sabak',
  كهرباء: 'kahraba',
  كهربائي: 'kahrabai',
  نجارة: 'najara',
  نجار: 'najar',
  دهانات: 'dahanat',
  دهان: 'dahan',
  تكييف: 'takyef',
  مكيفات: 'mokayefat',
  مكافحة: 'mokafahat',
  حشرات: 'hasharat',
  رش: 'rash',
  مبيدات: 'mobedat',
  كشف: 'kashf',
  تسربات: 'tasarobat',
  عزل: 'azl',
  أسطح: 'as-tah',
  خزانات: 'khazanat',
  مقاولات: 'moqawalat',
  تشطيبات: 'tashtibat',
  حدائق: 'hadaeq',
  مشتل: 'mashtal',
  زراعة: 'ziraa',

  // Categories & Products
  سيارات: 'sayarat',
  مركبات: 'markabat',
  قطع: 'qetaa',
  غيار: 'ghiyar',
  عقارات: 'aqarat',
  شقق: 'shoqaq',
  شقة: 'shaqa',
  فلل: 'filal',
  فيلا: 'villa',
  منازل: 'manazil',
  منزل: 'manzil',
  بيوت: 'byoot',
  أراضي: 'aradi',
  محلات: 'mahalat',
  مكاتب: 'makateb',
  موبايلات: 'mobailat',
  هواتف: 'hawatef',
  جوالات: 'jawalat',
  إلكترونيات: 'elektroniyat',
  أجهزة: 'aghiza',
  وظائف: 'wazaef',
  موظفين: 'mowazafeen',
  موضة: 'moda',
  ملابس: 'malabes',
  حيوانات: 'hayawanat',
  أطفال: 'atfal',

  // Locations & Cities
  الرياض: 'al-riyadh',
  رياض: 'riyadh',
  جدة: 'jeddah',
  مكة: 'makkah',
  المدينة: 'al-madinah',
  الدمام: 'al-dammam',
  الخبر: 'al-khobar',
  الظهران: 'al-dhahran',
  القطيف: 'al-qatif',
  الاحساء: 'al-ahsa',
  القصيم: 'al-qassim',
  بريدة: 'buraidah',
  عنيزة: 'unaizah',
  حائل: 'hail',
  تبوك: 'tabuk',
  ابها: 'abha',
  خميس: 'khamis',
  مشيط: 'mushait',
  جازان: 'jazan',
  نجران: 'najran',
  الطائف: 'al-taif',
  ينبع: 'yanbu',
  القاهرة: 'al-qahira',
  قاهرة: 'cairo',
  الجيزة: 'al-giza',
  جيزة: 'giza',
  الإسكندرية: 'al-iskandariya',
  اسكندرية: 'alexandria',
  دبي: 'dubai',
  أبوظبي: 'abudhabi',
  الشارقة: 'al-sharjah',
  الكويت: 'al-kuwait',
  مسقط: 'muscat',
  المنامة: 'al-manama',
  الدوحة: 'al-doha',
};

// Arabic Character Transliteration Map
const CHAR_MAP: Record<string, string> = {
  أ: 'a', إ: 'a', آ: 'a', ٱ: 'a', ا: 'a', ى: 'a',
  ب: 'b',
  ت: 't', ة: 'a',
  ث: 'th',
  ج: 'g',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w', ؤ: 'w',
  ي: 'y', ئ: 'y', ء: 'a',
};

/**
 * Transliterates a single Arabic word phonetically into Latin script.
 */
export function transliterateArabicWord(word: string): string {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return '';

  // Direct match in dictionary
  if (ARABIC_DICTIONARY[cleanWord]) {
    return ARABIC_DICTIONARY[cleanWord];
  }

  // Handle prefix "ال" (Al-)
  let prefix = '';
  let core = cleanWord;
  if (core.startsWith('ال') && core.length > 3) {
    prefix = 'al-';
    core = core.slice(2);
    if (ARABIC_DICTIONARY[core]) {
      return `${prefix}${ARABIC_DICTIONARY[core]}`;
    }
  }

  // Handle prefix "و" (Wa-) or "ب" (Bi-) or "ف" (Fa-) or "ل" (Li-)
  if ((core.startsWith('و') || core.startsWith('ب') || core.startsWith('ف') || core.startsWith('ل')) && core.length > 3) {
    const prefChar = core[0];
    const subCore = core.slice(1);
    const prefMap: Record<string, string> = { و: 'wa-', ب: 'bi-', ف: 'fa-', ل: 'li-' };
    if (subCore.startsWith('ال') && subCore.length > 3) {
      const innerCore = subCore.slice(2);
      if (ARABIC_DICTIONARY[innerCore]) {
        return `${prefMap[prefChar]}al-${ARABIC_DICTIONARY[innerCore]}`;
      }
    } else if (ARABIC_DICTIONARY[subCore]) {
      return `${prefMap[prefChar]}${ARABIC_DICTIONARY[subCore]}`;
    }
  }

  // Character by character transliteration
  let transliterated = '';
  for (let i = 0; i < core.length; i++) {
    const char = core[i];
    if (CHAR_MAP[char] !== undefined) {
      transliterated += CHAR_MAP[char];
    } else if (/[a-z0-9]/i.test(char)) {
      transliterated += char.toLowerCase();
    }
  }

  return prefix + transliterated;
}

/**
 * Main function: Converts Arabic or mixed Arabic/English text into a clean English URL slug.
 * Example: "الماسة الزرقاء" -> "al-masa-al-zarqa"
 */
export function arabicToSlug(input: string): string {
  if (!input) return '';

  // 1. Normalize diacritics and tashkeel
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '');

  // 2. Tokenize by space or punctuation
  const words = normalized.split(/[\s,._/\\()\-+|&]+/);

  const slugParts: string[] = [];

  for (const rawWord of words) {
    const word = rawWord.trim();
    if (!word) continue;

    // If word is already pure English or digits
    if (/^[a-z0-9-]+$/i.test(word)) {
      slugParts.push(word.toLowerCase());
      continue;
    }

    // Transliterate Arabic word
    const transliterated = transliterateArabicWord(word);
    if (transliterated) {
      slugParts.push(transliterated);
    }
  }

  // 3. Join with single dash and clean up multiple dashes
  let slug = slugParts.join('-')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'page';
}

/**
 * Generates a clean English slug with optional random short hash for uniqueness.
 */
export function generateEnglishSlug(title: string, suffixHash = false): string {
  const baseSlug = arabicToSlug(title);
  if (!suffixHash) return baseSlug;
  const hash = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${hash}`;
}
