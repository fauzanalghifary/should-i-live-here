package livability

import "testing"

func TestPreparePlacesExcludesOrdinaryBusStopsAndLabelsTransportPlaces(t *testing.T) {
	t.Parallel()

	places := preparePlaces("transport", []Place{
		{
			Name:       "Jl. Imam Bonjol, Majalengka",
			Address:    "Jalan Makmur, Majalengka",
			Categories: []string{"bus_stop", "transit_station", "point_of_interest"},
		},
		{
			Name:       "Terminal Cicaheum",
			Address:    "Bandung",
			Categories: []string{"bus_station", "transit_station", "point_of_interest"},
		},
		{
			Name:       "Gambir",
			Address:    "Jakarta",
			Categories: []string{"train_station", "transit_station", "point_of_interest"},
		},
	})

	wantNames := []string{
		"Bus terminal - Terminal Cicaheum",
		"Train station - Gambir",
	}
	if len(places) != len(wantNames) {
		t.Fatalf("expected %d transport places, got %d", len(wantNames), len(places))
	}
	for i, wantName := range wantNames {
		if places[i].Name != wantName {
			t.Fatalf("expected transport place %d to be %q, got %q", i, wantName, places[i].Name)
		}
	}
}
