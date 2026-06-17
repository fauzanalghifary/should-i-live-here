package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fauzanalghifary/should-i-live-here/apps/api/internal/livability"
)

func TestPlaceDetailsHandler(t *testing.T) {
	t.Parallel()

	openNow := true
	sampleDetails := livability.PlaceDetails{
		ID:           "ChIJfoo",
		Name:         "Sample Place",
		Address:      "1 Main St",
		Rating:       4.3,
		RatingCount:  152,
		OpenNow:      &openNow,
		WeekdayHours: []string{"Mon: 9 - 5"},
		Phone:        "+62 21 1234",
		Website:      "https://example.com",
	}

	cases := []struct {
		name       string
		fetcher    *stubFetcher
		url        string
		wantStatus int
		checkBody  func(*testing.T, []byte)
	}{
		{
			name: "returns details for known id",
			fetcher: &stubFetcher{
				detailsByID: map[string]livability.PlaceDetails{
					"ChIJfoo": sampleDetails,
				},
			},
			url:        "/places/ChIJfoo",
			wantStatus: http.StatusOK,
			checkBody: func(t *testing.T, body []byte) {
				var got livability.PlaceDetails
				if err := json.Unmarshal(body, &got); err != nil {
					t.Fatalf("decode body: %v", err)
				}
				if got.ID != sampleDetails.ID || got.Rating != sampleDetails.Rating {
					t.Fatalf("unexpected details: %+v", got)
				}
			},
		},
		{
			name:       "returns 404 for unknown id",
			fetcher:    &stubFetcher{},
			url:        "/places/missing",
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			handler := New(livability.NewService(tc.fetcher))
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
