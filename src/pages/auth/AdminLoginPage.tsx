import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { loginSchema, type LoginForm } from '../../schemas';
import { useAuthStore } from '../../store/authStore';
import { normaliseError } from '../../lib/api';
import { FormField } from '../../components/common/FormField';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { useT } from '../../i18n';

/** Administrator portal sign-in. Uses the same backend auth, but only admin and
 *  super-admin accounts are allowed through; anyone else is signed out again with
 *  a clear message. The real access control is still enforced on the backend. */
export function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const hasRole = useAuthStore((s) => s.hasRole);
  const [formError, setFormError] = useState<string | null>(null);
  const t = useT();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(hasRole('super_admin', 'admin') ? '/admin' : '/', { replace: true });
    }
  }, [status, hasRole, navigate]);

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      const user = useAuthStore.getState().user;
      const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        // Non-admin signed in on the admin portal: sign them back out.
        await useAuthStore.getState().logout();
        setFormError('This account does not have administrator access. Please use the main sign-in page.');
      }
    } catch (err) {
      setFormError(normaliseError(err).message);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800/60 p-8 shadow-xl backdrop-blur">
        <div className="mb-4 flex justify-end"><LanguageSwitcher tone="dark" /></div>
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold text-white">{t('auth.admin.title')}</h1>
          <p className="mt-1 text-sm text-slate-300">{t('auth.admin.subtitle')}</p>
        </div>

        {formError && (
          <div className="mb-4">
            <Alert tone="error">{formError}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="[&_label]:text-slate-200">
            <FormField label={t('common.email')} htmlFor="admin-email" required error={errors.email?.message}>
              <Input id="admin-email" type="email" autoComplete="email" hasError={!!errors.email} placeholder="admin@farmerportal.local" {...register('email')} />
            </FormField>

            <FormField label={t('common.password')} htmlFor="admin-password" required error={errors.password?.message}>
              <Input id="admin-password" type="password" autoComplete="current-password" hasError={!!errors.password} placeholder="••••••••" {...register('password')} />
            </FormField>
          </div>

          <Button type="submit" variant="secondary" className="mt-2 w-full" loading={isSubmitting}>
            {t('auth.admin.cta')}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          {t('auth.admin.notAdmin')}{' '}
          <Link to="/login" className="font-medium text-sky-300 hover:underline">
            {t('auth.admin.userLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
