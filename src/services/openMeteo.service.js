// definisco url geocoding API di Open-Meteo per la ricerca dei luoghi
const GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search";

export const searchLocations = async (query) => {
  // parametri richiesti
  const params = new URLSearchParams({
    name: query,
    count: 5,
    language: "it",
    format: "json",
  });

  // chiamata esterna a Open-Meteo
  const response = await fetch(`${GEOCODING_API_URL}?${params.toString()}`);

  // controllo risposta andata a buon fine
  if (!response.ok) {
    throw new Error(`Errore dal provider Open-Meteo: ${response.status}`);
  }

  const data = await response.json();

  // se 'results' manca (es. nessun luogo trovato), restituiamo una lista vuota
  if (!data.results) {
    return [];
  }

  // mappa campi rilevanti per la nostra applicazione
  return data.results.map((loc) => ({
    id: loc.id,
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    country: loc.country,
    admin1: loc.admin1, // regione/stato
    timezone: loc.timezone,
  }));
};