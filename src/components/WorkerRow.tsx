'use client';

import type { UserProfile } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from './ui/separator';

const translations = {
  ar: {
    noRating: "لا يوجد تقييم",
    reviews: "مراجعات",
  },
};

type WorkerRowProps = {
    worker: UserProfile;
};

export default function WorkerRow({ worker }: WorkerRowProps) {
  const t = translations.ar;
  const { professions } = useAuth();

  if (!worker) return null;

  const professionName = professions.find(p => p.id === worker.profession)?.name.ar || worker.profession;
  const displayAddress = [worker.city, worker.country].filter(Boolean).join(', ');
  const displayName = worker.name.split(' ').slice(0, 3).join(' ');

  return (
    <Link href={`/worker/${worker.id}`} className="block group w-full">
      <Card className="overflow-hidden w-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 p-4">
        <div className="flex items-center justify-between w-full" dir="rtl">
          
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20 shrink-0">
                <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                <AvatarFallback className="text-2xl">{worker.name?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-right">
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              <div className="flex items-center justify-end gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{professionName}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-end gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{displayAddress}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center shrink-0">
            {worker.rating && worker.reviewCount && worker.reviewCount > 0 ? (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-5 w-5 ${i < Math.round(worker.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}/>
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({worker.reviewCount})</span>
                </div>
            ) : (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-muted-foreground/30" />
                                ))}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t.noRating}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>

        </div>
      </Card>
    </Link>
  );
}
