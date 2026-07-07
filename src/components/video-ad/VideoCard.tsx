'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Ad } from '@/lib/types';
import { 
  Play, 
  PlayCircle,
  Volume2,
  VolumeX,
  Share2,
  Phone,
  MapPin,
  PlusCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from 'next/link';

// Custom Branded Icons
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

const MessengerIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.303 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.291 14.193l-3.076-3.285-5.995 3.285 6.592-7.003 3.125 3.285 5.946-3.285-6.592 7.003z"/>
    </svg>
)

interface VideoCardProps {
  ad: Ad;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VideoCard({ ad, isActive, isMuted, onToggleMute }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio URL for image slideshow ads
  const adAudioUrl = (ad as any).audioUrl as string | undefined;

  // 1. ROBUST AD-TYPE DETECTION
  const adTypeRaw = (ad.adType || '').toString().toLowerCase().trim();
  const videoUrlRaw = (ad.videoUrl || '').trim();
  
  // Is it explicitly a VIDEO type? (highest priority — never override with isImage)
  const isExplicitVideo =
    adTypeRaw === 'video' ||
    adTypeRaw.includes('فيديو') ||
    adTypeRaw.includes('فديو') ||
    adTypeRaw.includes('video');

  // Does the URL look like a video?
  const urlLooksLikeVideo =
    videoUrlRaw.includes('youtube') ||
    videoUrlRaw.includes('youtu.be') ||
    videoUrlRaw.includes('facebook') ||
    videoUrlRaw.includes('fb.watch') ||
    videoUrlRaw.includes('tiktok') ||
    videoUrlRaw.includes('instagram') ||
    videoUrlRaw.includes('.mp4') ||
    videoUrlRaw.includes('.mov') ||
    videoUrlRaw.includes('.webm') ||
    videoUrlRaw.includes('.mkv') ||
    // Firebase Storage video files (URL contains video extension before query string)
    /\.(mp4|mov|webm|mkv|avi)/i.test(videoUrlRaw);

  // Is it an image? Only if NOT explicitly video AND URL doesn't look like video
  const isImage =
    !isExplicitVideo && (
      adTypeRaw.includes('image') ||
      adTypeRaw.includes('صور') ||
      adTypeRaw.includes('صوره') ||
      adTypeRaw.includes('صورة') ||
      adTypeRaw.includes('صوري') ||
      adTypeRaw.includes('صورى') ||
      !videoUrlRaw ||
      !urlLooksLikeVideo
    );

  // Video Platform Detection
  const isYouTube = !isImage && (videoUrlRaw.includes('youtube.com') || videoUrlRaw.includes('youtu.be'));
  const isFacebook = !isImage && (videoUrlRaw.includes('facebook') || videoUrlRaw.includes('fb.watch'));
  const isTikTok = !isImage && videoUrlRaw.includes('tiktok.com');
  const isInstagram = !isImage && videoUrlRaw.includes('instagram.com');
  const isExternalPlatform = isTikTok || isInstagram;
  const isDirectVideo = !isImage && !isYouTube && !isFacebook && !isExternalPlatform && videoUrlRaw !== '';

  // Helper for YouTube ID
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Improved Facebook URL handling
  const getFacebookEmbedUrl = (url: string) => {
    if (!url) return '';
    // Clean the URL from extra parameters
    let cleanUrl = url.split('?')[0];
    
    // If it's a mobile URL, convert it to desktop for embedding consistency
    cleanUrl = cleanUrl.replace('m.facebook.com', 'www.facebook.com');

    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=false&autoplay=${(isActive && isPlaying) ? 1 : 0}&mute=${isMuted ? 1 : 0}&height=100%25&width=100%25`;
  };

  const youtubeId = videoUrlRaw ? getYouTubeId(videoUrlRaw) : null;
  const getYoutubeThumbnail = (id: string | null) => id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  const images = ad.imageUrls || [];
  const thumbnailUrl = images[0] || (ad as any).imageUrl || getYoutubeThumbnail(youtubeId);

  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      setVideoError(false);
    } else {
      setIsPlaying(false);
      // Pause & reset audio when card becomes inactive
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (isActive && isPlaying) {
      if (video) {
        video.muted = true;
        video.play().then(() => { if (videoRef.current) videoRef.current.muted = isMuted; }).catch(() => {});
      }
      
      // YouTube/Facebook PostMessage Bridge
      if (isYouTube && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }

      if (isImage) {
          setProgress(0);
          setCurrentImageIndex(0);
          const imageInterval = setInterval(() => setProgress(prev => (prev < 100 ? prev + 0.5 : 0)), 50);
          
          let slideshowInterval: NodeJS.Timeout | null = null;
          if (images.length > 1) {
              slideshowInterval = setInterval(() => {
                  setCurrentImageIndex(prev => (prev + 1) % images.length);
              }, 3000);
          }

          // Play audio for image ads if available
          if (adAudioUrl && audioRef.current) {
              audioRef.current.muted = isMuted;
              audioRef.current.play().catch(() => {});
          }

          return () => {
              clearInterval(imageInterval);
              if (slideshowInterval) clearInterval(slideshowInterval);
              if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
              }
          };
      }
    } else {
      if (video) video.pause();
      if (isYouTube && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
      // Pause audio when video pauses
      if (audioRef.current) {
          audioRef.current.pause();
      }
    }
  }, [isActive, isPlaying, isImage, isYouTube, adAudioUrl, isMuted]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Robust play-on-interaction handler to bypass browser autoplay blocks
  useEffect(() => {
    if (!isActive || !isPlaying || !isImage || !adAudioUrl) return;

    const playAudio = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch((err) => {
          console.warn("Audio play on user interaction failed:", err);
        });
      }
    };

    // Add listeners for any user interaction on the window
    window.addEventListener('click', playAudio, { once: true });
    window.addEventListener('touchstart', playAudio, { once: true });

    return () => {
      window.removeEventListener('click', playAudio);
      window.removeEventListener('touchstart', playAudio);
    };
  }, [isActive, isPlaying, isImage, adAudioUrl, isMuted]);

  const togglePlay = () => {
    if (isImage) return;
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const shareAd = async () => {
    // Check if we can use the native share API first (mobile)
    const shareUrl = window.location.origin + window.location.pathname + `?id=${ad.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title,
          text: ad.description,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.warn('Native share failed, opening modal:', err);
      }
    }
    
    // Otherwise open our beautiful custom modal
    setIsShareModalOpen(true);
  };

  const copyLink = async () => {
    const shareUrl = window.location.origin + window.location.pathname + `?id=${ad.id}`;
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

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname + `?id=${ad.id}` : '';
  const shareText = encodeURIComponent(`شاهد هذا الإعلان الرائع على سوق العرب: ${ad.title}`);
  
  const socialShares = [
    { 
        name: 'واتساب', 
        icon: <WhatsAppIcon />, 
        color: 'bg-[#25D366]', 
        url: `https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}` 
    },
    { 
        name: 'فيسبوك', 
        icon: <FacebookIcon />, 
        color: 'bg-[#1877F2]', 
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` 
    },
    { 
        name: 'ماسنجر', 
        icon: <MessengerIcon />, 
        color: 'bg-[#0084FF]', 
        url: `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}` 
    },
    { 
        name: 'إكس', 
        icon: <XIcon />, 
        color: 'bg-black', 
        url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareText}` 
    },
  ];

  // Resolve phone number from user profile or directly from ad
  // Ad check: phoneNumber, phone, userPhone, mobile
  // User check: phoneNumber, phone, mobile
  const safeUser = ad.user as any;
  const safeAd = ad as any;
  const rawPhoneNumber = safeUser?.phoneNumber || safeUser?.phone || safeUser?.mobile || 
                      safeAd?.phoneNumber || safeAd?.phone || safeAd?.userPhone || safeAd?.mobile || null;
  const phoneNumber = rawPhoneNumber ? String(rawPhoneNumber) : null;

  return (
    <div 
      className="relative w-full h-full snap-start group overflow-hidden md:overflow-visible flex flex-col md:flex-row-reverse md:items-end justify-center md:pb-12 md:gap-4"
      data-ad-id={ad.id}
      data-is-image={isImage}
      data-is-active={isActive}
      data-is-playing={isPlaying}
      data-ad-type={ad.adType}
    >
      {/* Inner Media Wrapper — Absolute on mobile, relative column on desktop */}
      <div className="absolute inset-0 md:relative md:inset-auto md:w-[400px] md:aspect-[9/16] md:max-h-[85vh] overflow-hidden bg-black md:rounded-22 md:shadow-2xl z-20">

      {/* Hidden Audio Element for image ads */}
      {isImage && adAudioUrl && (
        <audio
          ref={audioRef}
          src={adAudioUrl}
          loop
          muted={isMuted}
          preload="auto"
        />
      )}

      {/* Background Mask for visual stability */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* ── Media Layer: absolutely fills the card ── */}

      {/* Image / Slideshow Layer */}
      {isImage && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-10 pointer-events-none bg-black">
          {images.map((url, idx) => (
            <img
              key={`${url}-${idx}`}
              src={url}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                idx === currentImageIndex ? "opacity-100" : "opacity-0",
                images.length === 1 ? "animate-ken-burns" : (idx === currentImageIndex ? "scale-110 transition-transform duration-[4000ms]" : "scale-100")
              )}
              alt={ad.title}
            />
          ))}
          {/* Subtle gradient instead of blur to keep text readable without affecting image quality */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        </div>
      )}

      {/* YouTube Embed */}
      {!isImage && isYouTube && youtubeId && (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&loop=1&playlist=${youtubeId}&enablejsapi=1`}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ border: 'none' }}
          allow="autoplay; encrypted-media"
        />
      )}

      {/* Facebook Native Embed - Keyed to force pause/reload on isPlaying change */}
      {!isImage && isFacebook && ad.videoUrl && (
        <iframe
          key={isPlaying ? 'playing' : 'paused'}
          src={getFacebookEmbedUrl(ad.videoUrl)}
          className="absolute inset-0 w-full h-full pointer-events-none z-10 bg-black"
          style={{ border: 'none', overflow: 'hidden' }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      )}

      {/* Direct Video */}
      {isDirectVideo && !videoError && (
        <video
          ref={videoRef}
          src={ad.videoUrl}
          poster={thumbnailUrl}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          loop
          playsInline
          preload="auto"
          muted={isMuted}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          onTimeUpdate={handleTimeUpdate}
          onError={() => setVideoError(true)}
          style={{ display: 'block' }}
        />
      )}

      {/* External Platform Fallback (Facebook, TikTok, Instagram) */}
      {isExternalPlatform && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black z-10">
           {thumbnailUrl && (
             <>
               <img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-30" alt={ad.title} />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
             </>
           )}
           <div className="relative z-20 flex flex-col items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-secondary/80 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-2xl">
                <ExternalLink className="w-8 h-8 text-primary" />
             </div>
             <div className="text-center space-y-1">
                <h4 className="text-white font-bold max-w-[200px] truncate">{ad.title || 'فيديو خارجي'}</h4>
                <p className="text-white/60 text-xs">هذا الفيديو معروض على منصة خارجية</p>
             </div>
             <a 
               href={ad.videoUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="mt-2 px-6 py-2.5 bg-primary hover:bg-primary/90 hover:scale-105 transition-all text-primary-foreground rounded-full font-bold text-sm shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] flex items-center gap-2"
               onClick={(e) => e.stopPropagation()}
             >
               مشاهدة الفيديو
               <ExternalLink className="w-4 h-4" />
             </a>
           </div>
        </div>
      )}

      {/* ── Overlay Layers ── */}

      {/* Fallback Image Layer / Poster (Only when inactive) */}
      {!isImage && !isActive && (
        <div className="absolute inset-0 w-full h-full z-[15] cursor-pointer bg-black" onClick={togglePlay}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} className="w-full h-full object-cover opacity-80" alt={ad.title} />
          ) : (
             <div className="w-full h-full bg-neutral-900 absolute inset-0 mix-blend-overlay" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full border border-white/20 shadow-2xl">
                <PlayCircle className="w-12 h-12 text-white stroke-[1.5]" />
            </div>
          </div>
        </div>
      )}

      {/* Video Error / No Thumbnail Fallback */}
      {videoError && isDirectVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50" style={{ zIndex: 10 }}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover" alt={ad.title} />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              <span className="text-sm">تعذّر تحميل الفيديو</span>
            </>
          )}
        </div>
      )}

      {/* No media fallback */}
      {!isImage && !ad.videoUrl && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <span className="text-sm">لا يتوفر محتوى مرئي</span>
        </div>
      )}

      {/* Interaction Shield & Custom UI Layers — z-40 to capture all clicks */}
      {isActive && (
        <>
            {/* The primary interaction shield */}
            <div 
              className="absolute inset-0 z-40 cursor-pointer"
              onClick={togglePlay}
            />

            {/* Mute Toggle Button — z-50 to be above the shield */}
            {(!isImage || adAudioUrl) && (
              <div className="absolute top-20 right-4 z-50">
                <button 
                  onClick={(e) => { 
                      e.stopPropagation();
                      onToggleMute();
                  }}
                  className="p-3 rounded-full bg-black/50 backdrop-blur-md transition-all active:scale-90 border border-white/10 shadow-lg hover:bg-black/70"
                >
                  {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
              </div>
            )}

            {/* Audio equalizer indicator for image ads with audio */}
            {isImage && adAudioUrl && !isMuted && isPlaying && (
              <div className="absolute top-4 left-4 z-50 flex items-end gap-[3px] h-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-primary rounded-full"
                    style={{
                      height: '100%',
                      animation: `eq-bar-${i + 1} ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* "Tap to unmute" hint */}
            {((!isImage) || (isImage && adAudioUrl)) && isMuted && isPlaying && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/90 text-primary-foreground text-sm font-bold shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                        <VolumeX className="w-4 h-4 animate-pulse" />
                        اضغط لتفعيل الصوت
                    </div>
                </div>
            )}

            {/* Play indicator (center) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-40 pointer-events-none transition-all duration-300">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                        <Play className="w-12 h-12 text-white stroke-[1.5] ml-2" />
                    </div>
                </div>
            )}
            {/* Share Modal */}
            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
                <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">مشاركة الإعلان</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-center">
                            شارك هذا الإعلان مع أصدقائك عبر المنصات الاجتماعية
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-4 gap-4 py-6">
                        {socialShares.map((social) => (
                            <a 
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                            >
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all group-hover:brightness-110",
                                    social.color
                                )}>
                                    {social.icon}
                                </div>
                                <span className="text-xs text-neutral-300">{social.name}</span>
                            </a>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-neutral-800">
                        <Button 
                            variant="secondary" 
                            className="w-full h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border-none gap-2"
                            onClick={copyLink}
                        >
                            <Share2 className="w-5 h-5" />
                            نسخ الرابط
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
      )}
      {/* Bottom Info Overlay — only title and location, no description text */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-20 pointer-events-none">
        <div className="flex flex-col gap-1.5 max-w-[78%]">
            <Link href={`/profile/${ad.userId}`} className="flex items-center gap-2 group/user pointer-events-auto">
                <h3 className="text-foreground font-bold text-base drop-shadow-sm group-hover/user:underline">
                  @{ad.user?.name || ''}
                </h3>
                {ad.user?.store && (
                    <Badge variant="secondary" className="bg-primary text-primary-foreground text-[10px] py-0 px-1 h-4 border-none">متجر</Badge>
                )}
            </Link>
            {/* ad.title and location removed as requested */}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/10 z-40">
        <div 
          className="h-full bg-primary transition-all duration-200" 
          style={{ width: `${progress}%` }}
        />
      </div> 
      </div> {/* END Inner Media Wrapper (line 269) */}

      {/* Right Actions Bar — Floating on mobile, Sidebar column on Desktop */}
      <div className="absolute right-4 bottom-24 md:relative md:inset-auto md:flex md:flex-col md:items-center md:gap-7 z-50">

        {/* Share Button */}
        <button className="flex flex-col items-center group/btn" onClick={(e) => { e.stopPropagation(); shareAd(); }}>
          <div className="w-12 h-12 rounded-full bg-secondary/80 md:bg-neutral-800/90 backdrop-blur-xl flex items-center justify-center mb-1 group-active/btn:scale-90 transition-all border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:bg-neutral-700">
            <Share2 className="w-6 h-6 text-foreground md:text-white" />
          </div>
          <span className="text-white md:text-white/90 text-xs font-bold shadow-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">مشاركة</span>
        </button>

        {/* Unified Telephony System - WhatsApp & Call */}
        {phoneNumber && (
            <div className="flex flex-col items-center gap-3 relative">
                {/* Expandable Sub-Buttons */}
                <div className={cn(
                    "flex flex-col items-center gap-3 transition-all duration-300 origin-bottom",
                    isContactOpen ? "opacity-100 translate-y-0 h-auto" : "opacity-0 translate-y-10 h-0 overflow-hidden"
                )}>
                    {/* WhatsApp Button */}
                    <div className="flex flex-col items-center gap-1 group/wa">
                        <a 
                            href={`https://wa.me/${phoneNumber.replace(/[\+\s\-]/g, '')}?text=${encodeURIComponent(`أهلاً، مهتم بخصوص إعلانك: ${ad.title}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg border-2 border-white/20 transition-transform active:scale-90 hover:scale-105"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </a>
                    </div>

                    {/* Call Button */}
                    <div className="flex flex-col items-center gap-1 group/call">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                    title: "تنبيه",
                                    description: "للاتصال المباشر، يرجى تحميل واستخدام تطبيق سوق العرب متوفر علي متجر بلاي",
                                });
                            }}
                            className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border-2 border-white/20 transition-transform active:scale-90 hover:scale-105"
                        >
                            <Phone className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Main Toggle Button */}
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsContactOpen(!isContactOpen);
                        }}
                        className={cn(
                            "w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl border-2 border-primary-foreground/30 transition-all duration-300 hover:scale-105",
                            isContactOpen ? "rotate-[135deg] bg-neutral-800 border-neutral-600" : ""
                        )}
                    >
                        {isContactOpen ? <PlusCircle className="w-8 h-8 text-white" /> : <Phone className="w-7 h-7 text-primary-foreground animate-ringing" />}
                    </button>
                    <span className="text-white md:text-white/90 text-[10px] font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider">تواصل</span>
                </div>
            </div>
        )}
      </div>

      <style>{`
        @keyframes call-pulse {
            0%   { transform: scale(1); }
            50%  { transform: scale(1.18); }
            100% { transform: scale(1); }
        }
        .animate-ringing {
            animation: call-pulse 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
            display: inline-block;
        }

        @keyframes eq-bar-1 { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }
        @keyframes eq-bar-2 { 0% { transform: scaleY(0.5); } 100% { transform: scaleY(0.2); } }
        @keyframes eq-bar-3 { 0% { transform: scaleY(0.8); } 100% { transform: scaleY(0.4); } }
        @keyframes eq-bar-4 { 0% { transform: scaleY(0.2); } 100% { transform: scaleY(0.9); } }
        @keyframes eq-bar-5 { 0% { transform: scaleY(0.6); } 100% { transform: scaleY(0.3); } }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .marquee-text {
            animation: marquee 10s linear infinite;
            padding-left: 100%;
        }
        
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }

        .animate-heart-beat-hover:hover {
            animation: heart-beat 0.8s ease-in-out infinite;
        }

        @keyframes heart-beat {
            0% { transform: scale(1); }
            15% { transform: scale(1.15); }
            30% { transform: scale(1); }
            45% { transform: scale(1.15); }
            100% { transform: scale(1); }
        }

        .animate-spin-slow {
            animation: spin 3s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .animate-ken-burns {
            animation: ken-burns 15s ease-in-out infinite alternate;
        }

        @keyframes ken-burns {
            0% {
                transform: scale(1) translate(0, 0);
            }
            100% {
                transform: scale(1.1) translate(-1%, -1%);
            }
        }
      `}</style>
    </div>
  );
}

