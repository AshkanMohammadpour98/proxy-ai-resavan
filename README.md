# OpenRouter Vercel Proxy

یک Reverse Proxy سبک برای [OpenRouter API](https://openrouter.ai) که روی **Vercel Edge Runtime** اجرا می‌شود.
بدون هیچ وابستگی (dependency) و با پشتیبانی کامل از CORS و Streaming.

## ساختار پروژه

```
.
├── api/
│   └── proxy.js      # تابع Edge و منطق پروکسی
├── index.html        # صفحه وضعیت (اختیاری)
├── vercel.json       # قوانین Rewrite
├── package.json
├── .gitignore
└── README.md
```

## نصب و راه‌اندازی

1. این پوشه را در یک ریپازیتوری گیت‌هاب آپلود کنید.
2. وارد [vercel.com](https://vercel.com) شوید → **Add New → Project**.
3. ریپازیتوری را Import کنید و تنظیمات را این‌طور بگذارید:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./`
   - **Build Command / Output Directory / Install Command:** خالی بگذارید
   - سپس **Deploy**
4. بعد از دیپلوی، آدرسی مثل `https://your-project.vercel.app` دریافت می‌کنید.

## نحوه استفاده

آدرس پایه (Base URL) را به‌جای `https://openrouter.ai/api/v1` این بگذارید:

```
https://your-project.vercel.app/api/proxy
```

مثال با curl:

```bash
curl https://your-project.vercel.app/api/proxy/chat/completions \
  -H "Authorization: Bearer sk-or-v1-XXXXXXXX" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "سلام!"}]
  }'
```

مثال با OpenAI SDK (پایتون):

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://your-project.vercel.app/api/proxy",
    api_key="sk-or-v1-XXXXXXXX",
)
```

دریافت لیست مدل‌ها:

```bash
curl https://your-project.vercel.app/api/proxy/models
```

## ویژگی‌ها

- متدهای `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- هدرهای کامل CORS (شامل پاسخ به Preflight)
- انتقال همه هدرها از جمله `Authorization: Bearer ...` و body
- پشتیبانی از پاسخ‌های Stream (`"stream": true`)

## نکات امنیتی

- کلید API در پروژه ذخیره نمی‌شود؛ هر کاربر کلید خودش را در هدر `Authorization` می‌فرستد.
- چون CORS روی `*` تنظیم شده، هر وب‌سایتی می‌تواند از پروکسی شما استفاده کند. اگر می‌خواهید محدود شود، مقدار `Access-Control-Allow-Origin` را در `api/proxy.js` به دامنه خودتان تغییر دهید.
