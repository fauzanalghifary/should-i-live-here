package livability

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func TestGooglePlacesClientFindNearbyPlaces(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name         string
		respStatus   int
		respBody     string
		wantPlaces   []Place
		wantErr      bool
		checkRequest func(*testing.T, *http.Request, googlePlacesRequest)
	}{
		{
			name:       "posts nearby search request and maps places",
			respStatus: http.StatusOK,
			respBody: `{
				"places": [
					{
						"displayName": { "text": "Alfamart" },
						"formattedAddress": "Alfamart, Majalengka, West Java, Indonesia",
						"location": { "latitude": -6.201, "longitude": 106.801 },
						"rating": 4.4,
						"userRatingCount": 72,
						"types": ["convenience_store", "store", "point_of_interest"],
						"primaryType": "convenience_store"
					},
					{
						"displayName": { "text": "Pasar Majalengka" },
						"formattedAddress": "Pasar Majalengka, West Java, Indonesia",
						"location": { "latitude": -6.202, "longitude": 106.802 },
						"rating": 4.1,
						"userRatingCount": 148,
						"types": ["market", "store", "point_of_interest"],
						"primaryType": "market"
					}
				]
			}`,
			wantPlaces: []Place{
				{
					Name:           "Alfamart",
					Address:        "Alfamart, Majalengka, West Java, Indonesia",
					DistanceMeters: 156,
					Lat:            -6.201,
					Lng:            106.801,
					Rating:         4.4,
					RatingCount:    72,
					Categories:     []string{"convenience_store", "store", "point_of_interest"},
				},
				{
					Name:           "Pasar Majalengka",
					Address:        "Pasar Majalengka, West Java, Indonesia",
					DistanceMeters: 313,
					Lat:            -6.202,
					Lng:            106.802,
					Rating:         4.1,
					RatingCount:    148,
					Categories:     []string{"market", "store", "point_of_interest"},
				},
			},
			checkRequest: func(t *testing.T, r *http.Request, body googlePlacesRequest) {
				if r.Method != http.MethodPost {
					t.Fatalf("expected POST, got %s", r.Method)
				}
				if r.Header.Get("X-Goog-Api-Key") != "test-key" {
					t.Fatalf("expected API key header to be set")
				}
				if r.Header.Get("X-Goog-FieldMask") != googlePlacesFieldMask {
					t.Fatalf("expected field mask %q, got %q", googlePlacesFieldMask, r.Header.Get("X-Goog-FieldMask"))
				}
				wantTypes := []string{"convenience_store", "supermarket"}
				if !reflect.DeepEqual(body.IncludedTypes, wantTypes) {
					t.Fatalf("expected included types %+v, got %+v", wantTypes, body.IncludedTypes)
				}
				if body.LocationRestriction.Circle.Center.Latitude != -6.2 ||
					body.LocationRestriction.Circle.Center.Longitude != 106.8 ||
					body.LocationRestriction.Circle.Radius != 1000 {
					t.Fatalf("unexpected location restriction: %+v", body.LocationRestriction.Circle)
				}
			},
		},
		{
			name:       "errors on non-2xx",
			respStatus: http.StatusUnauthorized,
			wantErr:    true,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				var body googlePlacesRequest
				if r.Body != nil {
					if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
						t.Fatalf("decode request body: %v", err)
					}
				}
				if tc.checkRequest != nil {
					tc.checkRequest(t, r, body)
				}

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.respStatus)
				if tc.respBody != "" {
					_, _ = w.Write([]byte(tc.respBody))
				}
			}))
			defer server.Close()

			client := &GooglePlacesClient{
				apiKey:  "test-key",
				baseURL: server.URL,
				http:    server.Client(),
				limit:   20,
			}

			places, err := client.FindNearbyPlaces(context.Background(), -6.2, 106.8, 1000, "convenience_store,supermarket")

			if tc.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !reflect.DeepEqual(places, tc.wantPlaces) {
				t.Fatalf("expected places %+v, got %+v", tc.wantPlaces, places)
			}
		})
	}
}
