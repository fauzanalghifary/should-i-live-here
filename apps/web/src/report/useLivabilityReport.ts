import { useQuery } from "@tanstack/react-query";

import type { LocationCoordinate } from "../location-map/types";
import type { LivabilityReport } from "./types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8080";

async function fetchLivabilityReport(
  lat: number,
  lng: number,
  signal: AbortSignal,
): Promise<LivabilityReport> {
  const url = `${API_BASE_URL}/livability?lat=${lat.toString()}&lng=${lng.toString()}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`API responded with ${response.status.toString()}`);
  }
  return (await response.json()) as LivabilityReport;
}

export function useLivabilityReport(location: LocationCoordinate | null) {
  const lat = location?.lat;
  const lng = location?.lng;

  return useQuery({
    queryKey: ["livability", lat, lng] as const,
    queryFn: ({ signal }) => {
      if (lat === undefined || lng === undefined) {
        throw new Error("location is required");
      }
      return fetchLivabilityReport(lat, lng, signal);
    },
    enabled: lat !== undefined && lng !== undefined,
  });
}
