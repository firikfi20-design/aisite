import { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// ── Modal ────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#1a1a20] border border-white/10 rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <h2 className="font-semibold text-lg text-white">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm dialog ───────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-white/60 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Отмена</button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all active:scale-95 ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'}`}
        >
          Подтвердить
        </button>
      </div>
    </Modal>
  );
}

// ── Badge ────────────────────────────────────────────────────
const badgeStyles = {
  free:    'bg-white/8 text-white/50',
  pro:     'bg-brand-500/15 text-brand-500',
  ultra:   'bg-purple-500/15 text-purple-400',
  admin:   'bg-red-500/15 text-red-400',
  user:    'bg-white/8 text-white/40',
  active:  'bg-green-500/15 text-green-400',
  inactive:'bg-white/8 text-white/30',
  info:    'bg-blue-500/15 text-blue-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  success: 'bg-green-500/15 text-green-400',
  danger:  'bg-red-500/15 text-red-400',
};

export function Badge({ type, children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${badgeStyles[type] || badgeStyles.user}`}>
      {children}
    </span>
  );
}

// ── Table ────────────────────────────────────────────────────
export function Table({ columns, rows, emptyText = 'Нет данных' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/8">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8 bg-white/3">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wide">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-10 text-white/25 text-sm">{emptyText}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-white/80">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Toast notifications ──────────────────────────────────────
let _addToast = null;
export function useToastInit() {
  const [toasts, setToasts] = useState([]);
  _addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  return toasts;
}
export const toast = {
  success: (msg) => _addToast?.(msg, 'success'),
  error:   (msg) => _addToast?.(msg, 'error'),
  info:    (msg) => _addToast?.(msg, 'info'),
};

const toastIcons = { success: CheckCircle, error: AlertCircle, info: Info };
const toastColors = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error:   'border-red-500/30 bg-red-500/10 text-red-400',
  info:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
};
export function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] space-y-2 pointer-events-none">
      {toasts.map(({ id, msg, type }) => {
        const Icon = toastIcons[type] || Info;
        return (
          <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${toastColors[type]} animate-fade-in`}>
            <Icon size={16} /> {msg}
          </div>
        );
      })}
    </div>
  );
}

// ── Input / Select helpers ───────────────────────────────────
export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="text-white/50 text-xs font-medium block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-white/25 text-xs mt-1">{hint}</p>}
    </div>
  );
}

export function Input({ ...props }) {
  return <input className="input-field text-sm" {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="input-field text-sm bg-[#0f0f11]" {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-white/15'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      {label && <span className="text-white/60 text-sm">{label}</span>}
    </label>
  );
}

// ── Stat card ────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color = 'text-brand-500' }) {
  return (
    <div className="card">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white/5`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Section header ───────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-white/40 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────────
export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-white/40">
      <span>{total} записей</span>
      <div className="flex gap-2">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">←</button>
        <span className="px-3 py-1.5">{page} / {totalPages}</span>
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">→</button>
      </div>
    </div>
  );
}
