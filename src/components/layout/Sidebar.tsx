import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sprout, X } from 'lucide-react';
import { navItems } from './navItems';
import { useAuthStore } from '../../store/authStore';
import { serviceSettingsApi } from '../../services/admin.service';
import { Badge } from '../common/Badge';
import { useT } from '../../i18n';
import type { TKey } from '../../i18n/dictionary';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hasRole = useAuthStore((s) => s.hasRole);
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const [enabled, setEnabled] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    serviceSettingsApi.get().then((r) => setEnabled(r.enabledServices)).catch(() => setEnabled(null));
  }, []);

  const isCustomer = user?.role === 'customer';

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        className={`fixed z-40 flex h-full w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-gold-500 text-white">
              <Sprout className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-800">{t('app.name')}</p>
              <p className="text-[11px] text-slate-400">{t('app.subtitle')}</p>
            </div>
          </div>
          <button className="rounded p-1 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems
            .filter((item) => !item.roles || hasRole(...item.roles))
            .filter((item) => !(isCustomer && item.serviceType && enabled && enabled[item.serviceType] === false))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                <span className="flex-1">{t(item.labelKey as TKey)}</span>
                {!item.ready && <Badge tone="amber">{t('common.soon')}</Badge>}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          Phase 1 foundation · v0.1
        </div>
      </aside>
    </>
  );
}
