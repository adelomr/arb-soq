'use client';

import { useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface CategoryTickerProps {
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
}

export default function CategoryTicker({ selectedCategory, onSelect }: CategoryTickerProps) {
  const { categories } = useAuth();
  
  // Store the latest onSelect in a ref so the memoized JSX never holds a stale closure
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Comprehensive Emoji mapping - covers IDs (English + Arabic), Icon names, and keywords
  const emojiMap: Record<string, string> = {
    // === English IDs ===
    'all': '📁',
    'cars': '🚗', 'car': '🚗', 'vehicles': '🚗', 'auto': '🚗',
    'real-estate': '🏠', 'realestate': '🏠', 'housing': '🏠', 'property': '🏠',
    'electronics': '📱', 'electric': '⚡', 'tech': '💻',
    'phones': '📱', 'phone': '📱', 'mobile': '📱',
    'computers': '💻', 'computer': '💻', 'laptop': '💻',
    'furniture': '🛋️', 'furnishing': '🛋️',
    'fashion': '👕', 'clothes': '👕', 'clothing': '👕',
    'jobs': '💼', 'job': '💼', 'work': '💼', 'employment': '💼',
    'services': '🛠️', 'service': '🛠️',
    'food': '🍔', 'restaurant': '🍽️', 'cooking': '🍳',
    'animals': '🐕', 'animal': '🐕', 'pets': '🐾',
    'kids': '👶', 'baby': '👶', 'children': '👧',
    'sports': '⚽', 'sport': '⚽',
    'health': '🏥', 'medical': '🩺',
    'travel': '✈️',
    'education': '🎓',
    'agriculture': '🚜', 'farming': '🌾',
    'industry': '🏭', 'industrial': '🏭',
    'tools': '🔧', 'equipment': '🔩',
    'beauty': '💄', 'cosmetics': '💄',
    'books': '📚',
    'music': '🎵',
    'art': '🎨',
    'photography': '📷',
    'games': '🎮',
    'toys': '🧸',
    'garden': '🌿', 'plants': '🌱',
    'cleaning': '🧹',
    'solar': '☀️', 'energy': '⚡',
    'entertainment': '🎭', 'fun': '🎉', 'events': '🎪',
    
    // === Arabic IDs (common patterns) ===
    'سيارات': '🚗',
    'عقارات': '🏠',
    'الكترونيات': '📱', 'إلكترونيات': '📱',
    'هواتف': '📱',
    'اثاث': '🛋️', 'أثاث': '🛋️',
    'ملابس': '👕', 'موضه': '👕', 'أزياء': '👕',
    'وظائف': '💼',
    'خدمات': '🛠️',
    'طعام': '🍔', 'اطعمة': '🍔', 'أطعمة': '🍔', 'مطاعم': '🍽️',
    'حيوانات': '🐕',
    'اطفال': '👶', 'أطفال': '👶',
    'رياضة': '⚽',
    'صحة': '🏥',
    'سفر': '✈️',
    'تعليم': '🎓',
    'زراعة': '🚜',
    'صناعة': '🏭',
    'ادوات': '🔧', 'أدوات': '🔧',
    'تجميل': '💄',
    'كتب': '📚',
    'موسيقى': '🎵',
    'فن': '🎨',
    'تصوير': '📷',
    'العاب': '🎮', 'ألعاب': '🎮',
    'نباتات': '🌿',
    'حدائق': '🌿',
    'ترفيه': '🎭', 'ترفيهية': '🎭', 'ترفيهي': '🎭',
    'fishing': '🎣', 'صيد': '🎣', 'ادوات صيد': '🎣', 'أدوات صيد': '🎣',
    'فعاليات': '🎪', 'مناسبات': '🎉',
    'سينما': '🎬', 'افلام': '🎬', 'أفلام': '🎬',
    'مسرح': '🎭',
    
    // === Lucide Icon Names ===
    'Car': '🚗', 'CarFront': '🚗', 'Truck': '🚚', 'Bus': '🚌',
    'Home': '🏠', 'Building': '🏢', 'Building2': '🏗️',
    'Smartphone': '📱', 'Phone': '📞', 'Tablet': '⬜',
    'Laptop': '💻', 'Monitor': '🖥️', 'Tv': '📺',
    'Sofa': '🛋️',
    'Shirt': '👕', 'ShoppingBag': '🛍️',
    'Briefcase': '💼',
    'Wrench': '🔧', 'Hammer': '🔨', 'Handshake': '🤝',
    'Utensils': '🍴', 'Coffee': '☕', 'Pizza': '🍕',
    'PawPrint': '🐾',
    'Baby': '👶', 'Heart': '❤️',
    'GraduationCap': '🎓', 'BookOpen': '📖',
    'Stethoscope': '🩺', 'Pill': '💊',
    'Plane': '✈️', 'MapPin': '📍',
    'Trophy': '🏆', 'Dumbbell': '🏋️',
    'Tractor': '🚜', 'Leaf': '🌿',
    'HardHat': '⛑️', 'Factory': '🏭',
    'Camera': '📷',
    'Gamepad2': '🎮', 'Gamepad': '🎮',
    'Music': '🎵', 'Headphones': '🎧',
    'Paintbrush': '🎨',
    'Lightbulb': '💡',
    'Shapes': '🔷', 'PackageSearch': '📦',
  };

  const getEmoji = (category: any): string => {
    const id = (category.id || '').toLowerCase();
    const icon = category.icon || '';
    const nameAr = category.name?.ar || '';

    // 1. Match by ID (case-insensitive)
    if (emojiMap[category.id]) return emojiMap[category.id];
    if (emojiMap[id]) return emojiMap[id];

    // 2. Match by Lucide icon name
    if (icon && emojiMap[icon]) return emojiMap[icon];

    // 3. Match by Arabic name (keyword search)
    if (nameAr.includes('سيار') || nameAr.includes('مركبة')) return '🚗';
    if (nameAr.includes('عقار') || nameAr.includes('شقق') || nameAr.includes('منزل') || nameAr.includes('بيت') || nameAr.includes('فيلا') || nameAr.includes('أرض')) return '🏠';
    if (nameAr.includes('هاتف') || nameAr.includes('موبايل') || nameAr.includes('جوال')) return '📱';
    if (nameAr.includes('كمبيوتر') || nameAr.includes('لابتوب') || nameAr.includes('حاسب')) return '💻';
    if (nameAr.includes('أثاث') || nameAr.includes('اثاث') || nameAr.includes('طرابيز') || nameAr.includes('كنب')) return '🛋️';
    if (nameAr.includes('ملابس') || nameAr.includes('أزياء') || nameAr.includes('موضة') || nameAr.includes('قماش')) return '👕';
    if (nameAr.includes('وظيف') || nameAr.includes('عمل') || nameAr.includes('تشغيل') || nameAr.includes('فرصة')) return '💼';
    if (nameAr.includes('خدمة') || nameAr.includes('تصليح') || nameAr.includes('صيانة') || nameAr.includes('ورشة')) return '🛠️';
    if (nameAr.includes('طعام') || nameAr.includes('أكل') || nameAr.includes('مطعم') || nameAr.includes('وجبة')) return '🍔';
    if (nameAr.includes('حيوان') || nameAr.includes('طيور') || nameAr.includes('قطط') || nameAr.includes('كلاب')) return '🐾';
    if (nameAr.includes('أطفال') || nameAr.includes('طفل') || nameAr.includes('رضيع') || nameAr.includes('مدرسة')) return '👶';
    if (nameAr.includes('رياضة') || nameAr.includes('لياقة') || nameAr.includes('جيم') || nameAr.includes('كرة')) return '⚽';
    if (nameAr.includes('صحة') || nameAr.includes('طب') || nameAr.includes('دواء') || nameAr.includes('مستشفى')) return '🏥';
    if (nameAr.includes('سفر') || nameAr.includes('سياحة') || nameAr.includes('فندق') || nameAr.includes('رحلة')) return '✈️';
    if (nameAr.includes('تعليم') || nameAr.includes('دراسة') || nameAr.includes('كتاب') || nameAr.includes('جامعة')) return '🎓';
    if (nameAr.includes('زراعة') || nameAr.includes('مزرعة') || nameAr.includes('نبات')) return '🚜';
    if (nameAr.includes('صناعة') || nameAr.includes('مصنع') || nameAr.includes('ورشة')) return '🏭';
    if (nameAr.includes('تجميل') || nameAr.includes('عطر') || nameAr.includes('مكياج')) return '💄';
    if (nameAr.includes('كهرباء') || nameAr.includes('طاقة') || nameAr.includes('إلكتروني')) return '⚡';
    if (nameAr.includes('موسيقى') || nameAr.includes('أغاني')) return '🎵';
    if (nameAr.includes('تصوير') || nameAr.includes('كاميرا')) return '📷';
    if (nameAr.includes('العاب') || nameAr.includes('ألعاب') || nameAr.includes('لعبة')) return '🎮';

    // 4. Match by partial English ID
    if (id.includes('car') || id.includes('auto') || id.includes('vehicle')) return '🚗';
    if (id.includes('real') || id.includes('estate') || id.includes('hous') || id.includes('prop')) return '🏠';
    if (id.includes('electron') || id.includes('phone') || id.includes('mobile')) return '📱';
    if (id.includes('cloth') || id.includes('fashion') || id.includes('wear')) return '👕';
    if (id.includes('food') || id.includes('eat') || id.includes('restaurant')) return '🍔';
    if (id.includes('job') || id.includes('work') || id.includes('employ')) return '💼';
    if (id.includes('service') || id.includes('repair')) return '🛠️';
    if (id.includes('animal') || id.includes('pet')) return '🐾';
    if (id.includes('kid') || id.includes('child') || id.includes('baby')) return '👶';
    if (id.includes('sport') || id.includes('gym') || id.includes('fit')) return '⚽';
    if (id.includes('health') || id.includes('medical') || id.includes('doctor')) return '🏥';

    // Default
    return '🔷';
  };

  // Static ticker list - NO dependency on selectedCategory to prevent animation restart
  const staticCategoryList = useMemo(() => (
    <div className="flex gap-3 px-2">
      <div
        className="cursor-pointer flex flex-col items-center justify-center p-2 w-[72px] h-[88px] transition-all rounded-2xl border-2 whitespace-nowrap overflow-hidden relative group/card bg-secondary/80 border-border hover:border-primary/50 hover:bg-secondary backdrop-blur-xl"
        onClick={() => onSelectRef.current('all')}
      >
        <div className="text-3xl mb-1.5 transition-transform group-hover/card:scale-115 duration-300 select-none">📁</div>
        <span className="text-[9px] font-bold text-center leading-tight text-foreground/80 truncate w-full text-center font-black">الكل</span>
      </div>

      <div
        className="cursor-pointer flex flex-col items-center justify-center p-2 w-[72px] h-[88px] transition-all rounded-2xl border-2 whitespace-nowrap overflow-hidden relative group/card bg-secondary/80 border-border hover:border-primary/50 hover:bg-secondary backdrop-blur-xl"
        onClick={() => onSelectRef.current('entertainment')}
      >
        <div className="text-3xl mb-1.5 transition-transform group-hover/card:scale-115 duration-300 select-none">🎭</div>
        <span className="text-[9px] font-bold text-center leading-tight text-foreground/80 truncate w-full text-center font-black">ترفيه</span>
      </div>

      <div
        className="cursor-pointer flex flex-col items-center justify-center p-2 w-[72px] h-[88px] transition-all rounded-2xl border-2 whitespace-nowrap overflow-hidden relative group/card bg-secondary/80 border-border hover:border-primary/50 hover:bg-secondary backdrop-blur-xl"
        onClick={() => onSelectRef.current('education')}
      >
        <div className="text-3xl mb-1.5 transition-transform group-hover/card:scale-115 duration-300 select-none">🎓</div>
        <span className="text-[9px] font-bold text-center leading-tight text-foreground/80 truncate w-full text-center font-black">تعليم</span>
      </div>

      <div
        className="cursor-pointer flex flex-col items-center justify-center p-2 w-[72px] h-[88px] transition-all rounded-2xl border-2 whitespace-nowrap overflow-hidden relative group/card bg-secondary/80 border-border hover:border-primary/50 hover:bg-secondary backdrop-blur-xl"
        onClick={() => onSelectRef.current('fishing')}
      >
        <div className="text-3xl mb-1.5 transition-transform group-hover/card:scale-115 duration-300 select-none">🎣</div>
        <span className="text-[9px] font-bold text-center leading-tight text-foreground/80 truncate w-full text-center font-black">ادوات صيد</span>
      </div>
      
      {categories.filter(c => c.id !== 'stores' && c.id !== 'store-product').map((category) => {
        const emoji = getEmoji(category);
        return (
          <div
            key={category.id}
            className="cursor-pointer flex flex-col items-center justify-center p-2 w-[72px] h-[88px] transition-all rounded-2xl border-2 whitespace-nowrap overflow-hidden relative group/card bg-secondary/80 border-border hover:border-primary/50 hover:bg-secondary backdrop-blur-xl"
            onClick={() => onSelectRef.current(category.id)}
          >
            <div className="text-3xl mb-1.5 transition-transform group-hover/card:scale-115 duration-300 select-none">
              {emoji}
            </div>
            <span className="text-[9px] font-bold text-center leading-tight text-foreground/80 truncate w-full text-center font-black">
              {category.name?.ar || category.id}
            </span>
          </div>
        );
      })}
    </div>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [categories]); // Only re-render if categories list changes, NOT on selectedCategory change

  return (
    <div className="w-full mb-0">

      {/* Scrolling Ticker — static content, animation never restarts */}
      <div className="w-full h-28 flex items-center overflow-hidden relative group/ticker bg-transparent">
        <div className="flex w-max animate-ticker-infinite group-hover/ticker:pause-animation" dir="rtl">
          {staticCategoryList}
          {staticCategoryList}
          {staticCategoryList}
        </div>
      </div>

      <style>{`
        :root {
            --primary-rgb: 24, 105, 89;
        }

        .animate-ticker-infinite {
          animation: ticker-infinite 55s linear infinite;
          will-change: transform;
        }

        .pause-animation {
          animation-play-state: paused !important;
        }

        @keyframes ticker-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(33.33%); }
        }

        [dir="rtl"] .animate-ticker-infinite {
            animation: ticker-infinite-rtl 55s linear infinite;
            will-change: transform;
        }

        @keyframes ticker-infinite-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(100% / 3)); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
