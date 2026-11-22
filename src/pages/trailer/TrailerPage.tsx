import { ApplicationModule, FieldConfig, ColumnConfig } from '../../components/applications/ApplicationModule';
import { makeModuleApi } from '../../services/applications.service';
import { useT } from '../../i18n';
import { trailerSchema } from '../../schemas';

const api = makeModuleApi('/trailer-applications');

const fields: FieldConfig[] = [
  { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
  { name: 'mobile', label: 'Mobile Number', type: 'tel', required: true },
  { name: 'certificateType', label: 'Certificate Type', type: 'select', required: true, options: [
    { value: 'new_registration', label: 'New Registration' }, { value: 'rc', label: 'RC' },
    { value: 'renewal', label: 'Renewal' }, { value: 'duplicate', label: 'Duplicate' }, { value: 'other', label: 'Other' },
  ] },
  { name: 'trailerRegistrationNumber', label: 'Trailer Reg. Number', type: 'text' },
  { name: 'trailerType', label: 'Trailer Type', type: 'text' },
  { name: 'chassisNumber', label: 'Chassis Number', type: 'text' },
  { name: 'address', label: 'Address', type: 'textarea' },
  { name: 'additionalDetails', label: 'Additional Details', type: 'textarea' },
];

const columns: ColumnConfig[] = [
  { key: 'applicantName', label: 'Applicant' },
  { key: 'certificateType', label: 'Certificate', render: (r) => <span className="capitalize">{String(r.certificateType).replace('_', ' ')}</span> },
  { key: 'trailerRegistrationNumber', label: 'Reg. No.' },
  { key: 'mobile', label: 'Mobile' },
];

export function TrailerPage() {
  const t = useT();
  return (
    <ApplicationModule
      title={t('page.trailer.t')}
      description="Create and manage trailer certificate applications."
      api={api}
      schema={trailerSchema}
      fields={fields}
      columns={columns}
      createRoles={['admin', 'operator']}
      createLabel="New Application"
    />
  );
}
