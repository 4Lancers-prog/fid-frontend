import { useEffect, useState, useCallback } from 'react';
import { useT } from '../../i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Wallet, ShieldCheck, ScrollText, ClipboardCheck, CheckCircle2, XCircle, ListChecks } from 'lucide-react';
import { usersApi, auditApi, serviceSettingsApi, type AuditEntry } from '../../services/admin.service';
import { createUserSchema } from '../../schemas';
import type { User, UserRole, FieldError } from '../../types';
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

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'operator', label: 'Operator' },
  { value: 'loan_executive', label: 'Loan Executive' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'customer', label: 'Customer' },
];
const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;

export function AdminPage() {
  const t = useT();
  const [tab, setTab] = useState<'users' | 'registrations' | 'services' | 'audit'>('registrations');
  const tabCls = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 font-medium ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`;
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('page.admin.t')}</h1>
        <p className="text-sm text-slate-500">Approve registrations, manage users and review the audit trail.</p>
      </div>
      <div className="mb-5 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm">
        <button onClick={() => setTab('registrations')} className={tabCls(tab === 'registrations')}>
          <ClipboardCheck className="h-4 w-4" /> Registrations
        </button>
        <button onClick={() => setTab('users')} className={tabCls(tab === 'users')}>
          <ShieldCheck className="h-4 w-4" /> Users &amp; Roles
        </button>
        <button onClick={() => setTab('services')} className={tabCls(tab === 'services')}>
          <ListChecks className="h-4 w-4" /> Services
        </button>
        <button onClick={() => setTab('audit')} className={tabCls(tab === 'audit')}>
          <ScrollText className="h-4 w-4" /> Audit Log
        </button>
      </div>
      {tab === 'registrations' ? <RegistrationsTab /> : tab === 'users' ? <UsersTab /> : tab === 'services' ? <ServicesTab /> : <AuditTab />}
    </div>
  );
}

function RegistrationsTab() {
  const [items, setItems] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<string, UserRole>>({});
  const [proof, setProof] = useState<{ name: string; img?: string; utr?: string; amount?: number } | null>(null);
  const [proofLoading, setProofLoading] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await usersApi.list({ approvalStatus: 'pending', limit: 100 });
      setItems(res.items);
    } catch (e) {
      setError(normaliseError(e).message);
    }
  };
  useEffect(() => { load(); }, []);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000); };

  const approve = async (u: User) => {
    setBusyId(u.id); setError(null);
    try {
      await usersApi.approve(u.id, roles[u.id] ?? 'customer');
      showToast(`Approved ${u.name}.`);
      load();
    } catch (e) { setError(normaliseError(e).message); } finally { setBusyId(null); }
  };
  const reject = async (u: User) => {
    setBusyId(u.id); setError(null);
    try {
      await usersApi.reject(u.id);
      showToast(`Rejected ${u.name}.`);
      load();
    } catch (e) { setError(normaliseError(e).message); } finally { setBusyId(null); }
  };
  const viewProof = async (u: User) => {
    setProofLoading(true);
    try {
      const full = await usersApi.get(u.id);
      setProof({ name: u.name, img: full.registrationPaymentProof, utr: u.registrationPaymentUtr, amount: full.registrationPaymentAmountRupees });
    } catch (e) { setError(normaliseError(e).message); } finally { setProofLoading(false); }
  };

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!items) return <FullPageLoader label="Loading registrations…" />;

  return (
    <div>
      {toast && <div className="mb-4"><Alert tone="success">{toast}</Alert></div>}
      {items.length === 0 ? (
        <EmptyState title="No pending registrations" description="New sign-ups awaiting approval will appear here." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Mobile</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Approve as</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.mobile || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {u.registrationPaymentUtr ? (
                        <button onClick={() => viewProof(u)} className="text-sky-600 underline">
                          {u.registrationPaymentUtr}{u.registrationPaymentAmountRupees ? ` · ₹${u.registrationPaymentAmountRupees}` : ''}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Select value={roles[u.id] ?? 'customer'} onChange={(e) => setRoles((r) => ({ ...r, [u.id]: e.target.value as UserRole }))} className="max-w-[160px]">
                        {ROLES.filter((r) => r.value !== 'super_admin').map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => approve(u)} disabled={busyId === u.id} className="inline-flex items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => reject(u)} disabled={busyId === u.id} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState<{ items: User[]; total: number } | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [walletTarget, setWalletTarget] = useState<User | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await usersApi.list({ search: search.trim() || undefined, role: roleFilter || undefined, limit: 50 }));
    } catch (e) {
      setError(normaliseError(e).message);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div>
      {toast && <div className="mb-4"><Alert tone="success">{toast}</Alert></div>}
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-[200px] flex-1" />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="max-w-[200px]">
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New User</Button>
        </div>
      </Card>

      {!data ? (
        <FullPageLoader label="Loading users…" />
      ) : data.items.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3"><Badge tone="sky">{roleLabel(u.role)}</Badge></td>
                    <td className="px-4 py-3">{u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditTarget(u)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"><Pencil className="h-3 w-3" /> Edit</button>
                        <button onClick={() => setWalletTarget(u)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"><Wallet className="h-3 w-3" /> Top-up</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); showToast('User created.'); }} />
      <EditUserModal target={editTarget} onClose={() => setEditTarget(null)} onDone={() => { setEditTarget(null); load(); showToast('User updated.'); }} />
      <WalletModal target={walletTarget} onClose={() => setWalletTarget(null)} onDone={() => { setWalletTarget(null); showToast('Wallet adjusted.'); }} />
    </div>
  );
}

function CreateUserModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<{ name: string; email: string; password: string; role: UserRole }>({ resolver: zodResolver(createUserSchema as never) });
  useEffect(() => { if (open) { reset(); setFormError(null); } }, [open, reset]);

  const onSubmit = async (v: { name: string; email: string; password: string; role: UserRole }) => {
    setFormError(null);
    try {
      await usersApi.create(v);
      onDone();
    } catch (e) {
      const err = normaliseError(e);
      err.fields?.forEach((fe: FieldError) => setError(fe.field as 'email' | 'name' | 'password' | 'role', { message: fe.message }));
      setFormError(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create User">
      {formError && <div className="mb-4"><Alert tone="error">{formError}</Alert></div>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Name" htmlFor="u-name" required error={errors.name?.message}><Input id="u-name" hasError={!!errors.name} {...register('name')} /></FormField>
        <FormField label="Email" htmlFor="u-email" required error={errors.email?.message}><Input id="u-email" type="email" hasError={!!errors.email} {...register('email')} /></FormField>
        <FormField label="Temporary Password" htmlFor="u-pass" required error={errors.password?.message} hint="At least 8 characters with a letter and a number."><Input id="u-pass" type="text" hasError={!!errors.password} {...register('password')} /></FormField>
        <FormField label="Role" htmlFor="u-role" required error={errors.role?.message}>
          <Select id="u-role" defaultValue="" hasError={!!errors.role} {...register('role')}>
            <option value="" disabled>Select…</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </FormField>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ target, onClose, onDone }: { target: User | null; onClose: () => void; onDone: () => void }) {
  const [role, setRole] = useState<UserRole>('operator');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (target) { setRole(target.role); setIsActive(target.isActive); setError(null); } }, [target]);

  const save = async () => {
    if (!target) return;
    setSaving(true); setError(null);
    try {
      await usersApi.update(target.id, { role, isActive });
      onDone();
    } catch (e) { setError(normaliseError(e).message); } finally { setSaving(false); }
  };

  return (
    <Modal open={!!target} onClose={onClose} title={`Edit ${target?.name ?? ''}`}>
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}
      <FormField label="Role" htmlFor="e-role"><Select id="e-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></FormField>
      <label className="mb-4 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" /> Account active</label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} loading={saving}>Save</Button>
      </div>
    </Modal>
  );
}

function WalletModal({ target, onClose, onDone }: { target: User | null; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (target) { setAmount(''); setReason(''); setError(null); } }, [target]);

  const save = async () => {
    if (!target) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Enter an amount greater than zero.'); return; }
    if (reason.trim().length < 3) { setError('Please provide a reason for this adjustment.'); return; }
    setSaving(true); setError(null);
    try {
      await usersApi.adjustWallet(target.id, amt, 'credit', reason.trim());
      onDone();
    } catch (e) { setError(normaliseError(e).message); } finally { setSaving(false); }
  };

  return (
    <Modal open={!!target} onClose={onClose} title={`Top up wallet — ${target?.name ?? ''}`}>
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}
      <FormField label="Amount to credit (₹)" htmlFor="w-amt" required><Input id="w-amt" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></FormField>
      <FormField label="Reason" htmlFor="w-reason" required hint="Recorded in the audit trail."><TextArea id="w-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} loading={saving}>Credit Wallet</Button>
      </div>
    </Modal>
  );
}


function ServicesTab() {
  const SERVICES: { key: string; label: string; desc: string }[] = [
    { key: 'crop', label: 'Crop Insurance', desc: 'Let customers create crop insurance applications.' },
    { key: 'vehicle', label: 'Vehicle Insurance', desc: 'Let customers create vehicle insurance applications.' },
    { key: 'trailer', label: 'Usha Tailoring Certificate', desc: 'Let customers apply for Usha tailoring certificates.' },
    { key: 'loan', label: 'Loan', desc: 'Let customers submit loan applications.' },
  ];
  const [enabled, setEnabled] = useState<Record<string, boolean> | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    serviceSettingsApi.get().then((r) => setEnabled(r.enabledServices)).catch((e) => setError(normaliseError(e).message));
  }, []);

  const save = async () => {
    if (!enabled) return;
    setSaving(true); setError(null);
    try {
      await serviceSettingsApi.update(enabled);
      setToast('Services updated.'); setTimeout(() => setToast(null), 4000);
    } catch (e) { setError(normaliseError(e).message); } finally { setSaving(false); }
  };

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!enabled) return <FullPageLoader label="Loading services…" />;

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-1 text-sm font-bold text-slate-700">Applications available to customers</h2>
      <p className="mb-4 text-xs text-slate-500">Turn a service on to let customers create and upload that application type. Operators and admins can always use every service.</p>
      {toast && <div className="mb-4"><Alert tone="success">{toast}</Alert></div>}
      <div className="space-y-2">
        {SERVICES.map((svc) => (
          <label key={svc.key} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-slate-800">{svc.label}</div>
              <div className="text-xs text-slate-500">{svc.desc}</div>
            </div>
            <input
              type="checkbox"
              checked={!!enabled[svc.key]}
              onChange={(e) => setEnabled((p) => ({ ...(p ?? {}), [svc.key]: e.target.checked }))}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
        ))}
      </div>
      <div className="mt-4"><Button onClick={save} loading={saving}>Save</Button></div>
    </Card>
  );
}

function AuditTab() {
  const [items, setItems] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auditApi.list({ limit: 50 }).then((r) => setItems(r.items)).catch((e) => setError(normaliseError(e).message));
  }, []);

  const actorName = (a: AuditEntry) => (typeof a.actor === 'object' && a.actor ? a.actor.name : a.actorName || 'System');

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!items) return <FullPageLoader label="Loading audit log…" />;
  if (items.length === 0) return <EmptyState title="No audit entries yet" description="Sensitive actions (user changes, payment approvals, wallet adjustments) will appear here." />;

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((a) => (
              <tr key={a._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-700">{actorName(a)}</td>
                <td className="px-4 py-3"><Badge tone="slate">{a.action}</Badge></td>
                <td className="px-4 py-3 text-xs text-slate-500">{a.targetType ? `${a.targetType}` : '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{a.meta ? JSON.stringify(a.meta) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
