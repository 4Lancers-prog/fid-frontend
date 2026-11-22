import { api } from '../lib/api';
import type { User, UserRole, Paginated } from '../types';

export interface AuditEntry {
  _id: string;
  actor?: { _id: string; name: string; email: string } | string;
  actorName?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface AppRow {
  id: string;
  serviceType: string;
  serviceLabel: string;
  name: string;
  mobile: string;
  status: string;
  remarks?: string;
  createdAt: string;
}

export const usersApi = {
  list: async (params: { search?: string; role?: string; approvalStatus?: string; page?: number; limit?: number } = {}): Promise<Paginated<User>> =>
    (await api.get('/users', { params })).data.data,
  get: async (id: string): Promise<User & { registrationPaymentProof?: string; registrationPaymentAmountRupees?: number }> =>
    (await api.get(`/users/${id}`)).data.data,
  create: async (input: { name: string; email: string; password: string; role: UserRole }): Promise<User> =>
    (await api.post('/users', input)).data.data,
  update: async (id: string, patch: Partial<{ name: string; role: UserRole; isActive: boolean }>): Promise<User> =>
    (await api.patch(`/users/${id}`, patch)).data.data,
  resetPassword: async (id: string, password: string) => (await api.patch(`/users/${id}/password`, { password })).data.data,
  approve: async (id: string, role?: string) => (await api.patch(`/users/${id}/approve`, role ? { role } : {})).data.data,
  reject: async (id: string) => (await api.patch(`/users/${id}/reject`, {})).data.data,
  adjustWallet: async (userId: string, amountRupees: number, type: 'credit' | 'debit', reason: string) =>
    (await api.post('/wallet/admin-adjustment', { userId, amountRupees, type, reason })).data.data,
};

export const auditApi = {
  list: async (params: { action?: string; page?: number; limit?: number } = {}): Promise<Paginated<AuditEntry>> =>
    (await api.get('/audit-logs', { params })).data.data,
};

export const applicationsApi = {
  list: async (params: { serviceType?: string; status?: string; search?: string; page?: number; limit?: number } = {}): Promise<Paginated<AppRow>> =>
    (await api.get('/applications', { params })).data.data,
  updateStatus: async (serviceType: string, id: string, status: string, remarks?: string) =>
    (await api.patch(`/applications/${serviceType}/${id}/status`, { status, remarks })).data.data,
};
