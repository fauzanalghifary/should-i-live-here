package livability

import (
	"math"
	"strings"
)

func preparePlaces(category string, places []Place) []Place {
	named := filterNamedPlaces(places)
	if category != "transport" {
		return dedupeNearbyPlaces(named)
	}

	return dedupeNearbyPlaces(labelTransportPlaces(filterTransportPlaces(named)))
}

func filterNamedPlaces(places []Place) []Place {
	named := make([]Place, 0, len(places))
	for _, place := range places {
		if strings.TrimSpace(place.Name) == "" {
			continue
		}
		named = append(named, place)
	}
	return named
}

func dedupeNearbyPlaces(places []Place) []Place {
	deduped := make([]Place, 0, len(places))
	for _, place := range places {
		duplicateIndex := nearbyDuplicateIndex(deduped, place)
		if duplicateIndex == -1 {
			deduped = append(deduped, place)
			continue
		}

		if place.DistanceMeters < deduped[duplicateIndex].DistanceMeters {
			deduped[duplicateIndex] = place
		}
	}

	return deduped
}

func nearbyDuplicateIndex(places []Place, candidate Place) int {
	for i, place := range places {
		if !isNearbyDuplicate(place, candidate) {
			continue
		}

		return i
	}

	return -1
}

func isNearbyDuplicate(a, b Place) bool {
	if normalizePlaceName(a.Name) != normalizePlaceName(b.Name) {
		return false
	}

	return distanceMeters(a.Lat, a.Lng, b.Lat, b.Lng) <= 5
}

func normalizePlaceName(name string) string {
	return strings.Join(strings.Fields(strings.ToLower(strings.TrimSpace(name))), " ")
}

func distanceMeters(aLat, aLng, bLat, bLng float64) float64 {
	const earthRadiusMeters = 6371000

	lat1 := degreesToRadians(aLat)
	lat2 := degreesToRadians(bLat)
	latDelta := degreesToRadians(bLat - aLat)
	lngDelta := degreesToRadians(bLng - aLng)

	h := math.Sin(latDelta/2)*math.Sin(latDelta/2) +
		math.Cos(lat1)*math.Cos(lat2)*math.Sin(lngDelta/2)*math.Sin(lngDelta/2)

	return earthRadiusMeters * 2 * math.Atan2(math.Sqrt(h), math.Sqrt(1-h))
}

func degreesToRadians(degrees float64) float64 {
	return degrees * math.Pi / 180
}
