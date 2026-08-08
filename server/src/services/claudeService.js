import Anthropic from "@anthropic-ai/sdk";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You are AgriPilotAI, an expert precision-agriculture advisor.
You receive structured sensor and weather data for one or more field zones and must
return ONLY valid JSON (no markdown fences, no prose outside the JSON) matching this shape:

{
  "summary": "2-3 sentence high-level overview across all zones",
  "zones": [
    {
      "name": "string, echo the zone name given",
      "irrigation": "concrete, specific irrigation guidance for this zone",
      "fertilizer": "concrete, specific fertilizer/nutrient guidance for this zone",
      "pestRisk": "low | moderate | high",
      "pestNotes": "specific pest/disease risk guidance and any action needed",
      "priority": "low | medium | high"
    }
  ],
  "sustainabilityTip": "one actionable tip to reduce water/fertilizer waste across the farm"
}

Be concrete and quantitative where the input allows it (percentages, kg/ha, liters, days).
Do not invent data that wasn't provided or implied; reason from what's given.`;

/**
 * @param {Array<object>} zones - farm zone data from the client
 * @param {object} context - farm-level context (crop, region, notes)
 */
export async function getFarmRecommendations(zones, context) {
  if (!client) {
    return heuristicFallback(zones, context);
  }

  const userPrompt = `Farm context: ${JSON.stringify(context)}

Zone data: ${JSON.stringify(zones)}

Return the JSON object described in the system prompt only.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock ? textBlock.text.trim() : "";
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Claude API error, falling back to heuristics:", err.message);
    return heuristicFallback(zones, context);
  }
}

/**
 * Deterministic rule-based fallback so the app still works with no API key
 * (useful for demoing/judging without exposing a live key).
 */
function heuristicFallback(zones, context) {
  const results = zones.map((z) => {
    const moisture = Number(z.soilMoisture) || 0;
    const temp = Number(z.temperature) || 0;
    const humidity = Number(z.humidity) || 0;

    let irrigation;
    if (moisture < 25) irrigation = "Low soil moisture — irrigate today at high intensity (~80-90% of standard rate).";
    else if (moisture < 45) irrigation = "Moderate moisture — irrigate at medium intensity (~50-60% of standard rate) every 3-4 days.";
    else irrigation = "Moisture is adequate — hold irrigation and re-check in 5-7 days.";

    let fertilizer;
    if (z.nutrientLevel === "low") fertilizer = "Nutrient levels are low — apply a balanced NPK fertilizer at 80-90% of the recommended rate.";
    else if (z.nutrientLevel === "high") fertilizer = "Nutrients already high — apply minimal fertilizer (~10%) to avoid runoff.";
    else fertilizer = "Nutrients moderate — apply 50-60% of the recommended fertilizer rate.";

    let pestRisk = "low";
    if (temp > 27 && humidity > 55) pestRisk = "high";
    else if (temp > 22 && humidity > 45) pestRisk = "moderate";

    const priority = pestRisk === "high" || moisture < 25 ? "high" : pestRisk === "moderate" ? "medium" : "low";

    return {
      name: z.name || "Zone",
      irrigation,
      fertilizer,
      pestRisk,
      pestNotes:
        pestRisk === "high"
          ? "Warm, humid conditions favor pest/disease pressure — scout this zone within 48 hours and consider a preventive treatment."
          : pestRisk === "moderate"
          ? "Conditions are borderline — monitor for early signs of stress or pests over the next week."
          : "Low risk under current conditions — routine monitoring is sufficient.",
      priority,
    };
  });

  return {
    summary: `Heuristic analysis across ${zones.length} zone(s) for ${context.cropType || "your crop"}. This is a rule-based fallback (no ANTHROPIC_API_KEY configured) — set one for full AI-generated recommendations.`,
    zones: results,
    sustainabilityTip:
      "Group zones with similar moisture/nutrient profiles into shared irrigation and fertilizer schedules to cut input waste.",
  };
}
