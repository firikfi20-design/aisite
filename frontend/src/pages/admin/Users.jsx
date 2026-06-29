import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Trash2, Shield, Crown } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Table, Badge, Confirm, Modal, Select, SectionHeader, Pagination, toast, Field } from '../../components/admin/AdminUI';
import { adminApi } from '../../utils/adminApi';

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type, userId, extra }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.users({ page, limit: 20, search, plan: planFilter });
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter]);

  useEffect(() => { load(); }, [load]);

  // Search with debounce
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const doConfirm = async () => {
    try {
      if (confirm.type === 'delete')         await adminApi.deleteUser(confirm.userId);
      if (confirm.type === 'reset')          await adminApi.resetRequests(confirm.userId);
      if (confirm.type === 'plan')           await adminApi.setUserPlan(confirm.userId, confirm.extra);
      if (confirm.type === 'role')           await adminApi.setUserRole(confirm.userId, confirm.extra);
      toast.success('Готово!');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const cols = [
    { key: 'email',   label: 'Email', render: r => <span className="font-medium text-white/90">{r.email}</span> },
    { key: 'plan',    label: 'План',  render: r => <Badge type={r.plan}>{r.plan}</Badge> },
    { key: 'role',    label: 'Роль',  render: r => <Badge type={r.role}>{r.role}</Badge> },
    { key: 'usage',   label: 'Запросы', render: r => <span className="text-white/50 text-xs">{r.requests_used}</span> },
    { key: 'created', label: 'Дата',  render: r => <span className="text-white/40 text-xs">{new Date(r.created_at).toLocaleDateString('ru')}</span> },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex items-center gap-2 justify-end">
          {/* Change plan */}
          <select
            value={r.plan}
            onChange={e => setConfirm({ type: 'plan', userId: r.id, extra: e.target.value })}
            className="bg-white/5 border border-white/10 text-white/70 text-xs px-2 py-1 rounded-lg cursor-pointer"
          >
            {['free','pro','ultra'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {/* Reset requests */}
          <button
            title="Сбросить лимит"
            onClick={() => setConfirm({ type: 'reset', userId: r.id })}
            className="p-1.5 rounded-lg text-white/30 hover:text-brand-500 hover:bg-brand-500/10 transition-all"
          >
            <RefreshCw size={13} />
          </button>
          {/* Toggle admin */}
          <button
            title={r.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
            onClick={() => setConfirm({ type: 'role', userId: r.id, extra: r.role === 'admin' ? 'user' : 'admin' })}
            className={`p-1.5 rounded-lg transition-all ${r.role === 'admin' ? 'text-red-400 hover:bg-red-500/10' : 'text-white/30 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
          >
            <Shield size={13} />
          </button>
          {/* Delete */}
          <button
            title="Удалить"
            onClick={() => setConfirm({ type: 'delete', userId: r.id })}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  const confirmMessages = {
    delete: 'Удалить пользователя? Все его данные и чаты будут удалены.',
    reset:  'Сбросить счётчик запросов этого пользователя?',
    plan:   `Изменить план на "${confirm?.extra}"?`,
    role:   `Изменить роль на "${confirm?.extra}"?`,
  };

  return (
    <AdminLayout>
      <SectionHeader
        title="Пользователи"
        subtitle={`Всего: ${total}`}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Поиск по email..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          className="input-field text-sm w-40 bg-[#0f0f11]"
        >
          <option value="">Все планы</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="ultra">Ultra</option>
        </select>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm px-4">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Обновить
        </button>
      </div>

      <Table columns={cols} rows={users} emptyText="Пользователи не найдены" />
      <Pagination page={page} total={total} limit={20} onChange={setPage} />

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doConfirm}
        title="Подтверждение"
        message={confirmMessages[confirm?.type] || ''}
        danger={confirm?.type === 'delete'}
      />
    </AdminLayout>
  );
}
