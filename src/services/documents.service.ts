import { api } from '../lib/api';
export { fileToDataUrl } from './payments.service';

export interface DocumentMeta {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category?: string;
  createdAt: string;
}

export const documentsApi = {
  list: async (): Promise<{ items: DocumentMeta[]; total: number }> => (await api.get('/documents')).data.data,
  create: async (input: { fileName: string; data: string; category?: string }): Promise<DocumentMeta> =>
    (await api.post('/documents', input)).data.data,
  get: async (id: string): Promise<DocumentMeta & { data: string }> => (await api.get(`/documents/${id}`)).data.data,
  remove: async (id: string) => (await api.delete(`/documents/${id}`)).data.data,
};

export const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const MAX_DOC_BYTES = 8 * 1024 * 1024;

export function validateDocFile(file: File): string | null {
  const type = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (!ALLOWED_DOC_TYPES.includes(type)) {
    return 'This file format is not supported. Upload a JPG, JPEG, PNG or PDF file.';
  }
  if (file.size > MAX_DOC_BYTES) {
    return 'The selected file exceeds the permitted size (8 MB). Choose a smaller file and upload again.';
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
