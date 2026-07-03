'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { apiFetch } from '@/lib/api';
import type {
  DriverDetail,
  DriverListItem,
  DriverLocationEvent,
  DriverStatusEvent,
  LocationPing,
  SosAlert,
  SosEvent,
  Trip,
} from '@/lib/types';
import { getSocket } from '@/lib/socket';
import { FleetMap } from '../map/FleetMap';
import styles from './Dashboard.module.css';

type DriversResponse = DriverListItem[];

export function Dashboard() {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedDriverDetail, setSelectedDriverDetail] = useState<DriverDetail | null>(null);
  const [selectedDriverTrips, setSelectedDriverTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [route, setRoute] = useState<LocationPing[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [toast, setToast] = useState<SosAlert | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId],
  );

  const loadDrivers = useCallback(async () => {
    const response = await apiFetch<DriversResponse>('/api/drivers');
    setDrivers(response);
    setSelectedDriverId((current) => current ?? response[0]?.id ?? null);
  }, []);

  const loadSos = useCallback(async () => {
    const response = await apiFetch<SosAlert[]>('/api/sos');
    setSosAlerts(response);
  }, []);

  const loadDriverDetail = useCallback(async (driverId: string) => {
    const [detail, trips] = await Promise.all([
      apiFetch<DriverDetail>(`/api/drivers/${driverId}`),
      apiFetch<Trip[]>(`/api/drivers/${driverId}/trips`),
    ]);
    setSelectedDriverDetail(detail);
    setSelectedDriverTrips(trips);
    setSelectedTrip(null);
    setRoute([]);
  }, []);

  const selectDriver = useCallback(
    (driverId: string) => {
      setSelectedDriverId(driverId);
      void loadDriverDetail(driverId);
    },
    [loadDriverDetail],
  );

  const loadTripRoute = useCallback(async (tripId: string) => {
    const response = await apiFetch<LocationPing[]>(`/api/trips/${tripId}/route`);
    setRoute(response);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadDrivers(), loadSos()]);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, [loadDrivers, loadSos]);

  useEffect(() => {
    if (selectedDriverId) {
      void loadDriverDetail(selectedDriverId);
    }
  }, [loadDriverDetail, selectedDriverId]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    const onLocation = (event: DriverLocationEvent) => {
      setDrivers((current) =>
        current.map((driver) =>
          driver.id === event.driverId
            ? {
                ...driver,
                profile: {
                  ...driver.profile,
                  status: event.status,
                  lastLat: event.lat,
                  lastLng: event.lng,
                  lastSpeed: event.speed,
                  lastHeading: event.heading,
                  batteryLevel: event.batteryLevel,
                  lastSeenAt: event.lastSeenAt,
                },
              }
            : driver,
        ),
      );
      if (selectedDriverId === event.driverId) {
        setSelectedDriverDetail((current) =>
          current
            ? {
                ...current,
                profile: {
                  ...current.profile,
                  status: event.status,
                  lastLat: event.lat,
                  lastLng: event.lng,
                  lastSpeed: event.speed,
                  lastHeading: event.heading,
                  batteryLevel: event.batteryLevel,
                  lastSeenAt: event.lastSeenAt,
                },
              }
            : current,
        );
      }
    };

    const onStatus = (event: DriverStatusEvent) => {
      setDrivers((current) =>
        current.map((driver) =>
          driver.id === event.driverId
            ? {
                ...driver,
                profile: {
                  ...driver.profile,
                  status: event.status,
                  lastSeenAt: event.lastSeenAt,
                },
              }
            : driver,
        ),
      );
    };

    const onSosNew = (event: SosEvent) => {
      setSosAlerts((current) => [event, ...current.filter((item) => item.id !== event.id)]);
      setToast(event);
    };

    const onSosUpdate = (event: SosEvent) => {
      setSosAlerts((current) =>
        current
          .map((item) => (item.id === event.id ? event : item))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    };

    socket.auth = { token };
    socket.connect();
    socket.on('driver:location', onLocation);
    socket.on('driver:status', onStatus);
    socket.on('sos:new', onSosNew);
    socket.on('sos:update', onSosUpdate);

    return () => {
      socket.off('driver:location', onLocation);
      socket.off('driver:status', onStatus);
      socket.off('sos:new', onSosNew);
      socket.off('sos:update', onSosUpdate);
    };
  }, [selectedDriverId, token]);

  const ackSos = useCallback(async (alertId: string) => {
    const updated = await apiFetch<SosAlert>(`/api/sos/${alertId}/ack`, { method: 'POST' });
    setSosAlerts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  const resolveSos = useCallback(async (alertId: string) => {
    const updated = await apiFetch<SosAlert>(`/api/sos/${alertId}/resolve`, { method: 'POST' });
    setSosAlerts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading dashboard…</div>;
  }

  const openAlerts = sosAlerts.filter((alert) => alert.status === 'OPEN');

  return (
    <div className={styles.page}>
      {toast ? (
        <div className={styles.toast} onClick={() => setToast(null)} role="button" tabIndex={0}>
          New SOS from {toast.driverId}
        </div>
      ) : null}

      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Operations Dashboard</h1>
          <p className={styles.subtitle}>
            Live fleet positions, driver details, and SOS alerts in one place.
          </p>
        </div>

        <div className={styles.metrics}>
          <div className={styles.metricCard}>
            <span>Drivers</span>
            <strong>{drivers.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span>Open SOS</span>
            <strong>{openAlerts.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span>Selected</span>
            <strong>{selectedDriver?.name ?? '—'}</strong>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <div className={styles.mapColumn}>
          <FleetMap
            drivers={drivers}
            selectedDriverId={selectedDriverId}
            selectedTrip={selectedTrip}
            route={route}
            onSelectDriver={selectDriver}
          />
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Drivers</h2>
              <span>{drivers.length}</span>
            </div>

            <div className={styles.driverList}>
              {drivers.map((driver) => (
                <button
                  key={driver.id}
                  className={`${styles.driverRow} ${selectedDriverId === driver.id ? styles.driverRowActive : ''}`}
                  onClick={() => selectDriver(driver.id)}
                  type="button"
                >
                  <div>
                    <div className={styles.driverName}>{driver.name}</div>
                    <div className={styles.driverMeta}>{driver.phone}</div>
                  </div>
                  <div className={styles.driverStatus}>
                    <span className={`${styles.dot} ${styles[driver.profile.status.toLowerCase()]}`} />
                    {driver.profile.status}
                  </div>
                  <div className={styles.driverMeta}>
                    {driver.profile.batteryLevel ?? '—'}% · {driver.profile.networkStatus ?? '—'}
                  </div>
                  <div className={styles.driverMeta}>Last seen: {driver.profile.lastSeenAt ?? '—'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Driver Detail</h2>
            </div>

            {selectedDriverDetail ? (
              <div className={styles.detail}>
                <div className={styles.detailLine}>
                  <strong>{selectedDriverDetail.name}</strong>
                  <span>{selectedDriverDetail.profile.status}</span>
                </div>
                <div className={styles.detailMeta}>Vehicle: {selectedDriverDetail.profile.currentVehicle?.plate ?? '—'}</div>
                <div className={styles.detailMeta}>Battery: {selectedDriverDetail.profile.batteryLevel ?? '—'}%</div>
                <div className={styles.detailMeta}>Network: {selectedDriverDetail.profile.networkStatus ?? '—'}</div>
                <div className={styles.detailMeta}>Last seen: {selectedDriverDetail.profile.lastSeenAt ?? '—'}</div>

                <h3>Trips</h3>
                <div className={styles.tripList}>
                  {selectedDriverTrips.map((trip) => (
                    <button
                      key={trip.id}
                      className={`${styles.tripRow} ${selectedTrip?.id === trip.id ? styles.tripRowActive : ''}`}
                      onClick={() => {
                        setSelectedTrip(trip);
                        void loadTripRoute(trip.id);
                      }}
                      type="button"
                    >
                      <div>{trip.startedAt}</div>
                      <div>{trip.status}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>Select a driver to inspect details.</div>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>SOS Alerts</h2>
              <span>{openAlerts.length} open</span>
            </div>

            <div className={styles.sosList}>
              {sosAlerts.map((alert) => (
                <div key={alert.id} className={`${styles.sosCard} ${alert.status === 'OPEN' ? styles.sosOpen : ''}`}>
                  <div className={styles.detailLine}>
                    <strong>{alert.driverId}</strong>
                    <span>{alert.status}</span>
                  </div>
                  <div className={styles.detailMeta}>
                    {alert.lat ?? '—'}, {alert.lng ?? '—'}
                  </div>
                  <div className={styles.detailMeta}>{alert.createdAt}</div>
                  {alert.status === 'OPEN' ? (
                    <div className={styles.actions}>
                      <button type="button" onClick={() => void ackSos(alert.id)}>
                        Acknowledge
                      </button>
                      <button type="button" onClick={() => void resolveSos(alert.id)}>
                        Resolve
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
