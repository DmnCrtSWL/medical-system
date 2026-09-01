export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface DoctorUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: DoctorUser;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: DoctorUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
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
  companyId?: string | null;
  companyName?: string | null;
  employeeNumber?: string | null;
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

export interface ClinicalConsultationInput {
  patientName: string;
  patientAge?: number;
  companyName?: string;
  employeeNumber?: string;
  doctorId?: string;
  doctorName?: string;
  chiefComplaint: string;
  symptoms: string;
  vitalSigns: VitalSigns;
  diagnosisCode?: string;
  diagnosisDescription: string;
  treatmentPlan: string;
  prescriptionNotes?: string;
}

export interface ClinicalConsultation extends ClinicalConsultationInput {
  localId: string;
  serverId?: string;
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

export interface PatientSummary {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  employeeNumber?: string | null;
  companyId?: string;
  companyName: string;
  consultationsCount: number;
  lastConsultationDate?: string | null;
  lastDiagnosis?: string | null;
  lastChiefComplaint?: string | null;
  status?: string;
  isOfflineOnly?: boolean;
}

export interface PatientHistoryItem {
  id: string;
  localId?: string | null;
  consultationDate: string;
  chiefComplaint: string;
  symptoms?: string | null;
  diagnosisDescription: string;
  treatmentPlan: string;
  prescriptionNotes?: string | null;
  status: string;
  doctorName: string;
  vitalSigns: VitalSigns;
}

export interface PatientHistoryResponse {
  patient: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;
    employeeNumber?: string | null;
    companyId?: string;
    companyName: string;
    totalConsultations: number;
  };
  consultations: PatientHistoryItem[];
}
