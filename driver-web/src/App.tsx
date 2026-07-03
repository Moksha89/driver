import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/storage';
import type { AuthResponse, Trip, User, SosAlert } from '@/lib/types';
import { useTracking } from '@/hooks/useTracking';

type Session = {
  token: string;
  user: User;
};

type MeResponse = User;

function isDriver(user: User) {
  return user.role === 'DRIVER';
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dutyActive, setDutyActive] = useState(false);
  const [tripActive, setTripActive] = useState<Trip | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [coordsInput, setCoordsInput] = useState({ lat: '24.7136', lng: '46.6753' });
  const [sosLoading, setSosLoading] = useState(false);
  const [trackingMode, setTrackingMode] = useState<'idle' | 'gps' | 'simulator'>('idle');
  const [simulateHint, setSimulateHint] = useState<string | null>(null);
  const tracking = useTracking(Boolean(session?.token), dutyActive);

  useEffect(() => {
    const stored = getToken();
    if (!stored) {
      setBooting(false);
      return;
    }

    void (async () => {
      try {
        const me = await apiFetch<MeResponse>('/api/auth/me');
        if (!isDriver(me)) {
          clearToken();
          setSession(null);
          setApiError('This client is only for drivers. Please log in with a driver account.');
          setBooting(false);
          return;
        }

        setSession({ token: stored, user: me });
        setBooting(false);
      } catch {
        clearToken();
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    setTrackingMode(tracking.state.mode);
  }, [tracking.state.mode]);

  const currentLabel = useMemo(() => {
    if (!tracking.state.lastSample) {
      return '—';
    }
    const { lat, lng, speed, heading } = tracking.state.lastSample;
    return `lat ${lat.toFixed(5)}, lng ${lng.toFixed(5)}, speed ${speed?.toFixed(1) ?? '—'}, heading ${heading?.toFixed(0) ?? '—'}`;
  }, [tracking.state.lastSample]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    setApiError(null);
    setSuccess(null);

    try {
      const response = await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { phone, password },
        redirectOn401: false,
      });

      if (!isDriver(response.user)) {
        setLoginError('Driver-web is only for DRIVER accounts.');
        return;
      }

      setToken(response.token);
      setSession({ token: response.token, user: response.user });
      setBooting(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setLoginError(error.message);
        return;
      }
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    }
  }

  function handleLogout() {
    clearToken();
    setSession(null);
    setDutyActive(false);
    setTripActive(null);
    tracking.stop();
    setSuccess(null);
    setApiError(null);
    setTrackingMode('idle');
  }

  async function startDuty() {
    try {
      await apiFetch('/api/duty/start', { method: 'POST' });
      setDutyActive(true);
      setApiError(null);
      setSuccess('Duty started.');
      setTrackingMode('gps');
      const started = tracking.startGps();
      if (!started) {
        setSimulateHint('Geolocation unavailable. Use simulation to send locations.');
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to start duty');
    }
  }

  async function endDuty() {
    try {
      await apiFetch('/api/duty/end', { method: 'POST' });
      setDutyActive(false);
      setTripActive(null);
      tracking.stop();
      setTrackingMode('idle');
      setSuccess('Duty ended.');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to end duty');
    }
  }

  async function startTrip() {
    try {
      const response = await apiFetch<Trip>('/api/trip/start', {
        method: 'POST',
        body: vehicleId ? { vehicleId } : {},
      });
      setTripActive(response);
      setSuccess('Trip started.');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to start trip');
    }
  }

  async function endTrip() {
    try {
      await apiFetch('/api/trip/end', { method: 'POST' });
      setTripActive(null);
      setSuccess('Trip ended.');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to end trip');
    }
  }

  async function sendSOS() {
    setSosLoading(true);
    try {
      const sample = tracking.state.lastSample ?? {
        lat: Number(coordsInput.lat),
        lng: Number(coordsInput.lng),
      };
      await apiFetch<SosAlert>('/api/sos', {
        method: 'POST',
        body: sample,
      });
      setSuccess('SOS sent.');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to send SOS');
    } finally {
      setSosLoading(false);
    }
  }

  function startSimulation() {
    const lat = Number(coordsInput.lat);
    const lng = Number(coordsInput.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setApiError('Please enter valid coordinates.');
      return;
    }

    setApiError(null);
    setTrackingMode('simulator');
    tracking.startSimulator({ lat, lng, speed: 15, heading: 90 });
    setSimulateHint('Simulation active. This drives live location updates without GPS.');
  }

  function stopTracking() {
    tracking.stop();
    setTrackingMode('idle');
  }

  if (booting) {
    return <div className="page-shell">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="auth-shell">
        <form className="card" onSubmit={handleLogin}>
          <h1>Driver Portal</h1>
          <p>Log in to start duty and stream location to dispatch.</p>
          <label>
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          {loginError ? <div className="error-box">{loginError}</div> : null}
          {apiError ? <div className="error-box">{apiError}</div> : null}
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="driver-shell">
      <header className="topbar">
        <div>
          <h1>{session.user.name}</h1>
          <p>{session.user.phone}</p>
        </div>
        <div className={`tracking-pill ${tracking.state.visibleTracking ? 'tracking-on' : ''}`}>
          {tracking.state.visibleTracking ? 'Visible tracking ON' : 'Tracking OFF'}
        </div>
        <button onClick={handleLogout} type="button">
          Logout
        </button>
      </header>

      <section className="status-grid">
        <div className="panel">
          <h2>Duty & Trip</h2>
          <div className="button-row">
            <button onClick={() => void startDuty()} type="button" disabled={dutyActive}>
              Start Duty
            </button>
            <button onClick={() => void endDuty()} type="button" disabled={!dutyActive}>
              End Duty
            </button>
          </div>
          <div className="button-row">
            <button onClick={() => void startTrip()} type="button" disabled={!dutyActive || Boolean(tripActive)}>
              Start Trip
            </button>
            <button onClick={() => void endTrip()} type="button" disabled={!tripActive}>
              End Trip
            </button>
          </div>
          <label>
            Optional vehicleId
            <input value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} />
          </label>
          <div className="small-muted">Current trip: {tripActive?.id ?? 'none'}</div>
          <div className="small-muted">Selected vehicle id: {vehicleId || 'none'}</div>
        </div>

        <div className="panel">
          <h2>Live Tracking</h2>
          <div className="coord-display">{currentLabel}</div>
          <div className="small-muted">Mode: {trackingMode}</div>
          <div className="small-muted">Backend updates every 5 seconds.</div>
          <div className="button-row">
            <button onClick={() => void tracking.sendCurrent()} type="button">
              Send Now
            </button>
            <button onClick={stopTracking} type="button">
              Stop Tracking
            </button>
          </div>
          {tracking.state.error ? <div className="error-box">{tracking.state.error}</div> : null}
          {simulateHint ? <div className="success-box">{simulateHint}</div> : null}
        </div>

        <div className="panel">
          <h2>Simulate Location</h2>
          <label>
            Start lat
            <input value={coordsInput.lat} onChange={(event) => setCoordsInput((current) => ({ ...current, lat: event.target.value }))} />
          </label>
          <label>
            Start lng
            <input value={coordsInput.lng} onChange={(event) => setCoordsInput((current) => ({ ...current, lng: event.target.value }))} />
          </label>
          <div className="button-row">
            <button onClick={startSimulation} type="button">
              Start Simulation
            </button>
            <button onClick={stopTracking} type="button">
              Stop
            </button>
          </div>
        </div>

        <div className="panel sos-panel">
          <h2>SOS</h2>
          <p>Visible to dispatch immediately.</p>
          <button className={`sos-button ${sosLoading ? 'active' : ''}`} onClick={() => void sendSOS()} type="button" disabled={sosLoading}>
            {sosLoading ? 'Sending…' : 'Send SOS'}
          </button>
        </div>
      </section>

      {success ? <div className="success-box floating">{success}</div> : null}
      {apiError ? <div className="error-box floating">{apiError}</div> : null}
    </div>
  );
}
