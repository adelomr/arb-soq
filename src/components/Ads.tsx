
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdsProps {
  slot: string;
  type?: 'horizontal' | 'square';
  className?: string;
}

export default function Ads({
  slot,
  type = 'horizontal',
  className = ''
}: AdsProps) {
  const { adSenseSettings } = useAuth();
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdVisible, setIsAdVisible] = useState(false);
  const adPushedRef = useRef(false);

  // All hooks MUST come before any early return (Rules of Hooks)
  const adsEnabled = !!(adSenseSettings && adSenseSettings.adsEnabled);

  useEffect(() => {
    if (!adsEnabled) return;
    if (adPushedRef.current) return;

    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushedRef.current = true;
      }
    } catch (err) {
      console.error(`adsbygoogle.push() error for slot ${slot}:`, err);
    }
  }, [slot, adsEnabled]);

  useEffect(() => {
    if (!adsEnabled) return;
    const adElement = adRef.current;
    if (!adElement) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && adElement.hasChildNodes()) {
          const iframe = adElement.querySelector('iframe');
          const ins = adElement.querySelector('ins.adsbygoogle') as HTMLElement | null;
          if (iframe || (ins && ins.dataset.adStatus === 'filled')) {
            setIsAdVisible(true);
            observer.disconnect();
            return;
          }
        }
      }
    });

    observer.observe(adElement, {
      childList: true,
      subtree: true,
    });
    
    const fallbackTimeout = setTimeout(() => {
      if (!isAdVisible && !adElement.hasChildNodes()) {
          observer.disconnect();
      }
    }, 2500);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, [isAdVisible, adsEnabled]);

  // Early return AFTER all hooks
  if (!adsEnabled) {
    return null;
  }
  
  const style: React.CSSProperties = {
      display: 'block',
      width: '100%',
      minHeight: isAdVisible ? (type === 'square' ? '250px' : '90px') : '0px',
  };

  const containerStyle: React.CSSProperties = {
      overflow: 'hidden',
      transition: 'all 0.3s ease-out',
      minHeight: style.minHeight,
      marginBottom: isAdVisible ? '1.5rem' : '0px',
  };

  return (
      <div
        ref={adRef}
        key={slot + type} 
        className={className}
        style={containerStyle}
      >
        <ins
          className="adsbygoogle"
          style={style}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-4808414573627321"}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
  );
}
