import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SensorChart from './SensorChart';
import type { SensorReading } from '@/types/hive';

interface AudioTrend24hProps {
  hiveId: string;
}

export default function AudioTrend24h({ hiveId }: AudioTrend24hProps) {
  const { user } = useAuth();

  const { data: readings } = useQuery({
    queryKey: ['audio-trend-24h', hiveId],
    queryFn: async (): Promise<SensorReading[]> => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('hive_id', hiveId)
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!hiveId,
    refetchInterval: 5 * 60 * 1000,
  });

  const data = readings || [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Senaste 24h — trender</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <SensorChart
          title="Svärm-score"
          data={data}
          dataKey="swarm_score"
          name="Score"
          color="hsl(var(--chart-swarm))"
          domain={[0, 1]}
          timeRange="day"
        />
        <SensorChart
          title="dBFS"
          data={data}
          dataKey="dbfs"
          name="dBFS"
          color="hsl(var(--chart-sound))"
          unit=" dBFS"
          domain={[-80, 0]}
          timeRange="day"
        />
        <SensorChart
          title="Piping/Hum Ratio"
          data={data}
          dataKey="piping_ratio"
          name="Ratio"
          color="hsl(var(--chart-band-piping))"
          domain={[0, 5]}
          timeRange="day"
        />
      </div>
    </div>
  );
}
