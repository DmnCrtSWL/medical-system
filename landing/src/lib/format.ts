export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface PlanService {
  key: string;
  label: string;
  allowance: number;
}

export interface MedicalPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  highlighted: boolean;
  services: PlanService[];
  perks: string[];
}

export const formatMoney = (amount: number): string =>
  `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatDate = (value: string | Date, withYear = true): string =>
  new Date(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) });

export const allowanceLabel = (allowance: number): string => (allowance === -1 ? 'Ilimitado' : `${allowance} al año`);

export const annualSavings = (plan: MedicalPlan): number => plan.monthlyPrice * 12 - plan.annualPrice;

export const formatCardNumber = (value: string): string =>
  value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
