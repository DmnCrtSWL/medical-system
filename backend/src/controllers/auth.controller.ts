import { Request, Response } from 'express';
import prisma from '../config/db';
import { comparePassword, hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { verifySetPasswordToken } from '../utils/token';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

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
  } catch (error: any) {
    console.error('Login error:', error);
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
  } catch (error: any) {
    console.error('getMe error:', error);
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
  } catch (error) {
    console.error('Error en verifySetPasswordTokenHandler:', error);
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
  } catch (error) {
    console.error('Error en setPassword:', error);
    res.status(500).json({ message: 'Error interno al establecer la contraseña' });
  }
};
