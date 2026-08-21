'use client';

import { Ad } from '@/lib/types';
import { X, ExternalLink, User, MapPin, Calendar, Phone, Share2, PlayCircle, Film, Download, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn, formatWhatsAppNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import RequireAuthModal from '@/components/RequireAuthModal';

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
)
const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
)
const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
)

import { resolveThumbnail, getTimeAgo } from '@/lib/utils';

interface RegularVideoPlayerProps {
  ad: Ad;
  onClose?: () => void;
  relatedAds: Ad[];
  onAdSelect?: (adId: string) => void;
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
}

import CategoryTicker from './CategoryTicker';

export default function RegularVideoPlayer({ ad, onClose, relatedAds, onAdSelect, selectedCategory, onCategorySelect }: RegularVideoPlayerProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const videoUrlRaw = (ad.videoUrl || '').trim();
  const isYouTube = videoUrlRaw.includes('youtube.com') || videoUrlRaw.includes('youtu.be');
  const isFacebook = videoUrlRaw.includes('facebook') || videoUrlRaw.includes('fb.watch');
  const isTikTok = videoUrlRaw.includes('tiktok.com');
  const isInstagram = videoUrlRaw.includes('instagram.com');
  const isExternalPlatform = isTikTok || isInstagram;
  const isDirectVideo = !isYouTube && !isFacebook && !isExternalPlatform && videoUrlRaw !== '';

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getFacebookEmbedUrl = (url: string) => {
    if (!url) return '';
    let cleanUrl = url.split('?')[0];
    cleanUrl = cleanUrl.replace('m.facebook.com', 'www.facebook.com');
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=false&autoplay=1&height=100%25&width=100%25`;
  };
  const youtubeId = videoUrlRaw ? getYouTubeId(videoUrlRaw) : null;
  const thumbnailUrl = resolveThumbnail(ad);


  const safeUser = ad.user as any;
  const safeAd = ad as any;
  const rawPhoneNumber = safeUser?.phoneNumber || safeUser?.phone || safeUser?.mobile || 
                      safeAd?.phoneNumber || safeAd?.phone || safeAd?.userPhone || safeAd?.mobile || null;
  const phoneNumber = rawPhoneNumber ? String(rawPhoneNumber) : null;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname + `?id=${ad.id}` : '';
  const shareText = encodeURIComponent(`شاهد هذا الفيديو على سوق العرب: ${ad.title}`);

  const copyLink = async () => {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }
        toast({ title: 'تم نسخ الرابط بنجاح' });
    } catch (err) {
        toast({ title: 'فشل النسخ', variant: 'destructive' });
    }
  };

  const handleDownloadYoutube = async (quality: string) => {
      if (!user) {
          toast({ title: "تسجيل الدخول مطلوب", description: "يجب عليك تسجيل الدخول أولاً لتتمكن من تحميل الفيديوهات المتميزة.", variant: "destructive" });
          setTimeout(() => router.push('/login'), 1500);
          return;
      }

      setIsDownloading(true);
      toast({ title: "جاري تجهيز رابط التحميل", description: `يتم التواصل مع الخوادم لجلب الفيديو بجودة ${quality}...` });
      
      try {
          if (!youtubeId) throw new Error("لا يوجد معرف للفيديو");

          // !! ====== تم وضع הـ API KEY بنجاح ====== !!
          const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '537b814677mshda8d537c12b72dep10163cjsna1e9a4577844';
          
          if (RAPIDAPI_KEY === 'YOUR_API_KEY_HERE') {
              toast({ 
                  title: "الميزة معطلة برمجياً ⚠️", 
                  description: "برجاء فتح ملف src/components/video-ad/RegularVideoPlayer.tsx ووضع الـ API Key الخاص بك في السطر المخصص لذلك لكي تعمل الميزة.",
                  variant: "destructive",
                  duration: 6000
              });
              setIsDownloading(false);
              return;
          }

          // نداء الـ API لخدمة "YouTube Downloader API" على سبيل المثال (yt-api أو youtube-media-downloader)
          // هذا الكود مصمم ليعمل مع مكتبات RapidApi الشهيرة.
          const response = await fetch(`https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${youtubeId}`, {
              method: 'GET',
              headers: {
                  'X-RapidAPI-Key': RAPIDAPI_KEY,
                  'X-RapidAPI-Host': 'youtube-media-downloader.p.rapidapi.com'
              }
          });

          if (!response.ok) {
              throw new Error('لم يقبل خادم API الطلب. تأكد من الباقة أو مفتاح الـ API.');
          }

          const data = await response.json();
          let downloadUrl = '';

          // طباعة الرد في الكونسول للمطورين
          console.log("API Response:", data);

          // البحث الذكي في مختلف الهياكل التي يمكن أن يرجع بها أي API
          if (data && data.videos && data.videos.items) {
              const videos = data.videos.items;
              const targetQuality = quality.replace('p', ''); // "720"
              const matchedVideo = videos.find((v: any) => 
                  (String(v.quality).includes(targetQuality) || String(v.qualityLabel).includes(targetQuality))
              );
              downloadUrl = matchedVideo ? matchedVideo.url : videos[0]?.url;
          } else if (data && data.streamingData && data.streamingData.formats) {
              const formats = data.streamingData.formats;
              downloadUrl = formats[0]?.url;
          } else if (data && data.url) {
              downloadUrl = data.url;
          } else if (data && data.link) {
              downloadUrl = data.link;
          }

          if (downloadUrl) {
              // فتح الرابط بطريقة تتفادى حظر النوافذ المنبثقة (Popup Blocker)
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.target = '_blank';
              a.download = 'video.mp4';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              
              toast({ title: "اكتمل التجهيز! ✅", description: "جاري بدء التحميل في متصفحك الآن." });
          } else {
              // إذا كان رد الـ API لا يحتوي على فيديو، نعرض المفاتيح لمعرفة الخطأ
              const keys = Object.keys(data).join(', ');
              throw new Error(`لم نتمكن من استخراج الرابط. بيانات الـ API المتاحة: ${keys}`);
          }

      } catch (err: any) {
          console.error("Download error:", err);
          toast({ 
              title: "فشل التحميل ❌", 
              description: err.message || "حدث خطأ أثناء محاولة جلب الفيديو.", 
              variant: "destructive",
              duration: 8000
          });
      } finally {
          setIsDownloading(false);
      }
  };
  
  const handleDownloadDirect = () => {
    if (!user) {
      toast({ title: "تسجيل الدخول مطلوب", description: "يجب عليك تسجيل الدخول أولاً لتتمكن من تحميل الفيديوهات المتميزة.", variant: "destructive" });
      setTimeout(() => router.push('/login'), 1500);
      return;
    }

    if (ad.videoUrl) {
      const a = document.createElement('a');
      a.href = ad.videoUrl;
      a.target = '_blank';
      a.download = `video-${ad.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: "جاري البدء! ✅", description: "بدأ تحميل ملف الفيديو الأصلي." });
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-background flex flex-col overflow-y-auto w-full h-full animate-in slide-in-from-bottom-5 duration-300 custom-scrollbar">
       {/* Top Bar Navigation with Category Ticker - Only Categories */}
       <div className="sticky top-0 z-[130] bg-background/90 backdrop-blur-xl border-b border-border/40 px-4 py-3 shadow-sm">
           <div className="w-full relative max-w-[1400px] mx-auto">
               <CategoryTicker selectedCategory={selectedCategory || 'all'} onSelect={(cat) => onCategorySelect ? onCategorySelect(cat) : router.push(`/?cat=${cat}`)} />
           </div>
       </div>

       {/* Floating Back/Close Button below the bar */}
       <div className="max-w-[1400px] mx-auto px-4 md:px-6 relative z-[125]">
            <Button 
                onClick={() => onClose ? onClose() : router.push('/')} 
                variant="ghost" 
                size="icon" 
                className="mt-4 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 backdrop-blur-sm shadow-md"
            >
                <X className="w-5 h-5 text-foreground" />
            </Button>
       </div>

       {/* Main Player Content Grid */}
       <div className="w-full max-w-[1400px] mx-auto px-0 md:px-6 py-0 md:py-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
           
           {/* Left Section: Video + Actions + Details (Takes up main space) */}
           <div className="w-full lg:w-[70%]">
               
               {/* 1. Video Player 16:9 Aspect Ratio */}
               <div className="w-full relative aspect-video bg-black md:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border">
                  
                  {isYouTube && youtubeId && (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&modestbranding=1&rel=0&enablejsapi=1`}
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 'none' }}
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    />
                  )}

                  {isFacebook && ad.videoUrl && (
                    <iframe
                      src={getFacebookEmbedUrl(ad.videoUrl)}
                      className="absolute inset-0 w-full h-full bg-black"
                      style={{ border: 'none', overflow: 'hidden' }}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  )}

                  {isDirectVideo && ad.videoUrl && (
                    <video
                      ref={videoRef}
                      src={ad.videoUrl}
                      poster={thumbnailUrl || undefined}
                      className="absolute inset-0 w-full h-full object-contain bg-black"
                      controls
                      controlsList="nodownload"
                      onContextMenu={(e) => e.preventDefault()}
                      autoPlay
                      playsInline
                      preload="auto"
                    />
                  )}

                  {isExternalPlatform && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black z-10 p-6">
                       {thumbnailUrl && (
                         <>
                           <img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" alt={ad.title} />
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                         </>
                       )}
                       <div className="relative z-20 flex flex-col items-center gap-4 text-center">
                         <div className="w-16 h-16 rounded-full bg-secondary/80 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-2xl">
                            <ExternalLink className="w-8 h-8 text-primary" />
                         </div>
                         <div>
                            <h4 className="text-white font-bold text-xl mb-2">{ad.title || 'فيديو خارجي'}</h4>
                            <p className="text-white/60 text-sm">هذا الفيديو معروض على منصة خارجية</p>
                         </div>
                         <a 
                           href={ad.videoUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="mt-4 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-base shadow-xl flex items-center gap-2 transition-transform active:scale-95"
                         >
                           مشاهدة الفيديو الآن
                           <ExternalLink className="w-5 h-5" />
                         </a>
                       </div>
                    </div>
                  )}

                  {/* Fallback Display For unsupported format */}
                  {!isYouTube && !isFacebook && !isDirectVideo && !isExternalPlatform && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
                          <PlayCircle className="w-16 h-16 text-white/30 mb-4" />
                          <p className="text-white/50">صيغة إعلان غير مدعومة كمشغل فيديو.</p>
                      </div>
                  )}
               </div>

               {/* 2. Video Title and Meta */}
               <div className="px-4 md:px-0 py-4 mt-2">
                   <h1 className="text-xl md:text-2xl font-black text-foreground mb-3">{ad.title}</h1>
                   <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
                       
                       {/* Channel Info */}
                       <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden">
                                {ad.user?.avatarUrl ? (
                                    <img src={ad.user.avatarUrl} alt={ad.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-muted-foreground" />
                                )}
                           </div>
                           <div className="flex flex-col">
                               <Link href={`/profile/${ad.userId}`} className="font-bold text-foreground hover:text-primary transition-colors text-[15px] md:text-base">
                                   {ad.user?.name || 'سوق العرب'}
                               </Link>
                               <span className="text-[12px] text-muted-foreground">{ad.user?.store ? 'متجر معتمد' : 'معلن نشط'}</span>
                           </div>
                           <Button className="mr-4 rounded-full px-5 font-bold" variant="secondary">
                               تواصل معه
                           </Button>
                       </div>

                       {/* Action Buttons */}
                       <div className="flex items-center gap-2">
                           {/* YouTube / Direct Download Dropdown */}
                           {(isYouTube || isDirectVideo) && (
                               <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                       <Button variant="secondary" className="rounded-full gap-2 px-5 bg-secondary/60 hover:bg-secondary font-bold text-primary" disabled={isDownloading}>
                                           {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-[18px] h-[18px]" />}
                                           تنزيل
                                       </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end" className="w-48 bg-background border-border rounded-xl shadow-2xl p-2 z-[150]">
                                       <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground mb-1">اختر جودة الفيديو</div>
                                       {isYouTube ? (
                                           <>
                                               <DropdownMenuItem className="flex justify-between items-center cursor-pointer rounded-lg hover:bg-secondary" onClick={() => handleDownloadYoutube('1080p')}>
                                                   <span>جودة عالية 1080p</span> <Badge variant="secondary" className="text-[9px] h-4 bg-primary/20 text-primary border-none">HD</Badge>
                                               </DropdownMenuItem>
                                               <DropdownMenuItem className="flex justify-between items-center cursor-pointer rounded-lg hover:bg-secondary" onClick={() => handleDownloadYoutube('720p')}>
                                                   <span>جودة جيدة 720p</span>
                                               </DropdownMenuItem>
                                               <DropdownMenuItem className="flex justify-between items-center cursor-pointer rounded-lg hover:bg-secondary" onClick={() => handleDownloadYoutube('360p')}>
                                                   <span>جودة منخفضة 360p</span>
                                               </DropdownMenuItem>
                                           </>
                                       ) : (
                                           <DropdownMenuItem className="flex justify-between items-center cursor-pointer rounded-lg hover:bg-secondary" onClick={handleDownloadDirect}>
                                               <span>تحميل الملف الأصلي</span> <Badge variant="secondary" className="text-[9px] h-4 bg-primary/20 text-primary border-none">MP4</Badge>
                                           </DropdownMenuItem>
                                       )}
                                   </DropdownMenuContent>
                               </DropdownMenu>
                           )}

                           <Button onClick={() => setIsShareModalOpen(true)} variant="secondary" className="rounded-full gap-2 px-5 bg-secondary/60 hover:bg-secondary font-bold">
                               <Share2 className="w-[18px] h-[18px]" />
                               مشاركة
                           </Button>
                       </div>
                   </div>
               </div>

               {/* 3. Details Description Card */}
               <div className="px-4 md:px-0 mb-8">
                   <div className="bg-secondary/30 rounded-2xl p-5 hover:bg-secondary/40 transition-colors">
                        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm font-bold text-foreground">
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted-foreground" /> {getTimeAgo(ad)}</span>
                            {!!ad.price && Number(ad.price) > 0 ? <span className="flex items-center gap-1.5 text-primary"> السعر: {ad.price} {ad.market === 'egypt' ? 'ج.م' : ''}</span> : null}
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-muted-foreground" /> {ad.city || ad.governorate || ad.country} </span>
                            <Badge variant="outline" className="border-border shadow-sm bg-background/50">{ad.category}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                             {ad.description && 
                              ad.description !== 'إعلان صوري' && 
                              ad.description !== 'إعلان فيديو' && 
                              ad.description !== 'تفاصيل إعلان صوري' && 
                              ad.description !== 'تفاصيل إعلان فيديو' && 
                              ad.description !== ad.title 
                              ? ad.description : "لا يوجد تفاصيل إضافية لهذا الإعلان."}
                        </p>
                        
                        {/* Call to Actions / Links in description */}
                        {phoneNumber && (
                             <div className="flex flex-wrap items-center gap-3 mt-6">
                                <a 
                                    href={`https://wa.me/${formatWhatsAppNumber(phoneNumber)}?text=${encodeURIComponent(`السلام عليكم، أتواصل معك بخصوص إعلانك: "${ad.title}" المعروض على 🏪 منصة سوق العرب 🛍️`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 font-bold text-sm flex items-center gap-2 transition-colors border border-[#25D366]/20"
                                >
                                    <WhatsAppIcon />
                                    تواصل واتساب
                                </a>
                                <Button variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold transition-colors">
                                    <Phone className="w-4 h-4" />
                                    اتصال هاتفي
                                </Button>
                             </div>
                        )}
                   </div>
               </div>

           </div>

           {/* Right/Bottom Section: Recommended/Related Sidebar */}
           <div className="w-full lg:w-[30%] px-4 md:px-0 flex flex-col gap-4 pb-20">
              <h3 className="font-bold text-lg mb-2">مقترحات قد تهمك</h3>
              
              {/* Fake empty related section to visually complete the design */}
                             <div className="flex flex-col gap-3">
                  {relatedAds.map((relatedAd) => {
                     const thumb = resolveThumbnail(relatedAd);
                     return (
                        <div 
                           key={relatedAd.id} 
                           onClick={() => {
                                if (onAdSelect) {
                                  onAdSelect(relatedAd.id);
                                } else {
                                  router.push(`/ad/${relatedAd.userId}/${relatedAd.id}`);
                                }
                            }}
                           className="flex gap-3 hover:bg-secondary/30 p-2 rounded-xl cursor-pointer transition-colors border border-transparent shadow-sm group"
                        >
                            <div className="w-[140px] aspect-video bg-secondary/50 rounded-lg shrink-0 flex items-center justify-center border border-border/50 overflow-hidden relative">
                                 {thumb ? (
                                     <img src={thumb} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                 ) : (
                                     <Film className="w-6 h-6 text-muted-foreground/30" />
                                 )}
                                 <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     <PlayCircle className="w-6 h-6 text-white" />
                                 </div>
                            </div>
                            <div className="flex flex-col gap-1 overflow-hidden py-1">
                                <span className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                    {relatedAd.title}
                                </span>
                                <span className="text-xs text-muted-foreground mt-0.5">{relatedAd.user?.name || 'سوق العرب'}</span>
                                <span className="text-[11px] text-muted-foreground">{getTimeAgo(relatedAd)}</span>
                            </div>
                        </div>
                     );
                  })}

                  {relatedAds.length === 0 && (
                      <div className="text-center py-10 bg-secondary/20 rounded-2xl border border-dashed border-border">
                          <Film className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">لا توجد مقترحات إضافية</p>
                      </div>
                  )}
            </div>
        </div>
    </div>

    {/* Share Modal Dialog */}
       <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
            <DialogContent className="sm:max-w-md bg-background border-border text-foreground rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">مشاركة الإعلان</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-4 py-6">
                    <a href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 transition-transform active:scale-95">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#25D366]"><WhatsAppIcon /></div>
                        <span className="text-xs text-muted-foreground">واتساب</span>
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 transition-transform active:scale-95">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#1877F2]"><FacebookIcon /></div>
                        <span className="text-xs text-muted-foreground">فيسبوك</span>
                    </a>
                    <a href={`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 transition-transform active:scale-95">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#0084FF]"><FacebookIcon /></div>
                        <span className="text-xs text-muted-foreground">ماسنجر</span>
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareText}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 transition-transform active:scale-95">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-black"><XIcon /></div>
                        <span className="text-xs text-muted-foreground">إكس</span>
                    </a>
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                    <Button variant="secondary" className="w-full font-bold gap-2" onClick={copyLink}>
                        <Share2 className="w-5 h-5" /> نسخ الرابط
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
