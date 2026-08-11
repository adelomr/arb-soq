import { markets, Market } from './markets';

// خريطة الربط بين المناطق الزمنية ومعرفات الأسواق العربية
const TIMEZONE_TO_MARKET_MAP: Record<string, string> = {
  'Africa/Cairo': 'eg',
  'Asia/Riyadh': 'sa',
  'Asia/Dubai': 'ae',
  'Asia/Amman': 'jo',
  'Africa/Algiers': 'dz',
  'Asia/Bahrain': 'bh',
  'Indian/Comoro': 'km',
  'Africa/Djibouti': 'dj',
  'Asia/Baghdad': 'iq',
  'Asia/Kuwait': 'kw',
  'Asia/Beirut': 'lb',
  'Africa/Tripoli': 'ly',
  'Africa/Nouakchott': 'mr',
  'Africa/Casablanca': 'ma',
  'Asia/Muscat': 'om',
  'Asia/Gaza': 'ps',
  'Asia/Hebron': 'ps',
  'Asia/Qatar': 'qa',
  'Africa/Mogadishu': 'so',
  'Africa/Khartoum': 'sd',
  'Asia/Damascus': 'sy',
  'Africa/Tunis': 'tn',
  'Asia/Aden': 'ye',
};

/**
 * تحديد السوق فورا بناءً على المنطقة الزمنية لمتصفح الزائر دون الحاجة لطلب شبكة
 */
export function detectMarketFromTimezone(): Market | null {
  if (typeof window === 'undefined') return null;

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return null;

    const marketId = TIMEZONE_TO_MARKET_MAP[timeZone];
    if (marketId) {
      const found = markets.find((m) => m.id === marketId);
      if (found) return found;
    }
  } catch (error) {
    console.warn('Timezone detection error:', error);
  }

  return null;
}

/**
 * الحصول على السوق الافتراضي الأنسب عند بدء التحميل
 */
export function getInitialMarket(): Market {
  const tzMarket = detectMarketFromTimezone();
  if (tzMarket) return tzMarket;

  // افتراضي مصر بدلاً من السعودية إذا لم يتم التعرف على المنطقة الزمنية
  const egMarket = markets.find((m) => m.id === 'eg');
  return egMarket || markets[0];
}
