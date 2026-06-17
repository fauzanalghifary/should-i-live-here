package server

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/fauzanalghifary/should-i-live-here/apps/api/internal/livability"
)

func handlePlaceDetails(svc *livability.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimSpace(r.PathValue("id"))
		if id == "" {
			writeError(w, http.StatusBadRequest, "invalid id")
			return
		}

		details, err := svc.PlaceDetails(r.Context(), id)
		if err != nil {
			if errors.Is(err, livability.ErrPlaceNotFound) {
				writeError(w, http.StatusNotFound, "place not found")
				return
			}
			log.Printf("place details failed: %v", err)
			writeError(w, http.StatusBadGateway, "failed to fetch place details")
			return
		}

		writeJSON(w, http.StatusOK, details)
	}
}
