"use client";

import { useEffect } from 'react';

export default function ErrorWatcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).__AI_ERROR_WATCHER__) return;
    (window as any).__AI_ERROR_WATCHER__ = true;

    const errorHandler = (msg: any, url?: any, line?: any, col?: any, error?: any) => {
      const errorInfo = {
        message: msg,
        url,
        line,
        col,
        error: error?.toString(),
        time: new Date().toISOString(),
      };
      console.warn("⚠️ AI Watcher caught an error:", errorInfo);
      localStorage.setItem("lastError", JSON.stringify(errorInfo));

      // A simple auto-fix attempt
      if (typeof msg === 'string' && (msg.includes("adsbygoogle") || msg.includes("client-side exception"))) {
        console.log("🧠 Attempting auto-fix...");
        setTimeout(() => window.location.reload(), 1500);
      }
      return false;
    };

    window.onerror = errorHandler;
    window.addEventListener("unhandledrejection", (event) => {
      errorHandler(event.reason?.message, window.location.href, 0, 0, event.reason);
    });
  }, []);

  return null; // This component does not render anything
}
