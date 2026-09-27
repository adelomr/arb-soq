# BUG-012: خطأ 500 Internal Server Error بعد النشر بسبب تعارض esbuild في ترجمة next.config.ts

التاريخ: 2026-09-27

المشكلة:
بعد رفع التحديثات إلى GitHub وتشغيل سير عمل النشر التلقائي لـ Firebase Hosting عبر GitHub Actions، أصبح الموقع يرجع `500 Internal Server Error` (Failed to load resource: the server responded with a status of 500) لجميع الصفحات الديناميكية والرئيسية.

السبب الجذري:
1. أثناء خطوة `action-hosting-deploy` مع تفعيل تجارب `FIREBASE_CLI_EXPERIMENTS: webframeworks`، تحاول أداة `firebase-tools` ترجمة ملف إعدادات Next.js من صيغة TypeScript (`next.config.ts`) إلى ملف JavaScript للبيئة السحابية عبر `esbuild`.
2. حزمة `esbuild` العالمية أو المثبتة ضمن تبعيات المشروع كانت بالإصدار الحديث `0.27.3` بينما تتطلب `firebase-tools` إصدار `^0.19.2`.
3. نتج عن ذلك الخطأ الصريح في سجلات النشر:
   ```
   ERROR: "external" must be an array of strings
   Unable to bundle next.config.ts for use in Cloud Functions, proceeding with deploy but problems may be encountered.
   ```
4. واصلت أداة النشر رفع دوال Firebase Functions / Cloud Run دون وجود ملف `next.config.js` المترجم، مما أدى لانهيار حاوية Next.js السحابية فور تشغيلها وإرجاع كود `500 Internal Server Error` عند أي طلب وارد.

الحل المنجز:
1. تحويل ملف الإعدادات من `next.config.ts` إلى ملف JavaScript نقي قياسي `next.config.js` (`module.exports = nextConfig`).
2. حذف ملف `next.config.ts` نهائياً.
3. بوجود `next.config.js` بصيغة JavaScript أصلية، تتجاوز أداة `firebase-tools` خطوة استدعاء `esbuild` تماماً، وتعتمد الملف مباشرة دون أي أخطاء أو مخاطر تضارب.
4. إجراء فحص البناء `npm run build` وتأكيد سلامة إنشاء كافة الصفحات الـ 61 بنجاح كامل.

الملفات:
- `next.config.js` (جديد)
- `next.config.ts` (محذوف)
- `سجل الموقع/سجل_التحديثات_CHANGELOG.md`
- `سجل الموقع/ذاكرة_المشروع/CURRENT_TASK.md`

منع التكرار:
- عدم استخدام `next.config.ts` في مشاريع Firebase Web Frameworks وتفضيل `next.config.js` دائماً لتفادي أي تضارب بين مترجمات `esbuild` المتغيرة وبيئة Firebase CLI السحابية.
