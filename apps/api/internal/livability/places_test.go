package livability

import "testing"

func TestPreparePlacesDeduplicatesNearbyPlacesWithSameName(t *testing.T) {
	t.Parallel()

	places := preparePlaces("food_cafe", []Place{
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

func TestPreparePlacesFiltersCategoryMismatches(t *testing.T) {
	t.Parallel()

	places := preparePlaces("food_cafe", []Place{
		{
			Name:       "FITRA Hotel Majalengka",
			Categories: []string{"hotel", "banquet_hall", "wedding_venue", "event_venue"},
			Lat:        -6.834,
			Lng:        108.218,
		},
		{
			Name:       "Tigadelapan Majalengka",
			Categories: []string{"cafe", "coffee_shop", "point_of_interest"},
			Lat:        -6.835,
			Lng:        108.219,
		},
		{
			Name:       "Alfamart Majalengka",
			Categories: []string{"convenience_store", "store", "point_of_interest"},
			Lat:        -6.836,
			Lng:        108.22,
		},
	})

	if len(places) != 2 {
		t.Fatalf("expected 2 matching places, got %d: %+v", len(places), places)
	}
	if places[0].Name != "Tigadelapan Majalengka" || places[1].Name != "Alfamart Majalengka" {
		t.Fatalf("unexpected filtered places: %+v", places)
	}
}
