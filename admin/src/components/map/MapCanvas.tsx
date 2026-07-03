'use client';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { DriverListItem, LocationPing, Trip } from '@/lib/types';

import styles from './MapCanvas.module.css';

type Props = {
  drivers: DriverListItem[];
  selectedDriverId: string | null;
  selectedTrip: Trip | null;
  route: LocationPing[];
  onSelectDriver: (driverId: string) => void;
};

const defaultCenter: [number, number] = [24.7136, 46.6753];

function statusColor(status: DriverListItem['profile']['status']) {
  if (status === 'ON_TRIP') {
    return '#16a34a';
  }
  if (status === 'ON_DUTY') {
    return '#f59e0b';
  }
  return '#64748b';
}

function createIcon(status: DriverListItem['profile']['status']) {
  return L.divIcon({
    className: styles.markerWrapper,
    html: `<div class="${styles.marker}" style="background:${statusColor(status)}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function MapFocus({
  selectedDriver,
  route,
}: {
  selectedDriver: DriverListItem | null;
  route: LocationPing[];
}) {
  const map = useMap();
  const firstRender = useRef(true);

  useEffect(() => {
    if (route.length > 0) {
      const latLngs = route.map((point) => [point.lat, point.lng] as [number, number]);
      map.fitBounds(latLngs, { padding: [40, 40] });
      return;
    }

    if (
      selectedDriver !== null &&
      selectedDriver.profile.lastLat !== null &&
      selectedDriver.profile.lastLng !== null
    ) {
      map.setView([selectedDriver.profile.lastLat, selectedDriver.profile.lastLng], 15);
      return;
    }

    if (firstRender.current) {
      firstRender.current = false;
      map.setView(defaultCenter, 11);
    }
  }, [map, route, selectedDriver]);

  return null;
}

export default function MapCanvas({
  drivers,
  selectedDriverId,
  selectedTrip,
  route,
  onSelectDriver,
}: Props) {
  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId],
  );

  const polyline = route.map((point) => [point.lat, point.lng] as [number, number]);

  return (
    <div className={styles.mapFrame}>
      <MapContainer center={defaultCenter} zoom={11} className={styles.map}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus selectedDriver={selectedDriver} route={route} />

        {drivers.map((driver) => {
          if (driver.profile.lastLat === null || driver.profile.lastLng === null) {
            return null;
          }

          return (
            <Marker
              key={driver.id}
              position={[driver.profile.lastLat, driver.profile.lastLng]}
              icon={createIcon(driver.profile.status)}
              eventHandlers={{
                click: () => onSelectDriver(driver.id),
              }}
            >
              <Popup>
                <div className={styles.popup}>
                  <strong>{driver.name}</strong>
                  <div>Status: {driver.profile.status}</div>
                  <div>Speed: {driver.profile.lastSpeed ?? '—'}</div>
                  <div>Battery: {driver.profile.batteryLevel ?? '—'}%</div>
                  <div>Last seen: {driver.profile.lastSeenAt ?? '—'}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {polyline.length > 0 ? <Polyline positions={polyline} pathOptions={{ color: '#2563eb' }} /> : null}
      </MapContainer>
      {selectedDriver ? (
        <div className={styles.selectionBadge}>
          Focused: {selectedDriver.name} {route.length > 0 && selectedTrip ? `· Trip ${selectedTrip.id}` : ''}
        </div>
      ) : null}
    </div>
  );
}
