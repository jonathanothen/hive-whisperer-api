

# Enhetskoppling: Skydda mot att se andras enheter

## Problemet
Idag visar "Lägg till bikupa" en dropdown med ALLA okopplade enheter (`claimed_by IS NULL`). Med flera användare innebar det att:
- Användare A ser Användare B:s enheter
- Användare A kan av misstag (eller med flit) koppla Användare B:s enhet

## Losningen
Ta bort dropdown-listan over okopplade enheter. Istallet matar anvandaren alltid in sitt `device_id` manuellt (t.ex. `BeeHivez-2B9568`), som de laser av fran ESP32:ns WiFi-namn (AP) eller captive portal.

Nar anvandaren skriver in device_id validerar vi att enheten:
1. Finns i `devices`-tabellen (dvs har skickat data)
2. Inte redan ar kopplad till nagon annan (`claimed_by IS NULL`)

## Andrade RLS-policyer
Uppdatera `devices`-tabellens SELECT-policy sa att vanliga anvandare bara ser sina egna enheter (inte okopplade). Validering av device_id (finns den? ar den ledig?) gors i backend-funktionen istallet.

## Ny backend-funktion: `validate-device`
En enkel funktion som tar emot ett `device_id` och returnerar:
- `{ valid: true }` om enheten finns och ar okopplad
- `{ valid: false, reason: "not_found" }` om den inte finns
- `{ valid: false, reason: "already_claimed" }` om den redan ar kopplad

## Andringar i detalj

### 1. Ny backend-funktion `validate-device`
- Tar emot `device_id` i request body
- Anvander service role for att kolla `devices`-tabellen
- Returnerar status utan att avsloja vem som ager enheten

### 2. Uppdatera RLS-policy pa `devices`
- Ta bort "Users can view their own or unclaimed devices" SELECT-policy
- Lagg till ny SELECT-policy: "Users can view their own devices" (`claimed_by = auth.uid()`)
- Behall UPDATE-policyn som tillater claiming av okopplade enheter

### 3. Uppdatera `src/pages/NewHive.tsx`
- Ta bort dropdown med okopplade enheter
- Ersatt med ett textfalt dar anvandaren skriver device_id
- Lagg till en "Verifiera"-knapp som anropar `validate-device`
- Visa gron bock om enheten ar giltig och ledig
- Visa felmeddelande om enheten inte finns eller redan ar kopplad

### 4. Uppdatera `src/hooks/useDevices.ts`
- Ta bort `useUnclaimedDevices()` (anvands inte langre)
- Behall `useMyDevices()` for framtida anvandning (t.ex. enhetsoversikt)

### 5. Uppdatera `src/pages/NewHive.tsx` import
- Ta bort import av `useUnclaimedDevices`
- Lagg till anrop till `validate-device` edge function

## Anvandarflode efter andringen

```text
1. Anvandaren startar sin ESP32
2. ESP32 visar WiFi-namn: "BeeHivez-2B9568"
3. Anvandaren oppnar appen -> "Lagg till bikupa"
4. Skriver in "BeeHivez-2B9568" i device_id-faltet
5. Klickar "Verifiera" -> gron bock visas
6. Fyller i namn, bigard etc.
7. Klickar "Skapa" -> enheten kopplas till kontot
```

