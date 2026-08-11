'use client';
/**
 * firebase-storage-helpers.ts
 *
 * Single-file helpers for reliable upload/delete using Firebase Storage.
 * - convertToWebP: تحويل الصور تلقائياً إلى صيغة WebP فائقة الضغط والسرعة
 * - uploadFileAndReturnInfo: يرفع ملف ويعيد { url, path, name, size }
 * - buildStorageRefFromEntry: يبني مرجع Storage من URL أو path أو {url,path}
 * - deleteStorageEntry: يحذف عنصر واحد بأمان
 * - deleteMultipleEntries: يحذف مصفوفة عناصر بأمان
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, ref as storageRefResolver } from 'firebase/storage';
import type { FirebaseStorage, StorageReference } from 'firebase/storage';

/** تأكد من وجود Storage instance */
function ensureStorage(storage?: FirebaseStorage): FirebaseStorage {
  try {
    return storage || getStorage();
  } catch (e) {
    throw new Error('Firebase Storage not initialized. Pass a Storage instance or initialize Firebase first.');
  }
}

/**
 * تحويل الصورة المرفوعة من قِبل المستخدم تلقائياً إلى صيغة WebP
 * مما يقلل حجم الصورة بنسبة 70% إلى 80% مع الحفاظ على الجودة الممتازة
 */
export async function convertToWebP(file: File, quality = 0.82, maxWidth = 1920): Promise<Blob | File> {
  // إذا لم يكن ملف صورة أو كان بالفعل WebP أو SVG، لا نلمسه
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // تصغير الأبعاد النسبية إن كانت أكبر من الحد الأقصى
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file); // إذا لم يكن الحجم أصغر، نستخدم الملف الأصلي
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/** يرفع ملفًا ويعيد كائن يحتوي على url و path (fullPath) وغيرها */
export async function uploadFileAndReturnInfo(file: File | Blob, basePath: string, storage?: FirebaseStorage) {
  const s = ensureStorage(storage);
  
  // تحويل الصور تلقائياً إلى WebP قبل الرفع لتسريع الأداء وتوفير المساحة
  let fileToUpload = file;
  if (file instanceof File && file.type.startsWith('image/')) {
    fileToUpload = await convertToWebP(file);
  }

  const isWebP = fileToUpload.type === 'image/webp';
  const originalName = (file as File).name || 'file';
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const extension = isWebP ? 'webp' : (originalName.split('.').pop() || 'bin');

  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${nameWithoutExt}.${extension}`.replace(/\s+/g, '_');
  const storageRef = storageRefResolver(s, `${basePath}/${safeName}`);
  
  const snapshot = await uploadBytes(storageRef, fileToUpload as any, {
    contentType: fileToUpload.type || 'image/webp',
    cacheControl: 'public, max-age=31536000, immutable',
  });
  
  const url = await getDownloadURL(snapshot.ref);
  const path = snapshot.ref.fullPath;
  return { url, path, name: `${nameWithoutExt}.${extension}`, size: fileToUpload.size || 0 };
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

  if (str.startsWith('gs://')) {
    try { return storageRefResolver(s, str); } catch { /* fallthrough */ }
  }

  if (str.startsWith('https://firebasestorage.googleapis.com')) {
    try { return storageRefResolver(s, str); } catch { /* fallthrough */ }
  }

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
    if (error?.code === 'storage/object-not-found') {
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
      results.push({ entry: entries[index], success: (result as any).value.success, error: (result as any).value.error });
    } else {
      results.push({ entry: entries[index], success: false, error: (result as any).reason });
    }
  });
  
  return results;
}
