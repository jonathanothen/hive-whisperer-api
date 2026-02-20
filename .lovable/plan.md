

# Deeplink-baserad enhetskoppling fran ESP32 Captive Portal

## Oversikt
Gor det mojligt for ESP32:ns captive portal att skicka anvandaren direkt till appen med `device_id` ifyllt, sa att manuell inmatning inte behovs. Anvandaren klickar en lank i portalen, appen oppnas med device_id redan pa plats.

## Hur det fungerar

```text
1. Anvandaren ansluter till ESP32:ns WiFi (BeeHivez-2B9568)
2. Captive portalen oppnas
3. Anvandaren konfigurerar WiFi-uppgifter
4. Portalen visar en knapp: "Koppla enhet i appen"
5. Knappen oppnar: https://din-app.lovable.app/claim?device_id=BeeHivez-2B9568
6. Anvandaren byter tillbaka till sitt vanliga WiFi
7. Appen laddas med device_id ifyllt och redo att verifiera
```

## Andringar

### 1. Ny route: `/claim`
Skapa en ny sida `src/pages/ClaimDevice.tsx` som:
- Laser `device_id` fran URL:ens query-parameter (`?device_id=BeeHivez-2B9568`)
- Om anvandaren ar inloggad: visar "Lagg till bikupa"-formularet med device_id forifylt
- Om anvandaren INTE ar inloggad: sparar device_id i `localStorage` och skickar till `/auth`. Efter inloggning redirectas tillbaka till `/claim` med device_id fran storage.

### 2. Uppdatera `src/App.tsx`
- Lagg till route `/claim` som pekar pa `ClaimDevice`
- Routen ska vara skyddad (krava inloggning)

### 3. Uppdatera `src/pages/NewHive.tsx`
- Las av `device_id` fran URL query-parameter (for att stodja redirect fran ClaimDevice)
- Om device_id finns i URL: for-ifyll faltet och kor validering automatiskt

### 4. Alternativt: Enklare variant (rekommenderas)
Istallet for en separat ClaimDevice-sida kan vi gora det annu enklare:
- Lagg till stodd for query-parameter direkt i NewHive: `/dashboard/hives/new?device_id=BeeHivez-2B9568`
- Om `device_id` finns i URL:en, for-ifyll faltet och validera automatiskt
- Om anvandaren inte ar inloggad fanger ProtectedRoute upp det och redirectar till `/auth`
- Efter inloggning redirectas tillbaka (vi sparar intended URL)

**Jag rekommenderar den enklare varianten (4)** da den kraver minimala andringar.

## Teknisk plan (enklare varianten)

### Steg 1: Uppdatera NewHive.tsx
- Anvand `useSearchParams()` for att lasa `device_id` fran URL
- I en `useEffect`: om device_id finns, satt det i state och kor `handleValidateDevice` automatiskt
- Resten av formularet fungerar som vanligt

### Steg 2: Spara intended redirect i Auth
- Nar ProtectedRoute redirectar till `/auth`, inkludera `redirect`-parameter sa anvandaren kommer tillbaka till ratt sida efter inloggning
- Uppdatera Auth-sidan att lasa `redirect`-parametern och navigera dit efter lyckad inloggning

### Steg 3: ESP32-sidan (din kod)
- I captive portalens HTML, lagg till en knapp/lank:
  `<a href="https://din-app-url/dashboard/hives/new?device_id=BeeHivez-2B9568">Koppla i appen</a>`
- Denna URL byggs dynamiskt med enhetens `device_id`

## Vad som andras i Lovable

| Fil | Andring |
|-----|---------|
| `src/pages/NewHive.tsx` | Las device_id fran URL, auto-validera |
| `src/App.tsx` | Uppdatera ProtectedRoute att skicka med redirect-URL |
| `src/pages/Auth.tsx` | Hantera redirect efter inloggning |

## Forberedelse for native app (senare)
Nar appen byggs med Capacitor kan vi:
- Registrera en custom URL scheme (t.ex. `beehivez://claim?device_id=XXX`)
- ESP32 portalens lank anpassas baserat pa plattform
- Lagga till WiFi SSID-detection for helt automatisk koppling

