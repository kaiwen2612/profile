package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"time"
)

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		panic("missing required env var: " + k)
	}
	return v
}

func newMux(d Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})
	mux.Handle("POST /api/contact", ContactHandler(d))
	return mux
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	d := Deps{
		Mailer:  NewResendMailer(mustEnv("RESEND_API_KEY"), mustEnv("CONTACT_FROM"), mustEnv("CONTACT_TO")),
		Limiter: NewFixedWindowLimiter(5, time.Minute),
		Origin:  mustEnv("SITE_ORIGIN"),
		Logger:  logger,
		Alert:   func(err error) { logger.Error("ALERT contact send_failed", "err", err) },
	}
	srv := &http.Server{
		Addr:         ":" + envOr("PORT", "8080"),
		Handler:      newMux(d),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
	}
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server error", "err", err)
			os.Exit(1)
		}
	}()
	logger.Info("listening", "addr", srv.Addr)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	<-ctx.Done()
	sctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(sctx)
}
