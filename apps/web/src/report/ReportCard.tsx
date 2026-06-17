import type { LocationCoordinate } from "../location-map/types";
import type { CategoryKey, LivabilityReport, Place } from "./types";
import { useLivabilityReport } from "./useLivabilityReport";

type ReportCardProps = {
  location: LocationCoordinate;
  onClose: () => void;
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  essentials: "Daily essentials",
  transport: "Public transport",
  healthcare: "Healthcare",
  education: "Education",
  green_space: "Green space",
};

const CATEGORY_ORDER: CategoryKey[] = [
  "essentials",
  "transport",
  "healthcare",
  "education",
  "green_space",
];

const PLACES_PER_CATEGORY = 3;

export function ReportCard({ location, onClose }: ReportCardProps) {
  const state = useLivabilityReport(location);

  return (
    <aside
      aria-label="Neighborhood report"
      className="absolute bottom-4 left-4 z-10 flex max-h-[calc(100vh-2rem)] w-[min(22rem,calc(100vw-2rem))] flex-col border border-[#17211c21] bg-[#fffdf6] shadow-[0_18px_40px_-18px_rgba(23,33,28,0.45)] sm:bottom-6 sm:left-6 sm:max-h-[calc(100vh-3rem)]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-[#17211c14] px-5 py-4 sm:px-6">
        <div>
          <p className="m-0 font-mono text-xs font-bold tracking-normal text-[#5a6a60] uppercase">
            Report
          </p>
          <p className="mt-0.5 font-mono text-[0.7rem] text-[#5a6a60]">
            {formatCoordinate(location.lat)}, {formatCoordinate(location.lng)}
          </p>
        </div>
        <button
          aria-label="Dismiss report"
          className="-m-1 border-0 bg-transparent p-1 text-[#5a6a60] hover:text-[#17211c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
          >
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </header>

      <div className="overflow-y-auto px-5 py-4 sm:px-6">
        {state.status === "loading" ? <LoadingState /> : null}
        {state.status === "error" ? <ErrorState message={state.error} /> : null}
        {state.status === "success" ? <ReportBody report={state.report} /> : null}
      </div>
    </aside>
  );
}

function LoadingState() {
  return (
    <p className="m-0 font-mono text-[0.78rem] text-[#5a6a60] uppercase">
      Loading nearby places…
    </p>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div>
      <p className="m-0 font-mono text-[0.78rem] text-[#a23a25] uppercase">
        Report failed
      </p>
      <p className="mt-1.5 text-sm text-[#405047]">{message}</p>
    </div>
  );
}

function ReportBody({ report }: { report: LivabilityReport }) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-[#17211c14] pb-3">
        <div>
          <p className="m-0 font-mono text-[0.7rem] font-bold text-[#5a6a60] uppercase">
            Livability score
          </p>
          <p className="m-0 text-4xl font-medium leading-none">
            {report.score}
            <span className="ml-1 text-base text-[#5a6a60]">/100</span>
          </p>
        </div>
        <p className="m-0 font-mono text-[0.7rem] text-[#5a6a60]">
          within {report.radius_meters}m
        </p>
      </div>

      <ul className="mt-3 grid list-none gap-3 p-0">
        {CATEGORY_ORDER.map((key) => (
          <CategorySection
            count={report.counts[key]}
            key={key}
            label={CATEGORY_LABELS[key]}
            places={report.places[key]}
          />
        ))}
      </ul>
    </div>
  );
}

type CategorySectionProps = {
  label: string;
  count: number;
  places: Place[];
};

function CategorySection({ count, label, places }: CategorySectionProps) {
  const top = sortByDistance(places).slice(0, PLACES_PER_CATEGORY);

  return (
    <li>
      <div className="flex items-baseline justify-between">
        <p className="m-0 font-mono text-[0.72rem] font-bold text-[#24352b] uppercase">
          {label}
        </p>
        <p className="m-0 font-mono text-[0.72rem] text-[#5a6a60]">
          {count} nearby
        </p>
      </div>
      {top.length === 0 ? (
        <p className="mt-1 text-[0.85rem] text-[#5a6a60]">
          None within {/* keep empty radius copy minimal */}range.
        </p>
      ) : (
        <ul className="mt-1 grid list-none gap-1 p-0 text-[0.88rem] text-[#24352b]">
          {top.map((place, index) => (
            <li className="flex items-baseline justify-between gap-2" key={index}>
              <span className="truncate">{place.name ?? "Unnamed"}</span>
              <span className="shrink-0 font-mono text-[0.72rem] text-[#5a6a60]">
                {formatDistance(place.distance_meters)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function sortByDistance(places: Place[]): Place[] {
  return [...places].sort((a, b) => a.distance_meters - b.distance_meters);
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters.toString()}m`;
}

function formatCoordinate(value: number): string {
  return value.toFixed(4);
}
