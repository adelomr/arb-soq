
'use client';
import type { Ad } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Handshake, Wrench, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';
import { Badge } from './ui/badge';

const t = {
    startingFrom: 'تبدأ من',
    negotiable: 'حسب الاتفاق',
    request: 'طلب خدمة',
    offer: 'عرض خدمة',
};

type ServiceCardProps = {
  service: Ad;
};

export default function ServiceCard({ service }: ServiceCardProps) {
  const { market } = useMarket();

  const currencyFormatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: market.currency,
    maximumFractionDigits: 0,
    numberingSystem: 'latn' // Force Latin numerals
  });
  
  const hasImage = service.imageUrls && service.imageUrls.length > 0 && service.imageUrls[0];

  return (
    <Link href={`/ad/${service.user.id}/${service.id}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative bg-muted">
          {hasImage ? (
            <Image
              src={service.imageUrls[0]}
              alt={service.title}
              width={600}
              height={400}
              className="w-full h-40 object-contain"
              data-ai-hint={service.imageHints ? service.imageHints[0] : ''}
            />
          ) : (
             <div className="w-full h-40 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <Badge variant="secondary" className={`absolute top-2 right-2 ${service.adType === 'request-service' ? 'bg-purple-500' : 'bg-blue-500'} text-white`}>
            {service.adType === 'request-service' ? (
                <>
                    <Handshake className="ml-1 w-3 h-3" /> {t.request}
                </>
            ) : (
                <>
                    <Wrench className="ml-1 w-3 h-3" /> {t.offer}
                </>
            )}
          </Badge>
        </div>
        <CardContent className="p-4 flex-grow">
          <p className="text-base font-bold mb-2 h-12 leading-tight group-hover:text-primary transition-colors">
            {service.title}
          </p>
        </CardContent>
        <CardFooter className="p-3 bg-secondary/20 flex flex-col items-start gap-3">
             <div className="flex items-center gap-2 text-sm w-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={service.user.avatarUrl} alt={service.user.name} />
                    <AvatarFallback>{service.user.name?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold truncate">{service.user.name}</p>
                    {service.user.rating && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500"/>
                            <span className="font-bold">{service.user.rating.toFixed(1)}</span>
                            <span>({service.user.reviewCount})</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full h-px bg-border"></div>
            <div className="flex items-center justify-end w-full text-sm">
                <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase">{t.startingFrom}</p>
                    <p className="text-base font-bold text-primary">
                        {service.price !== undefined ? currencyFormatter.format(service.price) : t.negotiable}
                    </p>
                </div>
            </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
