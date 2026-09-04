package main

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
)

func TestResendMailer_SendErrorsOnNon2xx(t *testing.T) {
	m := NewResendMailer("k", "from@example.com", "to@example.com")
	m.httpDo = func(*http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 422, Body: io.NopCloser(strings.NewReader(`{"message":"bad"}`))}, nil
	}
	if err := m.Send(context.Background(), Message{FromName: "A", FromEmail: "a@b.com", Body: "hi"}); err == nil {
		t.Fatal("expected error on 422")
	}
}

func TestResendMailer_SendOKon2xx(t *testing.T) {
	m := NewResendMailer("k", "from@example.com", "to@example.com")
	m.httpDo = func(r *http.Request) (*http.Response, error) {
		if r.Header.Get("Authorization") != "Bearer k" {
			t.Fatalf("missing auth header")
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"id":"x"}`))}, nil
	}
	if err := m.Send(context.Background(), Message{FromName: "A", FromEmail: "a@b.com", Body: "hi"}); err != nil {
		t.Fatalf("unexpected: %v", err)
	}
}
