import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { lookupByAadhaar, createFarmer, type FetchedDetails } from '../../services/farmer.service';
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

type DetailsForm = Omit<FarmerForm, 'aadhaarNumber'>;
type Phase = 'search' | 'found' | 'entry';

export function LookupPage() {
  const t = useT();
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [phase, setPhase] = useState<Phase>('search');
  const [existing, setExisting] = useState<Farmer | null>(null);
  const [source, setSource] = useState<'database' | 'fruits' | 'manual' | null>(null);
  const [saved, setSaved] = useState<Farmer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DetailsForm>({ resolver: zodResolver(farmerSchema.omit({ aadhaarNumber: true }) as never) });

  const normalisedAadhaar = aadhaar.replace(/\D/g, '');

  const prefill = (d: FetchedDetails) =>
    reset({
      name: d.name ?? '',
      gender: d.gender ?? undefined,
      fid: d.fid ?? '',
      mobile: d.mobile ?? '',
      address: d.address ?? '',
      village: d.village ?? '',
      taluk: d.taluk ?? '',
      district: d.district ?? '',
    } as DetailsForm);

  const fetchDetails = async () => {
    setAadhaarError(null);
    setExisting(null);
    setSource(null);
    if (normalisedAadhaar.length !== 12) {
      setAadhaarError('Enter a valid 12-digit Aadhaar number.');
      return;
    }
    setFetching(true);
    try {
      const res = await lookupByAadhaar(normalisedAadhaar);
      if (res.exists && res.farmer) {
        setExisting(res.farmer);
        setSource('database');
        setPhase('found');
      } else if (res.details) {
        prefill(res.details);
        setSource('fruits');
        setPhase('entry');
      } else {
        reset({} as DetailsForm);
        setSource('manual');
        setPhase('entry');
      }
    } catch (e) {
      setAadhaarError(normaliseError(e).message);
    } finally {
      setFetching(false);
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

  const resetAll = () => {
    setAadhaar('');
    setPhase('search');
    setExisting(null);
    setSaved(null);
    setSource(null);
    setAadhaarError(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-xl font-bold text-slate-800">{t('page.lookup.t')}</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
          <ShieldCheck className="h-3 w-3" /> Admin only
        </span>
      </div>

      <Card className="mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
          <Search className="h-4 w-4" /> Enter Aadhaar to fetch farmer details
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
                disabled={phase !== 'search'}
              />
            </FormField>
          </div>
          {phase === 'search' ? (
            <Button type="button" onClick={fetchDetails} loading={fetching} className="mb-4">
              <Download className="h-4 w-4" /> Fetch details
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={resetAll} className="mb-4">
              New search
            </Button>
          )}
        </div>
      </Card>

      {phase === 'found' && existing && (
        <Card>
          <Alert tone="success">
            Found an existing farmer profile for this Aadhaar: <strong>{existing.name}</strong> ({existing.fid}).
          </Alert>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/farmers')}>
              <UserCheck className="h-4 w-4" /> Open in Farmers
            </Button>
            <Button onClick={() => navigate('/fid')}>
              Use for FID card <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {phase === 'entry' && !saved && (
        <Card>
          <div className="mb-3">
            {source === 'fruits' ? (
              <Alert tone="success">Details fetched from the FRUITS/K-Kisan service. Review and save.</Alert>
            ) : (
              <Alert tone="info">
                No record found for this Aadhaar. Enter the farmer's details below to create the profile.
              </Alert>
            )}
          </div>
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
          <Alert tone="success">Saved farmer profile for <strong>{saved.name}</strong> ({saved.fid}).</Alert>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" onClick={resetAll}>New search</Button>
            <Button onClick={() => navigate('/fid')}>Use for FID card <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </Card>
      )}
    </div>
  );
}
