# AgriPilotAI

An AI farm advisor: log soil, weather, and nutrient readings per field zone and get
concrete irrigation, fertilizer, and pest-risk recommendations — crop- and
growth-stage-aware, benchmarked against real Indian government agricultural data,
and backed by a 5-provider AI fallback chain so it never goes down.

Built for the **WeMakeDevs × Zerops Challenge** (Aug 8–9, 2026).

## What it does

- Log multiple field zones (soil moisture, temperature, humidity, nutrient level)
  plus farm context (crop, growth stage, region)
- Get per-zone irrigation, fertilizer, and pest/disease guidance, prioritized by urgency
- See national and state-level yield benchmarks for your crop, pulled from real
  government data — not invented numbers
- Works with or without an AI API key: falls back to a genuine rules engine, not
  a "sorry, no key" error screen

## Stack

- **Client**: React 18 + Vite
- **Server**: Express (single Node process serves the API and the built client — one container)
- **AI**: 5-provider fallback chain — Anthropic Claude → OpenAI → DeepSeek →
  DigitalOcean Serverless Inference → Google Gemini → rule-based fallback.
  Whichever API key is set (if any) gets used automatically; no key required to run.

## The rules engine (not just an AI wrapper)

When no AI key is configured — or as a transparent, explainable baseline even
when one is — `server/src/services/agronomyRules.js` computes real recommendations:

- **Crop-specific profiles** for wheat, rice, maize, cotton, and sugarcane: each
  with its own ideal soil-moisture band, growth-stage nitrogen demand, and named
  pest/disease risks (e.g. blast and brown planthopper for rice, yellow rust for
  wheat, fall armyworm for maize) instead of generic "pest risk: high"
- **Growth-stage awareness**: fertilizer guidance changes across seedling →
  vegetative → flowering → reproductive → harvest, not a flat rule for the whole season
- **Government data benchmarks**: national average yield (DA&FW, 2021-22 to 2025-26)
  and state-level rice yield rankings (UPAg) compared against the farmer's crop and region
- **ICAR-NBSS&LUP soil data**: national prime agricultural land, land degradation,
  and soil organic carbon deficiency stats surfaced alongside every recommendation

## Run locally

```bash
npm run install:all

# terminal 1
npm run dev:server

# terminal 2
npm run dev:client
```

Visit `http://localhost:5173`. Copy `server/.env.example` to `server/.env` and add
any one of the API keys below for real AI-generated recommendations — otherwise
the rules engine handles it.

## AI provider options (all optional)

Set any one of these in your environment — the app tries them in this order and
falls back to the rules engine if none are set or all fail:

| Env var | Provider | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude | `ANTHROPIC_MODEL` to override default |
| `OPENAI_API_KEY` | OpenAI | `OPENAI_MODEL` to override default |
| `DEEPSEEK_API_KEY` | DeepSeek | `DEEPSEEK_MODEL` to override default |
| `DO_MODEL_ACCESS_KEY` | DigitalOcean Serverless Inference | `DO_MODEL` to override default |
| `GEMINI_API_KEY` | Google Gemini (AI Studio) | Free tier, no card required |

## Production build (what Zerops runs)

```bash
npm run build   # installs deps + builds the client into client/dist
npm start        # single Express process serves API + static client on $PORT
```

## Deploy on Zerops

1. Push this repo to GitHub.
2. Create a Zerops project, add a Node.js 20 service, and let it pick up `zerops.yml`.
3. Connect the service to your GitHub repo (Pipelines & CI/CD settings → Push to Branch → `main`).
4. Add whichever AI provider env var(s) you want under Environment Variables (optional — works without any).
5. Trigger the pipeline. The service serves both the API (`/api/advisor/recommend`)
   and the built React app from the same URL.
6. Enable subdomain access to get your public URL.

## API

`POST /api/advisor/recommend`

```json
{
  "context": { "cropType": "rice", "growthStage": "flowering", "region": "Punjab, India" },
  "zones": [
    { "name": "Zone A", "soilMoisture": 35, "temperature": 24, "humidity": 55, "nutrientLevel": "low" }
  ]
}
```

Returns a summary, per-zone irrigation/fertilizer/pest guidance with priority and
risk level, a sustainability tip, and structured yield/soil benchmark data for
the frontend to render as a stats panel.

## Data sources

- DA&FW, "All-India: Crop-wise Area, Production & Yield" (2021-22 to 2025-26, 3rd Advance Estimate)
- UPAg (upag.gov.in), Area-Productivity map, Rice Yield by state
- ICAR-National Bureau of Soil Survey and Land Use Planning, "At a Glance" (Aug 2023)

## Notes for judges

- No fixed track — this targets the "build anything on Zerops" open theme.
- Single container: one Node process serves both API and static frontend.
- Works with zero API keys configured — the rules engine is a real, if simplified,
  agronomy model, not a placeholder — so the app stays fully functional through judging.
- All yield and soil figures are sourced from named government datasets, not
  fabricated or LLM-hallucinated.
