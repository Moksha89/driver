import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = 'admin123';
  const driverPassword = 'driver123';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const driverHash = await bcrypt.hash(driverPassword, 10);

  const admin = await prisma.user.upsert({
    where: { phone: '0500000000' },
    create: {
      name: 'Admin',
      phone: '0500000000',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
    update: {
      name: 'Admin',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
  });

  const driver1 = await prisma.user.upsert({
    where: { phone: '0500000001' },
    create: {
      name: 'Driver 1',
      phone: '0500000001',
      passwordHash: driverHash,
      role: UserRole.DRIVER,
    },
    update: {
      name: 'Driver 1',
      passwordHash: driverHash,
      role: UserRole.DRIVER,
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { phone: '0500000002' },
    create: {
      name: 'Driver 2',
      phone: '0500000002',
      passwordHash: driverHash,
      role: UserRole.DRIVER,
    },
    update: {
      name: 'Driver 2',
      passwordHash: driverHash,
      role: UserRole.DRIVER,
    },
  });

  const vehicle1 = await prisma.vehicle.upsert({
    where: { plate: 'ABC-101' },
    create: {
      plate: 'ABC-101',
      label: 'Toyota Corolla',
    },
    update: {
      label: 'Toyota Corolla',
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { plate: 'ABC-202' },
    create: {
      plate: 'ABC-202',
      label: 'Hyundai Elantra',
    },
    update: {
      label: 'Hyundai Elantra',
    },
  });

  await prisma.driverProfile.upsert({
    where: { userId: driver1.id },
    create: {
      userId: driver1.id,
      currentVehicleId: vehicle1.id,
      status: 'OFFLINE',
    },
    update: {
      currentVehicleId: vehicle1.id,
    },
  });

  await prisma.driverProfile.upsert({
    where: { userId: driver2.id },
    create: {
      userId: driver2.id,
      currentVehicleId: vehicle2.id,
      status: 'OFFLINE',
    },
    update: {
      currentVehicleId: vehicle2.id,
    },
  });

  console.log('Seeded credentials:');
  console.log(`Admin: phone=0500000000 password=${adminPassword}`);
  console.log(`Driver 1: phone=0500000001 password=${driverPassword}`);
  console.log(`Driver 2: phone=0500000002 password=${driverPassword}`);
  console.log(`Created admin id=${admin.id}, drivers=${driver1.id}, ${driver2.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
