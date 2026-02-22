
## dB SPL-graf med konvertering fran MSM261S4030H0R

### Bakgrund

Mikrofonen MSM261S4030H0R har foljande specifikationer:
- Sensitivity: -26 dBFS (typ) vid 94 dB SPL, 1 kHz
- AOP: 120 dB SPL
- Konverteringsformel: `dB SPL = dBFS + 120` (dvs. `94 + (dBFS - (-26))`)

### Andringar

**1. Lagg till `db_spl` i aggregeringen (`src/lib/aggregateSensorData.ts`)**
- Lagg till ett beraknat falt `db_spl` i `AggregatedReading`
- Berakna det fran `dbfs` med formeln: `dbfs + 120` (offset = 94 - (-26) = 120)
- Detta gor att grafen kan anvanda samma SensorChart-komponent

**2. Lagg till dB SPL-graf i AudioAnalysisPanel (`src/components/hive/AudioAnalysisPanel.tsx`)**
- Lagg till ett nytt AudioValueCard for "~dB SPL" som visar det konverterade vardet fran senaste matningen
- Beskrivning: "Uppskattad ljudniva (MSM261S4030H0R, S=-26 dBFS). Kan avvika upp till +-3 dB fran verkligt varde."
- Lagg till en SensorChart for "~dB SPL (uppskattad)" i historik-sektionen
  - Domian: [20, 120]
  - Beskrivning namnder att konverteringen bygger pa databladets typvarde och att RMS vs peak kan ge upp till 3 dB avvikelse

**3. Lagg till dB SPL-graf i HiveDetail huvudvyn (`src/pages/HiveDetail.tsx`)**
- Ersatt den befintliga dBFS-grafen under "Audio detaljer" med en dB SPL-graf, eller lagg till den bredvid
- Behall dBFS-grafen i audio-detaljerna for den som vill se ravarden

### Tekniska detaljer

Konverteringskonstanten definieras som:

```text
MIC_SENSITIVITY_DBFS = -26   // typ fran datablad
REF_SPL = 94                 // dB SPL vid kalibreringsreferens
OFFSET = REF_SPL - MIC_SENSITIVITY_DBFS  // = 120

db_spl = dbfs + OFFSET
```

Aggregeringen beraknar `db_spl` direkt fran det aggregerade `dbfs`-vardet sa att ingen ny databaskolumn behovs.

Alla beskrivningar i UI kommer notera att vardet ar uppskattat och kan avvika upp till 3 dB pa grund av RMS vs peak-skillnader.
