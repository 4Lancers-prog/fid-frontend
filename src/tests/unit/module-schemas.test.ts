import { describe, it, expect } from 'vitest';
import { cropSchema, vehicleSchema, trailerSchema, loanSchema } from '../../schemas';

describe('crop schema', () => {
  it('accepts valid and rejects bad season/mobile', () => {
    expect(cropSchema.safeParse({ farmerName: 'Asha', mobile: '9876543210', cropName: 'Paddy', season: 'rabi' }).success).toBe(true);
    const bad = cropSchema.safeParse({ farmerName: 'Asha', mobile: '12', cropName: 'Paddy', season: 'x' });
    expect(bad.success).toBe(false);
  });
});

describe('vehicle schema', () => {
  it('validates year format', () => {
    expect(
      vehicleSchema.safeParse({ ownerName: 'Ravi', mobile: '9876543210', vehicleType: 'Car', registrationNumber: 'KA01AB1234', insuranceType: 'renewal', manufacturingYear: '2020' }).success,
    ).toBe(true);
    const bad = vehicleSchema.safeParse({ ownerName: 'Ravi', mobile: '9876543210', vehicleType: 'Car', registrationNumber: 'KA01AB1234', insuranceType: 'renewal', manufacturingYear: '99' });
    expect(bad.success).toBe(false);
  });
});

describe('trailer schema', () => {
  it('requires certificate type', () => {
    expect(trailerSchema.safeParse({ applicantName: 'Kumar', mobile: '9876543210', certificateType: 'rc' }).success).toBe(true);
    expect(trailerSchema.safeParse({ applicantName: 'Kumar', mobile: '9876543210' }).success).toBe(false);
  });
});

describe('loan schema', () => {
  it('validates PAN format and positive amount', () => {
    expect(loanSchema.safeParse({ applicantName: 'Meena', mobile: '9876543210', loanType: 'home', loanAmount: 500000, pan: 'ABCDE1234F' }).success).toBe(true);
    const badPan = loanSchema.safeParse({ applicantName: 'Meena', mobile: '9876543210', loanType: 'home', loanAmount: 1, pan: 'NOPE' });
    expect(badPan.success).toBe(false);
    const badAmt = loanSchema.safeParse({ applicantName: 'Meena', mobile: '9876543210', loanType: 'home', loanAmount: 0 });
    expect(badAmt.success).toBe(false);
  });
});

import { rechargeSchema } from '../../schemas';

describe('recharge schema', () => {
  it('accepts a valid amount and UTR, coercing the amount', () => {
    const r = rechargeSchema.safeParse({ amountRupees: '500', utr: 'ABC123456' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amountRupees).toBe(500);
  });
  it('rejects a zero amount and a short UTR', () => {
    const r = rechargeSchema.safeParse({ amountRupees: 0, utr: '123' });
    expect(r.success).toBe(false);
  });
});

import { createUserSchema } from '../../schemas';

describe('createUser schema', () => {
  it('accepts a valid user and rejects a weak password / missing role', () => {
    expect(createUserSchema.safeParse({ name: 'Asha', email: 'a@b.com', password: 'Secret123', role: 'operator' }).success).toBe(true);
    const bad = createUserSchema.safeParse({ name: 'Asha', email: 'a@b.com', password: 'short', role: '' as never });
    expect(bad.success).toBe(false);
  });
});

import { registerSchema } from '../../schemas';

describe('register schema', () => {
  it('accepts valid registration', () => {
    expect(registerSchema.safeParse({ name: 'Asha K', email: 'a@b.com', mobile: '9876543210', password: 'Secret123', confirmPassword: 'Secret123' }).success).toBe(true);
  });
  it('rejects mismatched passwords and bad mobile', () => {
    const r = registerSchema.safeParse({ name: 'Asha K', email: 'a@b.com', mobile: '12', password: 'Secret123', confirmPassword: 'Nope123' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const byField = Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
      expect(byField.mobile).toMatch(/10-digit/);
      expect(byField.confirmPassword).toMatch(/do not match/i);
    }
  });
});
