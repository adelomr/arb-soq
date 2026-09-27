# CURRENT TASK
 
- **اسم المهمة:** 
  1. إلغاء نظام تدوير الإعلانات وتبديل الأولوية بالكامل واستعادة الترتيب الزمني الطبيعي.
  2. إصلاح اختفاء الشريط العلوي عند تغيير الدولة وتثبيت التمرير في قمة الموقع عند التحديث.
  3. إصلاح انهيار الخادم السحابي وخطأ 500 بعد النشر الناتج عن تعارض esbuild في ترجمة next.config.ts.
- **الحالة:** تم حل الخطأ الجذري بتحويل next.config.ts إلى next.config.js، واجتاز فحص البناء `npm run build` لـ 61/61 صفحة بنجاح كامل وجاري الرفع إلى GitHub ✅
- **التاريخ:** 2026-09-27
- **الملفات المحدثة والمحذوفة:**
  - `next.config.js` (ملف جافاسكربت نقي بديل يمنع تضارب esbuild في دوال فايربيس)
  - `next.config.ts` (محذوف)
  - `src/components/PackageAdsSlider.tsx` (محذوف)
  - `src/lib/fairRotation.ts` (محذوف)
  - `src/app/HomeClient.tsx`
  - `src/app/category/page.tsx`
  - `src/app/search/page.tsx`
  - `src/app/sooq-baladna/SooqBaladnaClient.tsx`
  - `src/app/pricing/page.tsx`
  - `src/components/Header.tsx`
  - `src/context/MarketContext.tsx`
  - `src/app/layout.tsx`
  - `سجل الموقع/سجل_التحديثات_CHANGELOG.md`
  - `سجل الموقع/تاريخ_الأخطاء_والإصلاحات/BUG-011-sticky-header-modal-scroll-lock-and-reload-position.md`
  - `سجل الموقع/تاريخ_الأخطاء_والإصلاحات/BUG-012-firebase-frameworks-next-config-ts-esbuild-error.md`
  - `سجل الموقع/ذاكرة_المشروع/CURRENT_TASK.md`


