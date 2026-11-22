import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { Search, Printer, RefreshCw, Upload, UserCheck, Sprout } from 'lucide-react';
import { listFarmers } from '../../services/farmer.service';
import { generateFid, getFidFee } from '../../services/fid.service';
import type { Farmer } from '../../types';
import { normaliseError } from '../../lib/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { TextArea } from '../../components/common/TextArea';
import { FormField } from '../../components/common/FormField';
import { Alert } from '../../components/common/Alert';

const genderLabel: Record<string, string> = {
  male: 'ಪುರುಷ / Male',
  female: 'ಮಹಿಳೆ / Female',
  other: 'ಇತರೆ / Other',
};

interface CardState {
  name: string;
  gender: string;
  aadhaarMasked: string;
  fid: string;
  address: string;
  photo?: string;
}

const defaultCard: CardState = {
  name: 'ಬಸವರಾಜ ಪಾಟೀಲ',
  gender: 'ಪುರುಷ / Male',
  aadhaarMasked: 'XXXX-XXXX-XXXX',
  fid: 'FID9876543210',
  address: 'ಸುಳ್ಳ, ಹುಬ್ಬಳ್ಳಿ ತಾಲ್ಲೂಕು, ಧಾರವಾಡ',
};

export function FidCardMakerPage() {
  const t = useT();
  const [card, setCard] = useState<CardState>(defaultCard);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFidFee()
      .then((f) => setFee(f.feeRupees))
      .catch(() => setFee(5));
  }, []);

  const applyFarmer = (f: Farmer) => {
    setSelectedFarmer(f);
    setCard({
      name: f.name,
      gender: genderLabel[f.gender] ?? f.gender,
      aadhaarMasked: f.aadhaarMasked,
      fid: f.fid,
      address: f.address || [f.village, f.taluk, f.district].filter(Boolean).join(', '),
      photo: f.photo,
    });
    setNotice({ tone: 'info', msg: `Loaded profile for ${f.name}. Review the card and generate when ready.` });
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setNotice({ tone: 'error', msg: 'This file format is not supported. Upload a JPG, JPEG or PNG image.' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setNotice({ tone: 'error', msg: 'The selected image exceeds 3 MB. Choose a smaller file and upload again.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setCard((c) => ({ ...c, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedFarmer) {
      setNotice({ tone: 'error', msg: 'Please select a saved farmer profile before generating a card.' });
      return;
    }
    setGenerating(true);
    setNotice(null);
    try {
      await generateFid(selectedFarmer.id, card.photo);
      setNotice({ tone: 'success', msg: `₹${(fee ?? 5).toFixed(2)} was deducted and the FID record was saved. Opening the print dialog…` });
      setTimeout(() => window.print(), 300);
    } catch (e) {
      // Surfaces the server's friendly message, e.g. insufficient balance wording.
      setNotice({ tone: 'error', msg: normaliseError(e).message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('page.fid.t')}</h1>
        <p className="text-sm text-slate-500">
          Select a saved farmer, preview the card, then generate &amp; print. Printing charges your wallet.
        </p>
      </div>

      <div className="mb-4">
        <Alert tone="warning">
          <strong>Sample card:</strong> this is a private information card, not an official government-issued identity
          card. No government emblem is used. Print size is 4×6 inch; card size is 85.6×54 mm.
        </Alert>
      </div>

      {notice && (
        <div className="mb-4">
          <Alert tone={notice.tone}>{notice.msg}</Alert>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: controls */}
        <Card>
          <FarmerPicker onSelect={applyFarmer} />

          {selectedFarmer && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
              <UserCheck className="h-4 w-4" /> Selected: <strong>{selectedFarmer.name}</strong> ({selectedFarmer.fid})
            </div>
          )}

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField label="Name (printed)" htmlFor="c-name">
              <Input id="c-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
            </FormField>
            <FormField label="FID (printed)" htmlFor="c-fid">
              <Input id="c-fid" value={card.fid} onChange={(e) => setCard({ ...card, fid: e.target.value })} />
            </FormField>
          </div>

          <FormField label="Address (printed)" htmlFor="c-addr">
            <TextArea id="c-addr" rows={2} value={card.address} onChange={(e) => setCard({ ...card, address: e.target.value })} />
          </FormField>

          <FormField label="Farmer Photo" htmlFor="c-photo" hint="JPG, JPEG or PNG · up to 3 MB">
            <input ref={fileRef} id="c-photo" type="file" accept="image/png,image/jpeg" onChange={onPhoto} className="hidden" />
            <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> {card.photo ? 'Replace photo' : 'Upload photo'}
            </Button>
          </FormField>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => setCard({ ...defaultCard })}>
              <RefreshCw className="h-4 w-4" /> Reset preview
            </Button>
            <Button onClick={handleGenerate} loading={generating} disabled={!selectedFarmer}>
              <Printer className="h-4 w-4" /> Generate &amp; Print {fee !== null ? `(₹${fee.toFixed(2)})` : ''}
            </Button>
          </div>
          {!selectedFarmer && (
            <p className="mt-2 text-xs text-slate-400">Select a saved farmer to enable generation.</p>
          )}
        </Card>

        {/* Right: live preview */}
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-brand-300 bg-gradient-to-br from-brand-50 to-gold-100 p-5">
          <div id="fid-print-container">
            <FidCard card={card} />
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">Live preview · 85.6 × 54 mm</p>
        </div>
      </div>
    </div>
  );
}

function FarmerPicker({ onSelect }: { onSelect: (f: Farmer) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Farmer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listFarmers({ search: query.trim(), limit: 6 });
        setResults(res.items);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative mb-4">
      <label className="mb-1.5 block text-sm font-bold text-slate-700">Find saved farmer</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, FID or mobile…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          className="pl-9"
        />
      </div>
      {open && query.trim() && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-sm text-slate-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">No matching farmers.</p>
          ) : (
            results.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onSelect(f);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-700">{f.name}</span>
                <span className="font-mono text-xs text-slate-400">{f.fid}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** The printable FID card. Dimensions and print behaviour mirror the prototype. */
function FidCard({ card }: { card: CardState }) {
  return (
    <div className="fid-card-print relative flex h-[54mm] w-[85.6mm] flex-col overflow-hidden rounded-md border border-brand-700 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-gold-600 bg-gradient-to-r from-brand-800 via-brand-500 to-gold-500 px-2 py-1 text-white">
        <div className="flex-1 text-center leading-tight">
          <h4 className="text-[9.5px] font-bold tracking-tight">ರೈತ ಗುರುತಿನ ಚೀಟಿ · FID CARD</h4>
          <span className="block text-[7.5px] font-bold text-gold-100">FARMER INFORMATION PROFILE · ಮಾದರಿ ವಿನ್ಯಾಸ</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-1.5 bg-gradient-to-br from-brand-50/60 to-gold-100/40 px-1.5 py-1">
        <div className="flex h-[24mm] w-[19mm] flex-shrink-0 items-center justify-center overflow-hidden rounded border-[1.5px] border-brand-500 bg-slate-100">
          {card.photo ? (
            <img src={card.photo} alt="farmer" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-slate-400">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>

        <div className="flex-1 text-[7.8px] leading-tight text-slate-900">
          <Row label="ಹೆಸರು / Name:" value={card.name} />
          <Row label="ಲಿಂಗ / Gender:" value={card.gender} />
          <Row label="ಆಧಾರ್ / Aadhaar:" value={card.aadhaarMasked} />
          <Row
            label="FID ಸಂಖ್ಯೆ:"
            value={
              <span className="rounded bg-gold-100 px-1 font-extrabold text-amber-800">{card.fid}</span>
            }
          />
          <Row label="ವಿಳಾಸ / Address:" value={card.address} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-300 bg-gradient-to-r from-brand-50 to-gold-100 px-1.5 py-0.5">
        <div className="text-[6px] font-bold text-red-900">⚠️ ಮಾದರಿ ಕಾರ್ಡ್ — ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಗುರುತಿನ ಚೀಟಿ ಅಲ್ಲ</div>
        <div className="flex h-[8.5mm] w-[8.5mm] items-center justify-center rounded border border-brand-300 bg-gradient-to-br from-brand-100 to-gold-100 text-brand-700">
          <Sprout className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-0.5 flex">
      <span className="w-[25mm] flex-shrink-0 font-bold text-brand-800">{label}</span>
      <span className="break-words font-semibold text-slate-800">{value}</span>
    </div>
  );
}
