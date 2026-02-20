import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, CheckCircle2, XCircle, Search } from 'lucide-react';
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
  const { user } = useAuth();
  const createHive = useCreateHive();
  const createApiary = useCreateApiary();

  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [apiaryId, setApiaryId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [searchParams] = useSearchParams();

  const [deviceValid, setDeviceValid] = useState<boolean | null>(null);
  const [deviceError, setDeviceError] = useState('');
  const [validating, setValidating] = useState(false);

  const [newApiaryName, setNewApiaryName] = useState('');
  const [newApiaryLocation, setNewApiaryLocation] = useState('');
  const [apiaryDialogOpen, setApiaryDialogOpen] = useState(false);

  const handleValidateDevice = useCallback(async (id?: string) => {
    const trimmed = (id ?? deviceId).trim();
    if (!trimmed) return;

    setValidating(true);
    setDeviceValid(null);
    setDeviceError('');

    try {
      const { data, error } = await supabase.functions.invoke('validate-device', {
        body: { device_id: trimmed },
      });

      if (error) throw error;

      if (data.valid) {
        setDeviceValid(true);
      } else {
        setDeviceValid(false);
        setDeviceError(
          data.reason === 'not_found'
            ? 'Enheten hittades inte. Kontrollera att din ESP32 har skickat data.'
            : 'Enheten är redan kopplad till ett annat konto.'
        );
      }
    } catch {
      setDeviceValid(false);
      setDeviceError('Kunde inte verifiera enheten. Försök igen.');
    } finally {
      setValidating(false);
    }
  }, [deviceId]);

  // Auto-fill device_id from URL query parameter (deeplink from ESP32 captive portal)
  useEffect(() => {
    const urlDeviceId = searchParams.get('device_id');
    if (urlDeviceId && !deviceId) {
      setDeviceId(urlDeviceId);
      handleValidateDevice(urlDeviceId);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Claim the device if one was verified
    if (deviceId.trim() && user) {
      await supabase
        .from('devices')
        .update({ claimed_by: user.id })
        .eq('device_id', deviceId.trim());
    }

    const hive = await createHive.mutateAsync({
      name,
      device_id: deviceId.trim() || undefined,
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
                <div className="flex gap-2">
                  <Input
                    id="device-id"
                    placeholder="T.ex. BeeHivez-2B9568"
                    value={deviceId}
                    onChange={(e) => {
                      setDeviceId(e.target.value);
                      setDeviceValid(null);
                      setDeviceError('');
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleValidateDevice()}
                    disabled={!deviceId.trim() || validating}
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Verifiera
                  </Button>
                </div>
                {deviceValid === true && (
                  <p className="text-sm text-primary flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Enheten är tillgänglig!
                  </p>
                )}
                {deviceValid === false && deviceError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    {deviceError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Ange enhets-ID:t som visas som WiFi-namn på din ESP32 (t.ex. BeeHivez-2B9568)
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
                <Button type="submit" disabled={createHive.isPending || (!!deviceId.trim() && !deviceValid)}>
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
