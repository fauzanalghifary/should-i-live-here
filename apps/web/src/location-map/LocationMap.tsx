import "maplibre-gl/dist/maplibre-gl.css";

import "./locationMap.css";
import type { Place } from "../report/types";
import type { LocationCoordinate } from "./types";
import { useLocationMap } from "./useLocationMap";

type LocationMapProps = {
  selectedLocation: LocationCoordinate | null;
  isFetchingReport: boolean;
  categoryPlaces: Place[];
  selectedPlace: Place | null;
  onLocationSelect: (location: LocationCoordinate) => void;
  onEaseEnd: (location: LocationCoordinate) => void;
  onMapPlaceClick: (placeId: string) => void;
};

export type { LocationCoordinate } from "./types";

export function LocationMap({
  isFetchingReport,
  selectedLocation,
  categoryPlaces,
  selectedPlace,
  onLocationSelect,
  onEaseEnd,
  onMapPlaceClick,
}: LocationMapProps) {
  const { containerRef } = useLocationMap({
    categoryPlaces,
    isFetchingReport,
    onEaseEnd,
    onLocationSelect,
    onMapPlaceClick,
    selectedLocation,
    selectedPlace,
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#d8e5d2]">
      <div className="h-full w-full" ref={containerRef} />
    </div>
  );
}
