import "./index.css";

const signals = [
  "Daily essentials",
  "Public transport",
  "Healthcare",
  "Green space",
] as const;

export function App() {
  return (
    <main className="app-shell">
      <section className="intro-panel" aria-labelledby="page-title">
        <p className="eyebrow">First-pass neighborhood check</p>
        <h1 id="page-title" aria-label="Should I Live Here?">
          <span>Should</span>
          <span>I Live</span>
          <span>Here?</span>
        </h1>
        <p className="lede">
          Pick a point on the map, then get a quick report on nearby everyday
          essentials before deciding whether the area is worth deeper research.
        </p>

        <ul className="signal-list" aria-label="Signals included in the report">
          {signals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </section>

      <section className="workspace" aria-label="Map and report workspace">
        <div className="map-placeholder">
          <div className="map-grid" aria-hidden="true" />
          <div className="target-marker" aria-hidden="true" />
          <p>Map goes here</p>
        </div>

        <aside className="report-placeholder" aria-label="Neighborhood report">
          <p className="report-label">Report</p>
          <h2>Waiting for a location</h2>
          <p>
            The next step is turning this workspace into an interactive map and
            showing a mocked livability report after a click.
          </p>
        </aside>
      </section>
    </main>
  );
}
