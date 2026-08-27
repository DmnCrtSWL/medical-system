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
