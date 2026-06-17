import "maplibre-gl/dist/maplibre-gl.css";

import "./locationMap.css";
import type { LocationCoordinate } from "./types";
import { useLocationMap } from "./useLocationMap";

type LocationMapProps = {
  selectedLocation: LocationCoordinate | null;
  onLocationSelect: (location: LocationCoordinate) => void;
};

export type { LocationCoordinate } from "./types";

export function LocationMap({
  selectedLocation,
  onLocationSelect,
}: LocationMapProps) {
  const { containerRef } = useLocationMap({
    onLocationSelect,
    selectedLocation,
  });

  return (
    <div className="relative min-h-80 overflow-hidden border-b border-[#17211c21] bg-[#d8e5d2] sm:min-h-[420px]">
      <div className="h-full min-h-80 sm:min-h-[420px]" ref={containerRef} />
      <div className="pointer-events-none absolute top-4 left-4 z-[1] border border-[#17211c21] bg-[#fffdf6]/90 px-3 py-2 font-mono text-[0.72rem] font-bold text-[#405047] uppercase backdrop-blur-sm">
        Click anywhere to inspect
      </div>
    </div>
  );
}
