import { ApplicationModule, FieldConfig, ColumnConfig } from '../../components/applications/ApplicationModule';
import { makeModuleApi } from '../../services/applications.service';
import { useT } from '../../i18n';
import { cropSchema } from '../../schemas';

const api = makeModuleApi('/crop-applications');

const fields: FieldConfig[] = [
  { name: 'farmerName', label: 'Farmer Name', type: 'text', required: true },
  { name: 'mobile', label: 'Mobile Number', type: 'tel', required: true, placeholder: '10-digit mobile' },
  { name: 'cropName', label: 'Crop Name', type: 'text', required: true },
  { name: 'season', label: 'Season', type: 'select', required: true, options: [
    { value: 'kharif', label: 'Kharif' }, { value: 'rabi', label: 'Rabi' }, { value: 'summer', label: 'Summer' },
  ] },
  { name: 'landArea', label: 'Land Area', type: 'text', placeholder: 'e.g. 2 acres' },
  { name: 'surveyNumber', label: 'Survey Number', type: 'text' },
  { name: 'village', label: 'Village', type: 'text' },
  { name: 'taluk', label: 'Taluk', type: 'text' },
  { name: 'district', label: 'District', type: 'text' },
  { name: 'additionalDetails', label: 'Additional Details', type: 'textarea' },
];

const columns: ColumnConfig[] = [
  { key: 'farmerName', label: 'Farmer' },
  { key: 'cropName', label: 'Crop' },
  { key: 'season', label: 'Season', render: (r) => <span className="capitalize">{String(r.season)}</span> },
  { key: 'mobile', label: 'Mobile' },
  { key: 'district', label: 'District' },
];

export function CropPage() {
  const t = useT();
  return (
    <ApplicationModule
      title={t('page.crop.t')}
      description="Create and manage crop insurance applications."
      api={api}
      schema={cropSchema}
      fields={fields}
      columns={columns}
      createRoles={['admin', 'operator']}
      createLabel="New Application"
    />
  );
}
