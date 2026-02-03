import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHive, useUpdateHive, useApiaries } from '@/hooks/useHives';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditHive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: hive, isLoading } = useHive(id!);
  const { data: apiaries } = useApiaries();
  const updateHive = useUpdateHive();

  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [apiaryId, setApiaryId] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (hive) {
      setName(hive.name);
      setDeviceId(hive.device_id || '');
      setApiaryId(hive.apiary_id || '');
      setNotes(hive.notes || '');
    }
  }, [hive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateHive.mutateAsync({
      id: id!,
      name,
      device_id: deviceId || null,
      apiary_id: apiaryId || null,
      notes: notes || null,
    });

    navigate(`/dashboard/hives/${id}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto">
          <Skeleton className="h-96" />
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

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/dashboard/hives/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Redigera {hive.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bikupsinformation</CardTitle>
            <CardDescription>Uppdatera information om din bikupa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn *</Label>
                <Input
                  id="name"
                  placeholder="T.ex. Kupa 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-id">Enhets-ID</Label>
                <Input
                  id="device-id"
                  placeholder="Unikt ID från ESP32"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Det unika ID:t som din ESP32-enhet skickar med sensordata
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiary">Bigård</Label>
                <Select value={apiaryId} onValueChange={setApiaryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj bigård (valfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ingen bigård</SelectItem>
                    {apiaries?.map((apiary) => (
                      <SelectItem key={apiary.id} value={apiary.id}>
                        {apiary.name}
                        {apiary.location && ` - ${apiary.location}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Anteckningar</Label>
                <Textarea
                  id="notes"
                  placeholder="Valfria anteckningar om kupan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/hives/${id}`)}
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={updateHive.isPending}>
                  {updateHive.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Spara ändringar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
