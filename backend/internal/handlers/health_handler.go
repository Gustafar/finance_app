package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"time"
)

type HealthHandler struct {
	db *sql.DB
}

func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

// Check runs a trivial query so the database registers activity — keeps the
// Supabase free tier from pausing the project after 7 idle days.
func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var one int
	if err := h.db.QueryRowContext(ctx, "SELECT 1").Scan(&one); err != nil {
		respondError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
