package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/fauzanalghifary/should-i-live-here/apps/api/internal/livability"
)

func TestHealth(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()

	New(livability.NewService(&stubFetcher{})).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.Code)
	}

	contentType := response.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Fatalf("expected content type application/json, got %q", contentType)
	}

	body := strings.TrimSpace(response.Body.String())
	if body != `{"status":"ok"}` {
		t.Fatalf("expected health response body, got %q", body)
	}
}
