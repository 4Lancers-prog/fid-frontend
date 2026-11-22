import { useEffect, useState, useCallback } from 'react';
import { useT } from '../../i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QrCode, Upload, CheckCircle2, XCircle, ShieldCheck, Wallet } from 'lucide-react';
import { paymentsApi, fileToDataUrl, type ActiveQr, type ManualPayment } from '../../services/payments.service';
import { rechargeSchema } from '../../schemas';
import type { FieldError } from '../../types';
import { normaliseError } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { TextArea } from '../../components/common/TextArea';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/common/Alert';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { FullPageLoader } from '../../components/common/Spinner';

function PaymentStatus({ status }: { status: ManualPayment['status'] }) {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-brand-100 text-brand-700',
    rejected: 'bg-red-100 text-red-700',
  } as const;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status]}`}>{status}</span>;
}

export function PaymentsPage() {
  const t = useT();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdmin = hasRole('super_admin', 'admin');
  const [tab, setTab] = useState<'recharge' | 'verify' | 'settings'>('recharge');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('page.payments.t')}</h1>
        <p className="text-sm text-slate-500">Recharge your wallet by scanning the QR and submitting the transaction reference.</p>
      </div>

      {isAdmin && (
        <div className="mb-5 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {(['recharge', 'verify', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-3 py-2 font-medium capitalize transition ${
                tab === t ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t === 'verify' ? 'Verify Payments' : t === 'settings' ? 'QR Settings' : 'Recharge'}
            </button>
          ))}
        </div>
      )}

      {tab === 'recharge' && <RechargeTab />}
      {tab === 'verify' && isAdmin && <VerifyTab />}
      {tab === 'settings' && isAdmin && <SettingsTab />}
    </div>
  );
}

function RechargeTab() {
  const [qr, setQr] = useState<ActiveQr | null>(null);
  const [mine, setMine] = useState<ManualPayment[]>([]);
  const [proof, setProof] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ amountRupees: number; utr: string }>({ resolver: zodResolver(rechargeSchema as never) });

  const loadMine = useCallback(async () => {
    try {
      const res = await paymentsApi.mine();
      setMine(res.items);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    paymentsApi.getActiveQr().then(setQr).catch(() => setQr({ active: false }));
    loadMine();
  }, [loadMine]);

  const onProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setFormError('This file format is not supported. Upload a JPG, JPEG, PNG or WEBP image.');
      return;
    }
    setProof(await fileToDataUrl(file));
  };

  const onSubmit = async (values: { amountRupees: number; utr: string }) => {
    setFormError(null);
    setSuccess(null);
    try {
      await paymentsApi.submit({ ...values, proof });
      setSuccess('Your payment request has been submitted and is waiting for administrator verification. Your wallet will be credited after approval.');
      reset();
      setProof(undefined);
      loadMine();
    } catch (e) {
      const err = normaliseError(e);
      err.fields?.forEach((fe: FieldError) => setError(fe.field as 'utr' | 'amountRupees', { message: fe.message }));
      setFormError(err.message);
    }
  };

  if (!qr) return <FullPageLoader label="Loading payment details…" />;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
          <QrCode className="h-4 w-4" /> Scan &amp; Pay
        </h2>
        {!qr.active ? (
          <Alert tone="warning">No active payment method is configured yet. Please contact your administrator.</Alert>
        ) : (
          <div className="text-center">
            {qr.qrImage ? (
              <img src={qr.qrImage} alt="Payment QR" className="mx-auto h-48 w-48 rounded-lg border border-slate-200 object-contain" />
            ) : (
              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400">
                <QrCode className="h-10 w-10" />
              </div>
            )}
            {qr.businessName && <p className="mt-3 font-semibold text-slate-700">{qr.businessName}</p>}
            {qr.upiId && <p className="text-sm text-slate-500">UPI: {qr.upiId}</p>}
            {qr.instructions && <p className="mt-2 text-xs text-slate-500">{qr.instructions}</p>}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-bold text-slate-700">Submit Payment Details</h2>
        {success && (
          <div className="mb-3">
            <Alert tone="success">{success}</Alert>
          </div>
        )}
        {formError && (
          <div className="mb-3">
            <Alert tone="error">{formError}</Alert>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Amount (₹)" htmlFor="amount" required error={errors.amountRupees?.message}>
            <Input id="amount" type="number" step="1" hasError={!!errors.amountRupees} placeholder="e.g. 500" {...register('amountRupees')} />
          </FormField>
          <FormField label="UTR / Transaction Reference" htmlFor="utr" required error={errors.utr?.message} hint="Found in your UPI app after payment.">
            <Input id="utr" hasError={!!errors.utr} placeholder="e.g. 4567XXXX1234" {...register('utr')} />
          </FormField>
          <FormField label="Payment Screenshot (optional)" htmlFor="proof">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
              <Upload className="h-4 w-4" /> {proof ? 'Screenshot attached' : 'Upload screenshot'}
              <input id="proof" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onProof} />
            </label>
          </FormField>
          <Button type="submit" className="mt-2 w-full" loading={isSubmitting} disabled={!qr.active}>
            Submit for Verification
          </Button>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="mb-3 text-sm font-bold text-slate-700">My Recharge Requests</h2>
        {mine.length === 0 ? (
          <EmptyState title="No requests yet" description="Your submitted recharge requests will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {mine.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">₹{p.amountRupees.toFixed(2)} · UTR {p.utr}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(p.createdAt).toLocaleString()}
                    {p.remarks ? ` · ${p.remarks}` : ''}
                  </p>
                </div>
                <PaymentStatus status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function VerifyTab() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<ManualPayment[] | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ManualPayment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(null);
    try {
      const res = await paymentsApi.list(status || undefined);
      setItems(res.items);
    } catch (e) {
      setError(normaliseError(e).message);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 4000);
  };

  const approve = async (p: ManualPayment) => {
    setBusyId(p.id);
    setError(null);
    try {
      await paymentsApi.approve(p.id);
      showToast(`Approved ₹${p.amountRupees.toFixed(2)} — wallet credited.`);
      load();
    } catch (e) {
      setError(normaliseError(e).message);
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    setError(null);
    try {
      await paymentsApi.reject(rejectTarget.id, rejectReason);
      showToast('Payment rejected.');
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (e) {
      setError(normaliseError(e).message);
    } finally {
      setBusyId(null);
    }
  };

  const userName = (u: ManualPayment['user']) => (typeof u === 'object' && u ? u.name : '—');

  return (
    <div>
      {toast && (
        <div className="mb-4">
          <Alert tone="success">{toast}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="mb-4 flex gap-2">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize ${
              status === s ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {s || 'all'}
          </button>
        ))}
      </div>

      {!items ? (
        <FullPageLoader label="Loading requests…" />
      ) : items.length === 0 ? (
        <EmptyState title="No payment requests" description="Requests matching this filter will appear here." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">UTR</th>
                  <th className="px-4 py-3 font-semibold">Proof</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{userName(p.user)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">₹{p.amountRupees.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.utr}</td>
                    <td className="px-4 py-3">
                      {p.proof ? (
                        <a href={p.proof} target="_blank" rel="noreferrer" className="text-sky-600 underline">
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatus status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => approve(p)}
                            disabled={busyId === p.id}
                            className="inline-flex items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(p)}
                            disabled={busyId === p.id}
                            className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">{p.remarks || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject payment">
        <FormField label="Reason for rejection" htmlFor="reason" required>
          <TextArea id="reason" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. UTR not found in bank statement" />
        </FormField>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setRejectTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={doReject} loading={busyId === rejectTarget?.id} disabled={rejectReason.trim().length < 3}>
            Confirm Reject
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SettingsTab() {
  const [form, setForm] = useState({ qrImage: '', upiId: '', businessName: '', instructions: '', registrationFeeRupees: '', active: false });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    paymentsApi
      .getSettings()
      .then((s) => {
        if (s) setForm({ qrImage: s.qrImage ?? '', upiId: s.upiId ?? '', businessName: s.businessName ?? '', instructions: s.instructions ?? '', registrationFeeRupees: s.registrationFeePaise ? String(s.registrationFeePaise / 100) : '', active: !!s.active });
      })
      .finally(() => setLoaded(true));
  }, []);

  const onQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setError('Please upload a valid QR image (JPG, JPEG, PNG or WEBP).');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setForm((f) => ({ ...f, qrImage: dataUrl }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await paymentsApi.updateSettings({ ...form, registrationFeeRupees: form.registrationFeeRupees ? Number(form.registrationFeeRupees) : 0 });
      setToast('Payment settings saved.');
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setError(normaliseError(e).message);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <FullPageLoader label="Loading settings…" />;

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
        <ShieldCheck className="h-4 w-4" /> Admin QR / Payment Settings
      </h2>
      {toast && (
        <div className="mb-4">
          <Alert tone="success">{toast}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <FormField label="Payment QR Image" htmlFor="qr">
        <div className="flex items-center gap-4">
          {form.qrImage ? (
            <img src={form.qrImage} alt="QR preview" className="h-24 w-24 rounded-lg border border-slate-200 object-contain" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400">
              <QrCode className="h-8 w-8" />
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Upload / Replace
            <input id="qr" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onQr} />
          </label>
        </div>
      </FormField>

      <FormField label="UPI ID" htmlFor="upi">
        <Input id="upi" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} placeholder="name@bank" />
      </FormField>
      <FormField label="Business / Account Display Name" htmlFor="biz">
        <Input id="biz" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
      </FormField>
      <FormField label="Payment Instructions" htmlFor="instr">
        <TextArea id="instr" rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
      </FormField>

      <FormField label="Registration Fee (₹, optional)" htmlFor="regfee" hint="Shown to new users on the registration page.">
        <Input id="regfee" type="number" value={form.registrationFeeRupees} onChange={(e) => setForm({ ...form, registrationFeeRupees: e.target.value })} placeholder="e.g. 100" />
      </FormField>

      <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
        Active (show this QR to users on the recharge screen)
      </label>

      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-slate-400" />
        <Button onClick={save} loading={saving}>
          Save Settings
        </Button>
      </div>
    </Card>
  );
}
