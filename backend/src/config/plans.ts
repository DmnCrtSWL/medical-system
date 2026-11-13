/**
 * Catálogo de paquetes de servicio médico B2C ofrecidos en la landing pública.
 * Las cantidades son por año de suscripción; -1 significa ilimitado.
 */
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

export const SERVICE_LABELS: Record<string, string> = {
  GENERAL_CONSULTATION: 'Consultas de medicina general',
  TELEMEDICINE: 'Telemedicina 24/7',
  LAB_BASIC: 'Estudios de laboratorio',
  SPECIALIST: 'Consultas con especialista',
  NUTRITION: 'Consultas de nutrición',
  EMERGENCY: 'Atención de urgencias',
  CHECKUP: 'Check-up anual completo',
};

const svc = (key: string, allowance: number): PlanService => ({ key, label: SERVICE_LABELS[key], allowance });

export const MEDICAL_PLANS: MedicalPlan[] = [
  {
    id: 'esencial',
    name: 'Esencial',
    tagline: 'Lo básico para cuidar tu salud día a día.',
    monthlyPrice: 349,
    annualPrice: 3490,
    highlighted: false,
    services: [
      svc('GENERAL_CONSULTATION', 6),
      svc('TELEMEDICINE', -1),
      svc('LAB_BASIC', 1),
    ],
    perks: ['10% de descuento en farmacias de la red', 'Expediente clínico digital'],
  },
  {
    id: 'integral',
    name: 'Integral',
    tagline: 'Cobertura completa para ti, con especialistas incluidos.',
    monthlyPrice: 699,
    annualPrice: 6990,
    highlighted: true,
    services: [
      svc('GENERAL_CONSULTATION', 12),
      svc('TELEMEDICINE', -1),
      svc('LAB_BASIC', 2),
      svc('SPECIALIST', 4),
      svc('NUTRITION', 2),
      svc('EMERGENCY', 1),
    ],
    perks: ['15% de descuento en farmacias de la red', 'Expediente clínico digital', 'Agenda prioritaria'],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Atención sin límites y seguimiento médico personalizado.',
    monthlyPrice: 1290,
    annualPrice: 12900,
    highlighted: false,
    services: [
      svc('GENERAL_CONSULTATION', -1),
      svc('TELEMEDICINE', -1),
      svc('LAB_BASIC', 4),
      svc('SPECIALIST', 12),
      svc('NUTRITION', 6),
      svc('EMERGENCY', 3),
      svc('CHECKUP', 1),
    ],
    perks: ['25% de descuento en farmacias de la red', 'Médico de cabecera asignado', 'Ambulancia sin costo en CDMX'],
  },
];

export const findPlan = (id: string): MedicalPlan | undefined => MEDICAL_PLANS.find((p) => p.id === id);
