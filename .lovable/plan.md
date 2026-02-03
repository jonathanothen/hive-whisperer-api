

# BeeHivez - Bikupsövervakningsplattform

## Projektöversikt
En professionell övervakningsplattform för biodlare som vill övervaka sina bikupor i realtid. Appen tar emot data från ESP32-enheter (via en central server) och visar temperatur, luftfuktighet, vikt och ljudnivå med smart svärmdetektering.

---

## Kärnfunktioner

### 1. Autentisering & Användarkonton
- Registrering och inloggning för biodlare
- Varje användare ser endast sina egna bikupor
- Säker åtkomst från vilken enhet som helst

### 2. Dashboard - Översikt
- **Huvudvy** med alla bikupor i kortformat
- Snabb statusöversikt: aktiva varningar, senaste mätvärden
- Visuell indikator för kupor med problem (röd/orange/grön)
- Sökfunktion och filtrering

### 3. Bikupshantering
- Lägg till, redigera och ta bort bikupor
- Namnge kupor och gruppera efter bigård/plats
- Koppla ESP32-enhet till bikupa med unik identifierare
- Anteckningar och metadata per kupa

### 4. Realtidsgrafer (som i din HTML-fil)
- **Miljögrupp:** Temperatur (°C), Luftfuktighet (%)
- **Kupagrupp:** Vikt (kg), Ljud RMS, Svärm-score
- Dubbla Y-axlar (vänster/höger) per graf
- Toggle för att visa/dölja dataserier
- Tidsaxel med relativ tid (sekunder bakåt)

### 5. Historisk Data & Analys
- Spara all sensordata i databasen
- Visa historik per dag, vecka, månad
- Jämför perioder för att se trender
- Exportera data (CSV)

### 6. Alert & Notifieringar
- **Svärmvarning:** Automatisk detektion baserat på ljud-score
- Två nivåer: varning (warn) och larm (alarm)
- Alert-historik med tidsstämplar
- **SMS-notifieringar** vid kritiska varningar (via extern SMS-tjänst som Twilio)

### 7. Serverbaserad Datainsamling
- Edge Function som tar emot data från ESP32-enheter
- Lagrar data i Supabase-databasen
- Realtidsuppdateringar till webbappen via Supabase Realtime

---

## Design
- **Professionell dashboard-stil** med mörkt tema som alternativ
- Tydliga grafer och siffror
- Responsiv design för mobil och desktop
- Statusfärger: grön (OK), orange (varning), röd (larm)

---

## Teknisk Arkitektur
- **Frontend:** React med TypeScript, Recharts för grafer
- **Backend:** Supabase (autentisering, databas, edge functions)
- **Realtid:** Supabase Realtime för live-uppdateringar
- **SMS:** Edge function som anropar SMS-tjänst (t.ex. Twilio)

---

## Dataflöde
```
ESP32 → Edge Function (HTTP POST) → Supabase Database → Realtime → Webb-app
```

---

## Första Implementation
Vi börjar med:
1. Grundläggande autentisering (login/registrering)
2. Dashboard med bikupor
3. Lägga till/hantera kupor
4. Edge function för att ta emot sensordata
5. Realtidsgrafer med live-data
6. Alert-system med svärmvarning

SMS-notifieringar läggs till som en utökning efter grundfunktionaliteten är på plats.

