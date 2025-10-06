export interface PatientEntity {
  id: number;
  full_name: string;
  nic?: string | null;
  contact?: string | null;
  dob?: string | null;
  allergies?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface DoctorProfileEntity {
  id: number;
  name: string;
  specialty: string;
  practice_type: string;
  centre_name?: string | null;
  location?: string | null;
  password?: string | null;
  created_at: string;
}

export interface DoctorProfile {
  id: number;
  name: string;
  specialty: string;
  practiceType: string;
  centreName?: string | null;
  location?: string | null;
  password?: string | null;
  createdAt: string;
}

export interface ModuleConfigEntity {
  id: number;
  module_key: string;
  enabled: number;
  metadata: string | null;
}

export interface AppointmentEntity {
  id: number;
  patientId: number;
  patientName?: string | null;
  scheduledFor: string;
  status: string;
  clinicRoom?: string | null;
  doctorNotes?: string | null;
  createdAt: string;
}

export interface PrescriptionEntity {
  id: number;
  patientId: number;
  patientName?: string | null;
  diagnosis: string;
  medication: string;
  dosage: string;
  duration: string;
  issuedAt: string;
}

export interface BillingEntity {
  id: number;
  patientId: number;
  patientName?: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface InventoryEntity {
  id: number;
  itemName: string;
  sku?: string | null;
  quantity: number;
  reorderLevel: number;
  supplier?: string | null;
  unitPrice?: number | null;
  updatedAt: string;
}

export interface CollaborationEntity {
  id: number;
  author: string;
  message: string;
  tag?: string | null;
  createdAt: string;
}

export interface MedicalCertificateEntity {
  id: number;
  patient_id: number;
  certificate_type: string;
  diagnosis?: string | null;
  from_date: string;
  to_date: string;
  days_count: number;
  restrictions?: string | null;
  additional_notes?: string | null;
  issued_at: string;
}

export interface MedicalCertificate {
  id: number;
  patientId: number;
  patientName?: string;
  certificateType: string;
  diagnosis?: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  restrictions?: string;
  additionalNotes?: string;
  issuedAt: string;
}
