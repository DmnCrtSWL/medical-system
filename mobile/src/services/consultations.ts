import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClinicalConsultation, ClinicalConsultationInput } from '../types';

const OFFLINE_CONSULTATIONS_KEY = '@medsys_offline_consultations';

export const consultationsService = {
  /**
   * Guarda una consulta clínica en el almacenamiento local del dispositivo (modo offline)
   */
  async saveConsultation(input: ClinicalConsultationInput): Promise<ClinicalConsultation> {
    try {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newConsultation: ClinicalConsultation = {
        ...input,
        localId,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING',
      };

      const existingConsultations = await this.getLocalConsultations();
      const updatedList = [newConsultation, ...existingConsultations];

      await AsyncStorage.setItem(OFFLINE_CONSULTATIONS_KEY, JSON.stringify(updatedList));

      return newConsultation;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Error al guardar la consulta localmente: ${err.message}`);
      }
      throw new Error('Error desconocido al guardar la consulta en el dispositivo.');
    }
  },

  /**
   * Obtiene todas las consultas clínicas guardadas localmente en el dispositivo
   */
  async getLocalConsultations(): Promise<ClinicalConsultation[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_CONSULTATIONS_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as ClinicalConsultation[];
    } catch {
      return [];
    }
  },

  /**
   * Obtiene el número de consultas pendientes de sincronización
   */
  async getPendingCount(): Promise<number> {
    try {
      const consultations = await this.getLocalConsultations();
      return consultations.filter((c) => c.syncStatus === 'PENDING').length;
    } catch {
      return 0;
    }
  },

  /**
   * Elimina una consulta clínica local por su ID
   */
  async deleteLocalConsultation(localId: string): Promise<void> {
    try {
      const consultations = await this.getLocalConsultations();
      const filtered = consultations.filter((c) => c.localId !== localId);
      await AsyncStorage.setItem(OFFLINE_CONSULTATIONS_KEY, JSON.stringify(filtered));
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Error al eliminar la consulta local: ${err.message}`);
      }
    }
  },

  /**
   * Limpia todas las consultas locales (utilidad de desarrollo o reset)
   */
  async clearAllConsultations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_CONSULTATIONS_KEY);
    } catch {
      // Ignorar errores al limpiar
    }
  },
};
