import { Request, Response } from 'express';
import prisma from '../config/db';

export const getCompanies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(companies);
  } catch (error: any) {
    console.error('Error fetching companies:', error);
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
        doctors: true,
      },
    });

    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    res.status(200).json(company);
  } catch (error: any) {
    console.error('Error fetching company by ID:', error);
    res.status(500).json({ message: 'Error fetching company details' });
  }
};

export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, taxId, address, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'Company name is required' });
      return;
    }

    if (taxId) {
      const existingCompany = await prisma.company.findUnique({
        where: { taxId },
      });
      if (existingCompany) {
        res.status(409).json({ message: 'Company with this taxId already exists' });
        return;
      }
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        taxId: taxId ? taxId.trim() : null,
        address: address ? address.trim() : null,
        phone: phone ? phone.trim() : null,
      },
    });

    res.status(201).json({ message: 'Company created successfully', company });
  } catch (error: any) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Error creating company' });
  }
};

export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, taxId, address, phone } = req.body;

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    if (taxId && taxId !== existingCompany.taxId) {
      const taxIdCheck = await prisma.company.findUnique({
        where: { taxId },
      });
      if (taxIdCheck) {
        res.status(409).json({ message: 'Tax ID is already in use by another company' });
        return;
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingCompany.name,
        taxId: taxId !== undefined ? (taxId ? taxId.trim() : null) : existingCompany.taxId,
        address: address !== undefined ? (address ? address.trim() : null) : existingCompany.address,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : existingCompany.phone,
      },
    });

    res.status(200).json({ message: 'Company updated successfully', company: updatedCompany });
  } catch (error: any) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Error updating company' });
  }
};

export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    await prisma.company.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Error deleting company' });
  }
};
