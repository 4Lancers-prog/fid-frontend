import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { HomePage } from '../pages/public/HomePage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminLoginPage } from '../pages/auth/AdminLoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { FidCardMakerPage } from '../pages/fid/FidCardMakerPage';
import { FarmersPage } from '../pages/farmers/FarmersPage';
import { WalletPage } from '../pages/placeholder/WalletPage';
import { CropPage } from '../pages/crop/CropPage';
import { VehiclePage } from '../pages/vehicle/VehiclePage';
import { TrailerPage } from '../pages/trailer/TrailerPage';
import { LoanPage } from '../pages/loan/LoanPage';
import { PaymentsPage } from '../pages/payments/PaymentsPage';
import { AdminPage } from '../pages/admin/AdminPage';
import { ApplicationsPage } from '../pages/applications/ApplicationsPage';
import { LookupPage } from '../pages/lookup/LookupPage';
import { DocumentScannerPage } from '../pages/documents/DocumentScannerPage';
import { ReportsPage } from '../pages/reports/ReportsPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Authenticated app */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/fid" element={<ProtectedRoute roles={['admin', 'operator']}><FidCardMakerPage /></ProtectedRoute>} />
        <Route path="/farmers" element={<FarmersPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/lookup" element={<ProtectedRoute roles={['admin', 'operator']}><LookupPage /></ProtectedRoute>} />
        <Route path="/crop-insurance" element={<ProtectedRoute roles={['admin', 'operator', 'viewer']}><CropPage /></ProtectedRoute>} />
        <Route path="/vehicle-insurance" element={<ProtectedRoute roles={['admin', 'operator', 'viewer']}><VehiclePage /></ProtectedRoute>} />
        <Route path="/trailer-certificate" element={<ProtectedRoute roles={['admin', 'operator', 'viewer']}><TrailerPage /></ProtectedRoute>} />
        <Route path="/loan-leads" element={<ProtectedRoute roles={['admin', 'loan_executive', 'viewer']}><LoanPage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute roles={['admin', 'operator', 'viewer', 'loan_executive']}><DocumentScannerPage /></ProtectedRoute>} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/applications" element={<ProtectedRoute roles={['admin']}><ApplicationsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['super_admin', 'admin']}><AdminPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['super_admin', 'admin']}><ReportsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
