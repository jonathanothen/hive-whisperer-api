export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone_number: string | null;
  sms_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Apiary {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hive {
  id: string;
  user_id: string;
  apiary_id: string | null;
  name: string;
  device_id: string | null;
  notes: string | null;
  status: 'ok' | 'warning' | 'alarm';
  last_seen: string | null;
  normal_dbfs: number | null;
  created_at: string;
  updated_at: string;
  apiary?: Apiary;
}

export interface SensorReading {
  id: string;
  hive_id: string;
  temperature: number | null;
  humidity: number | null;
  weight: number | null;
  sound_rms: number | null;
  swarm_score: number | null;
  dbfs: number | null;
  band_hum: number | null;
  band_piping: number | null;
  band_swarm: number | null;
  band_hiss: number | null;
  peak_freq: number | null;
  piping_ratio: number | null;
  recorded_at: string;
}

export interface Alert {
  id: string;
  hive_id: string;
  user_id: string;
  alert_type: 'warning' | 'alarm';
  message: string;
  acknowledged: boolean;
  sms_sent: boolean;
  created_at: string;
  hive?: { id: string; name: string };
}

export interface HiveWithLatestReading extends Hive {
  latest_reading?: SensorReading;
}
