import { SensorReading } from '@/types/hive';

export type ConnectionStatus = 'online' | 'stale' | 'offline';

// Thresholds in minutes
const ONLINE_THRESHOLD = 5; // Within 5 minutes = online
const STALE_THRESHOLD = 30; // Within 30 minutes = stale (connection issues)

export function getConnectionStatus(latestReading?: SensorReading): ConnectionStatus {
  if (!latestReading) {
    return 'offline';
  }

  const lastReadingTime = new Date(latestReading.recorded_at).getTime();
  const now = Date.now();
  const minutesSinceReading = (now - lastReadingTime) / (1000 * 60);

  if (minutesSinceReading <= ONLINE_THRESHOLD) {
    return 'online';
  } else if (minutesSinceReading <= STALE_THRESHOLD) {
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
