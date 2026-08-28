import { PrismaClient, Role, ContractStatus, TransactionType, TransactionCategory, ConsultationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos iniciales para Staging...');

  // 1. Password hashes
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const doctorPasswordHash = await bcrypt.hash('Doctor123!', 10);

  // 2. Empresas Corporativas B2B
  const mcdonalds = await prisma.company.upsert({
    where: { id: '01e4bb9c-90dc-410f-9980-f3ddd2e14c58' },
    update: {
      name: 'McDonalds',
      taxId: 'MCD900101XYZ',
      address: 'Av. Insurgentes Sur 1234, Ciudad de México',
      phone: '5551234567',
    },
    create: {
      id: '01e4bb9c-90dc-410f-9980-f3ddd2e14c58',
      name: 'McDonalds',
      taxId: 'MCD900101XYZ',
      address: 'Av. Insurgentes Sur 1234, Ciudad de México',
      phone: '5551234567',
    },
  });

  const carlsjr = await prisma.company.upsert({
    where: { id: '5b82e098-8f7f-4efe-a205-13e0f2f99b8a' },
    update: {
      name: 'CarlsJR',
      taxId: 'CJR850505ABC',
      address: 'Av La REFORMA 4532, Chihuahua, Juárez',
      phone: '5559876543',
    },
    create: {
      id: '5b82e098-8f7f-4efe-a205-13e0f2f99b8a',
      name: 'CarlsJR',
      taxId: 'CJR850505ABC',
      address: 'Av La REFORMA 4532, Chihuahua, Juárez',
      phone: '5559876543',
    },
  });
  console.log(`✅ Empresas creadas: ${mcdonalds.name}, ${carlsjr.name}`);

  // 3. Usuarios Base
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@medical.com' },
    update: {
      name: 'Administrador MedSys',
      role: Role.ADMIN,
      password: adminPasswordHash,
    },
    create: {
      email: 'admin@medical.com',
      name: 'Administrador MedSys',
      role: Role.ADMIN,
      password: adminPasswordHash,
    },
  });
  console.log(`✅ Usuario Administrador listo: ${adminUser.email}`);

  const doctorUser = await prisma.user.upsert({
    where: { email: 'yay@medical.com' },
    update: {
      name: 'Dr Yael',
      role: Role.DOCTOR,
      password: doctorPasswordHash,
    },
    create: {
      email: 'yay@medical.com',
      name: 'Dr Yael',
      role: Role.DOCTOR,
      password: doctorPasswordHash,
    },
  });
  console.log(`✅ Usuario Doctor listo: ${doctorUser.email}`);

  // 4. Perfil de Doctor asignado a McDonalds (consultorio in-house)
  let doctorProfile = await prisma.doctor.findUnique({
    where: { userId: doctorUser.id },
  });

  if (!doctorProfile) {
    doctorProfile = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        licenseId: 'MED-987654',
        specialty: 'Medicina del Trabajo y Salud Ocupacional',
        companyId: mcdonalds.id,
      },
    });
  } else {
    doctorProfile = await prisma.doctor.update({
      where: { id: doctorProfile.id },
      data: {
        companyId: mcdonalds.id,
        licenseId: 'MED-987654',
        specialty: 'Medicina del Trabajo y Salud Ocupacional',
      },
    });
  }
  console.log(`✅ Perfil de Doctor listo: Cédula ${doctorProfile.licenseId}`);

  // 5. Contratos Corporativos
  const existingMcDContract = await prisma.contract.findFirst({
    where: { companyId: mcdonalds.id },
  });
  if (!existingMcDContract) {
    await prisma.contract.create({
      data: {
        companyId: mcdonalds.id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        amount: 120000,
        status: ContractStatus.ACTIVE,
      },
    });
  }

  const existingCarlsContract = await prisma.contract.findFirst({
    where: { companyId: carlsjr.id },
  });
  if (!existingCarlsContract) {
    await prisma.contract.create({
      data: {
        companyId: carlsjr.id,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2027-02-28'),
        amount: 95000,
        status: ContractStatus.ACTIVE,
      },
    });
  }
  console.log('✅ Contratos B2B vigentes registrados');

  // 6. Pacientes Trabajadores
  let patient1 = await prisma.patient.findFirst({
    where: { employeeNumber: 'EMP-9932' },
  });
  if (!patient1) {
    patient1 = await prisma.patient.create({
      data: {
        firstName: 'Fernanda',
        lastName: 'Valenzuela Rios',
        employeeNumber: 'EMP-9932',
        dateOfBirth: new Date('1996-05-14'),
        companyId: mcdonalds.id,
      },
    });
  }

  let patient2 = await prisma.patient.findFirst({
    where: { employeeNumber: 'EMP-8821' },
  });
  if (!patient2) {
    patient2 = await prisma.patient.create({
      data: {
        firstName: 'Roberto',
        lastName: 'Gomez Morales',
        employeeNumber: 'EMP-8821',
        dateOfBirth: new Date('1990-11-23'),
        companyId: mcdonalds.id,
      },
    });
  }

  let patient3 = await prisma.patient.findFirst({
    where: { employeeNumber: 'EMP-5635' },
  });
  if (!patient3) {
    patient3 = await prisma.patient.create({
      data: {
        firstName: 'Juan Pablo',
        lastName: 'Reyes',
        employeeNumber: 'EMP-5635',
        dateOfBirth: new Date('1988-02-18'),
        companyId: carlsjr.id,
      },
    });
  }
  console.log('✅ Pacientes trabajadores creados');

  // 7. Consultas Médicas Ocupacionales Iniciales
  const existingConsultations = await prisma.consultation.count();
  if (existingConsultations === 0) {
    await prisma.consultation.createMany({
      data: [
        {
          patientId: patient1.id,
          doctorId: doctorProfile.id,
          companyId: mcdonalds.id,
          consultationDate: new Date(),
          chiefComplaint: 'Molestia en muñeca derecha tras jornadas de teclado',
          symptoms: 'Dolor y parestesias en dedos pulgar e índice',
          bloodPressureSystolic: 115,
          bloodPressureDiastolic: 75,
          heartRate: 72,
          temperature: 36.5,
          weightKg: 58.0,
          heightCm: 160.0,
          bmi: 22.7,
          diagnosisDescription: 'Síndrome del túnel carpía o leve',
          treatmentPlan: 'Férula nocturna, pausas activas cada 2 horas y paracetamol.',
          status: ConsultationStatus.COMPLETED,
        },
        {
          patientId: patient2.id,
          doctorId: doctorProfile.id,
          companyId: mcdonalds.id,
          consultationDate: new Date(),
          chiefComplaint: 'Cefalea tensional recurrente al final del turno',
          symptoms: 'Pesadez retroocular y tensión en nuca',
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          heartRate: 78,
          temperature: 36.6,
          weightKg: 78.0,
          heightCm: 174.0,
          bmi: 25.8,
          diagnosisDescription: 'Cefalea por fatiga visual ocupacional',
          treatmentPlan: 'Regla 20-20-20 para pantalla y descanso visual.',
          status: ConsultationStatus.COMPLETED,
        },
        {
          patientId: patient3.id,
          doctorId: doctorProfile.id,
          companyId: carlsjr.id,
          consultationDate: new Date(),
          chiefComplaint: 'Lumbalgia tras maniobra de carga en almacén',
          symptoms: 'Dolor lumbar bajo al flexionarse',
          bloodPressureSystolic: 118,
          bloodPressureDiastolic: 78,
          heartRate: 70,
          temperature: 36.4,
          weightKg: 68.0,
          heightCm: 174.0,
          bmi: 22.5,
          diagnosisDescription: 'Lumbalgia Mecánica aguda',
          treatmentPlan: 'Reposo relativo 48 horas, higiene postural y analgesia.',
          status: ConsultationStatus.COMPLETED,
        },
      ],
    });
    console.log('✅ Consultas médicas de prueba registradas con métricas de salud');
  }

  // 8. Transacciones de Caja / Finanzas
  const existingTransactions = await prisma.transaction.count();
  if (existingTransactions === 0) {
    await prisma.transaction.createMany({
      data: [
        {
          type: TransactionType.INCOME,
          category: TransactionCategory.B2B_CONTRACT,
          amount: 120000,
          description: 'Cobro mensual de póliza corporativa McDonalds',
          date: new Date(),
        },
        {
          type: TransactionType.INCOME,
          category: TransactionCategory.B2B_CONTRACT,
          amount: 95000,
          description: 'Cobro mensual de convenio in-house CarlsJR',
          date: new Date(),
        },
        {
          type: TransactionType.EXPENSE,
          category: TransactionCategory.EQUIPMENT_MAINTENANCE,
          amount: 14500,
          description: 'Mantenimiento de equipo de somatometría',
          date: new Date(),
        },
      ],
    });
    console.log('✅ Transacciones financieras base registradas');
  }

  console.log('🎉 Seed completado exitosamente para entorno de Staging.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
