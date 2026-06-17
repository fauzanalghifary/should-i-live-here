package livability

import (
	"context"
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
	ID             string   `json:"id,omitempty"`
	Name           string   `json:"name,omitempty"`
	Address        string   `json:"address,omitempty"`
	DistanceMeters int      `json:"distance_meters"`
	Lat            float64  `json:"lat"`
	Lng            float64  `json:"lng"`
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
	categories string
	cap        int
}

var categoryQueries = []categoryQuery{
	{"essentials", "convenience_store,grocery_store,supermarket,market,discount_store,discount_supermarket,general_store,food_store", 10},
	{"transport", "bus_station,train_station,subway_station,light_rail_station,transit_station,ferry_terminal", 10},
	{"healthcare", "hospital,general_hospital,medical_clinic,medical_center,doctor,pharmacy,drugstore", 10},
	{"education", "school,primary_school,secondary_school,university,preschool,educational_institution", 10},
	{"green_space", "park,city_park,garden,playground,plaza", 5},
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
