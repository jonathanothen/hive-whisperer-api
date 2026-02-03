import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useCreateHive, useApiaries, useCreateApiary } from '@/hooks/useHives';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function NewHive() {
  const navigate = useNavigate();
  const { data: apiaries } = useApiaries();
  const createHive = useCreateHive();
  const createApiary = useCreateApiary();

  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [apiaryId, setApiaryId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [newApiaryName, setNewApiaryName] = useState('');
  const [newApiaryLocation, setNewApiaryLocation] = useState('');
  const [apiaryDialogOpen, setApiaryDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hive = await createHive.mutateAsync({
      name,
      device_id: deviceId || undefined,
      apiary_id: apiaryId || undefined,
      notes: notes || undefined,
    });

    if (hive) {
      navigate('/dashboard');
    }
  };

  const handleCreateApiary = async (e: React.FormEvent) => {
    e.preventDefault();

    const apiary = await createApiary.mutateAsync({
      name: newApiaryName,
      location: newApiaryLocation || undefined,
    });

    if (apiary) {
      setApiaryId(apiary.id);
      setNewApiaryName('');
      setNewApiaryLocation('');
      setApiaryDialogOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Lägg till ny bikupa</CardTitle>
            <CardDescription>
              Skapa en ny bikupa och koppla den till en ESP32-enhet
            </CardDescription>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="apiary">Bigård</Label>
                  <Dialog open={apiaryDialogOpen} onOpenChange={setApiaryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" type="button">
                        <Plus className="h-4 w-4 mr-1" />
                        Ny bigård
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Skapa ny bigård</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateApiary} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiary-name">Namn *</Label>
                          <Input
                            id="apiary-name"
                            placeholder="T.ex. Hemma"
                            value={newApiaryName}
                            onChange={(e) => setNewApiaryName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiary-location">Plats</Label>
                          <Input
                            id="apiary-location"
                            placeholder="T.ex. Trädgården"
                            value={newApiaryLocation}
                            onChange={(e) => setNewApiaryLocation(e.target.value)}
                          />
                        </div>
                        <Button type="submit" disabled={createApiary.isPending}>
                          {createApiary.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          )}
                          Skapa bigård
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={apiaryId} onValueChange={setApiaryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj bigård (valfritt)" />
                  </SelectTrigger>
                  <SelectContent>
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
                  onClick={() => navigate('/dashboard')}
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={createHive.isPending}>
                  {createHive.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Skapa bikupa
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
