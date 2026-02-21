import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Thermometer, Droplets, Scale, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import type { HiveWithLatestReading } from '@/types/hive';
import { getConnectionStatus, getConnectionStatusLabel, getTimeSinceContact } from '@/lib/sensorStatus';

interface HiveCardProps {
  hive: HiveWithLatestReading;
}

function getSwarmLevel(score: number | null | undefined): { label: string; colorClass: string; bgClass: string } {
  if (score == null) return { label: '-', colorClass: 'text-muted-foreground', bgClass: 'bg-muted' };
  if (score > 0.7) return { label: 'Hög', colorClass: 'text-status-alarm', bgClass: 'bg-status-alarm/15' };
  if (score > 0.4) return { label: 'Medel', colorClass: 'text-status-warning', bgClass: 'bg-status-warning/15' };
  return { label: 'Låg', colorClass: 'text-status-ok', bgClass: 'bg-status-ok/15' };
}

export default function HiveCard({ hive }: HiveCardProps) {
  const reading = hive.latest_reading;
  const connectionStatus = getConnectionStatus(hive, reading);
  const swarm = getSwarmLevel(reading?.swarm_score);

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
              className={cn('text-white', statusColors[hive.status])}
            >
              {hive.status === 'alarm' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {statusLabels[hive.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {reading ? (
            <div className="space-y-3">
              {/* Swarm score — main indicator */}
              <div className={cn('flex items-center justify-between rounded-lg px-3 py-2', swarm.bgClass)}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🐝</span>
                  <span className="text-sm font-medium">Svärm-score</span>
                </div>
                <div className={cn('flex items-center gap-2', swarm.colorClass)}>
                  <span className="text-xl font-bold">
                    {reading.swarm_score != null ? `${(reading.swarm_score * 100).toFixed(0)}%` : '-'}
                  </span>
                  <Badge variant="outline" className={cn('text-xs', swarm.colorClass)}>
                    {swarm.label}
                  </Badge>
                </div>
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-3 gap-3">
                <DataItem
                  icon={Thermometer}
                  label="Temp"
                  value={reading.temperature != null ? `${reading.temperature.toFixed(1)}°` : '-'}
                  colorClass="text-chart-temperature"
                />
                <DataItem
                  icon={Droplets}
                  label="Fukt"
                  value={reading.humidity != null ? `${reading.humidity.toFixed(0)}%` : '-'}
                  colorClass="text-chart-humidity"
                />
                <DataItem
                  icon={Scale}
                  label="Vikt"
                  value={reading.weight != null ? `${reading.weight.toFixed(1)}kg` : '-'}
                  colorClass="text-chart-weight"
                />
              </div>
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
                <span className="text-muted-foreground">• {getTimeSinceContact(hive, reading)}</span>
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
    <div className="flex items-center gap-1.5">
      <Icon className={cn('h-3.5 w-3.5', colorClass)} />
      <div>
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
