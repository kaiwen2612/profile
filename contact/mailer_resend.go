package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type ResendMailer struct {
	apiKey string
	from   string
	to     string
	httpDo func(*http.Request) (*http.Response, error)
}

func NewResendMailer(apiKey, from, to string) *ResendMailer {
	return &ResendMailer{apiKey: apiKey, from: from, to: to, httpDo: http.DefaultClient.Do}
}

func (m *ResendMailer) Send(ctx context.Context, msg Message) error {
	payload := map[string]any{
		"from":     m.from,
		"to":       []string{m.to},
		"reply_to": msg.FromEmail,
		"subject":  fmt.Sprintf("Profile site contact from %s", msg.FromName),
		"text":     fmt.Sprintf("From: %s <%s>\n\n%s", msg.FromName, msg.FromEmail, msg.Body),
	}
	b, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.httpDo(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend: status %d: %s", resp.StatusCode, string(body))
	}
	return nil
}
