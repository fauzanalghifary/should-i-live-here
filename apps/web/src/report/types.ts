export type Place = {
  name?: string;
  address?: string;
  distance_meters: number;
  lat: number;
  lng: number;
  categories?: string[];
};

export type CategoryCounts = {
  essentials: number;
  transport: number;
  healthcare: number;
  education: number;
  green_space: number;
};

export type PlacesByCategory = {
  essentials: Place[];
  transport: Place[];
  healthcare: Place[];
  education: Place[];
  green_space: Place[];
};

export type CategoryKey = keyof CategoryCounts;

export type LivabilityReport = {
  lat: number;
  lng: number;
  radius_meters: number;
  counts: CategoryCounts;
  places: PlacesByCategory;
  score: number;
};

export type ReportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; report: LivabilityReport }
  | { status: "error"; error: string };
