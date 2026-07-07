import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// 1. إعداد الفايربيس (استخدم إعدادات مشروعك الحالية)
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

// 2. دالة لإضافة أو تعديل بيانات المسؤول في Cloud Firestore
export const setupAdminNode = async () => {
  try {
    const adminDocRef = doc(firestore, 'مسؤل', 'التكوين');
    
    await setDoc(adminDocRef, {
      "بريد إلكتروني": "admin@soq-omal.com",
      "كلمة المرور": "123456",
      "دور": "مسؤل",
      "uid": "ASdOdwoWsAThv19KRrj4PNy9N2y1"
    });

    console.log("✅ تم إضافة/تعديل عقدة المسؤول في Cloud Firestore بنجاح!");
  } catch (error) {
    console.error("❌ حدث خطأ أثناء إضافة العقدة:", error);
  }
};

// يمكن استدعاء الدالة لتنفيذ العملية
setupAdminNode();
