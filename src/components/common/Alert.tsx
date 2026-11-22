import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type Tone = 'info' | 'success' | 'warning' | 'error';

const config: Record<Tone, { cls: string; Icon: typeof Info }> = {
  info: { cls: 'bg-sky-50 border-sky-200 text-sky-800', Icon: Info },
  success: { cls: 'bg-brand-50 border-brand-200 text-brand-700', Icon: CheckCircle2 },
  warning: { cls: 'bg-amber-50 border-amber-200 text-amber-800', Icon: AlertTriangle },
  error: { cls: 'bg-red-50 border-red-200 text-red-700', Icon: XCircle },
};

export function Alert({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  const { cls, Icon } = config[tone];
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${cls}`} role="alert">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
