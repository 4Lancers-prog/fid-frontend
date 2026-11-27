import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import fidTemplate from '../../assets/fid-template.png';
import { useT } from '../../i18n';
import { Search, Printer, RefreshCw, Upload, UserCheck } from 'lucide-react';
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
const genderKannada: Record<string, string> = { male: 'ಪುರುಷ', female: 'ಮಹಿಳೆ', other: 'ಇತರೆ' };

interface CardState {
  name: string;
  gender: string;
  aadhaarMasked: string;
  fid: string;
  mobile: string;
  village: string;
  taluk: string;
  district: string;
  address: string;
  photo?: string;
}

const defaultCard: CardState = {
  name: 'ರಮೇಶ್ ಕುಮಾರ್ ಪಾಟೀಲ',
  gender: 'ಪುರುಷ',
  aadhaarMasked: 'XXXX XXXX 1234',
  fid: 'FID202611000856',
  mobile: '9880065988',
  village: 'ಸುಳ್ಳ',
  taluk: 'ಧಾರವಾಡ',
  district: 'ಧಾರವಾಡ – 580023',
  address: '',
};

export function FidCardMakerPage() {
  const t = useT();
  const [card, setCard] = useState<CardState>(defaultCard);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [qr, setQr] = useState<string | undefined>();
  const [fee, setFee] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFidFee()
      .then((f) => setFee(f.feeRupees))
      .catch(() => setFee(5));
  }, []);

  useEffect(() => {
    if (!card.fid) {
      setQr(undefined);
      return;
    }
    QRCode.toDataURL(card.fid, { margin: 0, width: 160 })
      .then(setQr)
      .catch(() => setQr(undefined));
  }, [card.fid]);

  const applyFarmer = (f: Farmer) => {
    setSelectedFarmer(f);
    setCard({
      name: f.name,
      gender: genderKannada[f.gender] ?? f.gender,
      aadhaarMasked: f.aadhaarMasked,
      fid: f.fid,
      mobile: f.mobile || '',
      village: f.village || '',
      taluk: f.taluk || '',
      district: f.district || '',
      address: f.address || '',
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
            <FidCard card={card} qr={qr} />
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
/*
 * FID card = the uploaded template image as the background, with the live fields
 * overlaid on top. Nudge the numbers in POS (percentages of the card) to line the
 * fields up over the artwork. Positions scale automatically (cqw = % of card width),
 * so the preview and the 4x6 print stay aligned.
 */
const POS = {
  photo: { left: 4.6, top: 29.2, width: 17.8, height: 37.6 },
  qr: { left: 6.0, top: 71.5, width: 11.4, height: 17.2 },
  valueLeft: 42.6, // where the values (after the colon) start
  rows: {
    name: 30.6,
    gender: 38.8,
    aadhaar: 47.0,
    fid: 55.0,
    mobile: 62.8,
    address: 70.2,
  },
};
// Masking chip behind each value hides the sample text baked into the template.
// If you later use a BLANK template (no sample data), set MASK = false.
const MASK = true;
const MASK_BG = 'rgba(243, 248, 235, 0.92)';

function Val({
  top,
  value,
  size = 3.3,
  color = '#143806',
  bold = false,
}: {
  top: number;
  value: React.ReactNode;
  size?: number;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div
      className="absolute whitespace-nowrap"
      style={{
        left: `${POS.valueLeft}%`,
        top: `${top}%`,
        fontSize: `${size}cqw`,
        color,
        fontWeight: bold ? 800 : 600,
        lineHeight: 1.1,
        background: MASK ? MASK_BG : undefined,
        borderRadius: MASK ? '0.4cqw' : undefined,
        padding: MASK ? '0.2cqw 0.8cqw' : undefined,
      }}
    >
      {value}
    </div>
  );
}

function FidCard({ card, qr }: { card: CardState; qr?: string }) {
  return (
    <div
      className="fid-card-print relative overflow-hidden rounded-xl shadow-lg"
      style={{ width: '86mm', aspectRatio: '1340 / 893', containerType: 'inline-size' }}
    >
      <img src={fidTemplate} alt="" className="absolute inset-0 h-full w-full" style={{ objectFit: 'fill' }} />

      {/* Photo (covers the sample photo) */}
      <div
        className="absolute overflow-hidden rounded"
        style={{ left: `${POS.photo.left}%`, top: `${POS.photo.top}%`, width: `${POS.photo.width}%`, height: `${POS.photo.height}%` }}
      >
        {card.photo ? (
          <img src={card.photo} alt="farmer" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200">
            <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 fill-slate-400"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
        )}
      </div>

      {/* QR (covers the sample QR) */}
      <div
        className="absolute bg-white"
        style={{ left: `${POS.qr.left}%`, top: `${POS.qr.top}%`, width: `${POS.qr.width}%`, height: `${POS.qr.height}%` }}
      >
        {qr && <img src={qr} alt="QR" className="h-full w-full" />}
      </div>

      {/* Values */}
      <Val top={POS.rows.name} value={card.name} size={3.4} bold />
      <Val top={POS.rows.gender} value={card.gender} size={3.4} />
      <Val top={POS.rows.aadhaar} value={card.aadhaarMasked} size={3.2} />
      <Val top={POS.rows.fid} value={card.fid} size={3.2} color="#166a0f" bold />
      <Val top={POS.rows.mobile} value={card.mobile} size={3.2} />
      <div
        className="absolute"
        style={{
          left: `${POS.valueLeft}%`,
          top: `${POS.rows.address}%`,
          fontSize: '2.7cqw',
          lineHeight: 1.4,
          color: '#143806',
          fontWeight: 600,
          background: MASK ? MASK_BG : undefined,
          borderRadius: MASK ? '0.4cqw' : undefined,
          padding: MASK ? '0.2cqw 0.8cqw' : undefined,
        }}
      >
        {card.village || card.taluk || card.district ? (
          <>
            {card.village && <div>ಹಳ್ಳಿ : {card.village}</div>}
            {card.taluk && <div>ತಾಲ್ಲೂಕು : {card.taluk}</div>}
            {card.district && <div>ಜಿಲ್ಲೆ : {card.district}</div>}
          </>
        ) : (
          card.address
        )}
      </div>
    </div>
  );
}
