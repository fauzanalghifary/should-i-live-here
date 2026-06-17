package main

import (
	"log"
	"net/http"
	"os"

	"github.com/fauzanalghifary/should-i-live-here/apps/api/internal/livability"
	"github.com/fauzanalghifary/should-i-live-here/apps/api/internal/server"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	apiKey := os.Getenv("GEOAPIFY_API_KEY")
	if apiKey == "" {
		log.Fatal("GEOAPIFY_API_KEY is required")
	}

	svc := livability.NewService(livability.NewGeoapifyClient(apiKey))

	addr := ":" + port
	log.Printf("api listening on %s", addr)

	if err := http.ListenAndServe(addr, server.New(svc)); err != nil {
		log.Fatalf("api stopped: %v", err)
	}
}
