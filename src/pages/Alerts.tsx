import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAlerts, useAcknowledgeAlert } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Check, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();

  const unacknowledged = alerts?.filter((a) => !a.acknowledged) || [];
  const acknowledged = alerts?.filter((a) => a.acknowledged) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Varningar</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-6">
            {unacknowledged.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-status-alarm" />
                  Olästa ({unacknowledged.length})
                </h2>
                <div className="space-y-3">
                  {unacknowledged.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={() => acknowledgeAlert.mutate(alert.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {acknowledged.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  Lästa ({acknowledged.length})
                </h2>
                <div className="space-y-3">
                  {acknowledged.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} acknowledged />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga varningar</h3>
              <p className="text-muted-foreground">
                Alla dina bikupor mår bra!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

interface AlertCardProps {
  alert: {
    id: string;
    hive_id: string;
    alert_type: 'warning' | 'alarm';
    message: string;
    created_at: string;
    sms_sent: boolean;
    hive?: { id: string; name: string };
  };
  acknowledged?: boolean;
  onAcknowledge?: () => void;
}

function AlertCard({ alert, acknowledged, onAcknowledge }: AlertCardProps) {
  const isAlarm = alert.alert_type === 'alarm';

  return (
    <Card
      className={cn(
        'transition-opacity',
        acknowledged && 'opacity-60',
        !acknowledged && isAlarm && 'border-status-alarm'
      )}
    >
      <CardContent className="flex items-start justify-between gap-4 py-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              isAlarm ? 'bg-status-alarm/20 text-status-alarm' : 'bg-status-warning/20 text-status-warning'
            )}
          >
            {isAlarm ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isAlarm ? 'destructive' : 'secondary'}>
                {isAlarm ? 'Larm' : 'Varning'}
              </Badge>
              {alert.hive && (
                <Link
                  to={`/dashboard/hives/${alert.hive.id}`}
                  className="text-sm font-medium hover:underline flex items-center gap-1"
                >
                  {alert.hive.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {alert.sms_sent && (
                <Badge variant="outline" className="text-xs">
                  SMS skickat
                </Badge>
              )}
            </div>
            <p className="text-sm mb-1">{alert.message}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(alert.created_at), 'PPpp', { locale: sv })}
            </p>
          </div>
        </div>

        {!acknowledged && onAcknowledge && (
          <Button variant="outline" size="sm" onClick={onAcknowledge}>
            <Check className="h-4 w-4 mr-1" />
            Markera som läst
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
