import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_dev';
const SET_PASSWORD_EXPIRES_IN = process.env.SET_PASSWORD_TOKEN_EXPIRES_IN || '24h';

export interface SetPasswordPayload {
  userId: string;
  email: string;
  type: 'SET_PASSWORD';
}

/**
 * Genera un token JWT temporal y seguro para que un usuario configure su contraseña por primera vez.
 */
export const generateSetPasswordToken = (userId: string, email: string): string => {
  const payload: SetPasswordPayload = {
    userId,
    email,
    type: 'SET_PASSWORD',
  };

  const options: SignOptions = {
    expiresIn: SET_PASSWORD_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Valida un token de seteo de contraseña.
 * Retorna el payload decodificado si es válido y no ha expirado; lanza error si es inválido.
 */
export const verifySetPasswordToken = (token: string): { userId: string; email: string } => {
  const decoded = jwt.verify(token, JWT_SECRET) as any;

  if (!decoded || decoded.type !== 'SET_PASSWORD' || !decoded.userId || !decoded.email) {
    throw new Error('Token de configuración de contraseña inválido o corrupto');
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
  };
};
