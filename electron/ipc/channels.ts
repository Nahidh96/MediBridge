export const IPC_CHANNELS = {
  SETUP_IS_COMPLETE: 'setup:is-complete',
  SETUP_GET_PROFILE: 'setup:get-profile',
  SETUP_COMPLETE: 'setup:complete',
  MODULES_GET_ENABLED: 'modules:get-enabled',
  MODULES_UPDATE: 'modules:update',
  APPOINTMENT_LIST: 'appointments:list',
  APPOINTMENT_ADD: 'appointments:add',
  PATIENT_LIST: 'patients:list',
  PATIENT_ADD: 'patients:add',
  PRESCRIPTION_LIST: 'prescriptions:list',
  PRESCRIPTION_ADD: 'prescriptions:add',
  BILLING_LIST: 'billing:list',
  BILLING_RECORD_PAYMENT: 'billing:record-payment',
  INVENTORY_LIST: 'inventory:list',
  INVENTORY_UPDATE: 'inventory:update',
  ANALYTICS_OVERVIEW: 'analytics:overview',
  COLLABORATION_LIST: 'collaboration:list',
  COLLABORATION_ADD: 'collaboration:add',
  MEDICAL_CERT_LIST: 'medical-certificates:list',
  MEDICAL_CERT_ADD: 'medical-certificates:add'
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
