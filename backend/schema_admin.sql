-- ============================================
-- ДОБАВЬ ЭТО К СУЩЕСТВУЮЩЕЙ schema.sql
-- ============================================

-- Роль администратора
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'; -- user | admin

-- Настройки сайта (ключ-значение)
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  label VARCHAR(200),           -- человекочитаемое название
  category VARCHAR(50),         -- general | appearance | ai | limits
  type VARCHAR(20) DEFAULT 'text', -- text | number | color | boolean | image
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Планы подписки (управляются через админку)
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(30) UNIQUE NOT NULL,   -- free | pro | ultra | custom
  name VARCHAR(100) NOT NULL,
  price_usd DECIMAL(10,2) DEFAULT 0,
  price_stars INT DEFAULT 0,
  requests_per_day INT DEFAULT 20,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Способы оплаты (управляются через админку)
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL,          -- telegram_stars | crypto | card | manual
  icon VARCHAR(50),
  config JSONB DEFAULT '{}',          -- api keys, wallet addresses etc
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- Промокоды
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'percent', -- percent | fixed | free_days
  discount_value DECIMAL(10,2),
  plan_slug VARCHAR(30),              -- null = any plan
  max_uses INT DEFAULT 100,
  uses_count INT DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Уведомления / баннеры для пользователей
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(20) DEFAULT 'info',   -- info | warning | success | danger
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ============================================

-- Дефолтные настройки сайта
INSERT INTO site_settings (key, value, label, category, type) VALUES
  ('site_name',        'NexAI',                        'Название сайта',       'general',    'text'),
  ('site_description', 'Умный ИИ помощник',            'Описание',             'general',    'text'),
  ('site_logo_url',    '',                             'URL логотипа',         'appearance', 'image'),
  ('site_favicon_url', '',                             'URL favicon',          'appearance', 'image'),
  ('primary_color',    '#4f6ef7',                      'Основной цвет',        'appearance', 'color'),
  ('hero_title',       'ИИ помощник для любых задач',  'Заголовок главной',    'appearance', 'text'),
  ('hero_subtitle',    'Чат, кодинг, вопросы — всё в одном месте', 'Подзаголовок главной', 'appearance', 'text'),
  ('ai_model_free',    'auto',                         'Модель для Free',      'ai',         'text'),
  ('ai_model_pro',     'gemini',                       'Модель для Pro',       'ai',         'text'),
  ('ai_model_ultra',   'gemini',                       'Модель для Ultra',     'ai',         'text'),
  ('registration_open','true',                         'Открыта регистрация',  'general',    'boolean'),
  ('maintenance_mode', 'false',                        'Режим техобслуживания','general',    'boolean'),
  ('support_email',    'support@nexai.com',            'Email поддержки',      'general',    'text'),
  ('telegram_channel', '',                             'Telegram канал',       'general',    'text')
ON CONFLICT (key) DO NOTHING;

-- Дефолтные планы
INSERT INTO plans (slug, name, price_usd, price_stars, requests_per_day, features, is_featured, sort_order) VALUES
  ('free',  'Free',  0,  0,    20,   '["ИИ чат","Кодинг","Q&A","Без карты"]',         false, 0),
  ('pro',   'Pro',   9,  500,  500,  '["Всё из Free","История чатов","Быстрые ответы","Приоритет"]', true, 1),
  ('ultra', 'Ultra', 29, 1500, 99999,'["Всё из Pro","Лучшие модели","API доступ","VIP поддержка"]',  false, 2)
ON CONFLICT (slug) DO NOTHING;

-- Дефолтные способы оплаты
INSERT INTO payment_methods (slug, name, type, icon, is_active, sort_order) VALUES
  ('telegram_stars', 'Telegram Stars', 'telegram_stars', '⭐', true, 0),
  ('usdt_trc20',     'USDT (TRC-20)',  'crypto',         '💵', true, 1),
  ('eth',            'Ethereum',       'crypto',         '⟠',  true, 2),
  ('btc',            'Bitcoin',        'crypto',         '₿',  true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Сделать первого пользователя (id=1) администратором
-- UPDATE users SET role = 'admin' WHERE id = 1;
