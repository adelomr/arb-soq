# سجل تعديلات وتحديثات موقع سوق العرب (Site Changelog & Reference Log)

هذا السجل يوثق التعديلات والتحسينات المعمارية والبرمجية المنجزة لتكون مرجعاً دائمًا لفريق التطوير.

## [تحسينات الأداء ومؤشرات Lighthouse وإصلاح فلترة الأسواق] - 2026-08-12

### 1. تحسين LCP وتقليل زمن تحميل الموارد الحرج (Largest Contentful Paint)
- **المهمة المنجزة:** ربط خاصية `priority` في كائنات `AdCard` والمكون `HomeClient.tsx`.
- **التفاصيل:** 
  - إعطاء أول بطاقتين في الصفحة الرئيسية السمة `priority={idx < 2}` لتفعيل `fetchpriority="high"` في Next.js.
  - إلغاء الخاصية القسرية `loading="lazy"` للصور التي تعين كـ priority، مما يلبي متطلبات PageSpeed Insights لاكتشاف صورة الـ LCP مبكراً في الـ HTML المبدئي.

### 2. تحسين اتصالات الشبكة المسبقة (Preconnect & DNS Prefetch)
- **المهمة المنجزة:** تنظيف وتحديث روابط `preconnect` في [layout.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/layout.tsx).
- **التفاصيل:** 
  - حذف الاتصالات غير المستخدَمة لـ `fonts.googleapis.com` و `fonts.gstatic.com` و `res.cloudinary.com` المسببة لهدر الاتصالات.
  - إدراج `preconnect` مباشر للمصادر الفعلية `firestore.googleapis.com` و `arb-soq.firebaseapp.com` لتوفير 300-350ms في زمن الاستجابة المبدئي.

### 3. إصلاح تزامن تصفية إعلانات الدول عند تغيير السوق وإعادة التحميل
- **المهمة المنجزة:** حل مشكلة الـ stale closure المعمارية في [HomeClient.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/HomeClient.tsx).
- **التفاصيل:** 
  - تمرير كائن `currentMarket` صراحة لدالة التصفية والترتيب `sortAndSetAds` لمنع استخدام المرجع القديم المخزن في الـ closure.
  - الحفاظ على `userSelectedMarketId` في `localStorage` لضمان استقرار وثبات تصفية إعلانات دولة السعودية (أو أي دولة أخرى) بعد تحديث الصفحة (Refresh).

---

## [تحديث سجل المشروع وتوحيد قاعدة بيانات الأندرويد والويب] - 2026-08-11

### 1. توثيق وتفصيل قاعدة بيانات Firebase Firestore والمزامنة الفورية
- **المهمة المنجزة:** إنشاء الدليل الشامل والمرجع الموحد لقاعدة البيانات [DATABASE_SCHEMA.md](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/PROJECT_MEMORY/DATABASE_SCHEMA.md) لربط وتوحيد هيكلية البيانات بين موقع الويب وتطبيق الأندرويد (Kotlin/Java).
- **التفاصيل المعمارية المحققة:**
  - توثيق 10 مجموعات رئيسية وفرعية في Firestore (`/ads`, `/users`, `/categories`, `/notifications`, `/pages`, `/blogs`, `/contact_messages`, `/announcements`, إلخ).
  - تحديد مواصفة حقول المزامنة المزدوجة وضمان ظهور الإعلانات المضافة عبر التطبيق مباشرة في الموقع والعكس (`imageUrl`, `timestamp`, `isActive`, `country`, `adTypeAr`).
  - إدراج نماذج الأكواد الكائنية لـ **Kotlin Data Classes** (`AdData`, `UserData`) الجاهزة للنسخ المباشر إلى مشروع تطبيق الأندرويد بـ Android Studio لتوحيد البيانات 100%.
  - تحديث [ARCHITECTURE.md](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/PROJECT_MEMORY/ARCHITECTURE.md) و [PROJECT_MEMORY.md](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/PROJECT_MEMORY/PROJECT_MEMORY.md) لإدراج مواصفة قاعدة البيانات كشرط إجباري للتطوير المستقبلي.

---

## [حل مشكلة مهلة الرفع وتحديثات Firebase Deploy] - 2026-08-11

### 1. الحل الجذرائي لمشكلة التوقف (Timeout after 10000)
- **المشكلة السابقة:** توقف الرفع بالخطأ `Error: User code failed to load. Timeout after 10000` أثناء فحص الدالة محلياً.
- **الحل المنجز:**
  - توحيد جميع حزم `@genkit-ai` للإصدار `1.41.0` وحزمة `firebase-functions` للإصدار `7.3.2` وإزالة التعارض في الاعتماديات (`ELSPROBLEMS`).
  - إزالة `output: 'standalone'` ومصفوفة `outputFileTracingExcludes` من [next.config.ts](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/next.config.ts).
  - رفع ذاكرة الدالة في [firebase.json](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/firebase.json) إلى `1GiB` وتحديد `minInstances: 0`.
  - إضافة سكريبت الرفع المعزز `npm run deploy` بالخيار `--force` ومتغير البيئة `FUNCTIONS_EMULATOR_TIMEOUT=60s`.
  - توثيق المشكلة بالتفصيل في سجل الأخطاء [BUG-002-firebase-deploy-timeout.md](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/PROJECT_MEMORY/bug-history/BUG-002-firebase-deploy-timeout.md).

---

## [تحديثات الفئات وتصفية الدول والروابط الحديثة] - 2026-08-11

### 1. عزل ومطابقة إعلانات الدول
- **المشكلة السابقة:** كان الإعلان المصري يظهر أحياناً ضمن إعلانات السعودية بسبب إرجاع القيمة الافتراضية `return true;` في نهاية دالة التصفية.
- **الحل المنجز:** إنشاء واستخدام دالة `isAdInMarket(ad, market.id, market.name.ar)` في `src/lib/category-utils.ts`. تتحقق الدالة بدقة وصارمة من معرّف السوق (`eg`, `sa`) والعملات والمحافظات والاسم بالعربية، وترجع `false` بشكل قاطع لأي إعلان لا ينتمي لدولة الزائر المحددة في رأس الموقع.

### 2. مطابقة الفئات الهرمية وإلغاء الواجهات القديمة
- **المشكلة السابقة:** عند فتح فئات مثل `/p/home-office-furniture` أو `/category/services` كانت بعض الإعلانات تختفي أو تفتح الصفحة القديمة ذات الـ 1300 سطر.
- **الحل المنجز:**
  - تطوير دالة `getParentCategoryId` ودالة `getCategorySlug` لربط معرفات وأسماء الفئات (مثل `furniture`, `home-office-furniture`, `services`, `crafts`) مباشرة بمساراتها الحديثة.
  - تحويل ملف `/category/[id]/page.tsx` كاملاً إلى تحويل سيرفري مباشر (`redirect`) ينقل أي طلب قديم إلى الرابط الحديث `/p/[slug]` مع الحفاظ الكامل على كافة معايير الفلترة والبحث.
  - تحديث كافة روابط الفئات في [QuickOptions.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/QuickOptions.tsx)، [CategoriesGridHero.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/CategoriesGridHero.tsx)، و [categories/page.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/categories/page.tsx).

### 3. فتح صفحات تفاصيل الإعلانات والتواصل
- **المشكلة السابقة:** عند الضغط على بعض الإعلانات كانت الصفحة ترفض الفتح أو تعطي خطأ بسبب عدم توفر معرّف الناشر أو وجود مسار فردي ناقص.
- **الحل المنجز:**
  - إنشاء المسار الفردي الاحتياطي [src/app/ad/[adId]/page.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/ad/%5BadId%5D/page.tsx).
  - تحديث دالة `getAdData` لتبحث عن الإعلان أولاً في مجموعة `ads` الرئيسية وتستخرج بيانات الناشر تلقائياً.
  - تحديث المكونين [AdCard.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/AdCard.tsx) و [AdRow.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/AdRow.tsx) باستخدام المعرّف الحصين `effectiveUserId` وإلغاء حظر الكروت عند غياب `adUser`.

---

## [تعديلات التنسيق، الفوتر، وعناصر الواجهة]

### 4. نقل وتنظيم الفوتر السفلي ([Footer.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/Footer.tsx))
- **مكان الإحصائيات:** تم نقل مربع **الإحصائيات** (العدّادات 2x2 للمسجلين والمتاجر والإعلانات والزيارات) ليكون مباشرة أسفل أيقونة التطبيق، عنوان سوق العرب، الوصف، وزر التحميل.
- **عمود فئات الأقسام:** وضع عمود **فئات الأقسام** في الشبكة الرئيسية بين عمود سوق العرب وعمود درج صفحات الهبوط.
- **تخصيص قائمة قانوني:** حظر وقصر القائمة القانونية على الصفحات القانونية فقط (سياسة الخصوصية واتفاقية الاستخدام).
- **حذف القائمة البريدية:** حذف استيراد ومكون `FooterNewsletterDrawer` بالكامل لعدم الحاجة له في موقع إعلانات.
- **زر تحميل التطبيق:** تصغير أبعاد وارتفاع `AppDownloadButton` في الهيدر العلوي والفوتر السفلي ليصبح صغيراً ومدمجاً وأنيقاً.

### 5. تموضّع أزرار الإغلاق وأشرطة التمرير
- تم تغيير مواضع أزرار الإغلاق في النوافذ المنبثقة إلى `left-4 top-4` لمنع تداخلها مع عناوين الواجهة العربية RTL.
- تطبيق أشرطة التمرير المخصصة الموحدة في `globals.css`.

---

## [الفحص والتحقق الأداء]

- **TypeScript Verification:** تم إجراء الفحص عبر `npx tsc --noEmit` بنجاح دون أي خطأ (0 errors).
- **الحذف الكامل للإعلانات الوهمية:** المشروع نظيف وخالٍ تماماً من أي إعلانات مزيفة ويستند 100% لإعلانات Firebase الحية.
