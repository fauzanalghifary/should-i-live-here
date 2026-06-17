package livability

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

var ErrPlaceNotFound = errors.New("place not found")

const (
	defaultGooglePlacesBaseURL  = "https://places.googleapis.com/v1/places:searchNearby"
	defaultGooglePlacesPlaceURL = "https://places.googleapis.com/v1/places"
	googlePlacesFieldMask       = "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType"
	googlePlaceDetailsFieldMask = "id,displayName,formattedAddress,location,types,primaryType,rating,userRatingCount,currentOpeningHours,regularOpeningHours,internationalPhoneNumber,nationalPhoneNumber,websiteUri,priceLevel,businessStatus,photos"
	googlePlacePhotoMaxHeightPx = 400
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
	ID               string                 `json:"id"`
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
			ID:             googlePlace.ID,
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

type googlePlaceDetails struct {
	ID                       string                 `json:"id"`
	DisplayName              googlePlaceDisplayName `json:"displayName"`
	FormattedAddress         string                 `json:"formattedAddress"`
	Location                 googlePlacesLocation   `json:"location"`
	Types                    []string               `json:"types"`
	PrimaryType              string                 `json:"primaryType"`
	Rating                   float64                `json:"rating"`
	UserRatingCount          int                    `json:"userRatingCount"`
	CurrentOpeningHours      *googleOpeningHours    `json:"currentOpeningHours"`
	RegularOpeningHours      *googleOpeningHours    `json:"regularOpeningHours"`
	NationalPhoneNumber      string                 `json:"nationalPhoneNumber"`
	InternationalPhoneNumber string                 `json:"internationalPhoneNumber"`
	WebsiteURI               string                 `json:"websiteUri"`
	PriceLevel               string                 `json:"priceLevel"`
	BusinessStatus           string                 `json:"businessStatus"`
	Photos                   []googlePhoto          `json:"photos"`
}

type googleOpeningHours struct {
	OpenNow             *bool    `json:"openNow"`
	WeekdayDescriptions []string `json:"weekdayDescriptions"`
}

type googlePhoto struct {
	Name string `json:"name"`
}

type googlePhotoMedia struct {
	PhotoURI string `json:"photoUri"`
}

func (c *GooglePlacesClient) GetPlaceDetails(ctx context.Context, id string) (PlaceDetails, error) {
	trimmed := strings.TrimSpace(id)
	if trimmed == "" {
		return PlaceDetails{}, ErrPlaceNotFound
	}

	url := fmt.Sprintf("%s/%s", defaultGooglePlacesPlaceURL, trimmed)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return PlaceDetails{}, err
	}
	req.Header.Set("X-Goog-Api-Key", c.apiKey)
	req.Header.Set("X-Goog-FieldMask", googlePlaceDetailsFieldMask)

	resp, err := c.http.Do(req)
	if err != nil {
		return PlaceDetails{}, fmt.Errorf("google place details request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return PlaceDetails{}, ErrPlaceNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return PlaceDetails{}, fmt.Errorf("google place details returned status %d", resp.StatusCode)
	}

	var payload googlePlaceDetails
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return PlaceDetails{}, fmt.Errorf("decode google place details: %w", err)
	}

	details := PlaceDetails{
		ID:             payload.ID,
		Name:           payload.DisplayName.Text,
		Address:        payload.FormattedAddress,
		Lat:            payload.Location.Latitude,
		Lng:            payload.Location.Longitude,
		Rating:         payload.Rating,
		RatingCount:    payload.UserRatingCount,
		Phone:          firstNonEmpty(payload.NationalPhoneNumber, payload.InternationalPhoneNumber),
		Website:        payload.WebsiteURI,
		PriceLevel:     payload.PriceLevel,
		BusinessStatus: payload.BusinessStatus,
		Categories:     payload.Types,
	}

	hours := payload.CurrentOpeningHours
	if hours == nil {
		hours = payload.RegularOpeningHours
	}
	if hours != nil {
		details.OpenNow = hours.OpenNow
		details.WeekdayHours = hours.WeekdayDescriptions
	}

	if len(payload.Photos) > 0 {
		if photoURL, err := c.resolvePhotoURL(ctx, payload.Photos[0].Name); err == nil {
			details.PhotoURL = photoURL
		}
	}

	return details, nil
}

func (c *GooglePlacesClient) resolvePhotoURL(ctx context.Context, photoName string) (string, error) {
	trimmed := strings.TrimSpace(photoName)
	if trimmed == "" {
		return "", errors.New("empty photo name")
	}

	url := fmt.Sprintf(
		"https://places.googleapis.com/v1/%s/media?maxHeightPx=%d&skipHttpRedirect=true",
		trimmed,
		googlePlacePhotoMaxHeightPx,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("X-Goog-Api-Key", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("google photo media request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("google photo media returned status %d", resp.StatusCode)
	}

	var payload googlePhotoMedia
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", fmt.Errorf("decode google photo media: %w", err)
	}
	return payload.PhotoURI, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
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
