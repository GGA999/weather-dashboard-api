import test from "node:test";
import assert from "node:assert/strict";
import { normalizeForecastData } from "../src/utils/forecast.js";

const rawForecast = {
  current: {
    time: "2026-06-18T14:15",
    temperature_2m: 27.2,
    apparent_temperature: 28.1,
    relative_humidity_2m: 51,
    weather_code: 1,
    wind_speed_10m: 12.4,
    surface_pressure: 1008.7,
    is_day: 1,
  },
  hourly: {
    time: [
      "2026-06-18T13:00",
      "2026-06-18T14:00",
      "2026-06-18T15:00",
    ],
    temperature_2m: [26, 27, 28],
    apparent_temperature: [26.4, 28.1, 29],
    precipitation_probability: [5, 10, 15],
    weather_code: [0, 1, 2],
    wind_speed_10m: [10, 12.4, 13],
    relative_humidity_2m: [54, 51, 49],
    surface_pressure: [1009, 1008.7, 1008],
    is_day: [1, 1, 0],
  },
  daily: {
    time: [
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
      "2026-06-22",
    ],
    weather_code: [1, 2, 61, 80, 3],
    temperature_2m_min: [18, 19, 17, 16, 18],
    temperature_2m_max: [29, 30, 25, 24, 27],
    precipitation_probability_max: [10, 20, 70, 80, 30],
    wind_speed_10m_max: [14, 15, 20, 22, 13],
  },
};

test("normalizza il payload secondo il contratto del frontend", () => {
  const result = normalizeForecastData(rawForecast);

  assert.equal(result.forecast.length, 5);
  assert.deepEqual(result.current, {
    time: "2026-06-18T14:15",
    temperature: 27.2,
    apparentTemperature: 28.1,
    humidity: 51,
    pressure: 1008.7,
    windSpeed: 12.4,
    weatherCode: 1,
    description: "Prevalentemente sereno",
    isDay: true,
  });
  assert.equal(result.hourly[0].time, "2026-06-18T14:00");
  assert.equal(result.hourly[0].temperature, 27);
  assert.equal(result.hourly[0].precipitationProbability, 10);
  assert.equal(result.hourly[0].isDay, true);
  assert.equal(result.hourly[1].isDay, false);
  assert.equal(result.forecast[2].description, "Pioggia leggera");
});

test("usa i dati orari come fallback per il formato current_weather legacy", () => {
  const legacyRawForecast = {
    ...rawForecast,
    current: undefined,
    current_weather: {
      time: "2026-06-18T14:00",
      temperature: 27.2,
      weathercode: 1,
      windspeed: 12.4,
    },
  };

  const result = normalizeForecastData(legacyRawForecast);

  assert.equal(result.current.apparentTemperature, 28.1);
  assert.equal(result.current.humidity, 51);
  assert.equal(result.current.pressure, 1008.7);
});

test("rifiuta forecast giornalieri incompleti", () => {
  assert.throws(
    () =>
      normalizeForecastData({
        ...rawForecast,
        daily: {
          ...rawForecast.daily,
          time: rawForecast.daily.time.slice(0, 4),
        },
      }),
    /giornalieri non validi o incompleti/,
  );
});
