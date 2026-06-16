import { Router } from "express";
import { searchLocations } from "../services/openMeteo.service.js";

const router = Router();

router.get("/locations", async (req, res, next) => {
  try {
    // leggere req.query.q, convertire a stringa e pulire gli spazi [cite: 152-153]
    const q = String(req.query.q || "").trim();

    // rifiuto input inferiori a due caratteri con HTTP 400 [cite: 153]
    if (q.length < 2) {
      return res.status(400).json({ 
        error: "Il parametro di ricerca 'q' deve contenere almeno 2 caratteri." 
      });
    }

    // chiamare il servizio [cite: 153]
    const locations = await searchLocations(q);

    // restituire { locations: [...] } 
    res.status(200).json({ locations });
    
  } catch (error) {
    // passo gli errori al middleware centralizzato 
    next(error);
  }
});

export default router;