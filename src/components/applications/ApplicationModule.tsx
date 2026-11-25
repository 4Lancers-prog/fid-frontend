import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { Plus, Search, Pencil } from 'lucide-react';
import type { ModuleApi } from '../../services/applications.service';
import type { ServiceApplication, ApplicationStatus, FieldError, UserRole } from '../../types';
import { normaliseError } from '../../lib/api';
import { documentsApi, type DocumentMeta, formatBytes } from '../../services/documents.service';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { TextArea } from '../common/TextArea';
import { FormField } from '../common/FormField';
import { Modal } from '../common/Modal';
import { Alert } from '../common/Alert';
import { EmptyState } from '../common/EmptyState';
import { FullPageLoader } from '../common/Spinner';
import { StatusBadge, STATUS_OPTIONS } from '../common/StatusBadge';
import { useAuthStore } from '../../store/authStore';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'tel' | 'textarea' | 'select' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  full?: boolean;
}

export interface ColumnConfig {
  key: string;
  label: string;
  render?: (row: ServiceApplication) => ReactNode;
}

interface Props {
  title: string;
  description: string;
  api: ModuleApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<any>;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  createRoles: UserRole[];
  createLabel?: string;
}

const LIMIT = 10;

export function ApplicationModule({ title, description, api, schema, fields, columns, createRoles, createLabel }: Props) {
  const hasRole = useAuthStore((s) => s.hasRole);
  const canCreate = hasRole(...createRoles);
  const canEditStatus = hasRole('admin', 'operator', 'loan_executive'); // not customers

  const [data, setData] = useState<{ items: ServiceApplication[]; total: number } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ServiceApplication | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await api.list({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        limit: LIMIT,
      });
      setData(res);
    } catch (e) {
      setListError(normaliseError(e).message);
    } finally {
      setLoading(false);
    }
  }, [api, search, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> {createLabel ?? 'New'}
          </Button>
        )}
      </div>

      {toast && (
        <div className="mb-4">
          <Alert tone="success">{toast}</Alert>
        </div>
      )}

      <Card className="mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="max-w-[200px]"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {listError ? (
        <Alert tone="error">{listError}</Alert>
      ) : loading && !data ? (
        <FullPageLoader label="Loading…" />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title="No records found"
          description={search || statusFilter ? 'No records match your filters.' : 'Create your first record to get started.'}
          action={canCreate ? <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> {createLabel ?? 'New'}</Button> : undefined}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 font-semibold">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-slate-700">
                        {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEditStatus && (
                        <button
                          onClick={() => setStatusTarget(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <Pencil className="h-3 w-3" /> Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>
              {data?.total ?? 0} record(s) · page {page} of {totalPages}
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

      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={createLabel ?? 'New record'}
        api={api}
        schema={schema}
        fields={fields}
        onCreated={() => {
          setCreateOpen(false);
          setPage(1);
          load();
          showToast('Record created successfully.');
        }}
      />

      <StatusModal
        target={statusTarget}
        api={api}
        onClose={() => setStatusTarget(null)}
        onUpdated={() => {
          setStatusTarget(null);
          load();
          showToast('Status updated.');
        }}
      />
    </div>
  );
}

function CreateModal({
  open,
  onClose,
  title,
  api,
  schema,
  fields,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  api: ModuleApi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<any>;
  fields: FieldConfig[];
  onCreated: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Record<string, boolean>>({});
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<Record<string, any>>({ resolver: zodResolver(schema as never) });

  useEffect(() => {
    if (open) {
      reset();
      setFormError(null);
      setSelectedDocs({});
      documentsApi.list().then((r) => setDocs(r.items)).catch(() => setDocs([]));
    }
  }, [open, reset]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (values: Record<string, any>) => {
    setFormError(null);
    const documents = Object.keys(selectedDocs).filter((id) => selectedDocs[id]);
    try {
      await api.create({ ...values, documents });
      onCreated();
    } catch (e) {
      const err = normaliseError(e);
      err.fields?.forEach((fe: FieldError) => setError(fe.field, { message: fe.message }));
      setFormError(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} widthClass="max-w-2xl">
      {formError && (
        <div className="mb-4">
          <Alert tone="error">{formError}</Alert>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {fields.map((f) => {
            const error = errors[f.name]?.message as string | undefined;
            return (
              <div key={f.name} className={f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <FormField label={f.label} htmlFor={f.name} required={f.required} error={error}>
                  {f.type === 'select' ? (
                    <Select id={f.name} hasError={!!error} defaultValue="" {...register(f.name)}>
                      <option value="" disabled>
                        Select…
                      </option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  ) : f.type === 'textarea' ? (
                    <TextArea id={f.name} rows={2} hasError={!!error} placeholder={f.placeholder} {...register(f.name)} />
                  ) : (
                    <Input
                      id={f.name}
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'tel' ? 'tel' : 'text'}
                      hasError={!!error}
                      placeholder={f.placeholder}
                      {...register(f.name)}
                    />
                  )}
                </FormField>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-bold text-slate-700">Attach documents (optional)</p>
          {docs.length === 0 ? (
            <p className="text-xs text-slate-500">You have no saved documents yet. Upload Aadhaar, PAN, RC etc. in the Document Scanner — they'll appear here to attach.</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {docs.map((d) => (
                <label key={d.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={!!selectedDocs[d.id]}
                    onChange={(e) => setSelectedDocs((p) => ({ ...p, [d.id]: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                  <span className="truncate font-medium text-slate-700">{d.category ? `${d.category} · ` : ''}{d.fileName}</span>
                  <span className="ml-auto text-slate-400">{formatBytes(d.sizeBytes)}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function StatusModal({
  target,
  api,
  onClose,
  onUpdated,
}: {
  target: ServiceApplication | null;
  api: ModuleApi;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState<ApplicationStatus>('new');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setStatus(target.status);
      setRemarks(target.remarks ?? '');
      setError(null);
    }
  }, [target]);

  const save = async () => {
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateStatus(target.id, status, remarks || undefined);
      onUpdated();
    } catch (e) {
      setError(normaliseError(e).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!target} onClose={onClose} title="Update status">
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <FormField label="Status" htmlFor="status">
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Remarks" htmlFor="remarks">
        <TextArea id="remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </FormField>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
