import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HiveCard from '@/components/hive/HiveCard';
import { useHives } from '@/hooks/useHives';
import { useAlerts } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const { data: hives, isLoading } = useHives();
  const { data: alerts } = useAlerts();
  const [search, setSearch] = useState('');

  const filteredHives = hives?.filter(
    (hive) =>
      hive.name.toLowerCase().includes(search.toLowerCase()) ||
      hive.apiary?.name?.toLowerCase().includes(search.toLowerCase()) ||
      hive.device_id?.toLowerCase().includes(search.toLowerCase())
  );

  const unacknowledgedAlerts = alerts?.filter((a) => !a.acknowledged) || [];
  const hivesOk = hives?.filter((h) => h.status === 'ok').length || 0;
  const hivesWarning = hives?.filter((h) => h.status === 'warning').length || 0;
  const hivesAlarm = hives?.filter((h) => h.status === 'alarm').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Totalt kupor"
            value={hives?.length || 0}
            icon={<div className="text-2xl">🐝</div>}
          />
          <StatCard
            title="OK"
            value={hivesOk}
            icon={<CheckCircle className="h-6 w-6 text-status-ok" />}
          />
          <StatCard
            title="Varningar"
            value={hivesWarning}
            icon={<AlertCircle className="h-6 w-6 text-status-warning" />}
          />
          <StatCard
            title="Larm"
            value={hivesAlarm}
            icon={<AlertTriangle className="h-6 w-6 text-status-alarm" />}
            urgent={hivesAlarm > 0}
          />
        </div>

        {/* Alerts banner */}
        {unacknowledgedAlerts.length > 0 && (
          <Card className="border-status-alarm bg-status-alarm/10">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-status-alarm" />
                <span className="font-medium">
                  {unacknowledgedAlerts.length} olästa varningar
                </span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/alerts">Visa alla</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök kupor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button asChild>
            <Link to="/dashboard/hives/new">
              <Plus className="h-4 w-4 mr-2" />
              Lägg till kupa
            </Link>
          </Button>
        </div>

        {/* Hives grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredHives && filteredHives.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHives.map((hive) => (
              <HiveCard key={hive.id} hive={hive} />
            ))}
          </div>
        ) : hives && hives.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">🐝</div>
              <h3 className="text-lg font-semibold mb-2">Inga bikupor ännu</h3>
              <p className="text-muted-foreground mb-4">
                Lägg till din första bikupa för att börja övervaka den
              </p>
              <Button asChild>
                <Link to="/dashboard/hives/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till kupa
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Inga kupor matchar din sökning
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  urgent = false,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  urgent?: boolean;
}) {
  return (
    <Card className={urgent ? 'border-status-alarm' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
