import crypto from 'crypto';

/**
 * Pasarela de pagos con tarjeta.
 * Implementación en modo SANDBOX: valida la tarjeta y simula el cargo sin mover dinero real.
 * Para producción se reemplaza `chargeCard` por la llamada al proveedor (Stripe / Conekta / Openpay)
 * usando el token de tarjeta generado en el navegador, sin que el número completo llegue a este servidor.
 */
export interface CardInput {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  holder: string;
}

export interface ChargeResult {
  success: boolean;
  reference?: string;
  brand?: string;
  last4?: string;
  error?: string;
}

const luhnCheck = (digits: string): boolean => {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

export const detectCardBrand = (digits: string): string => {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  return 'Tarjeta';
};

export const validateCard = (card: CardInput): string | null => {
  const digits = String(card.number || '').replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19 || !luhnCheck(digits)) return 'El número de tarjeta no es válido.';
  if (!card.holder || card.holder.trim().length < 3) return 'Ingresa el nombre del titular.';
  if (!/^\d{3,4}$/.test(String(card.cvc || ''))) return 'El código de seguridad no es válido.';
  const month = Number(card.expMonth);
  const year = Number(card.expYear) < 100 ? 2000 + Number(card.expYear) : Number(card.expYear);
  if (!month || month < 1 || month > 12 || !year) return 'La fecha de vencimiento no es válida.';
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return 'La tarjeta está vencida.';
  }
  return null;
};

export const chargeCard = async (card: CardInput, amount: number): Promise<ChargeResult> => {
  const validationError = validateCard(card);
  if (validationError) return { success: false, error: validationError };

  const digits = card.number.replace(/\D/g, '');
  // Tarjeta de prueba que simula un rechazo del banco (mismo número que usa Stripe en modo test)
  if (digits === '4000000000000002') {
    return { success: false, error: 'El banco rechazó el cargo. Intenta con otra tarjeta.' };
  }
  if (!(amount > 0)) return { success: false, error: 'Monto inválido.' };

  return {
    success: true,
    reference: `PAY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    brand: detectCardBrand(digits),
    last4: digits.slice(-4),
  };
};
