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
  const { data, error, isLoading } = useLivabilityReport(location);

  if (isLoading) {
    return null;
  }

  return (
    <div
      aria-labelledby="report-title"
      aria-modal="true"
      className="report-sheet-in absolute inset-x-0 bottom-0 z-20 flex h-[80vh] flex-col border-t border-[#17211c21] bg-[#fffdf6] text-[#17211c] shadow-[0_-24px_60px_-24px_rgba(23,33,28,0.35)]"
      role="dialog"
    >
      <header className="flex items-start justify-between gap-4 border-b border-[#17211c14] px-6 py-5 sm:px-10 sm:py-6">
        <div>
          <p className="m-0 font-mono text-xs font-bold tracking-normal text-[#5a6a60] uppercase">
            Report
          </p>
        </div>
        <button
          className="shrink-0 border border-[#17211c] bg-[#17211c] px-4 py-2.5 font-mono text-[0.72rem] font-bold tracking-wider text-[#fffdf6] uppercase transition-colors hover:bg-[#24352b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c] sm:px-5 sm:py-3"
          onClick={onClose}
          type="button"
        >
          Pick another location
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
        {error ? <ErrorState message={error.message} /> : null}
        {data ? <ReportBody report={data} /> : null}
      </div>
    </div>
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
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(220px,260px)_1fr] lg:gap-12">
      <div className="border-b border-[#17211c14] pb-6 lg:border-r lg:border-b-0 lg:pr-12 lg:pb-0">
        <p className="m-0 font-mono text-[0.7rem] font-bold text-[#5a6a60] uppercase">
          Livability score
        </p>
        <p className="m-0 mt-2 text-[5rem] leading-none font-medium">
          {report.score}
          <span className="ml-1 text-xl text-[#5a6a60]">/100</span>
        </p>
        <p className="mt-3 font-mono text-[0.72rem] text-[#5a6a60]">
          within {report.radius_meters}m of the marker
        </p>
      </div>

      <ul className="grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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
    <li className="border border-[#17211c14] bg-[#fbf8ef] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="m-0 font-mono text-[0.72rem] font-bold text-[#24352b] uppercase">
          {label}
        </p>
        <p className="m-0 font-mono text-[0.72rem] text-[#5a6a60]">
          {count} nearby
        </p>
      </div>
      {top.length === 0 ? (
        <p className="mt-2 text-[0.85rem] text-[#5a6a60]">None within range.</p>
      ) : (
        <ul className="mt-2 grid list-none gap-1.5 p-0 text-[0.9rem] text-[#24352b]">
          {top.map((place, index) => (
            <li
              className="flex items-baseline justify-between gap-2"
              key={index}
            >
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
