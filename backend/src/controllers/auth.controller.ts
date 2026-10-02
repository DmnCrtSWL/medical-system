import { Request, Response } from 'express';
import prisma from '../config/db';
import { comparePassword, hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { verifySetPasswordToken } from '../utils/token';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { verifySmtpConnection, sendTestEmail } from '../services/email.service';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Buscar usuario por email con tipado estricto de Prisma
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error during authentication';
    console.error('Login error:', message);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    res.status(200).json({ user: req.user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching user profile';
    console.error('getMe error:', message);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

export const verifySetPasswordTokenHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.query.token as string) || req.body.token;

    if (!token) {
      res.status(400).json({ valid: false, message: 'El token es requerido' });
      return;
    }

    let payload;
    try {
      payload = verifySetPasswordToken(token);
    } catch {
      res.status(400).json({ valid: false, message: 'El enlace ha expirado o es inválido' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.status(404).json({ valid: false, message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor al verificar el token';
    console.error('Error en verifySetPasswordTokenHandler:', message);
    res.status(500).json({ valid: false, message: 'Error interno del servidor al verificar el token' });
  }
};

export const setPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: 'El token y la nueva contraseña son requeridos' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'La contraseña debe contener al menos 8 caracteres' });
      return;
    }

    let payload;
    try {
      payload = verifySetPasswordToken(token);
    } catch {
      res.status(400).json({ message: 'El enlace para establecer contraseña ha expirado o es inválido' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    const sessionToken = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    res.status(200).json({
      message: 'Contraseña establecida exitosamente',
      token: sessionToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al establecer la contraseña';
    console.error('Error en setPassword:', message);
    res.status(500).json({ message: 'Error interno al establecer la contraseña' });
  }
};

export const checkSmtpStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isConfigured = Boolean(process.env.SMTP_HOST || process.env.SMTP_SERVICE);
    const host = process.env.SMTP_HOST || 'No configurado';
    const port = process.env.SMTP_PORT || '587';
    const user = process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-4) : 'No configurado';
    const from = process.env.SMTP_FROM || 'MedSys B2B <no-reply@medicalsystem.com>';
    const frontendUrl = process.env.APP_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const verification = await verifySmtpConnection();

    res.status(200).json({
      configured: isConfigured,
      host,
      port,
      user,
      from,
      frontendUrl,
      smtpStatus: verification,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al comprobar estado SMTP';
    res.status(500).json({ message: 'Error al comprobar estado SMTP', error: message });
  }
};

export const sendTestEmailHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { to } = req.body;
    if (!to || typeof to !== 'string') {
      res.status(400).json({ message: 'El correo electrónico destinatario "to" es requerido' });
      return;
    }

    const result = await sendTestEmail(to);
    if (!result.success) {
      res.status(502).json({
        message: 'No se pudo enviar el correo de prueba',
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      message: `Correo de prueba enviado exitosamente a ${to}`,
      messageId: result.messageId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al procesar el envío de prueba';
    res.status(500).json({ message: 'Error al procesar el envío de prueba', error: message });
  }
};
