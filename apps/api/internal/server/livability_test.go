package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/fauzanalghifary/should-i-live-here/apps/api/internal/livability"
)

type stubFetcher struct {
	places      []livability.Place
	err         error
	detailsByID map[string]livability.PlaceDetails
	detailsErr  error
}

func (s *stubFetcher) FindNearbyPlaces(_ context.Context, _, _ float64, _ int, _ string) ([]livability.Place, error) {
	if s.err != nil {
		return nil, s.err
	}
	return s.places, nil
}

func (s *stubFetcher) GetPlaceDetails(_ context.Context, id string) (livability.PlaceDetails, error) {
	if s.detailsErr != nil {
		return livability.PlaceDetails{}, s.detailsErr
	}
	if details, ok := s.detailsByID[id]; ok {
		return details, nil
	}
	return livability.PlaceDetails{}, livability.ErrPlaceNotFound
}

func TestLivabilityHandler(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name       string
		url        string
		fetcher    *stubFetcher
		wantStatus int
		checkBody  func(*testing.T, []byte)
	}{
		{
			name:       "returns report for valid coords",
			url:        "/livability?lat=-6.2&lng=106.8",
			fetcher:    &stubFetcher{places: makePlaces(5)},
			wantStatus: http.StatusOK,
			checkBody: func(t *testing.T, body []byte) {
				var report livability.Report
				if err := json.Unmarshal(body, &report); err != nil {
					t.Fatalf("decode body: %v", err)
				}
				if report.Lat != -6.2 || report.Lng != 106.8 {
					t.Fatalf("unexpected coords: %+v", report)
				}
				if report.Counts.Essentials != 5 {
					t.Fatalf("expected essentials 5, got %d", report.Counts.Essentials)
				}
				if len(report.Places.Essentials) != 5 {
					t.Fatalf("expected 5 essential places, got %d", len(report.Places.Essentials))
				}
			},
		},
		{name: "missing lat", url: "/livability?lng=106.8", wantStatus: http.StatusBadRequest},
		{name: "missing lng", url: "/livability?lat=-6.2", wantStatus: http.StatusBadRequest},
		{name: "lat out of range", url: "/livability?lat=200&lng=106.8", wantStatus: http.StatusBadRequest},
		{name: "lng out of range", url: "/livability?lat=-6.2&lng=500", wantStatus: http.StatusBadRequest},
		{name: "lat not a number", url: "/livability?lat=abc&lng=106.8", wantStatus: http.StatusBadRequest},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			fetcher := tc.fetcher
			if fetcher == nil {
				fetcher = &stubFetcher{}
			}
			handler := New(livability.NewService(fetcher))

			req := httptest.NewRequest(http.MethodGet, tc.url, nil)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Fatalf("expected status %d, got %d", tc.wantStatus, rec.Code)
			}
			if tc.checkBody != nil {
				tc.checkBody(t, rec.Body.Bytes())
			}
		})
	}
}

func makePlaces(count int) []livability.Place {
	places := make([]livability.Place, 0, count)
	for i := 0; i < count; i++ {
		places = append(places, livability.Place{
			Name: "Place " + strconv.Itoa(i+1),
			Lat:  -6.2 + float64(i)*0.001,
			Lng:  106.8 + float64(i)*0.001,
		})
	}
	return places
}
