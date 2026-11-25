import { ApplicationModule, FieldConfig, ColumnConfig } from '../../components/applications/ApplicationModule';
import { makeModuleApi } from '../../services/applications.service';
import { trailerSchema } from '../../schemas';
import { useT } from '../../i18n';

const api = makeModuleApi('/trailer-applications');

// Usha Tailoring Certificate. Field keys are kept (trailer*) so no backend change
// is needed; only the labels shown to the user are tailoring-appropriate.
const fields: FieldConfig[] = [
  { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
  { name: 'mobile', label: 'Mobile Number', type: 'tel', required: true },
  { name: 'certificateType', label: 'Certificate Type', type: 'select', required: true, options: [
    { value: 'new_registration', label: 'New Enrollment' }, { value: 'rc', label: 'Course Completion' },
    { value: 'renewal', label: 'Renewal' }, { value: 'duplicate', label: 'Duplicate' }, { value: 'other', label: 'Other' },
  ] },
  { name: 'trailerType', label: 'Course / Trade', type: 'text', placeholder: 'e.g. Tailoring, Embroidery' },
  { name: 'trailerRegistrationNumber', label: 'Enrollment / Registration Number', type: 'text' },
  { name: 'chassisNumber', label: 'Training Centre', type: 'text' },
  { name: 'address', label: 'Address', type: 'textarea' },
  { name: 'additionalDetails', label: 'Additional Details', type: 'textarea' },
];

const columns: ColumnConfig[] = [
  { key: 'applicantName', label: 'Applicant' },
  { key: 'certificateType', label: 'Certificate', render: (r) => <span className="capitalize">{String(r.certificateType).replace('_', ' ')}</span> },
  { key: 'trailerType', label: 'Course' },
  { key: 'trailerRegistrationNumber', label: 'Enrollment No.' },
  { key: 'mobile', label: 'Mobile' },
];

export function TrailerPage() {
  const t = useT();
  return (
    <ApplicationModule
      title={t('page.trailer.t')}
      description="Create and manage Usha tailoring certificate applications."
      api={api}
      schema={trailerSchema}
      fields={fields}
      columns={columns}
      createRoles={['admin', 'operator', 'customer']}
      createLabel="New Application"
    />
  );
}
