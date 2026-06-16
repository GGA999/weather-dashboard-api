// tabella di fallback per i codici WMO [cite: 193]
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
  61: "Pioggia leggera",
  63: "Pioggia moderata",
  65: "Pioggia forte",
  71: "Neve leggera",
  73: "Neve moderata",
  75: "Neve forte",
  95: "Temporale",
  96: "Temporale con grandine leggera",
  99: "Temporale con grandine forte"
};

export const normalizeForecastData = (rawData) => {
  // verificare che gli array richiesti esistano e abbiano lunghezza coerente [cite: 183]
  if (!rawData || !rawData.daily || !rawData.daily.time) {
    throw new Error("Dati forecast grezzi non validi o mancanti");
  }

  const { daily } = rawData;
  const normalizedDays = [];

  // per ogni indice dell'array daily.time creare un singolo oggetto [cite: 183]
  for (let i = 0; i < daily.time.length; i++) {
    const weatherCode = daily.weather_code[i];
    
    normalizedDays.push({
      date: daily.time[i],
      weatherCode: weatherCode,
      description: wmoCodes[weatherCode] || "Condizioni sconosciute", // Fallback per descrizioni [cite: 193]
      temperatureMin: daily.temperature_2m_min[i],
      temperatureMax: daily.temperature_2m_max[i],
      precipitationProbability: daily.precipitation_probability_max[i],
      windSpeed: daily.wind_speed_10m_max[i]
    });
  }

  // ll risultato interno deve avere esattamente cinque elementi [cite: 184]
  return normalizedDays.slice(0, 5); 
};