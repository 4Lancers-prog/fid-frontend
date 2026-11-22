import { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { api, normaliseError } from '../../lib/api';
import { Card } from '../../components/common/Card';
import { Alert } from '../../components/common/Alert';
import { FullPageLoader } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';

interface Txn {
  _id: string;
  type: 'credit' | 'debit' | 'adjustment';
  amount: number;
  balanceAfter: number;
  reason: string;
  reference?: string;
  createdAt: string;
}

export function WalletPage() {
  const t = useT();
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<Txn[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get('/wallet'), api.get('/wallet/transactions')])
      .then(([w, t]) => {
        setBalance(w.data.data.balanceRupees);
        setTxns(t.data.data.items);
      })
      .catch((e) => setError(normaliseError(e).message));
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (balance === null || txns === null) return <FullPageLoader label="Loading wallet…" />;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">{t('page.wallet.t')}</h1>
      <p className="mb-6 text-sm text-slate-500">Your balance and transaction history.</p>

      <Card className="mb-6 flex items-center justify-between bg-gradient-to-br from-brand-600 to-gold-500 text-white">
        <div>
          <p className="text-sm opacity-90">Available Balance</p>
          <p className="text-3xl font-bold">₹{balance.toFixed(2)}</p>
        </div>
        <WalletIcon className="h-10 w-10 opacity-80" />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-bold text-slate-700">Transactions</h2>
        {txns.length === 0 ? (
          <EmptyState title="No transactions yet" description="Wallet debits and credits will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {txns.map((t) => {
              const credit = t.amount >= 0;
              return (
                <li key={t._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {credit ? (
                      <ArrowDownCircle className="h-5 w-5 text-brand-600" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700">{t.reason}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(t.createdAt).toLocaleString()} {t.reference ? `· ${t.reference}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${credit ? 'text-brand-600' : 'text-red-500'}`}>
                      {credit ? '+' : '−'}₹{Math.abs(t.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">Bal ₹{(t.balanceAfter / 100).toFixed(2)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
