import cron, { ScheduledTask } from 'node-cron';
import prisma from '../config/db';
import { ContractStatus, TransactionType, TransactionCategory, ContractTariff } from '@prisma/client';
import logger from '../utils/logger';

export interface ExpiredContractResult {
  contractId: string;
  companyId: string;
  companyName: string;
  endDate: Date;
}

export interface MonthlyChargeResult {
  contractId: string;
  companyId: string;
  companyName: string;
  doctorId: string | null;
  amount: number;
  transactionId: string;
  periodLabel: string;
}

export interface ContractAuditSummary {
  timestamp: string;
  referenceDate: string;
  expiredContractsCount: number;
  expiredContracts: ExpiredContractResult[];
  chargesCreatedCount: number;
  chargesCreated: MonthlyChargeResult[];
  errors: string[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Determina el monto del contrato según la tarifa o monto personalizado.
 */
export const calculateContractAmount = (tariff?: ContractTariff | null, customAmount?: number | null): number => {
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

/**
 * 1. Identifica contratos activos con fecha de fin superada y actualiza su estatus a EXPIRED.
 */
export const expireOverdueContracts = async (referenceDate: Date = new Date()): Promise<ExpiredContractResult[]> => {
  const expiredResults: ExpiredContractResult[] = [];

  try {
    const overdueContracts = await prisma.contract.findMany({
      where: {
        status: ContractStatus.ACTIVE,
        endDate: {
          lt: referenceDate,
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (overdueContracts.length === 0) {
      logger.info('[CRON] No se encontraron contratos activos vencidos para expirar.');
      return expiredResults;
    }

    for (const contract of overdueContracts) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: ContractStatus.EXPIRED },
      });

      const item: ExpiredContractResult = {
        contractId: contract.id,
        companyId: contract.companyId,
        companyName: contract.company.name,
        endDate: contract.endDate,
      };

      expiredResults.push(item);
      logger.info(
        `[CRON:AUDITORIA] Contrato vencido actualizado a EXPIRED: ID=${contract.id} | Empresa=${contract.company.name} | Fin=${contract.endDate.toISOString().split('T')[0]}`
      );
    }

    logger.info(`[CRON] Total de contratos expirados en este barrido: ${expiredResults.length}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al expirar contratos';
    logger.error(`[CRON:ERROR] Error al procesar expiración de contratos: ${message}`);
    throw error;
  }

  return expiredResults;
};

/**
 * 2. Para contratos activos, calcula la fecha de corte mensual y genera el cargo mensual correspondiente en Finanzas.
 * @param referenceDate Fecha de evaluación (por defecto hoy).
 * @param forceCheckAll Si es true, ignora el día exacto de corte y genera el cargo si el mes actual aún no ha sido facturado.
 */
export const processRecurringMonthlyCharges = async (
  referenceDate: Date = new Date(),
  forceCheckAll: boolean = false
): Promise<{ charges: MonthlyChargeResult[]; errors: string[] }> => {
  const charges: MonthlyChargeResult[] = [];
  const errors: string[] = [];

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const periodLabel = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const monthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  try {
    const activeContracts = await prisma.contract.findMany({
      where: {
        status: ContractStatus.ACTIVE,
        startDate: {
          lte: referenceDate,
        },
        endDate: {
          gte: referenceDate,
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
          },
        },
      },
    });

    for (const contract of activeContracts) {
      try {
        const startDay = new Date(contract.startDate).getDate();
        const cutoffDay = Math.min(startDay, daysInCurrentMonth);

        // Si no estamos forzando la evaluación, validar si hoy es exactamente la fecha de corte
        if (!forceCheckAll && currentDay !== cutoffDay) {
          continue;
        }

        // Validar idempotencia: comprobar si ya se emitió una transacción de contrato para esta empresa en el periodo actual
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            companyId: contract.companyId,
            category: TransactionCategory.B2B_CONTRACT,
            type: TransactionType.INCOME,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        });

        if (existingTransaction) {
          logger.debug(
            `[CRON] Cargo recurrente omitido (ya existe factura): Empresa=${contract.company.name} | Periodo=${periodLabel}`
          );
          continue;
        }

        const chargeAmount = calculateContractAmount(contract.tariff, contract.amount);

        const newTransaction = await prisma.transaction.create({
          data: {
            description: `Iguala Mensual B2B - ${periodLabel}`,
            amount: chargeAmount,
            type: TransactionType.INCOME,
            category: TransactionCategory.B2B_CONTRACT,
            companyId: contract.companyId,
            doctorId: contract.doctorId,
            date: referenceDate,
          },
        });

        const chargeResult: MonthlyChargeResult = {
          contractId: contract.id,
          companyId: contract.companyId,
          companyName: contract.company.name,
          doctorId: contract.doctorId,
          amount: chargeAmount,
          transactionId: newTransaction.id,
          periodLabel,
        };

        charges.push(chargeResult);
        logger.info(
          `[CRON:AUDITORIA] Cargo mensual generado exitosamente: Transaccion=${newTransaction.id} | Empresa=${contract.company.name} | Monto=$${chargeAmount} | Periodo=${periodLabel}`
        );
      } catch (contractErr: unknown) {
        const errMsg = contractErr instanceof Error ? contractErr.message : 'Error desconocido al procesar cargo';
        logger.error(`[CRON:ERROR] Error al procesar cargo del contrato ${contract.id}: ${errMsg}`);
        errors.push(`Contrato ${contract.id}: ${errMsg}`);
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al listar contratos activos';
    logger.error(`[CRON:ERROR] Error al obtener contratos para cargos recurrentes: ${message}`);
    errors.push(message);
  }

  return { charges, errors };
};

/**
 * 3. Orquestador general del barrido de contratos con registro de auditoría.
 */
export const runContractAuditJob = async (
  referenceDate: Date = new Date(),
  forceCheckAll: boolean = false
): Promise<ContractAuditSummary> => {
  logger.info(`[CRON:INICIO] Iniciando barrido de contratos para la fecha ${referenceDate.toISOString()}...`);

  const errors: string[] = [];
  let expiredContracts: ExpiredContractResult[] = [];
  let chargesCreated: MonthlyChargeResult[] = [];

  try {
    expiredContracts = await expireOverdueContracts(referenceDate);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fallo en proceso de expiración';
    errors.push(msg);
  }

  try {
    const chargeResult = await processRecurringMonthlyCharges(referenceDate, forceCheckAll);
    chargesCreated = chargeResult.charges;
    errors.push(...chargeResult.errors);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fallo en cargos mensuales';
    errors.push(msg);
  }

  const summary: ContractAuditSummary = {
    timestamp: new Date().toISOString(),
    referenceDate: referenceDate.toISOString(),
    expiredContractsCount: expiredContracts.length,
    expiredContracts,
    chargesCreatedCount: chargesCreated.length,
    chargesCreated,
    errors,
  };

  logger.info(
    `[CRON:RESUMEN] Auditoría finalizada. Expirados: ${summary.expiredContractsCount} | Cargos generados: ${summary.chargesCreatedCount} | Errores: ${errors.length}`
  );

  return summary;
};

/**
 * 4. Inicializador del cron job en segundo plano (diario a medianoche 00:00).
 */
export const initContractCron = (): ScheduledTask => {
  const schedule = process.env.CONTRACT_CRON_SCHEDULE || '0 0 * * *';

  logger.info(`[CRON] Registrando cron job de contratos con expresión: "${schedule}"`);

  return cron.schedule(schedule, async () => {
    try {
      await runContractAuditJob();
    } catch (cronErr: unknown) {
      const msg = cronErr instanceof Error ? cronErr.message : 'Error no controlado en cron';
      logger.error(`[CRON:FATAL] Excepción no controlada en ejecución de cron diario: ${msg}`);
    }
  });
};
