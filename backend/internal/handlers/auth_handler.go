package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"finance_app/internal/auth"
)

type loginRequest struct {
	Password string `json:"password"`
}

type loginResponse struct {
	Token string `json:"token"`
}

type authStatusResponse struct {
	AuthRequired bool `json:"auth_required"`
}

func AuthStatus(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, authStatusResponse{AuthRequired: os.Getenv("APP_PASSWORD") != ""})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if !auth.CheckPassword(req.Password, os.Getenv("APP_PASSWORD")) {
		respondError(w, http.StatusUnauthorized, "invalid password")
		return
	}

	token := auth.IssueToken(os.Getenv("APP_TOKEN_SECRET"))
	respondJSON(w, http.StatusOK, loginResponse{Token: token})
}
