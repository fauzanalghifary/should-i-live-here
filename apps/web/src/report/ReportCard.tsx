import type { CategoryKey, LivabilityReport, Place } from "./types";

type ReportCardProps = {
  report: LivabilityReport | undefined;
  error: Error | null;
  isLoading: boolean;
  activeCategory: CategoryKey | null;
  selectedPlace: Place | null;
  onActiveCategoryChange: (category: CategoryKey | null) => void;
  onPlaceSelect: (place: Place | null) => void;
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

export function ReportCard({
  activeCategory,
  error,
  isLoading,
  onActiveCategoryChange,
  onClose,
  onPlaceSelect,
  report,
  selectedPlace,
}: ReportCardProps) {
  if (isLoading) {
    return null;
  }

  return (
    <aside
      aria-label="Neighborhood report"
      className="report-sidebar-in absolute top-0 right-0 z-20 flex h-full w-[420px] max-w-full flex-col border-l border-[#17211c21] bg-[#fffdf6] text-[#17211c] shadow-[-18px_0_50px_-20px_rgba(23,33,28,0.35)]"
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#17211c14] px-6 py-5">
        <div>
          <p className="m-0 font-mono text-xs font-bold tracking-normal text-[#5a6a60] uppercase">
            Report
          </p>
          {report ? (
            <>
              <p className="m-0 mt-2 text-[3.4rem] leading-none font-medium">
                {report.score}
                <span className="ml-1 text-lg text-[#5a6a60]">/100</span>
              </p>
              <p className="mt-2 font-mono text-[0.7rem] text-[#5a6a60]">
                within {report.radius_meters}m of the marker
              </p>
            </>
          ) : null}
        </div>
        <button
          className="shrink-0 border border-[#17211c] bg-[#17211c] px-3.5 py-2 font-mono text-[0.7rem] font-bold tracking-wider text-[#fffdf6] uppercase transition-colors hover:bg-[#24352b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
          onClick={onClose}
          type="button"
        >
          Pick another
        </button>
      </header>

      {error ? (
        <div className="px-6 pt-4">
          <ErrorState message={error.message} />
        </div>
      ) : null}

      {report ? (
        <div className="flex-1 overflow-y-auto">
          {CATEGORY_ORDER.map((key) => {
            const isExpanded = key === activeCategory;
            return (
              <CategorySection
                categoryKey={key}
                count={report.counts[key]}
                isExpanded={isExpanded}
                key={key}
                label={CATEGORY_LABELS[key]}
                onPlaceSelect={onPlaceSelect}
                onToggle={() => {
                  onActiveCategoryChange(isExpanded ? null : key);
                }}
                places={report.places[key]}
                radiusMeters={report.radius_meters}
                selectedPlace={selectedPlace}
              />
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}

type CategorySectionProps = {
  categoryKey: CategoryKey;
  label: string;
  count: number;
  isExpanded: boolean;
  places: Place[];
  radiusMeters: number;
  selectedPlace: Place | null;
  onToggle: () => void;
  onPlaceSelect: (place: Place | null) => void;
};

function CategorySection({
  categoryKey,
  count,
  isExpanded,
  label,
  onPlaceSelect,
  onToggle,
  places,
  radiusMeters,
  selectedPlace,
}: CategorySectionProps) {
  const sortedPlaces = sortByDistance(places);
  const sectionId = `report-section-${categoryKey}`;

  return (
    <section className="border-b border-[#17211c14] last:border-b-0">
      <h3 className="m-0">
        <button
          aria-controls={sectionId}
          aria-expanded={isExpanded}
          className={[
            "flex w-full items-baseline justify-between gap-2 px-6 py-3 text-left transition-colors",
            isExpanded
              ? "bg-[#17211c] text-[#fffdf6]"
              : "bg-[#fbf8ef] text-[#24352b] hover:bg-[#f0eadf]",
          ].join(" ")}
          onClick={onToggle}
          type="button"
        >
          <span className="font-mono text-[0.72rem] font-bold tracking-wider uppercase">
            {label}
          </span>
          <span className="flex items-baseline gap-2.5">
            <span
              className={`font-mono text-[0.7rem] ${isExpanded ? "text-[#fffdf6]/70" : "text-[#5a6a60]"}`}
            >
              {count} nearby
            </span>
            <Chevron expanded={isExpanded} />
          </span>
        </button>
      </h3>
      {isExpanded ? (
        <div id={sectionId}>
          {sortedPlaces.length === 0 ? (
            <p className="m-0 px-6 py-3 text-[0.85rem] text-[#5a6a60]">
              None within {radiusMeters}m.
            </p>
          ) : (
            <ol className="m-0 list-none p-0">
              {sortedPlaces.map((place, index) => {
                const isSelected = selectedPlace === place;
                return (
                  <li className="m-0" key={index}>
                    <button
                      aria-expanded={isSelected}
                      className={[
                        "flex w-full items-baseline gap-3 px-6 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-[#eef4df]"
                          : "hover:bg-[#f6f3ea]",
                      ].join(" ")}
                      onClick={() => {
                        onPlaceSelect(isSelected ? null : place);
                      }}
                      type="button"
                    >
                      <span className="w-5 shrink-0 font-mono text-[0.75rem] text-[#5a6a60]">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate text-[0.92rem] text-[#24352b]">
                        {place.name ?? "Unnamed"}
                      </span>
                      <span className="shrink-0 font-mono text-[0.7rem] text-[#5a6a60]">
                        {formatWalk(place.distance_meters)}
                      </span>
                    </button>
                    {isSelected ? <PlaceDetails place={place} /> : null}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  );
}

function PlaceDetails({ place }: { place: Place }) {
  return (
    <div className="border-y border-[#17211c14] bg-[#fbf8ef] px-6 py-3">
      {place.address ? (
        <p className="m-0 text-[0.82rem] leading-snug text-[#405047]">
          {place.address}
        </p>
      ) : null}
      <p className="m-0 mt-2 font-mono text-[0.7rem] font-bold text-[#24352b] uppercase">
        {formatWalk(place.distance_meters)} · {place.distance_meters}m
      </p>
      {place.categories && place.categories.length > 0 ? (
        <ul className="mt-2 flex list-none flex-wrap gap-1 p-0">
          {place.categories.slice(0, 4).map((category) => (
            <li
              className="border border-[#17211c1f] bg-[#fffdf6] px-2 py-0.5 font-mono text-[0.66rem] text-[#24352b]"
              key={category}
            >
              {formatCategoryTag(category)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none"
      height="12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="12"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
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

function sortByDistance(places: Place[]): Place[] {
  return [...places].sort((a, b) => a.distance_meters - b.distance_meters);
}

function formatWalk(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / 80));
  return `${minutes.toString()} min walk`;
}

function formatCategoryTag(category: string): string {
  return category.replace(/[._]/g, " ");
}
