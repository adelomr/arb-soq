# BUG-008: Rendered more hooks than during the previous render in ProfileForm

## 1. المشكلة (Problem Description)
- **الخطأ:** ظهور خطأ تشغيل في Next.js / React:
  `Rendered more hooks than during the previous render.` عند فتح صفحة تعديل البيانات `/profile`.
- **السبب الجذري:** 
  1. وجود شرط خروج مبكر `if (authLoading) return <Skeleton ... />` قبل استدعاء متغيرات مراقبة الحقول في نموذج الـ React Hook Form (`form.watch`).
  2. أثناء التحميل (`authLoading = true`) كان المكون يُرجع الـ Skeleton دون تشغيل مراقبات النموذج.
  3. بمجرد انتهاء التحميل (`authLoading = false`) يتم استدعاء الـ Hooks ومراقبات النموذج ومكونات `<FormField>`، مما أدى لاختلاف عدد وترتيب استدعاء الـ Hooks بين دورات الـ Render، وهو ما يخرق قواعد React Hooks (Rules of Hooks).

## 2. الحل الجذري (Solution & Fix)
1. نقل جميع استدعاءات `form.watch` والحسابات المعتمدة عليها إلى أعلى الدالة مباشرة بجانب تعريف الـ Hooks لضمان ثبات ترتيب الاستدعاء.
2. إزالة شرط الخروج المبكر `if (authLoading) return ...` من داخل المكون `ProfileForm.tsx`.
3. نقل عرض هيكل التحميل (Skeleton) إلى المكون الأب في صفحة `ProfilePage` (`src/app/profile/page.tsx`) بحيث لا يتم تركيب `ProfileForm` إلا بعد جاهزية البيانات، أو عرض النموذج بدون تذبذب في عدد الـ Hooks.

## 3. الملفات المعدلة (Modified Files)
- `src/components/ProfileForm.tsx`
- `src/app/profile/page.tsx`

## 4. الضوابط المستقبلية (Prevention Guidelines)
- لا تضع أي استدعاء لـ React Hook أو دالة تشتق منها اشتراكات داخلية (`useMemo`, `useEffect`, `useState`, `form.watch`) بعد شروط الخروج المبكر (`if (...) return`).
- ضع جميع استدعاءات الـ Hooks دائماً في السطور الأولى من المكون قبل أي شروط أو إرجاع.
