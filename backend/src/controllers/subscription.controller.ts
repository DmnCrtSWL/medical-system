import { Request, Response } from 'express';
import { BillingCycle, Role, ServiceLocationType } from '@prisma/client';
import prisma from '../config/db';
import { MEDICAL_PLANS, SERVICE_LABELS, findPlan } from '../config/plans';
import { chargeCard, CardInput, validateCard, detectCardBrand } from '../services/paymentGateway.service';
import { hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const addBillingPeriod = (from: Date, cycle: BillingCycle): Date => {
  const next = new Date(from);
  if (cycle === BillingCycle.ANNUAL) next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * 1. Catálogo público de paquetes médicos
 */
export const getPlans = (_req: Request, res: Response): void => {
  res.status(200).json({ plans: MEDICAL_PLANS });
};

/**
 * 2. Compra de paquete: cobra la tarjeta, crea la cuenta de cliente y su suscripción
 */
export const checkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, billingCycle, name, email, password, phone, card } = req.body as {
      planId: string;
      billingCycle: BillingCycle;
      name: string;
      email: string;
      password: string;
      phone?: string;
      card: CardInput;
    };

    const plan = findPlan(planId);
    if (!plan) {
      res.status(400).json({ message: 'El paquete seleccionado no existe.' });
      return;
    }
    if (billingCycle !== BillingCycle.MONTHLY && billingCycle !== BillingCycle.ANNUAL) {
      res.status(400).json({ message: 'Selecciona el tipo de cobro (mensual o anual).' });
      return;
    }
    if (!name || !email || !password || !card) {
      res.status(400).json({ message: 'Nombre, correo, contraseña y tarjeta son obligatorios.' });
      return;
    }
    if (String(password).length < 8) {
      res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      res.status(409).json({ message: 'Ya existe una cuenta con este correo. Inicia sesión en el portal.' });
      return;
    }

    const amount = billingCycle === BillingCycle.ANNUAL ? plan.annualPrice : plan.monthlyPrice;
    const charge = await chargeCard(card, amount);
    if (!charge.success) {
      res.status(402).json({ message: charge.error || 'No fue posible procesar el pago.' });
      return;
    }

    const now = new Date();
    const expYear = Number(card.expYear) < 100 ? 2000 + Number(card.expYear) : Number(card.expYear);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: String(name).trim(),
        password: await hashPassword(password),
        role: Role.CLIENT,
        subscription: {
          create: {
            planId: plan.id,
            billingCycle,
            amount,
            phone: phone || null,
            startDate: now,
            periodStart: now,
            nextBillingDate: addBillingPeriod(now, billingCycle),
            cardBrand: charge.brand as string,
            cardLast4: charge.last4 as string,
            cardExpMonth: Number(card.expMonth),
            cardExpYear: expYear,
            cardHolder: String(card.holder).trim(),
            payments: {
              create: {
                amount,
                reference: charge.reference as string,
                cardLast4: charge.last4 as string,
                paidAt: now,
              },
            },
          },
        },
      },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({
      message: 'Suscripción activada',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      paymentReference: charge.reference,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al procesar la compra';
    console.error('Error en checkout de suscripción:', message);
    res.status(500).json({ message: 'Error interno al procesar la compra' });
  }
};

/**
 * 3. Resumen del portal: plan, consumo de servicios, método de pago y fecha de corte
 */
export const getPortalSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true, email: true } },
        usages: { orderBy: { usedAt: 'desc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });

    if (!subscription) {
      res.status(404).json({ message: 'No tienes una suscripción activa.' });
      return;
    }

    const plan = findPlan(subscription.planId);
    const periodUsages = subscription.usages.filter((u) => u.usedAt >= subscription.periodStart);
    const services = (plan?.services || []).map((s) => {
      const used = periodUsages.filter((u) => u.serviceKey === s.key).length;
      return {
        ...s,
        used,
        remaining: s.allowance === -1 ? null : Math.max(s.allowance - used, 0),
        unlimited: s.allowance === -1,
      };
    });

    const periodEnd = new Date(subscription.periodStart);
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    res.status(200).json({
      customer: subscription.user,
      plan: plan ? { id: plan.id, name: plan.name, perks: plan.perks } : null,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        startDate: subscription.startDate,
        periodStart: subscription.periodStart,
        periodEnd,
        nextBillingDate: subscription.nextBillingDate,
      },
      paymentMethod: {
        brand: subscription.cardBrand,
        last4: subscription.cardLast4,
        expMonth: subscription.cardExpMonth,
        expYear: subscription.cardExpYear,
        holder: subscription.cardHolder,
      },
      services,
      recentUsage: subscription.usages.slice(0, 10).map((u) => ({
        id: u.id,
        serviceKey: u.serviceKey,
        label: SERVICE_LABELS[u.serviceKey] || u.serviceKey,
        usedAt: u.usedAt,
        locationName: u.locationName,
        notes: u.notes,
      })),
      payments: subscription.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        reference: p.reference,
        cardLast4: p.cardLast4,
        paidAt: p.paidAt,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener el resumen';
    console.error('Error en resumen del portal:', message);
    res.status(500).json({ message: 'Error interno al consultar tu suscripción' });
  }
};

/**
 * 4. Actualiza la tarjeta de cobro de la suscripción
 */
export const updatePaymentMethod = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const card = req.body?.card as CardInput;
    const validationError = card ? validateCard(card) : 'Ingresa los datos de la tarjeta.';
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const digits = card.number.replace(/\D/g, '');
    const expYear = Number(card.expYear) < 100 ? 2000 + Number(card.expYear) : Number(card.expYear);
    const updated = await prisma.subscription.update({
      where: { userId: req.user!.id },
      data: {
        cardBrand: detectCardBrand(digits),
        cardLast4: digits.slice(-4),
        cardExpMonth: Number(card.expMonth),
        cardExpYear: expYear,
        cardHolder: card.holder.trim(),
      },
    });

    res.status(200).json({
      message: 'Método de pago actualizado',
      paymentMethod: {
        brand: updated.cardBrand,
        last4: updated.cardLast4,
        expMonth: updated.cardExpMonth,
        expYear: updated.cardExpYear,
        holder: updated.cardHolder,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar el método de pago';
    console.error('Error al actualizar método de pago:', message);
    res.status(500).json({ message: 'Error interno al actualizar tu tarjeta' });
  }
};

/**
 * 5. Buscador de servicios cercanos (clínicas, laboratorios, farmacias y hospitales de la red)
 */
export const searchServiceLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const type = String(req.query.type || '').toUpperCase();
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const hasOrigin = Number.isFinite(lat) && Number.isFinite(lng) && req.query.lat !== undefined;

    const locations = await prisma.serviceLocation.findMany({
      where: Object.values(ServiceLocationType).includes(type as ServiceLocationType)
        ? { type: type as ServiceLocationType }
        : {},
    });

    const results = locations
      .filter((l) => {
        if (!q) return true;
        const haystack = [l.name, l.address, l.city, ...l.services].join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .map((l) => ({ ...l, distanceKm: hasOrigin ? Math.round(distanceKm(lat, lng, l.lat, l.lng) * 10) / 10 : null }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    res.status(200).json({ locations: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al buscar servicios';
    console.error('Error en buscador de servicios:', message);
    res.status(500).json({ message: 'Error interno al buscar servicios cercanos' });
  }
};
