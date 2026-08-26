import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { consultationsService } from './consultations';

const AUTH_TOKEN_KEY = '@medsys_mobile_token';

// URL del backend: puerto 4000 (localhost en iOS/Web, 10.0.2.2 en Android Emulator)
const getBaseApiUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }
  return 'http://localhost:4000/api';
};

export interface SyncReport {
  success: boolean;
  syncedCount: number;
  totalPending: number;
  message: string;
  error?: string;
}

export interface ServerSyncResultItem {
  localId: string;
  serverId: string;
  patientId: string;
  status: 'SYNCED' | 'ALREADY_SYNCED' | 'FAILED';
  error?: string;
}

export interface ServerSyncResponse {
  message: string;
  totalReceived: number;
  syncedCount: number;
  results: ServerSyncResultItem[];
}

export const syncEngine = {
  /**
   * Comprueba si el servidor central responde en el endpoint de salud
   */
  async checkServerConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${getBaseApiUrl()}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Ejecuta el proceso de sincronización de todas las consultas locales en estado PENDING
   */
  async syncPendingConsultations(): Promise<SyncReport> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        return {
          success: false,
          syncedCount: 0,
          totalPending: 0,
          message: 'Sesión no iniciada. Inicia sesión para sincronizar.',
        };
      }

      const allConsultations = await consultationsService.getLocalConsultations();
      const pending = allConsultations.filter((c) => c.syncStatus === 'PENDING');

      if (pending.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          totalPending: 0,
          message: 'No hay historias clínicas pendientes de sincronizar.',
        };
      }

      const payload = {
        consultations: pending.map((c) => ({
          localId: c.localId,
          patientName: c.patientName,
          patientAge: c.patientAge,
          companyName: c.companyName,
          employeeNumber: c.employeeNumber,
          chiefComplaint: c.chiefComplaint,
          symptoms: c.symptoms,
          vitalSigns: c.vitalSigns,
          diagnosisDescription: c.diagnosisDescription,
          treatmentPlan: c.treatmentPlan,
          prescriptionNotes: c.prescriptionNotes,
          createdAt: c.createdAt,
        })),
      };

      const response = await fetch(`${getBaseApiUrl()}/consultations/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }

      const data = (await response.json()) as ServerSyncResponse;

      const successfulItems: Array<{ localId: string; serverId: string }> = [];

      for (const item of data.results) {
        if (item.status === 'SYNCED' || item.status === 'ALREADY_SYNCED') {
          successfulItems.push({
            localId: item.localId,
            serverId: item.serverId,
          });
        }
      }

      // Marcar las consultas locales como SYNCED con su ID de base de datos
      if (successfulItems.length > 0) {
        await consultationsService.markMultipleAsSynced(successfulItems);
      }

      const syncedCount = successfulItems.length;

      return {
        success: true,
        syncedCount,
        totalPending: pending.length,
        message:
          syncedCount === 1
            ? '1 historia clínica sincronizada exitosamente con el servidor central.'
            : `${syncedCount} historias clínicas sincronizadas exitosamente con el servidor central.`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido de sincronización';
      return {
        success: false,
        syncedCount: 0,
        totalPending: 0,
        message: 'No fue posible completar la sincronización con el servidor.',
        error: message,
      };
    }
  },

  /**
   * Sincroniza un expediente clínico individual específico
   */
  async syncSingleConsultation(localId: string): Promise<SyncReport> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        return {
          success: false,
          syncedCount: 0,
          totalPending: 0,
          message: 'Sesión no iniciada. Inicia sesión para sincronizar.',
        };
      }

      const allConsultations = await consultationsService.getLocalConsultations();
      const target = allConsultations.find((c) => c.localId === localId);

      if (!target) {
        return {
          success: false,
          syncedCount: 0,
          totalPending: 0,
          message: 'No se encontró el expediente seleccionado.',
        };
      }

      if (target.syncStatus === 'SYNCED') {
        return {
          success: true,
          syncedCount: 0,
          totalPending: 0,
          message: 'Este expediente ya se encuentra sincronizado con el servidor.',
        };
      }

      const payload = {
        consultations: [
          {
            localId: target.localId,
            patientName: target.patientName,
            patientAge: target.patientAge,
            companyName: target.companyName,
            employeeNumber: target.employeeNumber,
            chiefComplaint: target.chiefComplaint,
            symptoms: target.symptoms,
            vitalSigns: target.vitalSigns,
            diagnosisDescription: target.diagnosisDescription,
            treatmentPlan: target.treatmentPlan,
            prescriptionNotes: target.prescriptionNotes,
            createdAt: target.createdAt,
          },
        ],
      };

      const response = await fetch(`${getBaseApiUrl()}/consultations/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }

      const data = (await response.json()) as ServerSyncResponse;
      const resultItem = data.results.find((r) => r.localId === localId);

      if (resultItem && (resultItem.status === 'SYNCED' || resultItem.status === 'ALREADY_SYNCED')) {
        await consultationsService.markMultipleAsSynced([
          { localId: target.localId, serverId: resultItem.serverId },
        ]);

        return {
          success: true,
          syncedCount: 1,
          totalPending: 1,
          message: `Expediente de ${target.patientName} sincronizado exitosamente.`,
        };
      }

      throw new Error(resultItem?.error || 'No se pudo sincronizar el expediente.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido de sincronización';
      return {
        success: false,
        syncedCount: 0,
        totalPending: 1,
        message: `Error al sincronizar expediente: ${message}`,
        error: message,
      };
    }
  },
};
