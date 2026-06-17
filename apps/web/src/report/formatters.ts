  import type { Place } from "./types";

export function sortByDistance(places: Place[]): Place[] {
  return [...places].sort((a, b) => a.distance_meters - b.distance_meters);
}

export function formatWalk(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / 80));
  return `${minutes.toString()} min walk`;
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
