import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { hashPassword } from '../utils/password';
import { generateSetPasswordToken } from '../utils/token';
import { sendSetPasswordEmail } from '../services/email.service';

export const getCompanies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        doctors: {
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
    res.status(200).json(companies);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching companies';
    console.error('Error fetching companies:', message);
    res.status(500).json({ message: 'Error fetching companies' });
  }
};

export const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        patients: true,
        contracts: true,
        doctors: {
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

    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    res.status(200).json(company);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching company details';
    console.error('Error fetching company by ID:', message);
    res.status(500).json({ message: 'Error fetching company details' });
  }
};

export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      legalName,
      representativeName,
      representativeTitle,
      taxId,
      address,
      phone,
      email,
    } = req.body;

    const effectiveLegalName = legalName ? String(legalName).trim() : null;
    const effectiveName = (name && typeof name === 'string' && name.trim() !== '')
      ? name.trim()
      : effectiveLegalName;

    if (!effectiveName) {
      res.status(400).json({ message: 'El nombre legal de la empresa es obligatorio' });
      return;
    }

    if (taxId && typeof taxId === 'string' && taxId.trim() !== '') {
      const cleanTaxId = taxId.trim().toUpperCase();
      const existingCompany = await prisma.company.findUnique({
        where: { taxId: cleanTaxId },
      });
      if (existingCompany) {
        res.status(409).json({ message: 'Ya existe una empresa registrada con este RFC / Tax ID' });
        return;
      }
    }

    const cleanEmail = email && typeof email === 'string' && email.trim() !== ''
      ? email.trim().toLowerCase()
      : null;

    // Si se proporciona correo corporativo, se crea usuario y se despacha invitación
    if (cleanEmail) {
      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        const randomPassword = crypto.randomBytes(24).toString('hex');
        const hashedPassword = await hashPassword(randomPassword);

        user = await prisma.user.create({
          data: {
            name: representativeName ? String(representativeName).trim() : (legalName ? String(legalName).trim() : name.trim()),
            email: cleanEmail,
            password: hashedPassword,
            role: 'OPERATIVE',
          },
        });
      }

      try {
        const token = generateSetPasswordToken(user.id, cleanEmail);
        await sendSetPasswordEmail({
          to: cleanEmail,
          name: representativeName ? String(representativeName).trim() : (legalName ? String(legalName).trim() : name.trim()),
          token,
          roleOrEntity: 'Empresa Cliente B2B',
        });
      } catch (emailError) {
        console.error('Error enviando correo de activación de empresa:', emailError);
      }
    }

    const company = await prisma.company.create({
      data: {
        name: effectiveName,
        legalName: effectiveLegalName || effectiveName,
        representativeName: representativeName ? String(representativeName).trim() : null,
        representativeTitle: representativeTitle ? String(representativeTitle).trim() : null,
        taxId: taxId ? String(taxId).trim().toUpperCase() : null,
        address: address ? String(address).trim() : null,
        phone: phone ? String(phone).trim() : null,
        email: cleanEmail,
      },
    });

    res.status(201).json({
      message: 'Empresa registrada exitosamente. Se ha despachado el enlace de activación por correo electrónico.',
      company,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al registrar la empresa';
    console.error('Error creating company:', message);
    res.status(500).json({ message: 'Error interno al registrar la empresa' });
  }
};

export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      legalName,
      representativeName,
      representativeTitle,
      taxId,
      address,
      phone,
      email,
    } = req.body;

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    if (taxId && typeof taxId === 'string' && taxId.trim().toUpperCase() !== existingCompany.taxId) {
      const cleanTaxId = taxId.trim().toUpperCase();
      const taxIdCheck = await prisma.company.findUnique({
        where: { taxId: cleanTaxId },
      });
      if (taxIdCheck) {
        res.status(409).json({ message: 'El RFC ya está registrado para otra empresa' });
        return;
      }
    }

    const cleanEmail = email !== undefined
      ? (email && typeof email === 'string' && email.trim() !== '' ? email.trim().toLowerCase() : null)
      : existingCompany.email;

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : (legalName !== undefined && legalName ? String(legalName).trim() : existingCompany.name),
        legalName: legalName !== undefined ? (legalName ? String(legalName).trim() : null) : existingCompany.legalName,
        representativeName: representativeName !== undefined ? (representativeName ? String(representativeName).trim() : null) : existingCompany.representativeName,
        representativeTitle: representativeTitle !== undefined ? (representativeTitle ? String(representativeTitle).trim() : null) : existingCompany.representativeTitle,
        taxId: taxId !== undefined ? (taxId ? String(taxId).trim().toUpperCase() : null) : existingCompany.taxId,
        address: address !== undefined ? (address ? String(address).trim() : null) : existingCompany.address,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : existingCompany.phone,
        email: cleanEmail,
      },
    });

    res.status(200).json({ message: 'Empresa actualizada exitosamente', company: updatedCompany });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al actualizar la empresa';
    console.error('Error updating company:', message);
    res.status(500).json({ message: 'Error interno al actualizar la empresa' });
  }
};

export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    await prisma.company.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Empresa eliminada exitosamente del sistema' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar la empresa';
    console.error('Error deleting company:', message);
    res.status(500).json({ message: 'Error al eliminar la empresa' });
  }
};
