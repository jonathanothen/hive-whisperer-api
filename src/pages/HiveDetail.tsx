import { useState } from 'react';
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
  AlertTriangle,
  Wifi,
  WifiOff,
  Loader2,
  ChevronDown,
  AudioLines,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SensorChart from '@/components/hive/SensorChart';
import SensorTerminal from '@/components/hive/SensorTerminal';
import CalibrationPanel from '@/components/hive/CalibrationPanel';
import AudioAnalysisPanel from '@/components/hive/AudioAnalysisPanel';
import SwarmScoreGauge from '@/components/hive/SwarmScoreGauge';
import AudioTrend24h from '@/components/hive/AudioTrend24h';
import TimeRangeSelector, { TimeRange, getDateRange } from '@/components/hive/TimeRangeSelector';
import { getConnectionStatus, getConnectionStatusLabel, getTimeSinceContact } from '@/lib/sensorStatus';

export default function HiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [audioOpen, setAudioOpen] = useState(false);

  const dateRange = getDateRange(timeRange, selectedDate);

  const { data: hive, isLoading, isFetching, refetch } = useHive(id!);
  const { data: readings } = useSensorReadings(id!, dateRange);
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
  const connectionStatus = getConnectionStatus(hive, reading);

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
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('gap-1 h-6 px-2', connectionTextColors[connectionStatus])}
                  disabled={isFetching}
                  onClick={(e) => {
                    e.preventDefault();
                    refetch();
                  }}
                >
                  {isFetching ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : connectionStatus === 'online' ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  {getConnectionStatusLabel(connectionStatus)}
                  <span className="text-muted-foreground ml-1">• {getTimeSinceContact(hive, reading)}</span>
                </Button>
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

        {/* Swarm score — main indicator */}
        <SwarmScoreGauge score={reading?.swarm_score} />

        {/* Current values */}
        <div className="grid gap-4 sm:grid-cols-3">
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
        </div>

        {/* 24h Audio Trends */}
        <AudioTrend24h hiveId={id!} />

        {/* Audio details — collapsible */}
        <Collapsible open={audioOpen} onOpenChange={setAudioOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2">
              <span className="flex items-center gap-2">
                <AudioLines className="h-4 w-4" />
                Audio detaljer
              </span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', audioOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <AudioAnalysisPanel
              hiveId={id!}
              normalDbfs={hive.normal_dbfs ?? null}
              latestReading={reading}
              readings={readings || []}
              timeRange={timeRange}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Time Range Selector */}
        <TimeRangeSelector
          range={timeRange}
          date={selectedDate}
          onRangeChange={setTimeRange}
          onDateChange={setSelectedDate}
        />

        {/* Charts */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SensorChart
            title="Temperatur"
            data={readings || []}
            dataKey="temperature"
            name="Temperatur"
            color="hsl(var(--chart-temperature))"
            unit="°C"
            domain={[-10, 50]}
            timeRange={timeRange}
          />
          <SensorChart
            title="Luftfuktighet"
            data={readings || []}
            dataKey="humidity"
            name="Luftfuktighet"
            color="hsl(var(--chart-humidity))"
            unit="%"
            domain={[0, 100]}
            timeRange={timeRange}
          />
          <SensorChart
            title="Vikt"
            data={readings || []}
            dataKey="weight"
            name="Vikt"
            color="hsl(var(--chart-weight))"
            unit=" kg"
            domain={[0, 100]}
            timeRange={timeRange}
          />
        </div>

        {/* Calibration */}
        {hive.device_id && <CalibrationPanel deviceId={hive.device_id} />}

        {/* Debug Terminal */}
        <SensorTerminal hiveId={id!} />

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
