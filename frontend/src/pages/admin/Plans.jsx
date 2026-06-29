import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Modal, Confirm, Table, Badge, SectionHeader, Field, Input, Toggle, toast } from '../../components/admin/AdminUI';
import { adminApi } from '../../utils/adminApi';

const empty = { slug:'', name:'', price_usd:0, price_stars:0, requests_per_day:20, features:[], is_active:true, is_featured:false };

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm]   = useState(empty);
  const [featuresText, setFeaturesText] = useState('');
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.getPlans().then(setPlans).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setFeaturesText(''); setModal('create'); };
  const openEdit   = (p) => {
    setForm(p);
    setFeaturesText(Array.isArray(p.features) ? p.features.join('\n') : '');
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    try {
      const features = featuresText.split('\n').map(s => s.trim()).filter(Boolean);
      const payload  = { ...form, features };
      if (modal === 'create') await adminApi.createPlan(payload);
      else                    await adminApi.updatePlan(form.id, payload);
      toast.success('Сохранено!');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    try { await adminApi.deletePlan(delId); toast.success('Удалено'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cols = [
    { key:'name',  label:'Название', render: r => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-white">{r.name}</span>
        {r.is_featured && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
      </div>
    )},
    { key:'price', label:'Цена',      render: r => <span className="text-white/70">${r.price_usd} / {r.price_stars}⭐</span> },
    { key:'reqs',  label:'Запросов/день', render: r => <span className="text-white/60">{r.requests_per_day >= 99999 ? '∞' : r.requests_per_day}</span> },
    { key:'feats', label:'Фичи',      render: r => <span className="text-white/40 text-xs">{(r.features || []).length} пунктов</span> },
    { key:'status',label:'Статус',    render: r => <Badge type={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Активен' : 'Скрыт'}</Badge> },
    { key:'actions',label:'',         render: r => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-white/30 hover:text-brand-500 hover:bg-brand-500/10 transition-all"><Pencil size={13} /></button>
        <button onClick={() => setDelId(r.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13} /></button>
      </div>
    )},
  ];

  return (
    <AdminLayout>
      <SectionHeader
        title="Планы подписки"
        subtitle="Управляй ценами и лимитами"
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Новый план
          </button>
        }
      />

      <Table columns={cols} rows={plans} emptyText="Нет планов" />

      {/* Create/Edit modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Новый план' : 'Редактировать план'} width="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug (уникальный ID)">
              <Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="pro" disabled={modal === 'edit'} />
            </Field>
            <Field label="Название">
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Pro" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Цена ($)">
              <Input type="number" value={form.price_usd} onChange={e => set('price_usd', e.target.value)} min="0" />
            </Field>
            <Field label="Telegram Stars">
              <Input type="number" value={form.price_stars} onChange={e => set('price_stars', e.target.value)} min="0" />
            </Field>
            <Field label="Запросов/день">
              <Input type="number" value={form.requests_per_day} onChange={e => set('requests_per_day', e.target.value)} min="1" />
            </Field>
          </div>
          <Field label="Фичи (каждая с новой строки)" hint="Каждая строка — один пункт в списке">
            <textarea
              value={featuresText}
              onChange={e => setFeaturesText(e.target.value)}
              rows={5}
              className="input-field text-sm resize-none font-mono"
              placeholder={"История чатов\nПриоритет\nAPI доступ"}
            />
          </Field>
          <div className="flex gap-6">
            <Toggle checked={form.is_active}   onChange={v => set('is_active', v)}   label="Активен (виден пользователям)" />
            <Toggle checked={form.is_featured} onChange={v => set('is_featured', v)} label="Отмечен как популярный" />
          </div>
          <div className="flex gap-3 pt-2 justify-end">
            <button onClick={() => setModal(null)} className="btn-secondary text-sm px-4 py-2">Отмена</button>
            <button onClick={save} disabled={saving} className="btn-primary text-sm px-6 py-2 disabled:opacity-50">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Удалить план?" message="Пользователи с этим планом останутся, но план больше не будет продаваться." danger />
    </AdminLayout>
  );
}
