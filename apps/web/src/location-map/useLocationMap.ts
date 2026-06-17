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
import { useLivabilityReport } from "../report/useLivabilityReport";

type UseLocationMapParams = {
  selectedLocation: LocationCoordinate | null;
  onLocationSelect: (location: LocationCoordinate) => void;
};

const FILL_OPACITY_IDLE = 0.08;
const LINE_OPACITY_IDLE = 0.5;

const SEARCH_RADIUS_METERS = 1000;
const SEARCH_RADIUS_SOURCE = "search-radius";
const SEARCH_RADIUS_FILL = "search-radius-fill";
const SEARCH_RADIUS_LINE = "search-radius-line";
const SEARCH_SWEEP_SOURCE = "search-sweep";
const SEARCH_SWEEP_FILL = "search-sweep-fill";
const SWEEP_SPAN_DEG = 50;
const SWEEP_DEG_PER_SECOND = 240;

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
  const { isLoading: loading } = useLivabilityReport(selectedLocation);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const indonesiaBoundaryRef = useRef<IndonesiaBoundary | null>(null);
  const styleReadyRef = useRef(false);
  const selectedLocationRef = useRef<LocationCoordinate | null>(selectedLocation);

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

      map.addSource(SEARCH_RADIUS_SOURCE, {
        type: "geojson",
        data: emptyFeatureCollection(),
      });
      map.addLayer({
        id: SEARCH_RADIUS_FILL,
        type: "fill",
        source: SEARCH_RADIUS_SOURCE,
        paint: {
          "fill-color": "#17211c",
          "fill-opacity": FILL_OPACITY_IDLE,
        },
      });
      map.addLayer({
        id: SEARCH_RADIUS_LINE,
        type: "line",
        source: SEARCH_RADIUS_SOURCE,
        paint: {
          "line-color": "#17211c",
          "line-width": 2,
          "line-opacity": LINE_OPACITY_IDLE,
        },
      });
      map.addSource(SEARCH_SWEEP_SOURCE, {
        type: "geojson",
        data: emptyFeatureCollection(),
      });
      map.addLayer({
        id: SEARCH_SWEEP_FILL,
        type: "fill",
        source: SEARCH_SWEEP_SOURCE,
        paint: {
          "fill-color": "#17211c",
          "fill-opacity": 0.22,
        },
      });

      styleReadyRef.current = true;
      renderSearchRadius(map, selectedLocationRef.current);
    });

    map.on("click", (event: MapMouseEvent) => {
      if (selectedLocationRef.current !== null) {
        return;
      }

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
      styleReadyRef.current = false;
      map.remove();
    };
  }, [onLocationSelect]);

  useEffect(() => {
    selectedLocationRef.current = selectedLocation;

    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!selectedLocation) {
      markerRef.current?.remove();
      markerRef.current = null;
      if (styleReadyRef.current) {
        renderSearchRadius(map, null);
      }
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

    if (styleReadyRef.current) {
      renderSearchRadius(map, selectedLocation);
    }

    const surroundingZoom = 13;
    map.easeTo({
      center: lngLat,
      duration: 2000,
      zoom: Math.max(map.getZoom(), surroundingZoom),
    });
  }, [selectedLocation]);

  useEffect(() => {
    if (!loading) {
      return undefined;
    }

    let frameId: number | null = null;
    let cancelled = false;
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) {
        return;
      }
      const map = mapRef.current;
      const location = selectedLocationRef.current;
      if (map && styleReadyRef.current && location) {
        const source = map.getSource(SEARCH_SWEEP_SOURCE);
        if (source instanceof maplibregl.GeoJSONSource) {
          const elapsedSec = (now - start) / 1000;
          const bearing = (elapsedSec * SWEEP_DEG_PER_SECOND) % 360;
          source.setData(
            sweepPolygon(
              location.lng,
              location.lat,
              SEARCH_RADIUS_METERS,
              bearing,
              SWEEP_SPAN_DEG,
            ),
          );
        }
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      const map = mapRef.current;
      if (map && styleReadyRef.current) {
        const source = map.getSource(SEARCH_SWEEP_SOURCE);
        if (source instanceof maplibregl.GeoJSONSource) {
          source.setData(emptyFeatureCollection());
        }
      }
    };
  }, [loading]);

  return { containerRef };
}

function renderSearchRadius(
  map: MapLibreMap,
  location: LocationCoordinate | null,
) {
  const source = map.getSource(SEARCH_RADIUS_SOURCE);
  if (!(source instanceof maplibregl.GeoJSONSource)) {
    return;
  }
  if (!location) {
    source.setData(emptyFeatureCollection());
    return;
  }
  source.setData(
    circlePolygon(location.lng, location.lat, SEARCH_RADIUS_METERS),
  );
}

function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function sweepPolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
  startBearingDeg: number,
  spanDeg: number,
  steps = 16,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: GeoJSON.Position[] = [[lng, lat]];
  for (let i = 0; i <= steps; i++) {
    const bearing = startBearingDeg + (spanDeg * i) / steps;
    coords.push(lngLatAtBearing(lng, lat, radiusMeters, bearing));
  }
  coords.push([lng, lat]);
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

function circlePolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: GeoJSON.Position[] = [];
  for (let i = 0; i < points; i++) {
    coords.push(lngLatAtBearing(lng, lat, radiusMeters, (i / points) * 360));
  }
  const first = coords[0];
  if (first) {
    coords.push(first);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

function lngLatAtBearing(
  lng: number,
  lat: number,
  meters: number,
  bearingDeg: number,
): GeoJSON.Position {
  const earthRadius = 6378137;
  const delta = meters / earthRadius;
  const theta = (bearingDeg * Math.PI) / 180;
  const phi1 = (lat * Math.PI) / 180;
  const lambda1 = (lng * Math.PI) / 180;
  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) +
      Math.cos(phi1) * Math.sin(delta) * Math.cos(theta),
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
    );
  return [(lambda2 * 180) / Math.PI, (phi2 * 180) / Math.PI];
}
