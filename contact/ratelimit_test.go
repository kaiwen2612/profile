package main

import (
	"testing"
	"time"
)

func TestFixedWindowLimiter(t *testing.T) {
	now := time.Unix(0, 0)
	l := NewFixedWindowLimiter(5, time.Minute)
	l.now = func() time.Time { return now }

	for i := 0; i < 5; i++ {
		if !l.Allow("1.2.3.4") {
			t.Fatalf("request %d should be allowed", i)
		}
	}
	if l.Allow("1.2.3.4") {
		t.Fatal("6th request in window must be blocked")
	}
	if !l.Allow("5.6.7.8") {
		t.Fatal("a different IP is independent")
	}
	now = now.Add(61 * time.Second)
	if !l.Allow("1.2.3.4") {
		t.Fatal("window elapsed — should be allowed again")
	}
}
