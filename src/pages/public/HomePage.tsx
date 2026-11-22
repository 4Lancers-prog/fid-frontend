import { Link } from 'react-router-dom';
import { Sprout, IdCard, Car, Truck, Landmark, ScanLine, ArrowRight, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/common/Button';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { useT } from '../../i18n';

const services = [
  { icon: IdCard, titleKey: 'home.svc.fid.t', descKey: 'home.svc.fid.d' },
  { icon: Sprout, titleKey: 'home.svc.crop.t', descKey: 'home.svc.crop.d' },
  { icon: Car, titleKey: 'home.svc.vehicle.t', descKey: 'home.svc.vehicle.d' },
  { icon: Truck, titleKey: 'home.svc.trailer.t', descKey: 'home.svc.trailer.d' },
  { icon: Landmark, titleKey: 'home.svc.loan.t', descKey: 'home.svc.loan.d' },
  { icon: ScanLine, titleKey: 'home.svc.doc.t', descKey: 'home.svc.doc.d' },
] as const;

export function HomePage() {
  const status = useAuthStore((s) => s.status);
  const t = useT();
  const isAuthed = status === 'authenticated';

  return (
    <div className="min-h-full bg-gradient-to-br from-brand-50 via-white to-gold-100">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-gold-500 text-white">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="text-base font-bold text-slate-800">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isAuthed ? (
            <Link to="/dashboard"><Button>{t('home.cta.dashboard')} <ArrowRight className="h-4 w-4" /></Button></Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block"><Button variant="ghost"><LogIn className="h-4 w-4" /> {t('common.signIn')}</Button></Link>
              <Link to="/register"><Button><UserPlus className="h-4 w-4" /> {t('common.register')}</Button></Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-10 pt-12 text-center lg:pt-20">
        <h1 className="text-3xl font-extrabold leading-tight text-slate-800 sm:text-4xl lg:text-5xl">
          {t('home.hero.title1')} <span className="bg-gradient-to-r from-brand-600 to-gold-600 bg-clip-text text-transparent">{t('home.hero.title2')}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
          {t('home.hero.subtitle')}
        </p>
        {!isAuthed && (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register"><Button className="px-6">{t('home.hero.create')} <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/login"><Button variant="ghost" className="px-6"><LogIn className="h-4 w-4" /> {t('home.hero.have')}</Button></Link>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">{t('home.hero.note')}</p>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-wide text-slate-500">{t('home.services.heading')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.titleKey} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-bold text-slate-800">{t(s.titleKey)}</h3>
              <p className="mt-1 text-sm text-slate-500">{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/60 px-5 py-6 text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/login" className="hover:text-slate-600">{t('common.signIn')}</Link>
          <Link to="/register" className="hover:text-slate-600">{t('common.register')}</Link>
          <Link to="/admin/login" className="inline-flex items-center gap-1 hover:text-slate-600">
            <ShieldCheck className="h-3 w-3" /> {t('home.footer.admin')}
          </Link>
        </div>
        <p className="mt-3">{t('home.footer.disclaimer')}</p>
      </footer>
    </div>
  );
}
