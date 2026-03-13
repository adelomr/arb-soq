
'use client';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Store } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from './ui/badge';

const translations = {
    ar: {
        store: 'متجر',
        viewStore: 'عرض المتجر',
    },
    en: {
        store: 'Store',
        viewStore: 'View Store',
    }
}

type StoreCardProps = {
  store: UserProfile;
};

export default function StoreCard({ store }: StoreCardProps) {
  const { language, direction } = useLanguage();
  const t = translations[language];

  if (!store.store) return null;

  return (
    <Link href={`/store/${store.id}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative">
          <Image
            src={store.store.coverImageUrl && store.store.coverImageUrl.trim() !== '' ? store.store.coverImageUrl : '/placeholder.png'}
            alt={store.store.storeName}
            width={600}
            height={400}
            className="w-full h-40 object-cover"
            data-ai-hint="store cover"
          />
           <Badge variant="secondary" className="absolute top-2 right-2 bg-green-600 text-white">
                <Store className={`w-3 h-3 ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`} /> {t.store}
            </Badge>
        </div>
        <CardContent className="p-4 flex-grow">
            <div className="flex items-center gap-3 mb-3">
                 <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={store.avatarUrl} alt={store.store.storeName} />
                    <AvatarFallback>{store.store.storeName?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                        {store.store.storeName}
                    </h3>
                     <p className="text-sm text-muted-foreground">{store.name}</p>
                </div>
            </div>
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <MapPin className="w-4 h-4" />
            <span>{store.address}</span>
          </div>
        </CardContent>
        <CardFooter className="p-3 bg-secondary/20 flex items-center justify-between">
            {store.rating !== undefined && store.reviewCount !== undefined && store.reviewCount > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500"/>
                    <span className="font-bold">{store.rating.toFixed(1)}</span>
                    <span>({store.reviewCount})</span>
                </div>
            )}
             <span className="text-sm font-semibold text-primary">{t.viewStore} &rarr;</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
