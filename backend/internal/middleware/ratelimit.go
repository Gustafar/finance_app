package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// ipLimiter hands out one token-bucket rate.Limiter per client IP. Fine at
// this app's scale (a handful of personal devices) — no eviction, the map
// just won't grow meaningfully.
type ipLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	r        rate.Limit
	burst    int
}

func newIPLimiter(r rate.Limit, burst int) *ipLimiter {
	return &ipLimiter{limiters: make(map[string]*rate.Limiter), r: r, burst: burst}
}

func (l *ipLimiter) allow(ip string) bool {
	l.mu.Lock()
	limiter, ok := l.limiters[ip]
	if !ok {
		limiter = rate.NewLimiter(l.r, l.burst)
		l.limiters[ip] = limiter
	}
	l.mu.Unlock()

	return limiter.Allow()
}

var (
	// ~5 attempts, then 1 every 3 minutes — blocks realistic password brute-forcing.
	loginLimiter = newIPLimiter(rate.Every(3*time.Minute), 5)
	// ~60/min sustained with a matching burst — just an abuse guard for the rest of the API.
	generalLimiter = newIPLimiter(rate.Every(time.Second), 60)
)

func RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)

		limiter := generalLimiter
		if r.URL.Path == "/login" {
			limiter = loginLimiter
		}

		if !limiter.allow(ip) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"too many requests"}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}

// clientIP prefers X-Forwarded-For (Render sits behind a proxy) and falls
// back to RemoteAddr for local dev.
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
