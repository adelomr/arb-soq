import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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

const ADMIN_USER_ID = "PUlNW7kEHTQeRhqCm3u3kexsqmI3";

const realHarajRealEstate = [
  {
    title: "فيلا مودرن فاخرة للبيع درج صالة مع مسبح ومصعد - الرياض حي النرجس",
    description: "للبيع فيلا مودرن فاخرة بتصميم هندسي حديث وتشطيبات VIP راقية في حي النرجس شمال الرياض (شمال طريق الملك سلمان).\nالمساحة: 375 م² - الواجهة: شمالية على شارع 20م.\nالمواصفات:\n• الدور الأرضي: مدخل سيارة واسع، حوش مع حديقة ومسبح خاص وشلالات جدارية، مجلس رجال فخم مع مغاسل ورخام، صالة طعام، صالة عائلية مفتوحة بنوافذ بانورامية مطلة على المسبح، مطبخ رئيسي ومطبخ خدمة (ديرتي كيتشن).\n• الدور الأول: 4 غرف نوم ماستر واسعة بدواليب ملابس مدمجة ودورات مياه خاصة، صالة معيشة علوية وبوفيه.\n• السطح (الملحق): غرفة نوم ماستر إضافية، غرفة غسيل، غرفة خادمة مع دورة مياه، جلسة خارجية وسطح مبلط.\n• مميزات إضافية: مصعد راكب ومؤسس، تكييف كونسيلد مركزي راكب، إضاءات ذكية، سمارت هوم.\nالضمانات: تأمين ملاذ ضد العيوب الخفية 10 سنوات، شهادة إتمام بناء، ضمانات السباكة والأنابيب الخضراء 15 سنة، ضمان الكهرباء والإنارة 25 سنة، ضمان العوازل المائية والحرارية 10 سنوات.\nالسعر: 3,450,000 ريال (شامل السعي والضريبة والتفاوض للصامل).\nرقم ترخيص الإعلان العقاري (فال): 1200018492.",
    category: "realestate",
    categoryId: "realestate",
    subcategory: "فلل للبيع",
    price: 3450000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "منطقة الرياض",
    governorate: "الرياض",
    city: "الرياض",
    location: "الرياض - حي النرجس",
    condition: "new",
    adType: "sell-item",
    adTypeAr: "عقار للبيع",
    status: "active",
    isActive: true,
    phoneNumber: "0551238945",
    showCommIcon: true,
    views: 265,
    clicks: 64,
    isPromoted: true,
    isFeatured: true,
    featuredTier: "gold",
    postedAt: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1000&auto=format&fit=crop&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&auto=format&fit=crop&q=80"
    ],
    userId: ADMIN_USER_ID,
    user: {
      name: "شركة قمة الأركان للعقارات",
      fullName: "شركة قمة الأركان العقارية المحدودة",
      role: "verified",
      verified: true,
      phone: "0551238945",
      country: "السعودية",
      city: "الرياض"
    }
  },
  {
    title: "شقة تمليك فاخرة بتصميم سمارت هوم وتشطيب فندقي - جدة حي الشاطئ",
    description: "للبيع شقة تمليك فاخرة بمشروع سكني راقي في حي الشاطئ بجدة على بعد دقائق من الكورنيش وواجهة جدة البحرية.\nالمساحة الإجمالية: 210 م².\nتفاصيل الشقة:\n• مدخلين مستقلين للشقة (مدخل ضيوف ومدخل عائلة).\n• مجلس رجال كبير ومستقل مع دورة مياه ومغاسل رخامية فاخرة.\n• صالة معيشة عائلية واسعة بإطلالة مميزة وتوزيع إضاءة ذكي.\n• 4 غرف نوم (منها جناح نوم رئيسي ماستر كبير بدورة مياه خاصة وجناح ملابس).\n• 4 دورات مياه بتجهيزات وخلاطات جروهي ألمانية.\n• مطبخ واسع ومؤثث بدواليب وتجهيزات حديثة + غرفة خادمة مستقلة بحمام خاص.\n• خزان ماء علوي وسفلي مستقل خاص بالشقة + عداد كهرباء مستقل.\n• موقف سيارات خاص بالقبو مظلل ومسجل بالصك + غرفة سائق خاصة.\nالمشروع يحتوي على: كاميرات مراقبة 24/7، مصعدين سرعة عالية، إنتركوم مرئي، حارس مقيم.\nإفراغ فوري وصك إلكتروني جاهز، تقبل جميع البنوك والتمويل العقاري.\nالسعر المطلوب: 1,150,000 ريال قابل للتفاوض البسيط.",
    category: "realestate",
    categoryId: "realestate",
    subcategory: "شقق للبيع",
    price: 1150000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "منطقة مكة المكرمة",
    governorate: "جدة",
    city: "جدة",
    location: "جدة - حي الشاطئ",
    condition: "new",
    adType: "sell-item",
    adTypeAr: "عقار للبيع",
    status: "active",
    isActive: true,
    phoneNumber: "0508765412",
    showCommIcon: true,
    views: 198,
    clicks: 42,
    isPromoted: true,
    isFeatured: true,
    featuredTier: "silver",
    postedAt: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&auto=format&fit=crop&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80"
    ],
    userId: ADMIN_USER_ID,
    user: {
      name: "مؤسسة رواسي البحر العقارية",
      fullName: "مؤسسة رواسي البحر لإدارة وتطوير العقارات",
      role: "verified",
      verified: true,
      phone: "0508765412",
      country: "السعودية",
      city: "جدة"
    }
  },
  {
    title: "فيلا دوبلكس متصلة بناء شخصي سوبر ديلوكس - الخبر حي الحزام الذهبي",
    description: "فرصة عقارية مميزة للبيع: فيلا دوبلكس متصلة بتشطيب شخصي راقي جداً بحي الحزام الذهبي الراقي بمدينة الخبر.\nمساحة الأرض: 320 م² - مسطح البناء: 480 م².\nمكونات الفيلا:\n• الدور الأرضي: كراج سيارة، مدخل رئيسي بهو رخام، مجلس رجال رسمي فخم مع مغاسل خاصة، صالة طعام، صالة استقبال نساء عائلية مطلة على حديقة خلفية، مطبخين (مطبخ داخلي ألمنيوم راقي + مطبخ قلي خارجي).\n• الدور الأول: 4 أجنحة نوم ماستر مجهزة بالكامل، صالة جلوس عائلية واسعة، بوفيه تحضيري صغير.\n• الملحق العلوي: غرفة خادمة بحمام خاص، غرفة غسيل وكوي، صالة ألعاب أو سينما منزلية، سطح خارجي مجهز بجلسة عائلية وشواية باربكيو.\nالمميزات: زجاج مزدوج دبل جلاس عازل للحرارة والصوت، أرضيات بورسلان أسباني نخب أول، سخانات مركزية، أطقم صحية إيطالية، كاميرات مراقبة.\nالفيلا حرة وبدون أي رهون، جاهزة للسكن الفوري.\nالسعر: 1,850,000 ريال.",
    category: "realestate",
    categoryId: "realestate",
    subcategory: "دوبلكس للبيع",
    price: 1850000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "المنطقة الشرقية",
    governorate: "الخبر",
    city: "الخبر",
    location: "الخبر - حي الحزام الذهبي",
    condition: "new",
    adType: "sell-item",
    adTypeAr: "عقار للبيع",
    status: "active",
    isActive: true,
    phoneNumber: "0532109876",
    showCommIcon: true,
    views: 340,
    clicks: 81,
    isPromoted: true,
    isFeatured: true,
    featuredTier: "gold",
    postedAt: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1000&auto=format&fit=crop&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&auto=format&fit=crop&q=80"
    ],
    userId: ADMIN_USER_ID,
    user: {
      name: "مكتب الأفق الشرقي العقاري",
      fullName: "مكتب الأفق الشرقي للخدمات والاستشارات العقارية",
      role: "verified",
      verified: true,
      phone: "0532109876",
      country: "السعودية",
      city: "الخبر"
    }
  },
  {
    title: "أرض سكنية تجارية مميزة زاوية على شارعين - الرياض حي العارض",
    description: "للبيع قطعة أرض سكنية استثمارية مميزة زاوية بموقع استراتيجي مرتفع في حي العارض شمال الرياض (شمال طريق الملك سلمان وقريبة من طريق الملك فهد).\nالمساحة: 600 م² (الأبعاد: 20م على الشارع × عمق 30م).\nالواجهات:\n• شارع 25م شرقي.\n• شارع 20م جنوبي.\nالمميزات والمواصفات:\n• طبيعة الأرض كف مستوية تماماً وسليمة من الدفان وأعمدة الضغط والخدمات.\n• موقع حيوي ومكتمل البنية التحتية (مياه، كهرباء، ألياف بصرية، إنارة، سفلتة).\n• قريبة من المساجد ومجمعات المدارس والمراكز التجارية الحديثة.\n• مناسبة جداً لبناء فيلا قصر مودرن أو تقسيمها لفيليتن دوبلكس مستقلة.\n• صك إلكتروني مستقل جاهز للإفراغ الفوري من المالك مباشرة.\nالسعر للمتر: 4,500 ريال / السعر الإجمالي: 2,700,000 ريال صافي.",
    category: "realestate",
    categoryId: "realestate",
    subcategory: "أراضي للبيع",
    price: 2700000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "منطقة الرياض",
    governorate: "الرياض",
    city: "الرياض",
    location: "الرياض - حي العارض",
    condition: "new",
    adType: "sell-item",
    adTypeAr: "عقار للبيع",
    status: "active",
    isActive: true,
    phoneNumber: "0564567891",
    showCommIcon: true,
    views: 412,
    clicks: 95,
    isPromoted: true,
    isFeatured: true,
    featuredTier: "silver",
    postedAt: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&auto=format&fit=crop&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524813686514-a57563d77d61?w=1000&auto=format&fit=crop&q=80"
    ],
    userId: ADMIN_USER_ID,
    user: {
      name: "شركة إعمار نجد العقارية",
      fullName: "شركة إعمار نجد للاستثمار والتطوير العقاري",
      role: "verified",
      verified: true,
      phone: "0564567891",
      country: "السعودية",
      city: "الرياض"
    }
  },
  {
    title: "شقة روف بنتهاوس فاخرة مع سطح خاص وجلسة بانورامية - مكة المكرمة حي العوالي",
    description: "للبيع شقة روف بنتهاوس فاخرة بتشطيب سوبر VIP مع سطح خاص مهيأ بالكامل في أرقى أحياء مكة المكرمة (حي العوالي).\nالمساحة المبنية: 260 م² + سطح خاص بمساحة 90 م² بإطلالة مفتوحة.\nالمواصفات:\n• مدخلين للشقة مع مصعد يصل للروف مباشرة برقم سري خاص.\n• مجلس ضيوف فخم بديكورات جبسية عصرية ومغاسل رخامية ودورة مياه.\n• صالة معيشة عائلية كبيرة مفتوحة على الشرفة والسطح.\n• 5 غرف نوم (منها 2 غرفة ماستر رئيسية بحمامات خاصة).\n• مطبخ مودرن مؤثث مع غرفة تخزين وغرفة غسيل مستقلة.\n• غرفة خادمة بحمام خاص + غرفة سائق خاصة.\n• سطح واسع مبلط ومجهز بمظلات برجولا خشبية وجلسة عربية وشلال جداري مع إضاءات ليلية ساحرة.\n• خزانات مياه مستقلة بسعة كبيرة + عداد كهرباء مستقل.\nالضمانات: ضمانات شاملة على السباكة والكهرباء والهيكل الإنشائي لمدة 10 سنوات، وشهادة إتمام بناء وكافة التراخيص النظامية.\nالسعر: 890,000 ريال (يقبل التمويل البنكي والصندوق العقاري والدعم السكني).",
    category: "realestate",
    categoryId: "realestate",
    subcategory: "شقق للبيع",
    price: 890000,
    currency: "SAR",
    market: "sa",
    country: "السعودية",
    province: "منطقة مكة المكرمة",
    governorate: "مكة المكرمة",
    city: "مكة المكرمة",
    location: "مكة المكرمة - حي العوالي",
    condition: "new",
    adType: "sell-item",
    adTypeAr: "عقار للبيع",
    status: "active",
    isActive: true,
    phoneNumber: "0549871230",
    showCommIcon: true,
    views: 275,
    clicks: 58,
    isPromoted: false,
    isFeatured: true,
    featuredTier: "silver",
    postedAt: new Date().toISOString(),
    timestamp: Date.now(),
    imageUrl: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1000&auto=format&fit=crop&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&auto=format&fit=crop&q=80"
    ],
    userId: ADMIN_USER_ID,
    user: {
      name: "مجموعة ديار مكة العقارية",
      fullName: "مجموعة ديار مكة للتطوير والاستثمار العقاري",
      role: "verified",
      verified: true,
      phone: "0549871230",
      country: "السعودية",
      city: "مكة المكرمة"
    }
  }
];

async function seed() {
  console.log("Seeding real Haraj real estate ads to Firestore...");
  const adsCol = collection(db, "ads");

  for (const item of realHarajRealEstate) {
    const docRef = await addDoc(adsCol, item);
    console.log(`Added real estate ad: "${item.title}" | Subcategory: ${item.subcategory} (Doc ID: ${docRef.id})`);
  }

  console.log("\nAll real Haraj real estate ads seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error seeding real estate ads:", err);
  process.exit(1);
});
