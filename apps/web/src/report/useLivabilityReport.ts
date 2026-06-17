import { useEffect, useState } from "react";

import type { LocationCoordinate } from "../location-map/types";
import type { LivabilityReport, ReportState } from "./types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8080";

type Outcome =
  | { kind: "success"; report: LivabilityReport }
  | { kind: "error"; error: string };

type StoredOutcome = {
  key: string;
  outcome: Outcome;
};

export function useLivabilityReport(
  location: LocationCoordinate | null,
): ReportState {
  const [stored, setStored] = useState<StoredOutcome | null>(null);

  const lat = location?.lat;
  const lng = location?.lng;
  const currentKey =
    lat !== undefined && lng !== undefined
      ? `${lat.toString()},${lng.toString()}`
      : null;

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      return undefined;
    }

    const key = `${lat.toString()},${lng.toString()}`;
    const controller = new AbortController();
    const url = `${API_BASE_URL}/livability?lat=${lat.toString()}&lng=${lng.toString()}`;

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API responded with ${response.status.toString()}`);
        }
        const data = (await response.json()) as LivabilityReport;
        setStored({ key, outcome: { kind: "success", report: data } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Failed to load report";
        setStored({ key, outcome: { kind: "error", error: message } });
      });

    return () => {
      controller.abort();
    };
  }, [lat, lng]);

  if (currentKey === null) {
    return { status: "idle" };
  }
  if (stored === null || stored.key !== currentKey) {
    return { status: "loading" };
  }
  if (stored.outcome.kind === "success") {
    return { status: "success", report: stored.outcome.report };
  }
  return { status: "error", error: stored.outcome.error };
}
