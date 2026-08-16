

export type AdType = 'sell-item' | 'sell-service' | 'request-service' | 'video' | 'image';
export type AdStatus = 'pending' | 'active' | 'rejected' | 'sold';
export type AdCondition = 'new' | 'used';

export type SubCategory = {
  id: string;
  name: {
    ar: string;
  };
  parentId: string;
  icon: string; // Icon name as string
};

export type PortfolioImage = {
  id: string;
  url: string;
  path: string;
  name: string;
  size: number;
}

export type AdImageMeta = {
  url: string;
  path: string;
  name: string;
  size: number;
}


export type Ad = {
  id:string;
  userId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price?: number; 
  productCode?: string;
  location?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  imageUrls: string[];
  imageMeta?: AdImageMeta[];
  imageHints?: string[];
  isPromoted: boolean;
  views: number;
  clicks: number;
  callClicks?: number; // Number of clicks on call button
  whatsappClicks?: number; // Number of clicks on whatsapp button
  postedAt: string; // ISO 8601 string
  user?: UserProfile;
  adType: AdType;
  market: string; 
  status: AdStatus;
  condition?: AdCondition;
  store?: Store;
  // Android synchronization fields
  videoUrl?: string;
  categoryId?: string;
  country?: string;
  governorate?: string;
  city?: string;
  village?: string;
  showCommIcon?: boolean;
  websiteUrl?: string;
  isActive?: boolean; // Android compatibility
  timestamp?: number; // Android compatibility
  imageUrl?: string; // Android compatibility
  isPremium?: boolean; // Premium sponsored ad
  premiumExpiresAt?: number; // Expiration timestamp for premium status
  playlistUrl?: string; // YouTube playlist URL for video ads
  phoneNumber?: string; // Optional phone number for image/standard ads
  currency?: string; // ISO 4217 currency code e.g. EGP, SAR, USD
  rating?: number; // Rating average for the ad / seller
  reviewCount?: number; // Number of reviews
};

export type Category = {
  id: string;
  name: {
    ar: string;
  };
  icon: string; // Icon name as string
  subcategories?: SubCategory[];
};

export type Profession = {
    id: string;
    name: {
        ar: string;
    };
    hasSpecialization: boolean;
};

export type Specialization = {
    id: string;
    name: {
        ar: string;
    };
    professionId: string;
};

export type PricingPlan = {
  id: 'free' | 'premium' | 'gold';
  name: { ar: string };
  price: { en: string; ar: string };
  duration: { ar: string };
  features: {
    images: { text: { ar: string } };
    search: { available: boolean };
    highlight: { available: boolean };
    extend: { available: boolean };
  };
};

export type PricingStructure = {
  plans: {
    free: Omit<PricingPlan, 'id'>;
    premium: Omit<PricingPlan, 'id'>;
    gold: Omit<PricingPlan, 'id'>;
  }
}

export type Notification = {
    id: string;
    userId: string;
    message: string;
    type: 'general' | 'private';
    isRead: boolean;
    createdAt: any; // Firestore Timestamp
    link?: string;
}

export type Announcement = {
    id: string;
    isEnabled: boolean;
    message: {
        ar: string;
    };
    link?: string;
    linkText?: {
        ar: string;
    };
    backgroundColor?: string;
    textColor?: string;
    updatedAt: any; // Firestore Timestamp
}

export interface AdSenseSettings {
  adsEnabled: boolean;
  autoAdsEnabled: boolean;
}

export interface Store {
  id: string;
  storeName: string;
  storeDescription?: string;
  coverImageUrl?: string;
  ownerId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  phone?: string;
  phoneVerified?: boolean;
  verified?: boolean;
  fullName?: string;
  jobType?: string;
  country?: string;
  province?: string;
  governorate?: string;
  city?: string;
  village?: string;
  role: 'user' | 'admin';
  moderatedCategories?: string[];
  status: 'active' | 'suspended' | 'deleted';
  walletBalance: number;
  rating?: number;
  reviewCount?: number;
  store?: Store;
  profession?: string;
  specialization?: string;
  portfolioImages?: PortfolioImage[];
  createdAt?: any;
  lastForumPostAt?: any;
}

export type Review = {
    id: string;
    reviewerId: string;
    reviewerName: string;
    rating: number;
    text: string;
    createdAt: any; // Firestore Timestamp
    adId?: string;
};

export type SiteStats = {
    totalMembers: number;
    totalAds: number;
    totalVisits: number;
    totalStores: number;
};

export type PageType = 'system' | 'legal' | 'landing' | 'adpage';

export type LandingTheme = 'default' | 'greenery' | 'dark-luxury' | 'corporate-blue' | 'clear-cover';

export interface LandingFeature {
  title: string;
  desc: string;
  iconName?: string;
}

export interface LandingTestimonial {
  name: string;
  review: string;
  rating?: number;
}

export interface LandingFaq {
  question: string;
  answer: string;
}

export interface LandingSection {
  id: string;
  name: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
  };
  iconName: string;
  badgeColor?: string;
}

export const DEFAULT_LANDING_SECTIONS: LandingSection[] = [
  {
    id: 'furniture-moving',
    name: { ar: 'نقل وتغليف عفش', en: 'Furniture Moving' },
    description: { ar: 'خدمات نقل الأثاث، الفك والتركيب، والتغليف الاحترافي' },
    iconName: 'Truck',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    id: 'home-cleaning',
    name: { ar: 'تنظيف وصيانة منازل', en: 'Home Cleaning & Maintenance' },
    description: { ar: 'خدمات تنظيف الشقق، الفلل، غسيل السجاد، وصيانة المنازل' },
    iconName: 'Sparkles',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  {
    id: 'leak-detection',
    name: { ar: 'كشف تسربات وعزل', en: 'Leak Detection & Insulation' },
    description: { ar: 'كشف تسربات المياه بأحدث الأجهزة وعزل الاسطح والخزانات' },
    iconName: 'Droplets',
    badgeColor: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  },
  {
    id: 'contracting',
    name: { ar: 'مقاولات وتشطيبات', en: 'Contracting & Finishing' },
    description: { ar: 'أعمال البناء، الدهانات، الجبس بورد، والترميمات العامة' },
    iconName: 'Building',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  {
    id: 'pest-control',
    name: { ar: 'مكافحة حشرات ورش مبيدات', en: 'Pest Control' },
    description: { ar: 'إبادة النمل الأبيض، الصراصير، ورش المبيدات الآمنة' },
    iconName: 'Bug',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
  {
    id: 'hvac-appliances',
    name: { ar: 'تكييف وصيانة أجهزة', en: 'AC & Home Appliances' },
    description: { ar: 'تركيب وتنظيف وصيانة المكيفات والأجهزة الكهربائية' },
    iconName: 'Wind',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  {
    id: 'car-services',
    name: { ar: 'خدمات سيارات ونقل', en: 'Car Services' },
    description: { ar: 'خدمات السطحة، الصيانة السريعة، ونقل المركبات' },
    iconName: 'Car',
    badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
  {
    id: 'general-services',
    name: { ar: 'خدمات عامة واستشارات', en: 'General Services' },
    description: { ar: 'كافة الخدمات والحلول المنزلية والتجارية الأخرى' },
    iconName: 'Briefcase',
    badgeColor: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  },
];

export interface AdpageStore {
  id: string;
  name: string;
  logoText: string;
  subText?: string;
  active?: boolean;
}

export interface AdpageBrand {
  id: string;
  name: string;
}

export interface AdpageConditionFilter {
  id: string;
  name: string;
  value: string;
}

export interface PageData {
  id?: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  pageType?: PageType;   // 'system' | 'legal' | 'landing'
  shortCode?: string;    // رمز قصير للرابط /l/[shortCode] — لصفحات الهبوط فقط
  description?: string;  // وصف مختصر لصفحة الهبوط (للـ SEO والفوتر)
  createdAt?: any;
  updatedAt?: any;
  countdown?: number;
  views?: number;
  order?: number;          // ترتيب الصفحة في القائمة (للفرز اليدوي)
  // === حقول صفحات الهبوط الاحترافية ===
  landingCategory?: string;    // قسم صفحة الهبوط (مثال: furniture-moving, home-cleaning, etc.)
  coverImageUrl?: string;      // صورة الغلاف الكبيرة (Hero)
  logoUrl?: string;            // شعار الجهة أو المنتج
  subtitle?: string;           // العنوان الفرعي
  whatsappNumber?: string;     // رقم الواتساب (بدون +)
  whatsappMessage?: string;    // رسالة الواتساب الجاهزة
  phoneNumber?: string;        // رقم الاتصال المباشر
  theme?: LandingTheme;        // ثيم الصفحة البصري
  features?: LandingFeature[]; // مميزات الخدمة/المنتج
  gallery?: string[];          // معرض الصور
  testimonials?: LandingTestimonial[]; // آراء العملاء
  faqs?: LandingFaq[];         // الأسئلة الشائعة
  locationEmbed?: string;      // رابط خرائط جوجل المضمّن
  serviceName?: string;        // اسم الخدمة (لصفحات الهبوط)
  serviceArea?: string;        // المنطقة/الحي (لصفحات الهبوط)
  legacySlug?: string;         // الروابط القديمة لعمل redirect 301
  // === حقول الصفحات الإعلانية (adpage) ===
  adpageCategoryId?: string;      // معرف الفئة الرئيسية (مثال: vehicles, realestate)
  adpageSubcategoryId?: string;   // معرف الفئة الفرعية (مثال: sub_v1)
  adpageQuery?: string;           // نص البحث الاختياري
  adpageDescription?: string;     // وصف الصفحة الإعلانية للـ SEO
  adpageCoverImage?: string;      // صورة غلاف الصفحة الإعلانية
  adpageSubtitle?: string;        // العنوان الفرعي للصفحة الإعلانية
  adpageButtonText?: string;      // نص زر التوجيه
  adpageMode?: 'redirect' | 'showcase'; // وضع التوجيه والمشاهدة: تحويل مباشر أم عرض صفحة مخصصة
  adpageStores?: AdpageStore[];   // الشركات والمعارض المميزة المخصصة
  adpageBrands?: AdpageBrand[];   // ماركات السيارات والفلاتر السريعة المخصصة
  adpageConditionFilters?: AdpageConditionFilter[]; // أزرار الفلترة المخصصة لكل فئة (جديد، مستعمل، تمليك، إلخ)
}

// === أنواع سجل الإعلان والنشاطات (Ad Activity Log & Stats) ===
export type AdActivityEventType = 'view' | 'call' | 'whatsapp' | 'share';
export type AdTimeframe = '24h' | '7d' | '30d' | 'all';

export interface AdActivityEvent {
  id?: string;
  adId: string;
  userId?: string;
  type: AdActivityEventType;
  timestamp: string; // ISO 8601 string
  device?: 'mobile' | 'desktop' | 'tablet';
  dateStr?: string; // YYYY-MM-DD
}

export interface AdActivityDailyPoint {
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g. 'السبت 15 أغسطس'
  views: number;
  callClicks: number;
  whatsappClicks: number;
  total: number;
}

export interface AdActivityStats {
  adId: string;
  timeframe: AdTimeframe;
  views: number;
  callClicks: number;
  whatsappClicks: number;
  totalInteractions: number;
  interactionRate: number; // percentage (e.g. 4.5%)
  dailyBreakdown: AdActivityDailyPoint[];
  recentEvents: AdActivityEvent[];
  lastUpdated: string;
}
