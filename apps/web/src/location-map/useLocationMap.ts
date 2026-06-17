import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type {
  Map as MapLibreMap,
  MapMouseEvent,
  Marker,
  Popup,
  StyleSpecification,
} from "maplibre-gl";

import {
  indonesiaViewBounds,
  isPointInIndonesia,
  loadIndonesiaBoundary,
  type IndonesiaBoundary,
} from "./indonesiaBoundary";
import {
  createSelectedMarkerElement,
  createUnsupportedLocationPopupElement,
} from "./mapElements";
import type { LocationCoordinate } from "./types";

type UseLocationMapParams = {
  selectedLocation: LocationCoordinate | null;
  onLocationSelect: (location: LocationCoordinate) => void;
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

export function useLocationMap({
  selectedLocation,
  onLocationSelect,
}: UseLocationMapParams) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const indonesiaBoundaryRef = useRef<IndonesiaBoundary | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const map = new maplibregl.Map({
      attributionControl: false,
      bounds: indonesiaViewBounds,
      container,
      fitBoundsOptions: {
        padding: 24,
      },
      minZoom: 3,
      renderWorldCopies: false,
      style: mapStyle,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      void loadIndonesiaBoundary().then((boundary) => {
        indonesiaBoundaryRef.current = boundary;
      });
    });

    map.on("click", (event: MapMouseEvent) => {
      const boundary = indonesiaBoundaryRef.current;

      if (!boundary) {
        return;
      }

      if (!isPointInIndonesia(event.lngLat.lng, event.lngLat.lat, boundary)) {
        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({
          className: "location-map-popup",
          closeButton: false,
          closeOnClick: true,
          offset: 16,
        })
          .setLngLat(event.lngLat)
          .setDOMContent(
            createUnsupportedLocationPopupElement(
              event.lngLat.lng,
              event.lngLat.lat,
            ),
          )
          .addTo(map);
        return;
      }

      popupRef.current?.remove();
      popupRef.current = null;

      onLocationSelect({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
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

    const surroundingZoom = 13;
    map.easeTo({
      center: lngLat,
      duration: 2000,
      zoom: Math.max(map.getZoom(), surroundingZoom),
    });
  }, [selectedLocation]);

  return { containerRef };
}
