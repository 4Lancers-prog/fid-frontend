import { api } from '../lib/api';

export interface ActiveQr {
  active: boolean;
  qrImage?: string;
  upiId?: string;
  businessName?: string;
  instructions?: string;
}

export interface ManualPayment {
  id: string;
  user: string | { _id: string; name: string; email: string };
  amountRupees: number;
  utr: string;
  proof?: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  reviewedAt?: string;
  createdAt: string;
}

export const paymentsApi = {
  getActiveQr: async (): Promise<ActiveQr> => (await api.get('/payment-settings/qr')).data.data,
  getSettings: async () => (await api.get('/payment-settings')).data.data,
  updateSettings: async (input: Record<string, unknown>) => (await api.put('/payment-settings/qr', input)).data.data,

  submit: async (input: { amountRupees: number; utr: string; proof?: string }): Promise<ManualPayment> =>
    (await api.post('/manual-payments', input)).data.data,
  mine: async (): Promise<{ items: ManualPayment[]; total: number }> =>
    (await api.get('/manual-payments/mine')).data.data,
  list: async (status?: string): Promise<{ items: ManualPayment[]; total: number }> =>
    (await api.get('/manual-payments', { params: { status } })).data.data,
  approve: async (id: string, remarks?: string): Promise<ManualPayment> =>
    (await api.patch(`/manual-payments/${id}/approve`, { remarks })).data.data,
  reject: async (id: string, reason: string): Promise<ManualPayment> =>
    (await api.patch(`/manual-payments/${id}/reject`, { reason })).data.data,
};

/** Reads a File into a base64 data URL (for QR / proof uploads). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}
