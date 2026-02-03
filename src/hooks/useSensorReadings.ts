import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { SensorReading } from '@/types/hive';
import { useEffect } from 'react';

interface DateRange {
  start: Date;
  end: Date;
}

export function useSensorReadings(hiveId: string, dateRange?: DateRange) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime sensor readings
  useEffect(() => {
    if (!user || !hiveId) return;

    const channel = supabase
      .channel(`sensor-readings-${hiveId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `hive_id=eq.${hiveId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sensor-readings', hiveId] });
          queryClient.invalidateQueries({ queryKey: ['hive', hiveId] });
          queryClient.invalidateQueries({ queryKey: ['hives'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, hiveId, queryClient]);

  return useQuery({
    queryKey: ['sensor-readings', hiveId, dateRange?.start?.toISOString(), dateRange?.end?.toISOString()],
    queryFn: async (): Promise<SensorReading[]> => {
      if (!user || !hiveId) return [];

      let query = supabase
        .from('sensor_readings')
        .select('*')
        .eq('hive_id', hiveId)
        .order('recorded_at', { ascending: true });

      if (dateRange) {
        query = query
          .gte('recorded_at', dateRange.start.toISOString())
          .lte('recorded_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!hiveId,
  });
}
