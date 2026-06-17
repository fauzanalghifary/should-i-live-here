export function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

export function circlePolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: GeoJSON.Position[] = [];
  for (let i = 0; i < points; i++) {
    coords.push(lngLatAtBearing(lng, lat, radiusMeters, (i / points) * 360));
  }
  const first = coords[0];
  if (first) {
    coords.push(first);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

export function sweepPolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
  startBearingDeg: number,
  spanDeg: number,
  steps = 16,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: GeoJSON.Position[] = [[lng, lat]];
  for (let i = 0; i <= steps; i++) {
    const bearing = startBearingDeg + (spanDeg * i) / steps;
    coords.push(lngLatAtBearing(lng, lat, radiusMeters, bearing));
  }
  coords.push([lng, lat]);
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

export function lngLatAtBearing(
  lng: number,
  lat: number,
  meters: number,
  bearingDeg: number,
): GeoJSON.Position {
  const earthRadius = 6378137;
  const delta = meters / earthRadius;
  const theta = (bearingDeg * Math.PI) / 180;
  const phi1 = (lat * Math.PI) / 180;
  const lambda1 = (lng * Math.PI) / 180;
  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) +
      Math.cos(phi1) * Math.sin(delta) * Math.cos(theta),
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
    );
  return [(lambda2 * 180) / Math.PI, (phi2 * 180) / Math.PI];
}
