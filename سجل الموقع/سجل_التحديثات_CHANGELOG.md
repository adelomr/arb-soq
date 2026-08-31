# سجل تعديلات وتحديثات موقع سوق العرب (Site Changelog & Reference Log)

هذا السجل يوثق التعديلات والتحسينات المعمارية والبرمجية المنجزة لتكون مرجعاً دائمًا لفريق التطوير.

## [تطوير نظام مراجعة الإعلانات، عداد التمييز التنازلي، إدارة المستخدمين والباقات، وتوحيد لوحة التحكم] - 2026-08-31

### 1. نظام عداد التمييز التنازلي التفاعلي والرجوع التلقائي للباقة المجانية
- **المهمة المنجزة:** بناء شارة العداد التنازلي المباشرة باليوم (`متبقي X يوم`) أسفل عنوان الإعلان في جدول مراجعة الإعلانات.
- **التفاصيل:**
  - عرض المتبقي بالصيغ العربية السليمة (`متبقي 30 يوم`، `متبقي 7 أيام`، `متبقي يومان`، `متبقي يوم واحد`).
  - الرجوع التلقائي للإعلان للحالة المجانية العادية فور انتهاء المدة مع تحديث Firestore والواجهة محلياً.
  - تحول زر التمييز إلى زر تفاعلي براق (`مميز` باللون الذهبي للباقة الذهبية 🥇، والفضي للباقة الفضية 🥈، و `تمييز` عادي لغير المميز).

### 2. تحسين جدول مراجعة الإعلانات وشريط الفلاتر والسجل المدمج
- **المهمة المنجزة:** إعادة هيكلة عناصر التحكم وسرعة الفحص في جدول مراجعة الإعلانات.
- **التفاصيل:**
  - دمج إحصائيات السجل اللحظي `[ 👁️ المشاهدات / 🖱️ النقرات ]` داخل زر السجل نفسه بدون نص زائد ليكون شارة تفاعلية أنيقة.
  - تثبيت أيقونة الحذف 🗑️ بجانب أيقونة التعديل ✏️ في نفس السطر.
  - إضافة فلاتر مخصصة مع عدادات حية: `ذهبية 🥇`، `فضية 🥈`، `عادية 📄`.
  - حفظ واستعادة حالة الفلاتر المحددة (الفئة، الحالة، ومربع البحث) تلقائياً عبر `sessionStorage` لمنع إعادة التعيين عند التنقل بين السجل ومراجعة الإعلانات.

### 3. مسار العودة الذكي لصفحة السجل والتوزيع الزمني اللحظي
- **المهمة المنجزة:** توجيه زر العودة وشريط المسار (Breadcrumbs) في صفحة السجل بذكاء بحسب جهة الوصول.
- **التفاصيل:**
  - التوجيه المباشر إلى `/admin?tab=ads` عند الدخول من لوحة الإدارة لفتح جدول المراجعة فوراً دون المرور بشبكة البطاقات.
  - التوجيه إلى `/dashboard` للمستخدم العادي.
  - ربط دوال النقر والمشاهدة العامة في الموقع لتسجل تفاعلياً ولحظياً في `activity_logs` ليعكس المخطط البياني الزمني النشاط فوراً.

### 4. تطوير شامل لشاشة إدارة المستخدمين والمشتركين
- **المهمة المنجزة:** نقل وتوسيع إحصائيات المستخدمين وإتاحة فلاتر وأزرار تحكم مباشرة.
- **التفاصيل:**
  - بناء 4 بطاقات إحصائية في أعلى شاشة إدارة المستخدمين: (إجمالي المستخدمين، مشتركو الباقة الذهبية + عدد إعلاناتهم، مشتركو الباقة الفضية + عدد إعلاناتهم، والمستخدمون العاديون).
  - إضافة فلاتر سريعة وشريط بحث فوري بالاسم، البريد، أو الهاتف.
  - استبدال قائمة الثلاث نقاط بأزرار تحكم مباشرة وواضحة (مشرف/عضو، إيقاف/تفعيل، حذف).

### 5. توحيد بطاقات لوحة التحكم الإدارية وتبسيط طلبات فودافون كاش
- **المهمة المنجزة:** توحيد أبعاد وتصميم كافة بطاقات لوحة الإدارة الـ 12 وتنظيف شارات الحالة في قسم فودافون كاش.
- **التفاصيل:**
  - توحيد الحاويات والأيقونات والانحناءات لجميع البطاقات بتناسق بصري تام.
  - تبسيط شارة حالة فودافون كاش لتقتصر على نصوص صريحة (`مرفوضة`، `مفعلة`، `قيد المراجعة`).
  - توفير أسباب رفض جاهزة سريعة وزر لحذف السجلات التجريبية القديمة.

---

## [تحويل بوابة واتساب إلى خادم دائم 100% مع الحفظ السحابي في Firestore واستعادة الجلسة عند الخمول] - 2026-08-31

### 1. حفظ جلسة واتساب ومفاتيح التشفير بشكل متزامن ولحظي في Firestore
- **المهمة المنجزة:** بناء محول مصادقة مخصص متكامل مع Firestore (`useFirestoreAuthState`) لحفظ كافة مفاتيح الجلسة والتشفير (`creds`, `pre-keys`, `session-keys`, `app-state-sync`) في قاعدة البيانات مع كاش محلي في الذاكرة.
- **النتيجة:** حماية الجلسة من الضياع عند إعادة تشغيل الحاوية السحابية، أو تحديث الكود، أو دخول السيرفر في وضع الخمول (Scale-to-zero).

### 2. آلية الانتظار الذكي وإعادة الاتصال التلقائي (Smart Auto-Reconnect & Wakeup)
- **المهمة المنجزة:** إضافة دالة `waitForConnection` لانتظار استيقاظ السيرفر وإعادة ربط الجلسة في ثوانٍ معدودة عند وصول أي طلب إرسال كود OTP، بدلاً من إرجاع خطأ 503 للمستخدم.
- **التفاصيل:**
  - منع مسح الجلسة إلا في حال تسجيل الخروج الصريح من تطبيق الهاتف (`DisconnectReason.loggedOut`).
  - زيادة مهلة الانتظار في العميل [whatsapp-gateway-client.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/lib/whatsapp-gateway-client.ts) لتصبح 15 ثانية لتتناسب مع أوقات الاستيقاظ من النوم العميق.

## [تحسين تجربة تعديل الملف الشخصي، التوثيق التلقائي بالعلامة الزرقاء، تصنيف الإلكترونيات، وتبسيط إضافة الإعلانات] - 2026-08-30

### 1. دعم خيار الحالة (جديد / مستعمل) لفئة الإلكترونيات والسلع المادية
- **المهمة المنجزة:** إتاحة اختيار حالة المنتج (جديد أو مستعمل) لجميع فئات الإلكترونيات والأجهزة والسلع المادية وحفظها وتصفيتها بدقة.
- **التفاصيل:**
  - تحديث [category-utils.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/lib/category-utils.ts) لتوسيع التعرف على أسماء ومصطلحات الإلكترونيات (`smartphones`, `tablets`, `اكترون`).
  - تحديث [AdForm.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/AdForm.tsx) لضمان عرض وحفظ حقل الحالة `condition` لجميع إعلانات السلع المادية والصور.

### 2. تبسيط نموذج إضافة الإعلان وتخصيص ميزات الفيديو والموقع للباقة الذهبية
- **المهمة المنجزة:** منع تشتيت المستخدمين الجدد بإخفاء مربعات الفيديو والمواقع الترويجية من صفحة إضافة إعلان.
- **التفاصيل:**
  - حصر ظهور مدخلات روابط يوتيوب والمواقع الخارجية على مشتركي الباقة الذهبية (`plan === 'gold'`) أو الإدارة فقط في [AdForm.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/AdForm.tsx).

### 3. التوثيق التلقائي بالعلامة الزرقاء وتبسيط صفحة الملف الشخصي
- **المهمة المنجزة:** جعل توثيق الحساب بالعلامة الزرقاء 🛡️ تلقائياً وسلساً فور استكمال البيانات وتأكيد الهاتف، وإعادة تصميم صفحة تعديل البيانات لتكون خفيفة ومريحة للمستخدم.
- **التفاصيل:**
  - حذف صندوق طلب التوثيق اليدوي والواتساب القديم من [ProfileForm.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/ProfileForm.tsx).
  - تفعيل التوثيق التلقائي المباشر (`verified: true`) في اللحظة التي يكتمل فيها الاسم والعنوان ويتأكد فيها الهاتف عبر كود OTP.
  - استبدال زر "تعديل الرقم" بزر مصغر وأنيق بأيقونة قلم "تعديل" لتوفير مساحة كافية لعرض رقم الهاتف.
  - إزالة شعار الموقع الكبير من رأس صفحة الملف الشخصي لتبسيط الواجهة في [page.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/profile/page.tsx).
  - إخفاء الفوتر السفلي للموقع عند التصفح من الهاتف المحمول (`hidden md:block`) في صفحة الملف الشخصي.
  - حل تعارض React Hooks في `ProfileForm` ونقل هياكل التحميل (Skeleton) إلى صفحة [ProfilePage](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/profile/page.tsx).

### 4. تحسينات بيئة التطوير وأداء سرعة تحميل الصور (LCP)
- **المهمة المنجزة:** منع أخطاء AdSense 403 في بيئة التطوير وتسريع عرض الصور الكبيرة.
- **التفاصيل:**
  - قصر استدعاء أكواد Google AdSense على بيئة الإنتاج فقط (`process.env.NODE_ENV === 'production'`) في [layout.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/layout.tsx) و [AdSlot.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/AdSlot.tsx).
  - إضافة خاصية `priority={index < 2}` للصور الأولى في المدونة والصفحة الرئيسية في [HomeClient.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/HomeClient.tsx) و [blog/page.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/blog/page.tsx).

---

## [تكامل سيرفر واتساب السحابي الدائم Google Cloud Run وتفعيل التنشيط التلقائي 24/7 وصيغة النسخ السريع] - 2026-08-29

### 1. الاعتماد الأساسي على سيرفر Google Cloud Run الدائم لواتساب
- **المهمة المنجزة:** ربط إرسال رسائل التفعيل وأكواد الـ OTP بسيرفر واتساب السحابي المستقل على Google Cloud Run (`https://whatsapp-gateway-264703833176.europe-west1.run.app`) دون الحاجة لأي نفق مؤقت أو جهاز كمبيوتر محلي.
- **التفاصيل:**
  - تحديث [whatsapp-gateway-client.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/lib/whatsapp-gateway-client.ts) ليعتمد على السيرفر السحابي كخيار أول (Primary) مع دعم الاحتفاظ بالبدائل التلقائية.
  - ضبط صيغة رسالة التفعيل لتوضع الأكواد المكونة من 6 أرقام داخل علامات Monospace (` ```123456``` `) لإتاحة النسخ السريع بنقرة واحدة في واتساب.

### 2. تفعيل مسار التنشيط التلقائي السحابي 24/7 (Keep-Alive Cron)
- **المهمة المنجزة:** منع دخول سيرفر جوجل كلاود في وضع الخمول (Scale-to-Zero) وضمان استجابته الفورية على مدار الساعة.
- **التفاصيل:**
  - إنشاء مسار التنشيط التلقائي [src/app/api/cron/whatsapp-keepalive/route.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/api/cron/whatsapp-keepalive/route.ts).
  - دعم الفحص المستمر وإبقاء حاوية Cloud Run دافئة ومستجيبة في أجزاء من الثانية.

### 3. تحديث واجهة التحقق وتشخيص الأخطاء في الملف الشخصي
- **المهمة المنجزة:** تمكين نسخ تقارير الأخطاء والتشخيص بضغطة زر وتنسيق أزرار تأكيد OTP.
- **التفاصيل:**
  - تحديث [ProfileForm.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/ProfileForm.tsx) لدعم نسخ رسائل الخطأ التشخيصية بسهولة ومتابعة حالة الإرسال.

---

## [ربط وتفعيل بوابة رسائل الـ SMS عبر تطبيق الأندرويد My-otp] - 2026-08-28

### 1. تكامل مباشر مع تطبيق بوابة الرسائل SMSGatewayApp (My-otp)
- **المهمة المنجزة:** تمكين الموقع من إرسال رسائل التحقق النصية القصيرة (SMS OTP) الحقيقية والمجانية مباشرة من شريحة هاتف الأندرويد (SIM Card) عبر تطبيق `My-otp`.
- **التفاصيل:**
  - إنشاء وحدة الربط [sms-gateway-client.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/lib/sms-gateway-client.ts) للاتصال مع خادم التطبيق على المنفذ `8080` مع دعم التوكن الأمني وتشفير `HMAC-SHA256`.
  - إنشاء مسارات الـ API:
    - `/api/auth/sms-gateway/send`: توليد وحفظ كود التحقق وإرساله إلى الهاتف.
    - `/api/auth/sms-gateway/verify`: التحقق السريع من كود الـ OTP وتوثيق رقم الهاتف.
  - تحديث [ProfileForm.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/ProfileForm.tsx) ليكون الإرسال الافتراضي عبر بوابة رسائل الأندرويد SMS مع دعم تلقائي للبدائل (واتساب و Firebase).

---

## [تفعيل رسائل كود التحقق OTP الأساسية عبر Firebase SMS] - 2026-08-27

### 1. تفعيل إرسال كود التحقق عبر رسائل SMS من Firebase (Firebase Phone Auth)
- **المهمة المنجزة:** إعادة تفعيل إرسال أكواد التحقق (OTP) عبر رسائل SMS المباشرة من فايربيس (Firebase Phone Auth) كخيار أساسي وموثوق دون الحاجة لبوابة واتساب أو مسح QR.
- **التفاصيل:**
  - تحديث [ProfileForm.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/ProfileForm.tsx) ليكون خيار التحقق الافتراضي هو رسالة SMS من Firebase عبر `sendVerificationCode` و `RecaptchaVerifier`.
  - توفير زرين واضحين للمستخدم: **تأكيد برمز SMS (Firebase)** الأساسي، وزر اختياري بديل **عبر واتساب**.
  - دعم التحقق المزدوج تلقائياً عبر `confirmVerificationCode` لرسائل فايربيس أو عبر الـ Gateway لرسائل واتساب.

---

## [إصلاح مشكلة حذف الصور القديمة عند تعديل أو إضافة صور جديدة للإعلان] - 2026-08-27

### 1. إصلاح الاحتفاظ بالصور القديمة عند إضافة صور جديدة (Image Retention on Ad Edit)
- **المشكلة السابقة:** عند تعديل إعلان وإضافة صورة جديدة إليه، كانت دالة التحديث `updateAd` تقوم بمسح كافة الصور القديمة من الـ Storage واستبدالها بالصورة الجديدة فقط مع ظهور رسالة "جارٍ حذف الصور القديمة...".
- **المهمة المنجزة:** تمكين إضافة صور جديدة مع الاحتفاظ الكامل بجميع الصور القديمة وترتيبها الصحيح.
- **التفاصيل:**
  - تعديل دالة `updateAd` في [AuthContext.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/context/AuthContext.tsx) لمعالجة قائمة الصور المدمجة (`rawImages`) بحسب ترتيبها الفعلي.
  - رفع الصور والملفات الجديدة فقط ودمجها مع الصور القديمة المحتفظ بها بنفس ترتيب اختيار المستخدم.
  - قصر الحذف من الـ Storage على الصور التي قام المستخدم بإزالتها فعلياً من الإعلان فقط، وعدم مسح أي صورة اختار المستخدم إبقاءها.

---

## [قصر ميزات الفيديو والموقع على الباقة الذهبية وزيادة أحرف الوصف إلى 2000 حرف] - 2026-08-27

### 1. قصر ميزات إضافة رابط الفيديو والموقع الخارجي على الباقة الذهبية
- **المهمة المنجزة:** جعل مربع الميزات الخاصة بروابط الفيديو والمواقع الإلكترونية متاحاً حصرياً لمشتركي الباقة الذهبية (`gold`) والمشرفين فقط.
- **التفاصيل:**
  - تعديل التحقق في [AdForm.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/AdForm.tsx) ليكون مخصصاً للباقة الذهبية (`isGoldUser = userProfile?.role === 'admin' || userProfile?.plan === 'gold'`).
  - إظهار بطاقة ترقية مخصصة تدعو للترقية إلى الباقة الذهبية لغير المشتركين بها.
  - حماية حفظ البيانات بحيث لا يتم حفظ حقلي `websiteUrl` و `videoUrl` للإعلانات العادية إلا في حالة الباقة الذهبية أو المشرفين.

### 2. تعديل الحد الأقصى لأحرف وصف الإعلان إلى 2000 حرف
- **المهمة المنجزة:** منح مساحة أكبر لكتابة تفاصيل الإعلانات بدقة مع توضيح عدد الأحرف للمستخدم.
- **التفاصيل:**
  - تعديل مخطط التحقق (Zod Schema) لرفع الحد الأقصى لحقل الوصف `description` إلى `2000` حرف.
  - تحديث حقل الإدخال بنموذج إضافة الإعلان وتحديد `maxLength={2000}`.
  - إضافة عدّاد أحرف تفاعلي يوضح النسبة وعدد الأحرف المكتوبة والمتبقية للمستخدم.

---

## [نشر بوابة واتساب السحابية على Google Cloud Run وحل خطأ إرسال كود التفعيل] - 2026-08-27

### 1. إطلاق خادم بوابة واتساب السحابية على Google Cloud Run (24/7)
- **المهمة المنجزة:** تشغيل خادم بوابة واتساب المعتمد على مكتبة Baileys على بيئة Google Cloud Run السحابية بدلاً من الخادم المحلي.
- **التفاصيل:**
  - إنشاء ملف تجهيز الحاوية [Dockerfile](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/whatsapp-gateway/Dockerfile) و [dockerignore](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/whatsapp-gateway/.dockerignore) داخل مجلد `whatsapp-gateway`.
  - نشر الخدمة على Google Cloud Run برابط عام مشفر وآمن، وتثبيت النسخة على `Min instances = 1` لضمان بقاء جلسة واتساب تعمل دائماً بدون انقطاع.
  - ربط حساب الواتساب الخاص بالمنصة (`+201003975823`) بمسح رمز الـ QR من الرابط السحابي.

### 2. تحديث الربط المباشر وتحسين معالجة الأخطاء
- **المهمة المنجزة:** ربط تطبيق Next.js بالخادم السحابي الجديد وتحسين التنبيهات.
- **التفاصيل:**
  - تحديث [whatsapp-gateway-client.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/lib/whatsapp-gateway-client.ts) لتعيين الرابط السحابي الافتراضي وعرض رسائل خطأ عربية واضحة بدلاً من أخطاء `fetch failed` الغامضة.
  - تهيئة المتغير `WHATSAPP_GATEWAY_URL` في ملفات البيئة.

---

## [تبسيط الدخول عبر Google One Tap ونظام توثيق الحساب الاختياري والمرتبط بالترقية] - 2026-08-14

### 1. تبسيط تسجيل الدخول بجوجل (Google One Tap Login)
- **المهمة المنجزة:** تمكين تسجيل الدخول التلقائي بنقرة واحدة لزوار الموقع الجدد.
- **التفاصيل:**
  - إنشاء مكون عميل جديد [GoogleOneTap.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/GoogleOneTap.tsx) لاستدعاء مكتبة `gsi/client` من جوجل وإطلاق نافذة One Tap.
  - ربط المكون في تخطيط الموقع الرئيسي [layout.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/layout.tsx) ليعمل لجميع المستخدمين غير المسجلين.
  - تهيئة المتغير المحلي `NEXT_PUBLIC_GOOGLE_CLIENT_ID` في ملف البيئة [env.local](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/.env.local).
  - تحديث سياسة أمان المحتوى (Content Security Policy) في [next.config.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/next.config.ts) للسماح بمصادر نص وإطارات (script-src, connect-src, frame-src) الخاص بـ `https://accounts.google.com`.

### 2. نظام توثيق الحساب الاختياري (Account Verification Flow)
- **المهمة المنجزة:** تمكين المستخدم من توثيق حسابه بالاسم ورقم الهاتف المفعل والعنوان ليحصل على شارة التوثيق.
- **التفاصيل:**
  - إضافة حقل `verified?: boolean` للنوع `UserProfile` في [types.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/lib/types.ts).
  - تحديث صفحة الإعدادات [ProfileForm.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/ProfileForm.tsx) لإضافة قسم تفاعلي جديد بالكامل يعرض حالة وشروط التوثيق (الاسم الكامل، العنوان بالبلد والمحافظة والمدينة، رقم الهاتف المؤكد عبر كود التفعيل OTP) وتوفير زر التوثيق الفوري.

### 3. إظهار شارات التوثيق (Verified Badge) في الواجهات
- **المهمة المنجزة:** إبراز الحسابات الموثقة لزيادة مصداقية الإعلانات.
- **التفاصيل:**
  - **بطاقة الإعلان:** تعديل [AdCard.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/AdCard.tsx) لعرض شارة التوثيق `BadgeCheck` الزرقاء بجانب اسم الناشر للمنتج أو المتجر الموثق.
  - **تفاصيل الإعلان:** إدراج بطاقة معلومات الناشر متكاملة بالاسم والمهنة وشارة التوثيق في الشريط الجانبي داخل [AdDetailClient.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/AdDetailClient.tsx).
  - **الملف الشخصي العام:** تحديث صفحة الملف الشخصي العام للمستخدم [page.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/profile/%5Bid%5D/page.tsx) لعرض شارة التوثيق الموثقة بجانب الاسم.

### 4. ربط ترقية الإعلانات بالتوثيق (Verification gate for upgrades)
- **المهمة المنجزة:** إلزام الأعضاء بتوثيق حساباتهم قبل الاشتراك في الباقات المميزة أو الترقية.
- **التفاصيل:**
  - تحديث صفحة الباقات والأسعار [page.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/app/pricing/page.tsx) لفحص حالة التوثيق `userProfile.verified` عند محاولة الاشتراك في باقة مدفوعة، وتوجيهه تلقائياً لاستكمال التوثيق في الإعدادات مع ظهور تنبيه توضيحي.

### 5. إصلاح أخطاء رسم أيقونات SVG (WhatsApp Icon Path Fixes)
- **المهمة المنجزة:** حل مشكلة تعطل الواجهة والـ crash المسبب لخطأ attribute d: Expected number.
- **التفاصيل:**
  - إعادة صياغة واستبدال كود أيقونة الواتساب `WhatsappIcon` الطويل والمعقد بكود مسار رسم (SVG Path) بسيط وقياسي 100% وخالٍ من الأخطاء في كل من [AdCard.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/AdCard.tsx) و [AdDetailClient.tsx](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/src/components/AdDetailClient.tsx).

### 6. إصلاح تعطل عرض الصور بعد النشر (Unoptimized Images on Deploy)
- **المهمة المنجزة:** حل مشكلة اختفاء صور المنتجات والإعلانات بعد الرفع على خوادم Firebase.
- **التفاصيل:**
  - إعادة تعيين خيار `unoptimized: true` داخل إعدادات `images` في ملف [next.config.ts](file:///d:/mashro3/mashroh/arb-soq/arb_soq.wap/arb_soq.wap/next.config.ts).
  - **السبب:** لا تدعم بيئات تشغيل Firebase Cloud Functions (Hosting serverless Next.js frameworks) معالجة الصور ومحرك تحسين الصور الافتراضي لـ Next.js بشكل سليم، مما يسبب أخطاء 400 واختفاء الصور بعد النشر على الاستضافة الفعلية بينما تعمل محلياً بشكل سليم. تفعيل `unoptimized: true` يجبر المتصفح على طلب الصور بروابطها المباشرة الأصلية من Firebase Storage دون الحاجة لمعالجة سيرفرية.

---

## [تحديثات توافق الذكاء الاصطناعي (llms.txt)، استقرار التراكم والمرونة الجوالة وإحصاءات جوجل] - 2026-08-13

### 1. معايير تصفح الذكاء الاصطناعي (WebMCP & AI Agent Accessibility - llms.txt)
- **المهمة المنجزة:** إعادة هيكلة [public/llms.txt](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/public/llms.txt) وتوفير [public/llms-full.txt](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/public/llms-full.txt).
- **التفاصيل:**
  - صياغة روابط المواقع بصيغة Markdown الرسمية `[Title](URL)` لإصلاح خطأ عدم اكتشاف الروابط في أدوات الفحص البرمجي للنماذج اللغوية الكبيرة.
  - إضافة عنوان رئيسي واحد `# H1` واقتباس ملخص للموقع `> ...` ورؤوس فرعية `## H2` للتطابق 100% مع معيار `llmstxt.org`.

### 2. إصلاح القفزات المرئية للتصميم وتثبيت الأبعاد (Cumulative Layout Shift - CLS)
- **المهمة المنجزة:** معالجة أسباب الـ CLS لتقليل المقياس من 0.407 إلى ما دون 0.1.
- **التفاصيل:**
  - **فتحات الإعلانات:** حجز مساحات ثابتة `min-height` في [src/components/Ads.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/Ads.tsx) (90px للإعلان الأفقي و 250px للمربع) لمنع قفز المحتوى عند تحميل AdSense.
  - **غلاف التميؤ:** استبدال نص `Loading...` في [layout.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/layout.tsx) بحاوية ممتدة `min-h-screen`.
  - **الهيدر والبطاقات الجانبية:** توحيد أبعاد الهيدر المبدئي في [Header.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/Header.tsx) وإضافة هياكل تحميل skeletons بارتفاعات محددة لـ `RelatedAdsSidebar` و `StoreSidebarSection` في [HomeClient.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/HomeClient.tsx).

### 3. تقييد الانزلاق والأفق الجوال (Mobile Overflow & Responsiveness)
- **المهمة المنجزة:** منع أي اهتزاز أو تمرير أفقي جانبي على كافة الهواتف والشاشات الصغيرة.
- **التفاصيل:**
  - إضافة قواعد العرض الأقصى والتدفق `html, body { max-width: 100vw; width: 100%; overflow-x: hidden; position: relative; }` وضبط عناصر الوسائط `img, video, iframe, canvas, svg { max-width: 100%; }` في [globals.css](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/globals.css).
  - تعزيز `w-full max-w-full overflow-x-hidden` في الأغلفة الرئيسية للمكونات ([layout.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/layout.tsx), [Header.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/Header.tsx), [QuickOptions.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/QuickOptions.tsx), [CategoriesGridHero.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/CategoriesGridHero.tsx), [HomeClient.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/HomeClient.tsx)).

### 4. شرط إخفاء مربع وشارة السعر الفارغة (Price Logic)
- **المهمة المنجزة:** إخفاء مربع وشارات السعر تماماً للإعلانات التي لم يُحدد لها سعر عند الإنشاء.
- **التفاصيل:**
  - تحديث [AdDetailClient.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/AdDetailClient.tsx) لإخفاء مربع السعر الجانبي الكبير كلياً عند عدم وجود سعر.
  - تحديث [AdCard.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/AdCard.tsx)، [AdRow.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/AdRow.tsx)، [RelatedAdsSidebar.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/RelatedAdsSidebar.tsx)، [StoreSidebarSection.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/StoreSidebarSection.tsx)، و [ServiceCard.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/ServiceCard.tsx) لإلغاء أي وسام أو نص سعر افتراضي عندما يكون السعر غير محدد.

### 5. دمج وتفعيل إحصاءات جوجل وإشارات الموافقة (Google Tag G-EKJ4JF0LZQ & Consent Mode)
- **المهمة المنجزة:** تفعيل تتبع الزيارات واجتياز فحص أداة Tag Assistant.
- **التفاصيل:**
  - إدراج كود تتبع `gtag.js` المباشر للمعرف `G-EKJ4JF0LZQ` في [layout.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/app/layout.tsx).
  - تكامل وضع الموافقة (Google Consent Mode) وتمرير إشارات الموافقة عبر [CookieConsent.tsx](file:///d:/mashro3/mashroh/arb_soq.wap/arb_soq.wap/src/components/CookieConsent.tsx) لاستيفاء متطلبات التتبع والـ EEA بنجاح.

---

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
