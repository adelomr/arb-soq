import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Ad } from "./types"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Recursively converts Firestore Timestamps to plain objects.
 * This is required for Next.js to pass data from Server Components to Client Components.
 */
export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  // Handle Firestore Timestamps
  if (data && typeof data === 'object' && ('seconds' in data) && ('nanoseconds' in data) && typeof data.toDate === 'function') {
    return {
      seconds: data.seconds,
      nanoseconds: data.nanoseconds
    };
  }

  // Handle regular objects
  if (typeof data === 'object' && data.constructor === Object) {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeFirestoreData(value);
    }
    return result;
  }

  return data;
}

export function resolveThumbnail(ad: Ad) {
  // 1. Primary: Explicit list of image URLs
  if (ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0]) {
    return ad.imageUrls[0];
  }
  
  // 2. Secondary: Singular imageUrl field (often used in Android/compatibility)
  if (ad.imageUrl) return ad.imageUrl;

  const videoUrl = (ad.videoUrl || '').trim();
  if (!videoUrl) return null;

  // 3. YouTube: Get high-quality thumbnail
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    const youtubeId = (match && match[2].length === 11) ? match[2] : null;
    if (youtubeId) {
      // Try maxresdefault, browsers will fallback if 404
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
  }

  // 4. Facebook: No direct public thumbnail URL, but we can return a flag 
  // to indicates we need a custom placeholder if no other image is found.
  if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
      // If we had a specific FB thumbnail service we would use it here
      // For now, it will return null and fallback to the UI-level placeholder
  }
  
  return null;
}

/**
 * Safely parses various date formats (ISO string, Firestore Timestamp, or number)
 * into a valid Date object. Returns a fallback date if parsing fails.
 */
export function safeParseDate(dateValue: any): Date {
  if (!dateValue) return new Date();

  // Handle Firestore Timestamp { seconds, nanoseconds }
  if (typeof dateValue === 'object' && 'seconds' in dateValue) {
    return new Date(dateValue.seconds * 1000);
  }

  // Handle number (timestamp)
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  // Handle Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? new Date() : dateValue;
  }

  // Handle string
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return new Date();
}

export function getTimeAgo(ad: Ad) {
  const date = safeParseDate(ad.postedAt || ad.timestamp);
  try {
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch (e) {
      return '';
  }
}

export function getYouTubeId(url: string | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function isShortVideo(url: string | undefined): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const ytId = getYouTubeId(url);
  
  // YouTube shorts specific checks
  if (lowerUrl.includes('/shorts/')) return true;
  
  // Other platforms
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('reels') || lowerUrl.includes('/reel')) return true;
  
  // Direct MP4s are treated as shorts if they don't have a platform signature and user wants them in shorts feed?
  // Actually, we usually distinguish by adType or specific URL patterns.
  return false;
}

export type AdViewType = 'shorts' | 'video' | 'standard';

export function getAdViewType(ad: Ad): AdViewType {
  const adTypeRaw = (ad.adType || '').toString().toLowerCase().trim();
  const videoUrlRaw = (ad.videoUrl || '').trim();

  const isExplicitVideo =
    adTypeRaw === 'video' ||
    adTypeRaw.includes('فيديو') ||
    adTypeRaw.includes('فديو') ||
    adTypeRaw.includes('video');

  if (isShortVideo(videoUrlRaw)) return 'shorts';
  if (videoUrlRaw || isExplicitVideo) return 'video';
  return 'standard';
}

