import type { LngLatBoundsLike } from "maplibre-gl";
import type {
  FeatureCollection,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";

const indonesiaWest = 94.5;
const indonesiaSouth = -11.2;
const indonesiaEast = 141.5;
const indonesiaNorth = 6.3;

export type IndonesiaBoundary = FeatureCollection<Polygon | MultiPolygon>;

export const indonesiaViewBounds: LngLatBoundsLike = [
  [indonesiaWest, indonesiaSouth],
  [indonesiaEast, indonesiaNorth],
];

export async function loadIndonesiaBoundary() {
  const response = await fetch("/indonesia.geojson");

  if (!response.ok) {
    throw new Error("Failed to load Indonesia boundary");
  }

  const boundary: unknown = await response.json();

  if (!isIndonesiaBoundary(boundary)) {
    throw new Error("Invalid Indonesia boundary GeoJSON");
  }

  return boundary;
}

export function isWithinIndonesiaViewBounds(lng: number, lat: number) {
  return (
    lng >= indonesiaWest &&
    lng <= indonesiaEast &&
    lat >= indonesiaSouth &&
    lat <= indonesiaNorth
  );
}

export function isPointInIndonesia(
  lng: number,
  lat: number,
  boundary: IndonesiaBoundary,
) {
  return boundary.features.some((feature) => {
    const geometry = feature.geometry;

    if (geometry.type === "Polygon") {
      return isPointInPolygon(lng, lat, geometry.coordinates);
    }

    return geometry.coordinates.some((polygon) =>
      isPointInPolygon(lng, lat, polygon),
    );
  });
}

function isIndonesiaBoundary(value: unknown): value is IndonesiaBoundary {
  if (!isObject(value)) {
    return false;
  }

  return value.type === "FeatureCollection" && Array.isArray(value.features);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPointInPolygon(lng: number, lat: number, polygon: Position[][]) {
  const outerRing = polygon[0];

  if (!outerRing || !isPointInRing(lng, lat, outerRing)) {
    return false;
  }

  const holes = polygon.slice(1);

  return !holes.some((hole) => isPointInRing(lng, lat, hole));
}

function isPointInRing(lng: number, lat: number, ring: Position[]) {
  let isInside = false;

  for (
    let currentIndex = 0, previousIndex = ring.length - 1;
    currentIndex < ring.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const current = getLngLatFromPosition(ring[currentIndex]);
    const previous = getLngLatFromPosition(ring[previousIndex]);

    if (!current || !previous) {
      continue;
    }

    const [currentLng, currentLat] = current;
    const [previousLng, previousLat] = previous;

    if (
      isPointOnSegment(
        lng,
        lat,
        currentLng,
        currentLat,
        previousLng,
        previousLat,
      )
    ) {
      return true;
    }

    const crossesLatitude = currentLat > lat !== previousLat > lat;

    if (!crossesLatitude) {
      continue;
    }

    const intersectionLng =
      ((previousLng - currentLng) * (lat - currentLat)) /
        (previousLat - currentLat) +
      currentLng;

    if (lng < intersectionLng) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function isPointOnSegment(
  lng: number,
  lat: number,
  firstLng: number,
  firstLat: number,
  secondLng: number,
  secondLat: number,
) {
  const tolerance = 1e-9;
  const crossProduct =
    (lat - firstLat) * (secondLng - firstLng) -
    (lng - firstLng) * (secondLat - firstLat);

  if (Math.abs(crossProduct) > tolerance) {
    return false;
  }

  const minLng = Math.min(firstLng, secondLng) - tolerance;
  const maxLng = Math.max(firstLng, secondLng) + tolerance;
  const minLat = Math.min(firstLat, secondLat) - tolerance;
  const maxLat = Math.max(firstLat, secondLat) + tolerance;

  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

function getLngLatFromPosition(position: Position | undefined) {
  const lng = position?.[0];
  const lat = position?.[1];

  if (lng === undefined || lat === undefined) {
    return null;
  }

  return [lng, lat] as const;
}
