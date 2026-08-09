export default function BenchmarkPanel({ yieldBenchmark, soilFacts }) {
  if (!yieldBenchmark && !soilFacts) return null;

  return (
    <div className="benchmark-panel">
      <div className="panel-label" style={{ marginBottom: "0.85rem" }}>
        <span className="idx">04</span>
        <h2>National benchmarks</h2>
      </div>

      <div className="benchmark-grid">
        {yieldBenchmark && (
          <>
            <div className="benchmark-stat">
              <span className="k">National avg yield</span>
              <span className="v-lg">{yieldBenchmark.nationalYield.toLocaleString()}</span>
              <span className="unit">kg/ha · {yieldBenchmark.cropKey} · 2025-26</span>
            </div>

            {yieldBenchmark.stateMatch && (
              <div className="benchmark-stat highlight">
                <span className="k">{yieldBenchmark.stateMatch.name} yield</span>
                <span className="v-lg">{yieldBenchmark.stateMatch.yield.toLocaleString()}</span>
                <span className="unit">kg/ha · top-5 rice state</span>
              </div>
            )}

            {yieldBenchmark.trend && (
              <div className="benchmark-stat wide">
                <span className="k">5-year trend (kg/ha)</span>
                <div className="trend-row">
                  {Object.entries(yieldBenchmark.trend).map(([year, val]) => (
                    <div key={year} className="trend-cell">
                      <span className="trend-year">{year}</span>
                      <span className="trend-val">{val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {yieldBenchmark.topStates && (
              <div className="benchmark-stat wide">
                <span className="k">Top 5 rice-yield states (kg/ha)</span>
                <div className="trend-row">
                  {yieldBenchmark.topStates.map((s) => (
                    <div key={s.name} className="trend-cell">
                      <span className="trend-year">{s.name}</span>
                      <span className="trend-val">{s.yield.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {soilFacts && (
          <>
            <div className="benchmark-stat">
              <span className="k">Prime agri. land (India)</span>
              <span className="v-lg">{soilFacts.primeAgriculturalLandMHa}</span>
              <span className="unit">million ha · {soilFacts.primeAgriculturalLandIndoGangeticSharePct}% in Indo-Gangetic Plains</span>
            </div>

            <div className="benchmark-stat">
              <span className="k">Land degradation (India)</span>
              <span className="v-lg">{soilFacts.landDegradationHarmonizedMHa}</span>
              <span className="unit">million ha affected, ICAR harmonized estimate</span>
            </div>

            <div className="benchmark-stat">
              <span className="k">Soils deficient in carbon</span>
              <span className="v-lg">{soilFacts.socDeficientSoilSharePct}%+</span>
              <span className="unit">of Indian soils, &lt;1% organic carbon</span>
            </div>
          </>
        )}
      </div>

      <div className="benchmark-source">Source: DA&amp;FW (2025-26 3rd Advance Estimate), UPAg, ICAR-NBSS&amp;LUP</div>
    </div>
  );
}