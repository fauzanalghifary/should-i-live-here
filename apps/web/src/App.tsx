import "./index.css";

const signals = [
  "Daily essentials",
  "Public transport",
  "Healthcare",
  "Green space",
] as const;

export function App() {
  return (
    <main className="grid min-h-screen gap-3.5 bg-[#f4f1e8] p-3.5 text-[#17211c] lg:grid-cols-[minmax(280px,0.86fr)_minmax(420px,1.34fr)] lg:gap-6 lg:p-6">
      <section
        className="flex min-h-[auto] flex-col justify-between border border-[#17211c21] bg-[#fffdf6] p-6 sm:p-7 lg:min-h-[calc(100vh-48px)] lg:p-14"
        aria-labelledby="page-title"
      >
        <div>
          <p className="m-0 font-mono text-xs font-bold tracking-normal text-[#5a6a60] uppercase">
            First-pass neighborhood check
          </p>
          <h1
            id="page-title"
            className="mt-0 mb-6 text-[3.9rem] leading-[0.9] font-medium text-pretty sm:text-[5rem] lg:text-[5.7rem]"
            aria-label="Should I Live Here?"
          >
            <span className="block">Should</span>
            <span className="block">I Live</span>
            <span className="block">Here?</span>
          </h1>
          <p className="m-0 max-w-[43rem] text-[1.06rem] leading-[1.55] text-[#405047] lg:text-[1.18rem]">
            Pick a point on the map, then get a quick report on nearby everyday
            essentials before deciding whether the area is worth deeper
            research.
          </p>
        </div>

        <ul
          className="mt-8 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2 lg:mt-14"
          aria-label="Signals included in the report"
        >
          {signals.map((signal) => (
            <li
              className="border border-[#17211c26] bg-[#eef4df] px-3.5 py-3 text-[0.95rem] text-[#24352b]"
              key={signal}
            >
              {signal}
            </li>
          ))}
        </ul>
      </section>

      <section
        className="grid min-h-[auto] grid-rows-[320px_auto] overflow-hidden border border-[#17211c21] bg-[#fffdf6] sm:grid-rows-[minmax(360px,1fr)_auto] lg:min-h-[calc(100vh-48px)]"
        aria-label="Map and report workspace"
      >
        <div className="relative grid min-h-80 place-items-center border-b border-[#17211c21] bg-[#d8e5d2] font-mono text-[0.82rem] font-bold text-[#405047] uppercase [background-image:linear-gradient(rgba(23,33,28,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(23,33,28,0.08)_1px,transparent_1px)] [background-size:56px_56px] sm:min-h-[420px]">
          <div
            className="pointer-events-none absolute inset-[22px] border border-[#17211c33]"
            aria-hidden="true"
          />
          <div
            className="absolute h-[22px] w-[22px] translate-x-[68px] -translate-y-[42px] rounded-full border-2 border-[#f05d3b] after:absolute after:inset-[5px] after:rounded-full after:bg-[#f05d3b] after:content-['']"
            aria-hidden="true"
          />
          <p className="m-0">Map goes here</p>
        </div>

        <aside className="bg-[#fffdf6] p-7" aria-label="Neighborhood report">
          <p className="m-0 font-mono text-xs font-bold tracking-normal text-[#5a6a60] uppercase">
            Report
          </p>
          <h2 className="mt-0 mb-2.5 text-[2rem] font-medium">
            Waiting for a location
          </h2>
          <p className="m-0 max-w-[46rem] leading-[1.55] text-[#405047]">
            The next step is turning this workspace into an interactive map and
            showing a mocked livability report after a click.
          </p>
        </aside>
      </section>
    </main>
  );
}
