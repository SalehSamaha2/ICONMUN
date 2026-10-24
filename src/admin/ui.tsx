import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

export const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(' ');

/* ----------------------------------------------------------------- buttons */
type BtnVariant = 'primary' | 'ghost' | 'danger' | 'subtle';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md'; loading?: boolean }
> = ({ variant = 'subtle', size = 'md', loading, className, children, disabled, ...rest }) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide transition-all duration-200 cursor-pointer select-none ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF6A]/70 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-xs min-h-[34px]' : 'px-4 py-2.5 text-sm min-h-[42px]';
  const variants: Record<BtnVariant, string> = {
    primary:
      'bg-gradient-to-b from-[#E3C27F] to-[#B8893C] text-[#1a1305] font-semibold shadow-[0_0_0_1px_rgba(243,223,162,0.35),0_8px_24px_-8px_rgba(212,175,106,0.45)] hover:brightness-110',
    subtle: 'border border-[#D4AF6A]/25 bg-white/[0.03] text-[#E6E1D8] hover:border-[#D4AF6A]/60 hover:bg-[#D4AF6A]/10',
    ghost: 'text-[#A89D8A] hover:text-[#F3DFA2] hover:bg-white/5',
    danger: 'border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-400/70',
  };
  return (
    <button {...rest} disabled={disabled || loading} className={cx(base, sizes, variants[variant], className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

/* ----------------------------------------------------------------- layout bits */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    {...rest}
    className={cx(
      'rounded-2xl border border-[#D4AF6A]/15 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]',
      className
    )}
  />
);

export const PageHeader: React.FC<{ eyebrow?: string; title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  eyebrow,
  title,
  subtitle,
  actions,
}) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.28em] text-[#D4AF6A]">{eyebrow}</div>}
      <h1 className="font-cinzel text-2xl font-bold tracking-wide text-[#FFF3D6] sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-[#8E8678]">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Badge: React.FC<{ tone?: 'gold' | 'green' | 'red' | 'blue' | 'gray' | 'amber'; children: React.ReactNode }> = ({
  tone = 'gray',
  children,
}) => {
  const tones = {
    gold: 'border-[#D4AF6A]/40 bg-[#D4AF6A]/10 text-[#F3DFA2]',
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
    blue: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    gray: 'border-white/10 bg-white/5 text-[#A89D8A]',
  };
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider', tones[tone])}>
      {children}
    </span>
  );
};

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#8E8678]" role="status">
    <Loader2 className="h-5 w-5 animate-spin text-[#D4AF6A]" />
    {label}
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string; action?: React.ReactNode }> = ({ title, hint, action }) => (
  <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
    <div className="font-cinzel text-lg text-[#F3DFA2]">{title}</div>
    {hint && <p className="max-w-sm text-sm text-[#8E8678]">{hint}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export const ErrorBox: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="flex-1">{message}</div>
    {onRetry && (
      <Button size="sm" variant="danger" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);

/* ----------------------------------------------------------------- form controls */
const inputBase =
  'w-full rounded-lg border border-white/10 bg-[#121212] px-3.5 py-2.5 text-sm text-[#F4EFE6] placeholder-white/25 ' +
  'transition-colors focus:border-[#D4AF6A]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF6A]/15 disabled:opacity-60';

export const Label: React.FC<{ htmlFor?: string; children: React.ReactNode; hint?: string; required?: boolean }> = ({
  htmlFor,
  children,
  hint,
  required,
}) => (
  <div className="mb-1.5">
    <label htmlFor={htmlFor} className="block text-[11px] font-medium uppercase tracking-[0.18em] text-[#C4BAA8]">
      {children}
      {required && <span className="ml-1 text-[#D4AF6A]">*</span>}
    </label>
    {hint && <p className="mt-0.5 text-xs text-[#6F685B]">{hint}</p>}
  </div>
);

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => <input ref={ref} {...rest} className={cx(inputBase, className)} />
);
TextInput.displayName = 'TextInput';

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...rest }) => (
  <textarea {...rest} className={cx(inputBase, 'min-h-[96px] resize-y leading-relaxed', className)} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...rest }) => (
  <select {...rest} className={cx(inputBase, 'cursor-pointer pr-8', className)}>
    {children}
  </select>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string; id?: string }> = ({
  checked,
  onChange,
  label,
  id,
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF6A]/70',
      checked ? 'border-[#D4AF6A] bg-[#D4AF6A]/30' : 'border-white/15 bg-white/5'
    )}
  >
    <span
      className={cx(
        'inline-block h-4 w-4 rounded-full transition-transform',
        checked ? 'translate-x-6 bg-[#F3DFA2]' : 'translate-x-1 bg-[#6F685B]'
      )}
    />
  </button>
);

/* ----------------------------------------------------------------- drawer & confirm */
export const Drawer: React.FC<{ open: boolean; title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: string }> = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 'sm:max-w-xl',
}) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cx('relative flex h-full w-full flex-col border-l border-[#D4AF6A]/25 bg-[#0B0B0B] shadow-2xl animate-[slideIn_.22s_ease-out]', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate font-cinzel text-lg font-bold text-[#FFF3D6]">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-[#8E8678]">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-white/10 bg-[#0B0B0B] px-5 py-3 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, confirmLabel = 'Delete', loading, onConfirm, onCancel }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <Card className="relative w-full max-w-md p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-300" />
          </div>
          <h3 className="font-cinzel text-lg font-bold text-[#FFF3D6]">{title}</h3>
        </div>
        <div className="mb-6 text-sm leading-relaxed text-[#B9AE9A]">{message}</div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
};

/* ----------------------------------------------------------------- toasts */
type Toast = { id: number; tone: 'ok' | 'err' | 'info'; text: string };
const ToastCtx = createContext<(tone: Toast['tone'], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((tone: Toast['tone'], text: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, tone, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'err' ? 6500 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[400] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur animate-[slideUp_.2s_ease-out]',
              t.tone === 'ok' && 'border-emerald-500/30 bg-[#0c1a14]/95 text-emerald-200',
              t.tone === 'err' && 'border-red-500/40 bg-[#1c0d0d]/95 text-red-200',
              t.tone === 'info' && 'border-[#D4AF6A]/30 bg-[#17130a]/95 text-[#F3DFA2]'
            )}
          >
            {t.tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : t.tone === 'err' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

/* ----------------------------------------------------------------- helpers */
export const formatDate = (iso: string, withTime = true) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, withTime
    ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' });
};

export const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d ago`;
  return formatDate(iso, false);
};

/** Turn a raw database/API error into something a human organiser can act on. */
export const friendlyError = (err: unknown): string => {
  const msg = (err as { message?: string })?.message || String(err ?? '');
  if (/row-level security|permission denied|not authorized/i.test(msg)) return 'You do not have permission to do that. Sign in again with an organiser account.';
  if (/violates check constraint/i.test(msg)) return 'One of the values is too long or not allowed. Please check the fields and try again.';
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Could not reach the server. Check your internet connection.';
  if (/JWT|expired/i.test(msg)) return 'Your session expired. Please sign in again.';
  return msg || 'Something went wrong.';
};
