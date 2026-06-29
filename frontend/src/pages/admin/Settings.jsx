import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { SectionHeader, Field, Input, Toggle, toast } from '../../components/admin/AdminUI';
import { adminApi } from '../../utils/adminApi';

const CATEGORY_LABELS = {
  general:    '🌐 Общие',
  appearance: '🎨 Внешний вид',
  ai:         '🤖 ИИ модели',
  limits:     '⚡ Лимиты',
};

export default function AdminSettings() {
  const [settings, setSettings] = useState({});  // { category: [rows] }
  const [values, setValues]     = useState({});   // { key: value }
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [changed, setChanged]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSettings();
      setSettings(data);
      // Flatten to key-value map
      const flat = {};
      Object.values(data).forEach(rows => rows.forEach(r => { flat[r.key] = r.value; }));
      setValues(flat);
      setChanged(false);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (key, val) => {
    setValues(v => ({ ...v, [key]: val }));
    setChanged(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.saveSettings(values);
      toast.success('Настройки сохранены!');
      setChanged(false);
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const renderInput = (row) => {
    const val = values[row.key] ?? row.value ?? '';
    if (row.type === 'boolean') {
      return <Toggle checked={val === 'true' || val === true} onChange={v => set(row.key, String(v))} />;
    }
    if (row.type === 'color') {
      return (
        <div className="flex items-center gap-3">
          <input type="color" value={val || '#4f6ef7'} onChange={e => set(row.key, e.target.value)}
            className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
          <Input value={val} onChange={e => set(row.key, e.target.value)} placeholder="#4f6ef7" />
        </div>
      );
    }
    if (row.type === 'image') {
      return (
        <div className="space-y-2">
          <Input value={val} onChange={e => set(row.key, e.target.value)} placeholder="https://..." />
          {val && <img src={val} alt="" className="h-10 object-contain rounded-lg opacity-70" onError={e => e.target.style.display='none'} />}
        </div>
      );
    }
    return <Input value={val} onChange={e => set(row.key, e.target.value)} />;
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <SectionHeader
        title="Настройки сайта"
        subtitle="Название, внешний вид, ИИ модели"
        action={
          <div className="flex items-center gap-3">
            <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
              <RefreshCw size={14} /> Сбросить
            </button>
            <button onClick={save} disabled={saving || !changed}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-40">
              <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        }
      />

      {changed && (
        <div className="mb-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-400 text-sm flex items-center gap-2">
          ⚠️ Есть несохранённые изменения
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(settings).map(([cat, rows]) => (
          <section key={cat}>
            <h2 className="text-sm font-medium text-white/40 uppercase tracking-wide mb-4 pb-2 border-b border-white/5">
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rows.map(row => (
                <div key={row.key} className={row.type === 'boolean' ? 'flex items-center justify-between card' : ''}>
                  {row.type === 'boolean' ? (
                    <>
                      <div>
                        <p className="text-white/80 text-sm">{row.label}</p>
                        <p className="text-white/30 text-xs font-mono mt-0.5">{row.key}</p>
                      </div>
                      {renderInput(row)}
                    </>
                  ) : (
                    <Field label={row.label} hint={<span className="font-mono">{row.key}</span>}>
                      {renderInput(row)}
                    </Field>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Sticky save bar */}
      {changed && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#1a1a20] border border-white/15 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-4">
            <span className="text-white/60 text-sm">Есть несохранённые изменения</span>
            <button onClick={save} disabled={saving} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
              {saving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
