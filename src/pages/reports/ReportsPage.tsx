import { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import { Users, IdCard, FileText, UserCog, Wallet, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getReports, type Reports } from '../../services/reports.service';
import type { ApplicationStatus } from '../../types';
import { normaliseError } from '../../lib/api';
import { Card } from '../../components/common/Card';
import { Alert } from '../../components/common/Alert';
import { FullPageLoader } from '../../components/common/Spinner';

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_META: Record<ApplicationStatus, { label: string; color: string }> = {
  new: { label: 'New', color: '#0ea5e9' },
  pending: { label: 'Pending', color: '#f59e0b' },
  in_progress: { label: 'In Progress', color: '#6366f1' },
  completed: { label: 'Completed', color: '#16a34a' },
  rejected: { label: 'Rejected', color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#94a3b8' },
};

const TYPE_COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6'];

export function ReportsPage() {
  const t = useT();
  const [data, setData] = useState<Reports | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReports().then(setData).catch((e) => setError(normaliseError(e).message));
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return <FullPageLoader label="Loading reports…" />;

  const statusEntries = (Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => ({
    ...STATUS_META[s],
    value: data.applicationsByStatus[s] ?? 0,
  }));
  const statusTotal = statusEntries.reduce((a, b) => a + b.value, 0);
  const typeMax = Math.max(1, ...data.applicationsByType.map((t) => t.total));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Reports &amp; Analytics</h1>
        <p className="text-sm text-slate-500">A snapshot of activity across the portal.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TotalCard icon={Users} tone="text-brand-600 bg-brand-50" label="Farmers" value={data.totals.farmers} />
        <TotalCard icon={IdCard} tone="text-sky-600 bg-sky-50" label="FID Cards" value={data.totals.fidCards} />
        <TotalCard icon={FileText} tone="text-amber-600 bg-amber-50" label="Documents" value={data.totals.documents} />
        <TotalCard icon={UserCog} tone="text-indigo-600 bg-indigo-50" label="Users" value={data.totals.users} />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        {/* Applications by status — donut + legend */}
        <Card>
          <h2 className="mb-4 text-sm font-bold text-slate-700">Applications by Status</h2>
          {statusTotal === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No applications yet.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <Donut entries={statusEntries} total={statusTotal} />
              <ul className="flex-1 space-y-1.5">
                {statusEntries.filter((e) => e.value > 0).map((e) => (
                  <li key={e.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm" style={{ background: e.color }} />
                      {e.label}
                    </span>
                    <span className="font-semibold text-slate-700">{e.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Applications by type — bars */}
        <Card>
          <h2 className="mb-4 text-sm font-bold text-slate-700">Applications by Service</h2>
          {data.applicationsByType.every((t) => t.total === 0) ? (
            <p className="py-8 text-center text-sm text-slate-400">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {data.applicationsByType.map((t, i) => (
                <div key={t.type}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{t.label}</span>
                    <span className="font-semibold text-slate-700">{t.total}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(t.total / typeMax) * 100}%`, background: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Payments */}
        <Card>
          <h2 className="mb-4 text-sm font-bold text-slate-700">Manual Payments</h2>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <MiniStat icon={Clock} tone="text-amber-600" label="Pending" value={data.payments.counts.pending ?? 0} />
            <MiniStat icon={CheckCircle2} tone="text-brand-600" label="Approved" value={data.payments.counts.approved ?? 0} />
            <MiniStat icon={XCircle} tone="text-red-500" label="Rejected" value={data.payments.counts.rejected ?? 0} />
          </div>
          <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm">
            <span className="text-slate-600">Total approved &amp; credited: </span>
            <span className="font-bold text-brand-700">{rupees(data.payments.approvedAmountPaise)}</span>
          </div>
        </Card>

        {/* Wallet movement */}
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700"><Wallet className="h-4 w-4" /> Wallet Movement</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-slate-600">Total credited</span><span className="font-semibold text-brand-600">{rupees(data.wallet.creditedPaise)}</span></li>
            <li className="flex justify-between"><span className="text-slate-600">Total debited</span><span className="font-semibold text-red-500">{rupees(data.wallet.debitedPaise)}</span></li>
            <li className="flex justify-between border-t border-slate-100 pt-2"><span className="font-medium text-slate-700">Net balance in system</span><span className="font-bold text-slate-800">{rupees(data.wallet.netPaise)}</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function TotalCard({ icon: Icon, tone, label, value }: { icon: typeof Users; tone: string; label: string; value: number }) {
  return (
    <Card className="flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></span>
      <div>
        <p className="text-xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

function MiniStat({ icon: Icon, tone, label, value }: { icon: typeof Users; tone: string; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3 text-center">
      <Icon className={`mx-auto mb-1 h-4 w-4 ${tone}`} />
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

/** Pure-SVG donut chart (no chart library). */
function Donut({ entries, total }: { entries: { label: string; color: string; value: number }[]; total: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = entries
    .filter((e) => e.value > 0)
    .map((e) => {
      const fraction = e.value / total;
      const dash = fraction * circumference;
      const seg = { color: e.color, dash, gap: circumference - dash, offset: -offset };
      offset += dash;
      return seg;
    });

  return (
    <svg viewBox="0 0 110 110" className="h-32 w-32 -rotate-90">
      <circle cx="55" cy="55" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke={s.color}
          strokeWidth="14"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={s.offset}
        />
      ))}
      <text x="55" y="55" transform="rotate(90 55 55)" textAnchor="middle" dominantBaseline="central" className="fill-slate-800 text-lg font-bold">
        {total}
      </text>
    </svg>
  );
}
