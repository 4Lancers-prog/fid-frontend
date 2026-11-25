import { useEffect, useState } from 'react';
import { Menu, LogOut, Wallet as WalletIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { useT } from '../../i18n';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { NotificationBell } from './NotificationBell';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  operator: 'Operator',
  loan_executive: 'Loan Executive',
  viewer: 'Viewer',
  customer: 'Customer',
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [balance, setBalance] = useState<number | null>(null);
  const t = useT();

  useEffect(() => {
    let active = true;
    api
      .get('/wallet')
      .then((res) => active && setBalance(res.data.data.balanceRupees))
      .catch(() => active && setBalance(null));
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
      <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3">
        <LanguageSwitcher />
        <NotificationBell />
        <div className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
          <WalletIcon className="h-4 w-4" />
          {balance === null ? '—' : `₹${balance.toFixed(2)}`}
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight text-slate-800">{user?.name}</p>
          <p className="text-[11px] text-slate-400">{user ? roleLabels[user.role] : ''}</p>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t('common.signOut')}</span>
        </button>
      </div>
    </header>
  );
}
