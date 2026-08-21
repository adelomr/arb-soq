
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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
  const [isUnfilled, setIsUnfilled] = useState(false);
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

    const checkStatus = () => {
      const ins = adElement.querySelector('ins.adsbygoogle') as HTMLElement | null;
      if (ins) {
        const status = ins.getAttribute('data-ad-status') || ins.getAttribute('data-adsbygoogle-status');
        if (status === 'unfilled') {
          setIsUnfilled(true);
        }
      }
    };

    const observer = new MutationObserver(() => {
      checkStatus();
    });

    observer.observe(adElement, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
      childList: true,
      subtree: true,
    });
    
    const fallbackTimeout = setTimeout(() => {
      const ins = adElement.querySelector('ins.adsbygoogle') as HTMLElement | null;
      const iframe = adElement.querySelector('iframe');
      if (!iframe && (!ins || ins.getAttribute('data-ad-status') !== 'filled')) {
        setIsUnfilled(true);
      }
    }, 4500);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, [adsEnabled]);

  // Early return AFTER all hooks
  if (!adsEnabled || isUnfilled) {
    return null;
  }

  return (
    <div
      ref={adRef}
      key={slot + type} 
      className={cn("adsbygoogle-container w-full overflow-hidden text-center transition-all duration-300", className)}
    >
      <ins
        className="adsbygoogle block w-full"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-4808414573627321"}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
