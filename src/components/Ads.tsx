
"use client";

import { useEffect, useRef, useState } from "react";

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
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdVisible, setIsAdVisible] = useState(false);
  const adPushedRef = useRef(false);

  useEffect(() => {
    if (adPushedRef.current) return;

    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushedRef.current = true;
      }
    } catch (err) {
      console.error(`adsbygoogle.push() error for slot ${slot}:`, err);
    }
  }, [slot]);

  useEffect(() => {
    const adElement = adRef.current;
    if (!adElement) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && adElement.hasChildNodes()) {
          // Check if what was added is an actual ad
          const iframe = adElement.querySelector('iframe');
          const ins = adElement.querySelector('ins.adsbygoogle');
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
    
    // Fallback timer: if no ad is loaded after a short period, hide the container
    const fallbackTimeout = setTimeout(() => {
      if (!isAdVisible && !adElement.hasChildNodes()) {
          observer.disconnect();
      }
    }, 2500);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, [isAdVisible]);
  
  const style: React.CSSProperties = {
      display: 'block',
      width: '100%',
      minHeight: isAdVisible ? (type === 'square' ? '250px' : '90px') : '0px',
  };

  return (
      <div
        ref={adRef}
        key={slot + type} 
        className={className}
        style={{ overflow: 'hidden', transition: 'min-height 0.3s ease-out', minHeight: style.minHeight }}
      >
        <ins
          className="adsbygoogle"
          style={style}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
  );
}
