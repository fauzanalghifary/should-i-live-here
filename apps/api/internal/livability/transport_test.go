package livability

import "testing"

func TestPreparePlacesExcludesOrdinaryBusStopsAndLabelsTransportPlaces(t *testing.T) {
	t.Parallel()

	places := preparePlaces("transport", []Place{
		{
			Name:       "Jl. Imam Bonjol, Majalengka",
			Address:    "Jalan Makmur, Majalengka",
			Categories: []string{"public_transport", "public_transport.bus"},
		},
		{
			Name:       "Terminal Cicaheum",
			Address:    "Bandung",
			Categories: []string{"public_transport", "public_transport.bus"},
		},
		{
			Name:       "Gambir",
			Address:    "Jakarta",
			Categories: []string{"public_transport", "public_transport.train"},
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
