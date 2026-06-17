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
	if hasCategory(place, "hospital") || hasCategory(place, "general_hospital") {
		return "Hospital"
	}
	if hasCategory(place, "medical_clinic") || hasCategory(place, "medical_center") {
		return "Clinic"
	}
	if hasCategory(place, "pharmacy") || hasCategory(place, "drugstore") {
		return "Pharmacy"
	}
	if hasCategory(place, "doctor") {
		return "Doctor"
	}
	if hasCategory(place, "health") {
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
