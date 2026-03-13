

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Ad, UserProfile } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MapPin, Tag, Calendar, User, Phone, MessageCircle, ZoomIn, ZoomOut, RotateCcw, Star, PlusCircle, ShoppingCart, Globe, Hash, Package } from 'lucide-react';
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
import RelatedAdsSidebar from './RelatedAdsSidebar';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

const WhatsappIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <path fill="currentColor" d="M16.75 13.96c.25.13.43.2.5.28.08.08.13.18.15.25.03.08.03.15.03.18 0 .03-.03.05-.03.08-.02.02-.03.05-.05.07-.02.02-.05.05-.07.07-.02.02-.05.03-.07.05-.02.02-.05.05-.08.07-.03.02-.05.05-.08.07-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.1.08c-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.12.08c-.03.03-.07.05-.12.08-.05.03-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.03-.15.05-.05.02-.1.03-.15.05-.05.02-.1.03-.17.05-.07.02-.13.03-.2.05-.07.02-.15.03-.22.05-.07.02-.15.03-.22.05-.07.02-.15.03-.23.03-.08 0-.17-.02-.25-.03-.08-.02-.17-.03-.25-.05-.08-.02-.17-.03-.25-.05-.08-.02-.17-.05-.25-.07-.08-.02-.17-.05-.25-.08-.08-.03-.17-.05-.25-.08-.08-.03-.17-.07-.25-.1-.08-.03-.17-.07-.25-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.22-.1-.07-.03-.13-.07-.2-.1-.03-.02-.05-.03-.07-.05-.43-.2-1.03-.48-1.7-1.15-.65-.65-1.03-1.4-1.1-1.58-.02-.03-.03-.07-.05-.1-.02-.03-.03-.07-.05-.1v-.1c0-.02.02-.03.03-.05.02-.02.03-.03.05-.05.02-.02.05-.03.08-.05.03-.02.07-.03.1-.05.03-.02.07-.03.1-.05.03-.02.05-.03.08-.05.03-.02.05-.03.08-.05.03-.02.05-.03.07-.03.02 0 .05-.02.07-.02.02 0 .05-.02.07-.02.02 0 .05 0 .07.02.02 0 .05.02.07.03.02.02.05.03.07.05.02.02.05.05.07.07l.08.08c.03.03.05.05.07.08.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.05.05.08.02.03.03.05.05.08.02.03.03.05.05.08.03.05.05.08.07.12.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.07.05.1s.05.07.07.1c.02.03.05.07.07.1.02.03.05.07.07.1.02.03.05.07.07.1.07.12.18.23.32.33.13.1.28.18.43.25.15.07.3.12.45.15.15.03.3.05.45.05.15 0 .3-.02.45-.05.15-.03.3-.08.45-.15.15-.07.28-.15.42-.25.13-.1.25-.2.35-.33.05-.05.1-.12.13-.2.03-.08.05-.17.05-.25s-.02-.17-.05-.25c-.03-.08-.08-.15-.13-.2-.1-.1-.2-.18-.32-.25-.12-.08-.25-.13-.4-.18-.13-.05-.27-.08-.4-.08-.13 0-.27.03-.4.08s-.25.13-.38.2c-.12.08-.23.15-.35.23-.12.08-.23.17-.33.25-.1.08-.2.17-.28.25-.08.08-.15.17-.22.25-.07.08-.13.17-.18.25-.05.08-.1.17-.12.25-.02.08-.03.17-.03.25s.02.17.03.25c.02.08.05.15.08.22.03.07.08.13.12.18.05.05.1.1.15.15.05.05.1.1.15.15l.15.12c.05.03.1.07.15.1.05.03.1.07.15.1.05.03.1.07.15.1.1.07.2.13.3.18.1.05.2.1.3.15.1.05.2.1.3.15.2.1.2.18.2.25V12c0-2.1-1.2-3.96-3-4.9.15-.3.23-.62.23-.95 0-.75-.4-1.4-1.03-1.75.28-.43.43-.93.43-1.45 0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 .52.15 1.02.43 1.45-.63.35-1.03 1-1.03 1.75 0 .33.08.65.23.95-1.8 1-3 2.8-3 4.9v.05c0 .07.02.13.05.18.1.05.2.1.3.15s.2.1.3.15c.1.05.2.1.3.15.1.05.2.08.3.13.1.05.2.1.3.15.1.05.2.1.3.15.08.05.15.1.22.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15l.38.22c.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.05.2.08.07.03.13.05.2.08.07.03.13.05.2.08.13.05.27.08.4.1.13.03.27.03.4 0 .13-.02.27-.03.4-.02.13-.05.27-.08.4-.03.13-.08.25-.13.38-.05.12-.1.25-.18.38-.08.12-.17.23-.25.33-.08.1-.18.2-.28.28-.1.08-.2.17-.3.25-.1.08-.2.17-.3.25-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23l-.3.23c-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.15.15-.28.3-.4.45-.12.15-.22.3-.3.45-.08.15-.13.3-.15.45-.02.15-.03.3-.03.45s.02.3.03.45c.02.15.07.3.15.45.08.15.18.3.3.45.12.15.25.3.4.45.15.15.3.28.45.42.15.13.3.25.45.35.15.1.32.18.5.23.18.05.37.08.55.08.18 0 .37-.03.55-.08.18-.05.35-.13.5-.23.15-.1.3-.22.45-.35.15-.13.28-.28.42-.42.13-.15.25-.3.35-.45.1-.15.18-.3.23-.45.05-.15.08-.3.08-.45s-.03-.3-.08-.45c-.05-.15-.13-.3-.23-.45-.1-.15-.22-.3-.35-.45s-.28-.28-.42-.42c-.15-.13-.3-.25-.45-.38-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35l-.23-.17c-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33l-.2-.17c-.15-.12-.28-.23-.4-.35-.12-.12-.23-.23-.33-.35-.1-.1-.2-.2-.28-.3-.08-.1-.17-.2-.25-.28-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25l-.25-.25c-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25l-.45-.5c-.08-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25l-.22-.25c-.07-.08-.15-.17-.22-.25L3.83 6.08l-.22-.25c-.07-.08-.15-.17-.22-.25C3.3 5.5 3.22 5.4 3.14 5.33c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23l-.25-.25c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23C1.6 3.9 1.5 3.82 1.43 3.73c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25L0 2.7l-.22-.25c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25C12.5.02 12.25 0 12 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.63 0 12-5.37 12-12v-.08c-.03-.08-.05-.15-.08-.22-.03-.07-.05-.13-.08-.2Z"/>
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
    whatsappMessage: 'مرحباً، أنا مهتم بإعلانك "{adTitle}" على سوق العرب.',
    addToCart: 'أضف للسلة',
    addedToCart: 'تمت الإضافة للسلة',
    targetMarket: 'السوق المستهدف',
    productCode: 'كود المنتج',
    condition: "الحالة",
    conditionNew: "جديد",
    conditionUsed: "مستعمل",
  };

export default function AdDetailClient({ initialAd }: { initialAd: Ad }) {
  const { incrementAdView } = useAuth();
  const { market } = useMarket();
  const { cart, addToCart } = useCart();
  const { toast } = useToast();

  const [ad, setAd] = useState<Ad>(initialAd);
  const [seller, setSeller] = useState<UserProfile | null>(initialAd.user || null);
  const viewIncremented = useRef(false);
  
  const { adId } = useParams();

  useEffect(() => {
    if (ad && !viewIncremented.current) {
        incrementAdView(ad);
        viewIncremented.current = true;
    }
  }, [ad, incrementAdView]);
  
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
  
  const currencyFormatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: market.currency,
    maximumFractionDigits: 0,
    numberingSystem: 'latn'
  });

  const dateLocale = ar;

  const handleWhatsAppClick = () => {
    if (seller.phoneNumber) {
      const messageTemplate = t.whatsappMessage;
      const message = messageTemplate.replace('{adTitle}', ad.title);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${seller.phoneNumber.replace('+', '')}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };
  
  const adMarket = markets.find(m => m.id === ad.market);

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
                        {ad.isPromoted && (
                            <Badge variant="destructive" className="bg-accent text-accent-foreground mb-2">
                                {t.promoted}
                            </Badge>
                        )}
                        <h1 className="text-3xl md:text-4xl font-bold font-headline">{ad.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>{t.posted} {formatDistanceToNow(new Date(ad.postedAt), { addSuffix: true, locale: dateLocale })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span>{ad.location}</span>
                            </div>
                             {ad.condition && (
                                <div className="flex items-center gap-1.5">
                                    <Package className="h-4 w-4" />
                                    <span>{t.condition}: <span className="font-semibold text-foreground">{ad.condition === 'new' ? t.conditionNew : t.conditionUsed}</span></span>
                                </div>
                            )}
                            {adMarket && (
                            <div className="flex items-center gap-1.5">
                                <Globe className="h-4 w-4" />
                                <span>{t.targetMarket}: {adMarket.name.ar}</span>
                            </div>
                            )}
                            {ad.productCode && (
                            <div className="flex items-center gap-1.5">
                                <Hash className="h-4 w-4" />
                                <span>{t.productCode}: {ad.productCode}</span>
                            </div>
                            )}
                        </div>
                    </div>

                    {/* Ad Image */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden mb-8 shadow-lg cursor-zoom-in">
                                <Image
                                src={ad.imageUrls[0]}
                                alt={ad.title}
                                fill
                                className="object-contain"
                                data-ai-hint={ad.imageHints ? ad.imageHints[0] : ''}
                                />
                            </AspectRatio>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl h-[90vh] p-0 border-0">
                            <DialogHeader className="sr-only">
                                <DialogTitle>{t.imageOf} {ad.title}</DialogTitle>
                                <DialogDescription>{t.zoomableImage}</DialogDescription>
                            </DialogHeader>
                        <ZoomableImage src={ad.imageUrls[0]} alt={ad.title} gallery={ad.imageUrls} />
                        </DialogContent>
                    </Dialog>

                     <div className="py-8">
                        <AdPlaceholder />
                    </div>

                    {/* Ad Body */}
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>الوصف</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg leading-relaxed whitespace-pre-wrap">{ad.description}</p>
                            </CardContent>
                        </Card>
                        {seller && (
                            <div className="py-8">
                                <Reviews seller={seller} />
                            </div>
                        )}
                        <div className="py-8">
                            <AdPlaceholderSquare />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6 lg:sticky top-28 h-fit">
                    {/* Price */}
                    <div className="p-6 bg-primary/10 rounded-lg text-center border border-primary/20">
                        <div className="flex items-center justify-center gap-2 text-primary">
                            <Tag className="w-8 h-8" />
                        </div>
                        <p className="text-4xl font-bold text-primary mt-2">
                            {ad.price !== undefined ? currencyFormatter.format(ad.price) : (ad.adType === 'request-service' ? t.negotiable : t.onDemand)}
                        </p>
                    </div>

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
                                    disabled={!seller.phoneNumber || !seller.phoneVerified}
                                >
                                    <a href={`tel:${seller.phoneNumber}`}>
                                        <Phone className="mr-2 h-5 w-5" />
                                        {seller.phoneNumber && seller.phoneVerified ? t.callSeller : t.phoneNotAvailable}
                                    </a>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full bg-green-500 text-white hover:bg-green-600 hover:text-white" 
                                    size="lg" 
                                    onClick={handleWhatsAppClick}
                                    disabled={!seller.phoneNumber || !seller.phoneVerified}
                                >
                                    <WhatsappIcon />
                                    <span className="mx-2">
                                    {seller.phoneNumber && seller.phoneVerified ? t.messageOnWhatsapp : t.phoneNotAvailable}
                                    </span>
                                </Button>
                            </>
                        )}
                    </div>
                     <RelatedAdsSidebar category={ad.category} currentAdId={ad.id} />
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
