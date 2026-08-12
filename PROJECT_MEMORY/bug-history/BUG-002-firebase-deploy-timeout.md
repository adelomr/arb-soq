# BUG-002: حل مشكلة التوقف وانتهاء المهلة الزمنية أثناء الرفع (Firebase Deploy Timeout)

التاريخ: 2026-08-11

المشكلة:
عند تنفيذ أمر الرفع `firebase deploy` لتطبيق Next.js 15 على Firebase Hosting / Cloud Functions، كان النظام يتوقف بالخطأ:
`Error: User code failed to load. Cannot determine backend specification. Timeout after 10000.`

السبب:
1. **تضارب إصدارات حزم `@genkit-ai`**: كانت حزمة `@genkit-ai/google-cloud` تتطلب `genkit@^1.29.0` بينما حزمة Root كانت `1.19.3`. هذا التضارب كان يسبب أخطاء `ELSPROBLEMS` ويبطئ تحميل الموديولات على السيرفر لأكثر من 10 ثوانٍ.
2. **تضارب إعداد `output: 'standalone'` واستبعاد الحزم في `next.config.ts`**: كانت أداة Firebase CLI تتبع الملفات مرتين وتفشل في الوصول لبعض الموديولات أثناء فحص الدالة المباشر `Serving at port XXXX`.
3. **ذاكرة غير كافية لـ Cloud Functions في `firebase.json`**: كانت الذاكرة المحددة `512MiB` وهي غير كافية لتحميل سيرفر Next.js 15 و Genkit المتقدم محلياً وسحابياً.
5. **خطأ 500 Internal Server Error (تضارب أسماء مسارات Next.js)**: ظهور الخطأ السحابي `You cannot use different slug names for the same dynamic path ('adId' !== 'userId')` بسب تضارب مجلدي `src/app/ad/[adId]` و `src/app/ad/[userId]`.

الحل:
1. توحيد وتحديث حزم `@genkit-ai` للإصدار `1.41.0` و `firebase-functions` للإصدار `7.3.2`.
2. إزالة `output: 'standalone'` ومصفوفة استبعاد الحزم من `next.config.ts`.
3. رفع ذاكرة الدالة في `firebase.json` إلى `1GiB` وتحديد `minInstances: 0`.
4. إضافة سكريبت الرفع المباشر `npm run deploy` في `package.json` مع ضبط `FUNCTIONS_EMULATOR_TIMEOUT=60s` ومرور الخيار `--force`.

الملفات:
- `package.json`
- `next.config.ts`
- `firebase.json`
- `PROJECT_MEMORY/bug-history/BUG-002-firebase-deploy-timeout.md`

الاختبار:
- تشغيل `npm list` والتأكد من خلو شجرة الحزم من أي أخطاء.
- تشغيل `npm run deploy` وتأكيد نجاح البناء والرفع والوصول إلى رابط الموقع https://arb-soq.web.app.

منع التكرار:
- دائماً استخدم `npm run deploy` عند رفع التحديثات لـ Firebase.
- حافظ على توحيد إصدارات حزم `@genkit-ai` لجميع الملحقات.
- لا تضف `output: 'standalone'` يدوياً في `next.config.ts` عند استخدام Firebase Frameworks Hosting المدمج.
