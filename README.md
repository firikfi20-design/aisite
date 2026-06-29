# NexAI — ИИ SaaS платформа

## Стек
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + PostgreSQL
- **ИИ**: Google Gemini Flash (бесплатно) + Groq (бесплатно)
- **Оплата**: Telegram Stars + Криптовалюта (NOWPayments)

---

## Быстрый старт

### 1. База данных (PostgreSQL)
```bash
# Установи PostgreSQL если нет
# Создай базу данных:
createdb aisite

# Примени схему:
psql aisite < backend/schema.sql
```

### 2. Backend
```bash
cd backend
npm install

# Скопируй и заполни переменные:
cp .env.example .env
nano .env

npm run dev
# → Server on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# → App on http://localhost:5173
```

---

## Получение API ключей (все бесплатно)

### Gemini Flash API
1. Перейди на https://aistudio.google.com/app/apikey
2. Нажми "Create API key"
3. Вставь в `.env` как `GEMINI_API_KEY=...`

### Groq API
1. Перейди на https://console.groq.com/keys
2. Создай API key
3. Вставь в `.env` как `GROQ_API_KEY=...`

### Telegram Bot + Stars (оплата)
1. Создай бота через @BotFather в Telegram
2. Получи токен → `TELEGRAM_BOT_TOKEN=...`
3. Включи платежи: `/mybots` → выбери бота → Payments → Stars
4. Настрой вебхук:
```bash
curl -F "url=https://YOUR_DOMAIN/api/payment/telegram/webhook" \
  https://api.telegram.org/botYOUR_TOKEN/setWebhook
```

### NOWPayments (крипто)
1. Зарегистрируйся на https://nowpayments.io
2. Создай API ключ → `NOWPAYMENTS_API_KEY=...`
3. Укажи `BACKEND_URL=https://your-domain.com`

---

## Деплой (Бесплатно)

### Backend → Railway / Render
- Задеплой папку `backend/`
- Добавь переменные окружения из `.env`
- Railway даёт бесплатный PostgreSQL

### Frontend → Vercel / Netlify
```bash
cd frontend
npm run build
# Задеплой папку dist/
```

### Обновить URL в frontend
В `vite.config.js` поменяй proxy target на URL своего backend.

---

## Структура проекта
```
aisite/
├── backend/
│   ├── server.js          # Точка входа
│   ├── schema.sql         # База данных
│   ├── .env.example       # Переменные окружения
│   ├── models/
│   │   └── db.js          # PostgreSQL подключение
│   ├── middleware/
│   │   └── auth.js        # JWT + лимиты запросов
│   └── routes/
│       ├── auth.js        # Регистрация / логин
│       ├── chat.js        # ИИ чат (Gemini + Groq)
│       ├── payment.js     # Telegram Stars + Crypto
│       └── user.js        # Профиль пользователя
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx   # Главная страница
        │   ├── Login.jsx     # Вход / Регистрация
        │   ├── Chat.jsx      # Основной чат
        │   └── Upgrade.jsx   # Страница оплаты
        └── context/
            └── AuthContext.jsx  # Глобальное состояние
```

---

## Лимиты запросов
| План  | Запросов / день |
|-------|----------------|
| Free  | 20             |
| Pro   | 500            |
| Ultra | Безлимит       |

Счётчик сбрасывается каждые 24 часа автоматически.
