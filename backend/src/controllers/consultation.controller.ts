import { Request, Response } from 'express';
import prisma from '../config/db';
import { ConsultationStatus } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface VitalSignsInput {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
}

export interface SyncConsultationItem {
  localId: string;
  patientName: string;
  patientAge?: number;
  companyId?: string;
  companyName?: string;
  employeeNumber?: string;
  chiefComplaint: string;
  symptoms?: string;
  vitalSigns?: VitalSignsInput;
  diagnosisDescription: string;
  treatmentPlan: string;
  prescriptionNotes?: string;
  createdAt?: string;
}

export interface SyncResultItem {
  localId: string;
  serverId: string;
  patientId: string;
  status: 'SYNCED' | 'ALREADY_SYNCED' | 'FAILED';
  error?: string;
}

/**
 * Procesa un lote de historias clínicas enviadas desde la app móvil en modo offline
 */
export const syncConsultations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { consultations } = req.body as { consultations?: SyncConsultationItem[] };

    if (!consultations || !Array.isArray(consultations) || consultations.length === 0) {
      res.status(400).json({
        message: 'El cuerpo de la petición debe contener un arreglo "consultations" con al menos un elemento.',
      });
      return;
    }

    const userId = req.user?.id;
    let doctorId: string | null = null;
    let doctorCompanyId: string | null = null;

    if (userId) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId },
      });
      if (doctor) {
        doctorId = doctor.id;
        doctorCompanyId = doctor.companyId;
      }
    }

    // Obtener una empresa por defecto si es requerida
    const defaultCompany = await prisma.company.findFirst();
    const fallbackCompanyId = doctorCompanyId || defaultCompany?.id;

    const results: SyncResultItem[] = [];

    for (const item of consultations) {
      if (!item.localId || !item.patientName || !item.chiefComplaint || !item.diagnosisDescription || !item.treatmentPlan) {
        results.push({
          localId: item.localId || 'unknown',
          serverId: '',
          patientId: '',
          status: 'FAILED',
          error: 'Campos requeridos incompletos (patientName, chiefComplaint, diagnosisDescription, treatmentPlan).',
        });
        continue;
      }

      // Idempotencia: Verificar si ya fue sincronizada con este localId
      const existingConsultation = await prisma.consultation.findUnique({
        where: { localId: item.localId },
      });

      if (existingConsultation) {
        results.push({
          localId: item.localId,
          serverId: existingConsultation.id,
          patientId: existingConsultation.patientId,
          status: 'ALREADY_SYNCED',
        });
        continue;
      }

      // Resolver Empresa asignada
      let targetCompanyId = item.companyId;
      if (!targetCompanyId && item.companyName) {
        const foundCompany = await prisma.company.findFirst({
          where: {
            name: {
              contains: item.companyName.trim(),
              mode: 'insensitive',
            },
          },
        });
        if (foundCompany) {
          targetCompanyId = foundCompany.id;
        }
      }

      if (!targetCompanyId) {
        targetCompanyId = fallbackCompanyId;
      }

      if (!targetCompanyId) {
        results.push({
          localId: item.localId,
          serverId: '',
          patientId: '',
          status: 'FAILED',
          error: 'No se pudo vincular la consulta a ninguna empresa registrada.',
        });
        continue;
      }

      // Resolver o dar de alta al Paciente/Trabajador
      const trimmedName = item.patientName.trim();
      const nameParts = trimmedName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'General';

      let patient = await prisma.patient.findFirst({
        where: {
          firstName: { equals: firstName, mode: 'insensitive' },
          lastName: { equals: lastName, mode: 'insensitive' },
          companyId: targetCompanyId,
        },
      });

      if (!patient) {
        patient = await prisma.patient.create({
          data: {
            firstName,
            lastName,
            companyId: targetCompanyId,
            employeeNumber: item.employeeNumber ? item.employeeNumber.trim() : null,
          },
        });
      } else if (item.employeeNumber && !patient.employeeNumber) {
        // Actualizar número de empleado si no lo tenía
        patient = await prisma.patient.update({
          where: { id: patient.id },
          data: { employeeNumber: item.employeeNumber.trim() },
        });
      }

      // Crear la consulta clínica en PostgreSQL
      const newConsultation = await prisma.consultation.create({
        data: {
          localId: item.localId,
          patientId: patient.id,
          doctorId: doctorId || null,
          companyId: targetCompanyId,
          chiefComplaint: item.chiefComplaint.trim(),
          symptoms: item.symptoms ? item.symptoms.trim() : null,
          diagnosisDescription: item.diagnosisDescription.trim(),
          treatmentPlan: item.treatmentPlan.trim(),
          prescriptionNotes: item.prescriptionNotes ? item.prescriptionNotes.trim() : null,
          bloodPressureSystolic: item.vitalSigns?.bloodPressureSystolic || null,
          bloodPressureDiastolic: item.vitalSigns?.bloodPressureDiastolic || null,
          heartRate: item.vitalSigns?.heartRate || null,
          temperature: item.vitalSigns?.temperature || null,
          weightKg: item.vitalSigns?.weightKg || null,
          heightCm: item.vitalSigns?.heightCm || null,
          bmi: item.vitalSigns?.bmi || null,
          status: ConsultationStatus.COMPLETED,
          consultationDate: item.createdAt ? new Date(item.createdAt) : new Date(),
        },
      });

      results.push({
        localId: item.localId,
        serverId: newConsultation.id,
        patientId: patient.id,
        status: 'SYNCED',
      });
    }

    const syncedCount = results.filter((r) => r.status === 'SYNCED' || r.status === 'ALREADY_SYNCED').length;

    res.status(200).json({
      message: 'Sincronización de consultas procesada exitosamente',
      totalReceived: consultations.length,
      syncedCount,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al sincronizar consultas';
    console.error('Error en syncConsultations:', error);
    res.status(500).json({ message });
  }
};

/**
 * Obtiene el listado de historias clínicas con filtros opcionales
 */
export const getConsultations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, doctorId, patientId, search, page = '1', limit = '50' } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    interface ConsultationWhereInput {
      companyId?: string;
      doctorId?: string;
      patientId?: string;
      OR?: Array<{
        diagnosisDescription?: { contains: string; mode: 'insensitive' };
        chiefComplaint?: { contains: string; mode: 'insensitive' };
        patient?: {
          OR: Array<{
            firstName?: { contains: string; mode: 'insensitive' };
            lastName?: { contains: string; mode: 'insensitive' };
          }>;
        };
      }>;
    }

    const where: ConsultationWhereInput = {};

    if (companyId && typeof companyId === 'string') {
      where.companyId = companyId;
    }
    if (doctorId && typeof doctorId === 'string') {
      where.doctorId = doctorId;
    }
    if (patientId && typeof patientId === 'string') {
      where.patientId = patientId;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        { diagnosisDescription: { contains: searchTerm, mode: 'insensitive' } },
        { chiefComplaint: { contains: searchTerm, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { consultationDate: 'desc' },
        include: {
          patient: true,
          company: { select: { id: true, name: true, taxId: true } },
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.consultation.count({ where }),
    ]);

    res.status(200).json({
      data: consultations,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener consultas';
    console.error('Error en getConsultations:', error);
    res.status(500).json({ message });
  }
};

/**
 * Obtiene el detalle de una historia clínica por su ID
 */
export const getConsultationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        company: true,
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!consultation) {
      res.status(404).json({ message: 'Consulta clínica no encontrada' });
      return;
    }

    res.status(200).json(consultation);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener el detalle de la consulta';
    console.error('Error en getConsultationById:', error);
    res.status(500).json({ message });
  }
};

/**
 * Retorna las métricas y analíticas de salud ocupacional agregadas
 */
export const getConsultationAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.query;

    const where: { companyId?: string } = {};
    if (companyId && typeof companyId === 'string' && companyId !== 'ALL') {
      where.companyId = companyId;
    }

    const consultations = await prisma.consultation.findMany({
      where,
      orderBy: { consultationDate: 'desc' },
      select: {
        id: true,
        consultationDate: true,
        diagnosisDescription: true,
        chiefComplaint: true,
        bloodPressureSystolic: true,
        bloodPressureDiastolic: true,
        heartRate: true,
        temperature: true,
        weightKg: true,
        heightCm: true,
        bmi: true,
        patientId: true,
        doctorId: true,
        companyId: true,
        company: {
          select: { id: true, name: true },
        },
      },
    });

    const totalConsultations = consultations.length;
    const uniquePatientIds = new Set(consultations.map((c) => c.patientId));
    const uniqueDoctorIds = new Set(consultations.map((c) => c.doctorId));

    // 1. Top Diagnósticos agrupados
    const diagnosisCounts: Record<string, number> = {};
    for (const c of consultations) {
      const diag = (c.diagnosisDescription || 'Sin diagnóstico especificado').trim();
      diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
    }

    const topDiagnoses = Object.entries(diagnosisCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalConsultations > 0 ? Math.round((count / totalConsultations) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 2. Categorías de Salud Ocupacional (Clasificación heurística inteligente)
    const categories: Record<string, number> = {
      'Musculoesquelético (Ergonomía)': 0,
      'Respiratorio / Gripas': 0,
      'Cefaleas y Fatiga Visual': 0,
      'Gastrointestinal': 0,
      'Salud General / Preventivo': 0,
    };

    for (const c of consultations) {
      const text = `${c.diagnosisDescription || ''} ${c.chiefComplaint || ''}`.toLowerCase();
      if (/lumbal|espalda|cuello|muscular|trauma|articul|postura|ergonom|hombro|carp|muñec|tunel|túnel|tendin|codo|esguince/i.test(text)) {
        categories['Musculoesquelético (Ergonomía)'] += 1;
      } else if (/grip|rinof|tos|faring|respir|pulmon|garganta|gripe/i.test(text)) {
        categories['Respiratorio / Gripas'] += 1;
      } else if (/cefalea|cabeza|migraña|estrés|estres|fatiga|ocular|vista/i.test(text)) {
        categories['Cefaleas y Fatiga Visual'] += 1;
      } else if (/estómag|estomac|gastr|nausea|vomit|diarrea|colon/i.test(text)) {
        categories['Gastrointestinal'] += 1;
      } else {
        categories['Salud General / Preventivo'] += 1;
      }
    }

    const categoryDistribution = Object.entries(categories).map(([category, count]) => ({
      category,
      count,
      percentage: totalConsultations > 0 ? Math.round((count / totalConsultations) * 100) : 0,
    }));

    // 3. Somatometría & IMC
    const bmiList = consultations.map((c) => c.bmi).filter((b): b is number => typeof b === 'number' && b > 0);
    const averageBmi = bmiList.length > 0 ? Math.round((bmiList.reduce((acc, curr) => acc + curr, 0) / bmiList.length) * 10) / 10 : 0;

    const bmiCategories = {
      underweight: 0,
      normal: 0,
      overweight: 0,
      obese: 0,
    };

    for (const b of bmiList) {
      if (b < 18.5) bmiCategories.underweight += 1;
      else if (b < 25) bmiCategories.normal += 1;
      else if (b < 30) bmiCategories.overweight += 1;
      else bmiCategories.obese += 1;
    }

    // 4. Presión Arterial
    const systolicList = consultations.map((c) => c.bloodPressureSystolic).filter((s): s is number => typeof s === 'number' && s > 0);
    const diastolicList = consultations.map((c) => c.bloodPressureDiastolic).filter((d): d is number => typeof d === 'number' && d > 0);

    const averageSystolic = systolicList.length > 0 ? Math.round(systolicList.reduce((a, b) => a + b, 0) / systolicList.length) : 0;
    const averageDiastolic = diastolicList.length > 0 ? Math.round(diastolicList.reduce((a, b) => a + b, 0) / diastolicList.length) : 0;

    // 5. Historial mensual / distribución temporal
    const monthlyTrendMap: Record<string, number> = {};
    for (const c of consultations) {
      const date = new Date(c.consultationDate);
      const monthKey = date.toLocaleString('es-MX', { month: 'short', year: 'numeric' });
      monthlyTrendMap[monthKey] = (monthlyTrendMap[monthKey] || 0) + 1;
    }

    const monthlyTrend = Object.entries(monthlyTrendMap).map(([period, count]) => ({
      period,
      count,
    }));

    res.status(200).json({
      totalConsultations,
      uniquePatients: uniquePatientIds.size,
      activeDoctors: uniqueDoctorIds.size,
      topDiagnoses,
      categoryDistribution,
      vitals: {
        averageBmi,
        bmiCategories,
        averageBloodPressure: {
          systolic: averageSystolic,
          diastolic: averageDiastolic,
        },
      },
      monthlyTrend,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al generar analíticas';
    console.error('Error en getConsultationAnalytics:', error);
    res.status(500).json({ message });
  }
};

