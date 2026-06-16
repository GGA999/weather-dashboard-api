import express from "express";
import cors from "cors";
import helmet from "helmet";
import weatherRoutes from "./routes/weather.routes.js";

const app = express();

// middleware per sicurezza, parsing JSON e CORS
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

// rotte protette dal CORS
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "weather-dashboard-api" });
});

app.use("/api/weather", weatherRoutes);

export default app;