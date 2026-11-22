import { api } from '../lib/api';
import type { DashboardStats } from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get('/dashboard/stats');
  return res.data.data;
}
