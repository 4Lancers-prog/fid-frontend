import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { normaliseError } from '../../lib/api';

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  const err = new AxiosError('request failed');
  // Minimal AxiosResponse shape sufficient for normaliseError.
  err.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe('normaliseError', () => {
  it('extracts code, message and fields from the API error envelope', () => {
    const err = axiosErrorWithResponse(422, {
      error: { code: 'VALIDATION_ERROR', message: 'Fix the fields.', fields: [{ field: 'email', message: 'Bad email' }] },
    });
    const n = normaliseError(err);
    expect(n.code).toBe('VALIDATION_ERROR');
    expect(n.message).toBe('Fix the fields.');
    expect(n.fields?.[0].field).toBe('email');
    expect(n.status).toBe(422);
  });

  it('maps a network error to a friendly message', () => {
    const err = new AxiosError('network');
    err.code = 'ERR_NETWORK';
    const n = normaliseError(err);
    expect(n.code).toBe('NETWORK');
    expect(n.message).toMatch(/couldn't connect/i);
  });

  it('extracts the envelope even when status is set on the axios error (modern axios)', () => {
    const err = axiosErrorWithResponse(403, { error: { code: 'PENDING_APPROVAL', message: 'Your account is awaiting administrator approval.' } });
    // Modern axios attaches .status directly to the error — must not shadow the envelope.
    (err as unknown as { status: number }).status = 403;
    (err as unknown as { code: string }).code = 'ERR_BAD_REQUEST';
    const n = normaliseError(err);
    expect(n.code).toBe('PENDING_APPROVAL');
    expect(n.message).toMatch(/awaiting administrator approval/i);
  });

  it('passes through an already-normalised ApiError (no double-normalise)', () => {
    const already = { code: 'PENDING_APPROVAL', message: 'Your account is awaiting administrator approval.', status: 403 };
    const n = normaliseError(already);
    expect(n.code).toBe('PENDING_APPROVAL');
    expect(n.message).toMatch(/awaiting administrator approval/i);
    expect(n.status).toBe(403);
  });

  it('falls back for unknown (non-axios) errors', () => {
    const n = normaliseError(new Error('boom'));
    expect(n.code).toBe('UNKNOWN');
    expect(n.status).toBe(0);
  });
});
