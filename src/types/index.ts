export type UserRole = 'super_admin' | 'admin' | 'operator' | 'loan_executive' | 'viewer';
export type Gender = 'male' | 'female' | 'other';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  mobile?: string;
  registrationPaymentUtr?: string;
  registrationPaymentAmountRupees?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Farmer {
  id: string;
  name: string;
  gender: Gender;
  aadhaarMasked: string;
  aadhaarLast4: string;
  fid: string;
  mobile?: string;
  address?: string;
  village?: string;
  taluk?: string;
  district?: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FidRecord {
  id: string;
  farmer: string;
  name: string;
  gender: Gender;
  aadhaarMasked: string;
  fid: string;
  address?: string;
  photo?: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totals: {
    farmers: number;
    fidCards: number;
    cropApplications: number;
    vehicleApplications: number;
    trailerApplications: number;
    loanLeads: number;
    pending: number;
    completed: number;
    rejected: number;
  };
  walletBalance: number;
  recentActivities: { id: string; title: string; reference: string; at: string }[];
}

export interface FieldError {
  field: string;
  message: string;
}

/** Normalised error thrown by the API client so UIs can show friendly messages. */
export interface ApiError {
  code: string;
  message: string;
  fields?: FieldError[];
  status: number;
}

export type ApplicationStatus = 'new' | 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';

/** Generic shape for a service-application record returned by the API. */
export interface ServiceApplication {
  id: string;
  _id?: string;
  status: ApplicationStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}
