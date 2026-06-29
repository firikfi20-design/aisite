import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Modal, Confirm, Table, Badge, SectionHeader, Field, Input, Select, Toggle, toast } from '../../components/admin/AdminUI';
import { adminApi } from '../../utils/adminApi';

const TYPES = [
  { value: 'telegram_stars', label: 'Telegram Stars' },
  { value: 'crypto',         label: 'Криптовалюта' },
  { value: 'card',           label: 'Банковская карта' },
  { value: 'manual',         label: 'Ручная оплата' },
];

const emptyForm = { slug:'', name:'', type:'crypto', icon:'💳', config:{}, is_active:true, sort_order:99 };

export default function AdminPayments() {
  const [methods, setMethods] = useState([]);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(emptyForm);
  const [configText, setConfigText] = useState('{}');
  const [delId, setDelId]     = useState(null);
  const [saving, setSaving]   = useState(false);

  const load = () => adminApi.getPaymentMethods().then(setMethods).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setConfigText('{}'); setModal('create'); };
  const openEdit   = (m) => {
    setForm(m);
    setConfigText(JSON.stringify(m.config || {}, null, 2));
    setModal('edit');
  };

  const save = async () => {
    setSaving(true);
    try {
      let config = {};
      try { config = JSON.parse(configText); } catch { toast.error('Неверный JSON в конфигурации'); setSaving(false); return; }
      const payload = { ...form, config };
      if (modal === 'create') await adminApi.createPaymentMethod(payload);
      else                    await adminApi.updatePaymentMethod(form.id, payload);
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
    try { await adminApi.deletePaymentMethod(delId); toast.success('Удалено'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Config hints by type
  const configHints = {
    telegram_stars: '{ "bot_token": "..." }',
    crypto: '{ "wallet_address": "...", "currency": "USDT" }',
    card: '{ "stripe_key": "..." }',
    manual: '{ "instructions": "Напишите нам в Telegram @..." }',
  };

  const cols = [
    { key:'icon',   label:'',       render: r => <span className="text-xl">{r.icon}</span> },
    { key:'name',   label:'Название',render: r => <span className="font-medium text-white">{r.name}</span> },
    { key:'type',   label:'Тип',    render: r => <span className="text-white/50 text-xs capitalize">{r.type}</span> },
    { key:'status', label:'Статус', render: r => <Badge type={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Активен' : 'Выключен'}</Badge> },
    { key:'actions',label:'',       render: r => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-white/30 hover:text-brand-500 hover:bg-brand-500/10 transition-all"><Pencil size={13} /></button>
        <button onClick={() => setDelId(r.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13} /></button>
      </div>
    )},
  ];

  return (
    <AdminLayout>
      <SectionHeader
        title="Способы оплаты"
        subtitle="Управляй методами приёма платежей"
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Добавить метод
          </button>
        }
      />

      <Table columns={cols} rows={methods} emptyText="Нет методов оплаты" />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Новый метод оплаты' : 'Редактировать метод'} width="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug">
              <Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="usdt_trc20" disabled={modal === 'edit'} />
            </Field>
            <Field label="Название">
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="USDT TRC-20" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Тип">
              <Select value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Иконка (эмодзи)">
              <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="💳" />
            </Field>
          </div>
          <Field label="Конфигурация (JSON)" hint={`Пример: ${configHints[form.type] || '{}'}`}>
            <textarea
              value={configText}
              onChange={e => setConfigText(e.target.value)}
              rows={5}
              className="input-field text-xs font-mono resize-none"
              placeholder="{}"
            />
          </Field>
          <div className="flex items-center gap-6">
            <Toggle checked={form.is_active} onChange={v => set('is_active', v)} label="Активен" />
            <Field label="Порядок сортировки">
              <Input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} className="w-20" />
            </Field>
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
        title="Удалить метод оплаты?" message="Метод будет удалён. Существующие подписки останутся." danger />
    </AdminLayout>
  );
}
