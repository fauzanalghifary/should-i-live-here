package livability

import (
	"context"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
)

func TestGeoapifyClientFindNearbyPlaces(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name       string
		respStatus int
		respBody   string
		wantPlaces []Place
		wantErr    bool
		checkQuery func(*testing.T, string)
	}{
		{
			name:       "counts features and forwards expected params",
			respStatus: http.StatusOK,
			respBody: `{
				"features": [
					{
						"properties": {
							"name": "Pasar Santa",
							"formatted": "Pasar Santa, Jakarta",
							"distance": 275,
							"lat": -6.241,
							"lon": 106.816,
							"categories": ["commercial.marketplace"]
						}
					},
					{
						"properties": {
							"name": "Mini Market",
							"formatted": "Mini Market, Jakarta",
							"distance": 500,
							"lat": -6.242,
							"lon": 106.817,
							"categories": ["commercial.convenience"]
						}
					}
				]
			}`,
			wantPlaces: []Place{
				{
					Name:           "Pasar Santa",
					Address:        "Pasar Santa, Jakarta",
					DistanceMeters: 275,
					Lat:            -6.241,
					Lng:            106.816,
					Categories:     []string{"commercial.marketplace"},
				},
				{
					Name:           "Mini Market",
					Address:        "Mini Market, Jakarta",
					DistanceMeters: 500,
					Lat:            -6.242,
					Lng:            106.817,
					Categories:     []string{"commercial.convenience"},
				},
			},
			checkQuery: func(t *testing.T, q string) {
				for _, want := range []string{
					"apiKey=test-key",
					"filter=circle",
					"categories=commercial.supermarket",
				} {
					if !strings.Contains(q, want) {
						t.Fatalf("expected %q in query, got %s", want, q)
					}
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

			var receivedQuery string
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				receivedQuery = r.URL.RawQuery
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.respStatus)
				if tc.respBody != "" {
					_, _ = w.Write([]byte(tc.respBody))
				}
			}))
			defer server.Close()

			client := &GeoapifyClient{
				apiKey:  "test-key",
				baseURL: server.URL,
				http:    server.Client(),
				limit:   100,
			}

			places, err := client.FindNearbyPlaces(context.Background(), -6.2, 106.8, 1000, "commercial.supermarket")

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
			if tc.checkQuery != nil {
				tc.checkQuery(t, receivedQuery)
			}
		})
	}
}
