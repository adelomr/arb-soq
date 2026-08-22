'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, type Dispatch, type SetStateAction } from 'react';
import { useSwipe } from '@/hooks/useSwipe';
import type { PageData, LandingTheme } from '@/lib/types';
import { formatWhatsAppNumber } from '@/lib/utils';
import ContentWrapper from '@/components/ContentWrapper';
import { Phone, MessageCircle, Star, ChevronDown, ChevronUp, MapPin, Check, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// prettier-ignore — Tailwind JIT safelist: all dynamic dark: classes used in THEMES object
// dark:from-slate-950 dark:to-emerald-950/20 dark:to-blue-950/20 dark:to-teal-950/20 dark:to-violet-950/20
// dark:bg-slate-900 dark:border-emerald-900/40 dark:border-blue-900/40 dark:border-teal-900/40 dark:border-violet-900/40
// dark:bg-emerald-900/40 dark:text-emerald-400 dark:bg-blue-900/40 dark:text-blue-400
// dark:bg-teal-900/40 dark:text-teal-400 dark:bg-violet-900/40 dark:text-violet-400

interface Props {
  page: PageData;
}

// ======= Theme config =======
type ThemeConfig = {
  heroBg: string;
  heroOverlay: string;
  accent: string;
  accentText: string;
  accentLight: string;
  sectionBg: string;
  cardBg: string;
  badge: string;
  badgeText: string;
  divider: string;
  waBtn: string;
  callBtn: string;
  featureIcon: string;
};

const THEMES: Record<LandingTheme, ThemeConfig> = {
  greenery: {
    heroBg: 'from-emerald-950 via-green-900 to-teal-900',
    heroOverlay: 'from-emerald-950/80 via-green-900/60 to-transparent',
    accent: 'bg-emerald-500',
    accentText: 'text-emerald-500',
    accentLight: 'bg-emerald-500/10',
    sectionBg: 'bg-background',
    cardBg: 'bg-card border border-border',
    badge: 'bg-emerald-500',
    badgeText: 'text-white',
    divider: 'bg-emerald-500',
    waBtn: 'bg-green-500 hover:bg-green-600',
    callBtn: 'bg-emerald-700 hover:bg-emerald-800',
    featureIcon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  },
  'dark-luxury': {
    heroBg: 'from-slate-950 via-zinc-900 to-neutral-950',
    heroOverlay: 'from-black/85 via-black/50 to-transparent',
    accent: 'bg-amber-400',
    accentText: 'text-amber-400',
    accentLight: 'bg-amber-400/10',
    sectionBg: 'bg-background',
    cardBg: 'bg-card border border-border',
    badge: 'bg-amber-400',
    badgeText: 'text-black',
    divider: 'bg-amber-400',
    waBtn: 'bg-green-500 hover:bg-green-600',
    callBtn: 'bg-amber-500 hover:bg-amber-600',
    featureIcon: 'bg-amber-400/10 text-amber-400',
  },
  'corporate-blue': {
    heroBg: 'from-blue-950 via-indigo-900 to-sky-900',
    heroOverlay: 'from-blue-950/85 via-indigo-900/60 to-transparent',
    accent: 'bg-blue-500',
    accentText: 'text-blue-500',
    accentLight: 'bg-blue-500/10',
    sectionBg: 'bg-background',
    cardBg: 'bg-card border border-border',
    badge: 'bg-blue-600',
    badgeText: 'text-white',
    divider: 'bg-blue-500',
    waBtn: 'bg-green-500 hover:bg-green-600',
    callBtn: 'bg-blue-700 hover:bg-blue-800',
    featureIcon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  },
  default: {
    heroBg: 'from-teal-950 via-teal-900 to-cyan-950',
    heroOverlay: 'from-teal-950/80 via-teal-900/60 to-transparent',
    accent: 'bg-teal-600',
    accentText: 'text-teal-600',
    accentLight: 'bg-teal-600/10',
    sectionBg: 'bg-background',
    cardBg: 'bg-card border border-border',
    badge: 'bg-teal-600',
    badgeText: 'text-white',
    divider: 'bg-teal-600',
    waBtn: 'bg-green-500 hover:bg-green-600',
    callBtn: 'bg-teal-700 hover:bg-teal-800',
    featureIcon: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
  },
  'clear-cover': {
    heroBg: 'from-slate-900 via-slate-800 to-slate-950',
    heroOverlay: 'from-black/60 via-black/20 to-transparent',
    accent: 'bg-slate-800 dark:bg-slate-200',
    accentText: 'text-slate-800 dark:text-slate-200',
    accentLight: 'bg-slate-800/10 dark:bg-slate-200/10',
    sectionBg: 'bg-background',
    cardBg: 'bg-card border border-border',
    badge: 'bg-slate-800 dark:bg-slate-200',
    badgeText: 'text-white dark:text-black',
    divider: 'bg-slate-800 dark:bg-slate-200',
    waBtn: 'bg-green-500 hover:bg-green-600',
    callBtn: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 dark:text-black',
    featureIcon: 'bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200',
  },
};

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
      ))}
    </div>
  );
}

export default function LandingPageClient({ page }: Props) {
  const theme = THEMES[page.theme ?? 'default'];
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [navVisible, setNavVisible] = useState(false);

  // إظهار شريط التنقل عند التمرير لأسفل بعد قسم HERO
  React.useEffect(() => {
    const handleScroll = () => {
      // نظهر الشريط بعد مرور 50px من أعلى الصفحة
      setNavVisible(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCleanWaLink = (num: string, msg?: string) => {
    return `https://wa.me/${formatWhatsAppNumber(num)}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
  };

  const waLink = page.whatsappNumber ? getCleanWaLink(page.whatsappNumber, page.whatsappMessage) : null;
  const callLink = page.phoneNumber ? `tel:${page.phoneNumber.replace(/\s+/g, '')}` : null;

  const hasCta = waLink || callLink;

  // التنقل السلس بين أقسام صفحة الهبوط مع مراعاة ارتفاع الشريط الثابت
  const handleSectionNav = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    const targetId = href.slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;
    const stickyNavHeight = 56; // ارتفاع الشريط الثابت تقريباً (py-2.5 + الأزرار)
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - stickyNavHeight - 8;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  };

  // 1. FAQ Schema (JSON-LD)
  const faqSchema = page.faqs && page.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": page.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  // 2. Service / LocalBusiness Schema (JSON-LD)
  const hasServiceInfo = page.serviceName || page.serviceArea;
  const serviceSchema = hasServiceInfo ? {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": page.serviceName || page.title,
    "provider": {
      "@type": "LocalBusiness",
      "name": page.title,
      "image": page.coverImageUrl || page.logoUrl || undefined,
      "telephone": page.phoneNumber || page.whatsappNumber || undefined,
      "url": `https://www.arb-soq.com/p/${page.slug}`
    },
    "areaServed": page.serviceArea ? {
      "@type": "AdministrativeArea",
      "name": page.serviceArea
    } : undefined,
    "description": page.description || page.subtitle || undefined
  } : null;

  return (
    <div className="min-h-screen" dir="rtl">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      )}
      {/* ========== HERO ========== */}
      <section className={`relative min-h-[70vh] flex items-end bg-gradient-to-br ${theme.heroBg} overflow-hidden`}>
        {/* Cover image */}
        {page.coverImageUrl && (
          <Image
            src={page.coverImageUrl}
            alt={page.title}
            fill
            priority
            className={`object-cover object-center ${page.theme === 'clear-cover' ? 'opacity-100' : 'opacity-40 mix-blend-luminosity'}`}
            sizes="100vw"
          />
        )}
        {/* Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.heroOverlay}`} />

        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

        {/* Top-right Logo */}
        {page.logoUrl && (
          <div className="absolute top-6 right-6 z-20 w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-white/10 backdrop-blur-sm flex-shrink-0">
            <Image src={page.logoUrl} alt="Logo" width={112} height={112} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative z-10 container mx-auto px-4 pb-16 pt-24 flex flex-col gap-6 items-center text-center">
          {/* Title */}
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-2xl max-w-6xl tracking-tight mx-auto text-center"
            style={{ lineHeight: '2' }}
          >
            {page.title}
          </h1>

          {/* Subtitle */}
          {page.subtitle && (
            <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed mx-auto text-center">
              {page.subtitle}
            </p>
          )}

          {/* CTA Buttons */}
          {hasCta && (
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold shadow-xl text-base transition-all hover:scale-105 active:scale-95 ${theme.waBtn}`}>
                  <MessageCircle className="h-5 w-5" />
                  تواصل واتساب
                </a>
              )}
              {callLink && (
                <a href={callLink}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold shadow-xl text-base transition-all hover:scale-105 active:scale-95 ${theme.callBtn}`}>
                  <Phone className="h-5 w-5" />
                  اتصل الآن
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========== FIXED SECTION NAV BAR (Google Ads Sitelinks & Smooth Navigation) ========== */}
      <div
        className={`fixed top-0 inset-x-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/60 shadow-sm py-2.5 px-4 transition-all duration-300 ${
          navVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="container mx-auto max-w-6xl flex items-center gap-2 overflow-x-auto scrollbar-none no-scrollbar justify-start md:justify-center dir-rtl">
          {page.content && (
            <a
              href="#details"
              onClick={handleSectionNav}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm font-semibold transition-all flex-shrink-0"
            >
              <span>تفاصيل الخدمة</span>
            </a>
          )}
          {page.features && page.features.length > 0 && (
            <a
              href="#features"
              onClick={handleSectionNav}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm font-semibold transition-all flex-shrink-0"
            >
              <span>المميزات</span>
            </a>
          )}
          {page.gallery && page.gallery.length > 0 && (
            <a
              href="#gallery"
              onClick={handleSectionNav}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm font-semibold transition-all flex-shrink-0"
            >
              <span>معرض الصور</span>
            </a>
          )}
          {page.testimonials && page.testimonials.length > 0 && (
            <a
              href="#testimonials"
              onClick={handleSectionNav}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm font-semibold transition-all flex-shrink-0"
            >
              <span>آراء العملاء</span>
            </a>
          )}
          {page.faqs && page.faqs.length > 0 && (
            <a
              href="#faqs"
              onClick={handleSectionNav}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm font-semibold transition-all flex-shrink-0"
            >
              <span>الأسئلة الشائعة</span>
            </a>
          )}
          {page.locationEmbed && (
            <a
              href="#location"
              onClick={handleSectionNav}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm font-semibold transition-all flex-shrink-0"
            >
              <span>الموقع على الخريطة</span>
            </a>
          )}
          {hasCta && (
            <a
              href="#contact"
              onClick={handleSectionNav}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-sm hover:scale-105 transition-all flex-shrink-0"
            >
              <span>تواصل معنا</span>
            </a>
          )}
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <section className={`${theme.sectionBg} py-8 md:py-14 px-0 md:px-4`}>
        <div className="w-full md:container md:mx-auto md:max-w-6xl">

          {/* 1. Rich Text Content (تفاصيل الخدمة) */}
          {page.content && (
            <div id="details" className={`${theme.cardBg} rounded-none md:rounded-3xl shadow-sm p-4 md:p-10 mb-8 md:mb-16 mx-0 md:mx-0 scroll-mt-24`}>
              <ContentWrapper
                html={page.content}
                className="custom-page-content text-foreground/90 font-body text-base leading-relaxed"
              />
            </div>
          )}

          {/* 2. Features (المميزات) */}
          {page.features && page.features.length > 0 && (
            <div id="features" className="mb-8 md:mb-16 px-4 md:px-0 scroll-mt-24">
              <SectionTitle label="مميزاتنا" themeAccent={theme.accentText} themeDivider={theme.divider} />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-8">
                {page.features.map((feat, i) => (
                  <div key={i} className={`${theme.cardBg} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col gap-3 hover:-translate-y-1`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme.featureIcon} text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      {feat.iconName ? <FeatureIcon name={feat.iconName} /> : <Check className="h-7 w-7" />}
                    </div>
                    <h3 className="font-bold text-foreground text-base leading-snug">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">{feat.desc}</p>
                    <div className={`w-8 h-0.5 rounded-full ${theme.divider} opacity-40 group-hover:w-14 group-hover:opacity-100 transition-all duration-300`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {page.gallery && page.gallery.length > 0 && (
            <div id="gallery" className="mb-8 md:mb-16 px-0 md:px-0 scroll-mt-24">
              <SectionTitle label="معرض الأعمال والصور" themeAccent={theme.accentText} themeDivider={theme.divider} />
              <div className="mt-6 md:mt-8 max-w-5xl mx-auto">
                {page.gallery.length === 1 ? (
                  /* Single image — full width */
                  <button
                    onClick={() => { setGalleryIdx(0); setGalleryOpen(true); }}
                    className="relative w-full aspect-video rounded-none md:rounded-3xl overflow-hidden group cursor-zoom-in shadow-xl hover:shadow-2xl transition-all"
                  >
                    <Image src={page.gallery[0]} alt="صورة 1" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="100vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                      <span className="text-white font-bold text-sm bg-white/20 backdrop-blur px-4 py-1.5 rounded-full">🔍 عرض الصورة</span>
                    </div>
                  </button>
                ) : page.gallery.length === 2 ? (
                  /* Two images — equal halves */
                  <div className="grid grid-cols-2 gap-3">
                    {page.gallery.map((imgUrl, i) => (
                      <button
                        key={i}
                        onClick={() => { setGalleryIdx(i); setGalleryOpen(true); }}
                        className="relative aspect-video rounded-2xl overflow-hidden group cursor-zoom-in shadow-md hover:shadow-xl transition-all hover:scale-[1.01]"
                      >
                        <Image src={imgUrl} alt={`صورة ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  /* 3+ images — hero + grid */
                  <div className="space-y-3">
                    {/* Hero image */}
                    <button
                      onClick={() => { setGalleryIdx(0); setGalleryOpen(true); }}
                      className="relative w-full aspect-[16/7] rounded-none md:rounded-3xl overflow-hidden group cursor-zoom-in shadow-xl hover:shadow-2xl transition-all"
                    >
                      <Image src={page.gallery[0]} alt="صورة 1" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="100vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <span>🖼</span> {page.gallery.length} صورة
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                        <span className="bg-white/0 group-hover:bg-white/20 backdrop-blur-sm text-white font-bold text-sm px-5 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">🔍 عرض الصورة</span>
                      </div>
                    </button>
                    {/* Thumbnail grid */}
                    <div className={`grid gap-3 ${
                      page.gallery.length - 1 === 1 ? 'grid-cols-1' :
                      page.gallery.length - 1 === 2 ? 'grid-cols-2' :
                      page.gallery.length - 1 === 3 ? 'grid-cols-3' :
                      'grid-cols-2 md:grid-cols-4'
                    }`}>
                      {page.gallery.slice(1).map((imgUrl, i) => (
                        <button
                          key={i + 1}
                          onClick={() => { setGalleryIdx(i + 1); setGalleryOpen(true); }}
                          className="relative aspect-square rounded-2xl overflow-hidden group cursor-zoom-in shadow-md hover:shadow-xl transition-all hover:scale-[1.02]"
                        >
                          <Image src={imgUrl} alt={`صورة ${i + 2}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                            <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Testimonials */}
          {page.testimonials && page.testimonials.length > 0 && (
            <div id="testimonials" className="mb-8 md:mb-16 px-4 md:px-0 scroll-mt-24">
              <SectionTitle label="آراء عملائنا" themeAccent={theme.accentText} themeDivider={theme.divider} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-6 md:mt-8">
                {page.testimonials.map((t, i) => (
                  <div key={i} className={`${theme.cardBg} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col gap-4`}>
                    {/* Header: avatar + name */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-extrabold text-white shadow-md flex-shrink-0 ${theme.accent}`}>
                        {t.name.charAt(0)}
                      </div>
                      <p className="font-bold text-foreground text-sm">{t.name}</p>
                    </div>
                    {/* Review text */}
                    <p className="text-foreground/75 text-sm leading-relaxed italic flex-1">"{t.review}"</p>
                    {/* Star rating at bottom */}
                    <div className="pt-3 border-t border-border/40">
                      <StarRating rating={t.rating ?? 5} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page.faqs && page.faqs.length > 0 && (
            <div id="faqs" className="mb-8 md:mb-16 px-4 md:px-0 scroll-mt-24">
              <SectionTitle label="الأسئلة الشائعة" themeAccent={theme.accentText} themeDivider={theme.divider} />
              <div className="mt-6 md:mt-8 space-y-3">
                {page.faqs.map((faq, i) => (
                  <div key={i} className={`${theme.cardBg} rounded-2xl overflow-hidden shadow-sm`}>
                    <button
                      onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-right font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="flex-1 text-right">{faq.question}</span>
                      {openFaqIdx === i
                        ? <ChevronUp className={`h-5 w-5 flex-shrink-0 ${theme.accentText}`} />
                        : <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />}
                    </button>
                    {openFaqIdx === i && (
                      <div className={`px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4 ${theme.accentLight} rounded-b-2xl`}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location embed */}
          {page.locationEmbed && (
            <div id="location" className="mb-8 md:mb-16 px-4 md:px-0 scroll-mt-24">
              <SectionTitle label="موقعنا على الخريطة" themeAccent={theme.accentText} themeDivider={theme.divider} />
              <div className="mt-6 md:mt-8 rounded-none md:rounded-3xl overflow-hidden shadow-lg border border-border/40 h-72">
                <iframe
                  src={page.locationEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="الموقع على الخريطة"
                />
              </div>
            </div>
          )}

          {/* Final CTA card */}
          {hasCta && (
            <div id="contact" className={`rounded-none md:rounded-3xl bg-gradient-to-br ${theme.heroBg} p-6 md:p-12 text-center shadow-2xl relative overflow-hidden scroll-mt-24`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-white/70" />
                  <span className="text-white/70 text-sm">{page.phoneNumber || page.whatsappNumber}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">هل أنت مستعد للتواصل معنا؟</h2>
                <p className="text-white/75 text-base mb-8 max-w-md mx-auto">فريقنا متاح للرد عليك وتقديم الدعم الفوري</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold shadow-xl text-base transition-all hover:scale-105 active:scale-95 ${theme.waBtn}`}>
                      <MessageCircle className="h-5 w-5" />
                      واتساب مباشر
                    </a>
                  )}
                  {callLink && (
                    <a href={callLink}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-slate-900 font-bold shadow-xl text-base transition-all hover:scale-105 active:scale-95">
                      <Phone className="h-5 w-5" />
                      اتصل الآن
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========== Footer & Developer Credits ========== */}
      <footer className="border-t border-border/40 bg-card/60 backdrop-blur-sm py-8 text-center text-sm text-muted-foreground pb-28 md:pb-8">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-3">
          <a
            href="https://wa.me/201127556848"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 hover:bg-secondary text-foreground hover:text-primary border border-border/50 text-xs md:text-sm font-medium transition-all shadow-sm group"
          >
            <MessageCircle className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
            <span>برمجة وتصميم ابو القعقاع للصيانة وادارة الاعلانات</span>
          </a>
          <p className="text-xs text-muted-foreground/80">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* ========== FLOATING CTA (mobile) ========== */}
      {hasCta && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex bg-background/90 backdrop-blur-md border-t border-border shadow-2xl">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-white font-bold text-base ${theme.waBtn}`}>
              <MessageCircle className="h-5 w-5" />
              واتساب
            </a>
          )}
          {callLink && (
            <a href={callLink}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-white font-bold text-base ${theme.callBtn}`}>
              <Phone className="h-5 w-5" />
              اتصل
            </a>
          )}
        </div>
      )}

      {/* ========== Gallery Lightbox ========== */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none overflow-hidden">
          <DialogTitle className="sr-only">معرض الصور</DialogTitle>
          <DialogDescription className="sr-only">عرض الصورة {galleryIdx + 1} من {page.gallery?.length}</DialogDescription>
          {page.gallery && page.gallery[galleryIdx] && (
            <GalleryLightboxContent
              gallery={page.gallery}
              galleryIdx={galleryIdx}
              setGalleryIdx={setGalleryIdx}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ========== Embedded styles ========== */}
      <style>{`
        html { scroll-behavior: smooth; }
        .custom-page-content { font-size: 16px; line-height: 1.85; }
        .custom-page-content p { margin-bottom: 1.25rem; }
        .custom-page-content h1, .custom-page-content h2, .custom-page-content h3 { font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
        .custom-page-content h1 { font-size: 1.8rem; }
        .custom-page-content h2 { font-size: 1.4rem; }
        .custom-page-content h3 { font-size: 1.15rem; }
        .custom-page-content ul { list-style-type: disc; padding-right: 1.75rem; margin-bottom: 1.25rem; }
        .custom-page-content ol { list-style-type: decimal; padding-right: 1.75rem; margin-bottom: 1.25rem; }
        .custom-page-content li { margin-bottom: 0.5rem; }
        .custom-page-content a { color: hsl(var(--primary)); text-decoration: underline; }
        .custom-page-content img { width: 100% !important; max-width: 100% !important; height: auto !important; border-radius: 0; display: block; margin: 1.5rem auto; }
        @media (min-width: 768px) { .custom-page-content img { border-radius: 12px; } }
        .custom-page-content blockquote { border-right: 4px solid hsl(var(--primary)); padding-right: 1.25rem; margin: 1.5rem 0; font-style: italic; color: hsl(var(--muted-foreground)); }
      `}</style>
    </div>
  );
}

// ---- SectionTitle helper ----
function SectionTitle({ label, themeAccent, themeDivider }: { label: string; themeAccent: string; themeDivider: string }) {
  return (
    <div className="text-center">
      <h2 className={`inline-block text-sm font-bold uppercase tracking-widest mb-2 ${themeAccent}`}>{label}</h2>
      <div className={`mx-auto w-12 h-1 rounded-full ${themeDivider}`} />
    </div>
  );
}

// ---- Feature icon helper (map common icon names to emojis/symbols) ----
function FeatureIcon({ name }: { name: string }) {
  const map: Record<string, string> = {
    tree: '🌳', flower: '🌸', water: '💧', quality: '✅', delivery: '🚚',
    garden: '🌿', palm: '🌴', star: '⭐', phone: '📞', location: '📍',
    clock: '🕐', shield: '🛡️', leaf: '🍃', plant: '🪴', sun: '☀️',
  };
  return <span className="text-lg">{map[name] ?? '✶'}</span>;
}

// ---- Gallery Lightbox sub-component (needs its own scope to use useSwipe hook) ----
function GalleryLightboxContent({
  gallery,
  galleryIdx,
  setGalleryIdx,
}: {
  gallery: string[];
  galleryIdx: number;
  setGalleryIdx: Dispatch<SetStateAction<number>>;
}) {
  const swipe = useSwipe({
    onSwipeLeft: () => setGalleryIdx(i => (i + 1) % gallery.length),
    onSwipeRight: () => setGalleryIdx(i => (i - 1 + gallery.length) % gallery.length),
  });

  return (
    <div
      className="relative w-full aspect-video select-none"
      {...swipe.handlers}
    >
      <Image
        src={gallery[galleryIdx]}
        alt={`صورة ${galleryIdx + 1}`}
        fill
        className="object-contain pointer-events-none"
        sizes="90vw"
      />
      {/* Navigation arrows — visible on desktop only, swipe handles mobile */}
      {gallery.length > 1 && (
        <>
          <button
            onClick={() => setGalleryIdx(i => (i - 1 + gallery.length) % gallery.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur p-2.5 rounded-full text-white transition-all hidden md:flex items-center justify-center"
            aria-label="السابق"
          >◄</button>
          <button
            onClick={() => setGalleryIdx(i => (i + 1) % gallery.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur p-2.5 rounded-full text-white transition-all hidden md:flex items-center justify-center"
            aria-label="التالي"
          >►</button>
        </>
      )}
      {/* Mobile swipe hint (shown briefly) */}
      {gallery.length > 1 && (
        <div className="md:hidden absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-white/60 text-xs">
          <span>←</span>
          <span>اسحب للتصفح</span>
          <span>→</span>
        </div>
      )}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
        {galleryIdx + 1} / {gallery.length}
      </div>
    </div>
  );
}
