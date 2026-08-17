export type AdType = 'adsense' | 'custom_banner' | 'advertise_cta';

export interface AdPlacement {
  id: string;
  slot_key: string;
  slot_title: string;
  description?: string;
  ad_type: AdType;
  adsense_code?: string;
  banner_image_url?: string;
  banner_target_url?: string;
  open_in_new_tab: boolean;
  is_active: boolean;
  expiry_date?: string | null;
  impressions_count: number;
  clicks_count: number;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_AD_PLACEMENTS: Omit<AdPlacement, 'id' | 'impressions_count' | 'clicks_count'>[] = [
  {
    slot_key: 'home_top_main_banner',
    slot_title: 'البنر الرئيسي للموقع (أعلى / قبل أحدث الإعلانات)',
    description: 'يظهر كبنر رئيسي بارز في الصفحة الرئيسية أعلى وقبل قائمة أحدث الإعلانات',
    ad_type: 'advertise_cta',
    adsense_code: '',
    banner_image_url: '',
    banner_target_url: '',
    open_in_new_tab: true,
    is_active: true,
  },
  {
    slot_key: 'home_between_sections',
    slot_title: 'بنر الصفحة الرئيسية بين الأقسام',
    description: 'يظهر في الصفحة الرئيسية بين الأقسام المميزة وقوائم الإعلانات',
    ad_type: 'adsense',
    adsense_code: '',
    banner_image_url: '',
    banner_target_url: '',
    open_in_new_tab: true,
    is_active: true,
  },
  {
    slot_key: 'category_header_banner',
    slot_title: 'بنر أعلى صفحة القسم / الفئات',
    description: 'يظهر في أعلى صفحات الأقسام والبحث فوق شبكة الإعلانات',
    ad_type: 'adsense',
    adsense_code: '',
    banner_image_url: '',
    banner_target_url: '',
    open_in_new_tab: true,
    is_active: true,
  },
  {
    slot_key: 'category_in_feed_ad',
    slot_title: 'إعلان مدمج وسط قوائم الإعلانات (In-Feed)',
    description: 'يظهر مدمجاً بشكل متناسق بعد كل 6 إلى 8 إعلانات في التصفح',
    ad_type: 'adsense',
    adsense_code: '',
    banner_image_url: '',
    banner_target_url: '',
    open_in_new_tab: true,
    is_active: true,
  },
  {
    slot_key: 'single_post_below_desc',
    slot_title: 'بنر أسفل تفاصيل ووصف الإعلان الفردي',
    description: 'يظهر داخل صفحة تفاصيل الإعلان مباشرة تحت صندوق الوصف',
    ad_type: 'adsense',
    adsense_code: '',
    banner_image_url: '',
    banner_target_url: '',
    open_in_new_tab: true,
    is_active: true,
  },
  {
    slot_key: 'single_post_sidebar',
    slot_title: 'بنر الشريط الجانبي في صفحة الإعلان',
    description: 'يظهر في العمود الجانبي أسفل كارت بيانات المعلن وأزرار التواصل',
    ad_type: 'adsense',
    adsense_code: '',
    banner_image_url: '',
    banner_target_url: '',
    open_in_new_tab: true,
    is_active: true,
  },
];
