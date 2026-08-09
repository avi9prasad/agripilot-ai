import { buildYieldBenchmarkData } from "../data/agriBenchmarks.js";
import { buildNationalSoilContext, NATIONAL_SOIL_FACTS } from "../data/soilBenchmarks.js";

/**
 * Hardcoded agronomy rules engine.
 *
 * This is the logic that runs for every user who doesn't have an AI API key
 * configured (which, in practice, is most people demoing or using this app
 * casually). It's deliberately NOT a thin wrapper around an LLM — it's a real,
 * if simplified, rules engine with crop-specific thresholds, growth-stage
 * sensitivity, and named pest/disease risks, so the app is genuinely useful
 * standalone.
 *
 * Numbers here are indicative/illustrative for a demo, not a substitute for
 * agronomic advice from a local extension service.
 */

// --- Crop profiles -----------------------------------------------------

const CROP_PROFILES = {
  wheat: {
    label: "wheat",
    idealMoisture: [35, 55],
    waterDeficitLPerHa: 22000, // liters/ha per irrigation cycle if below ideal
    nDemandByStage: { seedling: "low", vegetative: "high", flowering: "medium", reproductive: "medium", harvest: "none" },
    pests: {
      warmHumid: "yellow/stripe rust — favored by cool, humid conditions; inspect lower leaves for orange-yellow pustules",
      hotDry: "aphids — check the underside of leaves and the ear as temperatures rise",
      default: "generic fungal leaf spot risk under prolonged leaf wetness",
    },
  },
  rice: {
    label: "rice",
    idealMoisture: [60, 85], // paddy — much wetter baseline
    waterDeficitLPerHa: 35000,
    nDemandByStage: { seedling: "medium", vegetative: "high", flowering: "high", reproductive: "medium", harvest: "none" },
    pests: {
      warmHumid: "blast and brown planthopper — high humidity plus warm nights sharply raises risk; scout leaf tips and stem base",
      hotDry: "stem borer — watch for deadhearts in vegetative stage",
      default: "sheath blight risk under dense canopy and standing water",
    },
  },
  maize: {
    label: "maize",
    idealMoisture: [35, 55],
    waterDeficitLPerHa: 25000,
    nDemandByStage: { seedling: "low", vegetative: "high", flowering: "high", reproductive: "medium", harvest: "none" },
    pests: {
      warmHumid: "fall armyworm — check whorls for ragged feeding damage and frass, especially in warm humid spells",
      hotDry: "maize stalk borer risk rises under heat stress",
      default: "generic leaf blight risk under extended leaf wetness",
    },
  },
  cotton: {
    label: "cotton",
    idealMoisture: [30, 50],
    waterDeficitLPerHa: 28000,
    nDemandByStage: { seedling: "low", vegetative: "medium", flowering: "high", reproductive: "medium", harvest: "none" },
    pests: {
      warmHumid: "whitefly and bollworm — both thrive in warm, humid conditions; check the underside of leaves and squares/bolls",
      hotDry: "mites can spike under hot, dry stress — watch for leaf stippling",
      default: "general boll rot risk if humidity stays high near boll opening",
    },
  },
  sugarcane: {
    label: "sugarcane",
    idealMoisture: [45, 70],
    waterDeficitLPerHa: 40000,
    nDemandByStage: { seedling: "medium", vegetative: "high", flowering: "low", reproductive: "low", harvest: "none" },
    pests: {
      warmHumid: "red rot and pyrilla risk climbs with sustained humidity — inspect for reddening inside stalks",
      hotDry: "early shoot borer risk under heat stress at establishment",
      default: "general stalk rot risk under waterlogging",
    },
  },
  default: {
    label: "your crop",
    idealMoisture: [35, 55],
    waterDeficitLPerHa: 25000,
    nDemandByStage: { seedling: "low", vegetative: "high", flowering: "medium", reproductive: "medium", harvest: "none" },
    pests: {
      warmHumid: "generic fungal/pest pressure — warm humid conditions favor most crop pathogens and insects",
      hotDry: "generic heat-stress pest risk (mites, aphids) as conditions dry out",
      default: "routine monitoring — no specific elevated risk pattern detected",
    },
  },
};

function getCropProfile(cropTypeRaw) {
  const key = (cropTypeRaw || "").trim().toLowerCase();
  return CROP_PROFILES[key] || CROP_PROFILES.default;
}

// --- Irrigation ----------------------------------------------------------

function buildIrrigation(profile, moisture) {
  const [low, high] = profile.idealMoisture;
  const litersPerHa = profile.waterDeficitLPerHa;

  if (moisture < low) {
    const deficitPct = Math.round(((low - moisture) / low) * 100);
    return `Below the ${low}-${high}% ideal band for ${profile.label} by ~${deficitPct}%. Irrigate now — roughly ${litersPerHa.toLocaleString()} L/ha, or a full standard cycle. Recheck in 2-3 days.`;
  }
  if (moisture <= high) {
    return `Within the ${low}-${high}% ideal band for ${profile.label}. Hold irrigation; recheck in 4-5 days or after the next expected rainfall.`;
  }
  return `Above the ${high}% upper band for ${profile.label} — risk of waterlogging/root stress. Hold irrigation and improve drainage if this persists.`;
}

// --- Fertilizer ------------------------------------------------------------

const NUTRIENT_RATE_BY_DEMAND = {
  low: { low: 30, moderate: 15, high: 5 }, // kg/ha urea-equivalent, by (stage demand -> nutrientLevel reading)
  medium: { low: 60, moderate: 35, high: 10 },
  high: { low: 100, moderate: 60, high: 20 },
  none: { low: 0, moderate: 0, high: 0 },
};

function buildFertilizer(profile, growthStage, nutrientLevel) {
  const demand = profile.nDemandByStage[growthStage] || "medium";
  const level = nutrientLevel || "moderate";
  const rate = NUTRIENT_RATE_BY_DEMAND[demand]?.[level] ?? 35;

  if (demand === "none") {
    return `${profile.label} at ${growthStage} stage has minimal nitrogen demand — hold fertilizer application to avoid waste and lodging risk.`;
  }
  if (rate === 0) {
    return `Soil nutrients already read high and ${growthStage}-stage demand for ${profile.label} is ${demand} — skip this cycle to avoid runoff.`;
  }
  return `${growthStage[0].toUpperCase()}${growthStage.slice(1)}-stage ${profile.label} has ${demand} nitrogen demand and current soil nutrients read ${level} — apply ~${rate} kg/ha urea-equivalent (or the balanced NPK equivalent your supplier stocks).`;
}

// --- Pest / disease risk ----------------------------------------------------

function buildPestRisk(profile, temp, humidity) {
  let riskLevel = "low";
  let noteKey = "default";

  if (temp > 27 && humidity > 55) {
    riskLevel = "high";
    noteKey = "warmHumid";
  } else if (temp > 30 && humidity < 40) {
    riskLevel = "moderate";
    noteKey = "hotDry";
  } else if (temp > 22 && humidity > 45) {
    riskLevel = "moderate";
    noteKey = "warmHumid";
  }

  const note = profile.pests[noteKey] || profile.pests.default;
  return { riskLevel, note };
}

// --- Public entry point ------------------------------------------------------

export function computeHeuristicRecommendations(zones, context) {
  const growthStage = context.growthStage || "vegetative";
  const profile = getCropProfile(context.cropType);

  const results = zones.map((z) => {
    const moisture = Number(z.soilMoisture) || 0;
    const temp = Number(z.temperature) || 0;
    const humidity = Number(z.humidity) || 0;

    const irrigation = buildIrrigation(profile, moisture);
    const fertilizer = buildFertilizer(profile, growthStage, z.nutrientLevel);
    const { riskLevel, note } = buildPestRisk(profile, temp, humidity);

    const belowMoisture = moisture < profile.idealMoisture[0];
    const priority = riskLevel === "high" || belowMoisture ? "high" : riskLevel === "moderate" ? "medium" : "low";

    return {
      name: z.name || "Zone",
      irrigation,
      fertilizer,
      pestRisk: riskLevel,
      pestNotes: note,
      priority,
    };
  });

  const highPriorityCount = results.filter((r) => r.priority === "high").length;
  const summary = highPriorityCount > 0
    ? `${highPriorityCount} of ${zones.length} zone(s) need attention now for ${profile.label} at ${growthStage} stage — see priority flags below.`
    : `All ${zones.length} zone(s) are within normal ranges for ${profile.label} at ${growthStage} stage. Routine monitoring is sufficient.`;

  return {
    summary,
    zones: results,
    sustainabilityTip:
      "Group zones with similar moisture/nutrient profiles into shared irrigation and fertilizer schedules to cut input waste.",
    nationalSoilContext: buildNationalSoilContext(),
    yieldBenchmark: buildYieldBenchmarkData(context.cropType, context.region),
    soilFacts: NATIONAL_SOIL_FACTS,
  };
}