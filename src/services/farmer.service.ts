import { api } from '../lib/api';
import type { Farmer, Paginated } from '../types';
import type { FarmerForm } from '../schemas';

export async function listFarmers(params: { search?: string; page?: number; limit?: number } = {}): Promise<Paginated<Farmer>> {
  const res = await api.get('/farmers', { params });
  return res.data.data;
}

export async function createFarmer(input: FarmerForm): Promise<Farmer> {
  const res = await api.post('/farmers', input);
  return res.data.data;
}

export async function getFarmer(id: string): Promise<Farmer> {
  const res = await api.get(`/farmers/${id}`);
  return res.data.data;
}

export async function updateFarmer(id: string, input: Partial<FarmerForm>): Promise<Farmer> {
  const res = await api.patch(`/farmers/${id}`, input);
  return res.data.data;
}

export interface FarmerChange {
  field: string;
  from?: string;
  to?: string;
}
export interface FarmerHistoryEntry {
  id: string;
  action: 'create' | 'update';
  changedByName?: string;
  changes: FarmerChange[];
  at: string;
}

export async function getFarmerHistory(id: string): Promise<FarmerHistoryEntry[]> {
  const res = await api.get(`/farmers/${id}/history`);
  return res.data.data;
}

export async function lookupByAadhaar(aadhaar: string): Promise<{ exists: boolean; farmer: Farmer | null }> {
  const res = await api.post('/farmers/lookup', { aadhaar });
  return res.data.data;
}
