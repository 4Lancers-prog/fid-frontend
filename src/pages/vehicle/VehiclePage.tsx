import { ApplicationModule, FieldConfig, ColumnConfig } from '../../components/applications/ApplicationModule';
import { makeModuleApi } from '../../services/applications.service';
import { useT } from '../../i18n';
import { vehicleSchema } from '../../schemas';

const api = makeModuleApi('/vehicle-applications');

const fields: FieldConfig[] = [
  { name: 'ownerName', label: 'Owner Name', type: 'text', required: true },
  { name: 'mobile', label: 'Mobile Number', type: 'tel', required: true },
  { name: 'vehicleType', label: 'Vehicle Type', type: 'text', required: true, placeholder: 'Car, Tractor…' },
  { name: 'registrationNumber', label: 'Registration Number', type: 'text', required: true },
  { name: 'insuranceType', label: 'Insurance Type', type: 'select', required: true, options: [
    { value: 'third_party', label: 'Third Party' }, { value: 'comprehensive', label: 'Comprehensive' },
    { value: 'own_damage', label: 'Own Damage' }, { value: 'renewal', label: 'Renewal' },
  ] },
  { name: 'policyExpiryDate', label: 'Policy Expiry Date', type: 'date' },
  { name: 'vehicleMakeModel', label: 'Make & Model', type: 'text' },
  { name: 'manufacturingYear', label: 'Manufacturing Year', type: 'number', placeholder: 'e.g. 2020' },
];

const columns: ColumnConfig[] = [
  { key: 'ownerName', label: 'Owner' },
  { key: 'registrationNumber', label: 'Reg. No.' },
  { key: 'vehicleType', label: 'Type' },
  { key: 'insuranceType', label: 'Insurance', render: (r) => <span className="capitalize">{String(r.insuranceType).replace('_', ' ')}</span> },
  { key: 'mobile', label: 'Mobile' },
];

export function VehiclePage() {
  const t = useT();
  return (
    <ApplicationModule
      title={t('page.vehicle.t')}
      description="Create and track vehicle insurance leads and renewals."
      api={api}
      schema={vehicleSchema}
      fields={fields}
      columns={columns}
      createRoles={['admin', 'operator']}
      createLabel="New Lead"
    />
  );
}
