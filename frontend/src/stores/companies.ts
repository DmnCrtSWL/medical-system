import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import api from '../services/api';

export interface Company {
  id: string;
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useCompanyStore = defineStore('companies', () => {
  const companies = ref<Company[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchCompanies = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.get('/companies');
      companies.value = response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'Error al cargar las empresas.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const createCompany = async (data: { name: string; taxId?: string; address?: string; phone?: string }) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.post('/companies', data);
      companies.value.unshift(response.data.company);
      return response.data.company;
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al registrar la empresa.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  const updateCompany = async (id: string, data: { name?: string; taxId?: string; address?: string; phone?: string }) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/companies/${id}`, data);
      const updated = response.data.company;
      const index = companies.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        companies.value[index] = updated;
      }
      return updated;
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al actualizar la empresa.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteCompany = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await api.delete(`/companies/${id}`);
      companies.value = companies.value.filter((c) => c.id !== id);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al eliminar la empresa.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    companies,
    isLoading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
});
