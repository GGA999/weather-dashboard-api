# Weather Dashboard API

Questo è il backend per la dashboard meteo, costruito con Node.js ed Express.

## Documentazione API (Contratto)

| Endpoint | Input | Output | Errori principali / Comportamento |
| :--- | :--- | :--- | :--- |
| **`GET /api/health`** | Nessuno | Stato del servizio | 500 solo in caso anomalo |
| **`GET /api/weather/locations`** | `q`, almeno 2 caratteri | Elenco di luoghi normalizzati | 400 input, 502 provider |
| **`GET /api/weather/forecast`** | `lat` e `lon` numerici | Location + 5 giorni | 400 input, 502 provider |
| **`Qualsiasi URL errato`** | Nessuno | `{"error": "Endpoint non trovato"}` | **404 Not Found** (Gestione automatica) |
| **`Errore Imprevisto`** | - | `{"error": "Messaggio di errore"}` | **500/502** (Middleware centralizzato, nasconde lo stack trace in produzione) |