const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 8000;

function createProviderError(message, cause) {
  const error = new Error(message);
  error.status = 502;
  error.cause = cause;
  return error;
}

async function requestJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw createProviderError(
        data?.reason || data?.error || "Open-Meteo non disponibile",
      );
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw createProviderError("Timeout nella risposta di Open-Meteo", error);
    }

    if (error.status) {
      throw error;
    }

    throw createProviderError("Open-Meteo non raggiungibile", error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchOpenMeteoLocations(query) {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name: query,
    count: "5",
    language: "it",
    format: "json",
  }).toString();

  const data = await requestJson(url);

  return (data.results ?? []).map((location) => ({
    id: location.id ?? `${location.latitude}:${location.longitude}`,
    name: location.name,
    state: location.admin1 ?? null,
    country: location.country,
    countryCode: location.country_code,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
  }));
}

export async function fetchOpenMeteoForecast(latitude, longitude) {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max",
    timezone: "auto",
    forecast_days: "5",
    wind_speed_unit: "kmh",
  }).toString();

  return requestJson(url);
}
