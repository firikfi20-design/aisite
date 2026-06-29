import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg text-white">NexAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-white/40 mt-1 text-sm">{subtitle}</p>
        </div>
        <div className="card">
          {children}
        </div>
        <p className="text-center text-white/40 text-sm mt-6">{footer}</p>
      </div>
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Добро пожаловать"
      subtitle="Войдите в свой аккаунт"
      footer={<>Нет аккаунта? <Link to="/register" className="text-brand-500 hover:underline">Зарегистрироваться</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}
        <div>
          <label className="text-white/60 text-sm block mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="input-field" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="text-white/60 text-sm block mb-1.5">Пароль</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field pr-11" placeholder="••••••••" required />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true);
    try {
      await register(email, password);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Начните бесплатно — без карты"
      footer={<>Уже есть аккаунт? <Link to="/login" className="text-brand-500 hover:underline">Войти</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}
        <div>
          <label className="text-white/60 text-sm block mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="input-field" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="text-white/60 text-sm block mb-1.5">Пароль</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field pr-11" placeholder="Минимум 6 символов" required minLength={6} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
          {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
        </button>
        <p className="text-white/30 text-xs text-center">
          Регистрируясь, вы соглашаетесь с условиями использования
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
