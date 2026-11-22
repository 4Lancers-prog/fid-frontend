import { Languages } from 'lucide-react';
import { useI18n } from '../../i18n';

/** English ⇄ ಕನ್ನಡ toggle. `tone="dark"` suits dark backgrounds. */
export function LanguageSwitcher({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { lang, setLang } = useI18n();
  const base = tone === 'dark'
    ? 'border-slate-600 bg-slate-800/60 text-slate-200'
    : 'border-slate-300 bg-white text-slate-600';
  const activeCls = tone === 'dark' ? 'bg-slate-200 text-slate-900' : 'bg-brand-500 text-white';

  return (
    <div className={`inline-flex items-center gap-1 rounded-lg border p-0.5 text-xs font-semibold ${base}`}>
      <Languages className="ml-1 h-3.5 w-3.5 opacity-70" aria-hidden />
      <button
        onClick={() => setLang('en')}
        className={`rounded-md px-2 py-1 transition ${lang === 'en' ? activeCls : 'hover:opacity-80'}`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        onClick={() => setLang('kn')}
        className={`rounded-md px-2 py-1 transition ${lang === 'kn' ? activeCls : 'hover:opacity-80'}`}
        aria-pressed={lang === 'kn'}
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
}
