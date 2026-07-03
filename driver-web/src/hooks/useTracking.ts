import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getBatteryLevel, getNetworkStatus, normalizePosition, type TrackingSample } from '@/lib/geo';

type TrackingState = {
  active: boolean;
  mode: 'idle' | 'gps' | 'simulator';
  lastSample: TrackingSample | null;
  error: string | null;
  visibleTracking: boolean;
};

const SIMULATION_STEP = 0.0002;

export function useTracking(tokenPresent: boolean, enabled: boolean) {
  const [state, setState] = useState<TrackingState>({
    active: false,
    mode: 'idle',
    lastSample: null,
    error: null,
    visibleTracking: false,
  });
  const watchId = useRef<number | null>(null);
  const latest = useRef<TrackingSample | null>(null);
  const simTimer = useRef<number | null>(null);
  const postTimer = useRef<number | null>(null);
  const simStep = useRef(0);

  const postSample = useCallback(
    async (sample: TrackingSample) => {
      if (!tokenPresent) {
        setState((current) => ({
          ...current,
          error: 'Please log in again.',
        }));
        return;
      }

      const batteryLevel = await getBatteryLevel();
      const payload = {
        ...sample,
        batteryLevel,
        networkStatus: getNetworkStatus(),
      };

      latest.current = payload;
      setState((current) => ({
        ...current,
        lastSample: payload,
        active: true,
        error: null,
        visibleTracking: true,
      }));

      await apiFetch('/api/location', {
        method: 'POST',
        body: payload,
      });
    },
    [tokenPresent],
  );

  const clearTimers = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    if (simTimer.current !== null) {
      window.clearInterval(simTimer.current);
      simTimer.current = null;
    }

    if (postTimer.current !== null) {
      window.clearInterval(postTimer.current);
      postTimer.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    setState((current) => ({
      ...current,
      active: false,
      mode: 'idle',
      visibleTracking: false,
    }));
  }, [clearTimers]);

  const startSimulator = useCallback(
    (seed?: TrackingSample) => {
      clearTimers();
      const start = seed ?? latest.current ?? {
        lat: 24.7136,
        lng: 46.6753,
        speed: 0,
        heading: 90,
      };
      latest.current = start;
      simStep.current = 0;
      setState((current) => ({
        ...current,
        active: true,
        mode: 'simulator',
        error: null,
        lastSample: start,
        visibleTracking: true,
      }));

      void postSample(start).catch((error: unknown) => {
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : 'Location update failed',
        }));
      });

      simTimer.current = window.setInterval(() => {
        simStep.current += 1;
        const current = latest.current ?? start;
        const next: TrackingSample = {
          lat: current.lat + SIMULATION_STEP,
          lng: current.lng + SIMULATION_STEP * (simStep.current % 2 === 0 ? 1 : -1),
          speed: 25 + (simStep.current % 8),
          heading: (current.heading ?? 90) + 15,
        };
        latest.current = next;
        setState((stateValue) => ({
          ...stateValue,
          lastSample: next,
          active: true,
          mode: 'simulator',
          visibleTracking: true,
        }));
      }, 2500);

      postTimer.current = window.setInterval(() => {
        const sample = latest.current;
        if (sample) {
          void postSample(sample).catch((error: unknown) => {
            setState((current) => ({
              ...current,
              error: error instanceof Error ? error.message : 'Location update failed',
            }));
          });
        }
      }, 5000);
    },
    [clearTimers, postSample],
  );

  const startGps = useCallback(() => {
    clearTimers();
    if (!navigator.geolocation) {
      setState((current) => ({
        ...current,
        error: 'Geolocation is unavailable. Use simulation.',
      }));
      return false;
    }

    setState((current) => ({
      ...current,
      active: true,
      mode: 'gps',
      error: null,
      visibleTracking: true,
    }));

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const sample = normalizePosition(position);
        latest.current = sample;
        setState((current) => ({
          ...current,
          lastSample: sample,
          active: true,
          mode: 'gps',
          visibleTracking: true,
        }));
      },
      (error) => {
        setState((current) => ({
          ...current,
          error: error.message || 'Geolocation denied',
          active: false,
          mode: 'idle',
          visibleTracking: false,
        }));
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );

    postTimer.current = window.setInterval(() => {
      const sample = latest.current;
      if (sample) {
        void postSample(sample).catch((error: unknown) => {
          setState((current) => ({
            ...current,
            error: error instanceof Error ? error.message : 'Location update failed',
          }));
        });
      }
    }, 5000);

    return true;
  }, [clearTimers, postSample, stop]);

  useEffect(() => {
    if (!enabled) {
      stop();
    }
  }, [enabled, stop]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return useMemo(
    () => ({
      state,
      startGps,
      startSimulator,
      stop,
      setError: (error: string | null) =>
        setState((current) => ({
          ...current,
          error,
        })),
      sendCurrent: async () => {
        if (latest.current) {
          await postSample(latest.current);
        }
      },
    }),
    [postSample, startGps, startSimulator, state, stop],
  );
}
