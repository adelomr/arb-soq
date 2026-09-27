# CURRENT TASK
 
- **اسم المهمة:** 
  1. إلغاء نظام تدوير الإعلانات وتبديل الأولوية بالكامل واستعادة الترتيب الزمني الطبيعي.
  2. إصلاح اختفاء الشريط العلوي عند تغيير الدولة وتثبيت التمرير في قمة الموقع عند التحديث.
  3. التحقق من سلامة نشر الموقع (Firebase Hosting & Functions) وتشخيص خطأ Internal Server Error.
- **الحالة:** مكتملة وموثقة بالكامل، الخادم الحي يعمل بنجاح بنسبة 100% (HTTP 200 لكافة المسارات الثابتة والديناميكية) واجتازت فحص البناء `npm run build` لـ 61/61 صفحة بنجاح ✅
- **التاريخ:** 2026-09-27
- **الملفات المحدثة والمحذوفة:**
  - `src/components/PackageAdsSlider.tsx` (محذوف)
  - `src/lib/fairRotation.ts` (محذوف)
  - `src/app/HomeClient.tsx`
  - `src/app/category/page.tsx`
  - `src/app/search/page.tsx`
  - `src/app/sooq-baladna/SooqBaladnaClient.tsx`
  - `src/app/pricing/page.tsx`
  - `src/components/Header.tsx`
  - `src/context/MarketContext.tsx`
  - `src/app/layout.tsx` (تحسين موضع سكربت scroll-restoration ونقله إلى داخل body باستخدام Next Script لمنع أي تعارض SSR)
  - `سجل الموقع/سجل_التحديثات_CHANGELOG.md`
  - `سجل الموقع/تاريخ_الأخطاء_والإصلاحات/BUG-011-sticky-header-modal-scroll-lock-and-reload-position.md`
  - `سجل الموقع/ذاكرة_المشروع/CURRENT_TASK.md`

