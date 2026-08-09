/**
 * Real government agricultural data, extracted from:
 * - DA&FW "All-India: Crop-wise Area, Production & Yield" (2021-22 to 2025-26, 3rd Advance Estimate)
 * - UPAg (upag.gov.in) Area-Productivity map, Rice Yield (Kg/Ha) 2025-26
 *
 * Used to give farmers a real national/state benchmark alongside the
 * rule-based zone recommendations, instead of numbers made up on the fly.
 */

// National average yield, 2025-26 (3rd Advance Estimate), in Kg/Ha.
// Source: DA&FW All-India Crop-wise Area, Production & Yield.
export const NATIONAL_YIELD_KG_HA_2025_26 = {
  rice: 2915,
  wheat: 3591,
  maize: 3824,
  barley: 3171,
  jowar: 1228,
  bajra: 1558,
  ragi: 1486,
  groundnut: 2228,
  soybean: 1017,
  cotton: 428,
  sugarcane: 84987,
};

// 5-year yield trend (Kg/Ha) for a few headline crops, same source.
export const NATIONAL_YIELD_TREND_KG_HA = {
  rice: { "2021-22": 2798, "2022-23": 2838, "2023-24": 2882, "2024-25": 2929, "2025-26": 2915 },
  wheat: { "2021-22": 3537, "2022-23": 3521, "2023-24": 3559, "2024-25": 3595, "2025-26": 3591 },
  maize: { "2021-22": 3387, "2022-23": 3545, "2023-24": 3351, "2024-25": 3590, "2025-26": 3824 },
  cotton: { "2021-22": 428, "2022-23": 443, "2023-24": 436, "2024-25": 440, "2025-26": 428 },
  sugarcane: { "2021-22": 84906, "2022-23": 83349, "2023-24": 78953, "2024-25": 83416, "2025-26": 84987 },
};

// Rice yield (Kg/Ha) by state, 2025-26 3rd Advance Estimate — top performers.
// Source: UPAg (upag.gov.in/area-productivity), "Rice Yield (Kg/Ha), 2025-26".
export const STATE_RICE_YIELD_KG_HA_2025_26 = {
  "andhra pradesh": 3993,
  punjab: 3835,
  haryana: 3570,
  telangana: 3468,
  "tamil nadu": 3440,
};

/**
 * Build a short benchmark note comparing a farmer's crop/region against
 * national (and, for rice, state-level) yield data. Returns null if we
 * don't have data for the given crop, rather than guessing.
 */
export function buildYieldBenchmark(cropType, region) {
  const cropKey = (cropType || "").trim().toLowerCase();
  const nationalYield = NATIONAL_YIELD_KG_HA_2025_26[cropKey];
  if (!nationalYield) return null;

  let note = `National average ${cropKey} yield (2025-26 estimate) is ${nationalYield.toLocaleString()} kg/ha.`;

  if (cropKey === "rice" && region) {
    const regionKey = region.trim().toLowerCase();
    const matchedState = Object.keys(STATE_RICE_YIELD_KG_HA_2025_26).find((state) =>
      regionKey.includes(state)
    );
    if (matchedState) {
      const stateYield = STATE_RICE_YIELD_KG_HA_2025_26[matchedState];
      const label = matchedState.replace(/\b\w/g, (c) => c.toUpperCase());
      note += ` ${label} is a top-5 rice-yield state at ${stateYield.toLocaleString()} kg/ha — well above the national average, so aim your management toward that benchmark rather than the national figure.`;
    } else {
      note += ` Top rice-yield states (Andhra Pradesh, Punjab, Haryana, Telangana, Tamil Nadu) run 3,440-3,993 kg/ha — useful as a stretch target if local conditions allow.`;
    }
  }

  return note;
}

/**
 * Structured version of the yield benchmark, for rendering as a stat panel
 * instead of a prose sentence.
 */
export function buildYieldBenchmarkData(cropType, region) {
  const cropKey = (cropType || "").trim().toLowerCase();
  const nationalYield = NATIONAL_YIELD_KG_HA_2025_26[cropKey];
  if (!nationalYield) return null;

  const trend = NATIONAL_YIELD_TREND_KG_HA[cropKey] || null;

  let stateMatch = null;
  if (cropKey === "rice" && region) {
    const regionKey = region.trim().toLowerCase();
    const matchedState = Object.keys(STATE_RICE_YIELD_KG_HA_2025_26).find((state) =>
      regionKey.includes(state)
    );
    if (matchedState) {
      stateMatch = {
        name: matchedState.replace(/\b\w/g, (c) => c.toUpperCase()),
        yield: STATE_RICE_YIELD_KG_HA_2025_26[matchedState],
      };
    }
  }

  const topStates =
    cropKey === "rice"
      ? Object.entries(STATE_RICE_YIELD_KG_HA_2025_26)
          .map(([name, yieldVal]) => ({ name: name.replace(/\b\w/g, (c) => c.toUpperCase()), yield: yieldVal }))
          .sort((a, b) => b.yield - a.yield)
      : null;

  return { cropKey, nationalYield, trend, stateMatch, topStates };
}