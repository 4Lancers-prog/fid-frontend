import { useEffect, useRef, useState, useCallback } from 'react';
import { useT } from '../../i18n';
import { Camera, Upload, FileText, Trash2, X, Eye } from 'lucide-react';
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
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/common/Alert';
import { EmptyState } from '../../components/common/EmptyState';
import { FullPageLoader } from '../../components/common/Spinner';

interface Selected {
  file: File;
  dataUrl: string;
}

export function DocumentScannerPage() {
  const t = useT();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canUpload = hasRole('admin', 'operator');

  const [selected, setSelected] = useState<Selected | null>(null);
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [docs, setDocs] = useState<DocumentMeta[] | null>(null);
  const [preview, setPreview] = useState<{ meta: DocumentMeta; data: string } | null>(null);

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
  }, [loadDocs]);

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

              <FormField label="Category / Label (optional)" htmlFor="cat">
                <Input id="cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Aadhaar, Land record, Photo" />
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
