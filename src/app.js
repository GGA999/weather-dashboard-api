import express from "express";
import cors from "cors";
import helmet from "helmet";
import weatherRoutes from "./routes/weather.routes.js";

const app = express();

// middleware globali
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

// rotte varie
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "weather-dashboard-api" });
});

app.use("/api/weather", weatherRoutes);

// gestione end point non trovati
// Questo middleware viene eseguito solo se nessuna rotta sopra ha risposto
app.use((req, res, next) => {
    res.status(404).json({ error: "Endpoint non trovato" }); // restituisco sempre JSON
});

// middleware centralizzato degli errori
// deve avere 4 parametri perché express lo riconosca come error handler [cite: 196]
app.use((err, req, res, next) => {
    // registrare messaggio e causa nei log [cite: 198]
    console.error("[Log Errore Server]:", err.message || err);

    // uso 502 se il messaggio di errore proviene da Open-Meteo, altrimenti 500 [cite: 199]
    const statusCode = err.message && err.message.includes("provider") ? 502 : 500;

    // non invio stack trace al browser in produzione per sicurezza [cite: 197]
    const responseMessage = process.env.NODE_ENV === "production" 
        ? "Errore interno del servizio meteo" 
        : err.message;

    // restitusico sempre JSON anche in caso di errore [cite: 200]
    res.status(statusCode).json({ error: responseMessage });
});

export default app;