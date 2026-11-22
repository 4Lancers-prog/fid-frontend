import type { ApplicationStatus } from '../../types';

const config: Record<ApplicationStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-sky-100 text-sky-700' },
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', cls: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Completed', cls: 'bg-brand-100 text-brand-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-200 text-slate-600' },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const c = config[status] ?? config.new;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

export const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = (
  Object.keys(config) as ApplicationStatus[]
).map((s) => ({ value: s, label: config[s].label }));
