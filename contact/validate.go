package main

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

const (
	maxName    = 100
	maxEmail   = 200
	maxMessage = 5000
)

var emailRe = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

type ContactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
	Website string `json:"website"` // honeypot: must be empty
}

type FieldErrors map[string]string

func Validate(r ContactRequest) FieldErrors {
	fe := FieldErrors{}
	name := strings.TrimSpace(r.Name)
	email := strings.TrimSpace(r.Email)
	msg := strings.TrimSpace(r.Message)

	switch {
	case name == "":
		fe["name"] = "required"
	case utf8.RuneCountInString(name) > maxName:
		fe["name"] = "too_long"
	}
	switch {
	case email == "":
		fe["email"] = "required"
	case utf8.RuneCountInString(email) > maxEmail:
		fe["email"] = "too_long"
	case !emailRe.MatchString(email):
		fe["email"] = "invalid"
	}
	switch {
	case msg == "":
		fe["message"] = "required"
	case utf8.RuneCountInString(msg) > maxMessage:
		fe["message"] = "too_long"
	}
	return fe
}

func IsSpam(r ContactRequest, elapsedSeconds float64) bool {
	if strings.TrimSpace(r.Website) != "" {
		return true
	}
	return elapsedSeconds < 3
}
