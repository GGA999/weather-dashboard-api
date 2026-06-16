const WMO_DESCRIPTIONS = new Map([
  [0, "Sereno"],
  [1, "Prevalentemente sereno"],
  [2, "Parzialmente nuvoloso"],
  [3, "Coperto"],
  [45, "Nebbia"],
  [48, "Nebbia con brina"],
  [51, "Pioviggine leggera"],
  [53, "Pioviggine moderata"],
  [55, "Pioviggine intensa"],
  [56, "Pioviggine gelata leggera"],
  [57, "Pioviggine gelata intensa"],
  [61, "Pioggia leggera"],
  [63, "Pioggia moderata"],
  [65, "Pioggia intensa"],
  [66, "Pioggia gelata leggera"],
  [67, "Pioggia gelata intensa"],
  [71, "Neve leggera"],
  [73, "Neve moderata"],
  [75, "Neve intensa"],
  [77, "Granelli di neve"],
  [80, "Rovesci leggeri"],
  [81, "Rovesci moderati"],
  [82, "Rovesci intensi"],
  [85, "Rovesci di neve leggeri"],
  [86, "Rovesci di neve intensi"],
  [95, "Temporale"],
  [96, "Temporale con grandine leggera"],
  [99, "Temporale con grandine intensa"],
]);

function createProviderDataError(message) {
  const error = new Error(message);
  error.status = 502;
  return error;
}

function readRequiredArray(source, key) {
  const value = source?.[key];

  if (!Array.isArray(value)) {
    throw createProviderDataError(`Campo Open-Meteo mancante: ${key}`);
  }

  return value;
}

function nullableNumber(value, decimals = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  const factor = 10 ** decimals;
  return Math.round(numberValue * factor) / factor;
}

export function getWeatherDescription(code) {
  return WMO_DESCRIPTIONS.get(Number(code)) ?? "Meteo variabile";
}

function normalizeCurrent(current) {
  if (!current) {
    return null;
  }

  const weatherCode = nullableNumber(current.weather_code);

  return {
    time: current.time ?? null,
    temperature: nullableNumber(current.temperature_2m),
    apparentTemperature: nullableNumber(current.apparent_temperature),
    humidity: nullableNumber(current.relative_humidity_2m),
    pressure: nullableNumber(current.pressure_msl),
    windSpeed: nullableNumber(current.wind_speed_10m),
    weatherCode,
    description: getWeatherDescription(weatherCode),
  };
}

function normalizeHourly(hourly, currentTime) {
  if (!hourly) {
    return [];
  }

  const times = readRequiredArray(hourly, "time");
  const temperatures = readRequiredArray(hourly, "temperature_2m");
  const weatherCodes = readRequiredArray(hourly, "weather_code");
  const precipitation = readRequiredArray(hourly, "precipitation_probability");
  const startIndex = Math.max(
    0,
    currentTime ? times.findIndex((time) => time >= currentTime) : 0,
  );

  return times.slice(startIndex, startIndex + 8).map((time, index) => {
    const sourceIndex = startIndex + index;
    const weatherCode = nullableNumber(weatherCodes[sourceIndex]);

    return {
      time,
      temperature: nullableNumber(temperatures[sourceIndex]),
      weatherCode,
      description: getWeatherDescription(weatherCode),
      precipitationProbability: nullableNumber(precipitation[sourceIndex]),
    };
  });
}

export function normalizeForecastPayload(data, requestedLocation = {}) {
  const daily = data?.daily;

  if (!daily) {
    throw createProviderDataError("Risposta Open-Meteo senza dati giornalieri");
  }

  const dates = readRequiredArray(daily, "time");
  const weatherCodes = readRequiredArray(daily, "weather_code");
  const temperatureMax = readRequiredArray(daily, "temperature_2m_max");
  const temperatureMin = readRequiredArray(daily, "temperature_2m_min");
  const precipitation = readRequiredArray(daily, "precipitation_probability_max");
  const windSpeed = readRequiredArray(daily, "wind_speed_10m_max");
  const uvIndex = Array.isArray(daily.uv_index_max) ? daily.uv_index_max : [];

  if (
    dates.length < 5 ||
    weatherCodes.length < 5 ||
    temperatureMax.length < 5 ||
    temperatureMin.length < 5 ||
    precipitation.length < 5 ||
    windSpeed.length < 5
  ) {
    throw createProviderDataError("Open-Meteo non ha restituito 5 giorni completi");
  }

  const forecast = dates.slice(0, 5).map((date, index) => {
    const weatherCode = nullableNumber(weatherCodes[index]);

    return {
      date,
      weatherCode,
      description: getWeatherDescription(weatherCode),
      temperatureMin: nullableNumber(temperatureMin[index]),
      temperatureMax: nullableNumber(temperatureMax[index]),
      precipitationProbability: nullableNumber(precipitation[index]),
      windSpeed: nullableNumber(windSpeed[index]),
      uvIndex: nullableNumber(uvIndex[index], 1),
    };
  });
  const current = normalizeCurrent(data.current);

  return {
    location: {
      latitude: data.latitude ?? requestedLocation.latitude,
      longitude: data.longitude ?? requestedLocation.longitude,
      timezone: data.timezone ?? null,
    },
    current,
    hourly: normalizeHourly(data.hourly, current?.time),
    forecast,
  };
}
