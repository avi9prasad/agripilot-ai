export default function ZoneRow({ zone, index, onChange, onRemove, removable }) {
  const update = (key) => (e) => onChange(index, { ...zone, [key]: e.target.value });

  return (
    <div className="zone-row">
      <div className="zone-num">{String(index + 1).padStart(2, "0")}</div>

      <div className="field">
        <label htmlFor={`name-${index}`}>Zone</label>
        <input
          id={`name-${index}`}
          value={zone.name}
          onChange={update("name")}
          placeholder="Zone A"
        />
      </div>

      <div className="field">
        <label htmlFor={`moisture-${index}`}>Soil moisture %</label>
        <input
          id={`moisture-${index}`}
          type="number"
          min="0"
          max="100"
          value={zone.soilMoisture}
          onChange={update("soilMoisture")}
          placeholder="35"
        />
      </div>

      <div className="field">
        <label htmlFor={`temp-${index}`}>Temp °C</label>
        <input
          id={`temp-${index}`}
          type="number"
          value={zone.temperature}
          onChange={update("temperature")}
          placeholder="24"
        />
      </div>

      <div className="field">
        <label htmlFor={`humidity-${index}`}>Humidity %</label>
        <input
          id={`humidity-${index}`}
          type="number"
          min="0"
          max="100"
          value={zone.humidity}
          onChange={update("humidity")}
          placeholder="55"
        />
      </div>

      <div className="field">
        <label htmlFor={`nutrient-${index}`}>Nutrients</label>
        <select id={`nutrient-${index}`} value={zone.nutrientLevel} onChange={update("nutrientLevel")}>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
        </select>
      </div>

      <button
        type="button"
        className="zone-remove"
        onClick={() => onRemove(index)}
        disabled={!removable}
        aria-label={`Remove zone ${index + 1}`}
        title={removable ? "Remove zone" : "At least one zone is required"}
      >
        ×
      </button>
    </div>
  );
}
