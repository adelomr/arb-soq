import { firestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  increment,
  writeBatch
} from 'firebase/firestore';
import { AdPlacement, DEFAULT_AD_PLACEMENTS } from './ad-placement-types';

const COLLECTION_NAME = 'ad_placements';

/**
 * Initialize default ad placements if the collection is empty or missing slots
 */
export async function initDefaultPlacements(): Promise<AdPlacement[]> {
  try {
    const colRef = collection(firestore, COLLECTION_NAME);
    const snap = await getDocs(colRef);

    const existingMap = new Map<string, AdPlacement>();
    snap.docs.forEach((d) => {
      existingMap.set(d.data().slot_key, { id: d.id, ...d.data() } as AdPlacement);
    });

    const batch = writeBatch(firestore);
    let hasNewSeeds = false;

    const results: AdPlacement[] = [];

    for (const seed of DEFAULT_AD_PLACEMENTS) {
      if (!existingMap.has(seed.slot_key)) {
        const newDocRef = doc(colRef);
        const newPlacement: AdPlacement = {
          ...seed,
          id: newDocRef.id,
          impressions_count: 0,
          clicks_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        batch.set(newDocRef, newPlacement);
        results.push(newPlacement);
        hasNewSeeds = true;
      } else {
        results.push(existingMap.get(seed.slot_key)!);
      }
    }

    // Also include any user-created custom placements
    existingMap.forEach((placement, key) => {
      if (!DEFAULT_AD_PLACEMENTS.some((s) => s.slot_key === key)) {
        results.push(placement);
      }
    });

    if (hasNewSeeds) {
      await batch.commit();
    }

    return results;
  } catch (error) {
    console.error('Error initializing ad placements:', error);
    // Return in-memory defaults on error
    return DEFAULT_AD_PLACEMENTS.map((s, idx) => ({
      ...s,
      id: `local-seed-${idx}`,
      impressions_count: 0,
      clicks_count: 0,
    }));
  }
}

/**
 * Get all placements (with automatic seeding if needed)
 */
export async function getAllPlacements(): Promise<AdPlacement[]> {
  try {
    const colRef = collection(firestore, COLLECTION_NAME);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      return await initDefaultPlacements();
    }

    const map = new Map<string, AdPlacement>();
    snap.forEach((d) => {
      const data = d.data() as AdPlacement;
      const placement: AdPlacement = { ...data, id: d.id };
      if (!map.has(placement.slot_key)) {
        map.set(placement.slot_key, placement);
      }
    });

    const placements = Array.from(map.values());

    // If some default slots are missing, seed them
    const missingSeeds = DEFAULT_AD_PLACEMENTS.some(
      (s) => !placements.some((p) => p.slot_key === s.slot_key)
    );
    if (missingSeeds) {
      return await initDefaultPlacements();
    }

    return placements;
  } catch (error) {
    console.error('Error fetching all ad placements:', error);
    return initDefaultPlacements();
  }
}

/**
 * Get a single active placement by slot_key for public frontend display
 */
export async function getPlacementBySlotKey(slotKey: string): Promise<AdPlacement | null> {
  try {
    const colRef = collection(firestore, COLLECTION_NAME);
    const q = query(colRef, where('slot_key', '==', slotKey));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Look up default seed if available
      const seed = DEFAULT_AD_PLACEMENTS.find((s) => s.slot_key === slotKey);
      if (seed && seed.is_active) {
        return {
          ...seed,
          id: `seed-${slotKey}`,
          impressions_count: 0,
          clicks_count: 0,
        };
      }
      return null;
    }

    const docData = snap.docs[0].data() as AdPlacement;
    const placement: AdPlacement = {
      ...docData,
      id: snap.docs[0].id,
    };

    if (!placement.is_active) {
      return null;
    }

    // Check expiry date if specified
    if (placement.expiry_date) {
      const now = new Date();
      const expiry = new Date(placement.expiry_date);
      if (now > expiry) {
        return null; // Expired
      }
    }

    return placement;
  } catch (error) {
    console.error(`Error fetching placement for slot ${slotKey}:`, error);
    return null;
  }
}

/**
 * Save or update an ad placement
 */
export async function savePlacement(placement: Partial<AdPlacement> & { id: string }): Promise<void> {
  const docRef = doc(firestore, COLLECTION_NAME, placement.id);
  const updatedData = {
    ...placement,
    updated_at: new Date().toISOString(),
  };
  await updateDoc(docRef, updatedData);
}

/**
 * Create a new custom ad placement
 */
export async function createPlacement(
  data: Omit<AdPlacement, 'id' | 'impressions_count' | 'clicks_count'>
): Promise<AdPlacement> {
  const colRef = collection(firestore, COLLECTION_NAME);
  const newDocRef = doc(colRef);
  const newPlacement: AdPlacement = {
    ...data,
    id: newDocRef.id,
    impressions_count: 0,
    clicks_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await setDoc(newDocRef, newPlacement);
  return newPlacement;
}

/**
 * Delete a custom ad placement
 */
export async function deletePlacement(id: string): Promise<void> {
  const docRef = doc(firestore, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Track impression (increment impressions_count atomically)
 */
export async function trackAdImpression(placementId: string): Promise<void> {
  if (!placementId || placementId.startsWith('seed-') || placementId.startsWith('local-seed-')) return;
  try {
    const docRef = doc(firestore, COLLECTION_NAME, placementId);
    await updateDoc(docRef, {
      impressions_count: increment(1),
    });
  } catch (error) {
    // Non-critical, ignore impression tracking errors
  }
}

/**
 * Track click (increment clicks_count atomically)
 */
export async function trackAdClick(placementId: string): Promise<void> {
  if (!placementId || placementId.startsWith('seed-') || placementId.startsWith('local-seed-')) return;
  try {
    const docRef = doc(firestore, COLLECTION_NAME, placementId);
    await updateDoc(docRef, {
      clicks_count: increment(1),
    });
  } catch (error) {
    // Non-critical
  }
}

/**
 * Reset statistics (impressions and clicks) for an ad placement
 */
export async function resetPlacementStats(placementId: string): Promise<void> {
  const docRef = doc(firestore, COLLECTION_NAME, placementId);
  await updateDoc(docRef, {
    impressions_count: 0,
    clicks_count: 0,
    updated_at: new Date().toISOString(),
  });
}
