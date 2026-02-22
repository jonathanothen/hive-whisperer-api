import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioLines } from 'lucide-react';
import type { SensorReading } from '@/types/hive';
import SensorChart from './SensorChart';
import type { TimeRange } from './TimeRangeSelector';

interface AudioAnalysisPanelProps {
  latestReading?: SensorReading;
  normalDbfs: number | null;
  readings: SensorReading[];
  timeRange: TimeRange;
}

export default function AudioAnalysisPanel({ normalDbfs, latestReading, readings, timeRange }: AudioAnalysisPanelProps) {
  const r = latestReading;

  const hasAudioData = r && (r.dbfs != null || r.band_hum != null || r.peak_freq != null);

  const deviationDb = r?.dbfs != null && normalDbfs != null ? r.dbfs - normalDbfs : null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <AudioLines className="h-5 w-5 text-chart-sound" />
        Ljudanalys (Svärmdetektering)
      </h2>

      {/* Current audio values with descriptions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AudioValueCard
          label="~dB SPL"
          value={r?.dbfs != null ? (r.dbfs + 120).toFixed(1) : '-'}
          description="Uppskattad ljudnivå (MSM261S4030H0R, S=-26 dBFS). Kan avvika upp till ±3 dB från verkligt värde."
          alert={r?.dbfs != null && (r.dbfs + 120) > 100}
        />
        <AudioValueCard
          label="dBFS"
          value={r?.dbfs != null ? r.dbfs.toFixed(1) : '-'}
          description={
            normalDbfs != null
              ? `Normal: ${normalDbfs.toFixed(1)} dBFS${deviationDb != null ? ` • Δ ${deviationDb > 0 ? '+' : ''}${deviationDb.toFixed(1)} dB` : ''}`
              : 'Relativ ljudstyrka i decibel. Jämförs mot normalvärde.'
          }
          alert={deviationDb != null && Math.abs(deviationDb) > 6}
        />
        <AudioValueCard
          label="Peak-frekvens"
          value={r?.peak_freq != null ? `${r.peak_freq.toFixed(0)} Hz` : '-'}
          description="Dominerande frekvens i spektrat. Höga värden (>400 Hz) kan tyda på piping."
        />
        <AudioValueCard
          label="Piping/Hum-ratio"
          value={r?.piping_ratio != null ? r.piping_ratio.toFixed(2) : '-'}
          description="Kvot mellan piping- och hum-band. Värde >1.5 indikerar ökad drottningaktivitet."
          alert={r?.piping_ratio != null && r.piping_ratio > 1.5}
        />
        <AudioValueCard
          label="Svärm-score"
          value={r?.swarm_score != null ? (r.swarm_score * 100).toFixed(0) + '%' : '-'}
          description="Heuristisk sannolikhet för svärmning baserat på alla ljudparametrar."
          alert={r?.swarm_score != null && r.swarm_score > 0.5}
        />
      </div>

      {/* Band energy bars */}
      {hasAudioData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bandenergi (aktuellt)</CardTitle>
            <p className="text-xs text-muted-foreground">Normaliserad energi per frekvensband från FFT-analysen.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <BandBar label="Hum (200–300 Hz)" value={r?.band_hum} color="bg-[hsl(var(--chart-band-hum))]" description="Normalt surr — friska bin." />
            <BandBar label="Piping (300–500 Hz)" value={r?.band_piping} color="bg-[hsl(var(--chart-band-piping))]" description="Drottningpiping — kan föregå svärmning." />
            <BandBar label="Svärm (450–650 Hz)" value={r?.band_swarm} color="bg-[hsl(var(--chart-band-swarm))]" description="Svärmsignal — förhöjt värde = hög risk." />
            <BandBar label="Hiss (800–3000 Hz)" value={r?.band_hiss} color="bg-[hsl(var(--chart-band-hiss))]" description="Bakgrundsbrus — kan indikera stress." />
          </CardContent>
        </Card>
      )}

      {/* Historical charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SensorChart
          title="Peak-frekvens"
          description="Dominerande frekvens i spektrat. Höga värden (>400 Hz) kan tyda på piping."
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
          description="Kvot mellan piping- och hum-band. Värde >1.5 indikerar drottningaktivitet."
          data={readings}
          dataKey="piping_ratio"
          name="Ratio"
          color="hsl(var(--chart-band-piping))"
          domain={[0, 5]}
          timeRange={timeRange}
        />
        <SensorChart
          title="~dB SPL (uppskattad)"
          description="Konverterad från dBFS med MSM261S4030H0R (S=-26 dBFS @ 94 dB SPL). Kan avvika upp till ±3 dB (RMS vs peak)."
          data={readings}
          dataKey="db_spl"
          name="dB SPL"
          color="hsl(var(--chart-sound))"
          unit=" dB"
          domain={[20, 120]}
          timeRange={timeRange}
        />
        <SensorChart
          title="dBFS (råvärde)"
          description="Relativ ljudstyrka i decibel. Jämförs mot normalvärde."
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
          description="Heuristisk sannolikhet baserat på alla ljudparametrar."
          data={readings}
          dataKey="swarm_score"
          name="Score"
          color="hsl(var(--chart-swarm))"
          domain={[0, 1]}
          timeRange={timeRange}
        />

        {/* Band energy historical charts */}
        <SensorChart
          title="Hum (200–300 Hz)"
          description="Normalt surr — friska bin."
          data={readings}
          dataKey="band_hum"
          name="Hum"
          color="hsl(var(--chart-band-hum))"
          domain={[0, 0.5]}
          timeRange={timeRange}
        />
        <SensorChart
          title="Piping (300–500 Hz)"
          description="Drottningpiping — kan föregå svärmning."
          data={readings}
          dataKey="band_piping"
          name="Piping"
          color="hsl(var(--chart-band-piping))"
          domain={[0, 0.5]}
          timeRange={timeRange}
        />
        <SensorChart
          title="Svärm (450–650 Hz)"
          description="Svärmsignal — förhöjt värde = hög risk."
          data={readings}
          dataKey="band_swarm"
          name="Svärm"
          color="hsl(var(--chart-band-swarm))"
          domain={[0, 0.5]}
          timeRange={timeRange}
        />
        <SensorChart
          title="Hiss (800–3000 Hz)"
          description="Bakgrundsbrus — kan indikera stress."
          data={readings}
          dataKey="band_hiss"
          name="Hiss"
          color="hsl(var(--chart-band-hiss))"
          domain={[0, 0.5]}
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

function BandBar({ label, value, color, description }: { label: string; value: number | null | undefined; color: string; description: string }) {
  const pct = value != null ? Math.min(value * 100, 100) : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <div>
          <span className="text-muted-foreground">{label}</span>
          <p className="text-[10px] text-muted-foreground/70">{description}</p>
        </div>
        <span className="font-mono">{value != null ? value.toFixed(3) : '-'}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
