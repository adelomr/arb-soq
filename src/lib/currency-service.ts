/**
 * خدمة تحويل العملات اللحظية لسوق العرب
 * العملة الأساسية للنظام هي: الجنيه المصري (EGP)
 */

export const MARKET_CURRENCIES: Record<string, { symbol: string; code: string; name: string }> = {
  sa: { symbol: 'ر.س', code: 'SAR', name: 'ريال سعودي' },
  eg: { symbol: 'ج.م', code: 'EGP', name: 'جنيه مصري' },
  ae: { symbol: 'د.إ', code: 'AED', name: 'درهم إماراتي' },
  kw: { symbol: 'د.ك', code: 'KWD', name: 'دينار كويتي' },
  qa: { symbol: 'ر.ق', code: 'QAR', name: 'ريال قطري' },
  bh: { symbol: 'د.ب', code: 'BHD', name: 'دينار بحريني' },
  om: { symbol: 'ر.ع', code: 'OMR', name: 'ريال عماني' },
  jo: { symbol: 'د.أ', code: 'JOD', name: 'دينار أردني' },
  iq: { symbol: 'د.ع', code: 'IQD', name: 'دينار عراقي' },
  ma: { symbol: 'د.م', code: 'MAD', name: 'درهم مغربي' },
  dz: { symbol: 'د.ج', code: 'DZD', name: 'دينار جزائري' },
  ly: { symbol: 'د.ل', code: 'LYD', name: 'دينار ليبي' },
  sd: { symbol: 'ج.س', code: 'SDG', name: 'جنيه سوداني' },
  ye: { symbol: 'ر.ي', code: 'YER', name: 'ريال يمني' },
  tn: { symbol: 'د.ت', code: 'TND', name: 'دينار تونسي' },
  lb: { symbol: 'ل.ل', code: 'LBP', name: 'ليرة لبنانية' },
  ps: { symbol: 'شيكل', code: 'ILS', name: 'شيكل' },
  sy: { symbol: 'ل.س', code: 'SYP', name: 'ليرة سورية' },
  mr: { symbol: 'أوقية', code: 'MRU', name: 'أوقية' },
  km: { symbol: 'فرنك', code: 'KMF', name: 'فرنك قمري' },
  dj: { symbol: 'فرنك', code: 'DJF', name: 'فرنك جيبوتي' },
  so: { symbol: 'شلن', code: 'SOS', name: 'شلن صومالي' },
};

/**
 * جلب رمز واسم العملة للدولة المختارة في أعلى الموقع (يدعم كود الدولة مثل sa أو كود العملة مثل SAR)
 */
export function getMarketCurrency(marketIdOrCurrency?: string): { symbol: string; code: string; name: string } {
  if (!marketIdOrCurrency) return MARKET_CURRENCIES['eg'];
  const clean = marketIdOrCurrency.toLowerCase().trim();
  
  // فحص مباشر بكود الدولة
  if (MARKET_CURRENCIES[clean]) {
    return MARKET_CURRENCIES[clean];
  }
  
  // فحص بكود العملة (SAR, EGP, AED, etc.)
  const found = Object.values(MARKET_CURRENCIES).find(
    (c) => c.code.toLowerCase() === clean
  );
  if (found) return found;

  return MARKET_CURRENCIES['eg'];
}

export const COUNTRY_TO_CURRENCY_MAP: Record<string, string> = {
  // مصر
  'مصر': 'EGP',
  'جمهورية مصر العربية': 'EGP',
  'egypt': 'EGP',
  'eg': 'EGP',
  'القاهرة': 'EGP',
  'الجيزة': 'EGP',
  'الإسكندرية': 'EGP',
  'الاسكندرية': 'EGP',
  // السعودية
  'السعودية': 'SAR',
  'المملكة العربية السعودية': 'SAR',
  'saudi': 'SAR',
  'sa': 'SAR',
  'الرياض': 'SAR',
  'جدة': 'SAR',
  'مكة': 'SAR',
  'مكة المكرمة': 'SAR',
  'المدينة المنورة': 'SAR',
  'الدمام': 'SAR',
  // الإمارات
  'الإمارات': 'AED',
  'الامارات': 'AED',
  'دولة الإمارات العربية المتحدة': 'AED',
  'uae': 'AED',
  'ae': 'AED',
  'دبي': 'AED',
  'أبوظبي': 'AED',
  'ابوظبي': 'AED',
  'الشارقة': 'AED',
  // الكويت
  'الكويت': 'KWD',
  'kw': 'KWD',
  // قطر
  'قطر': 'QAR',
  'qa': 'QAR',
  // البحرين
  'البحرين': 'BHD',
  'bh': 'BHD',
  // عمان
  'عمان': 'OMR',
  'عُمان': 'OMR',
  'سلطنة عمان': 'OMR',
  'om': 'OMR',
  // الأردن
  'الأردن': 'JOD',
  'الاردن': 'JOD',
  'jo': 'JOD',
  // العراق
  'العراق': 'IQD',
  'iq': 'IQD',
  // المغرب
  'المغرب': 'MAD',
  'ma': 'MAD',
  // الجزائر
  'الجزائر': 'DZD',
  'dz': 'DZD',
  // ليبيا
  'ليبيا': 'LYD',
  'ly': 'LYD',
  // السودان
  'السودان': 'SDG',
  'sd': 'SDG',
  // اليمن
  'اليمن': 'YER',
  'ye': 'YER',
  // تونس
  'تونس': 'TND',
  'tn': 'TND',
  // لبنان
  'لبنان': 'LBP',
  'lb': 'LBP',
  // فلسطين
  'فلسطين': 'ILS',
  'ps': 'ILS',
  // سوريا
  'سوريا': 'SYP',
  'sy': 'SYP',
  // موريتانيا
  'موريتانيا': 'MRU',
  'mr': 'MRU',
};

export const SYMBOL_TO_CURRENCY_MAP: Record<string, string> = {
  'ج.م': 'EGP',
  'ج.م.': 'EGP',
  'جنيه': 'EGP',
  'جنيه مصري': 'EGP',
  'ر.س': 'SAR',
  'ر.س.': 'SAR',
  'ريال': 'SAR',
  'ريال سعودي': 'SAR',
  'د.إ': 'AED',
  'د.إ.': 'AED',
  'درهم': 'AED',
  'درهم إماراتي': 'AED',
  'د.ك': 'KWD',
  'د.ك.': 'KWD',
  'دينار كويتي': 'KWD',
  'ر.ق': 'QAR',
  'ر.ق.': 'QAR',
  'ريال قطري': 'QAR',
  'د.ب': 'BHD',
  'د.ب.': 'BHD',
  'دينار بحريني': 'BHD',
  'ر.ع': 'OMR',
  'ر.ع.': 'OMR',
  'ريال عماني': 'OMR',
  'د.أ': 'JOD',
  'د.أ.': 'JOD',
  'دينار أردني': 'JOD',
  'د.ع': 'IQD',
  'دينار عراقي': 'IQD',
  'د.م': 'MAD',
  'درهم مغربي': 'MAD',
  'د.ج': 'DZD',
  'دينار جزائري': 'DZD',
  'د.ل': 'LYD',
  'دينار ليبي': 'LYD',
  'ج.س': 'SDG',
  'جنيه سوداني': 'SDG',
  'ر.ي': 'YER',
  'ريال يمني': 'YER',
  'د.ت': 'TND',
  'دينار تونسي': 'TND',
  'ل.ل': 'LBP',
  'ليرة لبنانية': 'LBP',
  'شيكل': 'ILS',
  'ل.س': 'SYP',
  'ليرة سورية': 'SYP',
  'أوقية': 'MRU',
  'فرنك': 'DJF',
  'شلن': 'SOS',
  '$': 'USD',
  'usd': 'USD',
  '€': 'EUR',
  'eur': 'EUR',
};

export type AdCurrencySource = {
  currency?: string;
  market?: string;
  country?: string;
  governorate?: string;
  province?: string;
  city?: string;
  user?: { country?: string };
} | null | undefined;

/**
 * تحديد كود العملة الخاص بالإعلان بدقة استناداً إلى بيانات الإعلان الأصلية
 * بحيث لا يتأثر بتغيير الدولة في ترويسة الموقع
 */
export function resolveAdCurrencyCode(
  ad?: AdCurrencySource,
  fallbackCurrency?: string
): string {
  if (!ad) return fallbackCurrency || 'EGP';

  // 1. العملة المحددة صراحة في الإعلان
  if (ad.currency && typeof ad.currency === 'string') {
    const cleanCurr = ad.currency.trim();
    const upper = cleanCurr.toUpperCase();
    if (upper === 'EGP' || upper === 'SAR' || upper === 'AED' || upper === 'KWD' || upper === 'USD' || upper === 'EUR' || FALLBACK_EGP_RATES[upper]) {
      return upper;
    }
    if (SYMBOL_TO_CURRENCY_MAP[cleanCurr] || SYMBOL_TO_CURRENCY_MAP[cleanCurr.toLowerCase()]) {
      return SYMBOL_TO_CURRENCY_MAP[cleanCurr] || SYMBOL_TO_CURRENCY_MAP[cleanCurr.toLowerCase()];
    }
    const marketMatch = MARKET_CURRENCIES[cleanCurr.toLowerCase()];
    if (marketMatch) return marketMatch.code;
  }

  // 2. كود دولة الإعلان (ad.market مثل eg, sa, ae)
  if (ad.market && typeof ad.market === 'string') {
    const cleanMarket = ad.market.trim().toLowerCase();
    if (MARKET_CURRENCIES[cleanMarket]) {
      return MARKET_CURRENCIES[cleanMarket].code;
    }
    if (COUNTRY_TO_CURRENCY_MAP[cleanMarket]) {
      return COUNTRY_TO_CURRENCY_MAP[cleanMarket];
    }
  }

  // 3. اسم الدولة المكتوب بالعربي في الإعلان (ad.country مثل مصر، السعودية، الإمارات)
  if (ad.country && typeof ad.country === 'string') {
    const cleanCountry = ad.country.trim();
    if (COUNTRY_TO_CURRENCY_MAP[cleanCountry]) {
      return COUNTRY_TO_CURRENCY_MAP[cleanCountry];
    }
    for (const [key, val] of Object.entries(COUNTRY_TO_CURRENCY_MAP)) {
      if (cleanCountry.includes(key) || key.includes(cleanCountry)) {
        return val;
      }
    }
  }

  // 4. دولة المستخدم صاحب الإعلان إن وجدت
  if (ad.user?.country && typeof ad.user.country === 'string') {
    const userCountry = ad.user.country.trim();
    if (COUNTRY_TO_CURRENCY_MAP[userCountry]) {
      return COUNTRY_TO_CURRENCY_MAP[userCountry];
    }
  }

  // 5. المحافظة أو المدينة إن كانت تشير لدولة معينة
  const locStr = [ad.governorate, ad.province, ad.city].filter(Boolean).join(' ');
  if (locStr) {
    for (const [key, val] of Object.entries(COUNTRY_TO_CURRENCY_MAP)) {
      if (locStr.includes(key)) {
        return val;
      }
    }
  }

  return fallbackCurrency || 'EGP';
}

/**
 * تنسيق سعر الإعلان بعملته الأصلية الخاصة به، بثبات تام وبدون أن يتأثر بتغيير الدولة في الترويسة
 */
export function formatAdPrice(
  price: number | undefined | null,
  ad?: AdCurrencySource,
  fallbackCurrency?: string
): string {
  if (price === undefined || price === null || isNaN(price) || price <= 0) {
    return '';
  }

  const currencyCode = resolveAdCurrencyCode(ad, fallbackCurrency);
  const currencyInfo = getMarketCurrency(currencyCode);

  try {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
    }).format(price);
  } catch {
    const symbol = currencyInfo?.symbol || currencyCode;
    return `${formatCurrencyAmount(price)} ${symbol}`;
  }
}

/**
 * جلب رمز عملة الإعلان الأصلي (مثل: ج.م أو ر.س أو د.إ)
 */
export function getAdCurrencySymbol(
  ad?: AdCurrencySource,
  fallbackCurrency?: string
): string {
  const code = resolveAdCurrencyCode(ad, fallbackCurrency);
  return getMarketCurrency(code).symbol || code;
}

export const BASE_CURRENCY = 'EGP';

/**
 * أسعار صرف احتياطية حقيقية أمام 1 جنيه مصري في حال عدم توفر اتصال بالإنترنت
 */
export const FALLBACK_EGP_RATES: Record<string, number> = {
  EGP: 1,
  SAR: 0.0735,  // ~13.6 جنيه لكل ريال سعودي
  AED: 0.0720,  // ~13.9 جنيه لكل درهم إماراتي
  KWD: 0.00605, // ~165 جنيه لكل دينار كويتي
  QAR: 0.0714,  // ~14.0 جنيه لكل ريال قطري
  BHD: 0.00737, // ~135 جنيه لكل دينار بحريني
  OMR: 0.00754, // ~132 جنيه لكل ريال عماني
  JOD: 0.0139,  // ~72 جنيه لكل دينار أردني
  IQD: 25.73,   // ~1 جنيه = 25.7 دينار عراقي
  MAD: 0.185,   // ~5.4 جنيه لكل درهم مغربي
  DZD: 2.61,    // ~1 جنيه = 2.61 دينار جزائري
  LYD: 0.125,   // ~8 جنيه لكل دينار ليبي
  SDG: 8.82,    // ~1 جنيه = 8.82 جنيه سوداني
  YER: 4.65,    // ~1 جنيه = 4.65 ريال يمني
  TND: 0.057,   // ~17.5 جنيه لكل دينار تونسي
  LBP: 1755,    // ليرة لبنانية
  ILS: 0.059,   // شيكل فلسطيني
  SYP: 2.39,    // ليرة سورية
  MRU: 0.79,    // أوقية موريتانية
  KMF: 8.31,    // فرنك قمري
  DJF: 3.48,    // فرنك جيبوتي
  SOS: 11.21,   // شلن صومالي
  USD: 0.0196,  // دولار أمريكي
  EUR: 0.0169,  // يورو
};

/**
 * استخراج كود العملة القياسي (ISO 3-letters) من كود الدولة أو كود العملة
 */
export function resolveCurrencyCode(marketIdOrCurrency?: string): string {
  if (!marketIdOrCurrency) return 'EGP';
  const clean = marketIdOrCurrency.trim().toUpperCase();
  if (FALLBACK_EGP_RATES[clean]) return clean;

  const info = getMarketCurrency(marketIdOrCurrency);
  return (info?.code || 'EGP').toUpperCase();
}

/**
 * تحويل مبلغ من الجنيه المصري إلى العملة الهدف
 */
export function convertEgpTo(
  amountInEgp: number,
  targetCurrencyOrMarketId: string,
  rates: Record<string, number> = FALLBACK_EGP_RATES
): number {
  if (!amountInEgp || isNaN(amountInEgp)) return 0;
  const targetCode = resolveCurrencyCode(targetCurrencyOrMarketId);
  if (targetCode === 'EGP') return amountInEgp;

  const rate = rates[targetCode] || FALLBACK_EGP_RATES[targetCode] || 1;
  return Number((amountInEgp * rate).toFixed(2));
}

/**
 * تحويل مبلغ من عملة أجنبية إلى الجنيه المصري
 */
export function convertToEgp(
  amountInForeign: number,
  sourceCurrencyOrMarketId: string,
  rates: Record<string, number> = FALLBACK_EGP_RATES
): number {
  if (!amountInForeign || isNaN(amountInForeign)) return 0;
  const sourceCode = resolveCurrencyCode(sourceCurrencyOrMarketId);
  if (sourceCode === 'EGP') return amountInForeign;

  const rate = rates[sourceCode] || FALLBACK_EGP_RATES[sourceCode];
  if (!rate || rate <= 0) return amountInForeign;

  return Math.round(amountInForeign / rate);
}

/**
 * تنسيق الأرقام العشرية بشكل جمالي بدون أصفار زائدة
 */
export function formatCurrencyAmount(amount: number): string {
  if (amount === 0) return '0';
  if (Number.isInteger(amount)) {
    return amount.toLocaleString('en-US');
  }
  // إذا كان الرقم أقل من 1 أو يحتوي على كسور، نظهر منزلتين عشريتين
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * جلب أحدث أسعار الصرف من API الداخلي أو المباشر مع تخزين مؤقت
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('/api/currency/rates', {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        return { ...FALLBACK_EGP_RATES, ...data.rates };
      }
    }
  } catch (err) {
    console.warn('[CurrencyService] Using fallback rates:', err);
  }

  // تجربة بديلة في حال لم يجب المسار الداخلي
  try {
    const directRes = await fetch('https://open.er-api.com/v6/latest/EGP', {
      signal: AbortSignal.timeout(3500),
    });
    if (directRes.ok) {
      const directData = await directRes.json();
      if (directData?.rates) {
        return { ...FALLBACK_EGP_RATES, ...directData.rates };
      }
    }
  } catch {
    // استخدم الاحتياطي فوراً
  }

  return FALLBACK_EGP_RATES;
}
