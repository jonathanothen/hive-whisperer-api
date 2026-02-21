import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Terminal, Trash2 } from 'lucide-react';
import type { SensorReading } from '@/types/hive';

interface LogEntry {
  timestamp: Date;
  data: SensorReading;
  isHistorical?: boolean;
}

interface SensorTerminalProps {
  hiveId: string;
}

export default function SensorTerminal({ hiveId }: SensorTerminalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Load recent historical data
  const loadHistoricalData = useCallback(async () => {
    const { data } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('hive_id', hiveId)
      .order('recorded_at', { ascending: false })
      .limit(20);

    if (data) {
      setLogs(
        data.map((reading) => ({
          timestamp: new Date(reading.recorded_at),
          data: reading as SensorReading,
          isHistorical: true,
        }))
      );
    }
  }, [hiveId]);

  // Reload data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadHistoricalData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [loadHistoricalData]);

  useEffect(() => {
    loadHistoricalData();

    // Subscribe to realtime changes on sensor_readings
    const channel = supabase
      .channel(`sensor-terminal-${hiveId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `hive_id=eq.${hiveId}`,
        },
        (payload) => {
          const reading = payload.new as SensorReading;
          setLogs((prev) => [
            { timestamp: new Date(), data: reading, isHistorical: false },
            ...prev.slice(0, 49), // Keep last 50 entries
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hiveId, loadHistoricalData]);

  const clearLogs = () => setLogs([]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-500" />
          <CardTitle className="text-sm font-mono text-green-500">
            Sensor Terminal
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearLogs}
          className="h-6 px-2 text-zinc-500 hover:text-zinc-300"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48 px-4 pb-4">
          {logs.length === 0 ? (
            <p className="text-zinc-500 font-mono text-xs py-2">
              Väntar på sensordata...
            </p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div
                  key={log.data.id || index}
                  className={`font-mono text-xs border-b border-zinc-800 pb-1 ${
                    !log.isHistorical ? 'bg-green-950/30' : ''
                  }`}
                >
                  <span className="text-zinc-500">[{formatTime(log.timestamp)}]</span>
                  <span className={`ml-2 ${log.isHistorical ? 'text-zinc-400' : 'text-green-400'}`}>
                    {log.isHistorical ? 'HIST:' : 'LIVE:'}
                  </span>
                  <div className="ml-4 text-zinc-300">
                    <span className="text-chart-temperature">temp:</span> {log.data.temperature?.toFixed(1) ?? '-'}°C{' '}
                    <span className="text-chart-humidity">hum:</span> {log.data.humidity?.toFixed(0) ?? '-'}%{' '}
                    <span className="text-chart-weight">weight:</span> {log.data.weight?.toFixed(1) ?? '-'}kg{' '}
                    <span className="text-chart-swarm">sound:</span> {log.data.sound_rms?.toFixed(0) ?? '-'}
                    {log.data.peak_freq != null && (
                      <>
                        {' '}<span className="text-chart-sound">peak:</span> {log.data.peak_freq.toFixed(0)}Hz
                        {' '}<span className="text-chart-sound">ratio:</span> {log.data.piping_ratio?.toFixed(2) ?? '-'}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
