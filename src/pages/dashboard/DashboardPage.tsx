import { useEffect, useState } from 'react';
import { Users, IdCard, Sprout, Car, Truck, Landmark, Clock, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { getDashboardStats } from '../../services/dashboard.service';
import type { DashboardStats } from '../../types';
import { normaliseError } from '../../lib/api';
import { Card } from '../../components/common/Card';
import { FullPageLoader } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

const statCards = [
  { key: 'farmers', labelKey: 'dash.stat.farmers', icon: Users, tone: 'text-brand-600 bg-brand-50' },
  { key: 'fidCards', labelKey: 'dash.stat.fid', icon: IdCard, tone: 'text-sky-600 bg-sky-50' },
  { key: 'cropApplications', labelKey: 'dash.stat.crop', icon: Sprout, tone: 'text-emerald-600 bg-emerald-50' },
  { key: 'vehicleApplications', labelKey: 'dash.stat.vehicle', icon: Car, tone: 'text-indigo-600 bg-indigo-50' },
  { key: 'trailerApplications', labelKey: 'dash.stat.trailer', icon: Truck, tone: 'text-amber-600 bg-amber-50' },
  { key: 'loanLeads', labelKey: 'dash.stat.loan', icon: Landmark, tone: 'text-rose-600 bg-rose-50' },
  { key: 'pending', labelKey: 'dash.stat.pending', icon: Clock, tone: 'text-amber-600 bg-amber-50' },
  { key: 'completed', labelKey: 'dash.stat.completed', icon: CheckCircle2, tone: 'text-brand-600 bg-brand-50' },
  { key: 'rejected', labelKey: 'dash.stat.rejected', icon: XCircle, tone: 'text-red-600 bg-red-50' },
] as const;

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(normaliseError(e).message));
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!stats) return <FullPageLoader label="Loading dashboard…" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('dash.welcome')}, {user?.name?.split(' ')[0] ?? ''} 👋</h1>
        <p className="text-sm text-slate-500">{t('dash.overview')}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Card className="col-span-2 flex items-center justify-between bg-gradient-to-br from-brand-600 to-gold-500 text-white sm:col-span-3 xl:col-span-1">
          <div>
            <p className="text-sm opacity-90">{t('dash.walletBalance')}</p>
            <p className="text-2xl font-bold">₹{(stats.walletBalance / 100).toFixed(2)}</p>
          </div>
          <Wallet className="h-8 w-8 opacity-80" />
        </Card>

        {statCards.map(({ key, labelKey, icon: Icon, tone }) => (
          <Card key={key} className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.totals[key as keyof typeof stats.totals]}</p>
              <p className="text-xs text-slate-500">{t(labelKey)}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-bold text-slate-700">{t('dash.recent')}</h2>
        {stats.recentActivities.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">{t('dash.noActivity')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stats.recentActivities.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700">{a.title}</span>
                <span className="text-xs text-slate-400">{new Date(a.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
