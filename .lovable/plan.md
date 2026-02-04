
# Robust anslutningsövervakning för ESP32

## Nuläge

Din ESP32 visas som **offline** eftersom den senaste mätningen kom in för över 10 timmar sedan (2026-02-03 20:57:37). Nuvarande logik:
- **Online**: Data inom 5 minuter
- **Instabil**: Data inom 30 minuter  
- **Offline**: Ingen data på 30+ minuter

## Föreslagna förbättringar

### 1. Lägg till ett separat "heartbeat"-system

Skapa en ny endpoint där ESP32:an kan skicka ett kort "ping" var 30:e sekund, separat från sensordata. Detta låter oss skilja på:
- ESP32 som är **uppkopplad men inte skickar data** (heartbeat fungerar)
- ESP32 som är **helt nere** (ingen heartbeat)

### 2. Spara "last_seen" på bikupan

Lägg till ett `last_seen`-fält i `hives`-tabellen som uppdateras varje gång vi får antingen sensordata eller heartbeat. Detta ger en mer exakt bild av enhetens status.

### 3. Förbättra UI-feedback

- Visa tydligare information om senaste kontakt
- Lägg till en "pinga enhet"-knapp (om du vill testa anslutningen manuellt)
- Visa skillnad mellan "ingen data" och "ingen kontakt"

## Tekniska ändringar

### Databasändringar
Lägg till kolumn i `hives`-tabellen:
```text
hives.last_seen (timestamp with time zone)
```

### Ny backend-funktion
Skapa `device-heartbeat` edge function som:
- Tar emot `device_id`
- Uppdaterar `last_seen` på motsvarande bikupa
- Returnerar bekräftelse till ESP32

### Uppdatera befintlig ingest-funktion
Uppdatera `ingest-sensor-data` för att också uppdatera `last_seen` när sensordata tas emot.

### Frontendändringar
- Uppdatera `sensorStatus.ts` för att använda `last_seen` istället för senaste mätning
- Uppdatera typdefinitioner
- Förbättra statusvisningen med mer detaljerad information

## ESP32-ändringar (din del)

Du behöver lägga till ett heartbeat-anrop i din ESP32-kod som skickar en HTTP POST till heartbeat-endpointen var 30:e sekund:

```text
POST /functions/v1/device-heartbeat
{"device_id": "ESP32_KUPA1"}
```

Detta kan köras på en separat timer från sensordata-sändningen.
