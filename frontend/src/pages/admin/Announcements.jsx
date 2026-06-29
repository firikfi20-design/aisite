import { useEffect, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Modal, Confirm, Table, Badge, SectionHeader, Field, Input, Select, toast } from '../../components/admin/AdminUI';
import { adminApi } from '../../utils/adminApi';

const TYPES = [
  { value:'info',    label:'Информация', color:'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  { value:'success', label:'Успех',      color:'bg-green-500/10 border-green-500/20 text-green-400' },
  { value:'warning', label:'Внимание',   color:'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
  { value:'danger',  label:'Важно',      color:'bg-red-500/10 border-red-500/20 text-red-400' },
];

export default function AdminAnnouncements() {
  const [items, setItems]   = useState([]);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ title:'', message:'', type:'info' });
  const [delId, setDelId]   = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.getAnnouncements().then(setItems).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.message.trim()) { toast.error('Введите текст'); return; }
    setSaving(true);
    try {
      await adminApi.createAnnouncement(form);
      toast.success('Уведомление создано!');
      setModal(false);
      setForm({ title:'', message:'', type:'info' });
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (id) => {
    try { await adminApi.toggleAnnouncement(id); load(); }
    catch (e) { toast.error(e.message); }
  };

  const del = async () => {
    try { await adminApi.deleteAnnouncement(delId); toast.success('Удалено'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const preview = TYPES.find(t => t.value === form.type);

  const cols = [
    { key:'type',    label:'Тип',     render: r => <Badge type={r.type}>{TYPES.find(t=>t.value===r.type)?.label || r.type}</Badge> },
    { key:'title',   label:'Заголовок',render: r => <span className="font-medium text-white/90">{r.title || '—'}</span> },
    { key:'message', label:'Текст',   render: r => <span className="text-white/50 text-xs line-clamp-1">{r.message}</span> },
    { key:'status',  label:'Статус',  render: r => <Badge type={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Показывается' : 'Скрыто'}</Badge> },
    { key:'date',    label:'Создано', render: r => <span className="text-white/30 text-xs">{new Date(r.created_at).toLocaleDateString('ru')}</span> },
    { key:'actions', label:'',        render: r => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => toggle(r.id)} className="p-1.5 rounded-lg text-white/30 hover:text-brand-500 hover:bg-brand-500/10 transition-all">
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
        title="Уведомления / Баннеры"
        subtitle="Показываются пользователям в чате"
        action={
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Создать
          </button>
        }
      />

      <Table columns={cols} rows={items} emptyText="Нет уведомлений" />

      <Modal open={modal} onClose={() => setModal(false)} title="Новое уведомление">
        <div className="space-y-4">
          <Field label="Тип">
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Заголовок (необязательно)">
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Технические работы" />
          </Field>
          <Field label="Текст сообщения">
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={3}
              className="input-field text-sm resize-none"
              placeholder="Сегодня с 02:00 до 04:00 пройдут технические работы..."
            />
          </Field>
          {/* Preview */}
          {form.message && (
            <div className={`rounded-xl border p-3 text-sm ${preview?.color}`}>
              {form.title && <p className="font-medium mb-0.5">{form.title}</p>}
              <p>{form.message}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2 justify-end">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm px-4 py-2">Отмена</button>
            <button onClick={save} disabled={saving} className="btn-primary text-sm px-6 py-2 disabled:opacity-50">
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Удалить уведомление?" message="Оно перестанет показываться пользователям." danger />
    </AdminLayout>
  );
}
