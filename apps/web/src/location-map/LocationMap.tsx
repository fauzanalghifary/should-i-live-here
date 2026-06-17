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
    <div className="relative h-full w-full overflow-hidden bg-[#d8e5d2]">
      <div className="h-full w-full" ref={containerRef} />
    </div>
  );
}
