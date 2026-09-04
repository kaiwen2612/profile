package main

import "context"

type Message struct {
	FromName  string
	FromEmail string
	Body      string
}

type Mailer interface {
	Send(ctx context.Context, m Message) error
}
