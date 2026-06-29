import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Settings, CreditCard, Tag,
  Megaphone, Zap, LogOut, ChevronRight, Menu, X, Package
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/admin',               icon: LayoutDashboard, label: 'Дашборд' },
  { path: '/admin/users',         icon: Users,           label: 'Пользователи' },
  { path: '/admin/plans',         icon: Package,         label: 'Планы' },
  { path: '/admin/payments',      icon: CreditCard,      label: 'Оплата' },
  { path: '/admin/promo',         icon: Tag,             label: 'Промокоды' },
  { path: '/admin/announcements', icon: Megaphone,       label: 'Уведомления' },
  { path: '/admin/settings',      icon: Settings,        label: 'Настройки сайта' },
];

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = () => (
    <aside className="w-56 h-full bg-[#13131a] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-none">NexAI</p>
            <p className="text-white/30 text-[10px] mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group
                ${active
                  ? 'bg-brand-500/15 text-brand-500 font-medium'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5'}`}
            >
              <Icon size={16} />
              {label}
              {active && <ChevronRight size={12} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/5">
        <Link to="/chat" className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all text-sm mb-1">
          <Zap size={14} /> Перейти в чат
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-all text-sm"
        >
          <LogOut size={14} /> Выйти
        </button>
        <div className="mt-2 px-3">
          <p className="text-white/25 text-xs truncate">{user?.email}</p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#0f0f11] text-white overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 flex md:hidden transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <button onClick={() => setOpen(true)} className="text-white/50 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-medium text-sm">Admin</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
