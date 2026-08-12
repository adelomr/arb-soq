import type { Category } from '@/lib/types';

export const DEFAULT_ORGANIZED_CATEGORIES: Category[] = [
  {
    id: 'vehicles',
    name: { ar: 'عربيات وقطع غيار' },
    icon: 'CarFront',
    subcategories: [
      { id: 'sub_v1', name: { ar: 'سيارات للبيع' }, icon: 'Car', parentId: 'vehicles' },
      { id: 'sub_v2', name: { ar: 'سيارات مطلوبة' }, icon: 'Car', parentId: 'vehicles' },
      { id: 'sub_v3', name: { ar: 'سيارات للإيجار' }, icon: 'Car', parentId: 'vehicles' },
      { id: 'sub_v4', name: { ar: 'كاوتش، بطاريات، زيوت، وكماليات' }, icon: 'Wrench', parentId: 'vehicles' },
    ],
  },
  {
    id: 'realestate',
    name: { ar: 'عقارات' },
    icon: 'Building2',
    subcategories: [
      { id: 'sub_r1', name: { ar: 'شقق للبيع' }, icon: 'Building', parentId: 'realestate' },
      { id: 'sub_r2', name: { ar: 'شقق للإيجار' }, icon: 'Building', parentId: 'realestate' },
      { id: 'sub_r3', name: { ar: 'فلل للبيع' }, icon: 'Home', parentId: 'realestate' },
      { id: 'sub_r4', name: { ar: 'فلل للإيجار' }, icon: 'Home', parentId: 'realestate' },
      { id: 'sub_r5', name: { ar: 'محلات للبيع وللإيجار' }, icon: 'Store', parentId: 'realestate' },
    ],
  },
  {
    id: 'mobiles',
    name: { ar: 'موبايلات وتابلت' },
    icon: 'Smartphone',
    subcategories: [
      { id: 'sub_m1', name: { ar: 'موبايلات' }, icon: 'Smartphone', parentId: 'mobiles' },
      { id: 'sub_m2', name: { ar: 'تابلت' }, icon: 'Tablet', parentId: 'mobiles' },
      { id: 'sub_m3', name: { ar: 'إكسسوارات موبايل وتابلت' }, icon: 'Headphones', parentId: 'mobiles' },
      { id: 'sub_m4', name: { ar: 'خطوط موبايل' }, icon: 'Smartphone', parentId: 'mobiles' },
    ],
  },
  {
    id: 'jobs',
    name: { ar: 'وظائف' },
    icon: 'Briefcase',
    subcategories: [
      { id: 'sub_j1', name: { ar: 'محاسبة وبنوك' }, icon: 'Briefcase', parentId: 'jobs' },
      { id: 'sub_j2', name: { ar: 'هندسة' }, icon: 'Briefcase', parentId: 'jobs' },
      { id: 'sub_j3', name: { ar: 'مصممون' }, icon: 'Briefcase', parentId: 'jobs' },
      { id: 'sub_j4', name: { ar: 'خدمة عملاء' }, icon: 'Briefcase', parentId: 'jobs' },
    ],
  },
  {
    id: 'furniture',
    name: { ar: 'أثاث المنزل والمكتب - ديكور' },
    icon: 'Sofa',
    subcategories: [
      { id: 'sub_f1', name: { ar: 'أثاث منزلي' }, icon: 'Sofa', parentId: 'furniture' },
      { id: 'sub_f2', name: { ar: 'أثاث مكتبي' }, icon: 'Sofa', parentId: 'furniture' },
      { id: 'sub_f3', name: { ar: 'ديكور المنزل وإكسسواراته' }, icon: 'Sofa', parentId: 'furniture' },
      { id: 'sub_f4', name: { ar: 'أدوات وإكسسوارات الحمام والمطبخ' }, icon: 'Sofa', parentId: 'furniture' },
    ],
  },
  {
    id: 'electronics',
    name: { ar: 'أجهزة إلكترونية' },
    icon: 'Tv',
    subcategories: [
      { id: 'sub_e1', name: { ar: 'شاشات وأجهزة صوت وفيديو' }, icon: 'Tv', parentId: 'electronics' },
      { id: 'sub_e2', name: { ar: 'كمبيوتر وإكسسواراته' }, icon: 'Laptop', parentId: 'electronics' },
      { id: 'sub_e3', name: { ar: 'ألعاب فيديو وأجهزة ألعاب' }, icon: 'Gamepad2', parentId: 'electronics' },
      { id: 'sub_e4', name: { ar: 'كاميرات وإكسسواراتها' }, icon: 'Camera', parentId: 'electronics' },
    ],
  },
  {
    id: 'fashion',
    name: { ar: 'الموضة والجمال' },
    icon: 'Sparkles',
    subcategories: [
      { id: 'sub_fa1', name: { ar: 'ملابس حريمي' }, icon: 'Shirt', parentId: 'fashion' },
      { id: 'sub_fa2', name: { ar: 'ملابس رجالي' }, icon: 'Shirt', parentId: 'fashion' },
      { id: 'sub_fa3', name: { ar: 'إكسسوارات - مستحضرات تجميل' }, icon: 'Sparkles', parentId: 'fashion' },
      { id: 'sub_fa4', name: { ar: 'ساعات ونظارات' }, icon: 'Watch', parentId: 'fashion' },
    ],
  },
  {
    id: 'pets',
    name: { ar: 'حيوانات أليفة - طيور - أسماك' },
    icon: 'Dog',
    subcategories: [
      { id: 'sub_p1', name: { ar: 'كلاب' }, icon: 'Dog', parentId: 'pets' },
      { id: 'sub_p2', name: { ar: 'قطط' }, icon: 'Cat', parentId: 'pets' },
      { id: 'sub_p3', name: { ar: 'طيور' }, icon: 'Bird', parentId: 'pets' },
      { id: 'sub_p4', name: { ar: 'أسماك الزينة' }, icon: 'Fish', parentId: 'pets' },
    ],
  },
  {
    id: 'baby',
    name: { ar: 'مستلزمات أطفال' },
    icon: 'Baby',
    subcategories: [
      { id: 'sub_b1', name: { ar: 'عناية - صحة الطفل والأم' }, icon: 'Baby', parentId: 'baby' },
      { id: 'sub_b2', name: { ar: 'ملابس رضع' }, icon: 'Baby', parentId: 'baby' },
      { id: 'sub_b3', name: { ar: 'ملابس أطفال' }, icon: 'Baby', parentId: 'baby' },
      { id: 'sub_b4', name: { ar: 'أدوات تغذية للطفل' }, icon: 'Baby', parentId: 'baby' },
    ],
  },
  {
    id: 'hobbies',
    name: { ar: 'هوايات وتسلية' },
    icon: 'Dumbbell',
    subcategories: [
      { id: 'sub_h1', name: { ar: 'تحف - مقتنيات' }, icon: 'Trophy', parentId: 'hobbies' },
      { id: 'sub_h2', name: { ar: 'دراجات' }, icon: 'Dumbbell', parentId: 'hobbies' },
      { id: 'sub_h3', name: { ar: 'كتب' }, icon: 'BookOpen', parentId: 'hobbies' },
      { id: 'sub_h4', name: { ar: 'ألعاب لوحية - ورقية' }, icon: 'Gamepad2', parentId: 'hobbies' },
    ],
  },
  {
    id: 'trade',
    name: { ar: 'تجارة وصناعة' },
    icon: 'Factory',
    subcategories: [
      { id: 'sub_t1', name: { ar: 'زراعة' }, icon: 'Factory', parentId: 'trade' },
      { id: 'sub_t2', name: { ar: 'أعمال بناء' }, icon: 'HardHat', parentId: 'trade' },
      { id: 'sub_t3', name: { ar: 'معدات صناعية' }, icon: 'Factory', parentId: 'trade' },
      { id: 'sub_t4', name: { ar: 'مستلزمات طبية' }, icon: 'PackageSearch', parentId: 'trade' },
    ],
  },
  {
    id: 'services',
    name: { ar: 'خدمات' },
    icon: 'Wrench',
    subcategories: [
      { id: 'sub_s1', name: { ar: 'خدمات شركات' }, icon: 'Handshake', parentId: 'services' },
      { id: 'sub_s2', name: { ar: 'سيارات' }, icon: 'Wrench', parentId: 'services' },
      { id: 'sub_s3', name: { ar: 'حفلات - مناسبات' }, icon: 'Sparkles', parentId: 'services' },
      { id: 'sub_s4', name: { ar: 'صحة وجمال' }, icon: 'Heart', parentId: 'services' },
    ],
  },
  {
    id: 'crafts',
    name: { ar: 'المهن والحرف' },
    icon: 'Wrench',
    subcategories: [
      { id: 'sub_c1', name: { ar: 'سباكة وصيانة سباكة' }, icon: 'Wrench', parentId: 'crafts' },
      { id: 'sub_c2', name: { ar: 'كهربائي منازل وتأسيس' }, icon: 'Wrench', parentId: 'crafts' },
      { id: 'sub_c3', name: { ar: 'نجارة وأثاث' }, icon: 'Wrench', parentId: 'crafts' },
      { id: 'sub_c4', name: { ar: 'نقاشة ودهانات' }, icon: 'Wrench', parentId: 'crafts' },
      { id: 'sub_c5', name: { ar: 'تكييف وتبريد' }, icon: 'Wrench', parentId: 'crafts' },
    ],
  },
  {
    id: 'transport',
    name: { ar: 'نقل وتوصيل' },
    icon: 'Truck',
    subcategories: [
      { id: 'sub_tr1', name: { ar: 'نقل عفش وأثاث' }, icon: 'Truck', parentId: 'transport' },
      { id: 'sub_tr2', name: { ar: 'توصيل طلبات وبضائع' }, icon: 'PackageSearch', parentId: 'transport' },
      { id: 'sub_tr3', name: { ar: 'نقل بضائع وشحن' }, icon: 'Truck', parentId: 'transport' },
      { id: 'sub_tr4', name: { ar: 'تأجير سيارات نقل وسائقين' }, icon: 'Car', parentId: 'transport' },
    ],
  },
];
