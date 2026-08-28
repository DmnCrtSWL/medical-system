import api from './api';

export interface TopDiagnosisItem {
  name: string;
  count: number;
  percentage: number;
}

export interface CategoryDistributionItem {
  category: string;
  count: number;
  percentage: number;
}

export interface BmiCategories {
  underweight: number;
  normal: number;
  overweight: number;
  obese: number;
}

export interface BloodPressureAverage {
  systolic: number;
  diastolic: number;
}

export interface VitalsAnalytics {
  averageBmi: number;
  bmiCategories: BmiCategories;
  averageBloodPressure: BloodPressureAverage;
}

export interface MonthlyTrendItem {
  period: string;
  count: number;
}

export interface HealthAnalyticsData {
  totalConsultations: number;
  uniquePatients: number;
  activeDoctors: number;
  topDiagnoses: TopDiagnosisItem[];
  categoryDistribution: CategoryDistributionItem[];
  vitals: VitalsAnalytics;
  monthlyTrend: MonthlyTrendItem[];
}

export interface CompanyOption {
  id: string;
  name: string;
  taxId?: string;
}

export interface RecentConsultationItem {
  id: string;
  consultationDate: string;
  diagnosisDescription: string;
  chiefComplaint: string;
  treatmentPlan: string;
  bmi?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  patient: {
    firstName: string;
    lastName: string;
    employeeNumber?: string;
  };
  company: {
    name: string;
  };
  doctor: {
    user: {
      name: string;
    };
  };
}

export const analyticsService = {
  /**
   * Obtiene métricas agregadas de salud ocupacional (filtradas opcionalmente por empresa)
   */
  async getHealthAnalytics(companyId?: string): Promise<HealthAnalyticsData> {
    const params: Record<string, string> = {};
    if (companyId && companyId !== 'ALL') {
      params.companyId = companyId;
    }

    const response = await api.get<HealthAnalyticsData>('/consultations/analytics', { params });
    return response.data;
  },

  /**
   * Obtiene la lista de empresas corporativas cliente para el selector de filtro
   */
  async getCompanies(): Promise<CompanyOption[]> {
    const response = await api.get<CompanyOption[]>('/companies');
    return response.data;
  },

  /**
   * Obtiene las consultas más recientes para la tabla de expedientes atendidos
   */
  async getRecentConsultations(companyId?: string, limit = 10): Promise<RecentConsultationItem[]> {
    const params: Record<string, string | number> = { limit };
    if (companyId && companyId !== 'ALL') {
      params.companyId = companyId;
    }

    const response = await api.get<{ data: RecentConsultationItem[] }>('/consultations', { params });
    return response.data.data;
  },
};
