import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface CalibrationPanelProps {
  deviceId: string;
}

export default function CalibrationPanel({ deviceId }: CalibrationPanelProps) {
  const { user } = useAuth();
  const [knownWeight, setKnownWeight] = useState('');
  const [tareing, setTareing] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  const sendCommand = async (cmd: string, extraFields: Record<string, unknown> = {}) => {
    if (!user) return;

    const { error } = await supabase.from('device_commands').insert({
      device_id: deviceId,
      cmd,
      user_id: user.id,
      ...extraFields,
    });

    if (error) throw error;
  };

  const handleTare = async () => {
    setTareing(true);
    try {
      await sendCommand('tare');
      toast.success('Tare-kommando skickat', {
        description: 'Enheten nollställer vågen vid nästa polling.',
      });
    } catch (err: any) {
      toast.error('Kunde inte skicka kommando', { description: err.message });
    } finally {
      setTareing(false);
    }
  };

  const handleCalibrate = async () => {
    const weight = parseFloat(knownWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Ange en giltig vikt i kg');
      return;
    }
    setCalibrating(true);
    try {
      await sendCommand('calibrate', { known_weight_kg: weight });
      toast.success('Kalibreringskommando skickat', {
        description: `Enheten kalibrerar med ${weight} kg vid nästa polling.`,
      });
      setKnownWeight('');
    } catch (err: any) {
      toast.error('Kunde inte skicka kommando', { description: err.message });
    } finally {
      setCalibrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Våg-kalibrering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Skicka kalibreringskommandon till enheten. Enheten hämtar kommandot vid nästa polling (~5 s).
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleTare}
            disabled={tareing}
            className="gap-2"
          >
            {tareing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Tare (nollställ)
          </Button>

          <div className="flex gap-2 flex-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="Känd vikt (kg)"
              value={knownWeight}
              onChange={(e) => setKnownWeight(e.target.value)}
              className="max-w-[160px]"
            />
            <Button
              variant="outline"
              onClick={handleCalibrate}
              disabled={calibrating || !knownWeight}
              className="gap-2"
            >
              {calibrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
              Kalibrera
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
