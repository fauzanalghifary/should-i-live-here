package livability

import "strings"

func labelHealthcarePlaces(places []Place) []Place {
	labeled := make([]Place, 0, len(places))
	for _, place := range places {
		if strings.TrimSpace(place.Name) != "" {
			labeled = append(labeled, place)
			continue
		}

		label := healthcareLabel(place)
		location := healthcareFallbackLocation(place)
		if label == "" || location == "" {
			labeled = append(labeled, place)
			continue
		}

		place.Name = label + " - " + location
		labeled = append(labeled, place)
	}

	return labeled
}

func healthcareLabel(place Place) string {
	if hasCategory(place, "healthcare.hospital") {
		return "Hospital"
	}
	if hasCategory(place, "healthcare.clinic_or_praxis") {
		return "Clinic"
	}
	if hasCategory(place, "healthcare.pharmacy") {
		return "Pharmacy"
	}
	if hasCategory(place, "building.healthcare") || hasCategory(place, "healthcare") {
		return "Healthcare"
	}

	return ""
}

func healthcareFallbackLocation(place Place) string {
	address := strings.TrimSpace(place.Address)
	if address == "" {
		return ""
	}

	return strings.Split(address, ",")[0]
}
