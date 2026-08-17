"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlacementBySlotKey, trackAdClick, trackAdImpression } from "@/lib/ad-placement-service";
import { AdPlacement } from "@/lib/ad-placement-types";
import Image from "next/image";
import { ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSlotProps {
  slotKey: string;
  className?: string;
  type?: 'horizontal' | 'square' | 'in-feed';
  fallback?: React.ReactNode;
}

export default function AdSlot({
  slotKey,
  className = "",
  type = 'horizontal',
  fallback = null,
}: AdSlotProps) {
  const { adSenseSettings } = useAuth();
  const [placement, setPlacement] = useState<AdPlacement | null>(null);
  const [loading, setLoading] = useState(true);
  const adRef = useRef<HTMLDivElement>(null);
  const impressionTrackedRef = useRef(false);
  const adSensePushedRef = useRef(false);

  // Check global ads settings
  const globalAdsEnabled = adSenseSettings ? adSenseSettings.adsEnabled : true;

  // Fetch placement info
  useEffect(() => {
    let isMounted = true;
    const fetchPlacement = async () => {
      try {
        const data = await getPlacementBySlotKey(slotKey);
        if (isMounted) {
          setPlacement(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPlacement();
    return () => {
      isMounted = false;
    };
  }, [slotKey]);

  // Track impression when custom banner enters viewport
  useEffect(() => {
    if (!placement || placement.ad_type !== 'custom_banner' || impressionTrackedRef.current) return;
    const element = adRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTrackedRef.current) {
            impressionTrackedRef.current = true;
            trackAdImpression(placement.id);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [placement]);

  // Initialize AdSense script push
  useEffect(() => {
    if (!placement || placement.ad_type !== 'adsense' || !globalAdsEnabled || adSensePushedRef.current) return;

    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adSensePushedRef.current = true;
      }
    } catch (err) {
      console.warn(`AdSense push error for ${slotKey}:`, err);
    }
  }, [placement, globalAdsEnabled, slotKey]);

  // If ads are globally disabled or loading or no active placement, collapse seamlessly
  if (!globalAdsEnabled || loading || !placement || !placement.is_active) {
    return fallback ? <>{fallback}</> : null;
  }

  // Helper to extract slot ID if raw HTML was pasted
  const getAdSenseSlotId = (): string => {
    if (!placement.adsense_code) return "";
    const slotMatch = placement.adsense_code.match(/data-ad-slot=["']?(\d+)["']?/i);
    if (slotMatch && slotMatch[1]) {
      return slotMatch[1];
    }
    // If it's just numbers
    if (/^\d+$/.test(placement.adsense_code.trim())) {
      return placement.adsense_code.trim();
    }
    return "";
  };

  const getAdSenseClientId = (): string => {
    if (!placement.adsense_code) return "ca-pub-4808414573627321";
    const clientMatch = placement.adsense_code.match(/data-ad-client=["']?(ca-pub-\d+)["']?/i);
    if (clientMatch && clientMatch[1]) {
      return clientMatch[1];
    }
    return "ca-pub-4808414573627321";
  };

  // 1. Render Custom Direct Banner
  if (placement.ad_type === 'custom_banner') {
    if (!placement.banner_image_url) {
      return null;
    }

    const handleClick = () => {
      trackAdClick(placement.id);
    };

    const targetUrl = placement.banner_target_url || '#';

    return (
      <div 
        ref={adRef}
        className={cn(
          "w-full my-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/30 to-primary/5 p-1 transition-all duration-300 hover:shadow-lg hover:border-primary/40",
          className
        )}
      >
        <div className="flex items-center justify-between px-3 py-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            إعلان مميز
          </span>
          <span className="text-[10px] bg-secondary/80 px-1.5 py-0.5 rounded text-muted-foreground">
            إعلان معتمد
          </span>
        </div>
        
        <a
          href={targetUrl}
          target={placement.open_in_new_tab ? "_blank" : "_self"}
          rel={placement.open_in_new_tab ? "noopener noreferrer" : undefined}
          onClick={handleClick}
          className="group relative block w-full overflow-hidden rounded-xl bg-card shadow-inner focus:outline-none"
        >
          <div className="relative w-full aspect-[4/1] min-h-[90px] max-h-[220px] sm:min-h-[120px]">
            <Image
              src={placement.banner_image_url}
              alt={placement.slot_title || "إعلان سوق العرب"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority={false}
            />
          </div>

          {placement.banner_target_url && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-background/85 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              <span>زيارة الموقع</span>
              <ExternalLink className="h-3 w-3 text-primary" />
            </div>
          )}
        </a>
      </div>
    );
  }

  // 2. Render Google AdSense
  const slotId = getAdSenseSlotId();
  const clientId = getAdSenseClientId();

  const slotMinHeight = type === 'square' ? '250px' : type === 'in-feed' ? '120px' : '90px';

  return (
    <div 
      ref={adRef}
      className={cn("w-full my-4 overflow-hidden text-center", className)}
      style={{ minHeight: slotMinHeight }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: slotMinHeight }}
        data-ad-client={clientId}
        data-ad-slot={slotId || "8765432109"}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
