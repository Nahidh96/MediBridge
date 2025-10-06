export interface PatientPayload {
  fullName: string;
  nic?: string;
  contact?: string;
  dob?: string;
  allergies?: string;
  notes?: string;
}

export interface AppointmentPayload {
  patientId: number;
  scheduledFor: string;
  doctorNotes?: string;
  clinicRoom?: string;
}

export interface PrescriptionPayload {
  patientId: number;
  diagnosis: string;
  medication: string;
  dosage: string;
  duration: string;
}

export interface BillingPayload {
  patientId: number;
  amount: number;
  paymentMethod?: string;
  notes?: string;
}

export interface InventoryPayload {
  id?: number;
  itemName: string;
  sku?: string | null;
  quantity: number;
  reorderLevel: number;
  supplier?: string | null;
  unitPrice?: number | null;
}

export interface CollaborationPayload {
  author: string;
  message: string;
  tag?: string;
}

export interface MedicalCertificatePayload {
  patientId: number;
  certificateType: string;
  diagnosis?: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  restrictions?: string;
  additionalNotes?: string;
}
