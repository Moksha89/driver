export type UserRole = 'ADMIN' | 'DISPATCHER' | 'DRIVER';

export type User = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type DriverStatus = 'OFFLINE' | 'ON_DUTY' | 'ON_TRIP';
export type TripStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SosStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type Vehicle = {
  id: string;
  plate: string;
  label: string;
  createdAt: string;
};

export type DriverProfile = {
  status: DriverStatus;
  batteryLevel: number | null;
  networkStatus: string | null;
  lastLat: number | null;
  lastLng: number | null;
  lastSpeed: number | null;
  lastHeading: number | null;
  lastSeenAt: string | null;
  currentVehicle: Vehicle | null;
};

export type Duty = {
  id: string;
  driverId: string;
  startedAt: string;
  endedAt: string | null;
};

export type Trip = {
  id: string;
  driverId: string;
  dutyId: string | null;
  vehicleId: string | null;
  startedAt: string;
  endedAt: string | null;
  status: TripStatus;
};

export type LocationPing = {
  id: string;
  driverId: string;
  tripId: string | null;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  networkStatus: string | null;
  recordedAt: string;
};

export type DriverListItem = User & {
  profile: DriverProfile;
};

export type DriverDetail = DriverListItem & {
  duties: Duty[];
  activeTrip: Trip | null;
};

export type SosAlert = {
  id: string;
  driverId: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  resolvedAt: string | null;
  status: SosStatus;
};

export type DriverLocationEvent = {
  driverId: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  status: DriverStatus;
  lastSeenAt: string;
};

export type DriverStatusEvent = {
  driverId: string;
  status: DriverStatus;
  lastSeenAt: string;
};
