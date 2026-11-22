import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, CheckCircle2, ArrowLeft, QrCode, Upload } from 'lucide-react';
import { registerSchema, type RegisterForm } from '../../schemas';
import { registerAccount, getRegistrationQr, type RegistrationQr } from '../../services/auth.service';
import { fileToDataUrl } from '../../services/payments.service';
import { normaliseError } from '../../lib/api';
import type { FieldError } from '../../types';
import { FormField } from '../../components/common/FormField';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { useT } from '../../i18n';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [qr, setQr] = useState<RegistrationQr | null>(null);
  const [proof, setProof] = useState<string | undefined>();
  const t = useT();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    getRegistrationQr().then(setQr).catch(() => setQr({ active: false }));
  }, []);

  const onProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setFormError('Payment screenshot must be a JPG, JPEG, PNG or WEBP image.');
      return;
    }
    setProof(await fileToDataUrl(file));
  };

  const onSubmit = async (values: RegisterForm) => {
    setFormError(null);
    // When a payment QR is published, the UTR is required.
    if (qr?.active && !values.paymentUtr?.trim()) {
      setError('paymentUtr', { message: 'Enter the payment reference / UTR after paying the registration fee.' });
      return;
    }
    try {
      await registerAccount({
        name: values.name,
        email: values.email,
        mobile: values.mobile,
        password: values.password,
        paymentUtr: values.paymentUtr?.trim() || undefined,
        paymentAmountRupees: values.paymentAmountRupees ? Number(values.paymentAmountRupees) : undefined,
        paymentProof: proof,
      });
      setSubmitted(true);
    } catch (e) {
      const err = normaliseError(e);
      err.fields?.forEach((fe: FieldError) => setError(fe.field as keyof RegisterForm, { message: fe.message }));
      setFormError(err.message);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-brand-50 via-white to-gold-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-3 w-3" /> {t('auth.back')}
          </Link>
          <LanguageSwitcher />
        </div>

        {submitted ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="text-lg font-bold text-slate-800">{t('auth.register.submittedTitle')}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {t('auth.register.submittedBody')}
            </p>
            <Button className="mt-5 w-full" onClick={() => navigate('/login')}>{t('auth.register.goSignIn')}</Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-gold-500 text-white">
                <Sprout className="h-6 w-6" />
              </span>
              <h1 className="text-xl font-bold text-slate-800">{t('auth.register.title')}</h1>
              <p className="mt-1 text-sm text-slate-500">{t('auth.register.subtitle')}</p>
            </div>

            {formError && <div className="mb-4"><Alert tone="error">{formError}</Alert></div>}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField label={t('common.fullName')} htmlFor="r-name" required error={errors.name?.message}>
                <Input id="r-name" hasError={!!errors.name} placeholder="e.g. Basavaraj Patil" {...register('name')} />
              </FormField>
              <FormField label={t('common.email')} htmlFor="r-email" required error={errors.email?.message}>
                <Input id="r-email" type="email" autoComplete="email" hasError={!!errors.email} {...register('email')} />
              </FormField>
              <FormField label={t('common.mobile')} htmlFor="r-mobile" required error={errors.mobile?.message}>
                <Input id="r-mobile" inputMode="numeric" maxLength={10} hasError={!!errors.mobile} placeholder="10-digit mobile" {...register('mobile')} />
              </FormField>
              <FormField label={t('common.password')} htmlFor="r-pass" required error={errors.password?.message} hint={t('auth.register.passwordHint')}>
                <Input id="r-pass" type="password" autoComplete="new-password" hasError={!!errors.password} {...register('password')} />
              </FormField>
              <FormField label={t('auth.register.confirmPassword')} htmlFor="r-cpass" required error={errors.confirmPassword?.message}>
                <Input id="r-cpass" type="password" autoComplete="new-password" hasError={!!errors.confirmPassword} {...register('confirmPassword')} />
              </FormField>

              {qr?.active && (
                <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-800">
                    <QrCode className="h-4 w-4" /> Registration fee payment
                  </h3>
                  <p className="mb-3 text-xs text-slate-500">
                    Scan the QR and pay{qr.registrationFeeRupees ? <> the fee of <strong>₹{qr.registrationFeeRupees}</strong></> : ' the registration fee'}, then enter the reference below.
                  </p>
                  <div className="mb-3 flex items-start gap-3">
                    {qr.qrImage ? (
                      <img src={qr.qrImage} alt="Payment QR" className="h-28 w-28 rounded-lg border border-slate-200 object-contain" />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400"><QrCode className="h-8 w-8" /></div>
                    )}
                    <div className="text-xs text-slate-600">
                      {qr.businessName && <p className="font-semibold text-slate-700">{qr.businessName}</p>}
                      {qr.upiId && <p>UPI: {qr.upiId}</p>}
                      {qr.instructions && <p className="mt-1 text-slate-500">{qr.instructions}</p>}
                    </div>
                  </div>

                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <FormField label="Payment Reference / UTR" htmlFor="r-utr" required error={errors.paymentUtr?.message}>
                      <Input id="r-utr" hasError={!!errors.paymentUtr} placeholder="e.g. 4567XXXX1234" {...register('paymentUtr')} />
                    </FormField>
                    <FormField label="Amount Paid (₹)" htmlFor="r-amt">
                      <Input id="r-amt" type="number" placeholder={qr.registrationFeeRupees ? String(qr.registrationFeeRupees) : 'e.g. 100'} {...register('paymentAmountRupees')} />
                    </FormField>
                  </div>
                  <FormField label="Payment Screenshot (optional)" htmlFor="r-proof">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                      <Upload className="h-4 w-4" /> {proof ? 'Screenshot attached' : 'Upload screenshot'}
                      <input id="r-proof" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onProof} />
                    </label>
                  </FormField>
                </div>
              )}

              <Button type="submit" className="mt-2 w-full" loading={isSubmitting}>{t('auth.register.cta')}</Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              {t('auth.register.have')}{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:underline">{t('common.signIn')}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
