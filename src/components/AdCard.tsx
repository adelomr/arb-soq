'use client';
import type { Ad, UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Tag, Star, Wrench, Handshake, ShoppingCart, PlusCircle, Store, Share2, Facebook, Twitter, ImageIcon, Eye, BadgeCheck, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { navTranslations } from './Header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdPlaceholder from '@/components/AdPlaceholder';
import RequireAuthModal from '@/components/RequireAuthModal';

const WhatsappIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor">
        <path d="M17.472 14.382c-.022-.08-.115-.188-.417-.329-.3-.14-1.778-.877-2.037-.972-.26-.095-.448-.142-.642.148-.193.29-.749.972-.919 1.162-.17.19-.34.21-.641.07-.3-.14-1.272-.468-2.423-1.493-.895-.8-1.5-1.787-1.675-2.09-.175-.3-.018-.463.132-.613.136-.135.3-.35.45-.524.15-.175.2-.292.3-.487.1-.197.05-.369-.025-.51-.07-.14-.642-1.547-.882-2.128-.233-.564-.47-.488-.642-.496-.166-.008-.356-.01-.546-.01-.19 0-.5.07-.76.357-.26.29-1 .975-1 2.378 0 1.4 1.01 2.75 1.15 2.94.14.19 1.98 3.03 4.8 4.24.67.29 1.2.46 1.61.59.67.21 1.28.18 1.76.11.53-.08 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.19-.56-.33zM12.002 2c-5.523 0-10 4.477-10 10 0 1.778.463 3.507 1.345 5.032L2 22l5.132-1.347c1.472.8 3.12 1.222 4.87 1.222 5.523 0 10-4.477 10-10s-4.477-10-10-10z"/>
    </svg>
)

const translations = {
    ar: {
        promoted: 'مميز',
        service: 'خدمة',
        requested: 'مطلوب',
        negotiable: 'حسب الاتفاق',
        onDemand: 'السعر عند الطلب',
        addToCart: 'أضف للسلة',
        addedToCart: 'تمت الإضافة للسلة',
        share: 'مشاركة',
        linkCopied: 'تم نسخ الرابط!',
        facebook: 'فيسبوك',
        twitter: 'تويتر',
        whatsapp: 'واتساب',
    },
}

type AdCardProps = {
  ad: Ad;
  priority?: boolean;
};

// Function to generate a consistent color based on the user ID
const generateStoreColor = (userId: string): { backgroundColor: string; textColor: string } => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Ensure it's a 32bit integer
    }
    const hue = hash % 360;
    const saturation = 75; // Good saturation for background
    const lightness = 85; // Light background for better contrast
    
    // For text, we can use a darker shade of the same hue
    const textLightness = 25; 
    
    return {
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        textColor: `hsl(${hue}, ${saturation}%, ${textLightness}%)`,
    };
};


function AdCard({ ad, priority = false }: AdCardProps) {
  const { market } = useMarket();
  const t = translations.ar;
  const direction = 'rtl';
  const { getUserById, incrementAdClick, user } = useAuth();
  const { addToCart, cart } = useCart();
  const { toast } = useToast();
  const [adUser, setAdUser] = useState(ad.user);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('يجب تسجيل الدخول لمشاركة الإعلان');
  const router = useRouter();
  
  const touchPosRef = useRef({ x: 0, y: 0, moved: false });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        moved: false,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - touchPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchPosRef.current.y);
      if (dx > 8 || dy > 8) {
        touchPosRef.current.moved = true;
      }
    }
  };

  const adUrl = typeof window !== 'undefined' ? `${window.location.origin}/ad/${ad.userId}/${ad.id}` : '';
  const shareText = encodeURIComponent(ad.title);

  const isBoostActive = (ad as any).isFeatured && (!(ad as any).featuredUntil || new Date((ad as any).featuredUntil) > new Date());
  const boostTier = (ad as any).featuredTier || 'silver';

  useEffect(() => {
    if (!ad.user && ad.userId) {
      const fetchUser = async () => {
        const userProfile = await getUserById(ad.userId);
        if (userProfile) {
          setAdUser(userProfile);
        }
      };
      fetchUser();
    }
  }, [ad.user, ad.userId, getUserById]);


  const currencyFormatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: market.currency,
    maximumFractionDigits: 0,
    numberingSystem: 'latn' // Force Latin numerals
  });

  const isStoreProduct = ad.category === 'store-product';
  const isInCart = cart.some(item => item.id === ad.id);
  const hasImage = ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setAuthModalMessage('يجب تسجيل الدخول لإضافة المنتجات إلى السلة');
      setShowAuthModal(true);
      return;
    }
    if(ad){
        addToCart(ad);
    }
  }
  
  const handleStoreClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if(adUser){
        router.push(`/store/${adUser.id}`);
      }
  }

  const storeColorStyle = isStoreProduct && adUser?.id ? generateStoreColor(adUser.id) : null;

  const realRating = (ad as any).rating || 0;
  const realReviewCount = (ad as any).reviewCount || 0;
  const hasRealRating = realRating > 0 && realReviewCount > 0;

  const effectiveUserId = ad.userId || ad.user?.id || 'owner';
  const effectiveUser = (adUser || ad.user || { id: effectiveUserId, name: 'مستخدم سوق العرب' }) as UserProfile;

  // صياغة الموقع المحلي (المحافظة، المدينة / الحي، أو القرية)
  // استثناء: في حال لم يحدد المعلن محافظة أو مدينة (مثل إعلان على مستوى كامل الدولة)، يتم إظهار اسم الدولة بجانب أيقونة الموقع
  const locationParts = [
    ad.governorate || ad.province,
    ad.city,
    ad.village
  ].filter((p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 0 && p !== ad.country));

  const uniqueLocationParts = Array.from(new Set(locationParts));
  const displayLocation = uniqueLocationParts.length > 0
    ? uniqueLocationParts.join('، ')
    : (ad.country || ad.location || market?.name?.ar || '');

  return (
    <Link href={`/ad/${effectiveUserId}/${ad.id}`} className="block group h-full" onClick={() => incrementAdClick(ad)}>
        <Card className={`overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 ${isBoostActive && boostTier === 'gold' ? 'border-amber-500/60 shadow-md ring-1 ring-amber-500/30' : (isBoostActive ? 'border-primary/50' : '')}`}>
            <CardHeader className="p-0 relative">
                <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                    {hasImage ? (
                        <Image
                            src={ad.imageUrls[0]}
                            alt={ad.title}
                            fill
                            priority={priority}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <AdPlaceholder category={ad.category} iconClassName="h-16 w-16" />
                    )}
                </div>
                {ad.condition && (
                    <div className="absolute top-2 left-2 flex items-center z-10 pointer-events-none">
                        <span className="bg-primary text-primary-foreground font-bold text-xs py-0.5 px-2.5 rounded-md shadow-sm border border-primary/20">
                            {ad.condition === 'new' ? 'جديد' : 'مستعمل'}
                        </span>
                    </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                    {isBoostActive && boostTier === 'gold' && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold border-none shadow-md text-xs py-0.5 px-2">
                            <Crown className="w-3.5 h-3.5 ml-1 fill-black text-black" />
                            ذهبي VIP
                        </Badge>
                    )}
                    {isBoostActive && boostTier === 'silver' && (
                        <Badge className="bg-slate-800 text-white font-bold border border-slate-600 shadow-sm text-xs py-0.5 px-2">
                            <Sparkles className="w-3 h-3 ml-1 text-yellow-400" />
                            مميز
                        </Badge>
                    )}
                    {!isBoostActive && ad.isPromoted && (
                    <Badge variant="destructive" className="bg-accent text-accent-foreground">
                        <Star className={`w-3 h-3 ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`}/>
                        {t.promoted}
                    </Badge>
                    )}

                </div>
            </CardHeader>
            <CardContent className="p-2 flex-grow flex flex-col">
                <h2 className="text-sm sm:text-base font-bold leading-snug group-hover:text-primary transition-colors text-right w-full mb-1 min-h-[2.5rem] line-clamp-2">
                    {ad.title}
                </h2>
                {/* Rating below title — Amazon/Noon style */}
                {hasRealRating && (
                    <div className="flex items-center gap-1.5 mb-1">
                        {[1,2,3,4,5].map(i => (
                            <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                    i <= Math.round(realRating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'fill-muted text-muted-foreground/30'
                                    }`}
                            />
                        ))}
                        <span className="text-xs font-bold text-amber-500">{realRating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({realReviewCount})</span>
                    </div>
                )}
                <div className="flex-grow"></div>
                <div className="flex items-center justify-between w-full text-xs mt-2 pt-2 border-t">
                    {!isStoreProduct && (
                        <div className="flex flex-col gap-1 text-muted-foreground max-w-[65%] min-w-0">
                            <div className="flex items-center gap-1 min-w-0" title={displayLocation || undefined}>
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{displayLocation || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-2xs text-muted-foreground/80 min-w-0">
                                <span className="truncate">{effectiveUser.name}</span>
                                {effectiveUser?.verified && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 shrink-0" />
                                )}
                            </div>
                        </div>
                    )}
                    {isStoreProduct && adUser?.store && (
                        <div className="flex flex-col gap-1 max-w-[60%]">
                            <div className="flex items-center gap-1.5">
                                <div 
                                   onClick={handleStoreClick}
                                   className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer truncate"
                                   style={storeColorStyle ? { backgroundColor: storeColorStyle.backgroundColor, color: storeColorStyle.textColor, borderColor: storeColorStyle.textColor } : {}}
                                >
                                    <Store className="h-3 w-3 mr-1"/>
                                    <span className="truncate">{adUser.store.storeName}</span>
                                </div>
                                {adUser?.verified && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 flex-shrink-0" />
                                )}
                            </div>
                        </div>
                    )}
                    {!!ad.price && Number(ad.price) > 0 && (
                        <div className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                            <span className="text-sm sm:text-base font-bold text-primary">
                                {currencyFormatter.format(Number(ad.price))}
                            </span>
                        </div>
                    )}
                </div>
                {isStoreProduct && adUser ? (
                    <div className="flex items-center gap-2 mt-3">
                        <Button 
                            className="flex-1 h-9" 
                            variant={isInCart ? "secondary" : "default"}
                            onClick={handleAddToCart}
                            disabled={isInCart}
                        >
                            {isInCart ? (
                                <>
                                    <ShoppingCart className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                    {t.addedToCart}
                                </>
                            ) : (
                                <>
                                    <PlusCircle className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                    {t.addToCart}
                                </>
                            )}
                        </Button>
                        {!user ? (
                          <Button 
                              size="icon"
                              variant="outline" 
                              className="h-9 w-9 rounded-full shrink-0 text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/25 shadow-xs transition-all hover:scale-110 active:scale-95 touch-manipulation"
                              aria-label={t.share}
                              onTouchStart={handleTouchStart}
                              onTouchMove={handleTouchMove}
                              onClick={(e) => {
                                  if (touchPosRef.current.moved) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    touchPosRef.current.moved = false;
                                    return;
                                  }
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAuthModalMessage('يجب تسجيل الدخول حتى تتمكن من مشاركة الإعلانات');
                                  setShowAuthModal(true);
                              }}
                          >
                              <Share2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                 <Button 
                                    size="icon"
                                    variant="outline" 
                                    className="h-9 w-9 rounded-full shrink-0 text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/25 shadow-xs transition-all hover:scale-110 active:scale-95 touch-manipulation"
                                    aria-label={t.share}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onClick={(e) => {
                                        if (touchPosRef.current.moved) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          touchPosRef.current.moved = false;
                                          return;
                                        }
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem asChild>
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${adUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                        <Facebook className="h-4 w-4 text-blue-600" />
                                        {t.facebook}
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`https://twitter.com/intent/tweet?url=${adUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                        <Twitter className="h-4 w-4" />
                                        {t.twitter}
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`https://api.whatsapp.com/send?text=${shareText}%20${adUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                        <WhatsappIcon />
                                        {t.whatsapp}
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-primary/70" />
                            <span>{(ad.views || 0).toLocaleString('en-US')} مشاهدة</span>
                        </span>
                        {!user ? (
                          <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 px-3 rounded-full text-xs font-medium text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/25 shadow-xs transition-all gap-1.5 touch-manipulation group/share hover:scale-105 active:scale-95"
                              aria-label={t.share}
                              onTouchStart={handleTouchStart}
                              onTouchMove={handleTouchMove}
                              onClick={(e) => {
                                  if (touchPosRef.current.moved) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    touchPosRef.current.moved = false;
                                    return;
                                  }
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAuthModalMessage('يجب تسجيل الدخول حتى تتمكن من مشاركة الإعلانات');
                                  setShowAuthModal(true);
                              }}
                          >
                              <span className="w-5 h-5 rounded-full bg-primary/20 group-hover/share:bg-white/20 flex items-center justify-center transition-colors">
                                  <Share2 className="w-3 h-3 text-primary group-hover/share:text-white transition-colors" />
                              </span>
                              <span>مشاركة</span>
                          </Button>
                        ) : (
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                 <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 px-3 rounded-full text-xs font-medium text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/25 shadow-xs transition-all gap-1.5 touch-manipulation group/share hover:scale-105 active:scale-95"
                                    aria-label={t.share}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onClick={(e) => {
                                        if (touchPosRef.current.moved) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          touchPosRef.current.moved = false;
                                          return;
                                        }
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    <span className="w-5 h-5 rounded-full bg-primary/20 group-hover/share:bg-white/20 flex items-center justify-center transition-colors">
                                        <Share2 className="w-3 h-3 text-primary group-hover/share:text-white transition-colors" />
                                    </span>
                                    <span>مشاركة</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem asChild>
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${adUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                        <Facebook className="h-4 w-4 text-blue-600" />
                                        {t.facebook}
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`https://twitter.com/intent/tweet?url=${adUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                        <Twitter className="h-4 w-4" />
                                        {t.twitter}
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`https://api.whatsapp.com/send?text=${shareText}%20${adUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                        <WhatsappIcon />
                                        {t.whatsapp}
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
        <RequireAuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          message={authModalMessage} 
        />
    </Link>
  );
}

export default memo(AdCard);
