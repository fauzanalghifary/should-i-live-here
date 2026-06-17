import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type {
  Map as MapLibreMap,
  MapMouseEvent,
  Marker,
  StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type LocationCoordinate = {
  lat: number;
  lng: number;
};

type LocationMapProps = {
  selectedLocation: LocationCoordinate | null;
  onLocationSelect: (location: LocationCoordinate) => void;
};

const defaultCenter: LocationCoordinate = {
  lat: -6.2088,
  lng: 106.8456,
};

const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    "osm-raster-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-raster-tiles",
      type: "raster",
      source: "osm-raster-tiles",
    },
  ],
};

export function LocationMap({
  selectedLocation,
  onLocationSelect,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const map = new maplibregl.Map({
      attributionControl: false,
      center: [defaultCenter.lng, defaultCenter.lat],
      container,
      style: mapStyle,
      zoom: 13,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("click", (event: MapMouseEvent) => {
      onLocationSelect({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [onLocationSelect]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!selectedLocation) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const lngLat: [number, number] = [
      selectedLocation.lng,
      selectedLocation.lat,
    ];

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        anchor: "center",
        element: createSelectedMarkerElement(),
      })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      markerRef.current.setLngLat(lngLat);
    }

    map.easeTo({
      center: lngLat,
      duration: 450,
    });
  }, [selectedLocation]);

  return (
    <div className="relative min-h-80 overflow-hidden border-b border-[#17211c21] bg-[#d8e5d2] sm:min-h-[420px]">
      <div className="h-full min-h-80 sm:min-h-[420px]" ref={containerRef} />
      <div className="pointer-events-none absolute top-4 left-4 z-[1] border border-[#17211c21] bg-[#fffdf6]/90 px-3 py-2 font-mono text-[0.72rem] font-bold text-[#405047] uppercase backdrop-blur-sm">
        Click anywhere to inspect
      </div>
    </div>
  );
}

function createSelectedMarkerElement() {
  const element = document.createElement("div");
  element.style.width = "22px";
  element.style.height = "22px";
  element.style.border = "3px solid #fffdf6";
  element.style.borderRadius = "999px";
  element.style.background = "#f05d3b";
  element.style.boxShadow = "0 0 0 3px rgba(240, 93, 59, 0.2)";

  return element;
}
