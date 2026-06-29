import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Star, Bitcoin, Check, ArrowLeft, Crown, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price_usd: 9,
    stars: 500,
    period: 'месяц',
    color: 'from-brand-500 to-blue-600',
    highlight: true,
    features: ['500 запросов / день', 'История чатов', 'Быстрые ответы', 'Все инструменты', 'Поддержка'],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price_usd: 29,
    stars: 1500,
    period: 'месяц',
    color: 'from-purple-500 to-pink-500',
    highlight: false,
    features: ['Безлимит запросов', 'Лучшие ИИ модели', 'API доступ', 'Приоритетная поддержка', 'Ранний доступ к функциям'],
  },
];

const CRYPTO_CURRENCIES = [
  { id: 'usdttrc20', label: 'USDT (TRC-20)', icon: '💵' },
  { id: 'usdterc20', label: 'USDT (ERC-20)', icon: '💵' },
  { id: 'eth', label: 'Ethereum (ETH)', icon: '⟠' },
  { id: 'btc', label: 'Bitcoin (BTC)', icon: '₿' },
];

export default function Upgrade() {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [payMethod, setPayMethod] = useState('telegram');
  const [cryptoCurrency, setCryptoCurrency] = useState('usdttrc20');
  const [loading, setLoading] = useState(false);
  const [cryptoPayment, setCryptoPayment] = useState(null);
  const [error, setError] = useState('');

  const plan = PLANS.find(p => p.id === selectedPlan);

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    setCryptoPayment(null);

    try {
      if (payMethod === 'telegram') {
        const res = await fetch('/api/payment/telegram/create', {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: selectedPlan })
        });
        const data = await res.json();
        if (data.invoice_url) {
          window.open(data.invoice_url, '_blank');
        } else {
          setError('Не удалось создать счёт. Проверьте настройки Telegram бота.');
        }
      } else {
        const res = await fetch('/api/payment/crypto/create', {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: selectedPlan, currency: cryptoCurrency })
        });
        const data = await res.json();
        if (data.pay_address) {
          setCryptoPayment(data);
        } else {
          setError('Не удалось создать крипто-платёж.');
        }
      }
    } catch {
      setError('Ошибка сети. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/chat" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Crown size={22} className="text-brand-500" /> Upgrade
            </h1>
            <p className="text-white/40 text-sm">Больше запросов, больше возможностей</p>
          </div>
        </div>

        {user?.plan !== 'free' && (
          <div className="card bg-brand-500/10 border-brand-500/20 mb-6 flex items-center gap-3">
            <Crown size={18} className="text-brand-500" />
            <p className="text-sm">У вас активен план <span className="text-brand-500 font-medium capitalize">{user.plan}</span></p>
          </div>
        )}

        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`card text-left transition-all ${
                selectedPlan === p.id
                  ? 'border-brand-500/50 bg-brand-500/8'
                  : 'hover:bg-white/8 hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold">${p.price_usd}</span>
                    <span className="text-white/30 text-sm">/ {p.period}</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedPlan === p.id ? 'border-brand-500 bg-brand-500' : 'border-white/20'
                }`}>
                  {selectedPlan === p.id && <Check size={11} />}
                </div>
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                    <Check size={11} className="text-brand-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Payment method */}
        <div className="card mb-6">
          <h2 className="font-medium mb-4">Способ оплаты</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setPayMethod('telegram')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                payMethod === 'telegram'
                  ? 'border-brand-500/50 bg-brand-500/8'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <Star size={18} className="text-yellow-400" />
              <div className="text-left">
                <p className="text-sm font-medium">Telegram Stars</p>
                <p className="text-xs text-white/40">{plan.stars} ⭐</p>
              </div>
            </button>
            <button
              onClick={() => setPayMethod('crypto')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                payMethod === 'crypto'
                  ? 'border-brand-500/50 bg-brand-500/8'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <Bitcoin size={18} className="text-orange-400" />
              <div className="text-left">
                <p className="text-sm font-medium">Криптовалюта</p>
                <p className="text-xs text-white/40">USDT / ETH / BTC</p>
              </div>
            </button>
          </div>

          {payMethod === 'telegram' && (
            <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4 text-sm text-white/60">
              <p>Вы перейдёте в Telegram и оплатите <span className="text-yellow-400 font-medium">{plan.stars} Stars</span>.</p>
              <p className="mt-1 text-xs">После оплаты план активируется автоматически.</p>
            </div>
          )}

          {payMethod === 'crypto' && !cryptoPayment && (
            <div>
              <p className="text-sm text-white/50 mb-3">Выберите валюту:</p>
              <div className="grid grid-cols-2 gap-2">
                {CRYPTO_CURRENCIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCryptoCurrency(c.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${
                      cryptoCurrency === c.id
                        ? 'border-brand-500/50 bg-brand-500/8 text-white'
                        : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                    }`}
                  >
                    <span>{c.icon}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Crypto payment address */}
          {cryptoPayment && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-green-400">✅ Платёж создан</p>
              <div>
                <p className="text-xs text-white/40 mb-1">Отправьте ровно:</p>
                <p className="font-mono text-lg font-medium">{cryptoPayment.pay_amount} {cryptoPayment.pay_currency?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">На адрес:</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-white/80 break-all flex-1">{cryptoPayment.pay_address}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(cryptoPayment.pay_address)}
                    className="text-white/40 hover:text-white flex-shrink-0"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/30">После подтверждения в сети план активируется автоматически (обычно 5-15 минут).</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {!cryptoPayment && (
          <button
            onClick={handlePayment}
            disabled={loading}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader size={18} className="animate-spin" /> Обработка...</>
            ) : (
              <><Crown size={18} /> Оплатить {plan.name} — ${plan.price_usd}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
