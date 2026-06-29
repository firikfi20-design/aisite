import { useEffect, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Modal, Confirm, Table, Badge, SectionHeader, Field, Input, Select, toast } from '../../components/admin/AdminUI';
import { adminApi } from '../../utils/adminApi';

const emptyForm = { code:'', discount_type:'percent', discount_value:20, plan_slug:'', max_uses:100, expires_at:'' };

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AdminPromo() {
  const [codes, setCodes]   = useState([]);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(emptyForm);
  const [delId, setDelId]   = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.getPromoCodes().then(setCodes).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.code.trim()) { toast.error('Введите код'); return; }
    setSaving(true);
    try {
      await adminApi.createPromoCode({ ...form, expires_at: form.expires_at || null });
      toast.success('Промокод создан!');
      setModal(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (id) => {
    try { await adminApi.togglePromoCode(id); load(); }
    catch (e) { toast.error(e.message); }
  };

  const del = async () => {
    try { await adminApi.deletePromoCode(delId); toast.success('Удалено'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cols = [
    { key:'code',    label:'Код',      render: r => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-brand-500">{r.code}</span>
        <button onClick={() => { navigator.clipboard.writeText(r.code); toast.success('Скопировано!'); }}
          className="text-white/20 hover:text-white/50 transition-colors"><Copy size={12} /></button>
      </div>
    )},
    { key:'discount',label:'Скидка',   render: r => (
      <span className="text-white/70">
        {r.discount_type === 'percent' ? `${r.discount_value}%` :
         r.discount_type === 'fixed'   ? `$${r.discount_value}` :
         `${r.discount_value} дней`}
      </span>
    )},
    { key:'plan',    label:'Для плана',render: r => r.plan_slug ? <Badge type={r.plan_slug}>{r.plan_slug}</Badge> : <span className="text-white/30 text-xs">Любой</span> },
    { key:'uses',    label:'Использований', render: r => <span className="text-white/50 text-xs">{r.uses_count} / {r.max_uses}</span> },
    { key:'expires', label:'Истекает', render: r => r.expires_at
      ? <span className="text-white/40 text-xs">{new Date(r.expires_at).toLocaleDateString('ru')}</span>
      : <span className="text-white/20 text-xs">∞</span>
    },
    { key:'status',  label:'Статус',   render: r => <Badge type={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Активен' : 'Выключен'}</Badge> },
    { key:'actions', label:'',         render: r => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => toggle(r.id)} title={r.is_active ? 'Выключить' : 'Включить'}
          className="p-1.5 rounded-lg text-white/30 hover:text-brand-500 hover:bg-brand-500/10 transition-all">
          {r.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
        </button>
        <button onClick={() => setDelId(r.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <Trash2 size={13} />
        </button>
      </div>
    )},
  ];

  return (
    <AdminLayout>
      <SectionHeader
        title="Промокоды"
        subtitle="Скидки и специальные предложения"
        action={
          <button onClick={() => { setForm({ ...emptyForm, code: genCode() }); setModal(true); }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Создать код
          </button>
        }
      />

      <Table columns={cols} rows={codes} emptyText="Промокодов нет" />

      <Modal open={modal} onClose={() => setModal(false)} title="Новый промокод">
        <div className="space-y-4">
          <Field label="Код">
            <div className="flex gap-2">
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SUMMER20" className="flex-1 font-mono" />
              <button onClick={() => set('code', genCode())} className="btn-secondary text-sm px-3">Генерировать</button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Тип скидки">
              <Select value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
                <option value="percent">Процент (%)</option>
                <option value="fixed">Фиксированная ($)</option>
                <option value="free_days">Бесплатные дни</option>
              </Select>
            </Field>
            <Field label={form.discount_type === 'percent' ? 'Процент' : form.discount_type === 'fixed' ? 'Сумма ($)' : 'Дней'}>
              <Input type="number" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} min="1" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Только для плана">
              <Select value={form.plan_slug} onChange={e => set('plan_slug', e.target.value)}>
                <option value="">Любой план</option>
                <option value="pro">Pro</option>
                <option value="ultra">Ultra</option>
              </Select>
            </Field>
            <Field label="Макс. использований">
              <Input type="number" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} min="1" />
            </Field>
          </div>
          <Field label="Истекает (необязательно)">
            <Input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
          </Field>
          <div className="flex gap-3 pt-2 justify-end">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm px-4 py-2">Отмена</button>
            <button onClick={save} disabled={saving} className="btn-primary text-sm px-6 py-2 disabled:opacity-50">
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Удалить промокод?" message="Промокод будет удалён навсегда." danger />
    </AdminLayout>
  );
}
