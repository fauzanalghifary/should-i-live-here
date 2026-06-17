package livability

import (
	"context"
	"strings"
	"sync"
)

type Categories struct {
	Essentials int `json:"essentials"`
	Transport  int `json:"transport"`
	Healthcare int `json:"healthcare"`
	Education  int `json:"education"`
	GreenSpace int `json:"green_space"`
}

type Place struct {
	Name           string   `json:"name,omitempty"`
	Address        string   `json:"address,omitempty"`
	DistanceMeters int      `json:"distance_meters"`
	Lat            float64  `json:"lat"`
	Lng            float64  `json:"lng"`
	Categories     []string `json:"categories,omitempty"`
}

type PlacesByCategory struct {
	Essentials []Place `json:"essentials"`
	Transport  []Place `json:"transport"`
	Healthcare []Place `json:"healthcare"`
	Education  []Place `json:"education"`
	GreenSpace []Place `json:"green_space"`
}

type Report struct {
	Lat          float64          `json:"lat"`
	Lng          float64          `json:"lng"`
	RadiusMeters int              `json:"radius_meters"`
	Counts       Categories       `json:"counts"`
	Places       PlacesByCategory `json:"places"`
	Score        int              `json:"score"`
}

type Fetcher interface {
	FindNearbyPlaces(ctx context.Context, lat, lng float64, radius int, categories string) ([]Place, error)
}

type Service struct {
	fetcher Fetcher
	radius  int
}

func NewService(fetcher Fetcher) *Service {
	return &Service{fetcher: fetcher, radius: 3000}
}

type categoryQuery struct {
	name       string
	categories string
	cap        int
}

var categoryQueries = []categoryQuery{
	{"essentials", "commercial.supermarket,commercial.convenience,commercial.marketplace", 10},
	{"transport", "public_transport.bus,public_transport.train,public_transport.subway", 10},
	{"healthcare", "healthcare.hospital,healthcare.clinic_or_praxis,healthcare.pharmacy", 10},
	{"education", "education.school,education.university,education.college", 10},
	{"green_space", "leisure.park", 5},
}

func filterNamed(places []Place) []Place {
	named := make([]Place, 0, len(places))
	for _, place := range places {
		if strings.TrimSpace(place.Name) == "" {
			continue
		}
		named = append(named, place)
	}
	return named
}

func preparePlaces(category string, places []Place) []Place {
	named := filterNamed(places)
	if category != "transport" {
		return named
	}

	return labelTransportPlaces(filterTransportPlaces(named))
}

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

func (s *Service) Report(ctx context.Context, lat, lng float64) (Report, error) {
	type result struct {
		name   string
		places []Place
		err    error
	}

	resultCh := make(chan result, len(categoryQueries))
	var wg sync.WaitGroup

	for _, q := range categoryQueries {
		wg.Add(1)
		go func(q categoryQuery) {
			defer wg.Done()
			places, err := s.fetcher.FindNearbyPlaces(ctx, lat, lng, s.radius, q.categories)
			resultCh <- result{name: q.name, places: places, err: err}
		}(q)
	}

	wg.Wait()
	close(resultCh)

	counts := make(map[string]int, len(categoryQueries))
	places := make(map[string][]Place, len(categoryQueries))
	for r := range resultCh {
		if r.err != nil {
			return Report{}, r.err
		}
		prepared := preparePlaces(r.name, r.places)
		counts[r.name] = len(prepared)
		places[r.name] = prepared
	}

	var totalScore float64
	for _, q := range categoryQueries {
		count := min(counts[q.name], q.cap)
		totalScore += float64(count) / float64(q.cap) * 100
	}

	return Report{
		Lat:          lat,
		Lng:          lng,
		RadiusMeters: s.radius,
		Counts: Categories{
			Essentials: counts["essentials"],
			Transport:  counts["transport"],
			Healthcare: counts["healthcare"],
			Education:  counts["education"],
			GreenSpace: counts["green_space"],
		},
		Places: PlacesByCategory{
			Essentials: places["essentials"],
			Transport:  places["transport"],
			Healthcare: places["healthcare"],
			Education:  places["education"],
			GreenSpace: places["green_space"],
		},
		Score: int(totalScore / float64(len(categoryQueries))),
	}, nil
}
