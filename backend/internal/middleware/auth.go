package middleware

import (
	"net/http"
	"os"
	"strings"

	"finance_app/internal/auth"
)

// RequireAuth guards every route except /login with a bearer token.
// If APP_PASSWORD is unset, auth is skipped entirely (frictionless local dev).
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if os.Getenv("APP_PASSWORD") == "" || r.URL.Path == "/login" || r.URL.Path == "/auth/status" {
			next.ServeHTTP(w, r)
			return
		}

		token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		if !ok || auth.VerifyToken(token, os.Getenv("APP_TOKEN_SECRET")) != nil {
			unauthorized(w)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(`{"error":"unauthorized"}`))
}
