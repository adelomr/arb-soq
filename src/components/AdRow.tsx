'use client';

// استيراد الأنواع المطلوبة والمكونات اللازمة
import type { Ad } from '@/lib/types';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Tag, Star, Sparkles, Wrench, Handshake, ImageIcon, Calendar, Share2, Facebook, Twitter, Eye } from 'lucide-react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { safeParseDate } from '@/lib/utils';
import { memo, useState, useRef } from 'react';
import AdPlaceholder from '@/components/AdPlaceholder';
import RequireAuthModal from '@/components/RequireAuthModal';
import { isPhysicalGoodsCategory } from '@/lib/category-utils';


const WhatsappIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
    <path fill="currentColor" d="M16.75 13.96c.25.13.43.2.5.28.08.08.13.18.15.25.03.08.03.15.03.18 0 .03-.03.05-.03.08-.02.02-.03.05-.05.07-.02.02-.05.05-.07.07-.02.02-.05.03-.07.05-.02.02-.05.05-.08.07-.03.02-.05.05-.08.07-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.1.08c-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.12.08c-.03.03-.07.05-.12.08-.05.03-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.03-.15.05-.05.02-.1.03-.15.05-.05.02-.1.03-.17.05-.07.02-.13.03-.2.05-.07.02-.15.03-.22.05-.07.02-.15.03-.22.05-.07.02-.15.03-.23.03-.08 0-.17-.02-.25-.03-.08-.02-.17-.03-.25-.05-.08-.02-.17-.03-.25-.05-.08-.02-.17-.05-.25-.07-.08-.02-.17-.05-.25-.08-.08-.03-.17-.05-.25-.08-.08-.03-.17-.07-.25-.1-.08-.03-.17-.07-.25-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.22-.1-.07-.03-.13-.07-.2-.1-.03-.02-.05-.03-.07-.05-.43-.2-1.03-.48-1.7-1.15-.65-.65-1.03-1.4-1.1-1.58-.02-.03-.03-.07-.05-.1-.02-.03-.03-.07-.05-.1v-.1c0-.02.02-.03.03-.05.02-.02.03-.03.05-.05.02-.02.05-.03.08-.05.03-.02.07-.03.1-.05.03-.02.07-.03.1-.05.03-.02.05-.03.08-.05.03-.02.05-.03.08-.05.03-.02.05-.03.07-.03.02 0 .05-.02.07-.02.02 0 .05-.02.07-.02.02 0 .05 0 .07.02.02 0 .05.02.07.03.02.02.05.03.07.05.02.02.05.05.07.07l.08.08c.03.03.05.05.07.08.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.05.05.08.02.03.03.05.05.08.02.03.03.05.05.08.03.05.05.08.07.12.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.07.05.1s.05.07.07.1c.02.03.05.07.07.1.02.03.05.07.07.1.02.03.05.07.07.1.07.12.18.23.32.33.13.1.28.18.43.25.15.07.3.12.45.15.15.03.3.05.45.05.15 0 .3-.02.45-.05.15-.03.3-.08.45-.15.15-.07.28-.15.42-.25.13-.1.25-.2.35-.33.05-.05.1-.12.13-.2.03-.08.05-.17.05-.25s-.02-.17-.05-.25c-.03-.08-.08-.15-.13-.2-.1-.1-.2-.18-.32-.25-.12-.08-.25-.13-.4-.18-.13-.05-.27-.08-.4-.08-.13 0-.27.03-.4.08s-.25.13-.38.2c-.12.08-.23.15-.35.23-.12.08-.23.17-.33.25-.1.08-.2.17-.28.25-.08.08-.15.17-.22.25-.07.08-.13.17-.18.25-.05.08-.1.17-.12.25-.02.08-.03.17-.03.25s.02.17.03.25c.02.08.05.15.08.22.03.07.08.13.12.18.05.05.1.1.15.15.05.05.1.1.15.15l.15.12c.05.03.1.07.15.1.05.03.1.07.15.1.05.03.1.07.15.1.1.07.2.13.3.18.1.05.2.1.3.15.1.05.2.1.3.15.2.1.2.18.2.25V12c0-2.1-1.2-3.96-3-4.9.15-.3.23-.62.23-.95 0-.75-.4-1.4-1.03-1.75.28-.43.43-.93.43-1.45 0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 .52.15 1.02.43 1.45-.63.35-1.03 1-1.03 1.75 0 .33.08.65.23.95-1.8 1-3 2.8-3 4.9v.05c0 .07.02.13.05.18.1.05.2.1.3.15s.2.1.3.15c.1.05.2.1.3.15.1.05.2.08.3.13.1.05.2.1.3.15.1.05.2.1.3.15.08.05.15.1.22.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15l.38.22c.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.05.2.08.07.03.13.05.2.08.07.03.13.05.2.08.13.05.27.08.4.1.13.03.27.03.4 0 .13-.02.27-.03.4-.02.13-.05.27-.08.4-.03.13-.08.25-.13.38-.05.12-.1.25-.18.38-.08.12-.17.23-.25.33-.08.1-.18.2-.28.28-.1.08-.2.17-.3.25-.1.08-.2.17-.3.25-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23l-.3.23c-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.15.15-.28.3-.4.45-.12.15-.22.3-.3.45-.08.15-.13.3-.15.45-.02.15-.03.3-.03.45s.02.3.03.45c.02.15.07.3.15.45.08.15.18.3.3.45.12.15.25.3.4.45.15.15.3.28.45.42.15.13.3.25.45.35.15.1.32.18.5.23.18.05.37.08.55.08.18 0 .37-.03.55-.08.18-.05.35-.13.5-.23.15-.1.3-.22.45-.35.15-.13.28-.28.42-.42.13-.15.25-.3.35-.45.1-.15.18-.3.23-.45.05-.15.08-.3.08-.45s-.03-.3-.08-.45c-.05-.15-.13-.3-.23-.45-.1-.15-.22-.3-.35-.45s-.28-.28-.42-.42c-.15-.13-.3-.25-.45-.38-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35l-.23-.17c-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33l-.2-.17c-.15-.12-.28-.23-.4-.35-.12-.12-.23-.23-.33-.35-.1-.1-.2-.2-.28-.3-.08-.1-.17-.2-.25-.28-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25l-.25-.25c-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25l-.45-.5c-.08-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25l-.22-.25c-.07-.08-.15-.17-.22-.25L3.83 6.08l-.22-.25c-.07-.08-.15-.17-.22-.25C3.3 5.5 3.22 5.4 3.14 5.33c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23l-.25-.25c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23C1.6 3.9 1.5 3.82 1.43 3.73c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25L0 2.7l-.22-.25c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25C12.5.02 12.25 0 12 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.63 0 12-5.37 12-12v-.08c-.03-.08-.05-.15-.08-.22-.03-.07-.05-.13-.08-.2Z" />
  </svg>
)

const translations = {
  ar: {
    promoted: 'مميز',
    service: 'خدمة',
    requested: 'مطلوب',
    negotiable: 'حسب الاتفاق',
    onDemand: 'السعر عند الطلب',
    share: 'مشاركة',
    linkCopied: 'تم نسخ الرابط!',
    facebook: 'فيسبوك',
    twitter: 'تويتر',
    whatsapp: 'واتساب',
  },
}

type AdRowProps = {
  ad: Ad;
  priority?: boolean;
};

function AdRow({ ad, priority = false }: AdRowProps) {
  const { market } = useMarket();
  const { incrementAdClick, getUserById, user } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  const t = translations.ar;
  const direction = 'rtl';
  const dateLocale = ar;

  const adUrl = typeof window !== 'undefined' ? `${window.location.origin}/ad/${ad.userId}/${ad.id}` : '';
  const shareText = encodeURIComponent(ad.title);

  const currencyFormatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: market.currency,
    maximumFractionDigits: 0,
    numberingSystem: 'latn' // Force Latin numerals
  });

  const hasImage = ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0];

  const realRating = (ad as any).rating || 0;
  const realReviewCount = (ad as any).reviewCount || 0;
  const hasRealRating = realRating > 0 && realReviewCount > 0;

  const effectiveUserId = ad.userId || ad.user?.id || 'owner';

  return (
    <Link href={`/ad/${effectiveUserId}/${ad.id}`} className="block group" onClick={() => incrementAdClick(ad)}>
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/50 flex flex-col md:flex-row h-full">
        <div className="md:w-1/3 relative aspect-[4/3] md:aspect-auto">
          {hasImage ? (
            <Image
              src={ad.imageUrls[0]}
              alt={ad.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <AdPlaceholder category={ad.category} />
          )}
          {ad.isPromoted && (
            <Badge className="bg-primary text-primary-foreground font-bold border border-primary/20 shadow-sm text-xs py-0.5 px-2 absolute top-2 right-2 z-10 flex items-center gap-1">
              <Sparkles className="w-3 h-3 ml-1 text-primary-foreground" />
              {t.promoted}
            </Badge>
          )}
        </div>

        <div className="p-4 flex flex-col justify-between flex-1">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">{ad.category}</Badge>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {(ad as any).isService && <Badge variant="secondary" className="gap-1"><Wrench className="w-3 h-3" />{t.service}</Badge>}
              {(ad as any).isRequested && <Badge variant="secondary" className="gap-1"><Handshake className="w-3 h-3" />{t.requested}</Badge>}
            </div>
          </div>

          <h3 className="font-semibold font-headline text-lg group-hover:text-primary transition-colors line-clamp-1 mb-2">
            {ad.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {ad.description}
          </p>

          {hasRealRating && (
            <div className="flex items-center gap-1 mb-2" dir="rtl">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(realRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground/30'
                    }`}
                />
              ))}
              <span className="text-xs font-bold text-amber-500">{realRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({realReviewCount})</span>
            </div>
          )}

          <div className="flex items-center justify-between w-full mt-auto text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
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
                  setShowAuthModal(true);
                }}
              >
                <span className="w-5 h-5 rounded-full bg-primary/20 group-hover/share:bg-white/20 flex items-center justify-center transition-colors">
                  <Share2 className="w-3 h-3 text-primary group-hover/share:text-white transition-colors" />
                </span>
                <span>{t.share}</span>
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
                    <span>{t.share}</span>
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

            <div className="flex flex-col items-end gap-1">
              {!!ad.price && Number(ad.price) > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  <span className="text-lg font-bold text-primary">
                    {currencyFormatter.format(Number(ad.price))}
                  </span>
                </div>
              )}
              {isPhysicalGoodsCategory(ad.category, (ad as any).categoryName || (ad as any).subcategory) && ad.condition && (
                <span className="text-xs font-semibold text-muted-foreground">
                  الحالة/ {ad.condition === 'new' ? 'جديد' : 'مستعمل'}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
      <RequireAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="يجب تسجيل الدخول حتى تتمكن من مشاركة الإعلان"
      />
    </Link>
  );
}

export default memo(AdRow);
