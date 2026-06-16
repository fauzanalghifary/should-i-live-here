package main

import (
	"log"
	"net/http"
	"os"

	"github.com/fauzanalghifary/should-i-live-here/apps/api/internal/server"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("api listening on %s", addr)

	if err := http.ListenAndServe(addr, server.New()); err != nil {
		log.Fatalf("api stopped: %v", err)
	}
}
