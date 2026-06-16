import express from "express";
import cors from "cors";
import helmet from "helmet";
import weatherRoutes from "./routes/weather.routes.js";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "weather-dashboard-api" });
});

app.use("/api/weather", weatherRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint non trovato" });
});

app.use((error, req, res, next) => {
  const status = Number(error.status) || 500;
  const message = status === 500 ? "Errore interno del server" : error.message;

  console.error(error.message, error.cause || "");

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" && status === 500
      ? { detail: error.message }
      : {}),
  });
});

export default app;
