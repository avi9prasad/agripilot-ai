/**
 * Real data extracted from ICAR-NBSS&LUP "At a Glance" (Aug 2023).
 * Numeric facts only — no fabricated per-state mapping beyond what the
 * source document itself states.
 */

export const NATIONAL_SOIL_FACTS = {
  primeAgriculturalLandMHa: 58,
  primeAgriculturalLandIndoGangeticSharePct: 40,
  primeAgriculturalLandMahaMPRajasthanSharePct: 25,
  primeAgriculturalLandSouthernStatesSharePct: 19,
  primeAgriculturalLandSouthernStatesMHa: 11.2,
  landDegradationHarmonizedMHa: 120,
  landDegradationInitialEstimateMHa: 187,
  socDeficientSoilSharePct: 50, // majority of Indian soils (>50%) are deficient (<1%) in organic carbon
  socPriorityAridMHa: 49,
  socPrioritySemiAridMHa: 116,
};

// Potential Soil Loss Map of India — classification bands (t/ha/yr), Fig. 7.
export const SOIL_LOSS_CATEGORIES = [
  { label: "Very Slight", min: 0, max: 5 },
  { label: "Slight", min: 5, max: 10 },
  { label: "Moderate", min: 10, max: 15 },
  { label: "Moderately Severe", min: 15, max: 20 },
  { label: "Severe", min: 20, max: 40 },
  { label: "Very Severe", min: 40, max: 80 },
  { label: "Extremely Severe", min: 80, max: Infinity },
];

export function classifySoilLossRisk(tonnesPerHaPerYr) {
  const val = Number(tonnesPerHaPerYr);
  if (!Number.isFinite(val) || val < 0) return null;
  return SOIL_LOSS_CATEGORIES.find((c) => val >= c.min && val < c.max)?.label || null;
}

// Telangana potential rice-growing area (Fig. 23), from ICAR-NBSS&LUP + Prof. Jayashankar
// Telangana State Agricultural University collaboration.
export const TELANGANA_RICE_POTENTIAL = {
  totalAreaLakhHa: 61.42,
  highlyPotentialLakhHa: 32.9,
  moderatelyPotentialLakhHa: 28.5,
};

/**
 * General national soil-health note, shown once per response (not per zone)
 * since we don't collect per-farm erosion/SOC readings from the user.
 */
export function buildNationalSoilContext() {
  const f = NATIONAL_SOIL_FACTS;
  return `National context (ICAR-NBSS&LUP): India has ~${f.primeAgriculturalLandMHa} million ha of prime agricultural land, over ${f.primeAgriculturalLandIndoGangeticSharePct}% of it in the Indo-Gangetic Plains. ~${f.landDegradationHarmonizedMHa} million ha nationally is affected by land degradation, and over ${f.socDeficientSoilSharePct}% of Indian soils are deficient in organic carbon — regular organic matter addition (FYM, compost, residue retention) helps counter this long-term.`;
}