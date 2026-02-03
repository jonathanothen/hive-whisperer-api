import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useHive, useDeleteHive } from '@/hooks/useHives';
import { useSensorReadings } from '@/hooks/useSensorReadings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Thermometer,
  Droplets,
  Scale,
  Volume2,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import SensorChart from '@/components/hive/SensorChart';
import { getConnectionStatus, getConnectionStatusLabel, getTimeSinceReading } from '@/lib/sensorStatus';

export default function HiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: hive, isLoading } = useHive(id!);
  const { data: readings } = useSensorReadings(id!);
  const deleteHive = useDeleteHive();

  const handleDelete = async () => {
    await deleteHive.mutateAsync(id!);
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hive) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Bikupa hittades inte</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Tillbaka till översikten</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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

  const reading = hive.latest_reading;
  const connectionStatus = getConnectionStatus(reading);

  const connectionColors = {
    online: 'bg-status-ok',
    stale: 'bg-status-warning',
    offline: 'bg-muted',
  };

  const connectionTextColors = {
    online: 'text-status-ok',
    stale: 'text-status-warning',
    offline: 'text-muted-foreground',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{hive.name}</h1>
                <Badge
                  variant="secondary"
                  className={cn('text-white', statusColors[hive.status])}
                >
                  {hive.status === 'alarm' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {statusLabels[hive.status]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('gap-1', connectionTextColors[connectionStatus])}
                >
                  {connectionStatus === 'online' ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  {getConnectionStatusLabel(connectionStatus)}
                  {reading && (
                    <span className="text-muted-foreground ml-1">• {getTimeSinceReading(reading)}</span>
                  )}
                </Badge>
              </div>
              {hive.apiary && (
                <p className="text-muted-foreground">{hive.apiary.name}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/dashboard/hives/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Redigera
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ta bort
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ta bort bikupa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta kommer permanent ta bort bikupan och all dess sensordata.
                    Denna åtgärd kan inte ångras.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Ta bort
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Current values */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard
            icon={Thermometer}
            label="Temperatur"
            value={reading?.temperature != null ? `${reading.temperature.toFixed(1)}°C` : '-'}
            colorClass="text-chart-temperature"
          />
          <ValueCard
            icon={Droplets}
            label="Luftfuktighet"
            value={reading?.humidity != null ? `${reading.humidity.toFixed(0)}%` : '-'}
            colorClass="text-chart-humidity"
          />
          <ValueCard
            icon={Scale}
            label="Vikt"
            value={reading?.weight != null ? `${reading.weight.toFixed(1)} kg` : '-'}
            colorClass="text-chart-weight"
          />
          <ValueCard
            icon={Volume2}
            label="Svärm-score"
            value={reading?.swarm_score != null ? reading.swarm_score.toFixed(0) : '-'}
            colorClass="text-chart-swarm"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SensorChart
            title="Miljö"
            data={readings || []}
            lines={[
              { dataKey: 'temperature', name: 'Temperatur (°C)', color: 'hsl(var(--chart-temperature))' },
              { dataKey: 'humidity', name: 'Luftfuktighet (%)', color: 'hsl(var(--chart-humidity))', yAxisId: 'right' },
            ]}
          />
          <SensorChart
            title="Kupa"
            data={readings || []}
            lines={[
              { dataKey: 'weight', name: 'Vikt (kg)', color: 'hsl(var(--chart-weight))' },
              { dataKey: 'sound_rms', name: 'Ljudvolym (RMS)', color: 'hsl(var(--chart-swarm))', yAxisId: 'right' },
            ]}
          />
        </div>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hive.device_id && (
              <div>
                <span className="text-sm text-muted-foreground">Enhets-ID:</span>
                <p className="font-mono">{hive.device_id}</p>
              </div>
            )}
            {hive.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Anteckningar:</span>
                <p>{hive.notes}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">Skapad:</span>
              <p>{new Date(hive.created_at).toLocaleDateString('sv-SE')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ValueCard({
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
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className={cn('p-3 rounded-lg bg-muted', colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
