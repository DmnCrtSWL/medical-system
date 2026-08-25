import { defineStore } from 'pinia';
import api from '../services/api';
import axios from 'axios';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'HONORARIUM';
export type TransactionCategory =
  | 'B2B_CONTRACT'
  | 'DOCTOR_HONORARIUM'
  | 'CONSULTATION_FEE'
  | 'EQUIPMENT_MAINTENANCE'
  | 'OTHER';

export interface CompanyRef {
  id: string;
  name: string;
  taxId?: string | null;
}

export interface DoctorRef {
  id: string;
  specialty?: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  companyId?: string | null;
  doctorId?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  company?: CompanyRef | null;
  doctor?: DoctorRef | null;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalHonoraria: number;
  netBalance: number;
  transactionCount: number;
  recentTransactions: Transaction[];
}

export interface CreateTransactionPayload {
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  companyId?: string | null;
  doctorId?: string | null;
  date?: string;
}

export interface FilterParams {
  type?: TransactionType | '';
  category?: TransactionCategory | '';
  companyId?: string;
  doctorId?: string;
}

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: [] as Transaction[],
    summary: null as FinancialSummary | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchSummary(): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get<FinancialSummary>('/finance/summary');
        this.summary = response.data;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.error) {
          this.error = err.response.data.error;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'Error al obtener el resumen financiero';
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchTransactions(filters?: FilterParams): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const params: Record<string, string> = {};
        if (filters?.type) params.type = filters.type;
        if (filters?.category) params.category = filters.category;
        if (filters?.companyId) params.companyId = filters.companyId;
        if (filters?.doctorId) params.doctorId = filters.doctorId;

        const response = await api.get<Transaction[]>('/finance', { params });
        this.transactions = response.data;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.error) {
          this.error = err.response.data.error;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'Error al consultar las transacciones financieras';
        }
      } finally {
        this.loading = false;
      }
    },

    async createTransaction(payload: CreateTransactionPayload): Promise<boolean> {
      this.loading = true;
      this.error = null;
      try {
        await api.post<Transaction>('/finance', payload);
        await Promise.all([this.fetchTransactions(), this.fetchSummary()]);
        return true;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.error) {
          this.error = err.response.data.error;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'Error al registrar la transacción financiera';
        }
        return false;
      } finally {
        this.loading = false;
      }
    },

    async deleteTransaction(id: string): Promise<boolean> {
      this.loading = true;
      this.error = null;
      try {
        await api.delete(`/finance/${id}`);
        await Promise.all([this.fetchTransactions(), this.fetchSummary()]);
        return true;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.error) {
          this.error = err.response.data.error;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'Error al eliminar la transacción';
        }
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
