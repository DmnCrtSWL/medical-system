export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface DoctorUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialty: string;
  licenseId?: string | null;
  phone?: string | null;
  companyId?: string | null;
  user: DoctorUser;
}

export interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  companyId: string;
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
}

export interface ClinicalConsultation {
  localId: string;
  serverId?: string;
  patientId: string;
  doctorId: string;
  companyId: string;
  chiefComplaint: string;
  symptoms: string;
  vitalSigns: VitalSigns;
  diagnosisCode?: string;
  diagnosisDescription: string;
  treatmentPlan: string;
  prescriptionNotes?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id: string;
  type: 'CREATE_CONSULTATION' | 'UPDATE_CONSULTATION';
  payload: ClinicalConsultation;
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
}
