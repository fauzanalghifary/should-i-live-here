import { useQuery } from "@tanstack/react-query";

import type { PlaceDetails } from "./types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:8080" : "/api");

async function fetchPlaceDetails(
  id: string,
  signal: AbortSignal,
): Promise<PlaceDetails> {
  const url = `${API_BASE_URL}/places/${encodeURIComponent(id)}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`API responded with ${response.status.toString()}`);
  }
  return (await response.json()) as PlaceDetails;
}

export function usePlaceDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["place-details", id] as const,
    queryFn: ({ signal }) => {
      if (id === undefined) {
        throw new Error("place id is required");
      }
      return fetchPlaceDetails(id, signal);
    },
    enabled: id !== undefined && id !== "",
  });
}
