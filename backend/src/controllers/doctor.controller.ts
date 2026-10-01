import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { hashPassword } from '../utils/password';
import { generateSetPasswordToken } from '../utils/token';
import fs from 'fs';
import path from 'path';
import { sendSetPasswordEmail } from '../services/email.service';

export const getDoctors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        company: true,
      },
    });
    res.status(200).json(doctors);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching doctors';
    console.error('Error fetching doctors:', message);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
};

export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        company: true,
      },
    });

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    res.status(200).json(doctor);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching doctor details';
    console.error('Error fetching doctor by ID:', message);
    res.status(500).json({ message: 'Error fetching doctor details' });
  }
};

export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, specialty, licenseId, university, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'El nombre completo del médico es obligatorio' });
      return;
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      res.status(400).json({ message: 'El correo electrónico es obligatorio' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { doctor: true },
    });

    if (existingUser?.doctor) {
      res.status(409).json({ message: 'Ya existe un perfil médico registrado con este correo electrónico' });
      return;
    }

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Generar contraseña aleatoria temporal; el médico configurará la suya vía correo
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);

      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'DOCTOR',
        },
      });
      userId = newUser.id;
    }

    // Determinar la URL o ruta del testigo de cédula
    let licenseFileUrl: string | null = null;
    if (req.file) {
      licenseFileUrl = `/uploads/licenses/${req.file.filename}`;
    } else if (req.body.licenseFileUrl || req.body.licenseUrl) {
      licenseFileUrl = String(req.body.licenseFileUrl || req.body.licenseUrl).trim();
    }

    const doctor = await prisma.doctor.create({
      data: {
        userId,
        specialty: specialty && typeof specialty === 'string' ? specialty.trim() : 'Medicina General',
        licenseId: licenseId ? String(licenseId).trim() : null,
        university: university ? String(university).trim() : null,
        licenseFileUrl,
        phone: phone ? String(phone).trim() : null,
        companyId: null, // Asignado exclusivamente mediante contratos B2B
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        company: true,
      },
    });

    // Disparar flujo de correo de activación de cuenta con token expirable (24 horas)
    try {
      const activationToken = generateSetPasswordToken(userId, cleanEmail);
      await sendSetPasswordEmail({
        to: cleanEmail,
        name: name.trim(),
        token: activationToken,
        roleOrEntity: 'Médico',
      });
    } catch (emailError) {
      console.error('Error enviando correo de activación al médico:', emailError);
    }

    res.status(201).json({
      message: 'Médico dado de alta exitosamente. Se ha enviado el enlace de activación por correo electrónico.',
      doctor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al registrar al médico';
    console.error('Error creating doctor:', message);
    res.status(500).json({ message: 'Error interno al registrar al médico' });
  }
};

export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, specialty, licenseId, university, phone } = req.body;

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingDoctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    if (email && email.trim().toLowerCase() !== existingDoctor.user.email) {
      const emailCheck = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (emailCheck) {
        res.status(409).json({ message: 'El correo electrónico ya está en uso por otro usuario' });
        return;
      }
    }

    if (name || email) {
      await prisma.user.update({
        where: { id: existingDoctor.userId },
        data: {
          name: name !== undefined ? name.trim() : existingDoctor.user.name,
          email: email !== undefined ? email.trim().toLowerCase() : existingDoctor.user.email,
        },
      });
    }

    let updatedLicenseFileUrl = existingDoctor.licenseFileUrl;
    if (req.file) {
      // Si subió un nuevo archivo y ya tenía uno previo, limpiar el anterior
      if (existingDoctor.licenseFileUrl && existingDoctor.licenseFileUrl.startsWith('/uploads/licenses/')) {
        const oldPath = path.join(__dirname, '../../uploads/licenses', path.basename(existingDoctor.licenseFileUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updatedLicenseFileUrl = `/uploads/licenses/${req.file.filename}`;
    } else if (req.body.removeLicenseFile === 'true' || req.body.removeLicenseFile === true) {
      if (existingDoctor.licenseFileUrl && existingDoctor.licenseFileUrl.startsWith('/uploads/licenses/')) {
        const oldPath = path.join(__dirname, '../../uploads/licenses', path.basename(existingDoctor.licenseFileUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updatedLicenseFileUrl = null;
    } else if (req.body.licenseFileUrl !== undefined || req.body.licenseUrl !== undefined) {
      const providedUrl = req.body.licenseFileUrl || req.body.licenseUrl;
      updatedLicenseFileUrl = providedUrl ? String(providedUrl).trim() : null;
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        specialty: specialty !== undefined ? specialty.trim() : existingDoctor.specialty,
        licenseId: licenseId !== undefined ? (licenseId ? String(licenseId).trim() : null) : existingDoctor.licenseId,
        university: university !== undefined ? (university ? String(university).trim() : null) : existingDoctor.university,
        licenseFileUrl: updatedLicenseFileUrl,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : existingDoctor.phone,
        // companyId se preserva intacto: se gestiona exclusivamente desde contratos B2B
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        company: true,
      },
    });

    res.status(200).json({ message: 'Médico actualizado exitosamente', doctor: updatedDoctor });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al actualizar al médico';
    console.error('Error updating doctor:', message);
    res.status(500).json({ message: 'Error interno al actualizar al médico' });
  }
};

export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!existingDoctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    await prisma.doctor.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Médico eliminado exitosamente del sistema' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar al médico';
    console.error('Error deleting doctor:', message);
    res.status(500).json({ message: 'Error al eliminar al médico' });
  }
};
