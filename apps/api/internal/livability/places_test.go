package livability

import "testing"

func TestPreparePlacesDeduplicatesNearbyPlacesWithSameName(t *testing.T) {
	t.Parallel()

	places := preparePlaces("essentials", []Place{
		{
			Name:           "Alun-alun Majalengka",
			DistanceMeters: 1106,
			Lat:            -6.836,
			Lng:            108.228,
		},
		{
			Name:           " Alun-alun   Majalengka ",
			DistanceMeters: 1104,
			Lat:            -6.83601,
			Lng:            108.22801,
		},
		{
			Name:           "Pasar Majalengka",
			DistanceMeters: 1300,
			Lat:            -6.84,
			Lng:            108.23,
		},
	})

	if len(places) != 2 {
		t.Fatalf("expected 2 places after dedupe, got %d", len(places))
	}
	if places[0].DistanceMeters != 1104 {
		t.Fatalf("expected duplicate to keep nearer place, got %+v", places[0])
	}
}
