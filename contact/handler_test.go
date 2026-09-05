package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

type fakeMailer struct {
	calls int
	err   error
}

func (f *fakeMailer) Send(context.Context, Message) error { f.calls++; return f.err }

func newTestHandler(m Mailer) (http.HandlerFunc, *bool) {
	alerted := false
	d := Deps{
		Mailer:  m,
		Limiter: NewFixedWindowLimiter(5, time.Minute),
		Origin:  "https://example.com",
		Logger:  slog.New(slog.NewTextHandler(io.Discard, nil)),
		Alert:   func(error) { alerted = true },
		Now:     func() time.Time { return time.UnixMilli(10_000) },
	}
	return ContactHandler(d), &alerted
}

func post(h http.HandlerFunc, body map[string]any) *httptest.ResponseRecorder {
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/contact", bytes.NewReader(b))
	req.Header.Set("Origin", "https://example.com")
	req.RemoteAddr = "9.9.9.9:1234"
	rec := httptest.NewRecorder()
	h(rec, req)
	return rec
}

func validBody() map[string]any {
	return map[string]any{"name": "Ada", "email": "ada@example.com", "message": "Hello, I have a role.", "website": "", "renderedAt": 1000}
}

func TestContact_Success(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	rec := post(h, validBody())
	if rec.Code != 200 || fm.calls != 1 {
		t.Fatalf("code=%d calls=%d", rec.Code, fm.calls)
	}
}

func TestContact_ValidationError_NoReflection(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	body := validBody()
	body["email"] = "not-an-email"
	body["message"] = "SENSITIVE-SECRET-TEXT"
	rec := post(h, body)
	if rec.Code != 400 {
		t.Fatalf("code=%d", rec.Code)
	}
	if bytes.Contains(rec.Body.Bytes(), []byte("SENSITIVE-SECRET-TEXT")) {
		t.Fatal("response must not reflect submitted content")
	}
	var out map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	if out["error"] != "validation" {
		t.Fatalf("body=%s", rec.Body.String())
	}
}

func TestContact_Honeypot_LooksSuccessfulbutNoSend(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	body := validBody()
	body["website"] = "http://spam"
	rec := post(h, body)
	if rec.Code != 200 || fm.calls != 0 {
		t.Fatalf("code=%d calls=%d", rec.Code, fm.calls)
	}
}

func TestContact_RateLimited(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	for i := 0; i < 5; i++ {
		post(h, validBody())
	}
	rec := post(h, validBody())
	if rec.Code != 429 {
		t.Fatalf("code=%d", rec.Code)
	}
}

func TestContact_SendFailure_502_and_Alert(t *testing.T) {
	fm := &fakeMailer{err: errors.New("provider down")}
	h, alerted := newTestHandler(fm)
	rec := post(h, validBody())
	if rec.Code != 502 || !*alerted {
		t.Fatalf("code=%d alerted=%v", rec.Code, *alerted)
	}
}

func TestContact_CORS_OptionsPreflight(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	req := httptest.NewRequest(http.MethodOptions, "/api/contact", nil)
	req.Header.Set("Origin", "https://example.com")
	rec := httptest.NewRecorder()
	h(rec, req)
	if rec.Code != 204 || rec.Header().Get("Access-Control-Allow-Origin") != "https://example.com" {
		t.Fatalf("code=%d acao=%q", rec.Code, rec.Header().Get("Access-Control-Allow-Origin"))
	}
}
