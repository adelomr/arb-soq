import type { Ad, Category } from '@/lib/types';
import { DEFAULT_ORGANIZED_CATEGORIES } from '@/lib/default-categories';

/**
 * Normalizes string for clean comparison (lowercased, trimmed).
 */
export function normalizeKey(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().trim();
}

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  vehicles: 'cars-auto-parts',
  cars: 'cars-auto-parts',
  realestate: 'real-estate',
  'real-estate': 'real-estate',
  mobiles: 'mobiles-tablets',
  jobs: 'jobs-careers',
  furniture: 'home-office-furniture',
  electronics: 'electronics-appliances',
  fashion: 'fashion-beauty',
  pets: 'pets-animals',
  baby: 'baby-kids',
  hobbies: 'hobbies-sports',
  trade: 'commercial-industrial',
  commercial: 'commercial-industrial',
  services: 'professional-services',
  crafts: 'crafts-professions',
  cat_1786316040524: 'crafts-professions',
};

export function getCategorySlug(catId: string): string {
  if (!catId) return 'professional-services';
  const key = normalizeKey(catId);
  return CATEGORY_SLUG_MAP[key] || key;
}

/**
 * Returns parent category ID for any given category or subcategory ID/alias.
 */
export function getParentCategoryId(subOrCatId: string, categoriesList?: Category[]): string {
  if (!subOrCatId) return '';
  const key = normalizeKey(subOrCatId);

  const allCategories = (categoriesList && categoriesList.length > 0)
    ? categoriesList
    : DEFAULT_ORGANIZED_CATEGORIES;

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

  // 3. Fallback known alias mappings
  if (key === 'cars' || key.includes('سيار') || key.includes('عربيا') || key.includes('vehicles')) return 'vehicles';
  if (key === 'phones' || key.includes('موبايل') || key.includes('هاتف') || key.includes('mobiles')) return 'mobiles';
  if (key.includes('عقار') || key.includes('realestate') || key.includes('real-estate')) return 'realestate';
  if (key.includes('وظائف') || key.includes('jobs')) return 'jobs';
  if (key.includes('أثاث') || key.includes('furniture') || key.includes('home-office') || key.includes('ديكور')) return 'furniture';
  if (key.includes('إلكترون') || key.includes('أجهزة') || key.includes('electronics')) return 'electronics';
  if (key.includes('موضة') || key.includes('fashion')) return 'fashion';
  if (key.includes('حيوان') || key.includes('pets')) return 'pets';
  if (key.includes('أطفال') || key.includes('baby') || key.includes('kids')) return 'baby';
  if (key.includes('هوايات') || key.includes('hobbies')) return 'hobbies';
  if (key.includes('تجارة') || key.includes('trade') || key.includes('commercial')) return 'trade';
  if (key.includes('خدمات') || key.includes('services')) return 'services';
  if (key.includes('مهن') || key.includes('حرف') || key.includes('crafts') || key === 'cat_1786316040524') return 'crafts';

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
  const allCategories = (categoriesList && categoriesList.length > 0)
    ? categoriesList
    : DEFAULT_ORGANIZED_CATEGORIES;

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

  if (adSubId === targetSubId || adSub === targetSubId) return true;

  if (targetSubName) {
    if (adSub === targetSubName || adSub.includes(targetSubName) || targetSubName.includes(adSub)) return true;
    if (adTitle && adTitle.includes(targetSubName)) return true;
  }

  return false;
}
