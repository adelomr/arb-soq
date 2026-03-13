
'use client';

import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useAuth } from '@/context/AuthContext';

const translations = {
  ar: {
    noRating: "لا يوجد تقييم",
    reviews: "مراجعات",
  },
};


type WorkerCardProps = {
    worker: UserProfile;
};


export default function WorkerCard({ worker }: WorkerCardProps) {
  const { professions } = useAuth();
  const t = translations.ar;

  if (!worker) return null;

  const professionName = professions.find(p => p.id === worker.profession)?.name.ar || worker.profession;
  const displayAddress = [worker.city, worker.country].filter(Boolean).join(', ');
  const displayName = worker.name.split(' ').slice(0, 3).join(' ');
  
  return (
    <Link href={`/worker/${worker.id}`} className="block group h-full">
      <Card className="p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/50 h-full flex flex-col text-center">
        <CardContent className="p-0 flex-1 flex flex-col items-center gap-3" dir='rtl'>
          <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={worker.avatarUrl} alt={worker.name} />
              <AvatarFallback className="text-3xl">{worker.name?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-center justify-center pt-2">
            {worker.rating && worker.reviewCount && worker.reviewCount > 0 ? (
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.round(worker.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}/>
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">({worker.reviewCount})</span>
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

          <div className="flex-1">
              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                  {displayName}
              </h3>
              <div dir="rtl">
                <Badge variant="secondary" className="gap-2 mt-2 text-base">
                    <Briefcase className="w-4 h-4" />
                    {professionName}
                </Badge>
              </div>
          </div>
        </CardContent>
        <CardFooter className="p-0 flex-col items-start w-full mt-3">
          <Separator className="my-3"/>
          <div className="flex items-center gap-2 text-sm text-muted-foreground w-full justify-center" dir='rtl'>
            <MapPin className="w-4 h-4 text-primary" />
            <span className="truncate">{displayAddress}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
