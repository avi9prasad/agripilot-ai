export default function ResultsPanel({ result }) {
  if (!result) {
    return (
      <div className="empty-state">
        Log your field zones above and run the advisor to see irrigation, fertilizer,
        and pest guidance here.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div className="summary-card">{result.summary}</div>

      <div className="zone-cards">
        {result.zones.map((zone, i) => (
          <div key={i} className={`zone-card priority-${zone.priority || "low"}`}>
            <div className="zone-card-head">
              <h3>{zone.name}</h3>
              <span className={`risk-pill ${zone.pestRisk || "low"}`}>
                {zone.pestRisk || "low"} risk
              </span>
            </div>

            <div className="zone-card-row">
              <span className="k">Irrigation</span>
              <p className="v">{zone.irrigation}</p>
            </div>

            <div className="zone-card-row">
              <span className="k">Fertilizer</span>
              <p className="v">{zone.fertilizer}</p>
            </div>

            <div className="zone-card-row">
              <span className="k">Pest &amp; disease</span>
              <p className="v">{zone.pestNotes}</p>
            </div>
          </div>
        ))}
      </div>

      {result.sustainabilityTip && (
        <div className="tip-card">↳ {result.sustainabilityTip}</div>
      )}
    </div>
  );
}
