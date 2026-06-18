import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

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
  food_cafe: "Food, Cafe, and Groceries",
  transport: "Public transport",
  healthcare: "Healthcare",
  education: "Education",
  green_space: "Green space",
};

const CATEGORY_ORDER: CategoryKey[] = [
  "food_cafe",
  "transport",
  "healthcare",
  "education",
  "green_space",
];

const DEFAULT_MOBILE_SHEET_HEIGHT = 54;
const MOBILE_SHEET_SNAP_POINTS = [34, DEFAULT_MOBILE_SHEET_HEIGHT, 88] as const;
const MOBILE_SHEET_MIN_HEIGHT = 34;
const MOBILE_SHEET_MAX_HEIGHT = 88;

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
  const [mobileSheetHeight, setMobileSheetHeight] = useState(
    DEFAULT_MOBILE_SHEET_HEIGHT,
  );
  const isDraggingSheetRef = useRef(false);
  const didDragSheetRef = useRef(false);

  useEffect(() => {
    return () => {
      isDraggingSheetRef.current = false;
      document.body.style.userSelect = "";
    };
  }, []);

  if (isLoading) {
    return null;
  }

  const reportStyle = {
    "--report-sheet-height": `${mobileSheetHeight.toString()}svh`,
  } as CSSProperties;

  const updateSheetHeight = (clientY: number) => {
    const viewportHeight = window.innerHeight;
    const nextHeight = clamp(
      ((viewportHeight - clientY) / viewportHeight) * 100,
      MOBILE_SHEET_MIN_HEIGHT,
      MOBILE_SHEET_MAX_HEIGHT,
    );
    setMobileSheetHeight(Math.round(nextHeight));
  };

  const handleSheetPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    isDraggingSheetRef.current = true;
    didDragSheetRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.userSelect = "none";
    updateSheetHeight(event.clientY);
  };

  const handleSheetPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!isDraggingSheetRef.current) {
      return;
    }
    didDragSheetRef.current = true;
    updateSheetHeight(event.clientY);
  };

  const handleSheetPointerUp = () => {
    isDraggingSheetRef.current = false;
    document.body.style.userSelect = "";
    setMobileSheetHeight((height) => nearestSnapPoint(height));
  };

  const handleSheetToggle = () => {
    if (didDragSheetRef.current) {
      didDragSheetRef.current = false;
      return;
    }
    setMobileSheetHeight((height) => nextSnapPoint(height));
  };

  return (
    <aside
      aria-label="Neighborhood report"
      className="report-panel absolute top-0 right-0 z-20 flex h-full w-[480px] max-w-full flex-col border-l border-[#17211c21] bg-[#fffdf6] text-[#17211c] shadow-[-18px_0_50px_-20px_rgba(23,33,28,0.35)]"
      style={reportStyle}
    >
      <button
        aria-label="Resize report panel"
        className="report-sheet-handle"
        onClick={handleSheetToggle}
        onPointerCancel={handleSheetPointerUp}
        onPointerDown={handleSheetPointerDown}
        onPointerMove={handleSheetPointerMove}
        onPointerUp={handleSheetPointerUp}
        type="button"
      >
        <span aria-hidden="true" />
      </button>
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#17211c14] px-6 py-5">
        <div>
          <p className="m-0 font-mono text-xs font-bold tracking-normal text-[#5a6a60] uppercase">
            Report
          </p>
          {report ? (
            <p className="mt-2 font-mono text-[0.7rem] text-[#5a6a60]">
              within {report.radius_meters}m of the marker
            </p>
          ) : null}
        </div>
        <button
          className="shrink-0 border border-[#17211c] bg-[#17211c] px-3.5 py-2 font-mono text-[0.7rem] font-bold tracking-wider text-[#fffdf6] uppercase transition-colors hover:bg-[#24352b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
          onClick={onClose}
          type="button"
        >
          Reset selection
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function nearestSnapPoint(height: number) {
  return MOBILE_SHEET_SNAP_POINTS.reduce((nearest, snapPoint) => {
    const nearestDistance = Math.abs(nearest - height);
    const snapDistance = Math.abs(snapPoint - height);
    return snapDistance < nearestDistance ? snapPoint : nearest;
  }, DEFAULT_MOBILE_SHEET_HEIGHT);
}

function nextSnapPoint(height: number) {
  const currentIndex = MOBILE_SHEET_SNAP_POINTS.findIndex(
    (snapPoint) => snapPoint === nearestSnapPoint(height),
  );
  const nextIndex = (currentIndex + 1) % MOBILE_SHEET_SNAP_POINTS.length;
  return MOBILE_SHEET_SNAP_POINTS[nextIndex] ?? DEFAULT_MOBILE_SHEET_HEIGHT;
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
