"use client";

import { useAuth } from "@/context/AuthContext";
import Script from "next/script";

export default function GoogleAdSenseLoader() {
  const { adSenseSettings } = useAuth();

  // If adsense settings are still loading, wait to avoid flashing/mismatches
  if (!adSenseSettings) {
    return null;
  }

  // If ads are disabled, do not render or load the AdSense script
  if (!adSenseSettings.adsEnabled) {
    return null;
  }

  return (
    <Script
       async
       src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4808414573627321"
       crossOrigin="anonymous"
       strategy="lazyOnload"
    />
  );
}
