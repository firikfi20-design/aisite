import { useEffect, useState } from 'react';
import { Users, DollarSign, MessageSquare, TrendingUp, Zap, Crown } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { StatCard, SectionHeader } from '../../components/admin/AdminUI';
import { adminApi } from '../../utils/adminApi';

function MiniChart({ data, color = '#4f6ef7', valueKey = 'count' }) {
  if (!data?.length) return <div className="h-16 flex items-center justify-center text-white/20 text-xs">Нет данных</div>;
  const max = Math.max(...data.map(d => parseFloat(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {data.map((d, i) => {
        const h = Math.max(4, ((parseFloat(d[valueKey]) || 0) / max) * 100);
        return (
          <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${h}%`, background: color, opacity: 0.7 }}
            title={`${d.date}: ${d[valueKey]}`} />
        );
      })}
    </div>
  );
}

function PlanBar({ plan, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  const colors = { free: 'bg-white/20', pro: 'bg-brand-500', ultra: 'bg-purple-500' };
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-xs w-10 capitalize">{plan}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colors[plan] || 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white/50 text-xs w-8 text-right">{count}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const { stats = {}, plan_distribution = [], daily_signups = [], daily_revenue = [] } = data || {};
  const totalUsers = stats.total_users || 0;

  return (
    <AdminLayout>
      <SectionHeader title="Дашборд" subtitle="Общая статистика платформы" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}        label="Пользователей"     value={stats.total_users?.toLocaleString() || 0}     sub={`+${stats.new_users_7d || 0} за неделю`} color="text-brand-500" />
        <StatCard icon={DollarSign}   label="Доход (30 дней)"   value={`$${(stats.revenue_30d || 0).toFixed(2)}`}    sub="Все платежи"         color="text-green-400" />
        <StatCard icon={MessageSquare}label="Всего чатов"        value={stats.total_chats?.toLocaleString() || 0}     sub={`${stats.total_messages?.toLocaleString() || 0} сообщений`} color="text-purple-400" />
        <StatCard icon={TrendingUp}   label="Новых (7 дней)"    value={stats.new_users_7d || 0}                      sub="Регистраций"         color="text-yellow-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Signups chart */}
        <div className="card lg:col-span-2">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-4">Регистрации (14 дней)</p>
          <MiniChart data={daily_signups} color="#4f6ef7" valueKey="count" />
          <div className="flex justify-between mt-2">
            <span className="text-white/25 text-xs">{daily_signups[0]?.date?.slice(5) || ''}</span>
            <span className="text-white/25 text-xs">{daily_signups.at(-1)?.date?.slice(5) || ''}</span>
          </div>
        </div>

        {/* Plan distribution */}
        <div className="card">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-4">Распределение планов</p>
          <div className="space-y-3">
            {plan_distribution.map(({ plan, count }) => (
              <PlanBar key={plan} plan={plan} count={parseInt(count)} total={totalUsers} />
            ))}
            {!plan_distribution.length && <p className="text-white/20 text-sm">Нет данных</p>}
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="card">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-4">Доход (14 дней)</p>
        <MiniChart data={daily_revenue} color="#22c55e" valueKey="amount" />
        <div className="flex justify-between mt-2">
          <span className="text-white/25 text-xs">{daily_revenue[0]?.date?.slice(5) || ''}</span>
          <span className="text-white/25 text-xs">{daily_revenue.at(-1)?.date?.slice(5) || ''}</span>
        </div>
      </div>
    </AdminLayout>
  );
}
