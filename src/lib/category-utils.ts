import type { Ad, Category } from '@/lib/types';

/**
 * Normalizes string for clean comparison (lowercased, trimmed).
 */
export function normalizeKey(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().trim();
}

export function getCategorySlug(catId: string, catName?: string): string {
  if (!catId) return '';
  return normalizeKey(catId);
}

/**
 * Returns parent category ID for any given category or subcategory ID/alias from the actual loaded categories.
 */
export function getParentCategoryId(subOrCatId: string, categoriesList?: Category[]): string {
  if (!subOrCatId) return '';
  const key = normalizeKey(subOrCatId);

  const allCategories = categoriesList || [];

  // 1. Direct match with a main category ID or Arabic Name
  const mainCat = allCategories.find(c => normalizeKey(c.id) === key || normalizeKey(c.name?.ar) === key);
  if (mainCat) return mainCat.id;

  // 2. Search inside subcategories
  for (const cat of allCategories) {
    if (cat.subcategories && cat.subcategories.length > 0) {
      const foundSub = cat.subcategories.find(s => 
        normalizeKey(s.id) === key || 
        normalizeKey(s.name?.ar) === key ||
        (s.parentId && normalizeKey(s.parentId) === key)
      );
      if (foundSub) return cat.id;
    }
  }

  return key;
}

/**
 * Determines whether an Ad belongs to a specific market/country strictly and accurately.
 */
export function isAdInMarket(ad: Ad, marketId: string, marketNameAr: string): boolean {
  if (!ad) return false;
  const adMarket = normalizeKey(ad.market);
  const adCountry = normalizeKey(ad.country);
  const adLoc = normalizeKey(ad.location);
  const targetId = normalizeKey(marketId);
  const targetName = normalizeKey(marketNameAr);

  if (!targetId) return true;

  // 1. Direct market ID match (e.g. 'eg' === 'eg', 'sa' === 'sa')
  if (adMarket === targetId) return true;

  // 2. Known market aliases for Egypt
  if (targetId === 'eg') {
    if (adMarket === 'egp' || adMarket === 'مصر' || adMarket === 'egypt') return true;
    if (adCountry.includes('مصر') || adCountry.includes('egypt')) return true;
    if (adLoc.includes('مصر') || adLoc.includes('القاهرة') || adLoc.includes('الجيزة') || adLoc.includes('الإسكندرية') || adLoc.includes('طنطا') || adLoc.includes('الشرقية') || adLoc.includes('الدقهلية')) return true;
  }

  // 3. Known market aliases for Saudi Arabia
  if (targetId === 'sa') {
    if (adMarket === 'sar' || adMarket === 'السعودية' || adMarket === 'saudi') return true;
    if (adCountry.includes('سعودي') || adCountry.includes('saudi') || adCountry.includes('السعودية')) return true;
    if (adLoc.includes('السعودية') || adLoc.includes('الرياض') || adLoc.includes('جدة') || adLoc.includes('مكة') || adLoc.includes('المدينة') || adLoc.includes('الدمام')) return true;
  }

  // 4. Match Arabic target name in country or location
  if (targetName && targetName.length > 2) {
    if (adCountry && (adCountry.includes(targetName) || targetName.includes(adCountry))) return true;
    if (adLoc && adLoc.includes(targetName)) return true;
  }

  // 5. If ad has no market/country, allow it ONLY if location doesn't belong to another country
  if (!adMarket && !adCountry) {
    if (targetId === 'sa' && (adLoc.includes('مصر') || adLoc.includes('القاهرة') || adLoc.includes('الجيزة'))) return false;
    if (targetId === 'eg' && (adLoc.includes('السعودية') || adLoc.includes('الرياض') || adLoc.includes('جدة'))) return false;
    return true;
  }

  // Otherwise, if ad belongs to another market/country, strictly return false
  return false;
}

/**
 * Determines whether an Ad belongs to a target main category or its subcategories.
 */
export function matchAdToCategory(ad: Ad, targetCategoryOrId: string | Category, categoriesList?: Category[]): boolean {
  if (!ad) return false;

  const targetId = typeof targetCategoryOrId === 'string'
    ? normalizeKey(targetCategoryOrId)
    : normalizeKey(targetCategoryOrId.id);

  if (!targetId) return false;

  const adCat = normalizeKey(ad.category);
  const adCatId = normalizeKey((ad as any).categoryId);
  const adSub = normalizeKey(ad.subcategory);
  const adSubId = normalizeKey((ad as any).subcategoryId);

  // 1. Direct main category match
  if (adCat === targetId || adCatId === targetId) return true;

  // 2. Parent resolution match
  const adParent = getParentCategoryId(adCatId || adCat || adSubId || adSub, categoriesList);
  const targetParent = getParentCategoryId(targetId, categoriesList);

  if (adParent && targetParent && adParent === targetParent) return true;

  // 3. Check if targetCategory has subcategories containing ad.subcategory or ad.category
  const allCategories = categoriesList || [];

  const targetCatObj = typeof targetCategoryOrId !== 'string'
    ? targetCategoryOrId
    : allCategories.find(c => normalizeKey(c.id) === targetId || normalizeKey(c.name?.ar) === targetId);

  if (targetCatObj && targetCatObj.subcategories) {
    const subMatch = targetCatObj.subcategories.some(s => {
      const sId = normalizeKey(s.id);
      const sName = normalizeKey(s.name?.ar);
      return (
        sId === adSubId ||
        sId === adSub ||
        sId === adCat ||
        (sName && (sName === adSub || sName === adCat))
      );
    });
    if (subMatch) return true;
  }

  return false;
}

/**
 * Determines whether an Ad matches a specific subcategory.
 */
export function matchAdToSubcategory(ad: Ad, subId: string, subName?: string): boolean {
  if (!ad || !subId) return false;

  const targetSubId = normalizeKey(subId);
  const targetSubName = normalizeKey(subName);

  const adSub = normalizeKey(ad.subcategory);
  const adSubId = normalizeKey((ad as any).subcategoryId);
  const adTitle = normalizeKey(ad.title);
  const adCat = normalizeKey(ad.category);

  if (adSubId === targetSubId || adSub === targetSubId) return true;

  if (targetSubName) {
    if (adSub === targetSubName || adSub.includes(targetSubName) || targetSubName.includes(adSub)) return true;
    if (adTitle && adTitle.includes(targetSubName)) return true;
  }

  // دعم تصفية "سيارات للبيع"
  const isCarsSaleTarget =
    targetSubId.includes('sale') ||
    targetSubId.includes('cars_sale') ||
    (targetSubName && (targetSubName.includes('سيارات للبيع') || (targetSubName.includes('سيار') && targetSubName.includes('بيع'))));

  if (isCarsSaleTarget) {
    const isVehicle = adCat === 'vehicles' || adCat === 'cars' || Boolean(ad.brand);
    const isForSale = (ad.adType as string) !== 'rent' && !adTitle.includes('ايجار') && !adTitle.includes('إيجار');
    if (isVehicle && isForSale) return true;
  }

  return false;
}

export const PHYSICAL_GOODS_CATEGORIES = [
  'vehicles', 'cars', 'automotive', 'mobiles', 'phones', 'electronics', 'electronic',
  'appliances', 'devices', 'computers', 'laptops', 'gadgets', 'tech', 'electric',
  'screens', 'tv', 'audio', 'cameras', 'gaming', 'consoles', 'smartphones', 'tablets',
  'furniture', 'fashion', 'clothes', 'baby', 'kids', 'hobbies', 'trade', 'store-product'
];

export const NON_PHYSICAL_CATEGORIES = [
  'realestate', 'real-estate', 'property', 'properties',
  'jobs', 'job', 'careers', 'employment',
  'services', 'service', 'maintenance',
  'crafts', 'craft', 'professions',
  'transport', 'transport-delivery', 'delivery', 'shipping',
  'pets', 'animals',
  'ziraa', 'agriculture', 'farm',
  'education', 'courses', 'teaching',
  'general'
];

export function isPhysicalGoodsCategory(categoryOrId?: string, categoryName?: string): boolean {
  if (!categoryOrId && !categoryName) return false;
  const key = normalizeKey(categoryOrId);
  const name = normalizeKey(categoryName);

  // 1. Strict blacklist of non-physical categories (Real estate, Jobs, Services, Crafts, Transport, Pets, Agriculture, Education, General)
  if (
    NON_PHYSICAL_CATEGORIES.some(cat => key === cat || key.startsWith(cat) || key.includes(cat)) ||
    name.includes('عقار') ||
    name.includes('شقق') ||
    name.includes('أراض') ||
    name.includes('اراض') ||
    name.includes('وظائف') ||
    name.includes('توظيف') ||
    name.includes('عمل') ||
    name.includes('خدمات') ||
    name.includes('خدمة') ||
    name.includes('حرف') ||
    name.includes('مهن') ||
    name.includes('نقل') ||
    name.includes('توصيل') ||
    name.includes('شحن') ||
    name.includes('حيوان') ||
    name.includes('كلاب') ||
    name.includes('قطط') ||
    name.includes('طيور') ||
    name.includes('زراع') ||
    name.includes('محاصيل') ||
    name.includes('تعليم') ||
    name.includes('تدريب') ||
    name.includes('دروس') ||
    name.includes('عام')
  ) {
    return false;
  }

  // 2. Strict whitelist of physical goods categories (including all Electronics and Devices variations)
  return (
    PHYSICAL_GOODS_CATEGORIES.some(cat => key === cat || key.startsWith(cat) || key.includes(cat)) ||
    name.includes('عربيات') ||
    name.includes('سيارات') ||
    name.includes('مركبات') ||
    name.includes('موبايل') ||
    name.includes('هواتف') ||
    name.includes('جوال') ||
    name.includes('إلكترون') ||
    name.includes('الكترون') ||
    name.includes('اكترون') ||
    name.includes('أجهزة') ||
    name.includes('اجهزة') ||
    name.includes('كهربائية') ||
    name.includes('كهربائي') ||
    name.includes('كمبيوتر') ||
    name.includes('حاسوب') ||
    name.includes('لابتوب') ||
    name.includes('شاشات') ||
    name.includes('تلفزيون') ||
    name.includes('صوتيات') ||
    name.includes('سماعات') ||
    name.includes('كاميرا') ||
    name.includes('ألعاب') ||
    name.includes('العاب') ||
    name.includes('بلايستيشن') ||
    name.includes('أثاث') ||
    name.includes('اثاث') ||
    name.includes('مفروشات') ||
    name.includes('موضة') ||
    name.includes('ملابس') ||
    name.includes('أطفال') ||
    name.includes('اطفال') ||
    name.includes('هوايات') ||
    name.includes('رياضة') ||
    name.includes('تجارة') ||
    name.includes('منتج')
  );
}
