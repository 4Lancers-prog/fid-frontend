import { api } from '../lib/api';
import type { User } from '../types';

export async function fetchMe(): Promise<User> {
  const res = await api.get('/auth/me');
  return res.data.data.user;
}

export interface RegistrationQr {
  active: boolean;
  qrImage?: string;
  upiId?: string;
  businessName?: string;
  instructions?: string;
  registrationFeeRupees?: number;
}

export async function getRegistrationQr(): Promise<RegistrationQr> {
  return (await api.get('/auth/registration-qr')).data.data;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  paymentUtr?: string;
  paymentAmountRupees?: number;
  paymentProof?: string;
}): Promise<void> {
  await api.post('/auth/register-request', input);
}
