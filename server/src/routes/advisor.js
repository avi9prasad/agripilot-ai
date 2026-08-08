import { Router } from "express";
import { getFarmRecommendations } from "../services/claudeService.js";

const router = Router();

router.post("/recommend", async (req, res) => {
  const { context = {}, zones = [] } = req.body || {};

  if (!Array.isArray(zones) || zones.length === 0) {
    return res.status(400).json({ error: "At least one zone is required." });
  }

  for (const zone of zones) {
    if (!zone.name) {
      return res.status(400).json({ error: "Every zone needs a name." });
    }
  }

  try {
    const recommendations = await getFarmRecommendations(zones, context);
    res.json(recommendations);
  } catch (err) {
    console.error("Advisor route error:", err);
    res.status(500).json({ error: "Failed to generate recommendations." });
  }
});

export default router;
