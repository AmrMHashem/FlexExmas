# 🎓 ExamPro — منصة اختبارات الشهادات الدولية

منصة احترافية كاملة لاختبارات الشهادات الدولية مع Firebase كـ Backend.

---

## 🗂 هيكل المشروع

```
exampro/
├── src/
│   ├── firebase.js              ← إعداد Firebase
│   ├── main.jsx                 ← نقطة الدخول
│   ├── App.jsx                  ← Router الرئيسي
│   ├── hooks/
│   │   └── useAuth.js           ← Auth Context + Hook
│   ├── services/
│   │   └── firestore.js         ← كل عمليات Firestore
│   ├── utils/
│   │   └── csv.js               ← محلل CSV
│   ├── components/
│   │   ├── UI.jsx               ← مكونات التصميم المشتركة
│   │   ├── NavBar.jsx           ← شريط التنقل
│   │   └── Certificate.jsx      ← مولد الشهادات SVG
│   └── pages/
│       ├── Home.jsx             ← الصفحة الرئيسية + بحث
│       ├── ExamDetail.jsx       ← تفاصيل الاختبار + إعدادات
│       ├── Quiz.jsx             ← محرك الاختبار
│       ├── Result.jsx           ← النتيجة + مراجعة + شهادة
│       ├── Auth.jsx             ← تسجيل دخول / إنشاء حساب
│       ├── Dashboard.jsx        ← داشبورد الطالب
│       └── Admin.jsx            ← لوحة تحكم الأدمن
├── scripts/
│   └── makeAdmin.js             ← ترقية مستخدم لأدمن
├── public/
│   └── favicon.svg
├── firestore.rules              ← قواعد الأمان
├── firestore.indexes.json       ← فهارس Firestore
├── firebase.json                ← إعداد Firebase Hosting
├── vite.config.js
├── index.html
├── package.json
└── sample_questions.csv         ← نموذج أسئلة CSV للتجربة
```

---

## ⚡ خطوات التشغيل

### 1. تثبيت الحزم
```bash
cd exampro
npm install
```

### 2. تشغيل محلياً
```bash
npm run dev
# يفتح على: http://localhost:3000
```

### 3. بناء للإنتاج
```bash
npm run build
```

---

## 🔥 إعداد Firebase

### أ) إنشاء أول حساب أدمن

1. افتح المنصة وسجّل حساباً عادياً ببريدك
2. اذهب لـ **Firebase Console → Firestore**
3. ابحث عن مستندك في `users/{uid}`
4. عدّل الحقل `role` من `"student"` إلى `"admin"`

**أو** استخدم السكريبت (يحتاج service account):
```bash
node scripts/makeAdmin.js your@email.com
```

---

### ب) Firestore Rules

انسخ محتوى `firestore.rules` وضعه في:
**Firebase Console → Firestore → Rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /users/{uid} {
      allow read:  if request.auth.uid == uid || isAdmin();
      allow create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid || isAdmin();
    }
    match /exams/{id}     { allow read: if true; allow write: if isAdmin(); }
    match /questions/{id} { allow read: if true; allow write: if isAdmin(); }
    match /results/{id} {
      allow read:   if request.auth != null &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
                    request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }
  }
}
```

---

### ج) Firestore Indexes

اذهب لـ **Firebase Console → Firestore → Indexes** وأضف:

| Collection | Fields | Query scope |
|---|---|---|
| questions | examId ASC, order ASC | Collection |
| results | userId ASC, createdAt DESC | Collection |
| results | examId ASC, createdAt DESC | Collection |
| exams | category ASC, createdAt DESC | Collection |

---

### د) Firebase Hosting (نشر مجاني)

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# ربط المشروع
firebase use exampro-1e4de

# بناء ونشر
npm run build
firebase deploy
```

سيظهر رابط مثل: `https://exampro-1e4de.web.app`

---

## 📤 رفع الأسئلة (CSV)

### هيكل الملف:
```csv
Question,Answer Option 1,Explanation 1,Answer Option 2,Explanation 2,...,Correct Answers,Overall Explanation,Domain
```

### تفاصيل الأعمدة:

| العمود | الاسم | الوصف |
|--------|-------|-------|
| 1 | Question | نص السؤال |
| 2,4,6,8,10,12 | Answer Option 1-6 | نصوص الخيارات (حتى 6) |
| 3,5,7,9,11,13 | Explanation 1-6 | شرح لكل خيار (اختياري) |
| 14 | Correct Answers | رقم الإجابة الصحيحة (أو أرقام مفصولة بفاصلة للمتعدد) |
| 15 | Overall Explanation | الشرح العام للسؤال |
| 16 | Domain | المجال (مثل: Storage, Networking) |

### مثال:
```csv
"Which service is S3?","Block Storage","Wrong","Object Storage","Correct!","Database","Wrong","CDN","Wrong","2","S3 is object storage","Storage"
```

### للأسئلة متعددة الإجابات:
```
Correct Answers = "1,3"  أو  "2,4,5"
```

---

## 🎮 ميزات المنصة

### للطلاب:
- ✅ **معاينة مجانية** — أول 10% من الأسئلة بدون تسجيل
- ✅ **اختيار المدة** — الطالب يحدد وقته (10-300 دقيقة)
- ✅ **اختيار درجة النجاح** — الطالب يحدد نسبة النجاح
- ✅ **اختيار عدد الأسئلة** — من 5 للعدد الكامل
- ✅ **خريطة الأسئلة** — تنقل سريع بين الأسئلة
- ✅ **Timer** مع تحذير عند الاقتراب من الوقت
- ✅ **مراجعة كاملة** للأسئلة بعد الانتهاء
- ✅ **تحليل الأداء** حسب Domain
- ✅ **شهادة PDF/SVG** للناجحين
- ✅ **سجل الاختبارات** في الداشبورد

### للأدمن:
- ✅ إضافة/تعديل/حذف الاختبارات
- ✅ رفع الأسئلة من CSV مع Drag & Drop
- ✅ استبدال الأسئلة الموجودة أو إضافة عليها
- ✅ إدارة المستخدمين
- ✅ إحصائيات شاملة
- ✅ عرض جميع النتائج

---

## 🔧 تخصيص

### تغيير اسم المنصة:
- `src/components/NavBar.jsx` — السطر 20: غيّر `ExamPro`
- `index.html` — السطر 7: غيّر العنوان

### إضافة فئات جديدة:
- `src/pages/Home.jsx` — مصفوفة `CATEGORIES`
- `src/pages/Admin.jsx` — مصفوفة `CATS`

---

## 🛡️ الأمان

- Firebase Auth للمصادقة
- Firestore Rules تمنع الوصول غير المصرح
- الأدمن فقط يستطيع كتابة الاختبارات والأسئلة
- الطالب يرى نتائجه فقط
- الأسئلة والاختبارات قراءة عامة (للعرض)
