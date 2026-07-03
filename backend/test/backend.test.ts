import request from 'supertest';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PrismaClient, UserRole } from '@prisma/client';
import { createMockPrisma } from './mockPrisma';
import { createApp } from '../src/app';
import { sign } from 'jsonwebtoken';

function makeRealtimeMock() {
  const events: Array<{ name: string; payload: unknown }> = [];
  return {
    events,
    emitDriverLocation(payload: unknown) {
      events.push({ name: 'driver:location', payload });
    },
    emitDriverStatus(payload: unknown) {
      events.push({ name: 'driver:status', payload });
    },
    emitSosNew(payload: unknown) {
      events.push({ name: 'sos:new', payload });
    },
    emitSosUpdate(payload: unknown) {
      events.push({ name: 'sos:update', payload });
    },
  };
}

async function createSeededState() {
  const prisma = createMockPrisma();
  const adminHash = await bcrypt.hash('admin123', 10);
  const driverHash = await bcrypt.hash('driver123', 10);

  const admin = await prisma.user.upsert({
    where: { phone: '0500000000' },
    create: {
      name: 'Admin',
      phone: '0500000000',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
    update: {},
  });

  const driver = await prisma.user.upsert({
    where: { phone: '0500000001' },
    create: {
      name: 'Driver',
      phone: '0500000001',
      passwordHash: driverHash,
      role: 'DRIVER',
    },
    update: {},
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { plate: 'ABC-101' },
    create: { plate: 'ABC-101', label: 'Unit 1' },
    update: {},
  });

  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    create: { userId: driver.id, currentVehicleId: vehicle.id, status: 'OFFLINE' },
    update: {},
  });

  return { prisma, admin, driver, vehicle };
}

describe('backend API', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let realtime: ReturnType<typeof makeRealtimeMock>;
  let app: ReturnType<typeof createApp>;
  let adminToken: string;
  let driverToken: string;

  beforeEach(async () => {
    const seeded = await createSeededState();
    prisma = seeded.prisma;
    realtime = makeRealtimeMock();
    app = createApp({
      prisma: prisma as unknown as PrismaClient,
      realtime,
    });
    adminToken = sign({ sub: seeded.admin.id, role: 'ADMIN' as UserRole }, process.env.JWT_SECRET as string);
    driverToken = sign({ sub: seeded.driver.id, role: 'DRIVER' as UserRole }, process.env.JWT_SECRET as string);
  });

  it('logs in with phone and password', async () => {
    const response = await request(app).post('/api/auth/login').send({
      phone: '0500000001',
      password: 'driver123',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTypeOf('string');
    expect(response.body.user.phone).toBe('0500000001');
    expect(response.body.user.role).toBe('DRIVER');
  });

  it('starts and ends duty for a driver', async () => {
    const started = await request(app)
      .post('/api/duty/start')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({});

    expect(started.status).toBe(200);
    expect(started.body.profile.status).toBe('ON_DUTY');

    const ended = await request(app)
      .post('/api/duty/end')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({});

    expect(ended.status).toBe(200);
    expect(ended.body.profile.status).toBe('OFFLINE');
  });

  it('stores location pings and updates the driver profile', async () => {
    await request(app)
      .post('/api/duty/start')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({});

    const response = await request(app)
      .post('/api/location')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        lat: 24.7136,
        lng: 46.6753,
        speed: 55.5,
        heading: 120,
        batteryLevel: 80,
        networkStatus: 'online',
      });

    expect(response.status).toBe(200);
    expect(response.body.profile.lastLat).toBe(24.7136);
    expect(response.body.profile.lastLng).toBe(46.6753);
    expect(response.body.profile.lastSpeed).toBe(55.5);
    expect(response.body.profile.batteryLevel).toBe(80);
    expect(realtime.events.some((event) => event.name === 'driver:location')).toBe(true);
  });

  it('creates and lists SOS alerts', async () => {
    const created = await request(app)
      .post('/api/sos')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ lat: 24.7, lng: 46.6 });

    expect(created.status).toBe(201);
    expect(created.body.status).toBe('OPEN');

    const listed = await request(app)
      .get('/api/sos?status=OPEN')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].driverId).toBeDefined();
    expect(realtime.events.some((event) => event.name === 'sos:new')).toBe(true);
  });
});
