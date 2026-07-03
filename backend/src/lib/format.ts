import type { UserRole, DriverStatus, TripStatus, SosStatus } from '@prisma/client';

export type UserResponse = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
};

export const pickUser = (user: {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
}): UserResponse => ({
  id: user.id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

export type DriverSummary = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  profile: {
    status: DriverStatus;
    batteryLevel: number | null;
    networkStatus: string | null;
    lastLat: number | null;
    lastLng: number | null;
    lastSpeed: number | null;
    lastHeading: number | null;
    lastSeenAt: Date | null;
    currentVehicle: { id: string; plate: string; label: string } | null;
  };
};

export type DriverDetail = DriverSummary & {
  duties: Array<{
    id: string;
    startedAt: Date;
    endedAt: Date | null;
  }>;
  activeTrip: {
    id: string;
    startedAt: Date;
    status: TripStatus;
    vehicleId: string | null;
    dutyId: string | null;
  } | null;
};

export type SosAlertResponse = {
  id: string;
  driverId: string;
  lat: number | null;
  lng: number | null;
  createdAt: Date;
  resolvedAt: Date | null;
  status: SosStatus;
};
