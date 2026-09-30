import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateContractPdf } from '../utils/contractPdfGenerator';
import { ContractStatus, ContractTariff, ContractDuration } from '@prisma/client';

const calculateEndDate = (startDate: Date, duration?: string | null): Date => {
  const end = new Date(startDate);
  switch (duration) {
    case ContractDuration.MONTHS_6:
      end.setMonth(end.getMonth() + 6);
      break;
    case ContractDuration.MONTHS_24:
      end.setMonth(end.getMonth() + 24);
      break;
    case ContractDuration.MONTHS_12:
    default:
      end.setMonth(end.getMonth() + 12);
      break;
  }
  return end;
};

const calculateTariffAmount = (tariff?: string | null, customAmount?: number | null): number => {
  if (customAmount !== undefined && customAmount !== null && !isNaN(customAmount) && Number(customAmount) > 0) {
    return Number(customAmount);
  }
  switch (tariff) {
    case ContractTariff.TARIFF_A:
      return 30000;
    case ContractTariff.TARIFF_B:
      return 40000;
    case ContractTariff.TARIFF_C:
      return 50000;
    default:
      return 30000;
  }
};

export const getContracts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    res.status(200).json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ message: 'Error fetching contracts' });
  }
};

export const getContractById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        company: true,
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      res.status(404).json({ message: 'Contrato no encontrado' });
      return;
    }

    res.status(200).json(contract);
  } catch (error) {
    console.error('Error fetching contract details:', error);
    res.status(500).json({ message: 'Error al consultar detalles del contrato' });
  }
};

export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, doctorId, startDate, endDate, amount, tariff, duration, status } = req.body;

    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      res.status(400).json({ message: 'La empresa (companyId) es obligatoria' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      res.status(404).json({ message: 'La empresa especificada no existe' });
      return;
    }

    // Validar doctor si se asigna
    let cleanDoctorId: string | null = null;
    if (doctorId && typeof doctorId === 'string' && doctorId.trim() !== '') {
      cleanDoctorId = doctorId.trim();
      const doctorExists = await prisma.doctor.findUnique({
        where: { id: cleanDoctorId },
      });
      if (!doctorExists) {
        res.status(404).json({ message: 'El médico especificado no existe' });
        return;
      }
    }

    // Parsear tarifa
    let parsedTariff: ContractTariff = ContractTariff.TARIFF_A;
    if (tariff && Object.values(ContractTariff).includes(tariff as ContractTariff)) {
      parsedTariff = tariff as ContractTariff;
    }

    // Parsear duración
    let parsedDuration: ContractDuration = ContractDuration.MONTHS_12;
    if (duration && Object.values(ContractDuration).includes(duration as ContractDuration)) {
      parsedDuration = duration as ContractDuration;
    }

    // Validar o calcular fechas
    const parsedStartDate = startDate && !isNaN(Date.parse(startDate)) ? new Date(startDate) : new Date();
    const parsedEndDate = endDate && !isNaN(Date.parse(endDate))
      ? new Date(endDate)
      : calculateEndDate(parsedStartDate, parsedDuration);

    const calculatedAmount = calculateTariffAmount(parsedTariff, amount);

    let parsedStatus: ContractStatus = ContractStatus.ACTIVE;
    if (status && Object.values(ContractStatus).includes(status as ContractStatus)) {
      parsedStatus = status as ContractStatus;
    }

    const contract = await prisma.contract.create({
      data: {
        companyId,
        doctorId: cleanDoctorId,
        tariff: parsedTariff,
        duration: parsedDuration,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        amount: calculatedAmount,
        status: parsedStatus,
      },
      include: {
        company: true,
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Si se asignó un médico, asociar su companyId para consistencia
    if (cleanDoctorId) {
      await prisma.doctor.update({
        where: { id: cleanDoctorId },
        data: { companyId },
      });
    }

    res.status(201).json({ message: 'Contrato y asignación registrados exitosamente', contract });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ message: 'Error interno al registrar el contrato' });
  }
};

export const downloadContractPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        company: true,
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      res.status(404).json({ message: 'Contrato no encontrado' });
      return;
    }

    const pdfBuffer = await generateContractPdf({
      contractId: contract.id,
      startDate: contract.startDate,
      endDate: contract.endDate,
      amount: contract.amount,
      tariff: contract.tariff,
      duration: contract.duration,
      status: contract.status,
      company: {
        name: contract.company.name,
        legalName: contract.company.legalName,
        representativeName: contract.company.representativeName,
        representativeTitle: contract.company.representativeTitle,
        taxId: contract.company.taxId,
        address: contract.company.address,
        phone: contract.company.phone,
        email: contract.company.email,
      },
      doctor: contract.doctor
        ? {
            name: contract.doctor.user.name,
            licenseId: contract.doctor.licenseId,
            university: contract.doctor.university,
            specialty: contract.doctor.specialty,
            phone: contract.doctor.phone,
            email: contract.doctor.user.email,
          }
        : null,
    });

    const safeCompanyName = (contract.company.legalName || contract.company.name).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Machote_Contrato_${safeCompanyName}_${contract.id.slice(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    res.status(500).json({ message: 'Error al generar el machote de contrato en PDF' });
  }
};

export const updateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { companyId, doctorId, startDate, endDate, amount, tariff, duration, status } = req.body;

    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      res.status(404).json({ message: 'Contrato no encontrado' });
      return;
    }

    if (companyId && companyId !== existingContract.companyId) {
      const companyExists = await prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!companyExists) {
        res.status(404).json({ message: 'La empresa especificada no existe' });
        return;
      }
    }

    let cleanDoctorId: string | null = existingContract.doctorId;
    if (doctorId !== undefined) {
      if (doctorId && typeof doctorId === 'string' && doctorId.trim() !== '') {
        cleanDoctorId = doctorId.trim();
        const docCheck = await prisma.doctor.findUnique({ where: { id: cleanDoctorId } });
        if (!docCheck) {
          res.status(404).json({ message: 'El médico especificado no existe' });
          return;
        }
      } else {
        cleanDoctorId = null;
      }
    }

    let parsedTariff: ContractTariff | undefined = undefined;
    if (tariff && Object.values(ContractTariff).includes(tariff as ContractTariff)) {
      parsedTariff = tariff as ContractTariff;
    }

    let parsedDuration: ContractDuration | undefined = undefined;
    if (duration && Object.values(ContractDuration).includes(duration as ContractDuration)) {
      parsedDuration = duration as ContractDuration;
    }

    let parsedStatus: ContractStatus | undefined = undefined;
    if (status && Object.values(ContractStatus).includes(status as ContractStatus)) {
      parsedStatus = status as ContractStatus;
    }

    const newStartDate = startDate && !isNaN(Date.parse(startDate)) ? new Date(startDate) : existingContract.startDate;
    const effectiveDuration = parsedDuration || existingContract.duration;
    const newEndDate = endDate && !isNaN(Date.parse(endDate))
      ? new Date(endDate)
      : (startDate ? calculateEndDate(newStartDate, effectiveDuration) : existingContract.endDate);

    const effectiveTariff = parsedTariff || existingContract.tariff;
    const newAmount = amount !== undefined ? Number(amount) : (parsedTariff ? calculateTariffAmount(effectiveTariff) : existingContract.amount);

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        companyId: companyId !== undefined ? companyId : existingContract.companyId,
        doctorId: cleanDoctorId,
        tariff: effectiveTariff,
        duration: effectiveDuration,
        startDate: newStartDate,
        endDate: newEndDate,
        amount: newAmount,
        status: parsedStatus !== undefined ? parsedStatus : existingContract.status,
      },
      include: {
        company: true,
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Actualizar asignación del doctor a la empresa
    if (cleanDoctorId && companyId) {
      await prisma.doctor.update({
        where: { id: cleanDoctorId },
        data: { companyId },
      });
    }

    res.status(200).json({ message: 'Contrato actualizado exitosamente', contract: updatedContract });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ message: 'Error interno al actualizar el contrato' });
  }
};

export const deleteContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      res.status(404).json({ message: 'Contrato no encontrado' });
      return;
    }

    await prisma.contract.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Contrato eliminado exitosamente del sistema' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ message: 'Error al eliminar el contrato' });
  }
};
