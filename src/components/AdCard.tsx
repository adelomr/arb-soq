
'use client';
import type { Ad, UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Tag, Star, Wrench, Handshake, ShoppingCart, PlusCircle, Store, Share2, Facebook, Twitter, ImageIcon, Eye, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { navTranslations } from './Header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdPlaceholder from '@/components/AdPlaceholder';

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
  const { getUserById, incrementAdClick } = useAuth();
  const { addToCart, cart } = useCart();
  const { toast } = useToast();
  const [adUser, setAdUser] = useState(ad.user);
  const router = useRouter();
  
  const adUrl = typeof window !== 'undefined' ? `${window.location.origin}/ad/${ad.userId}/${ad.id}` : '';
  const shareText = encodeURIComponent(ad.title);

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

  const realRating = ad.rating;
  const realReviewCount = ad.reviewCount;
  const hasRealRating = typeof realRating === 'number' && realRating > 0 && typeof realReviewCount === 'number' && realReviewCount > 0;

  const effectiveUserId = ad.userId || ad.user?.id || 'owner';
  const effectiveUser = adUser || ad.user || { id: effectiveUserId, name: 'مستخدم سوق العرب' };

  return (
    <Link href={`/ad/${effectiveUserId}/${ad.id}`} className="block group h-full" onClick={() => incrementAdClick(ad)}>
        <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
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
                <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
                    {ad.isPromoted && (
                    <Badge variant="destructive" className="bg-accent text-accent-foreground">
                        <Star className={`w-3 h-3 ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`}/>
                        {t.promoted}
                    </Badge>
                    )}
                    {ad.adType === 'sell-service' && (
                    <Badge variant="secondary" className="bg-blue-500 text-white">
                        <Wrench className={`w-3 h-3 ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`}/>
                        {t.service}
                    </Badge>
                    )}
                    {ad.adType === 'request-service' && (
                    <Badge variant="secondary" className="bg-purple-500 text-white">
                        <Handshake className={`w-3 h-3 ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`}/>
                        {t.requested}
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
                        <div className="flex flex-col gap-1 text-muted-foreground max-w-[60%]">
                            <div className="flex items-center gap-1 flex-wrap">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[100px]">{ad.location}</span>
                                {ad.country && (
                                    <span className="text-2xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary mr-1">
                                        {ad.country}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-2xs text-muted-foreground/80">
                                <span className="truncate max-w-[80px]">{effectiveUser.name}</span>
                                {effectiveUser?.verified && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                                )}
                                <span className="mx-1">•</span>
                                <Eye className="w-3 h-3 text-muted-foreground/75" />
                                <span>{ad.views || 0}</span>
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
                            <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                                <Eye className="w-3.5 h-3.5 text-muted-foreground/75" />
                                <span>{ad.views || 0}</span>
                            </div>
                        </div>
                    )}
                    {!!ad.price && Number(ad.price) > 0 && (
                        <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4 text-primary" />
                            <span className="text-md font-bold text-primary">
                                {currencyFormatter.format(Number(ad.price))}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                    {isStoreProduct && adUser && (
                        <Button 
                            className="w-full h-9" 
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
                    )}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button 
                                className="w-full h-9"
                                variant="outline" 
                                aria-label={t.share}
                                onClick={(e) => e.preventDefault()}
                            >
                                <Share2 className={`w-4 h-4 ${!isStoreProduct && (direction === 'rtl' ? 'ml-2' : 'mr-2')}`} />
                                <span className="mx-2 text-xs">{t.share}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem asChild>
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${adUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                    <Facebook className="h-4 w-4" />
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
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}

export default memo(AdCard);
