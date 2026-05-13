<div align="center">

<img src="frontend/public/logo.svg" alt="RASAD AI" width="96" height="96" />

# RASAD AI · رصد الحقيقة بالذكاء الاصطناعي

**Real-time Arabic AI Fact-Checking Platform**

منصة عربية مفتوحة المصدر للتحقق الفوري من الأخبار والصور بفريق من ست وكلاء يعملون بالذكاء الاصطناعي.

[![Built with FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Built with React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Arabic RTL](https://img.shields.io/badge/Language-Arabic%20RTL-1657d4)](#)

</div>

---

## 🎯 ما هو RASAD؟

**رَصْد** (بالعربية: المراقبة والملاحظة) منصة ذكية تجيب على سؤال واحد بسرعة: **«هل هذا الخبر صحيح؟»**

أرسل أي ادعاء نصي أو رابط مقال أو صورة، وخلال أقل من 15 ثانية ستحصل على:

- ✅ **حكم واضح** — `صحيح / كاذب / مضلل / غير محسوم / مولّد بالذكاء الاصطناعي`
- 📊 **درجة ثقة** بنسبة مئوية
- 🔎 **أدلة حقيقية** من مصادر موثوقة مع روابط قابلة للنقر
- 🧠 **شرح بالعربية** يربط الحكم بالأدلة بوضوح
- 🤖 **مسار وكلاء شفّاف** يُظهر كيف وصل النظام إلى استنتاجه

> **لا يتطلب تسجيلاً، لا يتطلب اشتراكاً.** افتح المتصفح، الصق الادعاء، احصل على الإجابة.

---

## ✨ المزايا الفريدة

| الميزة | الوصف |
|---|---|
| 🇸🇦 **عربي أولاً** | واجهة RTL كاملة، خط Noto Kufi، تحليل لغوي مخصّص للعربية |
| 🧩 **6 وكلاء متخصصون** | بدل نموذج واحد عام، فريق من العملاء كل واحد يفعل شيئاً واحداً جيداً |
| 🌐 **بحث متعدد المحركات** | Tavily + Serper + DuckDuckGo + Wikipedia (تدرّج تلقائي) |
| 🛡️ **تقييم المصادر** | كل مصدر يأخذ درجة موثوقية ضمن قائمة معتمدة (WHO, BBC, Reuters, فتبيّنوا، مسبار…) |
| 🖼️ **كشف صور الذكاء الاصطناعي** | تحليل EXIF + Gemini Vision (اختياري) |
| 🎭 **وضع تجريبي بدون مفاتيح** | يعمل خارج الصندوق فوراً، حتى بدون أي API keys |
| ⚡ **كل شيء بزمن حقيقي** | متوسط الاستجابة 8–14 ثانية مع API key |

---

## 🚀 التشغيل السريع (3 دقائق)

### الخيار 1: Docker Compose (الأبسط)

```bash
git clone https://github.com/kurdim12/rassad-ai.git
cd rassad-ai
docker compose up
```

ثم افتح **http://localhost:8080**

### الخيار 2: محلياً (تطوير)

#### المتطلبات
- Python ≥ 3.11
- Node.js ≥ 20

#### الخطوات

```bash
# 1. الواجهة الخلفية
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # اختياري: أضف GEMINI_API_KEY هنا
uvicorn app.main:app --reload    # http://localhost:8000

# 2. الواجهة الأمامية (نافذة طرفية جديدة)
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

افتح **http://localhost:5173**.

> 💡 **لا تملك مفتاح API؟** لا بأس — تعمل المنصة في **وضع تجريبي** مع أمثلة جاهزة وبحث ويكيبيديا/DuckDuckGo المجاني.

---

## 🔑 الحصول على مفاتيح API (اختياري لكن موصى به)

| الخدمة | لماذا | الحصول عليها |
|---|---|---|
| **Gemini AI** | تحليل الادعاءات وإصدار الحكم | https://aistudio.google.com/app/apikey (طبقة مجانية سخية) |
| **Tavily** | بحث ويب مُحسَّن للذكاء الاصطناعي | https://app.tavily.com (1000 طلب/شهر مجاناً) |
| **Serper** | بديل لنتائج Google | https://serper.dev (2500 طلب مجاني) |

أضفها إلى `backend/.env`:

```env
GEMINI_API_KEY=AIza...
TAVILY_API_KEY=tvly-...
```

---

## 🧠 كيف يعمل النظام؟

```
المستخدم يدخل ادعاءً
        │
        ▼
┌──────────────────────────────────┐
│   1. ArabicNLPAgent              │  تحليل لغوي + توليد استعلامات بحث
│   التحليل اللغوي للادعاء          │
└──────────────────────────────────┘
        │ (يولّد 3 استعلامات بحث)
        ▼
┌──────────────────────────────────┐
│   2. EvidenceAgent               │  Tavily → Serper → DuckDuckGo → Wikipedia
│   بحث متعدد المحركات             │
└──────────────────────────────────┘
        │ (يجلب ~8 مصادر)
        ▼
┌──────────────────────────────────┐
│   3. CredibilityAgent            │  درجة موثوقية لكل مصدر
│   تقييم المصادر                  │  (من قائمة 25+ مصدر موثوق)
└──────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│   4. FakeNewsAgent               │  كشف العناوين المثيرة، اللغة العاطفية
│   مؤشرات التلاعب                  │  وتقنيات التضليل المعروفة
└──────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│   5. ClaimTracerAgent            │  محاولة تتبع أصل الادعاء وانتشاره
└──────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│   6. VerdictAgent                │  يدمج كل شيء ويُصدر الحكم النهائي
│   تركيب الحكم                     │  بالعربية + الإنجليزية + الأدلة المرجعية
└──────────────────────────────────┘
        │
        ▼
   عرض الحكم + الأدلة + مسار الوكلاء
```

كل وكيل عبارة عن استدعاء Gemini مُهَنْدَس مع `response_mime_type=application/json`، ما يجعل الإخراج موثوقاً وقابلاً للتركيب.

---

## 🛠️ التكنولوجيا المستخدمة

### الواجهة الخلفية
- **FastAPI** — إطار عمل سريع وعصري
- **Google Gemini 2.0 Flash** — النموذج اللغوي الرئيسي
- **Tavily / Serper / DuckDuckGo / Wikipedia** — مصادر بحث متعددة
- **Pillow + EXIF** — تحليل الصور
- **Tenacity** — إعادة المحاولة الذكية
- **Pydantic v2** — تحقق صارم من البيانات

### الواجهة الأمامية
- **React 18 + TypeScript** — مكوّنات صارمة
- **Vite 5** — تطوير سريع جداً
- **TailwindCSS** + خطوط Noto Kufi Arabic / Cairo
- **Framer Motion** — حركات سلسة
- **Lucide Icons** — أيقونات نظيفة
- **دعم RTL كامل** افتراضياً

### البنية التحتية
- **Docker + Docker Compose** — تشغيل بأمر واحد
- **Nginx** — استضافة الواجهة الأمامية وproxy للـ API

---

## 📡 مرجع API

> الخادم يعمل افتراضياً على `http://localhost:8000`. الوثائق التفاعلية: `/docs`.

### `GET /api/health`
فحص صحة الخدمة وحالة وضع التشغيل.

### `POST /api/check`
التحقق من ادعاء نصي أو رابط.

```bash
curl -X POST http://localhost:8000/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"فيتامين سي يعالج كورونا"}'
```

استجابة (مختصرة):
```json
{
  "verdict": "FALSE",
  "confidence": 0.92,
  "explanation_ar": "...",
  "sources": [{"title":"WHO Mythbusters","url":"...","credibility":0.95}],
  "agents": [{"agent":"VerdictAgent","duration_ms":1820}]
}
```

### `POST /api/check/image`
كشف الصور المولّدة بالذكاء الاصطناعي.

```bash
curl -X POST http://localhost:8000/api/check/image \
  -F "file=@image.jpg"
```

### `GET /api/agents`
قائمة بالوكلاء الستة وأدوارهم.

### `GET /api/trending`
أكثر الادعاءات تداولاً (للوحة العرض).

---

## 🗂️ هيكل المشروع

```
rassad-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # نقطة الدخول FastAPI
│   │   ├── config.py            # الإعدادات من البيئة
│   │   ├── models.py            # نماذج Pydantic
│   │   ├── image_check.py       # كشف الصور المولّدة
│   │   ├── agents/
│   │   │   ├── pipeline.py      # المُنسّق الرئيسي
│   │   │   ├── prompts.py       # موجّهات الوكلاء بالعربية
│   │   │   └── demo.py          # ردود تجريبية بدون مفاتيح
│   │   └── services/
│   │       ├── gemini.py        # عميل Gemini
│   │       ├── search.py        # محركات بحث متعددة
│   │       ├── scraper.py       # استخراج المقالات
│   │       └── cache.py         # تخزين مؤقت في الذاكرة
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/          # Header, Hero, ClaimChecker, ...
│   │   └── lib/                 # api.ts, verdict.ts
│   ├── package.json
│   └── Dockerfile
├── docs/
│   ├── PITCH_DECK.md            # عرض السبع شرائح
│   └── DEMO_SCRIPT.md           # سيناريو العرض الحي
├── docker-compose.yml
└── README.md
```

---

## 🎬 سيناريو العرض الحي

أنشأنا [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — سيناريو دقيق للجنة التحكيم، يضمن أن العرض يعمل دون أخطاء حتى لو كانت الإنترنت ضعيفة.

---

## 🌍 التأثير والإمكانات

- **في الأردن وحدها**، تُتداول آلاف الادعاءات يومياً عبر واتساب وتويتر وتيك توك.
- معظم منصات التحقق ناطقة بالإنجليزية أو تتطلب تسجيلاً مكلفاً.
- RASAD مفتوح المصدر، مجاني، وعربي — يضع التحقق من الحقائق في متناول كل شخص.

**التوسعات القادمة:**
- ✅ إضافة wrapper لواتساب (تحويل الرسائل إلى تحقق فوري)
- ✅ تكامل مع المتصفح (Chrome extension)
- ✅ مرصد RSS لـ 50+ قناة عربية
- ✅ نموذج محلي للجامعات بدون اتصال إنترنت
- ✅ API عام للصحفيين

---

## 👥 الفريق

- **Kurdi M.** — Lead Engineer & Product
- (أضف أعضاء الفريق هنا قبل العرض)

---

## 📜 الترخيص

MIT — استخدمه بحرية. راجع [`LICENSE`](LICENSE).

---

<div align="center">

**صُمم بشغف للحقيقة 🇯🇴**  
هاكاثون جامعة الزيتونة — مايو 2026

</div>
