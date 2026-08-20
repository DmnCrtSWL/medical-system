import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import api from '../services/api';
import type { Company } from './companies';

export interface Contract {
  id: string;
  companyId: string;
  startDate: string;
  endDate: string;
  amount?: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  company: Company;
}

export interface CreateContractPayload {
  companyId: string;
  startDate: string;
  endDate: string;
  amount?: number | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

export interface UpdateContractPayload {
  companyId?: string;
  startDate?: string;
  endDate?: string;
  amount?: number | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

export const useContractStore = defineStore('contracts', () => {
  const contracts = ref<Contract[]>([]);
  const isLoading = ref(false);
  const isDownloading = ref(false);
  const error = ref<string | null>(null);

  const fetchContracts = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.get('/contracts');
      contracts.value = response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'Error al cargar los contratos B2B.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const createContract = async (payload: CreateContractPayload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.post('/contracts', payload);
      contracts.value.unshift(response.data.contract);
      return response.data.contract;
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al generar el contrato B2B.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  const updateContract = async (id: string, payload: UpdateContractPayload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/contracts/${id}`, payload);
      const updated = response.data.contract;
      const index = contracts.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        contracts.value[index] = updated;
      }
      return updated;
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al actualizar la información del contrato.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteContract = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await api.delete(`/contracts/${id}`);
      contracts.value = contracts.value.filter((c) => c.id !== id);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al eliminar el contrato.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  const downloadPdf = async (id: string, companyName: string) => {
    isDownloading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/contracts/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const safeName = companyName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Contrato_${safeName}_${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al descargar el PDF del contrato.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isDownloading.value = false;
    }
  };

  return {
    contracts,
    isLoading,
    isDownloading,
    error,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
    downloadPdf,
  };
});
