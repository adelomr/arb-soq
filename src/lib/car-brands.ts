/**
 * قائمة ماركات السيارات والمركبات الموحدة لسوق العرب
 * تشمل الماركات الأكثر شهرة والماركات العالمية والخدمات الملحقة
 */

export interface CarBrandItem {
  id: string;
  name: string;
  nameEn: string;
  isPopular?: boolean;
  category?: 'cars' | 'trucks' | 'motorcycles' | 'parts';
}

export const POPULAR_CAR_BRANDS: CarBrandItem[] = [
  { id: 'toyota', name: 'تويوتا', nameEn: 'Toyota', isPopular: true, category: 'cars' },
  { id: 'hyundai', name: 'هيونداي', nameEn: 'Hyundai', isPopular: true, category: 'cars' },
  { id: 'nissan', name: 'نيسان', nameEn: 'Nissan', isPopular: true, category: 'cars' },
  { id: 'ford', name: 'فورد', nameEn: 'Ford', isPopular: true, category: 'cars' },
  { id: 'kia', name: 'كيا', nameEn: 'Kia', isPopular: true, category: 'cars' },
  { id: 'chevrolet', name: 'شيفروليه', nameEn: 'Chevrolet', isPopular: true, category: 'cars' },
  { id: 'lexus', name: 'لكزس', nameEn: 'Lexus', isPopular: true, category: 'cars' },
  { id: 'mercedes', name: 'مرسيدس', nameEn: 'Mercedes-Benz', isPopular: true, category: 'cars' },
  { id: 'gmc', name: 'جي ام سي', nameEn: 'GMC', isPopular: true, category: 'cars' },
  { id: 'bmw', name: 'بي ام دبليو', nameEn: 'BMW', isPopular: true, category: 'cars' },
  { id: 'honda', name: 'هوندا', nameEn: 'Honda', isPopular: true, category: 'cars' },
  { id: 'isuzu', name: 'ايسوزو', nameEn: 'Isuzu', isPopular: true, category: 'cars' },
  { id: 'dodge', name: 'دودج', nameEn: 'Dodge', isPopular: true, category: 'cars' },
  { id: 'mazda', name: 'مازدا', nameEn: 'Mazda', isPopular: true, category: 'cars' },
  { id: 'changan', name: 'شانجان', nameEn: 'Changan', isPopular: true, category: 'cars' },
  { id: 'mitsubishi', name: 'ميتسوبيشي', nameEn: 'Mitsubishi', isPopular: true, category: 'cars' },
  { id: 'land-rover', name: 'لاند روفر', nameEn: 'Land Rover', isPopular: true, category: 'cars' },
  { id: 'jetour', name: 'جيتور', nameEn: 'Jetour', isPopular: true, category: 'cars' },
  { id: 'geely', name: 'جيلي', nameEn: 'Geely', isPopular: true, category: 'cars' },
  { id: 'jeep', name: 'جيب', nameEn: 'Jeep', isPopular: true, category: 'cars' },
  { id: 'mg', name: 'MG', nameEn: 'MG', isPopular: true, category: 'cars' },
  { id: 'suzuki', name: 'سوزوكي', nameEn: 'Suzuki', isPopular: true, category: 'cars' },
  { id: 'haval', name: 'هافال', nameEn: 'Haval', isPopular: true, category: 'cars' },
  { id: 'genesis', name: 'جنسس', nameEn: 'Genesis', isPopular: true, category: 'cars' },
  { id: 'audi', name: 'اودي', nameEn: 'Audi', isPopular: true, category: 'cars' },
  { id: 'chery', name: 'شيري', nameEn: 'Chery', isPopular: true, category: 'cars' },
  { id: 'porsche', name: 'بورش', nameEn: 'Porsche', isPopular: true, category: 'cars' },
  { id: 'chrysler', name: 'كرايزلر', nameEn: 'Chrysler', isPopular: true, category: 'cars' },
  { id: 'cadillac', name: 'كاديلاك', nameEn: 'Cadillac', isPopular: true, category: 'cars' },
  { id: 'gac', name: 'جي ايه سي GAC', nameEn: 'GAC', isPopular: true, category: 'cars' },
  { id: 'peugeot', name: 'بيجو', nameEn: 'Peugeot', isPopular: true, category: 'cars' },
  { id: 'volkswagen', name: 'فولكس واجن', nameEn: 'Volkswagen', isPopular: true, category: 'cars' },
  { id: 'faw', name: 'فاو FAW', nameEn: 'FAW', isPopular: true, category: 'cars' },
  { id: 'lincoln', name: 'لنكولن', nameEn: 'Lincoln', isPopular: true, category: 'cars' },
  { id: 'daihatsu', name: 'دايهاتسو', nameEn: 'Daihatsu', isPopular: true, category: 'cars' },
  { id: 'infiniti', name: 'انفنيتي', nameEn: 'Infiniti', isPopular: true, category: 'cars' },
  { id: 'great-wall', name: 'جريت وول Great Wall', nameEn: 'Great Wall', isPopular: true, category: 'cars' },
  { id: 'byd', name: 'BYD', nameEn: 'BYD', isPopular: true, category: 'cars' },
  { id: 'jac', name: 'جاك JAC', nameEn: 'JAC', isPopular: true, category: 'cars' },
  { id: 'fiat', name: 'فيات', nameEn: 'Fiat', isPopular: true, category: 'cars' },
  { id: 'dongfeng', name: 'دونج فينج', nameEn: 'Dongfeng', isPopular: true, category: 'cars' },
  { id: 'bentley', name: 'بنتلي', nameEn: 'Bentley', isPopular: true, category: 'cars' },
  { id: 'tank', name: 'تانك', nameEn: 'Tank', isPopular: true, category: 'cars' },
  { id: 'foton', name: 'فوتون', nameEn: 'Foton', isPopular: true, category: 'cars' },
  { id: 'rolls-royce', name: 'رولز رويس', nameEn: 'Rolls Royce', isPopular: true, category: 'cars' },
  { id: 'jaguar', name: 'جاكوار', nameEn: 'Jaguar', isPopular: true, category: 'cars' },
  { id: 'baic', name: 'بايك', nameEn: 'BAIC', isPopular: true, category: 'cars' },
  { id: 'maserati', name: 'مازيراتي', nameEn: 'Maserati', isPopular: true, category: 'cars' },
  { id: 'hummer', name: 'همر', nameEn: 'Hummer', isPopular: true, category: 'cars' },
  { id: 'jmc', name: 'جى ام سي JMC', nameEn: 'JMC', isPopular: true, category: 'cars' },
  { id: 'volvo', name: 'فولفو', nameEn: 'Volvo', isPopular: true, category: 'cars' },
  { id: 'maxus', name: 'ماكسيس', nameEn: 'Maxus', isPopular: true, category: 'cars' },
  { id: 'saab', name: 'ساب', nameEn: 'Saab', isPopular: false, category: 'cars' },
  { id: 'tata', name: 'تاتا', nameEn: 'Tata', isPopular: false, category: 'cars' },
  { id: 'subaru', name: 'سوبارو', nameEn: 'Subaru', isPopular: true, category: 'cars' },
  { id: 'lamborghini', name: 'لامبورجيني', nameEn: 'Lamborghini', isPopular: false, category: 'cars' },
  { id: 'lucid', name: 'لوسيد', nameEn: 'Lucid', isPopular: false, category: 'cars' },
  { id: 'buick', name: 'بويك', nameEn: 'Buick', isPopular: false, category: 'cars' },
  { id: 'hongqi', name: 'هونشي', nameEn: 'Hongqi', isPopular: false, category: 'cars' },
  { id: 'jaecoo', name: 'جايكو', nameEn: 'Jaecoo', isPopular: false, category: 'cars' },
  { id: 'smart', name: 'سمارت', nameEn: 'Smart', isPopular: false, category: 'cars' },
  { id: 'ssangyong', name: 'سانج يونج', nameEn: 'SsangYong', isPopular: false, category: 'cars' },
  { id: 'skoda', name: 'سكودا', nameEn: 'Skoda', isPopular: true, category: 'cars' },
  { id: 'lynk-co', name: 'لينك اند كو', nameEn: 'Lynk & Co', isPopular: false, category: 'cars' },
  { id: 'ferrari', name: 'فيراري', nameEn: 'Ferrari', isPopular: false, category: 'cars' },
  { id: 'rox', name: 'روكس', nameEn: 'Rox', isPopular: false, category: 'cars' },
  { id: 'aston-martin', name: 'استون مارتن', nameEn: 'Aston Martin', isPopular: false, category: 'cars' },
  { id: 'seat', name: 'سيات', nameEn: 'Seat', isPopular: false, category: 'cars' },
  { id: 'lifan', name: 'ليفان', nameEn: 'Lifan', isPopular: false, category: 'cars' },
  { id: 'zxauto', name: 'ZXAUTO', nameEn: 'ZXAUTO', isPopular: false, category: 'cars' },
  { id: 'citroen', name: 'سيتروين', nameEn: 'Citroen', isPopular: false, category: 'cars' },
  { id: 'mercury', name: 'ميركوري', nameEn: 'Mercury', isPopular: false, category: 'cars' },
  { id: 'victory-auto', name: 'فيكتوري اوتو', nameEn: 'Victory Auto', isPopular: false, category: 'cars' },
  { id: 'exeed', name: 'اكسيد', nameEn: 'Exeed', isPopular: false, category: 'cars' },
  { id: 'cmc', name: 'سي ام سي', nameEn: 'CMC', isPopular: false, category: 'cars' },
  { id: 'alfa-romeo', name: 'الفا روميو', nameEn: 'Alfa Romeo', isPopular: false, category: 'cars' },
  { id: 'tesla', name: 'تسلا', nameEn: 'Tesla', isPopular: true, category: 'cars' },
  { id: 'soueast', name: 'ساوايست', nameEn: 'Soueast', isPopular: false, category: 'cars' },
  { id: 'mahindra', name: 'ماهيندرا', nameEn: 'Mahindra', isPopular: false, category: 'cars' },
  { id: 'renault', name: 'رينو', nameEn: 'Renault', isPopular: true, category: 'cars' },
  { id: 'mclaren', name: 'ماكلارين', nameEn: 'McLaren', isPopular: false, category: 'cars' },
  { id: 'huanghai', name: 'هانجاي', nameEn: 'Huanghai', isPopular: false, category: 'cars' },
  { id: 'zotye', name: 'زوتي', nameEn: 'Zotye', isPopular: false, category: 'cars' },
  { id: 'omoda', name: 'امودا', nameEn: 'Omoda', isPopular: false, category: 'cars' },
  { id: 'opel', name: 'اوبل', nameEn: 'Opel', isPopular: false, category: 'cars' },
  { id: 'lotus', name: 'لوتس', nameEn: 'Lotus', isPopular: false, category: 'cars' },
  { id: 'ineos', name: 'اينيوس', nameEn: 'Ineos', isPopular: false, category: 'cars' },
  { id: 'daewoo', name: 'دايو', nameEn: 'Daewoo', isPopular: false, category: 'cars' },
  { id: 'kaiyi', name: 'كايي', nameEn: 'Kaiyi', isPopular: false, category: 'cars' },
  { id: 'proton', name: 'بروتون', nameEn: 'Proton', isPopular: false, category: 'cars' },
  // أقسام ومعدات أخرى
  { id: 'parts', name: 'قطع غيار وملحقات', nameEn: 'Spare Parts & Accessories', isPopular: true, category: 'parts' },
  { id: 'trucks', name: 'شاحنات ومعدات ثقيلة', nameEn: 'Trucks & Heavy Equipment', isPopular: true, category: 'trucks' },
  { id: 'motorcycles', name: 'دبابات', nameEn: 'Motorcycles & Quads', isPopular: true, category: 'motorcycles' },
];

/**
 * فحص ما إذا كانت الفئة المدخلة تنتمي لفئة السيارات والمركبات
 */
export function isVehicleCategory(categoryId?: string, categoryName?: string): boolean {
  if (!categoryId && !categoryName) return false;
  const id = (categoryId || '').toLowerCase().trim();
  const name = (categoryName || '').toLowerCase().trim();

  const vehicleKeywords = ['vehicle', 'car', 'auto', 'سيار', 'مركب', 'عربيا', 'موتور', 'دباب', 'شاحن'];
  return vehicleKeywords.some(k => id.includes(k) || name.includes(k));
}

/**
 * مطابقة إعلان مع ماركة سيارة معينة (سواء عبر حقل brand المخزن أو البحث في العنوان والوصف)
 */
export function matchAdToBrand(ad: { brand?: string; title?: string; description?: string; subcategory?: string }, brandNameOrId: string): boolean {
  if (!brandNameOrId || brandNameOrId === 'الكل' || brandNameOrId === 'all' || brandNameOrId === 'b_all') return true;

  const target = brandNameOrId.toLowerCase().trim();
  
  // 1. إذا كان الإعلان يحتوي على حقل الماركة المخزن
  if (ad.brand) {
    const adBrand = ad.brand.toLowerCase().trim();
    if (adBrand === target) return true;
    const foundItem = POPULAR_CAR_BRANDS.find(b => b.id === target || b.name.toLowerCase() === target || b.nameEn.toLowerCase() === target);
    if (foundItem) {
      if (adBrand === foundItem.id.toLowerCase() || adBrand === foundItem.name.toLowerCase() || adBrand === foundItem.nameEn.toLowerCase()) {
        return true;
      }
    }
  }

  // 2. الفحص في الماركات المعروفة
  const brandObj = POPULAR_CAR_BRANDS.find(b => b.id === target || b.name.toLowerCase() === target || b.nameEn.toLowerCase() === target);
  const searchTerms = brandObj ? [brandObj.name.toLowerCase(), brandObj.nameEn.toLowerCase(), brandObj.id.toLowerCase()] : [target];

  const title = (ad.title || '').toLowerCase();
  const desc = (ad.description || '').toLowerCase();
  const sub = (ad.subcategory || '').toLowerCase();

  for (const term of searchTerms) {
    if (term.length < 2) continue;
    if (title.includes(term) || sub.includes(term) || desc.includes(term)) {
      return true;
    }
  }

  return false;
}
