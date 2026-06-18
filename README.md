# Weather Dashboard API

Si tratta di un'applicazione RESTful API sviluppata con Node.js ed Express, progettata per integrarsi con provider meteo esterni, normalizzare i dati e servirli in modo efficiente al frontend.

---

## Caratteristiche Principali
* **Geocoding & Autocomplete**: Endpoint dedicato alla ricerca e normalizzazione delle località globali.
* **Previsioni a 5 Giorni**: Aggregazione dei dati meteo correnti e delle previsioni giornaliere basate su coordinate geografiche.
* **Middleware Centralizzato**: Gestione standardizzata degli errori con mascheramento dello stack trace in ambiente di produzione.
* **Disaccoppiamento Totale**: Architettura nativamente predisposta per la comunicazione cross-origin con il frontend React/Vite.

---

## Tecnologie Utilizzate
* **Runtime**: Node.js
* **Framework**: Express.js
* **Architettura**: REST API

---

## Documentazione Endpoint (Contratto API)

### Health Check
* **`GET /api/health`**
  * **Descrizione**: Verifica lo stato di salute e la stabilità del server.
  * **Input**: Nessuno
  * **Output (200 OK)**: `{"status": "UP", "timestamp": "..."}`
  * **Codici Errore**: `500 Internal Server Error` (solo in caso di anomalie critiche di sistema).

### Ricerca Località
* **`GET /api/weather/locations`**
  * **Descrizione**: Cerca ed elenca i luoghi geografici corrispondenti alla query specificata.
  * **Parametri Query**: `q` (stringa, minimo 2 caratteri).
  * **Output (200 OK)**: `{"locations": [ { "id": 123, "name": "Roma", "latitude": 41.89, "longitude": 12.51 }, ... ]}`
  * **Codici Errore**: 
    * `400 Bad Request` (input non valido o inferiore alla lunghezza minima).
    * `502 Bad Gateway` (errore di comunicazione con il provider meteo esterno).

### Previsioni Meteo
* **`GET /api/weather/forecast`**
  * **Descrizione**: Recupera le condizioni meteo attuali e le previsioni per i successivi 5 giorni relative a una specifica coordinata.
  * **Parametri Query**: `lat` (numerico), `lon` (numerico).
  * **Output (200 OK)**: Dettaglio della località combinato con l'array dei 5 giorni di previsione.
  * **Codici Errore**:
    * `400 Bad Request` (latitudine o longitudine mancanti o in formato non numerico).
    * `502 Bad Gateway` (errore di risposta del provider meteo terzo).

---

## Gestione Globale degli Errori

Il server implementa una strategia difensiva standardizzata per tutte le rotte:

| Scenario | Payload di Risposta | Comportamento / HTTP Status |
| :--- | :--- | :--- |
| **Rotta Inesistente** | `{"error": "Endpoint non trovato"}` | **404 Not Found** (Intercettato automaticamente dal middleware di fallback) |
| **Errore di Sistema / Imprevisto** | `{"error": "Messaggio di errore descrittivo"}` | **500/502** (Gestito dal middleware centralizzato. Lo stack trace viene mostrato esclusivamente in modalità sviluppo) |

---

## Configurazione e Installazione Locale

### Prerequisiti
* Node.js (versione v18 o superiore consigliata)
* Gestore di pacchetti npm o yarn

### Configurazione del Progetto
1. Clonare la repository:
```bash
   git clone <url-del-tuo-repo-backend>
   cd weather-dashboard-api
