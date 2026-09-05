package main

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestHealthz(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	newMux(Deps{Limiter: NewFixedWindowLimiter(5, time.Minute)}).ServeHTTP(rec, req)
	if rec.Code != http.StatusOK || rec.Body.String() != "ok" {
		t.Fatalf("got %d %q", rec.Code, rec.Body.String())
	}
}

func TestMuxLevel_CORS_OptionsPreflight(t *testing.T) {
	// Test that OPTIONS request routes through mux to handler (not blocked by mux)
	// and handler returns 204 with CORS headers
	d := Deps{
		Mailer:  &fakeMailer{},
		Limiter: NewFixedWindowLimiter(5, time.Minute),
		Origin:  "https://example.com",
		Logger:  slog.New(slog.NewTextHandler(io.Discard, nil)),
		Alert:   func(error) {},
	}
	mux := newMux(d)
	req := httptest.NewRequest(http.MethodOptions, "/api/contact", nil)
	req.Header.Set("Origin", "https://example.com")
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
	acao := rec.Header().Get("Access-Control-Allow-Origin")
	if acao != "https://example.com" {
		t.Fatalf("expected CORS header 'https://example.com', got %q", acao)
	}
}
