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
	if !hasCategory(place, "bus_stop") {
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
		case "train_station":
			return "Train station"
		case "subway_station":
			return "Subway station"
		case "light_rail_station":
			return "Light rail station"
		case "tram_stop":
			return "Tram stop"
		case "ferry_terminal":
			return "Ferry terminal"
		case "bus_station":
			if isBusTerminal(place) {
				return "Bus terminal"
			}
			return "Bus station"
		case "transit_station":
			return "Transit station"
		}
	}

	return ""
}
