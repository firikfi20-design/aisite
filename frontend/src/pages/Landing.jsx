import { Link } from 'react-router-dom';
import { Zap, Code2, MessageSquare, HelpCircle, Star, ArrowRight, Check } from 'lucide-react';

const features = [
  { icon: MessageSquare, title: 'ИИ Чат', desc: 'Диалог с историей, стриминг ответов в реальном времени' },
  { icon: Code2, title: 'Кодинг', desc: 'Генерация, объяснение и рефакторинг кода' },
  { icon: HelpCircle, title: 'Вопросы и ответы', desc: 'Точные ответы на любые вопросы' },
  { icon: Zap, title: 'Быстро', desc: 'Ответы за секунды на базе Gemini и Groq' },
];

const plans = [
  { name: 'Free', price: '$0', period: 'навсегда', requests: '20 запросов / день', features: ['ИИ чат', 'Кодинг', 'Q&A', 'Без карты'], highlight: false },
  { name: 'Pro', price: '$9', period: '/ месяц', requests: '500 запросов / день', features: ['Всё из Free', 'История чатов', 'Быстрые ответы', 'Telegram Stars'], highlight: true },
  { name: 'Ultra', price: '$29', period: '/ месяц', requests: 'Безлимит', features: ['Всё из Pro', 'Лучшие модели', 'API доступ', 'Crypto оплата'], highlight: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-semibold text-lg">NexAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Войти</Link>
          <Link to="/register" className="btn-primary text-sm">Начать бесплатно</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-brand-500 text-sm mb-8">
          <Zap size={14} />
          Gemini Flash + Groq — бесплатно
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          ИИ помощник для{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-500">
            любых задач
          </span>
        </h1>
        <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
          Чат, кодинг, вопросы и ответы — всё в одном месте. Начни бесплатно, без карты.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
            Начать бесплатно <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary flex items-center gap-2 text-base px-6 py-3">
            Войти в аккаунт
          </Link>
        </div>
        <p className="text-white/30 text-sm mt-4">20 запросов каждый день — бесплатно</p>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:bg-white/8 transition-colors">
              <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-brand-500" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Простые цены</h2>
        <p className="text-white/50 text-center mb-10">Оплата через Telegram Stars или криптовалюту</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`card relative ${plan.highlight ? 'border-brand-500/50 bg-brand-500/5' : ''}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Популярный
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <p className="text-brand-500 text-sm mt-1">{plan.requests}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check size={14} className="text-brand-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-all ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.name === 'Free' ? 'Начать бесплатно' : `Выбрать ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-white/30 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={14} className="text-brand-500" />
          <span className="text-white/50 font-medium">NexAI</span>
        </div>
        <p>© 2025 NexAI. Все права защищены.</p>
      </footer>
    </div>
  );
}
