import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SensorReading } from '@/types/hive';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { aggregateSensorData, formatAggregatedTime, type AggregatedReading } from '@/lib/aggregateSensorData';
import type { TimeRange } from './TimeRangeSelector';

interface SensorChartProps {
  title: string;
  description?: string;
  data: SensorReading[];
  dataKey: keyof SensorReading | keyof AggregatedReading;
  name: string;
  color: string;
  unit?: string;
  domain?: [number, number];
  timeRange: TimeRange;
  computed?: (r: SensorReading) => number | null;
}

export default function SensorChart({ 
  title,
  description,
  data, 
  dataKey, 
  name, 
  color, 
  unit = '',
  domain,
  timeRange,
  computed,
}: SensorChartProps) {
  // Aggregate data based on time range
  const aggregatedData = aggregateSensorData(data, timeRange);
  
  const chartData = aggregatedData.map((reading) => ({
    ...reading,
    formattedTime: formatAggregatedTime(reading.recorded_at, timeRange),
  }));

  const hasData = chartData.length > 0;

  const formatTooltipLabel = (payload: AggregatedReading) => {
    const date = new Date(payload.recorded_at);
    switch (timeRange) {
      case 'day': {
        const hour = date.getHours();
        return `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00 (${payload.count} mätningar)`;
      }
      case 'week': {
        const hour = date.getHours();
        const endHour = hour + 6;
        return `${format(date, 'EEEE d MMMM', { locale: sv })} ${hour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00 (${payload.count} mätningar)`;
      }
      case 'month':
        return `${format(date, 'PPP', { locale: sv })} (${payload.count} mätningar)`;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="formattedTime"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  domain={domain || ['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `${value}${unit}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload) {
                      return formatTooltipLabel(payload[0].payload as AggregatedReading);
                    }
                    return '';
                  }}
                  formatter={(value: number) => [`${value?.toFixed(1)}${unit}`, name]}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  name={name}
                  stroke={color}
                  dot={chartData.length < 20}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Ingen sensordata för denna period
          </div>
        )}
      </CardContent>
    </Card>
  );
}