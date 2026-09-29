import { markets } from './markets';

export interface CountryInfo {
  code: string;       // e.g. 'EG', 'SA', 'AE'
  id: string;         // e.g. 'eg', 'sa', 'ae'
  name: string;       // e.g. 'مصر', 'السعودية'
  flag: string;       // e.g. '🇪🇬', '🇸🇦'
  phoneCode?: string; // e.g. '+20', '+966'
}

/**
 * تحويل رمز كود الدولة المكون من حرفين إلى علم إيموجي (ISO 3166-1 alpha-2)
 */
export function getFlagEmoji(flagCode: string): string {
  if (!flagCode || flagCode.length !== 2) return '🌐';
  const codePoints = flagCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

// قائمة الدول المدعومة مع الأعلام والأسماء
export const ALL_COUNTRIES: CountryInfo[] = markets.map((m) => ({
  id: m.id.toLowerCase(),
  code: m.flagCode.toUpperCase(),
  name: m.name.ar,
  flag: getFlagEmoji(m.flagCode),
  phoneCode: m.phoneCode,
}));

// كلمات مفتاحية للمدن والمحافظات المصرية لربطها تلقائياً إذا لم تكن الدولة مسجلة
const EGYPT_KEYWORDS = [
  'مصر', 'egypt', 'القاهرة', 'الجيزة', 'الإسكندرية', 'الاسكندرية', 'القليوبية', 'الشرقية',
  'الدقهلية', 'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'أسيوط', 'اسيوط', 'سوهاج',
  'المنيا', 'قنا', 'الأقصر', 'الاقصر', 'أسوان', 'اسوان', 'بورسعيد', 'الإسماعيلية', 'الاسماعيلية',
  'السويس', 'البحر الأحمر', 'شرم الشيخ', 'الغردقة', 'دمياط', 'مطروح', 'الفيوم', 'بني سويف',
  'شمال سيناء', 'جنوب سيناء', 'الوادي الجديد', 'أكتوبر', 'اكتوبر', 'زايد', 'التجمع', 'المعادي',
  'المنصورة', 'طنطا', 'بنها', 'دمنهور', 'المحلة', 'الزقازيق'
];

// كلمات مفتاحية للمدن السعودية
const SAUDI_KEYWORDS = [
  'السعودية', 'المملكة', 'saudi', 'ksa', 'الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام',
  'الخبر', 'الظهران', 'الطائف', 'تبوك', 'بريدة', 'عنيزة', 'أبها', 'خميس مشيط', 'حائل',
  'جازان', 'نجران', 'ينبع', 'الجبيل', 'حفر الباطن', 'القطيف', 'الأحساء', 'الاحساء', 'الخرج'
];

// كلمات مفتاحية للإمارات
const UAE_KEYWORDS = [
  'الإمارات', 'الامارات', 'uae', 'دبي', 'أبوظبي', 'ابوظبي', 'الشارقة', 'عجمان',
  'رأس الخيمة', 'الفجيرة', 'أم القيوين'
];

// كلمات مفتاحية للكويت
const KUWAIT_KEYWORDS = ['الكويت', 'kuwait', 'السالمية', 'حولي', 'الأحمدي', 'الفروانية'];

/**
 * تحديد دولة المستخدم أو الإعلان بناءً على الدولة، السوق، الهاتف، أو المدينة والمحافظة
 */
export function detectCountry(entity: {
  country?: string | null;
  market?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  province?: string | null;
  governorate?: string | null;
  city?: string | null;
}): CountryInfo {
  const rawCountry = (entity.country || '').trim().toLowerCase();
  const rawMarket = (entity.market || '').trim().toLowerCase();
  const rawPhone = (entity.phoneNumber || '').trim();
  const rawLocation = [entity.location, entity.province, entity.governorate, entity.city]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 1. فحص كود السوق المباشر (مثل: sa, eg, ae)
  if (rawMarket) {
    const matchedMarket = ALL_COUNTRIES.find((c) => c.id === rawMarket || c.code.toLowerCase() === rawMarket);
    if (matchedMarket) return matchedMarket;
  }

  // 2. مطابقة اسم الدولة أو رمزها المباشر
  if (rawCountry) {
    const matched = ALL_COUNTRIES.find(
      (c) =>
        c.name.toLowerCase() === rawCountry ||
        c.id === rawCountry ||
        c.code.toLowerCase() === rawCountry ||
        rawCountry.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(rawCountry)
    );
    if (matched) return matched;
  }

  // 3. مطابقة مفتاح الهاتف الدولي
  if (rawPhone) {
    const cleanPhone = rawPhone.replace(/\s+/g, '');
    for (const c of ALL_COUNTRIES) {
      if (c.phoneCode && cleanPhone.startsWith(c.phoneCode)) {
        return c;
      }
    }
    // أرقام الهواتف المصرية المحلية التي تبدأ بـ 010 أو 011 أو 012 أو 015
    if (/^01[0125]/.test(cleanPhone)) {
      const eg = ALL_COUNTRIES.find((c) => c.id === 'eg');
      if (eg) return eg;
    }
    // أرقام الهواتف السعودية المحلية التي تبدأ بـ 05
    if (/^05[0-9]/.test(cleanPhone)) {
      const sa = ALL_COUNTRIES.find((c) => c.id === 'sa');
      if (sa) return sa;
    }
  }

  // 4. مطابقة نص المحافظة أو المدينة أو العنوان
  if (rawLocation) {
    if (EGYPT_KEYWORDS.some((k) => rawLocation.includes(k.toLowerCase()))) {
      const eg = ALL_COUNTRIES.find((c) => c.id === 'eg');
      if (eg) return eg;
    }
    if (SAUDI_KEYWORDS.some((k) => rawLocation.includes(k.toLowerCase()))) {
      const sa = ALL_COUNTRIES.find((c) => c.id === 'sa');
      if (sa) return sa;
    }
    if (UAE_KEYWORDS.some((k) => rawLocation.includes(k.toLowerCase()))) {
      const ae = ALL_COUNTRIES.find((c) => c.id === 'ae');
      if (ae) return ae;
    }
    if (KUWAIT_KEYWORDS.some((k) => rawLocation.includes(k.toLowerCase()))) {
      const kw = ALL_COUNTRIES.find((c) => c.id === 'kw');
      if (kw) return kw;
    }
  }

  // افتراضي إذا لم يتم التعرف
  return {
    code: 'OTHER',
    id: 'other',
    name: rawCountry || 'غير محدد',
    flag: '🌐',
  };
}
