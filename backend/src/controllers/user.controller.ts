import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { Role } from '@prisma/client';
import { generateSetPasswordToken } from '../utils/token';
import { sendSetPasswordEmail } from '../services/email.service';
import { hashPassword } from '../utils/password';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Obtener todos los usuarios registrados en el sistema
 */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error interno al obtener los usuarios' });
  }
};

/**
 * Crear un nuevo usuario en el sistema y disparar el correo con token expirable
 * para que defina su contraseña
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      res.status(400).json({ message: 'Nombre, correo electrónico y rol son obligatorios' });
      return;
    }

    const trimmedName = (name as string).trim();
    const trimmedEmail = (email as string).trim().toLowerCase();

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ message: 'El formato del correo electrónico no es válido' });
      return;
    }

    // Validar que el rol exista en el enum Role
    const validRoles = Object.values(Role);
    if (!validRoles.includes(role as Role)) {
      res.status(400).json({ message: `Rol inválido. Debe ser uno de: ${validRoles.join(', ')}` });
      return;
    }

    // Verificar si ya existe un usuario con este correo
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      res.status(400).json({ message: 'El correo electrónico ya se encuentra registrado en el sistema' });
      return;
    }

    // Generar contraseña temporal segura aleatoria y hashearla
    const tempPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await hashPassword(tempPassword);

    const newUser = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        role: role as Role,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generar token expirable (24 horas) y enviar correo de bienvenida
    const setPasswordToken = generateSetPasswordToken(newUser.id, newUser.email);
    let roleLabel = 'Usuario del Sistema';
    if (newUser.role === Role.ADMIN) roleLabel = 'Administrador General';
    else if (newUser.role === Role.OPERATIVE) roleLabel = 'Operador del Sistema';
    else if (newUser.role === Role.DOCTOR) roleLabel = 'Médico';
    else if (newUser.role === Role.STAFF) roleLabel = 'Staff';

    await sendSetPasswordEmail({
      to: newUser.email,
      name: newUser.name,
      token: setPasswordToken,
      roleOrEntity: roleLabel,
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Se ha enviado un correo con el enlace para configurar su contraseña.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error interno al registrar el usuario' });
  }
};

/**
 * Eliminar un usuario del sistema (impide que el administrador activo se elimine a sí mismo)
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authUser = req.user;

    if (authUser && authUser.id === id) {
      res.status(400).json({ message: 'No puedes eliminar tu propia cuenta activa de administrador' });
      return;
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Usuario eliminado exitosamente del sistema' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error interno al eliminar el usuario' });
  }
};
