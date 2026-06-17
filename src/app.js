import express from "express";
import cors from "cors";
import helmet from "helmet";
import weatherRoutes from "./routes/weather.routes.js";

const app = express();

// middleware globali
app.use(helmet());
app.use(express.json());

// Configurazione CORS dinamica per accettare sia Localhost (PC) che Vercel (Telefono)
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Bloccato da policy CORS (Origine non consentita)"));
        }
    }
}));

// rotte varie
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "weather-dashboard-api" });
});

app.use("/api/weather", weatherRoutes);

// gestione end point non trovati
app.use((req, res, next) => {
    res.status(404).json({ error: "Endpoint non trovato" });
});

// middleware centralizzato degli errori
app.use((err, req, res, next) => {
    console.error("[Log Errore Server]:", err.message || err);

    const statusCode = err.message && err.message.includes("provider") ? 502 : 500;

    const responseMessage = process.env.NODE_ENV === "production" 
        ? "Errore interno del servizio meteo" 
        : err.message;

    res.status(statusCode).json({ error: responseMessage });
});

export default app;