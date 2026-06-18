// URL base per le due API di Open-Meteo
const GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_FORECAST_ATTEMPTS = 3;
const FORECAST_CACHE_TTL_MS = 10 * 60 * 1000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const forecastCache = new Map();

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const getRetryDelay = (response, attempt) => {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = Number(retryAfter);

  if (Number.isFinite(retryAfterSeconds)) {
    return Math.min(retryAfterSeconds * 1000, 5000);
  }

  return 500 * 2 ** attempt;
};

const readProviderError = async (response) => {
  try {
    const data = await response.json();
    return data.reason || data.error || "";
  } catch {
    return "";
  }
};

const fetchForecastData = async (url) => {
  let lastError;

  for (let attempt = 0; attempt < MAX_FORECAST_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "weather-stagisti/1.0",
        },
      });

      if (response.ok) {
        return await response.json();
      }

      const detail = await readProviderError(response);
      lastError = new Error(
        `Errore dal provider Open-Meteo (Forecast): ${response.status}${
          detail ? ` - ${detail}` : ""
        }`,
      );

      if (
        !RETRYABLE_STATUS_CODES.has(response.status) ||
        attempt === MAX_FORECAST_ATTEMPTS - 1
      ) {
        throw lastError;
      }

      await wait(getRetryDelay(response, attempt));
    } catch (error) {
      if (error === lastError) {
        throw error;
      }

      lastError = new Error(
        `Errore dal provider Open-Meteo (Forecast): ${
          error.name === "AbortError" ? "timeout" : error.message
        }`,
      );

      if (attempt === MAX_FORECAST_ATTEMPTS - 1) {
        throw lastError;
      }

      await wait(500 * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
};

// funzione riceca luoghi
export const searchLocations = async (query) => {
  const params = new URLSearchParams({
    name: query,
    count: 5,
    language: "it",
    format: "json",
  });

  const response = await fetch(`${GEOCODING_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Errore dal provider Open-Meteo (Geocoding): ${response.status}`);
  }

  const data = await response.json();

  if (!data.results) {
    return [];
  }

  return data.results.map((loc) => ({
    id: loc.id,
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    country: loc.country,
    countryCode: loc.country_code || loc.countryCode || "",
    state: loc.admin1 || loc.admin2 || null,
    timezone: loc.timezone,
  }));
};

// funzione 2 previsione 5 gg
export const getForecast = async (lat, lon) => {
  const cacheKey = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  const cachedForecast = forecastCache.get(cacheKey);

  if (
    cachedForecast &&
    Date.now() - cachedForecast.createdAt < FORECAST_CACHE_TTL_MS
  ) {
    return cachedForecast.data;
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m,surface_pressure,is_day",
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,is_day",
    timezone: "auto",
    forecast_days: "5",
    past_days: "0",
  });

  const data = await fetchForecastData(
    `${FORECAST_API_URL}?${params.toString()}`,
  );

  forecastCache.set(cacheKey, {
    createdAt: Date.now(),
    data,
  });

  return data;
};
