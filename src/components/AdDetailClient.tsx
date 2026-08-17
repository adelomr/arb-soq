

'use client';

import { useEffect, useState, useRef } from 'react';
import { useSwipe } from '@/hooks/useSwipe';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { Ad, UserProfile } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MapPin, Tag, Calendar, User, Phone, MessageCircle, ZoomIn, ZoomOut, RotateCcw, Star, PlusCircle, ShoppingCart, Globe, Hash, Package, Eye, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink, BadgeCheck, Crown, Sparkles, Rocket } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useMarket } from '@/context/MarketContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ZoomableImage from '@/components/ZoomableImage';
import Reviews from '@/components/Reviews';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { AdPlaceholder, AdPlaceholderSquare } from './Adsense';
import { markets } from '@/lib/markets';
import { isPhysicalGoodsCategory } from '@/lib/category-utils';
import RelatedAdsSidebar from './RelatedAdsSidebar';
import AdFallbackPlaceholder from '@/components/AdPlaceholder';
import AdSlot from '@/components/AdSlot';
import { safeParseDate, cn, formatWhatsAppNumber } from '@/lib/utils';
import { logAdActivity } from '@/lib/ad-log-service';
import PromoteAdDialog from '@/components/PromoteAdDialog';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

// مكوّن تحذير المغادرة قبل فتح روابط خارجية
function ExternalLinkWarning({ href, children }: { href: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  let displayHost = '';
  try { displayHost = new URL(href).hostname; } catch {}

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary underline break-all hover:opacity-80 transition-opacity inline-flex items-center gap-1"
      >
        {children}
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm text-center" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              أنت على وشك مغادرة الموقع
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              سيتم توجيهك إلى موقع خارجي:
              <span className="block font-bold text-foreground mt-1 break-all">{displayHost}</span>
              <span className="block text-xs text-muted-foreground mt-1">سوق العرب غير مسؤول عن محتوى المواقع الخارجية.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              البقاء في الموقع
            </Button>
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                setOpen(false);
                window.open(href, '_blank', 'noopener,noreferrer');
              }}
            >
              المتابعة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// جميع نطاقات الموقع المعروفة (إنتاج + تطوير)
const SITE_DOMAINS = [
  'arb-soq.com',
  'www.arb-soq.com',
  'localhost',
  '127.0.0.1',
];

// دالة لتحويل الروابط في النص إلى روابط قابلة للنقر مع تحذير مغادرة للروابط الخارجية فقط
function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (!urlRegex.test(part)) return <span key={i}>{part}</span>;

    // تحقق إذا كان الرابط داخلياً
    let isInternal = false;
    try {
      const linkHost = new URL(part).hostname;
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      isInternal =
        SITE_DOMAINS.includes(linkHost) ||
        linkHost === currentHost ||
        linkHost.endsWith(`.${currentHost}`);
    } catch {}

    if (isInternal) {
      // رابط داخلي — فتح مباشر بدون تحذير
      return (
        <a
          key={i}
          href={part}
          className="text-primary underline break-all hover:opacity-80 transition-opacity"
        >
          {part}
        </a>
      );
    }

    // رابط خارجي — عرض نافذة التحذير
    return (
      <ExternalLinkWarning key={i} href={part}>
        {part}
      </ExternalLinkWarning>
    );
  });
}

const WhatsappIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor">
    <path d="M17.472 14.382c-.022-.08-.115-.188-.417-.329-.3-.14-1.778-.877-2.037-.972-.26-.095-.448-.142-.642.148-.193.29-.749.972-.919 1.162-.17.19-.34.21-.641.07-.3-.14-1.272-.468-2.423-1.493-.895-.8-1.5-1.787-1.675-2.09-.175-.3-.018-.463.132-.613.136-.135.3-.35.45-.524.15-.175.2-.292.3-.487.1-.197.05-.369-.025-.51-.07-.14-.642-1.547-.882-2.128-.233-.564-.47-.488-.642-.496-.166-.008-.356-.01-.546-.01-.19 0-.5.07-.76.357-.26.29-1 .975-1 2.378 0 1.4 1.01 2.75 1.15 2.94.14.19 1.98 3.03 4.8 4.24.67.29 1.2.46 1.61.59.67.21 1.28.18 1.76.11.53-.08 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.19-.56-.33zM12.002 2c-5.523 0-10 4.477-10 10 0 1.778.463 3.507 1.345 5.032L2 22l5.132-1.347c1.472.8 3.12 1.222 4.87 1.222 5.523 0 10-4.477 10-10s-4.477-10-10-10z"/>
  </svg>
)

const t = {
    adNotFound: "الإعلان غير موجود",
    adNotFoundDesc: "عذراً، لم نتمكن من العثور على الإعلان الذي تبحث عنه. ربما تم حذفه.",
    loading: "جارٍ التحميل...",
    by: "بواسطة",
    posted: "نُشر",
    promoted: 'مميز',
    negotiable: 'حسب الاتفاق',
    onDemand: 'السعر عند الطلب',
    callSeller: 'اتصل بالبائع',
    messageOnWhatsapp: 'مراسلة عبر واتساب',
    phoneNotAvailable: 'رقم الهاتف غير متاح',
    imageOf: "صورة لـ",
    zoomableImage: "صورة قابلة للتكبير",
    reviews: "التقييمات والمراجعات",
    basedOn: "بناءً على",
    reviewsCount: "مراجعات",
    whatsappMessage: 'السلام عليكم، أتواصل معك بخصوص إعلانك: "{adTitle}" المعروض على 🏪 منصة سوق العرب 🛍️',
    addToCart: 'أضف للسلة',
    addedToCart: 'تمت الإضافة للسلة',
    targetMarket: 'السوق المستهدف',
    productCode: 'كود المنتج',
    condition: "الحالة",
    conditionNew: "جديد",
    conditionUsed: "مستعمل",
  };

export default function AdDetailClient({ initialAd }: { initialAd: Ad }) {
  const { user, userProfile, incrementAdView } = useAuth();
  const { market } = useMarket();
  const { cart, addToCart } = useCart();
  const { toast } = useToast();

  const [ad, setAd] = useState<Ad>(initialAd);
  const [seller, setSeller] = useState<UserProfile | null>(initialAd.user || null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const hasImage = !!(ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0]);
  const viewIncremented = useRef(false);

  // Swipe to navigate images on mobile
  const swipe = useSwipe({
    onSwipeLeft: () => hasImage && setSelectedImageIndex(prev => (prev < ad.imageUrls.length - 1 ? prev + 1 : 0)),
    onSwipeRight: () => hasImage && setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : ad.imageUrls.length - 1)),
  });

  const { adId } = useParams();

  useEffect(() => {
    if (ad?.id && !viewIncremented.current) {
        incrementAdView(ad);
        logAdActivity(ad.id, 'view', { userId: user?.uid, sellerUserId: ad.userId || seller?.id });
        viewIncremented.current = true;
    }
  }, [ad, incrementAdView, user?.uid, seller?.id]);
  
  const isStoreProduct = ad?.category === 'store-product';
  const isInCart = cart.some(item => item.id === adId);

  const handleAddToCart = () => {
    if (ad) {
      addToCart(ad);
    }
  };

  if (!ad || !seller) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{t.adNotFound}</h1>
            <p className="text-muted-foreground mt-4">{t.adNotFoundDesc}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const formatPrice = (price: number) => {
    try {
      const curr = (market && market.currency) ? market.currency : 'SAR';
      return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: curr,
        maximumFractionDigits: 0,
        numberingSystem: 'latn'
      }).format(price);
    } catch {
      return `${price} ${market?.currency || 'ر.س'}`;
    }
  };

  const getPostedTimeAgo = () => {
    try {
      return formatDistanceToNow(safeParseDate(ad.postedAt), { addSuffix: true, locale: ar });
    } catch {
      return '';
    }
  };

  // The admin may have added a phone number directly on the ad (ad.phoneNumber).
  // Prefer that over the seller's profile phone so the buttons always work.
  const effectivePhone = (ad.phoneNumber && ad.phoneNumber.trim()) || seller.phoneNumber || null;

  const handleWhatsAppClick = () => {
    if (effectivePhone) {
      if (ad?.id) {
        logAdActivity(ad.id, 'whatsapp', { userId: user?.uid, sellerUserId: ad.userId || seller?.id });
      }
      const messageTemplate = t.whatsappMessage;
      const message = messageTemplate.replace('{adTitle}', ad.title);
      const formattedPhone = formatWhatsAppNumber(effectivePhone);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };
  
  const adMarket = markets.find(m => m.id === ad.market);
  const effectiveUserId = ad.userId || ad.user?.id || 'owner';
  const isOwner = user?.uid === ad.userId || (ad.user?.id && user?.uid === ad.user.id);
  const isAdmin = userProfile?.role === 'admin';
  const canViewLog = isOwner || isAdmin;

  const isBoostActive = (ad as any).isFeatured && (!(ad as any).featuredUntil || new Date((ad as any).featuredUntil) > new Date());
  const boostTier = (ad as any).featuredTier || 'silver';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('boost') === 'success') {
        toast({
          title: "🎉 تم تمييز الإعلان بنجاح!",
          description: "تهانينا! تمت ترقية إعلانك بنجاح وتثبيته في مقدمة نتائج البحث.",
        });
      }
    }
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                {/* Main Content */}
                <div className="lg:col-span-8">
                     {/* Ad Header */}
                    <div className="mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {isBoostActive && boostTier === 'gold' && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold border-none shadow-md text-xs py-1 px-3">
                                    <Crown className="w-4 h-4 ml-1.5 fill-black text-black" />
                                    إعلان ذهبي VIP
                                </Badge>
                            )}
                            {isBoostActive && boostTier === 'silver' && (
                                <Badge className="bg-slate-800 text-white font-bold border border-slate-600 shadow-sm text-xs py-1 px-3">
                                    <Sparkles className="w-3.5 h-3.5 ml-1.5 text-yellow-400" />
                                    إعلان مميز
                                </Badge>
                            )}
                            {!isBoostActive && ad.isPromoted && (
                                <Badge variant="destructive" className="bg-accent text-accent-foreground">
                                    {t.promoted}
                                </Badge>
                            )}
                            {(ad as any).aiEnhanced && (
                                <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary text-xs">
                                  <Sparkles className="w-3 h-3 ml-1" />
                                  مُحسن بالذكاء الاصطناعي
                                </Badge>
                            )}
                          </div>

                          {isOwner && (
                            <PromoteAdDialog
                              ad={ad}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold gap-1.5 shadow-sm"
                                >
                                  <Rocket className="h-4 w-4 text-amber-500" />
                                  <span>ترقية وتمييز الإعلان 🚀</span>
                                </Button>
                              }
                            />
                          )}
                        </div>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight break-words mb-3">
                            {ad.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                             <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>{t.posted} {getPostedTimeAgo()}</span>
                            </div>
                            {ad.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    <span>{ad.location}</span>
                                </div>
                            )}
                            {ad.condition && isPhysicalGoodsCategory(ad.category, (ad as any).categoryName) && (
                                <div className="flex items-center gap-1.5">
                                    <Package className="h-4 w-4" />
                                    <span>{t.condition}: <span className="font-semibold text-foreground">{ad.condition === 'new' ? t.conditionNew : t.conditionUsed}</span></span>
                                </div>
                            )}
                            {ad.views !== undefined && (
                                <div className="flex items-center gap-1.5">
                                    <Eye className="h-4 w-4" />
                                    <span>{ad.views.toLocaleString('en-US')} مشاهدة</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Image Section */}
                    {hasImage ? (
                      <Dialog>
                          <DialogTrigger asChild>
                              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-3 shadow-xl border border-border/40 cursor-zoom-in group min-h-[300px]" {...swipe}>
                                  <Image
                                      src={ad.imageUrls[selectedImageIndex] || ad.imageUrls[0]}
                                      alt={ad.title}
                                      fill
                                      priority
                                      className="object-contain bg-black/10 dark:bg-black/40 transition-transform duration-300 group-hover:scale-105"
                                      sizes="(max-width: 1024px) 100vw, 66vw"
                                  />
                                  {ad.imageUrls.length > 1 && (
                                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-medium shadow-md z-30 border border-white/10">
                                          {selectedImageIndex + 1} / {ad.imageUrls.length}
                                      </div>
                                  )}

                                  {/* Zoom hint badge */}
                                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white/90 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md z-30 border border-white/10">
                                    <ZoomIn className="h-3.5 w-3.5" />
                                    <span>تكبير</span>
                                  </div>
                              </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl h-[90vh] p-0 border-0">
                              <DialogHeader className="sr-only">
                                  <DialogTitle>{t.imageOf} {ad.title}</DialogTitle>
                                  <DialogDescription>{t.zoomableImage}</DialogDescription>
                              </DialogHeader>
                          <ZoomableImage src={ad.imageUrls[selectedImageIndex] || ad.imageUrls[0]} alt={ad.title} gallery={ad.imageUrls} />
                          </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-3 shadow-xl border border-border/40 min-h-[300px]">
                        <AdFallbackPlaceholder category={ad.category} iconClassName="h-20 w-20" />
                      </div>
                    )}

                    {/* شريط الصور المصغرة (Thumbnails Bar) */}
                    {ad.imageUrls && ad.imageUrls.length > 1 && (
                      <div className="flex items-center gap-3 overflow-x-auto py-3 my-3 px-2 rounded-2xl bg-secondary/30 border border-border/50 shadow-inner" dir="rtl">
                        {ad.imageUrls.map((imgUrl, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedImageIndex(index)}
                            className={cn(
                              "relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95",
                              selectedImageIndex === index
                                ? "border-primary ring-2 ring-primary/40 opacity-100 scale-105 shadow-md"
                                : "border-border/60 opacity-60 hover:opacity-100"
                            )}
                            title={`عرض صورة ${index + 1}`}
                          >
                            <Image
                              src={imgUrl}
                              alt={`${ad.title} - صورة ${index + 1}`}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                            {selectedImageIndex === index && (
                              <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-xl" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                     <div className="py-8">
                        <AdPlaceholder />
                    </div>

                    {/* Ad Body */}
                    <div className="space-y-8">
                        {ad.description && 
                          ad.description !== 'إعلان صوري' && 
                          ad.description !== 'إعلان فيديو' && 
                          ad.description !== 'تفاصيل إعلان صوري' && 
                          ad.description !== 'تفاصيل إعلان فيديو' && 
                          ad.description !== ad.title && (
                             <Card>
                                 <CardHeader>
                                     <CardTitle>الوصف</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                     <p className="text-lg leading-relaxed whitespace-pre-wrap">{renderTextWithLinks(ad.description)}</p>
                                 </CardContent>
                             </Card>
                         )}
                        {seller && (
                            <div className="py-8">
                                <Reviews seller={seller} adId={ad.id} ad={ad} />
                            </div>
                        )}
                        <div className="py-2">
                            <AdSlot slotKey="single_post_below_desc" />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6 lg:sticky top-28 h-fit">
                    {/* Price — Only show if price was added during ad creation */}
                    {!!ad.price && Number(ad.price) > 0 && (
                        <div className="p-6 bg-primary/10 rounded-lg text-center border border-primary/20">
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <Tag className="w-8 h-8" />
                            </div>
                            <p className="text-4xl font-bold text-primary mt-2">
                                {formatPrice(Number(ad.price))}
                            </p>
                        </div>
                    )}



                    {/* Seller Card */}
                    {seller && (
                        <div className="p-4 bg-card border rounded-2xl flex items-center gap-3">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={seller.avatarUrl || undefined} alt={seller.name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {seller.name?.[0]?.toUpperCase() || '؟'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-sm text-foreground truncate">{seller.name}</h3>
                                    {seller.verified && (
                                        <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10 flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{seller.profession || 'عضو نشط'}</p>
                            </div>
                        </div>
                    )}

                    {/* Contact/Action Buttons */}
                    <div className="space-y-3">
                        {isStoreProduct ? (
                            <Button 
                                className="w-full" 
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={isInCart}
                            >
                                {isInCart ? (
                                    <>
                                        <ShoppingCart className="ml-2 h-5 w-5" />
                                        {t.addedToCart}
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="ml-2 h-5 w-5" />
                                        {t.addToCart}
                                    </>
                                )}
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    asChild 
                                    className="w-full" 
                                    size="lg" 
                                    disabled={!effectivePhone}
                                >
                                    <a 
                                      href={`tel:${effectivePhone}`} 
                                      onClick={() => {
                                        if (ad?.id) logAdActivity(ad.id, 'call', { userId: user?.uid, sellerUserId: ad.userId || seller?.id });
                                      }}
                                    >
                                        <Phone className="mr-2 h-5 w-5" />
                                        {effectivePhone ? t.callSeller : t.phoneNotAvailable}
                                    </a>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full bg-green-500 text-white hover:bg-green-600 hover:text-white" 
                                    size="lg" 
                                    onClick={handleWhatsAppClick}
                                    disabled={!effectivePhone}
                                >
                                    <WhatsappIcon />
                                    <span className="mx-2">
                                    {effectivePhone ? t.messageOnWhatsapp : t.phoneNotAvailable}
                                    </span>
                                </Button>
                            </>
                        )}
                    </div>
                    <AdSlot slotKey="single_post_sidebar" type="square" />
                    <RelatedAdsSidebar category={ad.category} currentAdId={ad.id} />
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
