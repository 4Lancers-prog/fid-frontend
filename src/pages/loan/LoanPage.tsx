import { ApplicationModule, FieldConfig, ColumnConfig } from '../../components/applications/ApplicationModule';
import { makeModuleApi } from '../../services/applications.service';
import { useT } from '../../i18n';
import { loanSchema } from '../../schemas';

const api = makeModuleApi('/loan-leads');

const fields: FieldConfig[] = [
  { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
  { name: 'mobile', label: 'Mobile Number', type: 'tel', required: true },
  { name: 'loanType', label: 'Loan Type', type: 'select', required: true, options: [
    { value: 'home', label: 'Home' }, { value: 'bike', label: 'Bike' }, { value: 'vehicle', label: 'Vehicle' },
    { value: 'mortgage', label: 'Mortgage' }, { value: 'other', label: 'Other' },
  ] },
  { name: 'loanAmount', label: 'Loan Amount (₹)', type: 'number', required: true },
  { name: 'pan', label: 'PAN (optional)', type: 'text', placeholder: 'ABCDE1234F' },
  { name: 'aadhaar', label: 'Aadhaar (optional)', type: 'text', placeholder: '12 digits' },
];

const columns: ColumnConfig[] = [
  { key: 'applicantName', label: 'Applicant' },
  { key: 'loanType', label: 'Type', render: (r) => <span className="capitalize">{String(r.loanType)}</span> },
  { key: 'loanAmount', label: 'Amount', render: (r) => `₹${Number(r.loanAmount ?? 0).toLocaleString('en-IN')}` },
  { key: 'panMasked', label: 'PAN', render: (r) => (r.panMasked ? String(r.panMasked) : '—') },
  { key: 'mobile', label: 'Mobile' },
];

export function LoanPage() {
  const t = useT();
  return (
    <ApplicationModule
      title={t('page.loan.t')}
      description="Capture and track loan leads. PAN and Aadhaar are stored encrypted and shown masked."
      api={api}
      schema={loanSchema}
      fields={fields}
      columns={columns}
      createRoles={['admin', 'loan_executive']}
      createLabel="New Lead"
    />
  );
}
