package server

import (
	"log"
	"net/http"
	"strconv"

	"github.com/fauzanalghifary/should-i-live-here/apps/api/internal/livability"
)

func handleLivability(svc *livability.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		lat, err := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
		if err != nil || lat < -90 || lat > 90 {
			writeError(w, http.StatusBadRequest, "invalid lat")
			return
		}

		lng, err := strconv.ParseFloat(r.URL.Query().Get("lng"), 64)
		if err != nil || lng < -180 || lng > 180 {
			writeError(w, http.StatusBadRequest, "invalid lng")
			return
		}

		report, err := svc.Report(r.Context(), lat, lng)
		if err != nil {
			log.Printf("livability report failed: %v", err)
			writeError(w, http.StatusBadGateway, "failed to fetch livability data")
			return
		}

		writeJSON(w, http.StatusOK, report)
	}
}
