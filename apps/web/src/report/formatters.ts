import type { Place } from "./types";

export type PlaceSortKey = "distance" | "rating" | "reviews";

export function sortByDistance(places: Place[]): Place[] {
  return [...places].sort((a, b) => a.distance_meters - b.distance_meters);
}

export function sortPlaces(places: Place[], sortKey: PlaceSortKey): Place[] {
  switch (sortKey) {
    case "rating":
      return [...places].sort(compareByRating);
    case "reviews":
      return [...places].sort(compareByReviewCount);
    case "distance":
      return sortByDistance(places);
  }
}

export function formatWalk(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / 80));
  return `${minutes.toString()} min walk`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatCategoryTag(category: string): string {
  return category.replace(/[._]/g, " ");
}

export function formatPriceLevel(level: string): string {
  switch (level) {
    case "PRICE_LEVEL_FREE":
      return "Free";
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
      return "$$$";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$$";
    default:
      return level;
  }
}

export function formatWebsite(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function googleMapsUrl(place: Place): string {
  const params = new URLSearchParams({
    api: "1",
    query: `${place.lat.toString()},${place.lng.toString()}`,
  });

  if (place.id) {
    params.set("query_place_id", place.id);
  }

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function compareByRating(a: Place, b: Place) {
  return (
    valueOrBottom(b.rating) - valueOrBottom(a.rating) ||
    valueOrBottom(b.rating_count) - valueOrBottom(a.rating_count) ||
    a.distance_meters - b.distance_meters
  );
}

function compareByReviewCount(a: Place, b: Place) {
  return (
    valueOrBottom(b.rating_count) - valueOrBottom(a.rating_count) ||
    valueOrBottom(b.rating) - valueOrBottom(a.rating) ||
    a.distance_meters - b.distance_meters
  );
}

function valueOrBottom(value: number | undefined) {
  return value ?? -1;
}
