import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "weather-dashboard-api" });
});

export default app;