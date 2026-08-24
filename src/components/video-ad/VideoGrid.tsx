'use client';

import { Ad } from '@/lib/types';
import { Film, PlayCircle, MapPin, User, Calendar } from 'lucide-react';
import { cn, resolveThumbnail, getTimeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VideoGridProps {
  shortsAds: Ad[];
  regularAds: Ad[];
  onVideoClick: (adId: string) => void;
}

export default function VideoGrid({ shortsAds, regularAds, onVideoClick }: VideoGridProps) {


  return (
    <div className="flex flex-col gap-10">
      
      {/* 1. SHORTS SHELF */}
      {shortsAds.length > 0 && (
        <div className="w-full relative px-4 md:px-8 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-2 mb-4">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/f/fc/Youtube_shorts_icon.svg" className="w-6 h-6" alt="Shorts" />
                 <h2 className="text-xl font-bold text-foreground">فيديوهات قصيرة</h2>
             </div>
             
             {/* Horizontal Scroll Container */}
             <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory">
                 {shortsAds.map((ad) => {
                    const thumb = resolveThumbnail(ad);
                    return (
                        <div 
                           key={ad.id}
                           onClick={() => onVideoClick(ad.id)}
                           className={cn(
                               "shrink-0 w-[160px] md:w-[200px] aspect-[9/16] rounded-xl overflow-hidden relative cursor-pointer snap-start group shadow-sm transition-all hover:-translate-y-1",
                               ad.isPremium ? "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]" : "bg-secondary/50 ring-1 ring-border hover:ring-primary/50"
                           )}
                        >
                            {thumb ? (
                                <img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={ad.title} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border-2 border-dashed border-white/5">
                                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                       <Film className="w-6 h-6 text-primary" />
                                   </div>
                                   <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest text-center px-2">إعلان فيديو</span>
                                </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            
                            {/* Overlay Play Icon */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20">
                                <PlayCircle className="w-10 h-10 text-white" />
                            </div>

                            {/* Info */}
                            <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
                                {ad.isPremium && (
                                   <Badge variant="secondary" className="bg-yellow-400 text-black text-[9px] w-fit font-black border-none px-1.5 h-4">ممول 👑</Badge>
                                )}
                                <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight drop-shadow-md">{ad.title}</h3>
                                <span className="text-white/70 text-xs">{ad.user?.name || 'سوق العرب'}</span>
                            </div>
                        </div>
                    );
                 })}
             </div>
        </div>
      )}

      {/* 2. REGULAR VIDEOS GRID */}
      {regularAds.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-10 gap-x-4 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {regularAds.map((ad) => {
              const thumb = resolveThumbnail(ad);
              return (
                <div 
                  key={ad.id} 
                  onClick={() => onVideoClick(ad.id)}
                  className="group cursor-pointer flex flex-col gap-3 relative"
                >
                  {/* Thumbnail Container */}
                  <div className={cn(
                      "relative aspect-video rounded-xl overflow-hidden transition-all duration-300 group-hover:rounded-none group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]",
                      ad.isPremium ? "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)] group-hover:ring-yellow-500" : "bg-secondary/50 ring-1 ring-border group-hover:ring-primary/50"
                  )}>
                    {thumb ? (
                      <img 
                        src={thumb} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        alt={ad.title} 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border-2 border-dashed border-white/5 relative group-hover:bg-primary/5 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
                           <Film className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-1">إعلان فيديو</p>
                          <p className="text-[10px] text-muted-foreground">لا يتوفر عرض مسبق</p>
                        </div>
                        {/* Abstract Decorative Elements */}
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary/20" />
                        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-primary/20" />
                      </div>
                    )}
                    
                    {/* Overlay elements */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-primary/90 p-3 rounded-full blur-none scale-90 group-hover:scale-100 transition-transform shadow-xl">
                         <PlayCircle className="w-8 h-8 text-white stroke-[1.5]" />
                      </div>
                    </div>

                    {/* Bottom Right Duration/Category Placeholder */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-black text-white border border-white/20">
                       {ad.category || 'عام'}
                    </div>

                    {/* Premium Top Let Badge */}
                    {ad.isPremium && (
                        <div className="absolute top-2 left-2">
                           <Badge variant="secondary" className="bg-yellow-400 text-black text-[10px] shadow-lg font-black border-none px-2 h-5 animate-pulse">ممول 👑</Badge>
                        </div>
                    )}
                  </div>

                  {/* Meta Content */}
                  <div className="flex gap-3 px-1">
                     <div className="shrink-0 pt-0.5">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-border group-hover:border-primary/50 transition-colors overflow-hidden">
                           {ad.user?.avatarUrl ? (
                               <img src={ad.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                           ) : (
                               <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                           )}
                        </div>
                     </div>
                     
                     <div className="flex flex-col gap-1 overflow-hidden">
                       <h3 className="text-foreground font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors text-sm lg:text-base">
                         {ad.title}
                       </h3>
                       <div className="flex flex-col text-[13px] text-muted-foreground">
                         <span className="hover:text-foreground transition-colors">{ad.user?.name || 'سوق العرب'}</span>
                         <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                           <span className="flex items-center gap-0.5">
                               <MapPin className="w-3 h-3 text-primary" />
                                {[ad.governorate || ad.province, ad.city || ad.village].filter(Boolean).join('، ') || ad.location || ad.city || ad.governorate || ''} 
                            </span>
                           <span className="w-1 h-1 rounded-full bg-border" />
                           <span className="flex items-center gap-0.5">
                               <Calendar className="w-3 h-3" />
                               {getTimeAgo(ad)}
                           </span>
                         </div>
                       </div>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
      )}
      
      {/* Hide Scrollbar style for shorts shelf */}
      <style>{`
         .hide-scrollbar::-webkit-scrollbar { display: none; }
         .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
