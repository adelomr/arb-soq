
'use client';
/**
 * firebase-storage-helpers.ts
 *
 * Single-file helpers for reliable upload/delete using Firebase Storage.
 * - uploadFileAndReturnInfo: يرفع ملف ويعيد { url, path, name, size }
 * - buildStorageRefFromEntry: يبني مرجع Storage من URL أو path أو {url,path}
 * - deleteStorageEntry: يحذف عنصر واحد بأمان
 * - deleteMultipleEntries: يحذف مصفوفة عناصر بأمان
 *
 * Usage:
 *  - عند رفع صور لإعلان: خزّن كل عنصر كـ { url, path, name, size } في Firestore (مثلاً حقل imageMeta)
 *  - عند الحذف: استدعي deleteMultipleEntries(user.imageMeta)
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, Storage, ref as storageRefResolver } from 'firebase/storage';
import type { FirebaseStorage, StorageReference } from 'firebase/storage';

/** تأكد من وجود Storage instance */
function ensureStorage(storage?: FirebaseStorage): FirebaseStorage {
  try {
    return storage || getStorage();
  } catch (e) {
    throw new Error('Firebase Storage not initialized. Pass a Storage instance or initialize Firebase first.');
  }
}

/** يرفع ملفًا ويعيد كائن يحتوي على url و path (fullPath) وغيرها */
export async function uploadFileAndReturnInfo(file: File | Blob, basePath: string, storage?: FirebaseStorage) {
  const s = ensureStorage(storage);
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${(file as File).name || 'file'}`.replace(/\s+/g, '_');
  const storageRef = storageRefResolver(s, `${basePath}/${safeName}`);
  const snapshot = await uploadBytes(storageRef, file as any);
  const url = await getDownloadURL(snapshot.ref);
  const path = snapshot.ref.fullPath; // مثال: "ads/uid/1600000_xxx.png"
  return { url, path, name: (file as File).name || safeName, size: (file as File).size || 0 };
}

/**
 * يحاول بناء Reference صالح لـ deleteObject من:
 * - كائن { path } أو { url, path }
 * - download URL (https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media&token=...)
 * - gs://bucket/path
 * - أو مسار التخزين المباشر مثل 'ads/uid/xxx.png'
 */
export function buildStorageRefFromEntry(entry: any, storage?: FirebaseStorage): StorageReference | null {
  const s = ensureStorage(storage);
  if (!entry) return null;

  // إذا كان كائنًا وبه path
  if (typeof entry === 'object') {
    if (entry.path) {
      try { return storageRefResolver(s, entry.path); } catch { /* continue */ }
    }
    if (entry.url && typeof entry.url === 'string') {
      entry = entry.url;
    }
  }

  if (typeof entry !== 'string') return null;
  const str = entry as string;

  // gs://bucket/path
  if (str.startsWith('gs://')) {
    try { return storageRefResolver(s, str); } catch { /* fallthrough */ }
  }

  // download URL pattern: /o/<encodedPath>?
  // مثال: https://firebasestorage.googleapis.com/v0/b/myapp.appspot.com/o/ads%2Fuid%2Ffile.png?alt=media&token=...
  if (str.startsWith('https://firebasestorage.googleapis.com')) {
    try { return storageRefResolver(s, str); } catch { /* fallthrough */ }
  }


  // ربما يكون المسار مباشرًا (fullPath)
  try {
    return storageRefResolver(s, str);
  } catch (e) {
    return null;
  }
}

/** يحذف مدخل تخزين واحد (entry يمكن أن تكون string url/path أو كائن {url,path}) */
export async function deleteStorageEntry(entry: any, storage?: FirebaseStorage): Promise<{ success: boolean; error?: any; entry?: any; }> {
  const s = ensureStorage(storage);
  const storageRef = buildStorageRefFromEntry(entry, s);
  if (!storageRef) {
    return { success: false, error: 'invalid-storage-reference', entry };
  }
  try {
    await deleteObject(storageRef);
    return { success: true, entry };
  } catch (error: any) {
    // تجاهل خطأ عدم العثور على العنصر إن أردت (object-not-found)
    if (error?.code === 'storage/object-not-found') {
      // اعتبرها ناجحة لأن الملف غير موجود أساساً
      return { success: true, entry };
    }
    return { success: false, error, entry };
  }
}

/** يحذف مصفوفة عناصر بأمان ويعيد تقرير النتائج */
export async function deleteMultipleEntries(entries: any[] | undefined, storage?: FirebaseStorage) {
  const results: Array<{ entry: any; success: boolean; error?: any }> = [];
  if (!entries || entries.length === 0) return results;

  const promises = entries.map(e => deleteStorageEntry(e, storage));
  const settled = await Promise.allSettled(promises);

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push({ entry: entries[index], success: result.value.success, error: result.value.error });
    } else {
      results.push({ entry: entries[index], success: false, error: result.reason });
    }
  });
  
  return results;
}
