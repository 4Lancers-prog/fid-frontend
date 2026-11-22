import { useEffect, useState, useCallback } from 'react';
import { useT } from '../../i18n';
import { Search } from 'lucide-react';
import { applicationsApi, type AppRow } from '../../services/admin.service';
import type { ApplicationStatus } from '../../types';
import { normaliseError } from '../../lib/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { TextArea } from '../../components/common/TextArea';
import { FormField } from '../../components/common/FormField';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { FullPageLoader } from '../../components/common/Spinner';
import { StatusBadge, STATUS_OPTIONS } from '../../components/common/StatusBadge';

const SERVICE_TYPES = [
  { value: '', label: 'All services' },
  { value: 'crop', label: 'Crop Insurance' },
  { value: 'vehicle', label: 'Vehicle Insurance' },
  { value: 'trailer', label: 'Trailer Certificate' },
  { value: 'loan', label: 'Loan Lead' },
];

const LIMIT = 15;

export function ApplicationsPage() {
  const t = useT();
  const [data, setData] = useState<{ items: AppRow[]; total: number } | null>(null);
  const [serviceType, setServiceType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [target, setTarget] = useState<AppRow | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await applicationsApi.list({
        serviceType: serviceType || undefined,
        status: status || undefined,
        search: search.trim() || undefined,
        page,
        limit: LIMIT,
      }));
    } catch (e) {
      setError(normaliseError(e).message);
    }
  }, [serviceType, status, search, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('page.applications.t')}</h1>
        <p className="text-sm text-slate-500">All service applications in one place. Filter, search and update statuses.</p>
      </div>

      {toast && <div className="mb-4"><Alert tone="success">{toast}</Alert></div>}
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}

      <Card className="mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search name or mobile…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="pl-9" />
          </div>
          <Select value={serviceType} onChange={(e) => { setPage(1); setServiceType(e.target.value); }} className="max-w-[200px]">
            {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="max-w-[180px]">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
      </Card>

      {!data ? (
        <FullPageLoader label="Loading applications…" />
      ) : data.items.length === 0 ? (
        <EmptyState title="No applications found" description="Applications across all service modules will appear here." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Mobile</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((row) => (
                  <tr key={`${row.serviceType}-${row.id}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{row.serviceLabel}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.mobile}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status as ApplicationStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setTarget(row)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>{data.total} application(s) · page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      <StatusModal
        target={target}
        onClose={() => setTarget(null)}
        onDone={() => { setTarget(null); load(); setToast('Status updated.'); setTimeout(() => setToast(null), 4000); }}
      />
    </div>
  );
}

function StatusModal({ target, onClose, onDone }: { target: AppRow | null; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<ApplicationStatus>('new');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (target) { setStatus(target.status as ApplicationStatus); setRemarks(target.remarks ?? ''); setError(null); } }, [target]);

  const save = async () => {
    if (!target) return;
    setSaving(true); setError(null);
    try {
      await applicationsApi.updateStatus(target.serviceType, target.id, status, remarks || undefined);
      onDone();
    } catch (e) { setError(normaliseError(e).message); } finally { setSaving(false); }
  };

  return (
    <Modal open={!!target} onClose={onClose} title={`Update — ${target?.name ?? ''}`}>
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}
      <FormField label="Status" htmlFor="a-status"><Select id="a-status" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></FormField>
      <FormField label="Remarks" htmlFor="a-remarks"><TextArea id="a-remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} loading={saving}>Save</Button>
      </div>
    </Modal>
  );
}
