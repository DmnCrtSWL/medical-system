import { Request, Response } from 'express';
import { PrismaClient, TransactionType, TransactionCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Interface para respuestas de error estandarizadas
interface ApiErrorResponse {
  error: string;
}

// 1. Obtener todas las transacciones financieras con filtros opcionales
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, category, companyId, doctorId } = req.query;

    const whereClause: {
      type?: TransactionType;
      category?: TransactionCategory;
      companyId?: string;
      doctorId?: string;
    } = {};

    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      whereClause.type = type as TransactionType;
    }

    if (category && Object.values(TransactionCategory).includes(category as TransactionCategory)) {
      whereClause.category = category as TransactionCategory;
    }

    if (companyId && typeof companyId === 'string') {
      whereClause.companyId = companyId;
    }

    if (doctorId && typeof doctorId === 'string') {
      whereClause.doctorId = doctorId;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            taxId: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.status(200).json(transactions);
  } catch (error) {
    const err = error as Error;
    const response: ApiErrorResponse = { error: err.message || 'Error al obtener la lista de transacciones' };
    res.status(500).json(response);
  }
};

// 2. Obtener una transacción por ID
export const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            taxId: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      res.status(404).json({ error: 'Transacción financiera no encontrada' });
      return;
    }

    res.status(200).json(transaction);
  } catch (error) {
    const err = error as Error;
    const response: ApiErrorResponse = { error: err.message || 'Error al obtener la transacción' };
    res.status(500).json(response);
  }
};

// 3. Crear una nueva transacción financiera (Ingreso, Gasto u Honorario)
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, amount, type, category, companyId, doctorId, date } = req.body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ error: 'La descripción es obligatoria' });
      return;
    }

    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'El monto debe ser un número positivo en $ MXN' });
      return;
    }

    if (!type || !Object.values(TransactionType).includes(type as TransactionType)) {
      res.status(400).json({ error: 'El tipo de transacción debe ser INCOME, EXPENSE u HONORARIUM' });
      return;
    }

    if (!category || !Object.values(TransactionCategory).includes(category as TransactionCategory)) {
      res.status(400).json({ error: 'Categoría de transacción no válida' });
      return;
    }

    const transactionDate = date ? new Date(date) : new Date();

    const newTransaction = await prisma.transaction.create({
      data: {
        description: description.trim(),
        amount,
        type: type as TransactionType,
        category: category as TransactionCategory,
        companyId: companyId || null,
        doctorId: doctorId || null,
        date: transactionDate,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    const err = error as Error;
    const response: ApiErrorResponse = { error: err.message || 'Error al crear la transacción financiera' };
    res.status(500).json(response);
  }
};

// 4. Actualizar una transacción existente
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, amount, type, category, companyId, doctorId, date } = req.body;

    const existingTransaction = await prisma.transaction.findUnique({ where: { id } });
    if (!existingTransaction) {
      res.status(404).json({ error: 'Transacción financiera no encontrada' });
      return;
    }

    const updateData: {
      description?: string;
      amount?: number;
      type?: TransactionType;
      category?: TransactionCategory;
      companyId?: string | null;
      doctorId?: string | null;
      date?: Date;
    } = {};

    if (description && typeof description === 'string') {
      updateData.description = description.trim();
    }

    if (amount !== undefined && typeof amount === 'number' && amount > 0) {
      updateData.amount = amount;
    }

    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      updateData.type = type as TransactionType;
    }

    if (category && Object.values(TransactionCategory).includes(category as TransactionCategory)) {
      updateData.category = category as TransactionCategory;
    }

    if (companyId !== undefined) {
      updateData.companyId = companyId || null;
    }

    if (doctorId !== undefined) {
      updateData.doctorId = doctorId || null;
    }

    if (date) {
      updateData.date = new Date(date);
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTransaction);
  } catch (error) {
    const err = error as Error;
    const response: ApiErrorResponse = { error: err.message || 'Error al actualizar la transacción' };
    res.status(500).json(response);
  }
};

// 5. Eliminar una transacción
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingTransaction = await prisma.transaction.findUnique({ where: { id } });
    if (!existingTransaction) {
      res.status(404).json({ error: 'Transacción financiera no encontrada' });
      return;
    }

    await prisma.transaction.delete({ where: { id } });

    res.status(200).json({ message: 'Transacción eliminada correctamente' });
  } catch (error) {
    const err = error as Error;
    const response: ApiErrorResponse = { error: err.message || 'Error al eliminar la transacción' };
    res.status(500).json(response);
  }
};

// 6. Obtener Resumen Financiero Agregado (Ingresos, Gastos, Honorarios y Balance Neto)
export const getFinancialSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany();

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalHonoraria = 0;

    transactions.forEach((tx) => {
      if (tx.type === TransactionType.INCOME) {
        totalIncome += tx.amount;
      } else if (tx.type === TransactionType.EXPENSE) {
        totalExpenses += tx.amount;
      } else if (tx.type === TransactionType.HONORARIUM) {
        totalHonoraria += tx.amount;
      }
    });

    const netBalance = totalIncome - totalExpenses - totalHonoraria;

    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: {
        date: 'desc',
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      totalIncome,
      totalExpenses,
      totalHonoraria,
      netBalance,
      transactionCount: transactions.length,
      recentTransactions,
    });
  } catch (error) {
    const err = error as Error;
    const response: ApiErrorResponse = { error: err.message || 'Error al calcular el resumen financiero' };
    res.status(500).json(response);
  }
};
