import { useEffect, useRef, useState, useCallback } from 'react';
import { useT } from '../../i18n';
import { Camera, Upload, FileText, Trash2, X, Eye, ScanLine, CheckCircle2, QrCode, RefreshCw, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { createUploadSession, getUploadSession, clearSession, type TempDoc } from '../../services/upload.service';
import {
  documentsApi,
  fileToDataUrl,
  validateDocFile,
  formatBytes,
  type DocumentMeta,
} from '../../services/documents.service';
import { normaliseError } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { FullPageLoader } from '../../components/common/Spinner';

interface Selected {
  file: File;
  dataUrl: string;
}

const REQUIRED_DOCS: { key: string; label: string }[] = [
  { key: 'Aadhaar', label: 'Aadhaar card' },
  { key: 'PAN', label: 'PAN card' },
  { key: 'RC', label: 'RC (vehicle)' },
  { key: 'Photo', label: 'Passport photo' },
  { key: 'Land record', label: 'Land record' },
];

export function DocumentScannerPage() {
  const t = useT();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canUpload = hasRole('admin', 'operator', 'customer');

  const [selected, setSelected] = useState<Selected | null>(null);
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [docs, setDocs] = useState<DocumentMeta[] | null>(null);
  const [preview, setPreview] = useState<{ meta: DocumentMeta; data: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [tempDocs, setTempDocs] = useState<TempDoc[]>([]);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    try {
      setDocs((await documentsApi.list()).items);
    } catch (e) {
      setError(normaliseError(e).message);
    }
  }, []);

  useEffect(() => {
    loadDocs();
    // Poll so documents uploaded from the phone appear here automatically.
    const id = setInterval(loadDocs, 5000);
    return () => clearInterval(id);
  }, [loadDocs]);

  const makeQr = useCallback(async () => {
    setQrError(null);
    try {
      const { token } = await createUploadSession();
      setSessionToken(token);
      setTempDocs([]);
      const url = `${window.location.origin}/upload?token=${encodeURIComponent(token)}`;
      setQrDataUrl(await QRCode.toDataURL(url, { width: 220, margin: 1 }));
    } catch (e) {
      setQrError(normaliseError(e).message);
    }
  }, []);

  useEffect(() => {
    if (canUpload) makeQr();
  }, [canUpload, makeQr]);

  useEffect(() => {
    if (!sessionToken) return;
    let active = true;
    const poll = async () => {
      try {
        const info = await getUploadSession(sessionToken);
        if (active) setTempDocs(info.documents);
      } catch {
        /* session may have expired */
      }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [sessionToken]);

  const printTemp = () => {
    if (tempDocs.length === 0) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const body = tempDocs
      .map((d) =>
        d.data.startsWith('data:application/pdf')
          ? `<iframe src="${d.data}" style="width:100%;height:100vh;border:0;page-break-after:always"></iframe>`
          : `<img src="${d.data}" style="display:block;width:100%;page-break-after:always;object-fit:contain" />`,
      )
      .join('');
    w.document.write(`<html><head><title>Print documents</title></head><body style="margin:0">${body}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  };

  const clearTemp = async () => {
    if (!sessionToken) return;
    try {
      await clearSession(sessionToken);
      setTempDocs([]);
      setToast('Uploaded documents cleared.');
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(normaliseError(e).message);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setError(null);
    const validationError = validateDocFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setSelected({ file, dataUrl });
    } catch (err) {
      setError(normaliseError(err).message);
    }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await documentsApi.create({ fileName: selected.file.name, data: selected.dataUrl, category: category.trim() || undefined });
      setSelected(null);
      setCategory('');
      setToast('Document uploaded successfully.');
      setTimeout(() => setToast(null), 4000);
      loadDocs();
    } catch (e) {
      setError(normaliseError(e).message);
    } finally {
      setSaving(false);
    }
  };

  const view = async (meta: DocumentMeta) => {
    try {
      const full = await documentsApi.get(meta.id);
      setPreview({ meta, data: full.data });
    } catch (e) {
      setError(normaliseError(e).message);
    }
  };

  const del = async (id: string) => {
    try {
      await documentsApi.remove(id);
      loadDocs();
    } catch (e) {
      setError(normaliseError(e).message);
    }
  };

  // Guided scan: each required document is uploaded pre-tagged with the right type.
  const guidedRef = useRef<HTMLInputElement>(null);
  const [scanType, setScanType] = useState<string | null>(null);
  const startScan = (type: string) => {
    setError(null);
    setScanType(type);
    setTimeout(() => guidedRef.current?.click(), 0);
  };
  const onGuidedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !scanType) return;
    const validationError = validateDocFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      await documentsApi.create({ fileName: file.name, data: dataUrl, category: scanType });
      setToast(`${scanType} uploaded and filed correctly.`);
      setTimeout(() => setToast(null), 4000);
      loadDocs();
    } catch (err) {
      setError(normaliseError(err).message);
    } finally {
      setScanType(null);
    }
  };

  const isImage = selected?.file.type.startsWith('image/');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('page.documents.t')}</h1>
        <p className="text-sm text-slate-500">Capture with your camera or upload JPG, JPEG, PNG or PDF files (up to 8 MB).</p>
      </div>

      {toast && <div className="mb-4"><Alert tone="success">{toast}</Alert></div>}
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}

      {canUpload && (
        <Card className="mb-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="flex h-[232px] w-[232px] flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
              {qrError ? (
                <span className="px-3 text-center text-xs text-red-500">{qrError}</span>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan to upload" className="h-full w-full" />
              ) : (
                <QrCode className="h-16 w-16 text-slate-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><QrCode className="h-5 w-5" /> Upload documents to print</h2>
              <p className="mt-1 text-sm text-slate-500">Scan this QR with a phone camera, photograph the documents, and they appear here to print. These are <strong>temporary</strong> — not saved — and can be cleared after printing.</p>
              <button onClick={makeQr} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <RefreshCw className="h-3.5 w-3.5" /> New QR code
              </button>
              <p className="mt-2 text-xs text-slate-400">The link expires after 2 hours.</p>

              {tempDocs.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tempDocs.length} uploaded</span>
                    <div className="flex gap-2">
                      <button onClick={printTemp} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
                        <Printer className="h-3.5 w-3.5" /> Print all
                      </button>
                      <button onClick={clearTemp} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" /> Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {tempDocs.map((d) => (
                      <div key={d.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        {d.data.startsWith('data:application/pdf') ? (
                          <div className="flex h-20 items-center justify-center text-slate-400"><FileText className="h-7 w-7" /></div>
                        ) : (
                          <img src={d.data} alt={d.fileName} className="h-20 w-full object-cover" />
                        )}
                        {d.category && <div className="truncate bg-white px-1.5 py-1 text-center text-[10px] font-medium text-slate-600">{d.category}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {canUpload && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Or scan / upload directly on this device</div>
      )}

      {canUpload && (
        <Card className="mb-6">
          <input ref={guidedRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={onGuidedFile} />
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-700">
            <ScanLine className="h-4 w-4" /> Scan your documents
          </h2>
          <p className="mb-4 text-xs text-slate-500">Tap a document, scan it with your phone camera, and it's filed under the correct type automatically — ready to attach to any application.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REQUIRED_DOCS.map((r) => {
              const existing = (docs ?? []).find((d) => d.category === r.key);
              return (
                <div key={r.key} className={`rounded-xl border p-3 ${existing ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200'}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                    {existing ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><CheckCircle2 className="h-3.5 w-3.5" /> Uploaded</span>
                    ) : (
                      <span className="text-xs text-slate-400">Not uploaded</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startScan(r.key)}
                      disabled={scanType === r.key}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      <Camera className="h-3.5 w-3.5" /> {existing ? 'Rescan / Replace' : 'Scan / Upload'}
                    </button>
                    {existing && (
                      <button onClick={() => view(existing)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-2 text-slate-500 hover:bg-slate-50" aria-label="View">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {canUpload && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Or upload any other document</div>
      )}

      {canUpload && (
        <Card className="mb-6">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={onFile} />

          {!selected ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => cameraRef.current?.click()} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-10 text-slate-500 hover:border-brand-400 hover:bg-brand-50/40">
                <Camera className="h-8 w-8" />
                <span className="text-sm font-medium">Take photo</span>
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-10 text-slate-500 hover:border-brand-400 hover:bg-brand-50/40">
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Upload file</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {isImage ? (
                    <img src={selected.dataUrl} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-10 w-10 text-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{selected.file.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(selected.file.size)} · {selected.file.type || 'unknown'}</p>
                  <button onClick={() => { setSelected(null); setError(null); }} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                    <X className="h-3 w-3" /> Clear / replace
                  </button>
                </div>
              </div>

              <FormField label="Document type" htmlFor="cat">
                <Select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select type…</option>
                  <option value="Aadhaar">Aadhaar card</option>
                  <option value="PAN">PAN card</option>
                  <option value="RC">RC (vehicle)</option>
                  <option value="Photo">Photo</option>
                  <option value="Land record">Land record</option>
                  <option value="Other">Other</option>
                </Select>
              </FormField>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setSelected(null); setCategory(''); }}>Cancel</Button>
                <Button onClick={save} loading={saving}>Upload Document</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <h2 className="mb-3 text-sm font-bold text-slate-700">My Documents</h2>
      {!docs ? (
        <FullPageLoader label="Loading documents…" />
      ) : docs.length === 0 ? (
        <EmptyState title="No documents yet" description="Captured or uploaded documents will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <Card key={d.id} className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                {d.mimeType === 'application/pdf' ? <FileText className="h-6 w-6 text-red-500" /> : <FileText className="h-6 w-6 text-sky-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{d.fileName}</p>
                <p className="text-xs text-slate-400">{d.category ? `${d.category} · ` : ''}{formatBytes(d.sizeBytes)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => view(d)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600" aria-label="View"><Eye className="h-4 w-4" /></button>
                {canUpload && <button onClick={() => del(d.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="truncate text-sm font-semibold text-slate-800">{preview.meta.fileName}</p>
              <button onClick={() => setPreview(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {preview.meta.mimeType === 'application/pdf' ? (
              <iframe title={preview.meta.fileName} src={preview.data} className="h-[70vh] w-full rounded border border-slate-200" />
            ) : (
              <img src={preview.data} alt={preview.meta.fileName} className="mx-auto max-h-[70vh] rounded" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
