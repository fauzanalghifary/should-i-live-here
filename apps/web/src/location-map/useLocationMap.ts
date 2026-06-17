import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type {
  Map as MapLibreMap,
  MapMouseEvent,
  Marker,
  Popup,
} from "maplibre-gl";

import {
  indonesiaViewBounds,
  isPointInIndonesia,
  loadIndonesiaBoundary,
  type IndonesiaBoundary,
} from "./indonesiaBoundary";
import { distanceMeters } from "./geometry";
import {
  createRepickPopupElement,
  createSelectedMarkerElement,
  createUnsupportedLocationPopupElement,
} from "./mapElements";
import { mapStyle } from "./mapStyle";
import {
  CATEGORY_PLACES_LAYER,
  SEARCH_RADIUS_METERS,
  SWEEP_DEG_PER_SECOND,
  addOverlayLayers,
  clearSearchSweep,
  renderCategoryPlaces,
  renderSearchRadius,
  renderSearchSweep,
  renderSelectedPlace,
} from "./mapOverlays";
import type { LocationCoordinate } from "./types";
import type { Place } from "../report/types";

type UseLocationMapParams = {
  selectedLocation: LocationCoordinate | null;
  isFetchingReport: boolean;
  categoryPlaces: Place[];
  selectedPlace: Place | null;
  onLocationSelect: (location: LocationCoordinate) => void;
  onEaseEnd: (location: LocationCoordinate) => void;
  onMapPlaceClick: (placeId: string) => void;
  onClearSelection: () => void;
};

const SELECTED_LOCATION_ZOOM = 12;
const SELECTED_LOCATION_EASE_MS = 1500;
const SELECTED_PLACE_EASE_MS = 600;
const SIDEBAR_PADDING_RIGHT = 420;

export function useLocationMap({
  isFetchingReport,
  selectedLocation,
  categoryPlaces,
  selectedPlace,
  onLocationSelect,
  onEaseEnd,
  onMapPlaceClick,
  onClearSelection,
}: UseLocationMapParams) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const indonesiaBoundaryRef = useRef<IndonesiaBoundary | null>(null);
  const styleReadyRef = useRef(false);
  const selectedLocationRef = useRef<LocationCoordinate | null>(
    selectedLocation,
  );
  const easeRequestIdRef = useRef(0);
  const onLocationSelectRef = useRef(onLocationSelect);
  const onEaseEndRef = useRef(onEaseEnd);
  const onMapPlaceClickRef = useRef(onMapPlaceClick);
  const onClearSelectionRef = useRef(onClearSelection);
  const categoryPlacesRef = useRef<Place[]>(categoryPlaces);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    onEaseEndRef.current = onEaseEnd;
  }, [onEaseEnd]);

  useEffect(() => {
    onMapPlaceClickRef.current = onMapPlaceClick;
  }, [onMapPlaceClick]);

  useEffect(() => {
    onClearSelectionRef.current = onClearSelection;
  }, [onClearSelection]);

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

      addOverlayLayers(map);

      styleReadyRef.current = true;
      renderSearchRadius(map, selectedLocationRef.current);
      renderCategoryPlaces(map, categoryPlacesRef.current);
    });

    map.on("click", CATEGORY_PLACES_LAYER, (event) => {
      const feature = event.features?.[0];
      if (!feature) {
        return;
      }
      const properties = feature.properties as { id?: unknown };
      const id = properties.id;
      if (typeof id === "string" && id !== "") {
        onMapPlaceClickRef.current(id);
      }
    });

    map.on("mouseenter", CATEGORY_PLACES_LAYER, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", CATEGORY_PLACES_LAYER, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", (event: MapMouseEvent) => {
      const boundary = indonesiaBoundaryRef.current;
      if (!boundary) {
        return;
      }

      const currentLocation = selectedLocationRef.current;

      if (currentLocation !== null) {
        const distance = distanceMeters(
          currentLocation.lng,
          currentLocation.lat,
          event.lngLat.lng,
          event.lngLat.lat,
        );
        if (distance <= SEARCH_RADIUS_METERS) {
          return;
        }

        if (
          !isPointInIndonesia(event.lngLat.lng, event.lngLat.lat, boundary)
        ) {
          showUnsupportedPopup(map, event.lngLat.lng, event.lngLat.lat);
          return;
        }

        showRepickPopup(map, event.lngLat.lng, event.lngLat.lat);
        return;
      }

      if (!isPointInIndonesia(event.lngLat.lng, event.lngLat.lat, boundary)) {
        showUnsupportedPopup(map, event.lngLat.lng, event.lngLat.lat);
        return;
      }

      popupRef.current?.remove();
      popupRef.current = null;

      onLocationSelectRef.current({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    });

    const showUnsupportedPopup = (
      target: MapLibreMap,
      lng: number,
      lat: number,
    ) => {
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({
        className: "location-map-popup",
        closeButton: false,
        closeOnClick: true,
        offset: 16,
      })
        .setLngLat([lng, lat])
        .setDOMContent(createUnsupportedLocationPopupElement(lng, lat))
        .addTo(target);
    };

    const showRepickPopup = (
      target: MapLibreMap,
      lng: number,
      lat: number,
    ) => {
      popupRef.current?.remove();
      const dismiss = () => {
        popupRef.current?.remove();
        popupRef.current = null;
      };
      popupRef.current = new maplibregl.Popup({
        className: "location-map-popup",
        closeButton: false,
        closeOnClick: false,
        offset: 16,
      })
        .setLngLat([lng, lat])
        .setDOMContent(
          createRepickPopupElement(() => {
            dismiss();
            onClearSelectionRef.current();
          }, dismiss),
        )
        .addTo(target);
    };

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
  }, []);

  useEffect(() => {
    selectedLocationRef.current = selectedLocation;

    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!selectedLocation) {
      easeRequestIdRef.current += 1;
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

    const easeToLocation = selectedLocation;
    const easeRequestId = easeRequestIdRef.current + 1;
    easeRequestIdRef.current = easeRequestId;

    const handleMoveEnd = () => {
      if (easeRequestIdRef.current !== easeRequestId) {
        return;
      }
      onEaseEndRef.current(easeToLocation);
    };

    void map.once("moveend", handleMoveEnd);
    map.easeTo({
      center: lngLat,
      duration: SELECTED_LOCATION_EASE_MS,
      zoom: SELECTED_LOCATION_ZOOM,
    });

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [selectedLocation]);

  useEffect(() => {
    categoryPlacesRef.current = categoryPlaces;
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }
    renderCategoryPlaces(map, categoryPlaces);
  }, [categoryPlaces]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }
    renderSelectedPlace(map, selectedPlace);

    if (selectedPlace) {
      map.easeTo({
        center: [selectedPlace.lng, selectedPlace.lat],
        duration: SELECTED_PLACE_EASE_MS,
        padding: {
          right: SIDEBAR_PADDING_RIGHT,
          top: 0,
          bottom: 0,
          left: 0,
        },
      });
    }
  }, [selectedPlace]);

  useEffect(() => {
    if (!isFetchingReport) {
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
        const elapsedSec = (now - start) / 1000;
        const bearing = (elapsedSec * SWEEP_DEG_PER_SECOND) % 360;
        renderSearchSweep(map, location.lng, location.lat, bearing);
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
        clearSearchSweep(map);
      }
    };
  }, [isFetchingReport]);

  return { containerRef };
}
