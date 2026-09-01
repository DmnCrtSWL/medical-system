import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, getBaseApiUrl } from './auth';
import { consultationsService } from './consultations';
import { syncEngine } from './syncEngine';
import { PatientSummary, PatientHistoryResponse, PatientHistoryItem } from '../types';

const PATIENTS_CACHE_KEY = '@medsys_cached_patients';
const PATIENT_HISTORY_CACHE_PREFIX = '@medsys_patient_history_';

export const patientsService = {
  /**
   * Obtiene la lista de pacientes con soporte offline
   */
  async getPatients(search?: string): Promise<PatientSummary[]> {
    const isOnline = await syncEngine.checkServerConnection();
    let serverPatients: PatientSummary[] = [];

    if (isOnline) {
      try {
        const session = await authService.getStoredSession();
        const url = `${getBaseApiUrl()}/consultations/patients${
          search ? `?search=${encodeURIComponent(search)}` : ''
        }`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: session ? `Bearer ${session.token}` : '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          serverPatients = data as PatientSummary[];

          // Si no es una búsqueda filtrada, persistir en caché local
          if (!search) {
            await AsyncStorage.setItem(PATIENTS_CACHE_KEY, JSON.stringify(serverPatients));
          }
        }
      } catch (error) {
        console.warn('Error al obtener pacientes del servidor, recurriendo a caché local:', error);
      }
    }

    // Si falló el servidor o estamos offline, cargar caché local
    if (serverPatients.length === 0) {
      try {
        const cached = await AsyncStorage.getItem(PATIENTS_CACHE_KEY);
        if (cached) {
          serverPatients = JSON.parse(cached) as PatientSummary[];
        }
      } catch {
        serverPatients = [];
      }
    }

    // Integrar pacientes registrados localmente que aún no han sido sincronizados
    try {
      const localConsultations = await consultationsService.getLocalConsultations();
      const patientMap = new Map<string, PatientSummary>();

      // Primero agregar los del servidor/caché
      for (const p of serverPatients) {
        patientMap.set(p.name.toLowerCase().trim(), p);
      }

      // Combinar con las consultas locales
      for (const c of localConsultations) {
        const pNameKey = c.patientName.toLowerCase().trim();
        const existing = patientMap.get(pNameKey);

        if (existing) {
          // Si la consulta local es más reciente, actualizar diagnóstico y fecha
          if (new Date(c.createdAt) > new Date(existing.lastConsultationDate || 0)) {
            existing.lastConsultationDate = c.createdAt;
            existing.lastDiagnosis = c.diagnosisDescription;
            existing.lastChiefComplaint = c.chiefComplaint;
          }
          if (c.syncStatus === 'PENDING') {
            existing.consultationsCount += 1;
          }
        } else {
          // Crear entrada temporal para el nuevo paciente registrado offline
          patientMap.set(pNameKey, {
            id: `offline-${c.localId}`,
            name: c.patientName,
            employeeNumber: c.employeeNumber || null,
            companyName: c.companyName || 'Empresa Asignada',
            consultationsCount: 1,
            lastConsultationDate: c.createdAt,
            lastDiagnosis: c.diagnosisDescription,
            lastChiefComplaint: c.chiefComplaint,
            status: 'ACTIVE',
            isOfflineOnly: true,
          });
        }
      }

      let allPatients = Array.from(patientMap.values());

      // Aplicar filtro de búsqueda si estamos en modo offline
      if (search && search.trim() !== '') {
        const term = search.toLowerCase().trim();
        allPatients = allPatients.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            (p.employeeNumber && p.employeeNumber.toLowerCase().includes(term)) ||
            (p.lastDiagnosis && p.lastDiagnosis.toLowerCase().includes(term))
        );
      }

      // Ordenar por fecha de última consulta descendente
      allPatients.sort((a, b) => {
        const dateA = a.lastConsultationDate ? new Date(a.lastConsultationDate).getTime() : 0;
        const dateB = b.lastConsultationDate ? new Date(b.lastConsultationDate).getTime() : 0;
        return dateB - dateA;
      });

      return allPatients;
    } catch (error) {
      console.warn('Error al combinar pacientes locales:', error);
      return serverPatients;
    }
  },

  /**
   * Obtiene el expediente clínico completo de un paciente
   */
  async getPatientHistory(patientId: string, patientName?: string): Promise<PatientHistoryResponse> {
    const isOnline = await syncEngine.checkServerConnection();
    let historyData: PatientHistoryResponse | null = null;
    const cacheKey = `${PATIENT_HISTORY_CACHE_PREFIX}${patientId}`;

    if (isOnline && !patientId.startsWith('offline-')) {
      try {
        const session = await authService.getStoredSession();
        const url = `${getBaseApiUrl()}/consultations/patients/${encodeURIComponent(patientId)}/history`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: session ? `Bearer ${session.token}` : '',
          },
        });

        if (response.ok) {
          historyData = (await response.json()) as PatientHistoryResponse;
          await AsyncStorage.setItem(cacheKey, JSON.stringify(historyData));
        }
      } catch (error) {
        console.warn('Error al obtener expediente del servidor:', error);
      }
    }

    // Si falló o estamos offline, cargar caché guardada
    if (!historyData) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          historyData = JSON.parse(cached) as PatientHistoryResponse;
        }
      } catch {
        historyData = null;
      }
    }

    // Obtener consultas locales guardadas en el dispositivo para este paciente
    const localConsultations = await consultationsService.getLocalConsultations();
    const searchTargetName = (patientName || historyData?.patient?.name || '').toLowerCase().trim();

    const matchingLocalConsultations: PatientHistoryItem[] = localConsultations
      .filter((c) => {
        if (c.patientName.toLowerCase().trim() === searchTargetName) return true;
        if (patientId && c.localId === patientId.replace('offline-', '')) return true;
        return false;
      })
      .map((c) => ({
        id: c.localId,
        localId: c.localId,
        consultationDate: c.createdAt,
        chiefComplaint: c.chiefComplaint,
        symptoms: c.symptoms,
        diagnosisDescription: c.diagnosisDescription,
        treatmentPlan: c.treatmentPlan,
        prescriptionNotes: c.prescriptionNotes,
        status: c.syncStatus === 'SYNCED' ? 'COMPLETED' : 'LOCAL_PENDING',
        doctorName: c.doctorName || 'Dr. Médico In-House',
        vitalSigns: c.vitalSigns || {},
      }));

    if (historyData) {
      // Combinar consultas del servidor con las locales no sincronizadas (evitando duplicados por localId)
      const existingIds = new Set(historyData.consultations.map((c) => c.localId || c.id));
      const newItems = matchingLocalConsultations.filter((c) => !existingIds.has(c.id));

      const mergedConsultations = [...newItems, ...historyData.consultations].sort(
        (a, b) => new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime()
      );

      return {
        patient: {
          ...historyData.patient,
          totalConsultations: mergedConsultations.length,
        },
        consultations: mergedConsultations,
      };
    }

    // Si el paciente solo existe localmente en el dispositivo
    const firstLocal = localConsultations.find(
      (c) => c.patientName.toLowerCase().trim() === searchTargetName
    );

    return {
      patient: {
        id: patientId,
        name: patientName || firstLocal?.patientName || 'Paciente',
        employeeNumber: firstLocal?.employeeNumber || null,
        companyName: firstLocal?.companyName || 'Empresa Asignada',
        totalConsultations: matchingLocalConsultations.length,
      },
      consultations: matchingLocalConsultations.sort(
        (a, b) => new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime()
      ),
    };
  },
};
