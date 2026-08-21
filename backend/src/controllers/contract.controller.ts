import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateContractPdf } from '../utils/contractPdfGenerator';
import { ContractStatus } from '@prisma/client';

export const getContracts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
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
      },
    });

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    res.status(200).json(contract);
  } catch (error) {
    console.error('Error fetching contract details:', error);
    res.status(500).json({ message: 'Error fetching contract details' });
  }
};

export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, startDate, endDate, amount, status } = req.body;

    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      res.status(400).json({ message: 'companyId is required' });
      return;
    }

    if (!startDate || isNaN(Date.parse(startDate))) {
      res.status(400).json({ message: 'Valid startDate is required' });
      return;
    }

    if (!endDate || isNaN(Date.parse(endDate))) {
      res.status(400).json({ message: 'Valid endDate is required' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      res.status(404).json({ message: 'Specified company does not exist' });
      return;
    }

    let parsedStatus: ContractStatus = ContractStatus.ACTIVE;
    if (status && Object.values(ContractStatus).includes(status as ContractStatus)) {
      parsedStatus = status as ContractStatus;
    }

    const contract = await prisma.contract.create({
      data: {
        companyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        amount: amount !== undefined && amount !== null ? Number(amount) : null,
        status: parsedStatus,
      },
      include: {
        company: true,
      },
    });

    res.status(201).json({ message: 'Contract created successfully', contract });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ message: 'Error creating contract' });
  }
};

export const downloadContractPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    const pdfBuffer = await generateContractPdf({
      contractId: contract.id,
      startDate: contract.startDate,
      endDate: contract.endDate,
      amount: contract.amount,
      status: contract.status,
      company: {
        name: contract.company.name,
        taxId: contract.company.taxId,
        address: contract.company.address,
        phone: contract.company.phone,
      },
    });

    const safeCompanyName = contract.company.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Contrato_${safeCompanyName}_${contract.id.slice(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    res.status(500).json({ message: 'Error generating contract PDF' });
  }
};

export const updateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { companyId, startDate, endDate, amount, status } = req.body;

    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    if (companyId && companyId !== existingContract.companyId) {
      const companyExists = await prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!companyExists) {
        res.status(404).json({ message: 'Specified company does not exist' });
        return;
      }
    }

    let parsedStatus: ContractStatus | undefined = undefined;
    if (status && Object.values(ContractStatus).includes(status as ContractStatus)) {
      parsedStatus = status as ContractStatus;
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        companyId: companyId !== undefined ? companyId : existingContract.companyId,
        startDate: startDate && !isNaN(Date.parse(startDate)) ? new Date(startDate) : existingContract.startDate,
        endDate: endDate && !isNaN(Date.parse(endDate)) ? new Date(endDate) : existingContract.endDate,
        amount: amount !== undefined ? (amount !== null ? Number(amount) : null) : existingContract.amount,
        status: parsedStatus !== undefined ? parsedStatus : existingContract.status,
      },
      include: {
        company: true,
      },
    });

    res.status(200).json({ message: 'Contract updated successfully', contract: updatedContract });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ message: 'Error updating contract' });
  }
};

export const deleteContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    await prisma.contract.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ message: 'Error deleting contract' });
  }
};
