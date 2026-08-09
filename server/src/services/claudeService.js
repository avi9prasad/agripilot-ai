import Anthropic from "@anthropic-ai/sdk";
import { computeHeuristicRecommendations } from "./agronomyRules.js";

// Provider selection: use Claude if ANTHROPIC_API_KEY is set, otherwise fall back
// to DeepSeek if DEEPSEEK_API_KEY is set, otherwise use the heuristic fallback.
const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || null;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

// DigitalOcean Serverless Inference: OpenAI-compatible, one key unlocks 55+ models
// (Claude, DeepSeek, Llama, etc). Useful if you're using their free trial credit.
const DO_API_KEY = process.env.DO_MODEL_ACCESS_KEY || null;
const DO_MODEL = process.env.DO_MODEL || "openai-gpt-4o-mini";

// Google Gemini API (AI Studio): genuinely free tier, no card required, no expiration.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
  const userPrompt = `Farm context: ${JSON.stringify(context)}

Zone data: ${JSON.stringify(zones)}

Return the JSON object described in the system prompt only.`;

  if (anthropicClient) {
    try {
      const response = await anthropicClient.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const raw = textBlock ? textBlock.text.trim() : "";
      return parseModelJson(raw);
    } catch (err) {
      console.error("Claude API error, falling back:", err.message);
    }
  }

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API returned ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "";
      return parseModelJson(raw);
    } catch (err) {
      console.error("OpenAI API error, falling back:", err.message);
    }
  }

  if (DEEPSEEK_API_KEY) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        throw new Error(`DeepSeek API returned ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "";
      return parseModelJson(raw);
    } catch (err) {
      console.error("DeepSeek API error, falling back:", err.message);
    }
  }

  if (DO_API_KEY) {
    try {
      const res = await fetch("https://inference.do-ai.run/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DO_API_KEY}`,
        },
        body: JSON.stringify({
          model: DO_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        throw new Error(`DigitalOcean Inference returned ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "";
      return parseModelJson(raw);
    } catch (err) {
      console.error("DigitalOcean Inference error, falling back to heuristics:", err.message);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.4 },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API returned ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      return parseModelJson(raw);
    } catch (err) {
      console.error("Gemini API error, falling back to heuristics:", err.message);
    }
  }

  return computeHeuristicRecommendations(zones, context);
}

function parseModelJson(raw) {
  const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(cleaned);
}