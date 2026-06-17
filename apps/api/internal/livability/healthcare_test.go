package livability

import "testing"

func TestPreparePlacesIncludesBuildingHealthcareAndLabelsUnnamedHospitals(t *testing.T) {
	t.Parallel()

	places := preparePlaces("healthcare", []Place{
		{
			Address:    "Jalan Siti Armilah, Majalengka Kulon 45400, West Java, Indonesia",
			Categories: []string{"healthcare", "healthcare.hospital"},
		},
		{
			Name:       "puskesmas munjul",
			Address:    "puskesmas munjul, Jalan Cendana, Munjul 45400, West Java, Indonesia",
			Categories: []string{"building", "building.healthcare"},
		},
		{
			Categories: []string{"building", "building.healthcare"},
		},
	})

	wantNames := []string{
		"Hospital - Jalan Siti Armilah",
		"puskesmas munjul",
	}
	if len(places) != len(wantNames) {
		t.Fatalf("expected %d healthcare places, got %d", len(wantNames), len(places))
	}
	for i, wantName := range wantNames {
		if places[i].Name != wantName {
			t.Fatalf("expected healthcare place %d to be %q, got %q", i, wantName, places[i].Name)
		}
	}
}
