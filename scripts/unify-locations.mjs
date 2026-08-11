import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, collection as clientCollection, getDocs as getClientDocs, doc as clientDoc, updateDoc as clientUpdateDoc } from 'firebase/firestore';
import { getAuth as getClientAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

// Firebase configuration matching the project settings
const firebaseConfig = {
  apiKey: "AIzaSyDpWBWFpS7NWvkAGR2FZlrH901qVwB0Iww",
  authDomain: "arb-soq.firebaseapp.com",
  databaseURL: "https://arb-soq-default-rtdb.firebaseio.com",
  projectId: "arb-soq",
  storageBucket: "arb-soq.firebasestorage.app",
  messagingSenderId: "264703833176",
  appId: "1:264703833176:web:a66bad059758a42fc3862d",
};

const USERS_COLLECTION = 'users';
const ADS_COLLECTION = 'ads';

async function runUnification() {
  console.log("=== بدء عملية توحيد حقول الموقع والحالة في قاعدة البيانات ===");

  const serviceAccountPath = path.resolve('./serviceAccountKey.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log("🔑 تم العثور على ملف serviceAccountKey.json. استخدام Firebase Admin SDK...");
    try {
      const { default: admin } = await import('firebase-admin');
      
      if (admin.apps.length === 0) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
      
      const db = admin.firestore();
      
      // --- 1. Users ---
      console.log("\n--- جلب وتوحيد بيانات المستخدمين (Admin SDK) ---");
      const usersSnapshot = await db.collection(USERS_COLLECTION).get();
      console.log(`تم جلب ${usersSnapshot.size} مستخدم.`);
      
      let updatedUsersCount = 0;
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        const updates = {};
        
        let governorate = userData.governorate || '';
        let province = userData.province || '';
        if (province && !governorate) {
          governorate = province;
        } else if (governorate && !province) {
          province = governorate;
        }
        
        if (governorate !== (userData.governorate || '')) {
          updates.governorate = governorate.trim();
        }
        if (province !== (userData.province || '')) {
          updates.province = province.trim();
        }
        if (userData.country !== undefined && typeof userData.country === 'string') {
          const trimmed = userData.country.trim();
          if (trimmed !== userData.country) updates.country = trimmed;
        }
        if (userData.city !== undefined && typeof userData.city === 'string') {
          const trimmed = userData.city.trim();
          if (trimmed !== userData.city) updates.city = trimmed;
        }
        if (userData.village !== undefined && typeof userData.village === 'string') {
          const trimmed = userData.village.trim();
          if (trimmed !== userData.village) updates.village = trimmed;
        }
        
        if (Object.keys(updates).length > 0) {
          await doc.ref.update(updates);
          console.log(`✅ تم تحديث المستخدم: ${userData.fullName || doc.id} ->`, updates);
          updatedUsersCount++;
        }
      }
      console.log(`تم تحديث ${updatedUsersCount} مستخدم.`);
      
      // --- 2. Ads ---
      console.log("\n--- جلب وتوحيد بيانات الإعلانات (Admin SDK) ---");
      const adsSnapshot = await db.collection(ADS_COLLECTION).get();
      console.log(`تم جلب ${adsSnapshot.size} إعلان.`);
      
      let updatedAdsCount = 0;
      for (const doc of adsSnapshot.docs) {
        const adData = doc.data();
        const updates = {};
        
        let governorate = adData.governorate || '';
        let province = adData.province || '';
        if (province && !governorate) {
          governorate = province;
        } else if (governorate && !province) {
          province = governorate;
        }
        
        if (governorate !== (adData.governorate || '')) {
          updates.governorate = governorate.trim();
        }
        if (province !== (adData.province || '')) {
          updates.province = province.trim();
        }
        if (adData.country !== undefined && typeof adData.country === 'string') {
          const trimmed = adData.country.trim();
          if (trimmed !== adData.country) updates.country = trimmed;
        }
        if (adData.city !== undefined && typeof adData.city === 'string') {
          const trimmed = adData.city.trim();
          if (trimmed !== adData.city) updates.city = trimmed;
        }
        if (adData.village !== undefined && typeof adData.village === 'string') {
          const trimmed = adData.village.trim();
          if (trimmed !== adData.village) updates.village = trimmed;
        }
        
        const status = adData.status || '';
        const shouldBeActive = (status === 'active');
        if (adData.active !== shouldBeActive) {
          updates.active = shouldBeActive;
        }
        if (adData.isActive !== shouldBeActive) {
          updates.isActive = shouldBeActive;
        }
        
        if (Object.keys(updates).length > 0) {
          await doc.ref.update(updates);
          console.log(`✅ تم تحديث الإعلان: "${adData.title || doc.id}" ->`, updates);
          updatedAdsCount++;
        }
      }
      console.log(`تم تحديث ${updatedAdsCount} إعلان.`);
      console.log(`\n=== 🎉 اكتملت عملية توحيد البيانات بنجاح! ===`);
      return;
    } catch (adminError) {
      console.error("❌ خطأ أثناء استخدام Firebase Admin SDK:", adminError);
      console.log("محاولة الرجوع لاستخدام Client SDK...");
    }
  }

  // Client SDK Fallback
  console.log("🔄 استخدام Firebase Client SDK...");
  const app = initializeClientApp(firebaseConfig);
  const firestore = getClientFirestore(app);
  const auth = getClientAuth(app);

  let usersSnapshot;
  try {
    console.log("محاولة جلب البيانات مباشرة بدون تسجيل دخول...");
    usersSnapshot = await getClientDocs(clientCollection(firestore, USERS_COLLECTION));
    console.log("🔓 تم الوصول لقاعدة البيانات مباشرة بدون تسجيل دخول!");
  } catch (error) {
    console.log("🔒 قواعد الحماية تمنع الوصول مباشرة. محاولة تسجيل الدخول كمسؤول...");
    try {
      await signInWithEmailAndPassword(auth, "admin@soq-omal.com", "123456");
      console.log("🔓 تم تسجيل الدخول كمسؤول بنجاح!");
      usersSnapshot = await getClientDocs(clientCollection(firestore, USERS_COLLECTION));
    } catch (authError) {
      console.error("\n❌ فشل الوصول لقاعدة البيانات!");
      if (authError.code === 'auth/operation-not-allowed') {
        console.error(`
⚠️  خطأ: طريقة تسجيل الدخول بالبريد الإلكتروني وكلمة المرور (Email/Password) معطلة في لوحة تحكم Firebase الخاصة بك.

لحل هذا الخطأ وتفعيل السكريبت، يمكنك القيام بأحد الخيارين التاليين:

الخيار الأول (الأسهل والأسرع):
1. اذهب إلى Firebase Console -> Authentication -> Sign-in method.
2. قم بتفعيل موفر تسجيل الدخول "البريد الإلكتروني/كلمة المرور" (Email/Password).
3. أعد تشغيل هذا السكريبت.

الخيار الثاني (الأكثر أماناً):
1. اذهب إلى Firebase Console -> Project Settings -> Service Accounts.
2. اضغط على زر "Generate new private key" لتحميل ملف المفاتيح.
3. احفظ الملف باسم "serviceAccountKey.json" داخل هذا المجلد:
   D:\\mashro3\\mashroh\\arb_soq.wap\\arb-soq\\
4. أعد تشغيل هذا السكريبت، وسيقوم تلقائياً بتجاوز قواعد الحماية كمسؤول نظام.
`);
      } else {
        console.error("تفاصيل الخطأ:", authError.message || authError);
      }
      return;
    }
  }

  // If client access succeeds:
  try {
    let updatedUsersCount = 0;
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const updates = {};

      let governorate = userData.governorate || '';
      let province = userData.province || '';
      if (province && !governorate) {
        governorate = province;
      } else if (governorate && !province) {
        province = governorate;
      }

      if (governorate !== (userData.governorate || '')) {
        updates.governorate = governorate.trim();
      }
      if (province !== (userData.province || '')) {
        updates.province = province.trim();
      }
      if (userData.country !== undefined && typeof userData.country === 'string') {
        const trimmed = userData.country.trim();
        if (trimmed !== userData.country) updates.country = trimmed;
      }
      if (userData.city !== undefined && typeof userData.city === 'string') {
        const trimmed = userData.city.trim();
        if (trimmed !== userData.city) updates.city = trimmed;
      }
      if (userData.village !== undefined && typeof userData.village === 'string') {
        const trimmed = userData.village.trim();
        if (trimmed !== userData.village) updates.village = trimmed;
      }

      if (Object.keys(updates).length > 0) {
        const userRef = clientDoc(firestore, USERS_COLLECTION, userId);
        await clientUpdateDoc(userRef, updates);
        console.log(`✅ تم تحديث بيانات المستخدم: ${userData.fullName || userId} ->`, updates);
        updatedUsersCount++;
      }
    }
    console.log(`تم تحديث ${updatedUsersCount} مستخدم.`);

    // --- Ads ---
    console.log("\n--- جلب وتوحيد بيانات الإعلانات ---");
    const adsSnapshot = await getClientDocs(clientCollection(firestore, ADS_COLLECTION));
    let updatedAdsCount = 0;

    for (const adDoc of adsSnapshot.docs) {
      const adData = adDoc.data();
      const adId = adDoc.id;
      const updates = {};

      let governorate = adData.governorate || '';
      let province = adData.province || '';
      if (province && !governorate) {
        governorate = province;
      } else if (governorate && !province) {
        province = governorate;
      }

      if (governorate !== (adData.governorate || '')) {
        updates.governorate = governorate.trim();
      }
      if (province !== (adData.province || '')) {
        updates.province = province.trim();
      }
      if (adData.country !== undefined && typeof adData.country === 'string') {
        const trimmed = adData.country.trim();
        if (trimmed !== adData.country) updates.country = trimmed;
      }
      if (adData.city !== undefined && typeof adData.city === 'string') {
        const trimmed = adData.city.trim();
        if (trimmed !== adData.city) updates.city = trimmed;
      }
      if (adData.village !== undefined && typeof adData.village === 'string') {
        const trimmed = adData.village.trim();
        if (trimmed !== adData.village) updates.village = trimmed;
      }

      const status = adData.status || '';
      const shouldBeActive = (status === 'active');
      if (adData.active !== shouldBeActive) {
        updates.active = shouldBeActive;
      }
      if (adData.isActive !== shouldBeActive) {
        updates.isActive = shouldBeActive;
      }

      if (Object.keys(updates).length > 0) {
        const adRef = clientDoc(firestore, ADS_COLLECTION, adId);
        await clientUpdateDoc(adRef, updates);
        console.log(`✅ تم تحديث الإعلان: "${adData.title || adId}" ->`, updates);
        updatedAdsCount++;
      }
    }
    console.log(`تم تحديث ${updatedAdsCount} إعلان.`);
    console.log(`\n=== 🎉 اكتملت عملية توحيد البيانات بنجاح! ===`);
  } catch (err) {
    console.error("❌ حدث خطأ أثناء معالجة البيانات:", err);
  }
}

runUnification();
