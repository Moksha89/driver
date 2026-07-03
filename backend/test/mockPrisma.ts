import bcrypt from 'bcrypt';
import type { PrismaClient, UserRole, DriverStatus, TripStatus, SosStatus } from '@prisma/client';

type UserRecord = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
};

type VehicleRecord = {
  id: string;
  plate: string;
  label: string;
  createdAt: Date;
};

type DriverProfileRecord = {
  userId: string;
  currentVehicleId: string | null;
  status: DriverStatus;
  batteryLevel: number | null;
  networkStatus: string | null;
  lastLat: number | null;
  lastLng: number | null;
  lastSpeed: number | null;
  lastHeading: number | null;
  lastSeenAt: Date | null;
};

type DutyRecord = {
  id: string;
  driverId: string;
  startedAt: Date;
  endedAt: Date | null;
};

type TripRecord = {
  id: string;
  driverId: string;
  dutyId: string | null;
  vehicleId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  status: TripStatus;
};

type LocationPingRecord = {
  id: string;
  driverId: string;
  tripId: string | null;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  networkStatus: string | null;
  recordedAt: Date;
};

type SosAlertRecord = {
  id: string;
  driverId: string;
  lat: number | null;
  lng: number | null;
  createdAt: Date;
  resolvedAt: Date | null;
  status: SosStatus;
};

type AccessLogRecord = {
  id: string;
  actorId: string;
  action: string;
  targetDriverId: string | null;
  createdAt: Date;
};

type MockState = {
  users: UserRecord[];
  vehicles: VehicleRecord[];
  driverProfiles: DriverProfileRecord[];
  duties: DutyRecord[];
  trips: TripRecord[];
  locationPings: LocationPingRecord[];
  sosAlerts: SosAlertRecord[];
  accessLogs: AccessLogRecord[];
};

type ProfileView = DriverProfileRecord & { currentVehicle: VehicleRecord | null };
type UserView = UserRecord & {
  driverProfile: ProfileView | null;
  duties: DutyRecord[];
  trips: TripRecord[];
};

type MockPrisma = PrismaClient & { __state: MockState };
type MockPrismaCore = {
  user: {
    findUnique(args: { where: { id?: string; phone?: string }; include?: unknown }): Promise<UserView | null>;
    findMany(args: { where?: { role?: UserRole }; orderBy?: unknown; include?: unknown }): Promise<UserView[]>;
    upsert(args: {
      where: { phone: string };
      create: Omit<UserRecord, 'id' | 'createdAt'>;
      update: Partial<Omit<UserRecord, 'id' | 'createdAt' | 'phone'>>;
    }): Promise<UserView>;
  };
  vehicle: {
    upsert(args: {
      where: { plate: string };
      create: Omit<VehicleRecord, 'id' | 'createdAt'>;
      update: Partial<Omit<VehicleRecord, 'id' | 'createdAt' | 'plate'>>;
    }): Promise<VehicleRecord>;
  };
  driverProfile: {
    findUnique(args: { where: { userId: string } }): Promise<ProfileView | null>;
    upsert(args: {
      where: { userId: string };
      create: Partial<DriverProfileRecord> & { userId: string };
      update: Partial<DriverProfileRecord>;
    }): Promise<ProfileView | null>;
  };
  duty: {
    create(args: { data: { driverId: string } }): Promise<DutyRecord>;
    findFirst(args: { where: { driverId: string; endedAt?: Date | null }; orderBy?: unknown }): Promise<DutyRecord | null>;
    update(args: { where: { id: string }; data: { endedAt: Date } }): Promise<DutyRecord>;
  };
  trip: {
    create(args: {
      data: { driverId: string; dutyId: string | null; vehicleId: string | null; status: TripStatus };
    }): Promise<TripRecord>;
    findFirst(args: {
      where: { driverId: string; endedAt?: Date | null; status?: TripStatus };
      orderBy?: unknown;
    }): Promise<TripRecord | null>;
    update(args: { where: { id: string }; data: Partial<TripRecord> & { endedAt?: Date } }): Promise<TripRecord>;
    findMany(args: { where: { driverId: string } }): Promise<TripRecord[]>;
  };
  locationPing: {
    create(args: {
      data: {
        driverId: string;
        tripId: string | null;
        lat: number;
        lng: number;
        speed?: number;
        heading?: number;
        batteryLevel?: number;
        networkStatus?: string;
      };
    }): Promise<LocationPingRecord>;
    findMany(args: { where: { tripId?: string | null; driverId?: string }; orderBy?: unknown }): Promise<LocationPingRecord[]>;
  };
  sosAlert: {
    create(args: { data: { driverId: string; lat?: number | null; lng?: number | null; status: SosStatus } }): Promise<SosAlertRecord>;
    findMany(args: { where?: { status?: SosStatus }; orderBy?: unknown }): Promise<SosAlertRecord[]>;
    update(args: { where: { id: string }; data: { status: SosStatus; resolvedAt?: Date } }): Promise<SosAlertRecord>;
  };
  accessLog: {
    create(args: { data: { actorId: string; action: string; targetDriverId?: string | null } }): Promise<AccessLogRecord>;
  };
  $transaction<T>(fn: (tx: MockPrismaCore) => Promise<T>): Promise<T>;
  __state: MockState;
};

const makeId = (prefix: string, count: number) => `${prefix}_${count}`;

export function createMockPrisma() {
  const users: UserRecord[] = [];
  const vehicles: VehicleRecord[] = [];
  const driverProfiles: DriverProfileRecord[] = [];
  const duties: DutyRecord[] = [];
  const trips: TripRecord[] = [];
  const locationPings: LocationPingRecord[] = [];
  const sosAlerts: SosAlertRecord[] = [];
  const accessLogs: AccessLogRecord[] = [];

  let userCounter = 0;
  let vehicleCounter = 0;
  let dutyCounter = 0;
  let tripCounter = 0;
  let pingCounter = 0;
  let sosCounter = 0;
  let accessCounter = 0;

  const findUser = (where: { id?: string; phone?: string }) =>
    users.find((user) => (where.id ? user.id === where.id : user.phone === where.phone)) ?? null;

  const profileForUser = (userId: string): ProfileView | null => {
    const profile = driverProfiles.find((item) => item.userId === userId) ?? null;
    if (!profile) {
      return null;
    }
    const currentVehicle =
      profile.currentVehicleId ? vehicles.find((vehicle) => vehicle.id === profile.currentVehicleId) ?? null : null;
    return {
      ...profile,
      currentVehicle,
    };
  };

  const userView = (user: UserRecord): UserView => ({
    ...user,
    driverProfile: profileForUser(user.id),
    duties: duties
      .filter((duty) => duty.driverId === user.id)
      .slice()
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()),
    trips: trips
      .filter((trip) => trip.driverId === user.id)
      .slice()
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()),
  });

  let prisma!: MockPrismaCore;
  prisma = {
    user: {
      async findUnique(args: { where: { id?: string; phone?: string }; include?: unknown }) {
        const user = findUser(args.where);
        return user ? userView(user) : null;
      },
      async findMany(args: { where?: { role?: UserRole }; orderBy?: unknown; include?: unknown }) {
        const filtered = args.where?.role
          ? users.filter((user) => user.role === args.where?.role)
          : users.slice();
        return filtered.map((user) => userView(user));
      },
      async upsert(args: {
        where: { phone: string };
        create: Omit<UserRecord, 'id' | 'createdAt'>;
        update: Partial<Omit<UserRecord, 'id' | 'createdAt' | 'phone'>>;
      }) {
        const existing = findUser({ phone: args.where.phone });
        if (existing) {
          Object.assign(existing, args.update);
          return userView(existing);
        }
        const user = {
          id: makeId('user', ++userCounter),
          createdAt: new Date(),
          ...args.create,
        };
        users.push(user);
        return userView(user);
      },
    },
    vehicle: {
      async upsert(args: {
        where: { plate: string };
        create: Omit<VehicleRecord, 'id' | 'createdAt'>;
        update: Partial<Omit<VehicleRecord, 'id' | 'createdAt' | 'plate'>>;
      }) {
        const existing = vehicles.find((vehicle) => vehicle.plate === args.where.plate);
        if (existing) {
          Object.assign(existing, args.update);
          return existing;
        }
        const vehicle = {
          id: makeId('vehicle', ++vehicleCounter),
          createdAt: new Date(),
          ...args.create,
        };
        vehicles.push(vehicle);
        return vehicle;
      },
    },
    driverProfile: {
      async findUnique(args: { where: { userId: string } }) {
        return profileForUser(args.where.userId);
      },
      async upsert(args: {
        where: { userId: string };
        create: Partial<DriverProfileRecord> & { userId: string };
        update: Partial<DriverProfileRecord>;
      }) {
        const existing = driverProfiles.find((profile) => profile.userId === args.where.userId);
        if (existing) {
          Object.assign(existing, args.update);
          return profileForUser(existing.userId);
        }
        const profile: DriverProfileRecord = {
          userId: args.create.userId,
          currentVehicleId: args.create.currentVehicleId ?? null,
          status: args.create.status ?? 'OFFLINE',
          batteryLevel: args.create.batteryLevel ?? null,
          networkStatus: args.create.networkStatus ?? null,
          lastLat: args.create.lastLat ?? null,
          lastLng: args.create.lastLng ?? null,
          lastSpeed: args.create.lastSpeed ?? null,
          lastHeading: args.create.lastHeading ?? null,
          lastSeenAt: args.create.lastSeenAt ?? null,
        };
        driverProfiles.push(profile);
        return profileForUser(profile.userId);
      },
    },
    duty: {
      async create(args: { data: { driverId: string } }) {
        const duty = {
          id: makeId('duty', ++dutyCounter),
          driverId: args.data.driverId,
          startedAt: new Date(),
          endedAt: null,
        };
        duties.push(duty);
        return duty;
      },
      async findFirst(args: { where: { driverId: string; endedAt?: Date | null }; orderBy?: unknown }) {
        const filtered = duties
          .filter((duty) => duty.driverId === args.where.driverId)
          .filter((duty) => ('endedAt' in args.where ? duty.endedAt === args.where.endedAt : true));
        return filtered.at(-1) ?? null;
      },
      async update(args: { where: { id: string }; data: { endedAt: Date } }) {
        const duty = duties.find((item) => item.id === args.where.id);
        if (!duty) {
          throw new Error('Duty not found');
        }
        duty.endedAt = args.data.endedAt;
        return duty;
      },
    },
    trip: {
      async create(args: {
        data: { driverId: string; dutyId: string | null; vehicleId: string | null; status: TripStatus };
      }) {
        const trip = {
          id: makeId('trip', ++tripCounter),
          driverId: args.data.driverId,
          dutyId: args.data.dutyId,
          vehicleId: args.data.vehicleId,
          startedAt: new Date(),
          endedAt: null,
          status: args.data.status,
        };
        trips.push(trip);
        return trip;
      },
      async findFirst(args: {
        where: { driverId: string; endedAt?: Date | null; status?: TripStatus };
        orderBy?: unknown;
      }) {
        const filtered = trips
          .filter((trip) => trip.driverId === args.where.driverId)
          .filter((trip) => ('endedAt' in args.where ? trip.endedAt === args.where.endedAt : true))
          .filter((trip) => ('status' in args.where ? trip.status === args.where.status : true));
        return filtered.at(-1) ?? null;
      },
      async update(args: { where: { id: string }; data: Partial<TripRecord> & { endedAt?: Date } }) {
        const trip = trips.find((item) => item.id === args.where.id);
        if (!trip) {
          throw new Error('Trip not found');
        }
        Object.assign(trip, args.data);
        return trip;
      },
      async findMany(args: { where: { driverId: string } }) {
        return trips.filter((trip) => trip.driverId === args.where.driverId);
      },
    },
    locationPing: {
      async create(args: {
        data: {
          driverId: string;
          tripId: string | null | undefined;
          lat: number;
          lng: number;
          speed?: number;
          heading?: number;
          batteryLevel?: number;
          networkStatus?: string;
        };
      }) {
        const ping = {
          id: makeId('ping', ++pingCounter),
          driverId: args.data.driverId,
          tripId: args.data.tripId ?? null,
          lat: args.data.lat,
          lng: args.data.lng,
          speed: args.data.speed ?? null,
          heading: args.data.heading ?? null,
          batteryLevel: args.data.batteryLevel ?? null,
          networkStatus: args.data.networkStatus ?? null,
          recordedAt: new Date(),
        };
        locationPings.push(ping);
        return ping;
      },
      async findMany(args: { where: { tripId?: string | null; driverId?: string }; orderBy?: unknown }) {
        let items = locationPings.slice();
        if (args.where.driverId) {
          items = items.filter((item) => item.driverId === args.where.driverId);
        }
        if (args.where.tripId !== undefined) {
          items = items.filter((item) => item.tripId === args.where.tripId);
        }
        items.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
        return items;
      },
    },
    sosAlert: {
      async create(args: {
        data: { driverId: string; lat?: number; lng?: number; status: SosStatus };
      }) {
        const alert = {
          id: makeId('sos', ++sosCounter),
          driverId: args.data.driverId,
          lat: args.data.lat ?? null,
          lng: args.data.lng ?? null,
          createdAt: new Date(),
          resolvedAt: null,
          status: args.data.status,
        };
        sosAlerts.push(alert);
        return alert;
      },
      async findMany(args: { where?: { status?: SosStatus }; orderBy?: unknown }) {
        return args.where?.status ? sosAlerts.filter((alert) => alert.status === args.where?.status) : sosAlerts.slice();
      },
      async update(args: {
        where: { id: string };
        data: { status: SosStatus; resolvedAt?: Date };
      }) {
        const alert = sosAlerts.find((item) => item.id === args.where.id);
        if (!alert) {
          throw new Error('SOS not found');
        }
        alert.status = args.data.status;
        if (args.data.resolvedAt) {
          alert.resolvedAt = args.data.resolvedAt;
        }
        return alert;
      },
    },
    accessLog: {
      async create(args: { data: { actorId: string; action: string; targetDriverId?: string | null } }) {
        const log = {
          id: makeId('access', ++accessCounter),
          actorId: args.data.actorId,
          action: args.data.action,
          targetDriverId: args.data.targetDriverId ?? null,
          createdAt: new Date(),
        };
        accessLogs.push(log);
        return log;
      },
    },
    $transaction: async <T>(fn: (tx: MockPrismaCore) => Promise<T>) => fn(prisma),
    __state: {
      users,
      vehicles,
      driverProfiles,
      duties,
      trips,
      locationPings,
      sosAlerts,
      accessLogs,
    },
  };

  return prisma as unknown as MockPrisma;
}

export async function seedMockCredentials(prisma: ReturnType<typeof createMockPrisma>) {
  const passwordHash = await bcrypt.hash('password', 10);
  return prisma.user.upsert({
    where: { phone: '0500000000' },
    create: {
      name: 'Admin',
      phone: '0500000000',
      passwordHash,
      role: 'ADMIN',
    },
    update: {},
  });
}
