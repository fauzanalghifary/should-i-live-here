import { lazy, Suspense, useMemo, useState } from "react";

import type { LocationCoordinate } from "./location-map/types";
import { ReportCard } from "./report/ReportCard";
import type { CategoryKey, Place } from "./report/types";
import { useLivabilityReport } from "./report/useLivabilityReport";
import "./index.css";

const DEFAULT_CATEGORY: CategoryKey = "essentials";

const LocationMap = lazy(async () => {
  const module = await import("./location-map/LocationMap");

  return { default: module.LocationMap };
});

export function App() {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationCoordinate | null>(null);
  const [queryLocation, setQueryLocation] = useState<LocationCoordinate | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(
    DEFAULT_CATEGORY,
  );
  const [showIntro, setShowIntro] = useState(true);
  const reportQuery = useLivabilityReport(queryLocation);

  const mapPlaces = useMemo<Place[]>(() => {
    if (!reportQuery.data || activeCategory === null) {
      return [];
    }
    return reportQuery.data.places[activeCategory];
  }, [reportQuery.data, activeCategory]);

  const handleDismissIntro = () => {
    setShowIntro(false);
  };

  const handleSelectLocation = (location: LocationCoordinate) => {
    setQueryLocation(null);
    setSelectedLocation(location);
    setActiveCategory(DEFAULT_CATEGORY);
  };

  const handleCloseReport = () => {
    setSelectedLocation(null);
    setQueryLocation(null);
    setActiveCategory(DEFAULT_CATEGORY);
  };

  const handleEaseEnd = (location: LocationCoordinate) => {
    setQueryLocation(location);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#f4f1e8] text-[#17211c]">
      <div className="absolute inset-0">
        <Suspense fallback={<MapLoadingState />}>
          <LocationMap
            categoryPlaces={mapPlaces}
            isFetchingReport={reportQuery.isLoading}
            onEaseEnd={handleEaseEnd}
            onLocationSelect={handleSelectLocation}
            selectedLocation={selectedLocation}
          />
        </Suspense>
      </div>

      {queryLocation !== null ? (
        <ReportCard
          activeCategory={activeCategory}
          error={reportQuery.error}
          isLoading={reportQuery.isLoading}
          onActiveCategoryChange={setActiveCategory}
          onClose={handleCloseReport}
          report={reportQuery.data}
        />
      ) : null}

      {showIntro ? <IntroModal onDismiss={handleDismissIntro} /> : null}
    </main>
  );
}

type IntroModalProps = {
  onDismiss: () => void;
};

function IntroModal({ onDismiss }: IntroModalProps) {
  return (
    <div
      aria-labelledby="intro-title"
      aria-modal="true"
      className="absolute inset-0 z-20 grid place-items-center bg-[#17211c]/40 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-[34rem] border border-[#17211c21] bg-[#fffdf6] p-7 shadow-[0_24px_60px_-20px_rgba(23,33,28,0.35)] sm:p-9">
        <p className="m-0 font-mono text-xs font-bold tracking-normal text-[#5a6a60] uppercase">
          First-pass neighborhood check
        </p>
        <h1
          aria-label="Should I Live Here?"
          className="mt-2 mb-5 text-[2.4rem] leading-[0.95] font-medium sm:text-[3rem]"
          id="intro-title"
        >
          Should I Live Here?
        </h1>
        <p className="m-0 text-[1.02rem] leading-[1.55] text-[#405047]">
          Pick a point on the map, then get a quick report on nearby everyday
          essentials.
        </p>

        <button
          className="mt-7 inline-flex w-full items-center justify-center border border-[#17211c] bg-[#17211c] px-5 py-3 font-mono text-xs font-bold tracking-wider text-[#fffdf6] uppercase transition-colors hover:bg-[#24352b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
          onClick={onDismiss}
          type="button"
        >
          Got it — show the map
        </button>
      </div>
    </div>
  );
}

function MapLoadingState() {
  return (
    <div className="grid h-full w-full place-items-center bg-[#d8e5d2] font-mono text-[0.72rem] font-bold text-[#405047] uppercase">
      Loading map
    </div>
  );
}
