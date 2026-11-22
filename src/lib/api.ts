import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** In-memory access token. Kept out of localStorage to reduce XSS token theft risk. */
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie
  // CSRF defense: a custom header the browser won't attach to cross-site requests.
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ---- Transparent refresh-on-401 with request queueing ----
let isRefreshing = false;
let waiters: ((token: string | null) => void)[] = [];

function onRefreshed(token: string | null) {
  waiters.forEach((cb) => cb(token));
  waiters = [];
}

/** Callback invoked when the session cannot be recovered (forces logout in the store). */
let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    const isAuthEndpoint =
      original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        /* fall through to rejection below */
      }
      onSessionExpired?.();
    }

    return Promise.reject(normaliseError(error));
  },
);

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => waiters.push(resolve));
  }
  isRefreshing = true;
  try {
    const res = await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers: { 'X-Requested-With': 'XMLHttpRequest' } },
    );
    const token: string = res.data?.data?.accessToken;
    setAccessToken(token);
    onRefreshed(token);
    return token;
  } catch {
    onRefreshed(null);
    setAccessToken(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

/** Converts any axios error into a stable, user-friendly ApiError. */
export function normaliseError(error: unknown): ApiError {
  // Axios errors FIRST — extract our { error: { code, message, fields } } envelope.
  // (Must come before the pass-through check: modern AxiosError also has code/message/status.)
  if (axios.isAxiosError(error)) {
    const resp = error.response;
    if (resp?.data?.error) {
      return {
        code: resp.data.error.code ?? 'ERROR',
        message: resp.data.error.message ?? 'Something went wrong.',
        fields: resp.data.error.fields,
        status: resp.status,
      };
    }
    if (error.code === 'ERR_NETWORK') {
      return {
        code: 'NETWORK',
        message: "We couldn't connect to the server. Check your internet connection and try again.",
        status: 0,
      };
    }
    return { code: error.code ?? 'ERROR', message: 'Something went wrong. Please try again.', status: resp?.status ?? 0 };
  }
  // An already-normalised ApiError (e.g. re-passed by a caller): return it unchanged.
  if (
    typeof error === 'object' &&
    error !== null &&
    !(error as { isAxiosError?: boolean }).isAxiosError &&
    typeof (error as ApiError).code === 'string' &&
    typeof (error as ApiError).message === 'string' &&
    typeof (error as ApiError).status === 'number'
  ) {
    return error as ApiError;
  }
  return { code: 'UNKNOWN', message: 'An unexpected error occurred. Please try again.', status: 0 };
}
