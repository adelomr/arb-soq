import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import type { 
  Ad, 
  AdActivityEvent, 
  AdActivityEventType, 
  AdActivityStats, 
  AdTimeframe, 
  AdActivityDailyPoint 
} from './types';
import { format, subDays, subHours, isAfter, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

// Helper to detect client device type
export function getClientDevice(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined' || !navigator) return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Log an ad activity event (view, click, call, whatsapp, share)
 * Writes to subcollection `ads/{adId}/activity_logs` and increments summary counters in Firestore.
 */
export async function logAdActivity(
  adId: string,
  type: AdActivityEventType,
  metadata?: { userId?: string; sellerUserId?: string; device?: 'mobile' | 'desktop' | 'tablet' }
): Promise<void> {
  if (!adId) return;

  try {
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd');
    const device = metadata?.device || getClientDevice();
    const logsCol = collection(firestore, 'ads', adId, 'activity_logs');

    // 1. Add individual log entry in Firestore subcollection
    await addDoc(logsCol, {
      adId,
      type,
      userId: metadata?.userId || null,
      device,
      dateStr,
      timestamp: serverTimestamp(),
      createdAtIso: now.toISOString(),
    });

    // 2. Prepare atomic increment payload for summary counters
    const updatePayload: Record<string, any> = {};
    if (type === 'view') {
      updatePayload.views = increment(1);
    } else if (type === 'click') {
      updatePayload.clicks = increment(1);
    } else if (type === 'call') {
      updatePayload.callClicks = increment(1);
      updatePayload.clicks = increment(1);
    } else if (type === 'whatsapp') {
      updatePayload.whatsappClicks = increment(1);
      updatePayload.clicks = increment(1);
    } else if (type === 'share') {
      updatePayload.clicks = increment(1);
    }

    if (Object.keys(updatePayload).length > 0) {
      // Update top-level collection: ads/{adId}
      const adRef = doc(firestore, 'ads', adId);
      updateDoc(adRef, updatePayload).catch(() => {});

      // Update user subcollection if sellerUserId is provided: users/{sellerUserId}/ads/{adId}
      if (metadata?.sellerUserId && metadata.sellerUserId !== 'owner') {
        const userAdRef = doc(firestore, 'users', metadata.sellerUserId, 'ads', adId);
        updateDoc(userAdRef, updatePayload).catch(() => {});
      }
    }
  } catch (error) {
    console.error(`[logAdActivity] Error logging ${type} for ad ${adId}:`, error);
  }
}

/**
 * Fetches and analyzes ad activity logs for a given timeframe with real database sync.
 */
export async function getAdActivityStats(
  adId: string,
  timeframe: AdTimeframe = 'all',
  fallbackAd?: Ad | null
): Promise<AdActivityStats> {
  const now = new Date();
  let cutoffDate: Date | null = null;

  if (timeframe === '24h') {
    cutoffDate = subHours(now, 24);
  } else if (timeframe === '7d') {
    cutoffDate = subDays(now, 7);
  } else if (timeframe === '30d') {
    cutoffDate = subDays(now, 30);
  }

  // Fetch live parent ad document to get actual cumulative counters
  let liveAdData: Partial<Ad> = fallbackAd || {};
  try {
    let adDocRef = doc(firestore, 'ads', adId);
    let adSnap = await getDoc(adDocRef);
    if (!adSnap.exists() && fallbackAd?.userId && fallbackAd.userId !== 'owner') {
      adDocRef = doc(firestore, 'users', fallbackAd.userId, 'ads', adId);
      adSnap = await getDoc(adDocRef);
    }
    if (adSnap.exists()) {
      liveAdData = { ...liveAdData, ...adSnap.data() };
    }
  } catch (e) {
    console.warn(`[getAdActivityStats] Could not refresh ad document for ${adId}:`, e);
  }

  let rawLogs: {
    id: string;
    type: AdActivityEventType;
    timestampDate: Date;
    dateStr: string;
    device?: 'mobile' | 'desktop' | 'tablet';
  }[] = [];

  try {
    const logsCol = collection(firestore, 'ads', adId, 'activity_logs');
    // Order by timestamp desc, limit to last 500 events
    const logsQuery = query(logsCol, orderBy('timestamp', 'desc'), limit(500));
    const snapshot = await getDocs(logsQuery);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let eventDate: Date = now;

      if (data.timestamp instanceof Timestamp) {
        eventDate = data.timestamp.toDate();
      } else if (data.timestamp?.toDate && typeof data.timestamp.toDate === 'function') {
        eventDate = data.timestamp.toDate();
      } else if (data.createdAtIso) {
        eventDate = parseISO(data.createdAtIso);
      }

      const dateStr = data.dateStr || format(eventDate, 'yyyy-MM-dd');

      rawLogs.push({
        id: docSnap.id,
        type: (data.type || 'view') as AdActivityEventType,
        timestampDate: eventDate,
        dateStr,
        device: data.device || 'desktop',
      });
    });
  } catch (error) {
    console.warn(`[getAdActivityStats] Could not query activity_logs subcollection for ad ${adId}:`, error);
  }

  // Filter logs by cutoffDate if timeframe is specified
  const filteredLogs = cutoffDate
    ? rawLogs.filter((log) => isAfter(log.timestampDate, cutoffDate!))
    : rawLogs;

  let loggedViews = 0;
  let loggedClicks = 0;
  let loggedCallClicks = 0;
  let loggedWhatsappClicks = 0;
  let loggedShares = 0;

  // Aggregate daily breakdown
  const dailyMap: Record<string, { views: number; clicks: number; callClicks: number; whatsappClicks: number; total: number; dateObj: Date }> = {};

  // Initialize days span for continuous timeline chart
  const daysSpan = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
  for (let i = daysSpan - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const key = format(d, 'yyyy-MM-dd');
    dailyMap[key] = {
      views: 0,
      clicks: 0,
      callClicks: 0,
      whatsappClicks: 0,
      total: 0,
      dateObj: d,
    };
  }

  filteredLogs.forEach((log) => {
    if (log.type === 'view') loggedViews++;
    else if (log.type === 'click') loggedClicks++;
    else if (log.type === 'call') loggedCallClicks++;
    else if (log.type === 'whatsapp') loggedWhatsappClicks++;
    else if (log.type === 'share') loggedShares++;

    const key = log.dateStr;
    if (!dailyMap[key]) {
      dailyMap[key] = {
        views: 0,
        clicks: 0,
        callClicks: 0,
        whatsappClicks: 0,
        total: 0,
        dateObj: log.timestampDate,
      };
    }

    if (log.type === 'view') dailyMap[key].views++;
    else if (log.type === 'click') dailyMap[key].clicks++;
    else if (log.type === 'call') dailyMap[key].callClicks++;
    else if (log.type === 'whatsapp') dailyMap[key].whatsappClicks++;
    dailyMap[key].total++;
  });

  // Reconcile with live cumulative document counters to guarantee numbers match exactly everywhere
  const docViews = typeof liveAdData.views === 'number' ? liveAdData.views : (fallbackAd?.views ?? 0);
  const docClicks = typeof liveAdData.clicks === 'number' ? liveAdData.clicks : (fallbackAd?.clicks ?? 0);
  const docCallClicks = typeof liveAdData.callClicks === 'number' ? liveAdData.callClicks : (fallbackAd?.callClicks ?? 0);
  const docWhatsappClicks = typeof liveAdData.whatsappClicks === 'number' ? liveAdData.whatsappClicks : (fallbackAd?.whatsappClicks ?? 0);

  let finalViews = loggedViews;
  let finalClicks = loggedClicks;
  let finalCallClicks = loggedCallClicks;
  let finalWhatsappClicks = loggedWhatsappClicks;
  let finalShares = loggedShares;

  if (timeframe === 'all') {
    finalViews = Math.max(loggedViews, docViews);
    finalClicks = Math.max(loggedClicks, docClicks);
    finalCallClicks = Math.max(loggedCallClicks, docCallClicks);
    finalWhatsappClicks = Math.max(loggedWhatsappClicks, docWhatsappClicks);

    // If subcollection had no events (e.g. legacy ad), ensure today's bucket reflects the totals
    if (filteredLogs.length === 0) {
      const todayKey = format(now, 'yyyy-MM-dd');
      if (dailyMap[todayKey]) {
        dailyMap[todayKey].views = finalViews;
        dailyMap[todayKey].clicks = finalClicks;
        dailyMap[todayKey].callClicks = finalCallClicks;
        dailyMap[todayKey].whatsappClicks = finalWhatsappClicks;
        dailyMap[todayKey].total = finalViews + finalClicks + finalCallClicks + finalWhatsappClicks;
      }
    }
  }

  // Total interactions includes ad card clicks, call clicks, whatsapp clicks, and shares
  const totalInteractions = finalClicks + finalCallClicks + finalWhatsappClicks + finalShares;
  const interactionRate = finalViews > 0 ? Number(((totalInteractions / finalViews) * 100).toFixed(1)) : 0;

  // Convert dailyMap to sorted array
  const dailyBreakdown: AdActivityDailyPoint[] = Object.keys(dailyMap)
    .sort()
    .map((dateKey) => {
      const item = dailyMap[dateKey];
      return {
        date: dateKey,
        formattedDate: format(item.dateObj, 'EEE d MMM', { locale: ar }),
        views: item.views,
        clicks: item.clicks,
        callClicks: item.callClicks,
        whatsappClicks: item.whatsappClicks,
        total: item.total,
      };
    });

  // Recent events list (up to 50 events)
  let recentEvents: AdActivityEvent[] = filteredLogs.slice(0, 50).map((log) => ({
    id: log.id,
    adId,
    type: log.type,
    timestamp: log.timestampDate.toISOString(),
    device: log.device,
    dateStr: log.dateStr,
  }));

  // Fallback synthetic recent event if subcollection is empty but live numbers exist
  if (recentEvents.length === 0 && (finalViews > 0 || finalClicks > 0)) {
    if (finalClicks > 0) {
      recentEvents.push({
        id: 'legacy-click',
        adId,
        type: 'click',
        timestamp: now.toISOString(),
        device: 'mobile',
        dateStr: format(now, 'yyyy-MM-dd'),
      });
    }
    if (finalViews > 0) {
      recentEvents.push({
        id: 'legacy-view',
        adId,
        type: 'view',
        timestamp: now.toISOString(),
        device: 'desktop',
        dateStr: format(now, 'yyyy-MM-dd'),
      });
    }
  }

  return {
    adId,
    timeframe,
    views: finalViews,
    clicks: finalClicks,
    callClicks: finalCallClicks,
    whatsappClicks: finalWhatsappClicks,
    shares: finalShares,
    totalInteractions,
    interactionRate,
    dailyBreakdown,
    recentEvents,
    lastUpdated: now.toISOString(),
  };
}

/**
 * Resets counters and clears activity logs for an ad.
 */
export async function resetAdActivityLogs(adId: string, sellerUserId?: string): Promise<void> {
  if (!adId) return;

  try {
    const zeroPayload = {
      views: 0,
      clicks: 0,
      callClicks: 0,
      whatsappClicks: 0,
    };

    // 1. Reset top-level ad document
    const adRef = doc(firestore, 'ads', adId);
    await updateDoc(adRef, zeroPayload).catch(() => {});

    // 2. Reset user subcollection if sellerUserId is provided
    if (sellerUserId && sellerUserId !== 'owner' && sellerUserId !== 'undefined') {
      const userAdRef = doc(firestore, 'users', sellerUserId, 'ads', adId);
      await updateDoc(userAdRef, zeroPayload).catch(() => {});
    }

    // 3. Delete all events in activity_logs subcollection
    const logsCol = collection(firestore, 'ads', adId, 'activity_logs');
    const snapshot = await getDocs(logsCol);
    if (!snapshot.empty) {
      const batch = writeBatch(firestore);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error(`[resetAdActivityLogs] Error resetting logs for ad ${adId}:`, error);
    throw error;
  }
}
