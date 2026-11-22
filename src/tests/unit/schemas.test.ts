import { describe, it, expect } from 'vitest';
import { loginSchema, farmerSchema } from '../../schemas';

describe('login schema', () => {
  it('rejects an invalid email with the right message', () => {
    const r = loginSchema.safeParse({ email: 'nope', password: 'x' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Enter a valid email address.');
  });
  it('accepts valid input', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'secret' }).success).toBe(true);
  });
});

describe('farmer schema', () => {
  it('normalises dashed Aadhaar and accepts valid data', () => {
    const r = farmerSchema.safeParse({
      name: 'Basavaraj',
      gender: 'male',
      aadhaarNumber: '1234 5678 9012',
      fid: 'FID9876543210',
      mobile: '9876543210',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.aadhaarNumber).toBe('123456789012');
  });

  it('rejects a bad Aadhaar and bad mobile with PRD messages', () => {
    const r = farmerSchema.safeParse({ name: 'Ab', gender: 'male', aadhaarNumber: '12', fid: 'FID1', mobile: '123' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const byField = Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
      expect(byField.aadhaarNumber).toBe('Enter a valid 12-digit Aadhaar number.');
      expect(byField.mobile).toBe('Enter a valid 10-digit mobile number.');
    }
  });
});
