import { CategorySection } from "./CategorySection";
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
