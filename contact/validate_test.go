package main

import "testing"

func TestValidate(t *testing.T) {
	long := make([]byte, 5001)
	for i := range long {
		long[i] = 'a'
	}
	cases := []struct {
		name string
		in   ContactRequest
		want []string // field keys expected
	}{
		{"ok", ContactRequest{Name: "Ada", Email: "ada@example.com", Message: "Hello there"}, nil},
		{"missing all", ContactRequest{}, []string{"name", "email", "message"}},
		{"bad email", ContactRequest{Name: "Ada", Email: "nope", Message: "hi"}, []string{"email"}},
		{"message too long", ContactRequest{Name: "Ada", Email: "ada@example.com", Message: string(long)}, []string{"message"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := Validate(c.in)
			if len(got) != len(c.want) {
				t.Fatalf("got %v want keys %v", got, c.want)
			}
			for _, k := range c.want {
				if _, ok := got[k]; !ok {
					t.Fatalf("missing key %q in %v", k, got)
				}
			}
		})
	}
}

func TestIsSpam(t *testing.T) {
	if !IsSpam(ContactRequest{Website: "http://x"}, 10) {
		t.Fatal("honeypot filled should be spam")
	}
	if !IsSpam(ContactRequest{}, 1) {
		t.Fatal("sub-3s fill should be spam")
	}
	if IsSpam(ContactRequest{}, 9) {
		t.Fatal("clean + slow should not be spam")
	}
}
