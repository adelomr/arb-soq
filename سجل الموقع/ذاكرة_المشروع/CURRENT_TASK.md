# CURRENT TASK

- **اسم المهمة:** إصلاح وتثبيت شريط الأدوات والترويسة (Sticky Header & Toolbar)، إضافة ميزة تحويل أي صفحة إلى مسودة وعزلها، نظام معاينة المسودات للإدارة، حذف زر ترحيل الروابط، وحذف زر سجل الإعلان من صفحة تفاصيل الإعلان.
- **الحالة:** مكتملة وموثقة بالكامل واجتازت فحص TypeScript وجاهزة للنشر والرفع (Completed, Documented & Build-Verified) ✅
- **التاريخ:** 2026-09-15
- **الملفات المحدثة:**
  - `src/app/globals.css` (استبدال overflow-x: hidden بـ overflow-x: clip لحماية التثبيت)
  - `src/app/layout.tsx` (تحديث كلاس body إلى overflow-x-clip)
  - `src/app/HomeClient.tsx` (تنظيف الحاوية الرئيسية للهيدر وشريط الخيارات)
  - `src/components/PageManager.tsx` (زر تحويل الصفحة لمسودة بنقرة واحدة، فلتر المسودات، أزرار الحفظ كمسودة، وحذف زر ترحيل الروابط)
  - `src/app/p/[slug]/page.tsx` (دعم معاينة المسودات للإدارة مع شريط التنبيه وعزلها عن الزوار العاديين)
  - `src/components/AdDetailClient.tsx` (حذف زر سجل الإعلان)
  - `سجل الموقع/ذاكرة_المشروع/PROJECT_RULES.md` (إضافة القواعد 8 و 9)
  - `سجل الموقع/تاريخ_الأخطاء_والإصلاحات/BUG-010-sticky-header-and-toolbar-overflow-fix.md`
  - `سجل الموقع/سجل_التحديثات_CHANGELOG.md`
  - `سجل الموقع/ذاكرة_المشروع/CURRENT_TASK.md`
