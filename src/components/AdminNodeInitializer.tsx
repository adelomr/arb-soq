'use client';

import { useEffect } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';

export default function AdminNodeInitializer() {
  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Only attempt when a user is signed in
      if (!user) return;

      try {
        const database = getDatabase(app);
        const adminRef = ref(database, 'مسؤل');
        
        // التحقق مما إذا كانت العقدة موجودة مسبقاً
        const snapshot = await get(adminRef);
        
        if (!snapshot.exists()) {
          // إذا لم تكن العقدة موجودة، قم بإنشائها بالقيم الافتراضية
          await set(adminRef, {
            "التكوين": {
              "بريد إلكتروني": "admin@soq-omal.com",
              "كلمة المرور": "123456",
              "دور": "مسؤل",
              "uid": "ASdOdwoWsAThv19KRrj4PNy9N2y1"
            }
          });
          console.log("✅ تم إنشاء عقدة 'مسؤل' الافتراضية لأول مرة.");
        }
      } catch (error: any) {
        // Silently ignore permission errors (user is not admin — expected)
        const code = error?.code || error?.message || '';
        const isPermissionDenied =
          code === 'PERMISSION_DENIED' ||
          code.includes('PERMISSION_DENIED') ||
          code.includes('permission-denied');
        if (!isPermissionDenied) {
          console.error("❌ حدث خطأ أثناء التحقق من/أو إنشاء عقدة المسؤول:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // هذا المكون يعمل في الخلفية ولا يظهر أي شيء على الشاشة
  return null;
}

