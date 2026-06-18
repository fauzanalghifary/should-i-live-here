package livability

import (
	"context"
	"errors"
	"strconv"
	"sync/atomic"
	"testing"
)

var errStubFetcher = errors.New("stub fetcher failure")

type stubFetcher struct {
	places             []Place
	placesByCategories map[string][]Place
	detailsByID        map[string]PlaceDetails
	err                error
	detailsErr         error
	calls              atomic.Int32
}

func (s *stubFetcher) FindNearbyPlaces(_ context.Context, _, _ float64, _ int, categories string) ([]Place, error) {
	s.calls.Add(1)
	if s.err != nil {
		return nil, s.err
	}
	if s.placesByCategories != nil {
		return s.placesByCategories[categories], nil
	}
	return s.places, nil
}

func (s *stubFetcher) GetPlaceDetails(_ context.Context, id string) (PlaceDetails, error) {
	if s.detailsErr != nil {
		return PlaceDetails{}, s.detailsErr
	}
	if details, ok := s.detailsByID[id]; ok {
		return details, nil
	}
	return PlaceDetails{}, ErrPlaceNotFound
}

func TestServiceReport(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name      string
		fetcher   *stubFetcher
		wantErr   error
		wantCalls int32
		check     func(*testing.T, Report)
	}{
		{
			name:      "calls fetcher per category and maps counts",
			fetcher:   &stubFetcher{places: makePlaces(3)},
			wantCalls: int32(len(categoryQueries)),
			check: func(t *testing.T, r Report) {
				if r.RadiusMeters != 2000 {
					t.Fatalf("expected radius 2000, got %d", r.RadiusMeters)
				}
				if r.Counts.FoodCafe != 3 || r.Counts.GreenSpace != 3 {
					t.Fatalf("counts not populated: %+v", r.Counts)
				}
				if len(r.Places.FoodCafe) != 3 || r.Places.FoodCafe[0].Name != "Place 1" {
					t.Fatalf("places not populated: %+v", r.Places.FoodCafe)
				}
			},
		},
		{
			name:    "propagates fetcher error",
			fetcher: &stubFetcher{err: errStubFetcher},
			wantErr: errStubFetcher,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			svc := NewService(tc.fetcher)
			report, err := svc.Report(context.Background(), -6.2, 106.8)

			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Fatalf("expected error %v, got %v", tc.wantErr, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tc.wantCalls > 0 && tc.fetcher.calls.Load() != tc.wantCalls {
				t.Fatalf("expected %d calls, got %d", tc.wantCalls, tc.fetcher.calls.Load())
			}
			if tc.check != nil {
				tc.check(t, report)
			}
		})
	}
}

func makePlaces(count int) []Place {
	places := make([]Place, 0, count)
	for i := 1; i <= count; i++ {
		places = append(places, Place{Name: "Place " + strconv.Itoa(i)})
	}
	return places
}
