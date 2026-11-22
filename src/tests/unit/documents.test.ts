import { describe, it, expect } from 'vitest';
import { validateDocFile, formatBytes, MAX_DOC_BYTES } from '../../services/documents.service';

function makeFile(name: string, type: string, size: number): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('validateDocFile', () => {
  it('accepts JPG, PNG and PDF within the size limit', () => {
    expect(validateDocFile(makeFile('a.png', 'image/png', 1000))).toBeNull();
    expect(validateDocFile(makeFile('a.jpg', 'image/jpeg', 1000))).toBeNull();
    expect(validateDocFile(makeFile('a.pdf', 'application/pdf', 1000))).toBeNull();
  });
  it('rejects unsupported types', () => {
    expect(validateDocFile(makeFile('a.exe', 'application/x-msdownload', 1000))).toMatch(/not supported/i);
  });
  it('rejects files over the size limit', () => {
    expect(validateDocFile(makeFile('big.pdf', 'application/pdf', MAX_DOC_BYTES + 1))).toMatch(/exceeds the permitted size/i);
  });
});

describe('formatBytes', () => {
  it('formats bytes, KB and MB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
