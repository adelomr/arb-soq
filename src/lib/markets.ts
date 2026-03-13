
export type Market = {
  id: string;
  name: {
    ar: string;
  };
  flagCode: string; // ISO 3166-1 alpha-2 code
  currency: string; // ISO 4217 currency code
  majorCities?: string[];
  phoneCode: string;
};

export const markets: Market[] = [
  { id: 'sa', name: { ar: 'السعودية' }, flagCode: 'SA', currency: 'SAR', majorCities: ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 'الطائف', 'تبوك', 'بريدة', 'عنيزة', 'الرس', 'أبها', 'خميس مشيط', 'حائل', 'جازان', 'نجران', 'ينبع', 'الجبيل', 'حفر الباطن', 'القطيف', 'الأحساء', 'الخرج', 'سكاكا', 'عرعر', 'الباحة', 'القنفذة', 'بيشة', 'الدوادمي', 'الزلفي'], phoneCode: '+966' },
  { id: 'eg', name: { ar: 'مصر' }, flagCode: 'EG', currency: 'EGP', majorCities: ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية', 'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'أسيوط', 'سوهاج', 'المنيا', 'قنا', 'الأقصر', 'أسوان', 'بورسعيد', 'الإسماعيلية', 'السويس', 'البحر الأحمر', 'شرم الشيخ', 'الغردقة', 'دمياط', 'مطروح', 'الفيوم', 'بني سويف', 'شمال سيناء', 'جنوب سيناء', 'الوادي الجديد'], phoneCode: '+20' },
  { id: 'ae', name: { ar: 'الإمارات' }, flagCode: 'AE', currency: 'AED', majorCities: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين'], phoneCode: '+971' },
  { id: 'jo', name: { ar: 'الأردن' }, flagCode: 'JO', currency: 'JOD', majorCities: ['عمان', 'الزرقاء', 'إربد', 'العقبة', 'السلط', 'الكرك', 'معان'], phoneCode: '+962' },
  { id: 'dz', name: { ar: 'الجزائر' }, flagCode: 'DZ', currency: 'DZD', majorCities: ['الجزائر', 'وهران', 'قسنطينة', 'عنابة', 'سطيف'], phoneCode: '+213' },
  { id: 'bh', name: { ar: 'البحرين' }, flagCode: 'BH', currency: 'BHD', majorCities: ['المنامة', 'الرفاع', 'المحرق'], phoneCode: '+973' },
  { id: 'km', name: { ar: 'جزر القمر' }, flagCode: 'KM', currency: 'KMF', majorCities: ['موروني', 'موتسامودو'], phoneCode: '+269' },
  { id: 'dj', name: { ar: 'جيبوتي' }, flagCode: 'DJ', currency: 'DJF', majorCities: ['جيبوتي', 'علي صبيح'], phoneCode: '+253' },
  { id: 'iq', name: { ar: 'العراق' }, flagCode: 'IQ', currency: 'IQD', majorCities: ['بغداد', 'الموصل', 'البصرة', 'أربيل', 'كركوك', 'النجف', 'كربلاء'], phoneCode: '+964' },
  { id: 'kw', name: { ar: 'الكويت' }, flagCode: 'KW', currency: 'KWD', majorCities: ['مدينة الكويت', 'الأحمدي', 'حولي', 'السالمية', 'الفروانية'], phoneCode: '+965' },
  { id: 'lb', name: { ar: 'لبنان' }, flagCode: 'LB', currency: 'LBP', majorCities: ['بيروت', 'طرابلس', 'صيدا', 'جونيه'], phoneCode: '+961' },
  { id: 'ly', name: { ar: 'ليبيا' }, flagCode: 'LY', currency: 'LYD', majorCities: ['طرابلس', 'بنغازي', 'مصراتة'], phoneCode: '+218' },
  { id: 'mr', name: { ar: 'موريتانيا' }, flagCode: 'MR', currency: 'MRU', majorCities: ['نواكشوط', 'نواذيبو'], phoneCode: '+222' },
  { id: 'ma', name: { ar: 'المغرب' }, flagCode: 'MA', currency: 'MAD', majorCities: ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أغادير'], phoneCode: '+212' },
  { id: 'om', name: { ar: 'عُمان' }, flagCode: 'OM', currency: 'OMR', majorCities: ['مسقط', 'السيب', 'صلالة', 'صحار'], phoneCode: '+968' },
  { id: 'ps', name: { ar: 'فلسطين' }, flagCode: 'PS', currency: 'ILS', majorCities: ['غزة', 'الخليل', 'نابلس', 'رام الله'], phoneCode: '+970' },
  { id: 'qa', name: { ar: 'قطر' }, flagCode: 'QA', currency: 'QAR', majorCities: ['الدوحة', 'الريان', 'الوكرة'], phoneCode: '+974' },
  { id: 'so', name: { ar: 'الصومال' }, flagCode: 'SO', currency: 'SOS', majorCities: ['مقديشو', 'هرجيسا'], phoneCode: '+252' },
  { id: 'sd', name: { ar: 'السودان' }, flagCode: 'SD', currency: 'SDG', majorCities: ['الخرطوم', 'أم درمان', 'بورتسودان'], phoneCode: '+249' },
  { id: 'sy', name: { ar: 'سوريا' }, flagCode: 'SY', currency: 'SYP', majorCities: ['دمشق', 'حلب', 'حمص', 'اللاذقية'], phoneCode: '+963' },
  { id: 'tn', name: { ar: 'تونس' }, flagCode: 'TN', currency: 'TND', majorCities: ['تونس', 'صفاقس', 'سوسة', 'القيروان'], phoneCode: '+216' },
  { id: 'ye', name: { ar: 'اليمن' }, flagCode: 'YE', currency: 'YER', majorCities: ['صنعاء', 'عدن', 'تعز', 'الحديدة'], phoneCode: '+967' },
];
