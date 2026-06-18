export type Place = {
  id?: string;
  name?: string;
  address?: string;
  distance_meters: number;
  lat: number;
  lng: number;
  rating?: number;
  rating_count?: number;
  categories?: string[];
};

export type PlaceDetails = {
  id: string;
  name?: string;
  address?: string;
  lat: number;
  lng: number;
  rating?: number;
  rating_count?: number;
  open_now?: boolean;
  weekday_hours?: string[];
  phone?: string;
  website?: string;
  price_level?: string;
  business_status?: string;
  categories?: string[];
  photo_url?: string;
};

export type CategoryCounts = {
  food_cafe: number;
  transport: number;
  healthcare: number;
  education: number;
  green_space: number;
};

export type PlacesByCategory = {
  food_cafe: Place[];
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
};
