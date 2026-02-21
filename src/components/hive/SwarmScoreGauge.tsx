import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SwarmScoreGaugeProps {
  score: number | null | undefined;
}

function getSwarmInfo(score: number | null | undefined) {
  if (score == null) return { label: 'Ingen data', colorClass: 'text-muted-foreground', bgClass: 'bg-muted', barColor: 'bg-muted-foreground/30' };
  if (score > 0.7) return { label: 'Hög risk', colorClass: 'text-status-alarm', bgClass: 'bg-status-alarm/10', barColor: 'bg-status-alarm' };
  if (score > 0.4) return { label: 'Förhöjd', colorClass: 'text-status-warning', bgClass: 'bg-status-warning/10', barColor: 'bg-status-warning' };
  return { label: 'Normal', colorClass: 'text-status-ok', bgClass: 'bg-status-ok/10', barColor: 'bg-status-ok' };
}

export default function SwarmScoreGauge({ score }: SwarmScoreGaugeProps) {
  const info = getSwarmInfo(score);
  const pct = score != null ? Math.min(score * 100, 100) : 0;

  return (
    <Card className={cn(info.bgClass)}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Svärm-score</p>
              <p className={cn('text-3xl font-bold', info.colorClass)}>
                {score != null ? `${(score * 100).toFixed(0)}%` : '-'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn('text-sm', info.colorClass)}>
            {info.label}
          </Badge>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', info.barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
