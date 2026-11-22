import { api } from '../lib/api';
import type { Paginated, ServiceApplication, ApplicationStatus } from '../types';

export interface ListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/** Builds a typed CRUD client for a service-application endpoint. */
export function makeModuleApi(basePath: string) {
  return {
    list: async (params: ListParams = {}): Promise<Paginated<ServiceApplication>> => {
      const res = await api.get(basePath, { params });
      return res.data.data;
    },
    create: async (input: Record<string, unknown>): Promise<ServiceApplication> => {
      const res = await api.post(basePath, input);
      return res.data.data;
    },
    update: async (id: string, input: Record<string, unknown>): Promise<ServiceApplication> => {
      const res = await api.patch(`${basePath}/${id}`, input);
      return res.data.data;
    },
    updateStatus: async (id: string, status: ApplicationStatus, remarks?: string): Promise<ServiceApplication> => {
      const res = await api.patch(`${basePath}/${id}/status`, { status, remarks });
      return res.data.data;
    },
  };
}

export type ModuleApi = ReturnType<typeof makeModuleApi>;
