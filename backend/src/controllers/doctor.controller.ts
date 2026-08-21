import { Request, Response } from 'express';
import prisma from '../config/db';
import { hashPassword } from '../utils/password';

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
  } catch (error) {
    console.error('Error fetching doctors:', error);
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
  } catch (error) {
    console.error('Error fetching doctor by ID:', error);
    res.status(500).json({ message: 'Error fetching doctor details' });
  }
};

export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, specialty, licenseId, phone, companyId } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'Doctor name is required' });
      return;
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      res.status(400).json({ message: 'Doctor email is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { doctor: true },
    });

    if (existingUser?.doctor) {
      res.status(409).json({ message: 'A doctor profile already exists for this email' });
      return;
    }

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const defaultPassword = password && typeof password === 'string' && password.length >= 6
        ? password
        : 'Doctor123!';
      const hashedPassword = await hashPassword(defaultPassword);

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

    if (companyId) {
      const companyExists = await prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!companyExists) {
        res.status(404).json({ message: 'Specified company does not exist' });
        return;
      }
    }

    const doctor = await prisma.doctor.create({
      data: {
        userId,
        specialty: specialty && typeof specialty === 'string' ? specialty.trim() : 'General',
        licenseId: licenseId ? String(licenseId).trim() : null,
        phone: phone ? String(phone).trim() : null,
        companyId: companyId || null,
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

    res.status(201).json({ message: 'Doctor created successfully', doctor });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Error creating doctor' });
  }
};

export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, specialty, licenseId, phone, companyId } = req.body;

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
        res.status(409).json({ message: 'Email is already in use by another user' });
        return;
      }
    }

    if (companyId) {
      const companyExists = await prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!companyExists) {
        res.status(404).json({ message: 'Specified company does not exist' });
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

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        specialty: specialty !== undefined ? specialty.trim() : existingDoctor.specialty,
        licenseId: licenseId !== undefined ? (licenseId ? String(licenseId).trim() : null) : existingDoctor.licenseId,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : existingDoctor.phone,
        companyId: companyId !== undefined ? (companyId || null) : existingDoctor.companyId,
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

    res.status(200).json({ message: 'Doctor updated successfully', doctor: updatedDoctor });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ message: 'Error updating doctor' });
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

    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Error deleting doctor' });
  }
};
