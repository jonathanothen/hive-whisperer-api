import type { SensorReading } from '@/types/hive';
import { startOfHour, startOfDay, format } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { TimeRange } from '@/components/hive/TimeRangeSelector';

export interface AggregatedReading {
  recorded_at: string;
  temperature: number | null;
  humidity: number | null;
  weight: number | null;
  sound_rms: number | null;
  swarm_score: number | null;
  dbfs: number | null;
  db_spl: number | null;
  band_hum: number | null;
  band_piping: number | null;
  band_swarm: number | null;
  band_hiss: number | null;
  peak_freq: number | null;
  piping_ratio: number | null;
  count: number;
}

function getIntervalKey(date: Date, range: TimeRange): string {
  switch (range) {
    case 'day': {
      // Group by hour
      return startOfHour(date).toISOString();
    }
    case 'week': {
      // Group by 6-hour intervals (0-5, 6-11, 12-17, 18-23)
      const hour = date.getHours();
      const intervalStart = Math.floor(hour / 6) * 6;
      const intervalDate = startOfHour(date);
      intervalDate.setHours(intervalStart);
      return intervalDate.toISOString();
    }
    case 'month': {
      // Group by day
      return startOfDay(date).toISOString();
    }
  }
}

function calculateAverage(values: (number | null)[]): number | null {
  const validValues = values.filter((v): v is number => v !== null && v !== undefined);
  if (validValues.length === 0) return null;
  return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
}

export function aggregateSensorData(readings: SensorReading[], range: TimeRange): AggregatedReading[] {
  if (readings.length === 0) return [];

  // Group readings by interval
  const groups = new Map<string, SensorReading[]>();
  
  for (const reading of readings) {
    const key = getIntervalKey(new Date(reading.recorded_at), range);
    const group = groups.get(key) || [];
    group.push(reading);
    groups.set(key, group);
  }

  // Calculate averages for each group
  const aggregated: AggregatedReading[] = [];
  
  for (const [key, group] of groups) {
    aggregated.push({
      recorded_at: key,
      temperature: calculateAverage(group.map(r => r.temperature)),
      humidity: calculateAverage(group.map(r => r.humidity)),
      weight: calculateAverage(group.map(r => r.weight)),
      sound_rms: calculateAverage(group.map(r => r.sound_rms)),
      swarm_score: calculateAverage(group.map(r => r.swarm_score)),
      dbfs: calculateAverage(group.map(r => r.dbfs)),
      db_spl: (() => {
        const avgDbfs = calculateAverage(group.map(r => r.dbfs));
        return avgDbfs != null ? avgDbfs + 120 : null;
      })(),
      band_hum: calculateAverage(group.map(r => r.band_hum)),
      band_piping: calculateAverage(group.map(r => r.band_piping)),
      band_swarm: calculateAverage(group.map(r => r.band_swarm)),
      band_hiss: calculateAverage(group.map(r => r.band_hiss)),
      peak_freq: calculateAverage(group.map(r => r.peak_freq)),
      piping_ratio: calculateAverage(group.map(r => r.piping_ratio)),
      count: group.length,
    });
  }

  // Sort by time
  return aggregated.sort((a, b) => 
    new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
}

export function formatAggregatedTime(dateStr: string, range: TimeRange): string {
  const date = new Date(dateStr);
  
  switch (range) {
    case 'day': {
      // Show hour
      const hour = date.getHours();
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    case 'week': {
      // Show day + time block
      const hour = date.getHours();
      return `${format(date, 'EEE', { locale: sv })} ${hour.toString().padStart(2, '0')}:00`;
    }
    case 'month':
      return format(date, 'd MMM', { locale: sv });
  }
}
