# CURRENT TASK
 
- **اسم المهمة:** 
  1. حل مشكلة أكل الكلمات المفتاحية (Keyword Cannibalization) وازدواجية الميتا بين الصفحة الرئيسية وضفحة الفئات (`/categories`).
  2. إنشاء ملفات Layout مستقلة مع ميتا ووسم الرابط الأساسي (`canonical`) لكل من: `/categories`, `/shops`, `/services`.
  3. إضافة canonical لصفحة `sooq-baladna`.
  4. إزالة كود WebSite Schema المكرر من `layout.tsx` العام وحصره في الصفحة الرئيسية.
  5. تعزيز وسم `<h1>` في الصفحة الرئيسية بالاسم الصريح للعلامة التجارية "سوق العرب".
  6. ضبط أولويات خريطة الموقع `sitemap.ts` لتكون الأولوية القصوى (1.0) للصفحة الرئيسية.
- **الحالة:** تم تطبيق كافة التعديلات، وجاهز للرفع على GitHub ✅
- **التاريخ:** 2026-10-06
- **الملفات المحدثة:**
  - `src/app/categories/layout.tsx`
  - `src/app/shops/layout.tsx`
  - `src/app/services/layout.tsx`
  - `src/app/layout.tsx`
  - `src/app/sitemap.ts`
  - `src/app/sooq-baladna/page.tsx`
  - `src/components/CategoriesGridHero.tsx`
  - `سجل الموقع/سجل_التحديثات_CHANGELOG.md`
  - `سجل الموقع/ذاكرة_المشروع/CURRENT_TASK.md`
