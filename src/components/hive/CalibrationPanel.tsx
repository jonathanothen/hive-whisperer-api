import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Scale, Loader2, RotateCcw, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CalibrationPanelProps {
  deviceId: string;
}

export default function CalibrationPanel({ deviceId }: CalibrationPanelProps) {
  const { user } = useAuth();
  const [knownWeight, setKnownWeight] = useState('');
  const [loading, setLoading] = useState(false);

  // Calibration wizard
  const [calOpen, setCalOpen] = useState(false);
  const [calStep, setCalStep] = useState(1);

  // Standalone tare dialog
  const [tareOpen, setTareOpen] = useState(false);
  const [tareStep, setTareStep] = useState(1);

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

  const openCalibration = () => {
    setCalStep(1);
    setKnownWeight('');
    setCalOpen(true);
  };

  const openTare = () => {
    setTareStep(1);
    setTareOpen(true);
  };

  const handleCalibrate = async () => {
    const weight = parseFloat(knownWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Ange en giltig vikt i kg');
      return;
    }
    setLoading(true);
    try {
      await sendCommand('calibrate', { known_weight_kg: weight });
      setCalStep(3);
    } catch (err: any) {
      toast.error('Kunde inte skicka kommando', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTare = async (fromCalWizard: boolean) => {
    setLoading(true);
    try {
      await sendCommand('tare');
      if (fromCalWizard) {
        setCalStep(5);
      } else {
        setTareStep(2);
      }
    } catch (err: any) {
      toast.error('Kunde inte skicka kommando', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Våg-kalibrering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Kalibrera vågen med en känd vikt, eller nollställ om du vill mäta enbart honungsvikt.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={openCalibration} className="gap-2">
              <Scale className="h-4 w-4" />
              Kalibrera våg
            </Button>
            <Button variant="outline" onClick={openTare} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Nollställ (tare)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Calibration Wizard ── */}
      <Dialog open={calOpen} onOpenChange={setCalOpen}>
        <DialogContent className="sm:max-w-md">
          {calStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>Steg 1 — Tom våg</DialogTitle>
                <DialogDescription>
                  Ta bort allt från vågen. Den ska vara helt tom.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setCalStep(2)} className="gap-2">
                  Vågen är tom <ChevronRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}

          {calStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Steg 2 — Placera känd vikt</DialogTitle>
                <DialogDescription>
                  Placera en känd vikt på vågen och ange vikten nedan.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Vikt i kg"
                  value={knownWeight}
                  onChange={(e) => setKnownWeight(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCalibrate}
                  disabled={loading || !knownWeight}
                  className="gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
                  Vikten är på plats — kalibrera
                </Button>
              </DialogFooter>
            </>
          )}

          {calStep === 3 && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-status-ok" />
                  Kalibrering skickad!
                </DialogTitle>
                <DialogDescription>
                  Enheten justerar vid nästa polling (~5 s). Vill du också nollställa vågen? Det är vanligt om du vill mäta enbart honungsvikt.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button onClick={() => setCalStep(4)} className="gap-2">
                  Ja, nollställ nu
                </Button>
                <Button variant="outline" onClick={() => setCalOpen(false)}>
                  Nej, jag vill mäta totalvikt
                </Button>
              </DialogFooter>
            </>
          )}

          {calStep === 4 && (
            <>
              <DialogHeader>
                <DialogTitle>Steg 4 — Ladda vågen</DialogTitle>
                <DialogDescription>
                  Ställ kupan med allt material (utan honung) på vågen. Allt som ligger på vågen nu kommer räknas som noll.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => handleTare(true)}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Allt är på plats — nollställ
                </Button>
              </DialogFooter>
            </>
          )}

          {calStep === 5 && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-status-ok" />
                  Nollställning skickad!
                </DialogTitle>
                <DialogDescription>
                  Från och med nu visar vågen enbart tillagd vikt (t.ex. honung).
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setCalOpen(false)}>Klar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Standalone Tare Dialog ── */}
      <Dialog open={tareOpen} onOpenChange={setTareOpen}>
        <DialogContent className="sm:max-w-md">
          {tareStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>Nollställ vågen</DialogTitle>
                <DialogDescription>
                  Ställ kupan med allt material (utan honung) på vågen. Allt som ligger på vågen nu kommer räknas som noll.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => handleTare(false)}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Vågen är lastad — nollställ
                </Button>
              </DialogFooter>
            </>
          )}

          {tareStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-status-ok" />
                  Nollställning skickad!
                </DialogTitle>
                <DialogDescription>
                  Enheten nollställer vid nästa polling (~5 s).
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setTareOpen(false)}>Klar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
