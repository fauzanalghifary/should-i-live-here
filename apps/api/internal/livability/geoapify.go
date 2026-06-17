package livability

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const defaultGeoapifyBaseURL = "https://api.geoapify.com/v2/places"

type GeoapifyClient struct {
	apiKey  string
	baseURL string
	http    *http.Client
	limit   int
}

func NewGeoapifyClient(apiKey string) *GeoapifyClient {
	return &GeoapifyClient{
		apiKey:  apiKey,
		baseURL: defaultGeoapifyBaseURL,
		http:    &http.Client{Timeout: 10 * time.Second},
		limit:   100,
	}
}

type geoapifyResponse struct {
	Features []geoapifyFeature `json:"features"`
}

type geoapifyFeature struct {
	Properties geoapifyProperties `json:"properties"`
}

type geoapifyProperties struct {
	Name       string   `json:"name"`
	Address    string   `json:"formatted"`
	Distance   int      `json:"distance"`
	Lat        float64  `json:"lat"`
	Lng        float64  `json:"lon"`
	Categories []string `json:"categories"`
}

func (c *GeoapifyClient) FindNearbyPlaces(ctx context.Context, lat, lng float64, radius int, categories string) ([]Place, error) {
	lngStr := strconv.FormatFloat(lng, 'f', -1, 64)
	latStr := strconv.FormatFloat(lat, 'f', -1, 64)

	params := url.Values{}
	params.Set("categories", categories)
	params.Set("filter", fmt.Sprintf("circle:%s,%s,%d", lngStr, latStr, radius))
	params.Set("bias", fmt.Sprintf("proximity:%s,%s", lngStr, latStr))
	params.Set("limit", strconv.Itoa(c.limit))
	params.Set("apiKey", c.apiKey)

	endpoint := c.baseURL + "?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("geoapify request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("geoapify returned status %d", resp.StatusCode)
	}

	var payload geoapifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode geoapify response: %w", err)
	}

	places := make([]Place, 0, len(payload.Features))
	for _, feature := range payload.Features {
		properties := feature.Properties
		places = append(places, Place{
			Name:           properties.Name,
			Address:        properties.Address,
			DistanceMeters: properties.Distance,
			Lat:            properties.Lat,
			Lng:            properties.Lng,
			Categories:     properties.Categories,
		})
	}

	return places, nil
}
