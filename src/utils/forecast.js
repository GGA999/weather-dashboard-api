const wmoCodes = {
  0: "Cielo sereno",
  1: "Prevalentemente sereno",
  2: "Parzialmente nuvoloso",
  3: "Coperto",
  45: "Nebbia",
  48: "Nebbia con brina",
  51: "Pioviggine leggera",
  53: "Pioviggine moderata",
  55: "Pioviggine fitta",
  56: "Pioviggine gelata leggera",
  57: "Pioviggine gelata forte",
  61: "Pioggia leggera",
  63: "Pioggia moderata",
  65: "Pioggia forte",
  66: "Pioggia gelata leggera",
  67: "Pioggia gelata forte",
  71: "Neve leggera",
  73: "Neve moderata",
  75: "Neve forte",
  77: "Granelli di neve",
  80: "Rovesci di pioggia leggeri",
  81: "Rovesci di pioggia moderati",
  82: "Rovesci di pioggia forti",
  85: "Rovesci di neve leggeri",
  86: "Rovesci di neve forti",
  95: "Temporale",
  96: "Temporale con grandine leggera",
  99: "Temporale con grandine forte",
};

const DAILY_FIELDS = [
  "time",
  "weather_code",
  "temperature_2m_min",
  "temperature_2m_max",
  "precipitation_probability_max",
  "wind_speed_10m_max",
];

const getWeatherDescription = (weatherCode) =>
  wmoCodes[weatherCode] || "Condizioni sconosciute";

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null);

const normalizeIsDay = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return Number(value) === 1;
};

const readHourlyField = (hourly, fieldNames, index) => {
  for (const fieldName of fieldNames) {
    if (Array.isArray(hourly?.[fieldName])) {
      return hourly[fieldName][index];
    }
  }

  return undefined;
};

const findCurrentHourIndex = (hourlyTimes, currentTime) => {
  if (!Array.isArray(hourlyTimes) || !hourlyTimes.length || !currentTime) {
    return 0;
  }

  const currentHour = String(currentTime).slice(0, 13);
  const sameHourIndex = hourlyTimes.findIndex(
    (time) => String(time).slice(0, 13) === currentHour,
  );

  if (sameHourIndex >= 0) {
    return sameHourIndex;
  }

  const nextHourIndex = hourlyTimes.findIndex(
    (time) => String(time) >= String(currentTime),
  );

  return nextHourIndex >= 0 ? nextHourIndex : 0;
};

const normalizeDailyForecast = (daily) => {
  if (
    !daily ||
    !DAILY_FIELDS.every(
      (field) => Array.isArray(daily[field]) && daily[field].length >= 5,
    )
  ) {
    throw new Error("Dati forecast giornalieri non validi o incompleti");
  }

  return daily.time.slice(0, 5).map((date, index) => {
    const weatherCode = daily.weather_code[index];

    return {
      date,
      weatherCode,
      description: getWeatherDescription(weatherCode),
      temperatureMin: daily.temperature_2m_min[index],
      temperatureMax: daily.temperature_2m_max[index],
      precipitationProbability: daily.precipitation_probability_max[index],
      windSpeed: daily.wind_speed_10m_max[index],
    };
  });
};

const normalizeHourlyForecast = (hourly, currentTime) => {
  if (!Array.isArray(hourly?.time)) {
    return [];
  }

  const startIndex = findCurrentHourIndex(hourly.time, currentTime);

  return hourly.time.slice(startIndex, startIndex + 24).map((time, offset) => {
    const index = startIndex + offset;
    const weatherCode = readHourlyField(
      hourly,
      ["weather_code", "weathercode"],
      index,
    );

    return {
      time,
      temperature: readHourlyField(hourly, ["temperature_2m"], index),
      apparentTemperature: readHourlyField(
        hourly,
        ["apparent_temperature"],
        index,
      ),
      precipitationProbability: readHourlyField(
        hourly,
        ["precipitation_probability"],
        index,
      ),
      weatherCode,
      description: getWeatherDescription(weatherCode),
      isDay: normalizeIsDay(readHourlyField(hourly, ["is_day"], index)),
      windSpeed: readHourlyField(
        hourly,
        ["wind_speed_10m", "windspeed_10m"],
        index,
      ),
      humidity: readHourlyField(
        hourly,
        ["relative_humidity_2m", "relativehumidity_2m"],
        index,
      ),
      pressure: readHourlyField(hourly, ["surface_pressure"], index),
    };
  });
};

const normalizeCurrentWeather = (rawData, hourly) => {
  const source = rawData.current || rawData.current_weather || {};
  const hourlyIndex = findCurrentHourIndex(rawData.hourly?.time, source.time);
  const hourlyFallback = hourly[0] || {};
  const weatherCode = firstDefined(
    source.weather_code,
    source.weathercode,
    hourlyFallback.weatherCode,
  );

  return {
    time: firstDefined(source.time, hourlyFallback.time),
    temperature: firstDefined(
      source.temperature_2m,
      source.temperature,
      hourlyFallback.temperature,
    ),
    apparentTemperature: firstDefined(
      source.apparent_temperature,
      readHourlyField(rawData.hourly, ["apparent_temperature"], hourlyIndex),
      hourlyFallback.apparentTemperature,
    ),
    humidity: firstDefined(
      source.relative_humidity_2m,
      readHourlyField(
        rawData.hourly,
        ["relative_humidity_2m", "relativehumidity_2m"],
        hourlyIndex,
      ),
      hourlyFallback.humidity,
    ),
    pressure: firstDefined(
      source.surface_pressure,
      source.pressure_msl,
      readHourlyField(rawData.hourly, ["surface_pressure"], hourlyIndex),
      hourlyFallback.pressure,
    ),
    windSpeed: firstDefined(
      source.wind_speed_10m,
      source.windspeed,
      readHourlyField(
        rawData.hourly,
        ["wind_speed_10m", "windspeed_10m"],
        hourlyIndex,
      ),
      hourlyFallback.windSpeed,
    ),
    weatherCode,
    description: getWeatherDescription(weatherCode),
    isDay: normalizeIsDay(
      firstDefined(
        source.is_day,
        readHourlyField(rawData.hourly, ["is_day"], hourlyIndex),
        hourlyFallback.isDay,
      ),
    ),
  };
};

export const normalizeForecastData = (rawData) => {
  if (!rawData) {
    throw new Error("Dati forecast grezzi non validi o mancanti");
  }

  const forecast = normalizeDailyForecast(rawData.daily);
  const currentTime =
    rawData.current?.time ||
    rawData.current_weather?.time ||
    rawData.hourly?.time?.[0];
  const hourly = normalizeHourlyForecast(rawData.hourly, currentTime);
  const current = normalizeCurrentWeather(rawData, hourly);

  return {
    current,
    hourly,
    forecast,
  };
};
