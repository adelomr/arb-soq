'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Megaphone, ArrowLeft, Sparkles, Star } from 'lucide-react';
import { appIconUrl } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';

const translations = {
  ar: {
    advertiseHere: 'أعلن هنا',
    price: 'مقابل 50 ريال فقط',
    cta: 'تواصل معنا',
    badge: 'إعلان مميز',
    reach: 'آلاف الزوار يومياً',
  },
  en: {
    advertiseHere: 'Advertise Here',
    price: 'For only 50 SAR',
    cta: 'Contact Us',
    badge: 'Featured Ad',
    reach: 'Thousands of daily visitors',
  },
};

const WHATSAPP_URL = 'https://wa.me/201127556848?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A5%D8%B9%D9%84%D8%A7%D9%86%20%D9%81%D9%8A%20%D8%B3%D9%88%D9%82%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8';

interface AdvertiseBannerProps {
  href?: string;
  className?: string;
}

export default function AdvertiseBanner({
  href = WHATSAPP_URL,
  className = '',
}: AdvertiseBannerProps) {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block w-full ${className}`}
      aria-label={t.advertiseHere}
    >
      {/* ===== الحاوية الرئيسية ===== */}
      <div
        className="
          relative w-full overflow-hidden rounded-2xl
          bg-gradient-to-r from-[hsl(190,55%,18%)] via-[hsl(190,45%,26%)] to-[hsl(186,61%,22%)]
          border border-white/10
          shadow-[0_4px_24px_rgba(0,0,0,0.25)]
          hover:shadow-[0_8px_32px_rgba(0,180,180,0.25)]
          transition-all duration-500
          p-[2px]
        "
      >
        {/* حدود متوهجة */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-400/20 via-transparent to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* الجسم الداخلي */}
        <div className="relative flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 sm:py-4 rounded-[calc(1rem-2px)] bg-gradient-to-r from-[hsl(190,55%,16%)] to-[hsl(186,55%,20%)] overflow-hidden">

          {/* نجوم متحركة في الخلفية */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 left-[15%] w-1 h-1 rounded-full bg-teal-300/40 animate-pulse" />
            <div className="absolute top-4 left-[45%] w-1.5 h-1.5 rounded-full bg-yellow-300/30 animate-pulse [animation-delay:0.4s]" />
            <div className="absolute bottom-2 left-[70%] w-1 h-1 rounded-full bg-teal-200/40 animate-pulse [animation-delay:0.8s]" />
            <div className="absolute top-1 left-[82%] w-1 h-1 rounded-full bg-white/20 animate-pulse [animation-delay:1.2s]" />
            <div className="absolute bottom-1 left-[28%] w-0.5 h-0.5 rounded-full bg-teal-300/50 animate-pulse [animation-delay:0.6s]" />
          </div>

          {/* ===== الأيقونة ===== */}
          <div className="relative flex-shrink-0">
            <div className="
              relative w-14 h-14 sm:w-16 sm:h-16
              rounded-xl overflow-hidden
              ring-2 ring-teal-400/40 ring-offset-2 ring-offset-transparent
              group-hover:ring-teal-300/70
              transition-all duration-300
              group-hover:scale-105
              shadow-[0_4px_12px_rgba(0,0,0,0.4)]
            ">
              <Image
                src={appIconUrl}
                alt="سوق العرب"
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            {/* شارة Sparkles */}
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Sparkles className="w-3 h-3 text-yellow-900" />
            </div>
          </div>

          {/* ===== النصوص ===== */}
          <div className="flex-1 min-w-0">
            {/* شارة إعلان مميز */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-[10px] font-bold tracking-wide">
                <Star className="w-2.5 h-2.5 fill-yellow-300" />
                {t.badge}
              </span>
            </div>

            <h3 className="text-white font-black text-base sm:text-lg leading-tight">
              {t.advertiseHere}
              <span className="mr-1.5 text-teal-300 font-black">{t.price}</span>
            </h3>

            <p className="text-teal-200/70 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
              <Megaphone className="w-3 h-3 text-teal-300 flex-shrink-0" />
              {t.reach}
            </p>
          </div>

          {/* ===== زر CTA ===== */}
          <div className="flex-shrink-0">
            <div className="
              flex items-center gap-1.5
              px-3 sm:px-4 py-2 sm:py-2.5
              rounded-xl
              bg-gradient-to-br from-teal-400 to-teal-600
              text-white font-bold text-xs sm:text-sm
              shadow-[0_4px_12px_rgba(0,180,160,0.4)]
              group-hover:from-teal-300 group-hover:to-teal-500
              group-hover:shadow-[0_6px_20px_rgba(0,200,180,0.5)]
              group-hover:scale-105
              transition-all duration-300
              whitespace-nowrap
            ">
              {t.cta}
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
