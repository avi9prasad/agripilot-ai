import { useState } from "react";
import ZoneRow from "./components/ZoneRow.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import BenchmarkPanel from "./components/BenchmarkPanel.jsx";

const emptyZone = () => ({
  name: "",
  soilMoisture: "",
  temperature: "",
  humidity: "",
  nutrientLevel: "moderate",
});

export default function App() {
  const [context, setContext] = useState({
    cropType: "",
    growthStage: "vegetative",
    region: "",
  });
  const [zones, setZones] = useState([emptyZone()]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");

  const updateContext = (key) => (e) =>
    setContext((c) => ({ ...c, [key]: e.target.value }));

  const updateZone = (index, next) =>
    setZones((zs) => zs.map((z, i) => (i === index ? next : z)));

  const addZone = () => setZones((zs) => [...zs, emptyZone()]);

  const removeZone = (index) =>
    setZones((zs) => (zs.length > 1 ? zs.filter((_, i) => i !== index) : zs));

  const canSubmit = zones.every((z) => z.name.trim()) && status !== "loading";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/advisor/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, zones }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setStatus("error");
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">AgriPilotAI — field advisor</p>
          <h1 className="hero-title">Read the field before it tells you.</h1>
          <p className="hero-sub">
            Log soil moisture, temperature, humidity, and nutrient status per zone.
            AgriPilotAI turns that into concrete irrigation, fertilizer, and pest
            guidance — the way an agronomist would read it, in seconds instead of days.
          </p>
        </div>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "2rem" }}>
          <section>
            <div className="panel-label">
              <span className="idx">01</span>
              <h2>Farm context</h2>
            </div>
            <div className="context-grid">
              <div className="field">
                <label htmlFor="cropType">Crop</label>
                <input
                  id="cropType"
                  value={context.cropType}
                  onChange={updateContext("cropType")}
                  placeholder="Wheat"
                />
              </div>
              <div className="field">
                <label htmlFor="growthStage">Growth stage</label>
                <select
                  id="growthStage"
                  value={context.growthStage}
                  onChange={updateContext("growthStage")}
                >
                  <option value="seedling">Seedling</option>
                  <option value="vegetative">Vegetative</option>
                  <option value="flowering">Flowering</option>
                  <option value="reproductive">Reproductive</option>
                  <option value="harvest">Near harvest</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="region">Region</label>
                <input
                  id="region"
                  value={context.region}
                  onChange={updateContext("region")}
                  placeholder="Punjab, India"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="panel-label">
              <span className="idx">02</span>
              <h2>Zone log</h2>
            </div>

            <div className="ledger-header">
              <span></span>
              <span>Zone</span>
              <span>Moisture</span>
              <span>Temp</span>
              <span>Humidity</span>
              <span>Nutrients</span>
              <span></span>
            </div>
            <div className="ledger">
              {zones.map((zone, i) => (
                <ZoneRow
                  key={i}
                  zone={zone}
                  index={i}
                  onChange={updateZone}
                  onRemove={removeZone}
                  removable={zones.length > 1}
                />
              ))}
            </div>

            <button type="button" className="add-zone" onClick={addZone}>
              + add another zone
            </button>
          </section>

          <div className="submit-row">
            <button type="submit" className="submit-btn" disabled={!canSubmit}>
              {status === "loading" ? "Analyzing…" : "Run advisor"}
            </button>
            {status === "loading" && (
              <span className="status-text scanning">Scanning zones</span>
            )}
            {status === "error" && <span className="error-text">{errorMsg}</span>}
          </div>
        </form>

        <section>
          <div className="panel-label">
            <span className="idx">03</span>
            <h2>Recommendations</h2>
          </div>
          <ResultsPanel result={result} />
        </section>

        {result && (result.yieldBenchmark || result.soilFacts) && (
          <BenchmarkPanel yieldBenchmark={result.yieldBenchmark} soilFacts={result.soilFacts} />
        )}
      </main>

      <footer>AgriPilotAI — built for the WeMakeDevs × Zerops Challenge</footer>
    </div>
  );
}