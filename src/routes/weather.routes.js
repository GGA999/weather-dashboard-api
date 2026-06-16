import { Router } from "express";
import {
  fetchOpenMeteoForecast,
  searchOpenMeteoLocations,
} from "../services/openMeteo.service.js";
import { normalizeForecastPayload } from "../utils/forecast.js";

const router = Router();

function createBadRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateCoordinate(value, label, min, max) {
  if (value === undefined || value === "") {
    throw createBadRequest(`${label} obbligatoria`);
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw createBadRequest(`${label} deve essere un numero valido`);
  }

  if (numberValue < min || numberValue > max) {
    throw createBadRequest(`${label} fuori intervallo consentito`);
  }

  return numberValue;
}

router.get("/locations", async (req, res, next) => {
  try {
    const query = String(req.query.q ?? "").trim();

    if (query.length < 2) {
      throw createBadRequest("La ricerca richiede almeno 2 caratteri");
    }

    const locations = await searchOpenMeteoLocations(query);

    res.status(200).json({ locations });
  } catch (error) {
    next(error);
  }
});

router.get("/forecast", async (req, res, next) => {
  try {
    const latitude = validateCoordinate(req.query.lat, "Latitudine", -90, 90);
    const longitude = validateCoordinate(req.query.lon, "Longitudine", -180, 180);
    const rawForecast = await fetchOpenMeteoForecast(latitude, longitude);
    const forecastPayload = normalizeForecastPayload(rawForecast, {
      latitude,
      longitude,
    });

    res.status(200).json(forecastPayload);
  } catch (error) {
    next(error);
  }
});

export default router;
