import { Router } from "express";
// import servizi aggiornati
import { searchLocations, getForecast } from "../services/openMeteo.service.js";
// import utility di normalizzazione input
import { normalizeForecastData } from "../utils/forecast.js";

const router = Router();

// rotta 1 - ricerca località
router.get("/locations", async (req, res, next) => {
  try {
    // leggere req.query.q, convertire a stringa e pulire gli spazi [cite: 152-153]
    const q = String(req.query.q || "").trim();

    // rifiuto input inferiori a due caratteri con HTTP 400 [cite: 153]
    if (q.length < 2) {
      return res.status(400).json({ 
        error: "Il parametro di ricerca 'q' deve contenere almeno 2 caratteri." 
      });
    }

    // chiamare il servizio [cite: 153]
    const locations = await searchLocations(q);

    // restituire { locations: [...] } 
    res.status(200).json({ locations });
    
  } catch (error) {
    // passo gli errori al middleware centralizzato 
    next(error);
  }
});

// rotta 2 - previsioni meteo
router.get("/forecast", async (req, res, next) => {
  try {
    // converto lat e lon in numeri
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    //rifiuto Nan e valori fuori dai limiti geografici
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        error: "Il parametro 'lat' deve essere un numero compreso tra -90 e 90."
      });
    }

    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: "Il parametro 'lon' deve essere un numero compreso tra -180 e 180."
      });
    }

    // riceve coordinate valide per chiamata servizio
    const rawData = await getForecast(lat, lon);

    // passa il JSON grezzo alla funzione di normalizzazione per restituire un oggetto più semplice e leggibile
    const forecast = normalizeForecastData(rawData);

    // restituisce il risultato al client
    res.status(200).json({ forecast });

  } catch (error) {
    next(error);
  }
});

export default router;