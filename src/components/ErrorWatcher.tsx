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
      // Log error safely without forcing page reloads
      try {
        localStorage.setItem("lastError", JSON.stringify(errorInfo));
      } catch (e) {}
      return false;
    };

    window.onerror = errorHandler;
    window.addEventListener("unhandledrejection", (event) => {
      errorHandler(event.reason?.message, window.location.href, 0, 0, event.reason);
    });
  }, []);

  return null; // This component does not render anything
}
