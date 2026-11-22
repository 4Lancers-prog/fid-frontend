import { useEffect, useState, useCallback } from 'react';
import { useT } from '../../i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, UserPlus } from 'lucide-react';
import { listFarmers, createFarmer, updateFarmer, getFarmerHistory, type FarmerHistoryEntry } from '../../services/farmer.service';
import { farmerSchema, type FarmerForm } from '../../schemas';
import type { Farmer, Paginated, FieldError } from '../../types';
import { History as HistoryIcon, Pencil } from 'lucide-react';
import { normaliseError } from '../../lib/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { TextArea } from '../../components/common/TextArea';
import { FormField } from '../../components/common/FormField';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { FullPageLoader } from '../../components/common/Spinner';
import { useAuthStore } from '../../store/authStore';

export function FarmersPage() {
  const t = useT();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canCreate = hasRole('admin', 'operator');

  const [data, setData] = useState<Paginated<Farmer> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Farmer | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Farmer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await listFarmers({ search: search.trim() || undefined, page, limit });
      setData(res);
    } catch (e) {
      setListError(normaliseError(e).message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('page.farmers.t')}</h1>
          <p className="text-sm text-slate-500">Centralised farmer master database. Aadhaar numbers are masked.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Farmer
          </Button>
        )}
      </div>

      {toast && (
        <div className="mb-4">
          <Alert tone="success">{toast}</Alert>
        </div>
      )}

      <Card className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, FID, mobile, village or district…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-9"
          />
        </div>
      </Card>

      {listError ? (
        <Alert tone="error">{listError}</Alert>
      ) : loading && !data ? (
        <FullPageLoader label="Loading farmers…" />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title="No farmers found"
          description={search ? 'No records match your search. Try a different term.' : 'Register your first farmer to get started.'}
          action={canCreate ? <Button onClick={() => setModalOpen(true)}><UserPlus className="h-4 w-4" /> Add Farmer</Button> : undefined}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">FID</th>
                  <th className="px-4 py-3 font-semibold">Aadhaar</th>
                  <th className="px-4 py-3 font-semibold">Mobile</th>
                  <th className="px-4 py-3 font-semibold">Village / District</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{f.name}</div>
                      <Badge tone="slate">{f.gender}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{f.fid}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{f.aadhaarMasked}</td>
                    <td className="px-4 py-3 text-slate-600">{f.mobile || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {[f.village, f.district].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canCreate && (
                          <button onClick={() => setEditTarget(f)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        )}
                        <button onClick={() => setHistoryTarget(f)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                          <HistoryIcon className="h-3 w-3" /> History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>
              {data?.total ?? 0} farmer(s) · page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      <CreateFarmerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(f) => {
          setToast(`Farmer "${f.name}" was registered successfully.`);
          setModalOpen(false);
          setPage(1);
          load();
          setTimeout(() => setToast(null), 5000);
        }}
      />

      <EditFarmerModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={(f) => {
          setEditTarget(null);
          load();
          setToast(`Farmer "${f.name}" was updated.`);
          setTimeout(() => setToast(null), 5000);
        }}
      />

      <HistoryModal target={historyTarget} onClose={() => setHistoryTarget(null)} />
    </div>
  );
}

function EditFarmerModal({ target, onClose, onSaved }: { target: Farmer | null; onClose: () => void; onSaved: (f: Farmer) => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Omit<FarmerForm, 'aadhaarNumber'>>({ resolver: zodResolver(farmerSchema.omit({ aadhaarNumber: true }) as never) });

  useEffect(() => {
    if (target) {
      reset({
        name: target.name,
        gender: target.gender,
        fid: target.fid,
        mobile: target.mobile ?? '',
        address: target.address ?? '',
        village: target.village ?? '',
        taluk: target.taluk ?? '',
        district: target.district ?? '',
      });
      setFormError(null);
    }
  }, [target, reset]);

  const onSubmit = async (values: Omit<FarmerForm, 'aadhaarNumber'>) => {
    if (!target) return;
    setFormError(null);
    try {
      const updated = await updateFarmer(target.id, values);
      onSaved(updated);
    } catch (e) {
      const err = normaliseError(e);
      err.fields?.forEach((fe: FieldError) => setError(fe.field as keyof Omit<FarmerForm, 'aadhaarNumber'>, { message: fe.message }));
      setFormError(err.message);
    }
  };

  return (
    <Modal open={!!target} onClose={onClose} title={`Edit ${target?.name ?? 'Farmer'}`} widthClass="max-w-2xl">
      {formError && <div className="mb-4"><Alert tone="error">{formError}</Alert></div>}
      <p className="mb-4 text-xs text-slate-400">Aadhaar cannot be changed. Edits are recorded in the farmer's change history.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField label="Farmer Name" htmlFor="e-name" required error={errors.name?.message}><Input id="e-name" hasError={!!errors.name} {...register('name')} /></FormField>
          <FormField label="Gender" htmlFor="e-gender" required error={errors.gender?.message}>
            <Select id="e-gender" hasError={!!errors.gender} {...register('gender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </FormField>
          <FormField label="FID Number" htmlFor="e-fid" required error={errors.fid?.message}><Input id="e-fid" hasError={!!errors.fid} {...register('fid')} /></FormField>
          <FormField label="Mobile Number" htmlFor="e-mobile" error={errors.mobile?.message}><Input id="e-mobile" hasError={!!errors.mobile} {...register('mobile')} /></FormField>
          <FormField label="Village" htmlFor="e-village" error={errors.village?.message}><Input id="e-village" {...register('village')} /></FormField>
          <FormField label="Taluk" htmlFor="e-taluk" error={errors.taluk?.message}><Input id="e-taluk" {...register('taluk')} /></FormField>
          <FormField label="District" htmlFor="e-district" error={errors.district?.message}><Input id="e-district" {...register('district')} /></FormField>
        </div>
        <FormField label="Address" htmlFor="e-address" error={errors.address?.message}><TextArea id="e-address" rows={2} {...register('address')} /></FormField>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

function HistoryModal({ target, onClose }: { target: Farmer | null; onClose: () => void }) {
  const [entries, setEntries] = useState<FarmerHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setEntries(null);
    setError(null);
    getFarmerHistory(target.id)
      .then(setEntries)
      .catch((e) => setError(normaliseError(e).message));
  }, [target]);

  return (
    <Modal open={!!target} onClose={onClose} title={`Change History — ${target?.name ?? ''}`}>
      {error ? (
        <Alert tone="error">{error}</Alert>
      ) : !entries ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading history…</p>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No history recorded.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((h) => (
            <li key={h.id} className="rounded-lg border border-slate-100 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <Badge tone={h.action === 'create' ? 'green' : 'sky'}>{h.action}</Badge>
                <span className="text-xs text-slate-400">
                  {new Date(h.at).toLocaleString()} {h.changedByName ? `· ${h.changedByName}` : ''}
                </span>
              </div>
              <ul className="ml-1 space-y-0.5 text-xs text-slate-600">
                {h.changes.map((c, i) => (
                  <li key={i}>
                    <span className="font-semibold">{c.field}</span>
                    {h.action === 'update' ? (
                      <>
                        : <span className="text-red-500 line-through">{c.from || '—'}</span> → <span className="text-brand-700">{c.to || '—'}</span>
                      </>
                    ) : (
                      <>: {c.to}</>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function CreateFarmerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (f: Farmer) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FarmerForm>({ resolver: zodResolver(farmerSchema) });

  useEffect(() => {
    if (open) {
      reset();
      setFormError(null);
    }
  }, [open, reset]);

  const onSubmit = async (values: FarmerForm) => {
    setFormError(null);
    try {
      const farmer = await createFarmer(values);
      onCreated(farmer);
    } catch (e) {
      const err = normaliseError(e);
      // Map any server-side field errors back onto the form inputs.
      if (err.fields?.length) {
        err.fields.forEach((fe: FieldError) => setError(fe.field as keyof FarmerForm, { message: fe.message }));
      }
      setFormError(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Register Farmer" widthClass="max-w-2xl">
      {formError && (
        <div className="mb-4">
          <Alert tone="error">{formError}</Alert>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField label="Farmer Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" hasError={!!errors.name} placeholder="e.g. Basavaraj Patil" {...register('name')} />
          </FormField>

          <FormField label="Gender" htmlFor="gender" required error={errors.gender?.message}>
            <Select id="gender" hasError={!!errors.gender} defaultValue="" {...register('gender')}>
              <option value="" disabled>
                Select…
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </FormField>

          <FormField label="Aadhaar Number" htmlFor="aadhaar" required error={errors.aadhaarNumber?.message} hint="12 digits. Stored encrypted; shown masked.">
            <Input id="aadhaar" hasError={!!errors.aadhaarNumber} inputMode="numeric" maxLength={14} placeholder="XXXX XXXX XXXX" {...register('aadhaarNumber')} />
          </FormField>

          <FormField label="FID Number" htmlFor="fid" required error={errors.fid?.message}>
            <Input id="fid" hasError={!!errors.fid} placeholder="e.g. FID9876543210" {...register('fid')} />
          </FormField>

          <FormField label="Mobile Number" htmlFor="mobile" error={errors.mobile?.message}>
            <Input id="mobile" hasError={!!errors.mobile} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" {...register('mobile')} />
          </FormField>

          <FormField label="Village" htmlFor="village" error={errors.village?.message}>
            <Input id="village" {...register('village')} />
          </FormField>

          <FormField label="Taluk" htmlFor="taluk" error={errors.taluk?.message}>
            <Input id="taluk" {...register('taluk')} />
          </FormField>

          <FormField label="District" htmlFor="district" error={errors.district?.message}>
            <Input id="district" {...register('district')} />
          </FormField>
        </div>

        <FormField label="Address" htmlFor="address" error={errors.address?.message}>
          <TextArea id="address" rows={2} placeholder="Village, Taluk, District" {...register('address')} />
        </FormField>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save Farmer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
