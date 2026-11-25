import axios from 'axios';
import { api } from '../lib/api';
import type { DocumentMeta } from './documents.service';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
// Plain client (no auth/refresh interceptors) for the public, token-based mobile page.
const plain = axios.create({ baseURL: BASE });

/** Logged-in user: create a session; the QR encodes a link carrying this token. */
export async function createUploadSession(): Promise<{ token: string; expiresInMinutes: number }> {
  return (await api.post('/upload-session')).data.data;
}

export interface UploadSessionInfo {
  valid: boolean;
  userName: string;
  documents: DocumentMeta[];
}

export async function getUploadSession(token: string): Promise<UploadSessionInfo> {
  return (await plain.get(`/upload-session/${encodeURIComponent(token)}`)).data.data;
}

export async function uploadViaToken(
  token: string,
  input: { fileName: string; data: string; category?: string },
): Promise<DocumentMeta> {
  return (await plain.post(`/upload-session/${encodeURIComponent(token)}/documents`, input)).data.data;
}
