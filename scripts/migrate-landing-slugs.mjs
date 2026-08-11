import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration matching the project settings
const firebaseConfig = {
  apiKey: "AIzaSyDpWBWFpS7NWvkAGR2FZlrH901qVwB0Iww",
  authDomain: "arb-soq.firebaseapp.com",
  projectId: "arb-soq",
  storageBucket: "arb-soq.firebasestorage.app",
  messagingSenderId: "264703833176",
  appId: "1:264703833176:web:a66bad059758a42fc3862d",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

const PAGES_COLLECTION = 'pages';

const prefixList = ["شركة", "فني", "معلم", "محل", "ورشة", "مكتب", "خدمات", "كشف", "نقل", "عزل", "تنظيف", "مكافحة", "رش", "صيانة"];
const stopwords = ['أفضل', 'افضل', 'ممتاز', 'رقم', 'خصم', 'بخصم', 'ارخص', 'أرخص', 'بأرخص', 'بارخص', 'للاتصال', 'اتصل', 'جوال', 'تليفون', 'هاتف'];

async function runMigration() {
  console.log("=== بدء عملية ترحيل روابط صفحات الهبوط ===");

  try {
    // تسجيل الدخول كمسؤول أولاً للحصول على الصلاحيات الكافية
    console.log("محاولة تسجيل الدخول كمسؤول...");
    await signInWithEmailAndPassword(auth, "admin@soq-omal.com", "123456");
    console.log("🔓 تم تسجيل الدخول كمسؤول بنجاح!");

    const querySnapshot = await getDocs(collection(firestore, PAGES_COLLECTION));
    const allPages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`تم جلب ${allPages.length} صفحة من قاعدة البيانات.`);

    // 1. جمع كل الـ slugs الحالية لتجنب التكرار
    const usedSlugs = new Set();
    // نضيف الصفحات غير الهبوط أولاً لتفادي الاصطدام بها
    allPages.forEach(page => {
      if (page.pageType !== 'landing') {
        usedSlugs.add(page.slug);
      }
    });

    let migratedCount = 0;

    for (const page of allPages) {
      if (page.pageType !== 'landing') {
        continue;
      }

      console.log(`\nمعالجة صفحة الهبوط: "${page.title}" (slug الحالي: ${page.slug})`);

      const oldSlug = page.slug;
      const words = oldSlug.split('-');
      const cleanWords = [];

      for (const word of words) {
        // إذا كانت الكلمة تحتوي على أرقام أو هي كلمة مفتاحية توقف
        if (/[0-9\u0660-\u0669]/.test(word) || stopwords.includes(word.toLowerCase())) {
          break;
        }
        cleanWords.push(word);
      }

      // إذا كانت التصفية فارغة نستخدم أول 3 كلمات
      if (cleanWords.length === 0) {
        cleanWords.push(...words.slice(0, 3));
      }

      const baseNewSlug = cleanWords.join('-');

      // التحقق من عدم التكرار وتوليد slug فريد
      let finalSlug = baseNewSlug;
      let counter = 2;
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${baseNewSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(finalSlug);

      // تحديد اسم الخدمة والمنطقة
      let serviceName = "";
      let serviceArea = "";

      if (cleanWords.length >= 3 && prefixList.includes(cleanWords[0])) {
        serviceName = cleanWords.slice(0, 2).join(' ');
        serviceArea = cleanWords.slice(2).join(' ');
      } else if (cleanWords.length > 0) {
        serviceName = cleanWords[0];
        serviceArea = cleanWords.slice(1).join(' ');
      } else {
        serviceName = page.title;
        serviceArea = "";
      }

      console.log(`-> الـ slug المقترح الجديد: ${finalSlug}`);
      console.log(`-> الخدمة المستخرجة: "${serviceName}"`);
      console.log(`-> المنطقة المستخرجة: "${serviceArea}"`);

      // تجهيز الحقول للتحديث
      const updateData = {};
      
      // إذا كان الـ slug الجديد يختلف عن القديم، نقوم بحفظ القديم كـ legacySlug لعمل redirect
      if (oldSlug !== finalSlug) {
        updateData.slug = finalSlug;
        updateData.legacySlug = oldSlug;
        console.log(`-> سيتم تغيير الرابط وحفظ الرابط القديم كـ legacySlug`);
      } else {
        console.log(`-> الـ slug متطابق، لن يتم تغيير الرابط الأساسي`);
      }

      // حفظ الخدمة والمنطقة في قاعدة البيانات لتسهيل التعديل مستقبلاً
      if (!page.serviceName) {
        updateData.serviceName = serviceName;
      }
      if (!page.serviceArea) {
        updateData.serviceArea = serviceArea;
      }

      if (Object.keys(updateData).length > 0) {
        const pageDocRef = doc(firestore, PAGES_COLLECTION, page.id);
        await updateDoc(pageDocRef, updateData);
        console.log(`✅ تم تحديث الصفحة بنجاح!`);
        migratedCount++;
      } else {
        console.log(`ℹ️ لا توجد تغييرات مطلوبة لهذه الصفحة.`);
      }
    }

    console.log(`\n=== تم الانتهاء من الترحيل بنجاح! تم تحديث ${migratedCount} صفحة ===`);
  } catch (error) {
    console.error("❌ حدث خطأ أثناء الترحيل:", error);
  }
}

runMigration();
