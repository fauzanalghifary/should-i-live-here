package livability

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const (
	defaultGooglePlacesBaseURL = "https://places.googleapis.com/v1/places:searchNearby"
	googlePlacesFieldMask      = "places.displayName,places.formattedAddress,places.location,places.types,places.primaryType"
)

type GooglePlacesClient struct {
	apiKey  string
	baseURL string
	http    *http.Client
	limit   int
}

func NewGooglePlacesClient(apiKey string) *GooglePlacesClient {
	return &GooglePlacesClient{
		apiKey:  apiKey,
		baseURL: defaultGooglePlacesBaseURL,
		http:    &http.Client{Timeout: 10 * time.Second},
		limit:   20,
	}
}

type googlePlacesRequest struct {
	IncludedTypes       []string                        `json:"includedTypes"`
	MaxResultCount      int                             `json:"maxResultCount"`
	LocationRestriction googlePlacesLocationRestriction `json:"locationRestriction"`
}

type googlePlacesLocationRestriction struct {
	Circle googlePlacesCircle `json:"circle"`
}

type googlePlacesCircle struct {
	Center googlePlacesLocation `json:"center"`
	Radius float64              `json:"radius"`
}

type googlePlacesLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type googlePlacesResponse struct {
	Places []googlePlace `json:"places"`
}

type googlePlace struct {
	DisplayName      googlePlaceDisplayName `json:"displayName"`
	FormattedAddress string                 `json:"formattedAddress"`
	Location         googlePlacesLocation   `json:"location"`
	Types            []string               `json:"types"`
	PrimaryType      string                 `json:"primaryType"`
}

type googlePlaceDisplayName struct {
	Text string `json:"text"`
}

func (c *GooglePlacesClient) FindNearbyPlaces(ctx context.Context, lat, lng float64, radius int, categories string) ([]Place, error) {
	body, err := json.Marshal(googlePlacesRequest{
		IncludedTypes:  splitGooglePlaceTypes(categories),
		MaxResultCount: c.limit,
		LocationRestriction: googlePlacesLocationRestriction{
			Circle: googlePlacesCircle{
				Center: googlePlacesLocation{
					Latitude:  lat,
					Longitude: lng,
				},
				Radius: float64(radius),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", c.apiKey)
	req.Header.Set("X-Goog-FieldMask", googlePlacesFieldMask)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("google places request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google places returned status %d", resp.StatusCode)
	}

	var payload googlePlacesResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode google places response: %w", err)
	}

	places := make([]Place, 0, len(payload.Places))
	for _, googlePlace := range payload.Places {
		places = append(places, Place{
			Name:           googlePlace.DisplayName.Text,
			Address:        googlePlace.FormattedAddress,
			DistanceMeters: int(distanceMeters(lat, lng, googlePlace.Location.Latitude, googlePlace.Location.Longitude)),
			Lat:            googlePlace.Location.Latitude,
			Lng:            googlePlace.Location.Longitude,
			Categories:     googlePlace.Types,
		})
	}

	return places, nil
}

func splitGooglePlaceTypes(categories string) []string {
	types := strings.Split(categories, ",")
	placeTypes := make([]string, 0, len(types))
	for _, placeType := range types {
		trimmed := strings.TrimSpace(placeType)
		if trimmed == "" {
			continue
		}
		placeTypes = append(placeTypes, trimmed)
	}

	return placeTypes
}
