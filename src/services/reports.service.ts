import { api } from '../lib/api';
import type { ApplicationStatus } from '../types';

export interface Reports {
  totals: { farmers: number; fidCards: number; documents: number; users: number };
  applicationsByStatus: Record<ApplicationStatus, number>;
  applicationsByType: { type: string; label: string; total: number }[];
  payments: { counts: Record<string, number>; approvedAmountPaise: number };
  wallet: { creditedPaise: number; debitedPaise: number; netPaise: number };
}

export async function getReports(): Promise<Reports> {
  return (await api.get('/reports')).data.data;
}
