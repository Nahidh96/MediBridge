import { registerSetupHandlers } from './handlers/setupHandlers';
import { registerModuleHandlers } from './handlers/moduleHandlers';
import { registerAppointmentHandlers } from './handlers/appointmentHandlers';
import { registerPatientHandlers } from './handlers/patientHandlers';
import { registerPrescriptionHandlers } from './handlers/prescriptionHandlers';
import { registerBillingHandlers } from './handlers/billingHandlers';
import { registerInventoryHandlers } from './handlers/inventoryHandlers';
import { registerAnalyticsHandlers } from './handlers/analyticsHandlers';
import { registerCollaborationHandlers } from './handlers/collaborationHandlers';
import { registerMedicalCertificateHandlers } from './handlers/medicalCertificateHandlers';

export function registerIpcHandlers() {
  registerSetupHandlers();
  registerModuleHandlers();
  registerAppointmentHandlers();
  registerPatientHandlers();
  registerPrescriptionHandlers();
  registerBillingHandlers();
  registerInventoryHandlers();
  registerAnalyticsHandlers();
  registerCollaborationHandlers();
  registerMedicalCertificateHandlers();
}
