package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type Deps struct {
	Mailer  Mailer
	Limiter *FixedWindowLimiter
	Origin  string
	Logger  *slog.Logger
	Alert   func(error)
	Now     func() time.Time
}

type contactBody struct {
	ContactRequest
	RenderedAt int64 `json:"renderedAt"`
}

func ContactHandler(d Deps) http.HandlerFunc {
	now := d.Now
	if now == nil {
		now = time.Now
	}
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Vary", "Origin")
		if r.Header.Get("Origin") == d.Origin {
			w.Header().Set("Access-Control-Allow-Origin", d.Origin)
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"ok": false, "error": "method"})
			return
		}

		ip := clientIP(r)
		if !d.Limiter.Allow(ip) {
			writeJSON(w, http.StatusTooManyRequests, map[string]any{"ok": false, "error": "rate_limited"})
			return
		}

		var body contactBody
		dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64*1024))
		if err := dec.Decode(&body); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "error": "validation", "fields": map[string]string{"_": "malformed"}})
			return
		}

		elapsed := now().Sub(time.UnixMilli(body.RenderedAt)).Seconds()
		if IsSpam(body.ContactRequest, elapsed) {
			writeJSON(w, http.StatusOK, map[string]any{"ok": true}) // look fine to bots; do not send
			return
		}
		if fe := Validate(body.ContactRequest); len(fe) > 0 {
			writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "error": "validation", "fields": fe})
			return
		}

		if err := d.Mailer.Send(r.Context(), Message{
			FromName:  strings.TrimSpace(body.Name),
			FromEmail: strings.TrimSpace(body.Email),
			Body:      body.Message,
		}); err != nil {
			d.Logger.Error("contact send failed", "err", err, "ip", ip)
			if d.Alert != nil {
				d.Alert(err)
			}
			writeJSON(w, http.StatusBadGateway, map[string]any{"ok": false, "error": "send_failed"})
			return
		}
		d.Logger.Info("contact sent", "ip", ip)
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i != -1 {
		host = host[:i]
	}
	return host
}
