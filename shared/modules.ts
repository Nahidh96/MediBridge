import type { ModuleMeta, PracticeType } from './setup';

export const MODULES: ModuleMeta[] = [
  {
    key: 'appointments',
    name: 'Appointment Scheduling',
    description: 'Manage consultations, time slots, and SMS reminders.',
    icon: 'IconCalendar',
    defaultEnabled: true,
    recommendedFor: ['private_practice', 'dispensary', 'channeling_center']
  },
  {
    key: 'patient_records',
    name: 'Patient Records',
    description: 'Maintain comprehensive, searchable patient health records.',
    icon: 'IconStethoscope',
    defaultEnabled: true,
    recommendedFor: ['private_practice', 'dispensary', 'channeling_center']
  },
  {
    key: 'e_prescriptions',
    name: 'E-Prescriptions',
    description: 'Generate digital or printable prescriptions with dosage instructions.',
    icon: 'IconPrescription',
    defaultEnabled: true,
    recommendedFor: ['private_practice', 'dispensary']
  },
  {
    key: 'billing',
    name: 'Billing & Payments',
    description: 'Track payments, create invoices, and reconcile easily.',
    icon: 'IconReceipt2',
    defaultEnabled: true,
    recommendedFor: ['private_practice', 'channeling_center']
  },
  {
    key: 'pharmacy_inventory',
    name: 'Pharmacy & Inventory',
    description: 'Manage stock levels, expiries, and reorder alerts for dispensaries.',
    icon: 'IconBuildingStore',
    defaultEnabled: false,
    recommendedFor: ['dispensary']
  },
  {
    key: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Visualize revenue, patient flow, and operational KPIs.',
    icon: 'IconChartArcs',
    defaultEnabled: true,
    recommendedFor: ['private_practice', 'channeling_center']
  },
  {
    key: 'clinical_calculators',
    name: 'Clinical Calculators',
    description: 'Run BMI, BSA, dosing and triage calculators offline.',
    icon: 'IconCalculator',
    defaultEnabled: true,
    recommendedFor: ['private_practice', 'dispensary', 'channeling_center']
  },
  {
    key: 'collaboration',
    name: 'Multi-Doctor Collaboration',
    description: 'Coordinate cross-cover, referrals, and shared notes securely.',
    icon: 'IconUsersGroup',
    defaultEnabled: false,
    recommendedFor: ['channeling_center']
  },
  {
    key: 'medical_certificates',
    name: 'Medical Certificates',
    description: 'Issue sick leave, fitness certificates, and medical reports.',
    icon: 'IconCertificate',
    defaultEnabled: true,
    recommendedFor: ['private_practice', 'dispensary', 'channeling_center']
  }
];

export const PRACTICE_TYPE_LABELS: Record<
  PracticeType,
  string
> = {
  private_practice: 'Private Practice',
  dispensary: 'Dispensary',
  channeling_center: 'Channeling Center'
};

export function getDefaultModules(practiceType: PracticeType): string[] {
  return MODULES.filter((module) => module.recommendedFor.includes(practiceType))
    .map((module) => module.key);
}
