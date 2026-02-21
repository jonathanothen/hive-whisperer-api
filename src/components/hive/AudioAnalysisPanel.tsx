import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AudioLines, Radio } from 'lucide-react';
import type { SensorReading } from '@/types/hive';
import SensorChart from './SensorChart';
import type { TimeRange } from './TimeRangeSelector';

interface AudioAnalysisPanelProps {
  latestReading?: SensorReading;
  readings: SensorReading[];
  timeRange: TimeRange;
}

export default function AudioAnalysisPanel({ latestReading, readings, timeRange }: AudioAnalysisPanelProps) {
  const r = latestReading;

  const hasAudioData = r && (r.dbfs != null || r.band_hum != null || r.peak_freq != null);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <AudioLines className="h-5 w-5 text-chart-sound" />
        Ljudanalys (Svärmdetektering)
      </h2>

      {/* Current audio values */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AudioValueCard
          label="dBFS"
          value={r?.dbfs != null ? r.dbfs.toFixed(1) : '-'}
          description="Relativ ljudstyrka"
        />
        <AudioValueCard
          label="Peak-frekvens"
          value={r?.peak_freq != null ? `${r.peak_freq.toFixed(0)} Hz` : '-'}
          description="Dominerande frekvens (150–650 Hz)"
        />
        <AudioValueCard
          label="Piping/Hum-ratio"
          value={r?.piping_ratio != null ? r.piping_ratio.toFixed(2) : '-'}
          description="Högt = ökad piping-aktivitet"
          alert={r?.piping_ratio != null && r.piping_ratio > 1.5}
        />
        <AudioValueCard
          label="Svärm-score"
          value={r?.swarm_score != null ? (r.swarm_score * 100).toFixed(0) + '%' : '-'}
          description="Heuristisk sannolikhet"
          alert={r?.swarm_score != null && r.swarm_score > 0.5}
        />
      </div>

      {/* Band energy bars */}
      {hasAudioData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bandenergi (aktuellt)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <BandBar label="Hum (200–300 Hz)" value={r?.band_hum} color="bg-[hsl(var(--chart-band-hum))]" />
            <BandBar label="Piping (300–500 Hz)" value={r?.band_piping} color="bg-[hsl(var(--chart-band-piping))]" />
            <BandBar label="Svärm (450–650 Hz)" value={r?.band_swarm} color="bg-[hsl(var(--chart-band-swarm))]" />
            <BandBar label="Hiss (800–3000 Hz)" value={r?.band_hiss} color="bg-[hsl(var(--chart-band-hiss))]" />
          </CardContent>
        </Card>
      )}

      {/* Historical charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SensorChart
          title="Peak-frekvens"
          data={readings}
          dataKey="peak_freq"
          name="Peak Hz"
          color="hsl(var(--chart-peak-freq))"
          unit=" Hz"
          domain={[100, 700]}
          timeRange={timeRange}
        />
        <SensorChart
          title="Piping/Hum Ratio"
          data={readings}
          dataKey="piping_ratio"
          name="Ratio"
          color="hsl(var(--chart-band-piping))"
          domain={[0, 5]}
          timeRange={timeRange}
        />
        <SensorChart
          title="dBFS"
          data={readings}
          dataKey="dbfs"
          name="dBFS"
          color="hsl(var(--chart-sound))"
          unit=" dBFS"
          domain={[-80, 0]}
          timeRange={timeRange}
        />
        <SensorChart
          title="Svärm-score"
          data={readings}
          dataKey="swarm_score"
          name="Score"
          color="hsl(var(--chart-swarm))"
          domain={[0, 1]}
          timeRange={timeRange}
        />
      </div>
    </div>
  );
}

function AudioValueCard({
  label,
  value,
  description,
  alert = false,
}: {
  label: string;
  value: string;
  description: string;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? 'border-status-alarm/50 bg-status-alarm/5' : ''}>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${alert ? 'text-status-alarm' : ''}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function BandBar({ label, value, color }: { label: string; value: number | null | undefined; color: string }) {
  // Normalize: assume max band energy ~1.0 for display
  const pct = value != null ? Math.min(value * 100, 100) : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value != null ? value.toFixed(3) : '-'}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
