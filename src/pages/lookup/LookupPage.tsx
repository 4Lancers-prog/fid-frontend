import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Search, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { lookupByAadhaar, createFarmer } from '../../services/farmer.service';
import { farmerSchema, type FarmerForm } from '../../schemas';
import type { Farmer, FieldError } from '../../types';
import { normaliseError } from '../../lib/api';
import { useT } from '../../i18n';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { TextArea } from '../../components/common/TextArea';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/common/Alert';

const OFFICIAL_PORTAL = 'https://kkisan.karnataka.gov.in/Citizen/FarmServiceFIDDetails.aspx?AID=FM';

type DetailsForm = Omit<FarmerForm, 'aadhaarNumber'>;

export function LookupPage() {
  const t = useT();
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [existing, setExisting] = useState<Farmer | null>(null);
  const [saved, setSaved] = useState<Farmer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DetailsForm>({ resolver: zodResolver(farmerSchema.omit({ aadhaarNumber: true }) as never) });

  const normalisedAadhaar = aadhaar.replace(/\D/g, '');

  const check = async () => {
    setAadhaarError(null);
    setExisting(null);
    if (normalisedAadhaar.length !== 12) {
      setAadhaarError('Enter a valid 12-digit Aadhaar number.');
      return;
    }
    setChecking(true);
    try {
      const res = await lookupByAadhaar(normalisedAadhaar);
      if (res.exists && res.farmer) {
        setExisting(res.farmer);
      } else {
        setStep(2);
      }
    } catch (e) {
      setAadhaarError(normaliseError(e).message);
    } finally {
      setChecking(false);
    }
  };

  const onSave = async (values: DetailsForm) => {
    setFormError(null);
    try {
      const farmer = await createFarmer({ ...values, aadhaarNumber: normalisedAadhaar });
      setSaved(farmer);
    } catch (e) {
      const err = normaliseError(e);
      err.fields?.forEach((fe: FieldError) => setError(fe.field as keyof DetailsForm, { message: fe.message }));
      setFormError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-xl font-bold text-slate-800">{t('page.lookup.t')}</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
          <ShieldCheck className="h-3 w-3" /> Admin only
        </span>
      </div>

      <div className="mb-5">
        <Alert tone="info">
          This is an <strong>assisted</strong> workflow. Complete any OTP, CAPTCHA and verification directly on the
          official government portal — this app never bypasses them or scrapes protected data. You then transcribe the
          verified details here.
        </Alert>
      </div>

      {/* Step 1: Aadhaar + handoff */}
      <Card className="mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
          <Search className="h-4 w-4" /> Step 1 — Enter Aadhaar &amp; verify on the official portal
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormField label="Aadhaar Number" htmlFor="la" error={aadhaarError ?? undefined} required>
              <Input
                id="la"
                inputMode="numeric"
                maxLength={14}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                hasError={!!aadhaarError}
                placeholder="XXXX XXXX XXXX"
                disabled={step === 2}
              />
            </FormField>
          </div>
          <a href={OFFICIAL_PORTAL} target="_blank" rel="noreferrer" className="mb-4">
            <Button type="button" variant="secondary">
              <ExternalLink className="h-4 w-4" /> Open official portal
            </Button>
          </a>
          {step === 1 && (
            <Button type="button" onClick={check} loading={checking} className="mb-4">
              Check &amp; Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {existing && (
          <div className="mt-2">
            <Alert tone="warning">
              A farmer profile already exists for this Aadhaar: <strong>{existing.name}</strong> ({existing.fid}). You can
              reuse it instead of creating a duplicate.
            </Alert>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/farmers')}>
                <UserCheck className="h-4 w-4" /> Open in Farmers
              </Button>
              <Button onClick={() => navigate('/fid')}>Use for FID card</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Step 2: transcribe verified details */}
      {step === 2 && !saved && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            <ShieldCheck className="h-4 w-4" /> Step 2 — Enter the verified details
          </h2>
          {formError && <div className="mb-4"><Alert tone="error">{formError}</Alert></div>}
          <form onSubmit={handleSubmit(onSave)} noValidate>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <FormField label="Farmer Name" htmlFor="n" required error={errors.name?.message}><Input id="n" hasError={!!errors.name} {...register('name')} /></FormField>
              <FormField label="Gender" htmlFor="g" required error={errors.gender?.message}>
                <Select id="g" defaultValue="" hasError={!!errors.gender} {...register('gender')}>
                  <option value="" disabled>Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
              <FormField label="FID Number" htmlFor="f" required error={errors.fid?.message}><Input id="f" hasError={!!errors.fid} {...register('fid')} /></FormField>
              <FormField label="Mobile Number" htmlFor="m" error={errors.mobile?.message}><Input id="m" hasError={!!errors.mobile} {...register('mobile')} /></FormField>
              <FormField label="Village" htmlFor="v" error={errors.village?.message}><Input id="v" {...register('village')} /></FormField>
              <FormField label="Taluk" htmlFor="t" error={errors.taluk?.message}><Input id="t" {...register('taluk')} /></FormField>
              <FormField label="District" htmlFor="d" error={errors.district?.message}><Input id="d" {...register('district')} /></FormField>
            </div>
            <FormField label="Address" htmlFor="a" error={errors.address?.message}><TextArea id="a" rows={2} {...register('address')} /></FormField>
            <div className="mt-2 flex justify-end">
              <Button type="submit" loading={isSubmitting}>Save Farmer Profile</Button>
            </div>
          </form>
        </Card>
      )}

      {saved && (
        <Card>
          <Alert tone="success">
            Saved verified profile for <strong>{saved.name}</strong> ({saved.fid}).
          </Alert>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/farmers')}>Open in Farmers</Button>
            <Button onClick={() => navigate('/fid')}>Use for FID card</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
