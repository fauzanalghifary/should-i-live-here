import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";

import {
  circlePolygon,
  emptyFeatureCollection,
  sweepPolygon,
} from "./geometry";
import type { LocationCoordinate } from "./types";
import type { Place } from "../report/types";

export const SEARCH_RADIUS_METERS = 2000;
export const FILL_OPACITY_IDLE = 0.08;
export const LINE_OPACITY_IDLE = 0.5;
export const SWEEP_SPAN_DEG = 50;
export const SWEEP_DEG_PER_SECOND = 240;

const SEARCH_RADIUS_SOURCE = "search-radius";
const SEARCH_RADIUS_FILL = "search-radius-fill";
const SEARCH_RADIUS_LINE = "search-radius-line";
const SEARCH_SWEEP_SOURCE = "search-sweep";
const SEARCH_SWEEP_FILL = "search-sweep-fill";
const CATEGORY_PLACES_SOURCE = "category-places";
export const CATEGORY_PLACES_LAYER = "category-places-circles";
const CATEGORY_PLACES_LABEL = "category-places-labels";
const SELECTED_PLACE_SOURCE = "selected-place";
const SELECTED_PLACE_HALO = "selected-place-halo";
const SELECTED_PLACE_FILL = "selected-place-fill";

export function addOverlayLayers(map: MapLibreMap) {
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

  map.addSource(CATEGORY_PLACES_SOURCE, {
    type: "geojson",
    data: emptyFeatureCollection(),
  });
  map.addLayer({
    id: CATEGORY_PLACES_LAYER,
    type: "circle",
    source: CATEGORY_PLACES_SOURCE,
    paint: {
      "circle-radius": 7,
      "circle-color": "#fffdf6",
      "circle-stroke-color": "#17211c",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: CATEGORY_PLACES_LABEL,
    type: "symbol",
    source: CATEGORY_PLACES_SOURCE,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 11,
      "text-offset": [0, 1.3],
      "text-anchor": "top",
      "text-optional": true,
    },
    paint: {
      "text-color": "#17211c",
      "text-halo-color": "#fffdf6",
      "text-halo-width": 1.5,
    },
  });

  map.addSource(SELECTED_PLACE_SOURCE, {
    type: "geojson",
    data: emptyFeatureCollection(),
  });
  map.addLayer({
    id: SELECTED_PLACE_HALO,
    type: "circle",
    source: SELECTED_PLACE_SOURCE,
    paint: {
      "circle-radius": 16,
      "circle-color": "#1d4ed8",
      "circle-opacity": 0.18,
    },
  });
  map.addLayer({
    id: SELECTED_PLACE_FILL,
    type: "circle",
    source: SELECTED_PLACE_SOURCE,
    paint: {
      "circle-radius": 9,
      "circle-color": "#1d4ed8",
      "circle-stroke-color": "#fffdf6",
      "circle-stroke-width": 3,
    },
  });
}

export function renderSearchRadius(
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

export function renderSearchSweep(
  map: MapLibreMap,
  lng: number,
  lat: number,
  startBearingDeg: number,
) {
  const source = map.getSource(SEARCH_SWEEP_SOURCE);
  if (!(source instanceof maplibregl.GeoJSONSource)) {
    return;
  }
  source.setData(
    sweepPolygon(
      lng,
      lat,
      SEARCH_RADIUS_METERS,
      startBearingDeg,
      SWEEP_SPAN_DEG,
    ),
  );
}

export function clearSearchSweep(map: MapLibreMap) {
  const source = map.getSource(SEARCH_SWEEP_SOURCE);
  if (!(source instanceof maplibregl.GeoJSONSource)) {
    return;
  }
  source.setData(emptyFeatureCollection());
}

export function renderCategoryPlaces(map: MapLibreMap, places: Place[]) {
  const source = map.getSource(CATEGORY_PLACES_SOURCE);
  if (!(source instanceof maplibregl.GeoJSONSource)) {
    return;
  }
  source.setData({
    type: "FeatureCollection",
    features: places.map(
      (place): GeoJSON.Feature<GeoJSON.Point> => ({
        type: "Feature",
        properties: { name: place.name ?? "", id: place.id ?? "" },
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      }),
    ),
  });
}

export function renderSelectedPlace(map: MapLibreMap, place: Place | null) {
  const source = map.getSource(SELECTED_PLACE_SOURCE);
  if (!(source instanceof maplibregl.GeoJSONSource)) {
    return;
  }
  if (!place) {
    source.setData(emptyFeatureCollection());
    return;
  }
  source.setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: place.name ?? "" },
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      },
    ],
  });
}
