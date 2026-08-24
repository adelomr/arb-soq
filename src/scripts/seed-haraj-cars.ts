import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpWBWFpS7NWvkAGR2FZlrH901qVwB0Iww",
  authDomain: "arb-soq.firebaseapp.com",
  databaseURL: "https://arb-soq-default-rtdb.firebaseio.com",
  projectId: "arb-soq",
  storageBucket: "arb-soq.firebasestorage.app",
  messagingSenderId: "264703833176",
  appId: "1:264703833176:web:a66bad059758a42fc3862d",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const realHarajCars = [
  {
    title: "تويوتا كامري 2024 فل كامل GLE هايبرد وكالة عبداللطيف جميل",
    description: "للبيع تويوتا كامري 2024 فئة GLE هايبرد وارد عبداللطيف جميل (سعودي).\nالممشى: 15,000 كم فقط بحالة الوكالة.\nالمواصفات: فتحة سقف، شاشة كبيرة مع ملاحة وآبل كاربلاي، كاميرا خلفية، حساسات أمامية وخلفية، مثبت سرعة تفاعلي ورادار، تحديد مسار، مقاعد جلد كهربائية، بصمة ودخول ذكي، جنوط ألمنيوم 18 انش.\nالبودي وكالة خالي من الرش والسمكرة، قير ومكينة ومحركات وعضلات على الشرط والفحص بالوكالة.\nالسعر المطلوب: 118,000 ريال قابل للتفاوض البسيط للصامل.",
    brand: "تويوتا",
    category: "vehicles",
    categoryId: "vehicles",
    subcategory: "تويوتا",
    price: 118000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "منطقة الرياض",
    governorate: "الرياض",
    city: "الرياض",
    location: "الرياض - حي الروضة",
    condition: "used",
    adType: "sell-item",
    adTypeAr: "بيع منتج",
    status: "active",
    isActive: true,
    phoneNumber: "0501234567",
    showCommIcon: true,
    views: 142,
    clicks: 38,
    isPromoted: true,
    isFeatured: true,
    featuredTier: "gold",
    postedAt: new Date().toISOString(),
    imageUrls: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop&q=80"
    ],
    user: {
      name: "معرض النخبة للسيارات",
      fullName: "معرض النخبة للسيارات الحديثة",
      role: "verified",
      verified: true,
      phone: "0501234567",
      country: "السعودية",
      city: "الرياض"
    }
  },
  {
    title: "هيونداي إلنترا 2023 سمارت بلس وكالة المجدوعي بحالة ممتازة",
    description: "للبيع هيونداي النترا 2023 فئة Smart Plus وارد المجدوعي.\nالممشى: 38,000 كم.\nالمواصفات: محرك 2.0 لتر، قير أوتوماتيك CVT، شاشة لمس تدعم أبل كاربلاي وأندرويد أوتو، كاميرا خلفية، حساسات خلفية، مثبت سرعة، إضاءة ليد نهارية، جنوط 16 انش، تشغيل عن بعد، فتحات تكييف خلفية.\nحالة السيارة: بودي بلد ما عدا تعديل بدون رش في الرفرف الخلفي. محركات وعضلات مشروطة.\nالسعر: 76,000 ريال.",
    brand: "هيونداي",
    category: "vehicles",
    categoryId: "vehicles",
    subcategory: "هيونداي",
    price: 76000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "منطقة مكة المكرمة",
    governorate: "جدة",
    city: "جدة",
    location: "جدة - حي النزهة",
    condition: "used",
    adType: "sell-item",
    adTypeAr: "بيع منتج",
    status: "active",
    isActive: true,
    phoneNumber: "0559876543",
    showCommIcon: true,
    views: 89,
    clicks: 19,
    isPromoted: false,
    isFeatured: false,
    postedAt: new Date().toISOString(),
    imageUrls: [
      "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop&q=80"
    ],
    user: {
      name: "أبو فهد القحطاني",
      role: "user",
      verified: true,
      phone: "0559876543",
      country: "السعودية",
      city: "جدة"
    }
  },
  {
    title: "نيسان باترول بلاتينيوم 2022 V8 VVEL فل أوبشن بحالة الوكالة",
    description: "نيسان باترول بلاتينيوم 2022 محرك V8 كبير 400 حصان وارد بترومين.\nالممشى: 52,000 كم.\nالمواصفات: دبل ثقيل وخفيف، فتحة سقف، 5 كاميرات 360 درجة، رادار وتنبيه تصادم وخروج عن المسار، تبريد وتسخين مراتب، شاشات خلفية، سماعات بوز Bose الفاخرة، ثلاجة، هيدروليك، شنطة كهرباء، مقاعد جلد زعفراني ملكي.\nالسيارة عليها حماية كاملة وعازل حراري أصلي مع ضمان 5 سنوات.\nالحد: 215,000 ريال.",
    brand: "نيسان",
    category: "vehicles",
    categoryId: "vehicles",
    subcategory: "نيسان",
    price: 215000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "المنطقة الشرقية",
    governorate: "الدمام",
    city: "الدمام",
    location: "الدمام - حي الشاطئ",
    condition: "used",
    adType: "sell-item",
    adTypeAr: "بيع منتج",
    status: "active",
    isActive: true,
    phoneNumber: "0543219876",
    showCommIcon: true,
    views: 310,
    clicks: 74,
    isPromoted: true,
    isFeatured: true,
    featuredTier: "silver",
    postedAt: new Date().toISOString(),
    imageUrls: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop&q=80"
    ],
    user: {
      name: "سلطان بن خالد",
      role: "verified",
      verified: true,
      phone: "0543219876",
      country: "السعودية",
      city: "الدمام"
    }
  },
  {
    title: "مرسيدس E300 موديل 2023 AMG كيت بانوراما وارد الجفالي",
    description: "مرسيدس بنز E300 كت AMG وكالة الجفالي موديل 2023.\nاللون: رمادي ماجنو مطفي مميز والداخلية جلد أحمر ديزاينو.\nالممشى: 22,000 كم.\nالمواصفات: باقة AMG كاملة، سقف بانوراما مزدوج، إضاءة محيطية 64 لون، نظام صوتي Burmester 3D، قيادة شبه ذاتية ورادار ونقاط عمياء، بروجكتر Head-Up Display، كاميرات 360، أبواب شفط، جنوط 20 AMG.\nالسيارة خالية من أي ملاحظات ومعها صيانات مجانية في الوكالة.\nالسعر: 265,000 ريال.",
    brand: "مرسيدس",
    category: "vehicles",
    categoryId: "vehicles",
    subcategory: "مرسيدس",
    price: 265000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "منطقة الرياض",
    governorate: "الرياض",
    city: "الرياض",
    location: "الرياض - حي الملقا",
    condition: "used",
    adType: "sell-item",
    adTypeAr: "بيع منتج",
    status: "active",
    isActive: true,
    phoneNumber: "0567891234",
    showCommIcon: true,
    views: 420,
    clicks: 110,
    isPromoted: true,
    isFeatured: true,
    featuredTier: "gold",
    postedAt: new Date().toISOString(),
    imageUrls: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1000&auto=format&fit=crop&q=80"
    ],
    user: {
      name: "معرض أوتو زون الفاخر",
      role: "verified",
      verified: true,
      phone: "0567891234",
      country: "السعودية",
      city: "الرياض"
    }
  },
  {
    title: "فورد تيريتوري 2024 تيتانيوم Titanium أعلى فئة أصفار وكالة",
    description: "فورد تيريتوري 2024 Titanium أعلى فئة وارد توكيلات الجزيرة.\nالعداد: أصفار جديد بطاقة جمركية.\nالمواصفات: محرك 1.8 لتر إيكوبوست توربو، سقف بانورامي، شاشتين توأم 12.3 إنش، مراتب جلد بيج مع تبريد، كاميرات محيطية 360 درجة، رادار ونظام تجنب الاصطدام، شاحن لاسلكي، شنطة كهربائية مع حساس القدم.\nضمان 5 سنوات أو 100 ألف كم مع خدمة المساعدة على الطريق.\nالسعر: 105,000 ريال شامل الضريبة.",
    brand: "فورد",
    category: "vehicles",
    categoryId: "vehicles",
    subcategory: "فورد",
    price: 105000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "منطقة الرياض",
    governorate: "الرياض",
    city: "الرياض",
    location: "الرياض - حي الصحافة",
    condition: "new",
    adType: "sell-item",
    adTypeAr: "بيع منتج",
    status: "active",
    isActive: true,
    phoneNumber: "0534567890",
    showCommIcon: true,
    views: 180,
    clicks: 45,
    isPromoted: false,
    isFeatured: true,
    featuredTier: "silver",
    postedAt: new Date().toISOString(),
    imageUrls: [
      "https://images.unsplash.com/photo-1551830820-330a71b99659?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop&q=80"
    ],
    user: {
      name: "شركة الجزيرة للسيارات",
      role: "verified",
      verified: true,
      phone: "0534567890",
      country: "السعودية",
      city: "الرياض"
    }
  }
];

async function seed() {
  console.log("Seeding real Haraj car ads to Firestore...");
  const adsCol = collection(db, "ads");

  for (const car of realHarajCars) {
    const docRef = await addDoc(adsCol, car);
    console.log(`Added car ad: "${car.title}" | Brand: ${car.brand} (Doc ID: ${docRef.id})`);
  }

  console.log("\nAll real Haraj car ads seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error seeding car ads:", err);
  process.exit(1);
});
