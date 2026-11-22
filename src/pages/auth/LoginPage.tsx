import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { loginSchema, type LoginForm } from '../../schemas';
import { useAuthStore } from '../../store/authStore';
import { normaliseError } from '../../lib/api';
import { FormField } from '../../components/common/FormField';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { useT } from '../../i18n';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const [formError, setFormError] = useState<{ tone: 'error' | 'warning'; message: string } | null>(null);
  const t = useT();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (status === 'authenticated') navigate('/dashboard', { replace: true });
  }, [status, navigate]);

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const e = normaliseError(err);
      if (e.code === 'PENDING_APPROVAL') {
        setFormError({ tone: 'warning', message: 'Your account is waiting for administrator approval. You will be able to sign in once it is approved.' });
      } else if (e.code === 'REGISTRATION_REJECTED') {
        setFormError({ tone: 'error', message: 'Your registration was not approved. Please contact the administrator.' });
      } else {
        setFormError({ tone: 'error', message: e.message });
      }
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-brand-50 via-white to-gold-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-4 flex justify-end"><LanguageSwitcher /></div>
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-gold-500 text-white">
            <Sprout className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold text-slate-800">{t('auth.login.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.login.subtitle')}</p>
        </div>

        {formError && (
          <div className="mb-4">
            <Alert tone={formError.tone}>{formError.message}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label={t('common.email')} htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" hasError={!!errors.email} placeholder="admin@farmerportal.local" {...register('email')} />
          </FormField>

          <FormField label={t('common.password')} htmlFor="password" required error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" hasError={!!errors.password} placeholder="••••••••" {...register('password')} />
          </FormField>

          <Button type="submit" className="mt-2 w-full" loading={isSubmitting}>
            {t('auth.login.cta')}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          {t('auth.login.provisioned')}
        </p>
        <p className="mt-2 text-center text-xs text-slate-400">
          <Link to="/admin/login" className="font-medium text-brand-600 hover:underline">
            {t('auth.login.adminLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
