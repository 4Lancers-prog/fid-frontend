import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScanLine, Camera, CheckCircle2, Sprout } from 'lucide-react';
import { getUploadSession, uploadViaToken, type UploadSessionInfo } from '../../services/upload.service';
import { validateDocFile, fileToDataUrl, type DocumentMeta } from '../../services/documents.service';
import { normaliseError } from '../../lib/api';
import { Alert } from '../../components/common/Alert';
import { FullPageLoader } from '../../components/common/Spinner';

const REQUIRED_DOCS: { key: string; label: string }[] = [
  { key: 'Aadhaar', label: 'Aadhaar card' },
  { key: 'PAN', label: 'PAN card' },
  { key: 'RC', label: 'RC (vehicle)' },
  { key: 'Photo', label: 'Passport photo' },
  { key: 'Land record', label: 'Land record' },
];

/** Public page opened by scanning the QR on a phone. Uploads are mapped to the
 *  session's user via the token — no login needed. */
export function MobileUploadPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [session, setSession] = useState<UploadSessionInfo | null>(null);
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [scanType, setScanType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!token) {
      setFatal('This upload link is invalid. Please scan the QR code again.');
      return;
    }
    try {
      const info = await getUploadSession(token);
      setSession(info);
      setDocs(info.documents);
    } catch (e) {
      setFatal(normaliseError(e).message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const startScan = (type: string) => {
    setError(null);
    setScanType(type);
    setTimeout(() => fileRef.current?.click(), 0);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !scanType) return;
    const vErr = validateDocFile(file);
    if (vErr) {
      setError(vErr);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      await uploadViaToken(token, { fileName: file.name, data: dataUrl, category: scanType });
      setToast(`${scanType} uploaded.`);
      setTimeout(() => setToast(null), 3500);
      load();
    } catch (err) {
      setError(normaliseError(err).message);
    } finally {
      setBusy(false);
      setScanType(null);
    }
  };

  if (fatal) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <Alert tone="error">{fatal}</Alert>
        </div>
      </div>
    );
  }
  if (!session) return <FullPageLoader label="Opening your upload page…" />;

  return (
    <div className="min-h-full bg-gradient-to-br from-brand-50 via-white to-gold-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-gold-500 text-white"><Sprout className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-bold text-slate-800">Upload your documents</p>
            <p className="text-xs text-slate-500">for {session.userName}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-700"><ScanLine className="h-4 w-4" /> Required documents</h2>
          <p className="mb-4 text-xs text-slate-500">Tap a document, take a clear photo, and it's filed under the correct type automatically.</p>

          {toast && <div className="mb-3"><Alert tone="success">{toast}</Alert></div>}
          {error && <div className="mb-3"><Alert tone="error">{error}</Alert></div>}

          <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={onFile} />

          <div className="space-y-2.5">
            {REQUIRED_DOCS.map((r) => {
              const has = docs.find((d) => d.category === r.key);
              return (
                <div key={r.key} className={`flex items-center justify-between rounded-xl border p-3 ${has ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200'}`}>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{r.label}</div>
                    {has ? (
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><CheckCircle2 className="h-3.5 w-3.5" /> Uploaded</div>
                    ) : (
                      <div className="text-xs text-slate-400">Not uploaded</div>
                    )}
                  </div>
                  <button
                    onClick={() => startScan(r.key)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    <Camera className="h-3.5 w-3.5" /> {has ? 'Replace' : 'Scan'}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">You can close this page when you're done. Your documents are saved automatically.</p>
        </div>
      </div>
    </div>
  );
}
