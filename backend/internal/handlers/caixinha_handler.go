package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type CaixinhaHandler struct {
	Service *services.CaixinhaService
}

func NewCaixinhaHandler(service *services.CaixinhaService) *CaixinhaHandler {
	return &CaixinhaHandler{Service: service}
}

func (h *CaixinhaHandler) Create(w http.ResponseWriter, r *http.Request) {
	var caixinha models.Caixinha

	err := json.NewDecoder(r.Body).Decode(&caixinha)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criada, err := h.Service.Create(caixinha)
	if err != nil {
		if errors.Is(err, services.ErrEmptyCaixinhaName) ||
			errors.Is(err, services.ErrInvalidCaixinhaColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrCaixinhaAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, criada)
}

func (h *CaixinhaHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	caixinhas, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, caixinhas)
}

func (h *CaixinhaHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	caixinha, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrCaixinhaNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, caixinha)
}

func (h *CaixinhaHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var caixinha models.Caixinha
	err = json.NewDecoder(r.Body).Decode(&caixinha)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, caixinha)
	if err != nil {
		if errors.Is(err, services.ErrCaixinhaNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrEmptyCaixinhaName) ||
			errors.Is(err, services.ErrInvalidCaixinhaColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrCaixinhaAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *CaixinhaHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	err = h.Service.Delete(id)
	if err != nil {
		if errors.Is(err, services.ErrCaixinhaNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrCannotDeleteDefaultCaixinha) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
