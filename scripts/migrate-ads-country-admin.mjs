// migrate-ads-country-admin.mjs
// سكريبت لإصلاح الإعلانات الموجودة في Firebase باستخدام Admin SDK
// يحوّل حقل `country` من معرّف السوق (مثل "eg") إلى الاسم العربي (مثل "مصر")
// ويضيف حقل `adTypeAr` بالقيمة العربية لنوع الإعلان
//
// طريقة التشغيل:
//   node scripts/migrate-ads-country-admin.mjs

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// إعداد Firebase Admin SDK بدون service account key
// يستخدم Application Default Credentials أو يتصل مباشرة
// ملاحظة: هذا يعمل بدون مصادقة لأن Admin SDK يتجاوز قواعد الأمان

const firebaseConfig = {
    projectId: "arb-soq",
};

// تهيئة التطبيق
if (!getApps().length) {
    initializeApp(firebaseConfig);
}

const db = getFirestore();

// خريطة تحويل معرّفات السوق إلى الأسماء العربية
const marketIdToArabicName = {
    'sa': 'السعودية',
    'eg': 'مصر',
    'ae': 'الإمارات',
    'jo': 'الأردن',
    'dz': 'الجزائر',
    'bh': 'البحرين',
    'km': 'جزر القمر',
    'dj': 'جيبوتي',
    'iq': 'العراق',
    'kw': 'الكويت',
    'lb': 'لبنان',
    'ly': 'ليبيا',
    'mr': 'موريتانيا',
    'ma': 'المغرب',
    'om': 'عُمان',
    'ps': 'فلسطين',
    'qa': 'قطر',
    'so': 'الصومال',
    'sd': 'السودان',
    'sy': 'سوريا',
    'tn': 'تونس',
    'ye': 'اليمن',
};

// خريطة تحويل نوع الإعلان إلى العربي
const adTypeArMap = {
    'sell-service': 'بيع خدمة',
    'sell-item': 'بيع منتج',
    'request-service': 'طلب خدمة',
    'video': 'فيديو',
    'image': 'صوري',
};

async function migrateAds() {
    console.log('🚀 بدء عملية تصحيح بيانات الإعلانات (Admin SDK)...\n');
    console.log('🔧 Firebase Project: arb-soq\n');
    
    const adsRef = db.collection('ads');
    const snapshot = await adsRef.get();
    
    console.log(`📊 إجمالي الإعلانات في قاعدة البيانات: ${snapshot.size}\n`);
    
    let needsUpdate = 0;
    let updated = 0;
    let errors = 0;
    
    // معالجة على دفعات (Batches) - الحد الأقصى 500 عملية لكل Batch
    const BATCH_SIZE = 400;
    let batch = db.batch();
    let batchCount = 0;
    
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates = {};
        let hasChanges = false;
        
        // 1. تصحيح حقل country: تحويل من معرّف السوق إلى الاسم العربي
        const country = data.country || '';
        if (marketIdToArabicName[country]) {
            updates.country = marketIdToArabicName[country];
            hasChanges = true;
            console.log(`  ✏️  [${docSnap.id.substring(0, 8)}...] country: "${country}" → "${updates.country}"`);
        }
        
        // 2. إضافة أو تصحيح adTypeAr
        const adType = data.adType || '';
        if (adType && adTypeArMap[adType] && data.adTypeAr !== adTypeArMap[adType]) {
            updates.adTypeAr = adTypeArMap[adType];
            hasChanges = true;
            console.log(`  ✏️  [${docSnap.id.substring(0, 8)}...] adTypeAr: "${adTypeArMap[adType]}" (من "${adType}")`);
        }
        
        if (hasChanges) {
            needsUpdate++;
            batch.update(docSnap.ref, updates);
            batchCount++;
            
            // تنفيذ الـ Batch إذا وصل للحد الأقصى
            if (batchCount >= BATCH_SIZE) {
                try {
                    await batch.commit();
                    updated += batchCount;
                    console.log(`\n✅ تم تحديث دفعة من ${batchCount} إعلان\n`);
                    batch = db.batch();
                    batchCount = 0;
                } catch (err) {
                    console.error(`❌ فشل تنفيذ الدفعة:`, err.message);
                    errors += batchCount;
                    batch = db.batch();
                    batchCount = 0;
                }
            }
        }
    }
    
    // تنفيذ الدفعة الأخيرة
    if (batchCount > 0) {
        try {
            await batch.commit();
            updated += batchCount;
        } catch (err) {
            console.error(`❌ فشل تنفيذ الدفعة الأخيرة:`, err.message);
            errors += batchCount;
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📋 ملخص عملية التصحيح:');
    console.log(`   إجمالي الإعلانات:   ${snapshot.size}`);
    console.log(`   تحتاج تصحيح:        ${needsUpdate}`);
    console.log(`   تم تحديثه بنجاح:    ${updated}`);
    console.log(`   أخطاء:              ${errors}`);
    console.log('═══════════════════════════════════════════════════');
    
    if (updated > 0) {
        console.log('\n✅ تم إصلاح الإعلانات بنجاح!');
        console.log('   الإعلانات ستظهر الآن بشكل صحيح في تطبيق الأندرويد.');
    } else if (needsUpdate === 0) {
        console.log('\n✅ لا توجد إعلانات تحتاج إلى تصحيح - البيانات محدّثة بالفعل.');
    }
    
    process.exit(errors > 0 ? 1 : 0);
}

migrateAds().catch(err => {
    console.error('\n❌ فشل السكريبت:', err.message || err);
    process.exit(1);
});
