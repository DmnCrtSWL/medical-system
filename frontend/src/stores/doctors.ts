import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import api from '../services/api';
import type { Company } from './companies';

export interface DoctorUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  licenseId?: string | null;
  phone?: string | null;
  companyId?: string | null;
  createdAt: string;
  updatedAt: string;
  user: DoctorUser;
  company?: Company | null;
}

export interface CreateDoctorPayload {
  name: string;
  email: string;
  password?: string;
  specialty?: string;
  licenseId?: string;
  phone?: string;
  companyId?: string;
}

export interface UpdateDoctorPayload {
  name?: string;
  email?: string;
  specialty?: string;
  licenseId?: string;
  phone?: string;
  companyId?: string;
}

export const useDoctorStore = defineStore('doctors', () => {
  const doctors = ref<Doctor[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchDoctors = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.get('/doctors');
      doctors.value = response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'Error al cargar la plantilla de doctores.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const createDoctor = async (payload: CreateDoctorPayload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.post('/doctors', payload);
      doctors.value.unshift(response.data.doctor);
      return response.data.doctor;
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al registrar el doctor.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  const updateDoctor = async (id: string, payload: UpdateDoctorPayload) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/doctors/${id}`, payload);
      const updated = response.data.doctor;
      const index = doctors.value.findIndex((d) => d.id === id);
      if (index !== -1) {
        doctors.value[index] = updated;
      }
      return updated;
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al actualizar la información del doctor.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteDoctor = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await api.delete(`/doctors/${id}`);
      doctors.value = doctors.value.filter((d) => d.id !== id);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Error al eliminar el doctor de la plantilla.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    doctors,
    isLoading,
    error,
    fetchDoctors,
    createDoctor,
    updateDoctor,
    deleteDoctor,
  };
});
