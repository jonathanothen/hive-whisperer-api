import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Thermometer, Droplets, Scale, Volume2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import type { HiveWithLatestReading } from '@/types/hive';
import { getConnectionStatus, getConnectionStatusLabel, getTimeSinceReading } from '@/lib/sensorStatus';

interface HiveCardProps {
  hive: HiveWithLatestReading;
}

export default function HiveCard({ hive }: HiveCardProps) {
  const reading = hive.latest_reading;
  const connectionStatus = getConnectionStatus(reading);

  const statusColors = {
    ok: 'bg-status-ok',
    warning: 'bg-status-warning',
    alarm: 'bg-status-alarm animate-pulse-slow',
  };

  const statusLabels = {
    ok: 'OK',
    warning: 'Varning',
    alarm: 'Larm',
  };

  const connectionColors = {
    online: 'text-status-ok',
    stale: 'text-status-warning',
    offline: 'text-muted-foreground',
  };

  return (
    <Link to={`/dashboard/hives/${hive.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {hive.name}
              </CardTitle>
              {hive.apiary && (
                <p className="text-sm text-muted-foreground">{hive.apiary.name}</p>
              )}
            </div>
            <Badge
              variant="secondary"
              className={cn(
                'text-white',
                statusColors[hive.status]
              )}
            >
              {hive.status === 'alarm' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {statusLabels[hive.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {reading ? (
            <div className="grid grid-cols-2 gap-4">
              <DataItem
                icon={Thermometer}
                label="Temperatur"
                value={reading.temperature != null ? `${reading.temperature.toFixed(1)}°C` : '-'}
                colorClass="text-chart-temperature"
              />
              <DataItem
                icon={Droplets}
                label="Luftfuktighet"
                value={reading.humidity != null ? `${reading.humidity.toFixed(0)}%` : '-'}
                colorClass="text-chart-humidity"
              />
              <DataItem
                icon={Scale}
                label="Vikt"
                value={reading.weight != null ? `${reading.weight.toFixed(1)} kg` : '-'}
                colorClass="text-chart-weight"
              />
              <DataItem
                icon={Volume2}
                label="Svärm-score"
                value={reading.swarm_score != null ? reading.swarm_score.toFixed(0) : '-'}
                colorClass="text-chart-swarm"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ingen sensordata ännu
            </p>
          )}
          {hive.device_id && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Enhet: {hive.device_id}
              </p>
              <div className={cn('flex items-center gap-1 text-xs', connectionColors[connectionStatus])}>
                {connectionStatus === 'online' ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span>{getConnectionStatusLabel(connectionStatus)}</span>
                {reading && (
                  <span className="text-muted-foreground">• {getTimeSinceReading(reading)}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function DataItem({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('h-4 w-4', colorClass)} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
