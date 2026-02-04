

# Förbättrad datauppdatering när appen återaktiveras

## Problem

Data som kommer in medan appen är i bakgrunden/idle visas inte förrän man laddar om sidan. Realtime-prenumerationer tappar ofta anslutningen när webbläsarfliken är inaktiv.

## Lösning

Implementera "visibility change" och "focus" event-lyssnare som automatiskt hämtar ny data när användaren återvänder till appen.

## Tekniska ändringar

### 1. Uppdatera useSensorReadings hook

Lägg till en effekt som lyssnar på `visibilitychange` och `focus` events:
- När sidan blir synlig igen, invalidera query cache för att trigga ny datahämtning
- Behåll realtime som komplement för när appen är aktiv

```text
src/hooks/useSensorReadings.ts:
- Lägg till visibilitychange event listener
- Invalidera queries när document.visibilityState === 'visible'
- Lägg till window focus event listener som backup
```

### 2. Uppdatera SensorTerminal

Samma princip - ladda om historisk data när sidan blir synlig:

```text
src/components/hive/SensorTerminal.tsx:
- Lägg till visibilitychange event listener
- Anropa loadHistoricalData() när sidan återaktiveras
- Detta fyller i luckan mellan senaste HIST och nu
```

### 3. Uppdatera useHive hook

Lägg till samma visibility-logik för att uppdatera hive-status och senaste mätvärden:

```text
src/hooks/useHives.ts:
- Lägg till refetchOnWindowFocus: true i useQuery options
- Detta är inbyggt i TanStack Query men kan behöva aktiveras explicit
```

## Resultat

- Terminalen och graferna uppdateras automatiskt när du växlar tillbaka till fliken
- Ingen manuell refresh behövs
- Realtime fungerar fortfarande för live-uppdateringar när appen är aktiv
- Inga missade datapunkter längre

