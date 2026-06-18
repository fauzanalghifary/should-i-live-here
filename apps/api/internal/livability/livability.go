package livability

import (
	"context"
	"strings"
	"sync"
)

type Categories struct {
	FoodCafe   int `json:"food_cafe"`
	Transport  int `json:"transport"`
	Healthcare int `json:"healthcare"`
	Education  int `json:"education"`
	GreenSpace int `json:"green_space"`
}

type Place struct {
	ID             string   `json:"id,omitempty"`
	Name           string   `json:"name,omitempty"`
	Address        string   `json:"address,omitempty"`
	DistanceMeters int      `json:"distance_meters"`
	Lat            float64  `json:"lat"`
	Lng            float64  `json:"lng"`
	Rating         float64  `json:"rating,omitempty"`
	RatingCount    int      `json:"rating_count,omitempty"`
	Categories     []string `json:"categories,omitempty"`
}

type PlaceDetails struct {
	ID             string   `json:"id"`
	Name           string   `json:"name,omitempty"`
	Address        string   `json:"address,omitempty"`
	Lat            float64  `json:"lat"`
	Lng            float64  `json:"lng"`
	Rating         float64  `json:"rating,omitempty"`
	RatingCount    int      `json:"rating_count,omitempty"`
	OpenNow        *bool    `json:"open_now,omitempty"`
	WeekdayHours   []string `json:"weekday_hours,omitempty"`
	Phone          string   `json:"phone,omitempty"`
	Website        string   `json:"website,omitempty"`
	PriceLevel     string   `json:"price_level,omitempty"`
	BusinessStatus string   `json:"business_status,omitempty"`
	Categories     []string `json:"categories,omitempty"`
	PhotoURL       string   `json:"photo_url,omitempty"`
}

type PlacesByCategory struct {
	FoodCafe   []Place `json:"food_cafe"`
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
}

type Fetcher interface {
	FindNearbyPlaces(ctx context.Context, lat, lng float64, radius int, categories string) ([]Place, error)
	GetPlaceDetails(ctx context.Context, id string) (PlaceDetails, error)
}

type Service struct {
	fetcher Fetcher
	radius  int
}

func NewService(fetcher Fetcher) *Service {
	return &Service{fetcher: fetcher, radius: 2000}
}

type categoryQuery struct {
	name       string
	categories []string
}

var categoryQueries = []categoryQuery{
	{
		name: "food_cafe",
		categories: []string{
			"restaurant",
			"cafe",
			"coffee_shop",
			"bakery",
			"meal_takeaway",
			"food_court",
			"diner",
			"dessert_shop",
			"convenience_store",
			"grocery_store",
			"supermarket",
			"market",
			"discount_supermarket",
		},
	},
	{
		name:       "transport",
		categories: []string{"bus_station", "train_station", "subway_station", "light_rail_station", "transit_station", "ferry_terminal"},
	},
	{
		name:       "healthcare",
		categories: []string{"hospital", "general_hospital", "medical_clinic", "medical_center", "doctor", "pharmacy", "drugstore"},
	},
	{
		name:       "education",
		categories: []string{"school", "primary_school", "secondary_school", "university", "preschool", "educational_institution"},
	},
	{
		name:       "green_space",
		categories: []string{"park", "city_park", "garden", "playground", "plaza"},
	},
}

func (s *Service) PlaceDetails(ctx context.Context, id string) (PlaceDetails, error) {
	return s.fetcher.GetPlaceDetails(ctx, id)
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
			places, err := s.fetcher.FindNearbyPlaces(ctx, lat, lng, s.radius, q.categoryList())
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

	return Report{
		Lat:          lat,
		Lng:          lng,
		RadiusMeters: s.radius,
		Counts: Categories{
			FoodCafe:   counts["food_cafe"],
			Transport:  counts["transport"],
			Healthcare: counts["healthcare"],
			Education:  counts["education"],
			GreenSpace: counts["green_space"],
		},
		Places: PlacesByCategory{
			FoodCafe:   places["food_cafe"],
			Transport:  places["transport"],
			Healthcare: places["healthcare"],
			Education:  places["education"],
			GreenSpace: places["green_space"],
		},
	}, nil
}

func (q categoryQuery) categoryList() string {
	return strings.Join(q.categories, ",")
}

func categoryTypes(category string) map[string]struct{} {
	for _, q := range categoryQueries {
		if q.name != category {
			continue
		}

		types := make(map[string]struct{}, len(q.categories))
		for _, category := range q.categories {
			types[category] = struct{}{}
		}
		return types
	}

	return nil
}
