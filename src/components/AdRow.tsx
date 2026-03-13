
'use client';

// استيراد الأنواع المطلوبة والمكونات اللازمة
import type { Ad } from '@/lib/types';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Tag, Star, Wrench, Handshake, ImageIcon, Calendar, Share2, Facebook, Twitter } from 'lucide-react';
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


const WhatsappIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
      <path fill="currentColor" d="M16.75 13.96c.25.13.43.2.5.28.08.08.13.18.15.25.03.08.03.15.03.18 0 .03-.03.05-.03.08-.02.02-.03.05-.05.07-.02.02-.05.05-.07.07-.02.02-.05.03-.07.05-.02.02-.05.05-.08.07-.03.02-.05.05-.08.07-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.1.08c-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08-.03.03-.07.05-.1.08l-.12.08c-.03.03-.07.05-.12.08-.05.03-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.05-.15.07-.05.02-.1.03-.15.05-.05.02-.1.03-.15.05-.05.02-.1.03-.17.05-.07.02-.13.03-.2.05-.07.02-.15.03-.22.05-.07.02-.15.03-.22.05-.07.02-.15.03-.23.03-.08 0-.17-.02-.25-.03-.08-.02-.17-.03-.25-.05-.08-.02-.17-.03-.25-.05-.08-.02-.17-.05-.25-.07-.08-.02-.17-.05-.25-.08-.08-.03-.17-.05-.25-.08-.08-.03-.17-.07-.25-.1-.08-.03-.17-.07-.25-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.23-.1-.08-.03-.15-.07-.22-.1-.07-.03-.13-.07-.2-.1-.03-.02-.05-.03-.07-.05-.43-.2-1.03-.48-1.7-1.15-.65-.65-1.03-1.4-1.1-1.58-.02-.03-.03-.07-.05-.1-.02-.03-.03-.07-.05-.1v-.1c0-.02.02-.03.03-.05.02-.02.03-.03.05-.05.02-.02.05-.03.08-.05.03-.02.07-.03.1-.05.03-.02.07-.03.1-.05.03-.02.05-.03.08-.05.03-.02.05-.03.08-.05.03-.02.05-.03.07-.03.02 0 .05-.02.07-.02.02 0 .05-.02.07-.02.02 0 .05 0 .07.02.02 0 .05.02.07.03.02.02.05.03.07.05.02.02.05.05.07.07l.08.08c.03.03.05.05.07.08.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.05.05.08.02.03.03.05.05.08.02.03.03.05.05.08.03.05.05.08.07.12.02.03.03.07.05.1.02.03.03.07.05.1.02.03.03.07.05.1s.05.07.07.1c.02.03.05.07.07.1.02.03.05.07.07.1.02.03.05.07.07.1.07.12.18.23.32.33.13.1.28.18.43.25.15.07.3.12.45.15.15.03.3.05.45.05.15 0 .3-.02.45-.05.15-.03.3-.08.45-.15.15-.07.28-.15.42-.25.13-.1.25-.2.35-.33.05-.05.1-.12.13-.2.03-.08.05-.17.05-.25s-.02-.17-.05-.25c-.03-.08-.08-.15-.13-.2-.1-.1-.2-.18-.32-.25-.12-.08-.25-.13-.4-.18-.13-.05-.27-.08-.4-.08-.13 0-.27.03-.4.08s-.25.13-.38.2c-.12.08-.23.15-.35.23-.12.08-.23.17-.33.25-.1.08-.2.17-.28.25-.08.08-.15.17-.22.25-.07.08-.13.17-.18.25-.05.08-.1.17-.12.25-.02.08-.03.17-.03.25s.02.17.03.25c.02.08.05.15.08.22.03.07.08.13.12.18.05.05.1.1.15.15.05.05.1.1.15.15l.15.12c.05.03.1.07.15.1.05.03.1.07.15.1.05.03.1.07.15.1.1.07.2.13.3.18.1.05.2.1.3.15.1.05.2.1.3.15.2.1.2.18.2.25V12c0-2.1-1.2-3.96-3-4.9.15-.3.23-.62.23-.95 0-.75-.4-1.4-1.03-1.75.28-.43.43-.93.43-1.45 0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 .52.15 1.02.43 1.45-.63.35-1.03 1-1.03 1.75 0 .33.08.65.23.95-1.8 1-3 2.8-3 4.9v.05c0 .07.02.13.05.18.1.05.2.1.3.15s.2.1.3.15c.1.05.2.1.3.15.1.05.2.08.3.13.1.05.2.1.3.15.1.05.2.1.3.15.08.05.15.1.22.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15.07.05.13.1.2.15l.38.22c.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.07.2.1.07.03.13.05.2.08.07.03.13.05.2.08.07.03.13.05.2.08.13.05.27.08.4.1.13.03.27.03.4 0 .13-.02.27-.03.4-.02.13-.05.27-.08.4-.03.13-.08.25-.13.38-.05.12-.1.25-.18.38-.08.12-.17.23-.25.33-.08.1-.18.2-.28.28-.1.08-.2.17-.3.25-.1.08-.2.17-.3.25-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23l-.3.23c-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.08-.2.15-.3.23-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.1.07-.2.13-.3.2-.15.15-.28.3-.4.45-.12.15-.22.3-.3.45-.08.15-.13.3-.15.45-.02.15-.03.3-.03.45s.02.3.03.45c.02.15.07.3.15.45.08.15.18.3.3.45.12.15.25.3.4.45.15.15.3.28.45.42.15.13.3.25.45.35.15.1.32.18.5.23.18.05.37.08.55.08.18 0 .37-.03.55-.08.18-.05.35-.13.5-.23.15-.1.3-.22.45-.35.15-.13.28-.28.42-.42.13-.15.25-.3.35-.45.1-.15.18-.3.23-.45.05-.15.08-.3.08-.45s-.03-.3-.08-.45c-.05-.15-.13-.3-.23-.45-.1-.15-.22-.3-.35-.45s-.28-.28-.42-.42c-.15-.13-.3-.25-.45-.38-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35l-.23-.17c-.15-.12-.3-.23-.45-.35-.15-.12-.3-.23-.45-.35-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33-.15-.12-.3-.22-.45-.33l-.22-.18c-.15-.12-.3-.22-.45-.33l-.2-.17c-.15-.12-.28-.23-.4-.35-.12-.12-.23-.23-.33-.35-.1-.1-.2-.2-.28-.3-.08-.1-.17-.2-.25-.28-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25l-.25-.25c-.08-.08-.17-.17-.25-.25-.08-.08-.17-.17-.25-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25-.08-.08-.15-.17-.23-.25l-.45-.5c-.08-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25l-.22-.25c-.07-.08-.15-.17-.22-.25L3.83 6.08l-.22-.25c-.07-.08-.15-.17-.22-.25C3.3 5.5 3.22 5.4 3.14 5.33c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23l-.25-.25c-.08-.08-.17-.15-.25-.23-.08-.08-.17-.15-.25-.23C1.6 3.9 1.5 3.82 1.43 3.73c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25L0 2.7l-.22-.25c-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25-.07-.08-.15-.17-.22-.25C12.5.02 12.25 0 12 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.63 0 12-5.37 12-12v-.08c-.03-.08-.05-.15-.08-.22-.03-.07-.05-.13-.08-.2Z"/>
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
};

export default function AdRow({ ad }: AdRowProps) {
  const { market } = useMarket();
  const { incrementAdClick, getUserById } = useAuth();
  const { toast } = useToast();
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

  return (
    <Link href={`/ad/${ad.userId}/${ad.id}`} className="block group" onClick={() => incrementAdClick(ad)}>
      <Card className="flex flex-col sm:flex-row overflow-hidden h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50">
        <div className="sm:w-1/3 md:w-1/4 relative bg-muted">
          <div className="aspect-video sm:aspect-square w-full h-full">
             {hasImage ? (
                <Image
                    src={ad.imageUrls[0]}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    data-ai-hint={ad.imageHints ? ad.imageHints[0] : ''}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors text-right w-full">
              {ad.title}
            </h3>
            {ad.isPromoted && (
              <Badge variant="destructive" className="bg-accent text-accent-foreground text-xs flex-shrink-0">
                <Star className={`w-3 h-3 ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`}/>
                {t.promoted}
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-muted-foreground mt-auto pt-2 gap-y-2">
             <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={ad.user?.avatarUrl} alt={ad.user?.name} />
                    <AvatarFallback>{ad.user?.name?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate">{ad.user?.name}</span>
             </div>
             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(ad.postedAt), { addSuffix: true, locale: dateLocale })}</span>
             </div>
             <div className="flex items-center gap-2">
                 <MapPin className="w-4 h-4" />
                <span>{ad.location}</span>
             </div>
          </div>
          
          <Separator className="my-4"/>

          <div className="flex items-center justify-between w-full mt-auto">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        aria-label={t.share}
                        onClick={(e) => e.preventDefault()}
                    >
                        <Share2 className="w-4 h-4" />
                        <span className="mx-2">{t.share}</span>
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
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-primary">
                {ad.price !== undefined ? currencyFormatter.format(ad.price) : (ad.adType === 'request-service' ? t.negotiable : t.onDemand)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
