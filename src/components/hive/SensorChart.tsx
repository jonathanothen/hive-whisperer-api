import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SensorReading } from '@/types/hive';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface SensorChartProps {
  title: string;
  data: SensorReading[];
  lines: {
    dataKey: keyof SensorReading;
    name: string;
    color: string;
    yAxisId?: 'left' | 'right';
  }[];
}

export default function SensorChart({ title, data, lines }: SensorChartProps) {
  const chartData = data.map((reading) => ({
    ...reading,
    time: new Date(reading.recorded_at).getTime(),
    formattedTime: format(new Date(reading.recorded_at), 'HH:mm', { locale: sv }),
  }));

  const hasData = chartData.length > 0;
  const hasRightAxis = lines.some((line) => line.yAxisId === 'right');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="formattedTime"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                {hasRightAxis && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.recorded_at) {
                      return format(new Date(payload[0].payload.recorded_at), 'PPpp', { locale: sv });
                    }
                    return '';
                  }}
                />
                <Legend />
                {lines.map((line) => (
                  <Line
                    key={line.dataKey}
                    type="monotone"
                    dataKey={line.dataKey}
                    name={line.name}
                    stroke={line.color}
                    yAxisId={line.yAxisId || 'left'}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Ingen sensordata ännu
          </div>
        )}
      </CardContent>
    </Card>
  );
}
