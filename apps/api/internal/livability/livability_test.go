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
	err                error
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
				if r.RadiusMeters != 3000 {
					t.Fatalf("expected radius 3000, got %d", r.RadiusMeters)
				}
				if r.Counts.Essentials != 3 || r.Counts.GreenSpace != 3 {
					t.Fatalf("counts not populated: %+v", r.Counts)
				}
				if len(r.Places.Essentials) != 3 || r.Places.Essentials[0].Name != "Place 1" {
					t.Fatalf("places not populated: %+v", r.Places.Essentials)
				}
				if r.Score <= 0 || r.Score > 100 {
					t.Fatalf("score out of range: %d", r.Score)
				}
			},
		},
		{
			name:    "caps score at 100 when counts exceed caps",
			fetcher: &stubFetcher{places: makePlaces(9999)},
			check: func(t *testing.T, r Report) {
				if r.Score != 100 {
					t.Fatalf("expected score 100, got %d", r.Score)
				}
			},
		},
		{
			name: "deduplicates nearby places with the same name",
			fetcher: &stubFetcher{
				placesByCategories: map[string][]Place{
					"commercial.supermarket,commercial.convenience,commercial.marketplace": {
						{
							Name:           "Alun-alun Majalengka",
							DistanceMeters: 1106,
							Lat:            -6.836,
							Lng:            108.228,
						},
						{
							Name:           " Alun-alun   Majalengka ",
							DistanceMeters: 1104,
							Lat:            -6.83601,
							Lng:            108.22801,
						},
						{
							Name:           "Pasar Majalengka",
							DistanceMeters: 1300,
							Lat:            -6.84,
							Lng:            108.23,
						},
					},
				},
			},
			check: func(t *testing.T, r Report) {
				if r.Counts.Essentials != 2 {
					t.Fatalf("expected 2 essential places after dedupe, got %d", r.Counts.Essentials)
				}
				if r.Places.Essentials[0].DistanceMeters != 1104 {
					t.Fatalf("expected duplicate to keep nearer place, got %+v", r.Places.Essentials[0])
				}
			},
		},
		{
			name: "excludes ordinary bus stops and labels transport places by vehicle type",
			fetcher: &stubFetcher{
				placesByCategories: map[string][]Place{
					"public_transport.bus,public_transport.train,public_transport.subway": {
						{
							Name:       "Jl. Imam Bonjol, Majalengka",
							Address:    "Jalan Makmur, Majalengka",
							Categories: []string{"public_transport", "public_transport.bus"},
						},
						{
							Name:       "Terminal Cicaheum",
							Address:    "Bandung",
							Categories: []string{"public_transport", "public_transport.bus"},
						},
						{
							Name:       "Gambir",
							Address:    "Jakarta",
							Categories: []string{"public_transport", "public_transport.train"},
						},
					},
				},
			},
			check: func(t *testing.T, r Report) {
				if r.Counts.Transport != 2 {
					t.Fatalf("expected 2 transport places, got %d", r.Counts.Transport)
				}

				wantNames := []string{
					"Bus terminal - Terminal Cicaheum",
					"Train station - Gambir",
				}
				for i, wantName := range wantNames {
					if r.Places.Transport[i].Name != wantName {
						t.Fatalf("expected transport place %d to be %q, got %q", i, wantName, r.Places.Transport[i].Name)
					}
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
