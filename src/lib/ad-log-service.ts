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
 * Log an ad activity event (view, call, whatsapp, share)
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
        type: data.type as AdActivityEventType,
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

  let views = 0;
  let callClicks = 0;
  let whatsappClicks = 0;
  let shares = 0;

  // Aggregate daily breakdown
  const dailyMap: Record<string, { views: number; callClicks: number; whatsappClicks: number; total: number; dateObj: Date }> = {};

  // If timeframe is 7d or 30d or 24h, initialize days so chart has continuous timeline
  const daysSpan = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
  for (let i = daysSpan - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const key = format(d, 'yyyy-MM-dd');
    dailyMap[key] = {
      views: 0,
      callClicks: 0,
      whatsappClicks: 0,
      total: 0,
      dateObj: d,
    };
  }

  filteredLogs.forEach((log) => {
    if (log.type === 'view') views++;
    else if (log.type === 'call') callClicks++;
    else if (log.type === 'whatsapp') whatsappClicks++;
    else if (log.type === 'share') shares++;

    const key = log.dateStr;
    if (!dailyMap[key]) {
      dailyMap[key] = {
        views: 0,
        callClicks: 0,
        whatsappClicks: 0,
        total: 0,
        dateObj: log.timestampDate,
      };
    }

    if (log.type === 'view') dailyMap[key].views++;
    else if (log.type === 'call') dailyMap[key].callClicks++;
    else if (log.type === 'whatsapp') dailyMap[key].whatsappClicks++;
    dailyMap[key].total++;
  });

  // Fallback if no subcollection events found (e.g. legacy ads)
  if (filteredLogs.length === 0 && timeframe === 'all' && fallbackAd) {
    views = fallbackAd.views || 0;
    callClicks = fallbackAd.callClicks || 0;
    whatsappClicks = fallbackAd.whatsappClicks || 0;
  }

  const totalInteractions = callClicks + whatsappClicks + shares;
  const interactionRate = views > 0 ? Number(((totalInteractions / views) * 100).toFixed(1)) : 0;

  // Convert dailyMap to sorted array
  const dailyBreakdown: AdActivityDailyPoint[] = Object.keys(dailyMap)
    .sort()
    .map((dateKey) => {
      const item = dailyMap[dateKey];
      return {
        date: dateKey,
        formattedDate: format(item.dateObj, 'EEE d MMM', { locale: ar }),
        views: item.views,
        callClicks: item.callClicks,
        whatsappClicks: item.whatsappClicks,
        total: item.total,
      };
    });

  // Recent events list (up to 30 events)
  const recentEvents: AdActivityEvent[] = filteredLogs.slice(0, 30).map((log) => ({
    id: log.id,
    adId,
    type: log.type,
    timestamp: log.timestampDate.toISOString(),
    device: log.device,
    dateStr: log.dateStr,
  }));

  return {
    adId,
    timeframe,
    views,
    callClicks,
    whatsappClicks,
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
export async function resetAdActivityLogs(adId: string): Promise<void> {
  if (!adId) return;

  try {
    const adRef = doc(firestore, 'ads', adId);
    await updateDoc(adRef, {
      views: 0,
      clicks: 0,
      callClicks: 0,
      whatsappClicks: 0,
    });

    // Delete subcollection docs in batch
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
