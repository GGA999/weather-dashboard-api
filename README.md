# weather stagisti API

Backend Express per la dashboard meteo. Espone health check, ricerca luoghi e previsione a 5 giorni usando Open-Meteo.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Variabili

```bash
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Endpoint

- `GET /api/health`
- `GET /api/weather/locations?q=Roma`
- `GET /api/weather/forecast?lat=41.89&lon=12.51`

`locations` restituisce `{ locations: [...] }`. `forecast` restituisce `{ location, current, hourly, forecast }`, con `forecast` composto da 5 giorni normalizzati.

## Test manuale

```bash
curl http://localhost:8080/api/health
curl "http://localhost:8080/api/weather/locations?q=Roma"
curl "http://localhost:8080/api/weather/forecast?lat=41.89&lon=12.51"
```
