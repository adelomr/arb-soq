# مواصفة قاعدة بيانات سوق العرب الموحدة (Database Schema & Android-Web Sync Specification)

تُمثّل هذه الوثيقة المرجع الهندسي والقانوني الأول والمطلق لقاعدة بيانات Firebase Firestore الخاصة بمشروع **سوق العرب** (الموقع الإلكتروني وتطبيق الأندرويد).
يجب الالتزام بجميع الحقول والأنواع الموضحة أدناه لضمان ظهور البيانات والمحتوى بانسجام 100% وبشكل فوري تبادلي (Real-time Synchronization) بين تطبيق الهواتف والموقع.

---

## 1. المجموعات الرئيسية (Firestore Top-Level Collections)

### 1.1 مجموعة الإعلانات الرئيسية `/ads`
المجموعة المركزية التي تُقرأ منها جميع الإعلانات وتُعرض في الموقع وتطبيق الأندرويد.

#### الهيكل التفصيلي للمستند (Document Schema):
| اسم الحقل (Field Name) | النوع في Firestore | الوصف والاستخدام | التوافق مع الأندرويد (Android Compatibility) |
| :--- | :--- | :--- | :--- |
| `id` | `String` | معرّف المستند الفريد | يُطابق doc.id |
| `userId` | `String` | معرّف ناشر الإعلان (UID) | مستخدم لربط الإعلان بالملف الشخصي |
| `title` | `String` | عنوان الإعلان | يعرض في الكارت |
| `description` | `String` | تفاصيل وشرح الإعلان | يعرض في صفحة الإعلان |
| `category` | `String` | معرف الفئة (مثل `vehicles`, `services`) | مستخدم في الفلترة والتوجيه |
| `categoryId` | `String` (اختياري) | معرّف الفئة البديل للأندرويد | يُطابق `category` |
| `subcategory` | `String` (اختياري) | معرّف الفئة الفرعية (مثل `furniture-moving`) | فلترة مخصصة |
| `price` | `Number` (اختياري) | السعر | `Double` / `Long` |
| `currency` | `String` (اختياري) | رمز العملة (مثل `EGP`, `SAR`, `USD`) | التنسيق المالي |
| `productCode` | `String` (اختياري) | كود المنتج أو الرقم المرجعي | |
| `location` | `String` (اختياري) | العنوان أو النص الحادي للعنوان | |
| `province` | `String` (اختياري) | المحافظة / المنطقة | |
| `governorate` | `String` (اختياري) | المحافظة بالتطبيق | يُطابق `province` |
| `city` | `String` (اختياري) | المدينة | |
| `village` | `String` (اختياري) | الحي / القرية | |
| `latitude` | `Number` (اختياري) | إحداثيات خط العرض | الخرائط الجغرافية |
| `longitude` | `Number` (اختياري) | إحداثيات خط الطول | الخرائط الجغرافية |
| `imageUrls` | `Array<String>` | مصفوفة روابط الصور الكاملة | الويب يقرأ المصفوفة كاملاً |
| `imageUrl` | `String` | رابط الصورة الرئيسية (الغلاف) | **حقل مخصص للأندرويد** (`imageUrls[0]`) |
| `imageMeta` | `Array<Map>` | تفاصيل الصور `{url, path, name, size}` | لحذف الصور من Firebase Storage |
| `imageHints` | `Array<String>` | كلمات توجيهية صويرية | |
| `isPromoted` | `Boolean` | إعلان مميز أم عادي | `true` للإعلانات المروجة |
| `isPremium` | `Boolean` | إعلان ريادي عالي الأولوية | `true` لظهوره في أعلى الصفحة |
| `premiumExpiresAt` | `Number` (اختياري) | تاريخ انتهاء الترقية المتميزة | ملي ثانية Epoch ms |
| `views` | `Number` | عدد مشاهدات الإعلان | القيمة الافتراضية: `0` |
| `clicks` | `Number` | عدد النقاط/التواصل | القيمة الافتراضية: `0` |
| `postedAt` | `String` | تاريخ النشر بتنسيق ISO 8601 | `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `timestamp` | `Number` | تاريخ النشر بالملي ثانية Epoch ms | **حقل مخصص للأندرويد** (`Date.now()`) |
| `adType` | `String` | نوع الإعلان (`image`, `video`, `sell-item`, `sell-service`, `request-service`) | قيم النظام الإنجليزية |
| `adTypeAr` | `String` | اسم نوع الإعلان بالعربية | **حقل مخصص للأندرويد** ("صوري", "فيديو", "بيع منتج", "بيع خدمة", "طلب خدمة") |
| `market` | `String` | كود سوق الدولة (مثل `eg`, `sa`) | معرّف السوق بالويب |
| `country` | `String` | اسم الدولة بالعربية (مثل `مصر`, `المملكة العربية السعودية`) | **ضروري للتطبيق والويب** لفلترة الأسواق |
| `status` | `String` | حالة الإعلان (`active`, `pending`, `rejected`, `sold`) | افتراضي: `active` |
| `isActive` | `Boolean` | شارة التفعيل للتطبيق | **حقل مخصص للأندرويد** (`true` عند `status == 'active'`) |
| `condition` | `String` (اختياري) | حالة المنتج (`new`, `used`) | جديد / مستعمل |
| `phoneNumber` | `String` (اختياري) | رقم الهاتف المباشر للإعلان | |
| `showCommIcon` | `Boolean` (اختياري) | إظهار أيقونة التواصل الإضافة | للتطبيق |
| `websiteUrl` | `String` (اختياري) | رابط موقع خارجي | |
| `videoUrl` | `String` (اختياري) | رابط الفيديو الخاص بالإعلان | لإعلانات الفيديو |
| `playlistUrl` | `String` (اختياري) | رابط قائمة تشغيل يوتيوب | لإعلانات الفيديو المتقدمة |
| `rating` | `Number` (اختياري) | متوسط تقييم المعلن/الإعلان | من 1 إلى 5 |
| `reviewCount` | `Number` (اختياري) | عدد التقييمات | |

---

### 1.2 المجموعة الفرعية للتعليقات `/ads/{adId}/comments`
تحتوي على التعليقات التي يتركها المستخدمون على إعلان معين.

| اسم الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `String` | معرّف التعليق |
| `adId` | `String` | معرّف الإعلان المرتبط |
| `userId` | `String` | معرّف كاتب التعليق (UID) |
| `userName` | `String` | اسم كاتب التعليق |
| `userAvatar` | `String` (اختياري) | صورة كاتب التعليق الشخصية |
| `content` | `String` | نص التعليق |
| `createdAt` | `Timestamp` / `String` | وقت إنشاء التعليق |

---

### 1.3 مجموعة المستخدمين الرئيسية `/users`
تحتوي على بيانات الحسابات والملفات الشخصية. معرّف المستند هو `uid` الخاص بـ Firebase Auth.

#### الهيكل التفصيلي للمستند:
| اسم الحقل | النوع | الوصف والاستخدام |
| :--- | :--- | :--- |
| `id` | `String` | معرّف المستخدم (UID) |
| `name` | `String` | اسم المستخدم للعرض |
| `fullName` | `String` (اختياري) | الاسم الكامل |
| `email` | `String` | البريد الإلكتروني |
| `avatarUrl` | `String` (اختياري) | رابط الصورة الشخصية |
| `phoneNumber` | `String` (اختياري) | رقم الهاتف مع كود الدولة |
| `phone` | `String` (اختياري) | رقم الهاتف البديل |
| `phoneVerified` | `Boolean` | حالة تأكيد رقم الهاتف |
| `role` | `String` | رتبة المستخدم (`user` أو `admin`) |
| `status` | `String` | حالة الحساب (`active`, `suspended`, `deleted`) |
| `walletBalance` | `Number` | رصيد المحفظة الإعلانية |
| `country` | `String` (اختياري) | الدولة المسجل بها (اسم عربي مثل "مصر") |
| `province` / `governorate` | `String` (اختياري) | المحافظة |
| `city` | `String` (اختياري) | المدينة |
| `village` | `String` (اختياري) | القرية/الحي |
| `profession` | `String` (اختياري) | المهنة (في حالة مقدمي الخدمات) |
| `specialization` | `String` (اختياري) | التخصص الدقيق |
| `moderatedCategories` | `Array<String>` (اختياري) | الفئات المشرف عليها الأدمن |
| `rating` | `Number` (اختياري) | التقييم العام للبائع (من 1 إلى 5) |
| `reviewCount` | `Number` (اختياري) | إجمالي عدد مراجعات البائع |
| `createdAt` | `Timestamp` / `String` | تاريخ التسجيل |
| `portfolioImages` | `Array<Map>` (اختياري) | معرض أعمال الفني/المهني |

---

### 1.4 المجموعات الفرعية للمستخدم `/users/{userId}/...`

#### 1.4.1 الإعلانات المخصصة للمستخدم `/users/{userId}/ads`
تدعم المنظومة المسار المزدوج للبحث والاحتياط، بنفس هيكل بيانات المستند الموجود في `/ads`.

#### 1.4.2 المتجر والمنتجات `/users/{userId}/store`
تحتوي على مستند المتجر للمستخدم (`storeId`).
- **حقول المتجر**: `id`, `storeName`, `storeDescription`, `coverImageUrl`, `ownerId`.
- **المجموعة الفرعية للمنتجات**: `/users/{userId}/store/{storeId}/products` (تحتوي على منتجات المتجر بنفس هيكلية مستند `Ad`).

#### 1.4.3 تقييمات البائع `/users/{userId}/reviews`
| اسم الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `String` | معرّف المراجعة |
| `reviewerId` | `String` | معرّف صاحب التقييم |
| `reviewerName` | `String` | اسم صاحب التقييم |
| `rating` | `Number` | الدرجة من 1 إلى 5 |
| `text` | `String` | نص التقييم والنقد |
| `createdAt` | `Timestamp` | وقت التقييم |
| `adId` | `String` (اختياري) | معرّف الإعلان المقيّم بناءً عليه |

---

### 1.5 مجموعة الفئات `/categories`
المجموعة الإرشاداتية لإظهار الأقسام والفئات. معرّف المستند هو معرف الفئة الإنجليزي (مثل `vehicles`, `realestate`, `furniture`, `electronics`, `services`, `crafts`).

| اسم الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `String` | معرّف الفئة |
| `name` | `Map` | كائن يحتوي على الأسماء `{ ar: "السيارات والمركبات" }` |
| `icon` | `String` | اسم الأيقونة (Lucide icon name مثل `Car`, `Home`, `Sofa`) |
| `subcategories` | `Array<Map>` | مصفوفة الفئات الفرعية `[{ id, name: { ar }, parentId, icon }]` |

---

### 1.6 مجموعة التنبيهات `/notifications`
تخزن التنبيهات والرسائل الموجهة للمستخدمين.

| اسم الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `String` | معرّف التنبيه |
| `userId` | `String` | معرّف المستخدم المستهدف |
| `message` | `String` | نص التنبيه |
| `type` | `String` | نوع التنبيه (`general` أو `private`) |
| `isRead` | `Boolean` | هل تم قراءة التنبيه ام لا |
| `createdAt` | `Timestamp` | تاريخ وساعة التنبيه |
| `link` | `String` (اختياري) | رابط التوجيه عند الضغط |

---

### 1.7 مجموعة الصفحات والهبوط `/pages`
تُدار عبر لوحة الأدمن لتوليد صفحات SEO وصفحات الهبوط والصفحات الإعلانية المخصصة (`pageType`: `system`, `legal`, `landing`, `adpage`).

---

### 1.8 مجموعة المدونة `/blogs`
تُستخدم لإدارة المقالات والأخبار.

---

### 1.9 مجموعة رسائل اتصل بنا `/contact_messages`
تُسجل استفسارات واستمارات التواصل.
- **الحقول**: `name`, `email`, `phone`, `subject`, `message`, `timestamp` (`Timestamp`), `isRead` (`Boolean`).

---

### 1.10 مجموعة الشريطة الإعلانية `/announcements`
إدارة شريط الإشعارات العلوي على الموقع والتطبيق.
- **الحقول**: `id`, `isEnabled` (`Boolean`), `message` (`{ ar: String }`), `link`, `linkText`, `backgroundColor`, `textColor`, `updatedAt`.

---

## 2. قواعد التوافق والمزامنة الفورية (Sync Rules)

عند إضافة أو تعديل أي إعلان في **تطبيق الأندرويد** أو **الموقع**، يجب تطبيق القواعد التالية تلقائياً:

1. **الكتابة إلى مجموعة الإعلانات الرئيسية `/ads`**:
   - يتم حظر الرفع المباشر إلى مجموعات معزولة فقط، بل تكتب جميع الإعلانات العامة مباشرة في المجموعة الرأسية `/ads` مع تعيين `id` يساوي معرّف المستند.

2. **التوافق التلقائي للصور**:
   - `imageUrls`: مصفوفة بجميع روابط الصور المرفوعة.
   - `imageUrl`: الرابط الأول `imageUrls[0]` لكي يتمكن تطبيق الأندرويد من عرض صورة الغلاف مباشرة دون معالجة مصفوفات.

3. **تحديد الدولة والفلترة المزدوجة**:
   - حقل `country`: يجب أن يحتوي **دائماً على اسم الدولة باللغة العربية** (مثل "مصر"، "المملكة العربية السعودية"، "الإمارات") لضمان توافق الفلترة في الأندرويد والويب.
   - حقل `market`: يحتوي على كود الدولة ثنائي الأحرف (`eg`, `sa`, `ae`) للويب.

4. **أنواع الإعلانات بالتطبيق والموقع**:
   - `adType`: القيم النظامية (`image`, `video`, `sell-item`, `sell-service`, `request-service`).
   - `adTypeAr`: القيم العربية الموازية للتطبيق ("صوري", "فيديو", "بيع منتج", "بيع خدمة", "طلب خدمة").

5. **تاريخ النشر والحالة المزدوجة**:
   - `postedAt`: صيغة ISO 8601 نصية للويب.
   - `timestamp`: رقم ملي ثانية Epoch ms للتطبيق (`System.currentTimeMillis()`).
   - `status`: النص الإنجليزي للحالة (`active`, `pending`, `sold`, `rejected`).
   - `isActive`: قيمة منطقية `true` عند `status == 'active'` لتوافق استعلامات الأندرويد القديمة.

---

## 3. نماذج Kotlin Data Classes للتطبيق (Android Kotlin Models)

يمكن لمهندس الأندرويد نسخ واستخدام الأكواد التالية مباشرة داخل تطبيق الأندرويد بـ Studio:

```kotlin
package com.soqarab.app.models

import com.google.firebase.firestore.IgnoreExtraProperties

@IgnoreExtraProperties
data class AdData(
    var id: String = "",
    var userId: String = "",
    var title: String = "",
    var description: String = "",
    var category: String = "",
    var categoryId: String? = null,
    var subcategory: String? = null,
    var price: Double? = null,
    var currency: String? = "SAR",
    var productCode: String? = null,
    var location: String? = null,
    var province: String? = null,
    var governorate: String? = null,
    var city: String? = null,
    var village: String? = null,
    var latitude: Double? = null,
    var longitude: Double? = null,
    var imageUrls: List<String> = emptyList(),
    var imageUrl: String = "",
    var isPromoted: Boolean = false,
    var isPremium: Boolean = false,
    var premiumExpiresAt: Long? = null,
    var views: Long = 0,
    var clicks: Long = 0,
    var postedAt: String = "",
    var timestamp: Long = System.currentTimeMillis(),
    var adType: String = "image",
    var adTypeAr: String = "صوري",
    var market: String = "sa",
    var country: String = "المملكة العربية السعودية",
    var status: String = "active",
    var isActive: Boolean = true,
    var condition: String? = "used",
    var phoneNumber: String? = null,
    var videoUrl: String? = null,
    var playlistUrl: String? = null,
    var rating: Double? = null,
    var reviewCount: Int? = null
)

@IgnoreExtraProperties
data class UserData(
    var id: String = "",
    var name: String = "",
    var fullName: String? = null,
    var email: String = "",
    var avatarUrl: String? = null,
    var phoneNumber: String? = null,
    var phoneVerified: Boolean = false,
    var role: String = "user",
    var status: String = "active",
    var walletBalance: Double = 0.0,
    var country: String? = "المملكة العربية السعودية",
    var governorate: String? = null,
    var city: String? = null,
    var village: String? = null,
    var profession: String? = null,
    var specialization: String? = null,
    var rating: Double? = null,
    var reviewCount: Int? = null
)
```

---

*تاريخ التحديث المعتمد: 2026-08-11*
