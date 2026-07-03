'use client';

import dynamic from 'next/dynamic';
import type { DriverListItem, LocationPing, Trip } from '@/lib/types';

const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

type Props = {
  drivers: DriverListItem[];
  selectedDriverId: string | null;
  selectedTrip: Trip | null;
  route: LocationPing[];
  onSelectDriver: (driverId: string) => void;
};

export function FleetMap(props: Props) {
  return <MapCanvas {...props} />;
}
