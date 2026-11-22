import { api } from '../lib/api';
import type { FidRecord, Paginated } from '../types';

export async function getFidFee(): Promise<{ feePaise: number; feeRupees: number }> {
  const res = await api.get('/fid/fee');
  return res.data.data;
}

export async function generateFid(farmerId: string, photo?: string): Promise<FidRecord> {
  const res = await api.post('/fid', { farmerId, photo });
  return res.data.data;
}

export async function listFid(params: { search?: string; page?: number; limit?: number } = {}): Promise<Paginated<FidRecord>> {
  const res = await api.get('/fid', { params });
  return res.data.data;
}
