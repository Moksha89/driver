export type TrackingSample = {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  networkStatus?: string;
};

type GeoPositionLike = {
  coords: {
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
  };
};

type BatteryLike = {
  level: number;
};

type NetworkLike = {
  effectiveType?: string;
};

export function getNetworkStatus() {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const nav = navigator as Navigator & { connection?: NetworkLike };
  const online = navigator.onLine ? 'online' : 'offline';
  const connection = nav.connection?.effectiveType;

  return connection ? `${online}:${connection}` : online;
}

export async function getBatteryLevel() {
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<BatteryLike>;
  };
  if (!nav.getBattery) {
    return undefined;
  }

  try {
    const battery = await nav.getBattery();
    return Math.round(battery.level * 100);
  } catch {
    return undefined;
  }
}

export function normalizePosition(position: GeolocationPosition | GeoPositionLike): TrackingSample {
  const speed = position.coords.speed;
  const heading = position.coords.heading;

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    speed: typeof speed === 'number' ? speed : undefined,
    heading: typeof heading === 'number' ? heading : undefined,
  };
}
