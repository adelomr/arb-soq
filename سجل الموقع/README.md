# 📚 سجل ومرجع تطوير موقع سوق العرب (Arb-Soq Documentation Hub)

مرحباً بك في **سجل ومرجع التطوير الشامل** لمشروع **سوق العرب (Arb-Soq)**.  
تم تنظيم وهيكلة هذا السجل ليكون مرجعاً هندسياً دقيقاً وسريعاً لأي مطور أو ذكاء اصطناعي يعمل على تطوير النظام وصيانته.

---

## 🧭 خريطة السجل وأقسامه الرئيسية

```
سجل الموقع/
├── README.md                              # 📖 الفهرس العام ودليل المطور السريع
├── سجل_التحديثات_CHANGELOG.md              # 📜 السجل الزمني لكافة التحديثات والميزات
│
├── ذاكرة_المشروع/                         # 🧠 المعمارية وقواعد البيانات
│   ├── ARCHITECTURE.md                    # 🏗️ الهيكلية المعمارية وأنماط النظام
│   ├── DATABASE_SCHEMA.md                 # 🗄️ المخطط الشامل لقاعدة بيانات Firestore
│   ├── PROJECT_RULES.md                   # ⚖️ الضوابط والقواعد الصارمة للتطوير
│   ├── AI_RULES.md                        # 🤖 إرشادات وتعليمات الذكاء الاصطناعي
│   ├── CURRENT_TASK.md                    # 📌 المهام الحالية والمنجزة
│   └── README.md                          # 📄 ملخص ذاكرة المشروع
│
├── تاريخ_الأخطاء_والإصلاحات/              # 🛡️ توثيق وحلول المشاكل البرمجية
│   ├── BUG-001-mobile-ui-and-navigation.md
│   ├── BUG-002-firebase-deploy-timeout.md
│   ├── BUG-005-whatsapp-gateway-cloud-run.md
│   ├── BUG-006-whatsapp-otp-auto-click-and-form-bypass.md
│   ├── BUG-007-exclusive-cloud-run-whatsapp-and-keepalive.md
│   ├── BUG-008-react-hooks-order-profile-form.md
│   └── TEMPLATE.md                        # 📝 نموذج توثيق خطأ جديد
│
├── القرارات_المعمارية/                    # 💡 أسباب ودوافع القرارات الهندسية
│   ├── DEC-001-ad-form-and-home-ui.md
│   ├── DEC-002-profession-category-toggle.md
│   ├── DEC-003-quick-options-all-and-admin-sync.md
│   ├── DEC-004-authentic-ratings-only.md
│   ├── DEC-005-automatic-blue-badge-verification-and-simplified-adform.md
│   └── TEMPLATE.md                        # 📝 نموذج قرار معماري جديد
│
├── قوائم_التحقق/                          # ✅ قوائم الفحص والاختبار
│   └── PRE_DEPLOYMENT.md                  # 🚀 قائمة التحقق قبل النشر على الإنتاج
│
└── توثيق_بوابات_الرسائل_OTP/              # 📱 بوابات الرسائل القصيرة SMS والواتساب
    ├── INTEGRATION_GUIDE.md               # 🔌 دليل ربط بوابة SMS مع تطبيق My-otp
    ├── API.md                             # 📡 مواصفة واجهة برمجة التطبيقات (API Specs)
    ├── WHATSAPP_GATEWAY_README.md         # 🟢 سيرفر واتساب السحابي على Cloud Run
    ├── SMS_TROUBLESHOOTING.md             # 🔧 حل مشاكل إرسال الرسائل القصيرة
    ├── SMS_DELIVERY_ANALYSIS.md           # 📊 تحليل وصول الرسائل وحالات الشبكة
    ├── GOOGLE_PLAY_JUSTIFICATION.md       # 🛡️ مبررات صلاحيات التطبيق لمتجر Google Play
    └── PRIVACY_POLICY.md                  # 🔒 سياسة الخصوصية
```

---

## ⚡ أوامر المطور السريعة (Developer Cheat Sheet)

### 1. تشغيل بيئة التطوير محلياً:
```bash
npm run dev
# يفتح السيرفر على http://localhost:3000
```

### 2. فحص الأنواع وسلامة الكود (Type-Checking):
```bash
npx tsc --noEmit
```

### 3. بناء المشروع للإنتاج (Production Build):
```bash
npm run build
```

### 4. التحقق من حالة المستودع ورفع التحديثات:
```bash
git status
git add -A
git commit -m "feat: your descriptive commit message"
git push origin main
```

---

## 🔑 القواعد المعمارية الذهبية لمشروع سوق العرب

1. **التعامل مع السلع والحالة (Condition):**
   - السلع المادية تخضع لفحص `isPhysicalGoodsCategory` في [category-utils.ts](../src/lib/category-utils.ts).
   - يتم تخزين الحالة إما `new` (جديد) أو `used` (مستعمل).
2. **التوثيق بالعلامة الزرقاء 🛡️:**
   - التوثيق تلقائي فور اكتمال الاسم والعنوان وتأكيد رقم الهاتف عبر رمز OTP.
3. **عزل إعلانات AdSense:**
   - إعلانات جوجل لا تُحمّل على بيئة التطوير المحلية `localhost` لمنع أخطاء 403، وتعمل حصرياً على بيئة الإنتاج (`process.env.NODE_ENV === 'production'`).
4. **استقرار React Hooks:**
   - ممنوع وضع أي استدعاء لـ Hook بعد شروط الخروج المبكر (`if (...) return`). يجب أن تكون جميع الـ Hooks في بداية المكون دائماً.
5. **بوابة واتساب السحابية:**
   - تعمل على Google Cloud Run مدعومة بمسار Keep-Alive يعمل تلقائياً لمنع خمول الحاوية وضمان وصول أكواد OTP خلال أجزاء من الثانية.
