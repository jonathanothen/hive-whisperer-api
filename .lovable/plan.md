

# Kalibreringsguide - Ny wizard med battre flode

## Oversikt
Bygger om CalibrationPanel till en tydlig wizard-dialog dar kalibrering ar huvudsteget och tare ar valfritt efterat. Logiken: man maste alltid kalibrera (satta skalfaktor), men tare (nollstallning) ar valfritt beroende pa om man vill mata totalvikt eller nettovikt.

## Nytt flode

### Huvudpanel
Kortet visar tva knappar:
- **"Kalibrera vag"** (primar) — oppnar kalibreringsguiden
- **"Nollstall (tare)"** (sekundar) — oppnar en enklare tare-dialog

### Kalibreringsguide (Dialog med steg)

**Steg 1 — Tom vag**
- Text: "Ta bort allt fran vagen. Den ska vara helt tom."
- Knapp: "Vagen ar tom — nasta steg"

**Steg 2 — Placera kand vikt**
- Text: "Placera en kand vikt pa vagen."
- Input-falt for vikt i kg
- Knapp: "Vikten ar pa plats — kalibrera"
- Skickar `sendCommand('calibrate', { known_weight_kg })`

**Steg 3 — Klart + valfri tare**
- Text: "Kalibrering skickad! Enheten justerar vid nasta polling (~5 s)."
- Fraga: "Vill du ocksa nollstalla vagen? Det ar vanligt om du vill mata enbart honungsvikt."
- Tva knappar:
  - "Ja, nollstall nu" — oppnar tare-stegen direkt
  - "Nej, jag vill mata totalvikt" — stanger dialogen

**Steg 4 (om tare valdes) — Ladda vagen**
- Text: "Stall kupan med allt material (utan honung) pa vagen. Allt som ligger pa vagen nu kommer raknas som noll."
- Knapp: "Allt ar pa plats — nollstall"
- Skickar `sendCommand('tare')`

**Steg 5 — Tare klar**
- Text: "Nollstallning skickad! Fran och med nu visar vagen enbart tillagd vikt (t.ex. honung)."
- Knapp: "Klar" — stanger dialogen

### Separat Tare-dialog (for aterkommande nollstallning)
For nar vagen redan ar kalibrerad men man vill nollstalla igen:

**Steg 1**
- Text: "Stall kupan med allt material (utan honung) pa vagen."
- Knapp: "Vagen ar lastad — nollstall"
- Skickar `sendCommand('tare')`

**Steg 2**
- Text: "Nollstallning skickad! Enheten nollstaller vid nasta polling."
- Knapp: "Klar"

## Tekniska detaljer

### Fil som andras
- `src/components/hive/CalibrationPanel.tsx` — Byggs om helt med:
  - Tva `Dialog`-komponenter (en for kalibrering, en for fristan tare)
  - `step`-state (number) for varje dialog
  - Samma `sendCommand`-logik som idag (inga backend-andringar)
  - Ikoner: `Scale`, `RotateCcw`, `ChevronRight`, `Check`, `Loader2` fran lucide-react
  - Anvander befintliga UI-komponenter: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button`, `Input`

### Inga databas- eller backend-andringar
Kommandona `tare` och `calibrate` fungerar redan. Bara UI-flödet ändras.

