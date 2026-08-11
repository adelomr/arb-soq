/**
 * Comprehensive Arabic Search Taxonomy & Synonym Engine
 * Maps professions, crafts, categories, and trades to expanded keywords and synonyms.
 */

export interface CraftTaxonomy {
  id: string;
  title: string;
  category: string;
  iconName: string;
  keywords: string[];
}

export const CRAFTS_TAXONOMY: CraftTaxonomy[] = [
  {
    id: 'tiler',
    title: 'مبلط وفني سيراميك',
    category: 'خدمات وصيانة',
    iconName: 'Grid',
    keywords: ['مبلط', 'بلاط', 'تبليط', 'سيراميك', 'رخام', 'بورسلين', 'معلم سيراميك', 'تركيب سيراميك', 'أرضيات', 'جرانيت'],
  },
  {
    id: 'plumber',
    title: 'سباك وفني سباكة',
    category: 'خدمات وصيانة',
    iconName: 'Wrench',
    keywords: ['سباك', 'سباكة', 'مواسير', 'أدوات صحية', 'تسريب', 'صرف صحي', 'خزانات', 'مضخات', 'سخانات', 'تأسيس سباكة'],
  },
  {
    id: 'electrician',
    title: 'كهربائي منازل ومباني',
    category: 'خدمات وصيانة',
    iconName: 'Zap',
    keywords: ['كهربائي', 'كهرباء', 'تأسيس كهرباء', 'إنارة', 'صيانة كهرباء', 'لوحات كهرباء', 'أفياش', 'ثريات', 'فني كهرباء'],
  },
  {
    id: 'carpenter',
    title: 'نجار وفني أثاث',
    category: 'خدمات وصيانة',
    iconName: 'Hammer',
    keywords: ['نجار', 'نجارة', 'أثاث', 'اثاث', 'خشب', 'غرف نوم', 'مطابخ', 'طاولات', 'أبواب', 'تصليح أثاث', 'تركيب ايكيا'],
  },
  {
    id: 'painter',
    title: 'نقاش وفني دهانات',
    category: 'خدمات وصيانة',
    iconName: 'Paintbrush',
    keywords: ['نقاش', 'دهان', 'دهانات', 'صباغ', 'بويات', 'ورق حائط', 'جيبسوم بورد', 'جبس بورد', 'ديكورات', 'واجهات'],
  },
  {
    id: 'blacksmith',
    title: 'حداد وفني حدادة',
    category: 'خدمات وصيانة',
    iconName: 'Shield',
    keywords: ['حداد', 'حدادة', 'مظلات', 'سواتر', 'أبواب حديد', 'شبابيك', 'هناجر', 'درابزين', 'ألوميتال', 'ألومنيوم'],
  },
  {
    id: 'builder',
    title: 'مقاول وبناء وتشييد',
    category: 'مقاولات وبناء',
    iconName: 'Building',
    keywords: ['بناء', 'مقاول', 'ترميم', 'تشطيب', 'خرسانة', 'عظم', 'تسليم مفتاح', 'عزل', 'لياسة', 'مباني'],
  },
  {
    id: 'hvac',
    title: 'فني تكييف وتبريد',
    category: 'خدمات وصيانة',
    iconName: 'Wind',
    keywords: ['تكييف', 'مكيفات', 'صيانة مكيفات', 'تنظيف مكيفات', 'سبليت', 'مركزي', 'شباك', 'فاد', 'تبريد', 'فني تكييف'],
  },
  {
    id: 'driver',
    title: 'سائق ونقل عفش',
    category: 'نقل وخدمات',
    iconName: 'Truck',
    keywords: ['سائق', 'نقل عفش', 'نقل أثاث', 'دينا', 'سطحة', 'توصيل', 'مشاوير', 'نقل بضائع', 'سائق خاص'],
  },
  {
    id: 'cars',
    title: 'سيارات وقطع غيار',
    category: 'سيارات ومركبات',
    iconName: 'Car',
    keywords: ['سيارات', 'سيارة', 'مركبات', 'قطع غيار', 'تويوتا', 'هيونداي', 'فورد', 'نيسان', 'مرسيدس', 'بي ام', 'كيا', 'لكزس', 'شفروليه', 'مستعملة'],
  },
  {
    id: 'realestate',
    title: 'عقارات وشقق وأراضٍ',
    category: 'عقارات',
    iconName: 'Home',
    keywords: ['عقارات', 'شقق', 'شقة', 'فيلا', 'فلل', 'أراض', 'اراضي', 'إيجار', 'ايجار', 'بيع', 'عقار', 'محل', 'استراحة', 'شاليه'],
  },
  {
    id: 'electronics',
    title: 'هواتف وإلكترونيات',
    category: 'إلكترونيات',
    iconName: 'Smartphone',
    keywords: ['هواتف', 'جوالات', 'أيفون', 'ايفون', 'سامسونج', 'كمبيوتر', 'لابتوب', 'شاشات', 'بلايستيشن', 'سماعات', 'أجهزة إلكترونية'],
  },
  {
    id: 'furniture',
    title: 'أثاث وديكور منزلي',
    category: 'أثاث ومستلزمات',
    iconName: 'Armchair',
    keywords: ['أثاث', 'اثاث', 'كنب', 'مجلس', 'غرفة نوم', 'سجاد', 'مفرش', 'طاولة', 'مطابخ', 'أجهزة منزلية', 'ثلاجة', 'غسالة'],
  },
];

/**
 * Expand search query tokens with synonyms from the craft taxonomy.
 */
export function getExpandedSearchKeywords(query: string): string[] {
  if (!query) return [];
  const normalizedQ = query.trim().toLowerCase();
  const keywordsSet = new Set<string>([normalizedQ]);

  CRAFTS_TAXONOMY.forEach((craft) => {
    const matched = craft.keywords.some(
      (kw) => normalizedQ.includes(kw) || kw.includes(normalizedQ)
    );
    if (matched) {
      craft.keywords.forEach((kw) => keywordsSet.add(kw));
    }
  });

  return Array.from(keywordsSet);
}

/**
 * Find matching crafts from taxonomy for dropdown display.
 */
export function findMatchingCrafts(query: string): CraftTaxonomy[] {
  if (!query || query.trim().length < 2) return [];
  const normQ = query.trim().toLowerCase();

  return CRAFTS_TAXONOMY.filter((craft) => {
    return (
      craft.title.toLowerCase().includes(normQ) ||
      craft.category.toLowerCase().includes(normQ) ||
      craft.keywords.some((kw) => kw.toLowerCase().includes(normQ) || normQ.includes(kw))
    );
  });
}
