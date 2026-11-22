import {
  LayoutDashboard, IdCard, Users, Search, Sprout, Car, Truck,
  Landmark, ScanLine, Wallet, QrCode, FileText, ShieldCheck, BarChart3, LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../../types';

export interface NavItem {
  label: string;
  labelKey: string;
  to: string;
  icon: LucideIcon;
  roles?: UserRole[]; // undefined = visible to all authenticated users
  ready?: boolean;    // false = module not yet implemented (Phase 1)
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, ready: true },
  { label: 'FID Card Maker', labelKey: 'nav.fid', to: '/fid', icon: IdCard, roles: ['admin', 'operator'], ready: true },
  { label: 'Farmers', labelKey: 'nav.farmers', to: '/farmers', icon: Users, roles: ['admin', 'operator', 'viewer', 'loan_executive'], ready: true },
  { label: 'FRUITS / K-Kisan Lookup', labelKey: 'nav.lookup', to: '/lookup', icon: Search, roles: ['admin', 'operator'], ready: true },
  { label: 'Crop Insurance', labelKey: 'nav.crop', to: '/crop-insurance', icon: Sprout, roles: ['admin', 'operator'], ready: true },
  { label: 'Vehicle Insurance', labelKey: 'nav.vehicle', to: '/vehicle-insurance', icon: Car, roles: ['admin', 'operator'], ready: true },
  { label: 'Trailer Certificate', labelKey: 'nav.trailer', to: '/trailer-certificate', icon: Truck, roles: ['admin', 'operator'], ready: true },
  { label: 'Loan Leads', labelKey: 'nav.loan', to: '/loan-leads', icon: Landmark, roles: ['admin', 'loan_executive'], ready: true },
  { label: 'Document Scanner', labelKey: 'nav.documents', to: '/documents', icon: ScanLine, roles: ['admin', 'operator', 'viewer', 'loan_executive'], ready: true },
  { label: 'Wallet', labelKey: 'nav.wallet', to: '/wallet', icon: Wallet, ready: true },
  { label: 'Payments', labelKey: 'nav.payments', to: '/payments', icon: QrCode, ready: true },
  { label: 'Applications', labelKey: 'nav.applications', to: '/applications', icon: FileText, roles: ['admin'], ready: true },
  { label: 'Reports', labelKey: 'nav.reports', to: '/reports', icon: BarChart3, roles: ['super_admin', 'admin'], ready: true },
  { label: 'Admin', labelKey: 'nav.admin', to: '/admin', icon: ShieldCheck, roles: ['super_admin', 'admin'], ready: true },
];
