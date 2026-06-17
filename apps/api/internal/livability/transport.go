package livability

import "strings"

func filterTransportPlaces(places []Place) []Place {
	filtered := make([]Place, 0, len(places))
	for _, place := range places {
		if isOrdinaryBusStop(place) {
			continue
		}
		filtered = append(filtered, place)
	}

	return filtered
}

func isOrdinaryBusStop(place Place) bool {
	if !hasCategory(place, "public_transport.bus") {
		return false
	}

	return !isBusTerminal(place)
}

func isBusTerminal(place Place) bool {
	nameAndAddress := strings.ToLower(place.Name + " " + place.Address)
	return strings.Contains(nameAndAddress, "terminal")
}

func hasCategory(place Place, wantCategory string) bool {
	for _, category := range place.Categories {
		if category == wantCategory {
			return true
		}
	}

	return false
}

func labelTransportPlaces(places []Place) []Place {
	labeled := make([]Place, 0, len(places))
	for _, place := range places {
		label := transportLabel(place)
		if label == "" {
			labeled = append(labeled, place)
			continue
		}

		name := strings.TrimSpace(place.Name)
		if strings.Contains(strings.ToLower(name), strings.ToLower(label)) {
			labeled = append(labeled, place)
			continue
		}

		place.Name = label + " - " + name
		labeled = append(labeled, place)
	}

	return labeled
}

func transportLabel(place Place) string {
	for _, category := range place.Categories {
		switch category {
		case "public_transport.train":
			return "Train station"
		case "public_transport.subway":
			return "Subway station"
		case "public_transport.light_rail":
			return "Light rail station"
		case "public_transport.tram":
			return "Tram stop"
		case "public_transport.monorail":
			return "Monorail station"
		case "public_transport.ferry":
			return "Ferry terminal"
		case "public_transport.aerialway":
			return "Aerialway station"
		case "public_transport.bus":
			if isBusTerminal(place) {
				return "Bus terminal"
			}
			return "Bus stop"
		case "public_transport.platform":
			return "Public transport platform"
		}
	}

	return ""
}
