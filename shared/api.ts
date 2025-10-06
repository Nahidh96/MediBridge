import type { SetupAnswers } from './setup';
import type {
  AppointmentEntity,
  BillingEntity,
  CollaborationEntity,
  DoctorProfile,
  InventoryEntity,
  MedicalCertificate,
  PatientEntity,
  PrescriptionEntity
} from './entities';
import type {
  AppointmentPayload,
  BillingPayload,
  CollaborationPayload,
  InventoryPayload,
  MedicalCertificatePayload,
  PatientPayload,
  PrescriptionPayload
} from './payloads';

export interface SetupApi {
  isComplete(): Promise<boolean>;
  getProfile(): Promise<{
    profile?: DoctorProfile;
    modules: { module_key: string; enabled: number; metadata?: string | null }[];
  }>;
  completeSetup(payload: SetupAnswers): Promise<{ success: boolean }>;
}

export interface ModuleApi {
  getModules(): Promise<
    { key: string; name: string; description: string; icon: string; enabled: boolean }[]
  >;
  updateModules(modules: string[]): Promise<{ success: boolean }>;
}

export interface PatientApi {
  list(): Promise<PatientEntity[]>;
  add(payload: PatientPayload): Promise<{ id: number }>;
}

export interface AppointmentApi {
  list(): Promise<AppointmentEntity[]>;
  add(payload: AppointmentPayload): Promise<{ id: number }>;
}

export interface PrescriptionApi {
  list(): Promise<PrescriptionEntity[]>;
  add(payload: PrescriptionPayload): Promise<{ id: number }>;
}

export interface BillingApi {
  list(): Promise<BillingEntity[]>;
  recordPayment(payload: BillingPayload): Promise<{ id: number }>;
}

export interface InventoryApi {
  list(): Promise<InventoryEntity[]>;
  upsert(payload: InventoryPayload): Promise<{ id: number }>;
}

export interface AnalyticsApi {
  overview(): Promise<{
    totals: {
      totalPatients: number;
      upcomingAppointments: number;
      completedAppointments: number;
      revenueLKR: number;
    };
    topMedications: { medication: string; count: number }[];
  }>;
}

export interface CollaborationApi {
  list(): Promise<CollaborationEntity[]>;
  add(payload: CollaborationPayload): Promise<{ id: number }>;
}

export interface MedicalCertificateApi {
  list(): Promise<MedicalCertificate[]>;
  add(payload: MedicalCertificatePayload): Promise<{ id: number }>;
}

export interface MediBridgeApi {
  setup: SetupApi;
  modules: ModuleApi;
  patients: PatientApi;
  appointments: AppointmentApi;
  prescriptions: PrescriptionApi;
  billing: BillingApi;
  inventory: InventoryApi;
  analytics: AnalyticsApi;
  collaboration: CollaborationApi;
  medicalCertificates: MedicalCertificateApi;
}
