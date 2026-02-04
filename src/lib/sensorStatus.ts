import { SensorReading, Hive } from '@/types/hive';

export type ConnectionStatus = 'online' | 'stale' | 'offline';

// Thresholds in minutes
const ONLINE_THRESHOLD = 2; // Within 2 minutes = online (heartbeat every 30s)
const STALE_THRESHOLD = 5; // Within 5 minutes = stale (missed a few heartbeats)

/**
 * Get connection status based on last_seen timestamp (preferred) or latest reading
 */
export function getConnectionStatus(hive?: Pick<Hive, 'last_seen'>, latestReading?: SensorReading): ConnectionStatus {
  // Prefer last_seen if available (updated by heartbeat)
  const lastContactTime = hive?.last_seen 
    ? new Date(hive.last_seen).getTime()
    : latestReading?.recorded_at 
      ? new Date(latestReading.recorded_at).getTime()
      : null;

  if (!lastContactTime) {
    return 'offline';
  }

  const now = Date.now();
  const minutesSinceContact = (now - lastContactTime) / (1000 * 60);

  if (minutesSinceContact <= ONLINE_THRESHOLD) {
    return 'online';
  } else if (minutesSinceContact <= STALE_THRESHOLD) {
    return 'stale';
  } else {
    return 'offline';
  }
}

export function getConnectionStatusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'stale':
      return 'Instabil';
    case 'offline':
      return 'Offline';
  }
}

/**
 * Get time since last contact (heartbeat or reading)
 */
export function getTimeSinceContact(hive?: Pick<Hive, 'last_seen'>, latestReading?: SensorReading): string {
  const lastContactTime = hive?.last_seen 
    ? new Date(hive.last_seen).getTime()
    : latestReading?.recorded_at 
      ? new Date(latestReading.recorded_at).getTime()
      : null;

  if (!lastContactTime) {
    return 'Ingen kontakt';
  }

  const now = Date.now();
  const secondsAgo = Math.floor((now - lastContactTime) / 1000);

  if (secondsAgo < 60) {
    return `${secondsAgo}s sedan`;
  } else if (secondsAgo < 3600) {
    return `${Math.floor(secondsAgo / 60)}m sedan`;
  } else if (secondsAgo < 86400) {
    return `${Math.floor(secondsAgo / 3600)}h sedan`;
  } else {
    return `${Math.floor(secondsAgo / 86400)}d sedan`;
  }
}

/**
 * Get time since last sensor reading specifically
 */
export function getTimeSinceReading(latestReading?: SensorReading): string {
  if (!latestReading) {
    return 'Ingen data';
  }

  const lastReadingTime = new Date(latestReading.recorded_at).getTime();
  const now = Date.now();
  const secondsAgo = Math.floor((now - lastReadingTime) / 1000);

  if (secondsAgo < 60) {
    return `${secondsAgo}s sedan`;
  } else if (secondsAgo < 3600) {
    return `${Math.floor(secondsAgo / 60)}m sedan`;
  } else if (secondsAgo < 86400) {
    return `${Math.floor(secondsAgo / 3600)}h sedan`;
  } else {
    return `${Math.floor(secondsAgo / 86400)}d sedan`;
  }
}
