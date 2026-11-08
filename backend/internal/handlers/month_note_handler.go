package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type MonthNoteHandler struct {
	Service *services.MonthNoteService
}

func NewMonthNoteHandler(service *services.MonthNoteService) *MonthNoteHandler {
	return &MonthNoteHandler{Service: service}
}

func monthNoteValidationError(err error) bool {
	return errors.Is(err, services.ErrInvalidNoteYear) ||
		errors.Is(err, services.ErrInvalidNoteMonth) ||
		errors.Is(err, services.ErrEmptyNoteContent)
}

func (h *MonthNoteHandler) GetByMonth(w http.ResponseWriter, r *http.Request) {
	year, err := strconv.Atoi(r.URL.Query().Get("year"))
	if err != nil {
		respondError(w, http.StatusBadRequest, services.ErrInvalidNoteYear.Error())
		return
	}

	month, err := strconv.Atoi(r.URL.Query().Get("month"))
	if err != nil {
		respondError(w, http.StatusBadRequest, services.ErrInvalidNoteMonth.Error())
		return
	}

	notes, err := h.Service.GetByMonth(year, month)
	if err != nil {
		if monthNoteValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, notes)
}

func (h *MonthNoteHandler) Create(w http.ResponseWriter, r *http.Request) {
	var note models.MonthNote
	if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created, err := h.Service.Create(note)
	if err != nil {
		if monthNoteValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, created)
}

func (h *MonthNoteHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var note models.MonthNote
	if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, note)
	if err != nil {
		if errors.Is(err, services.ErrNoteNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if monthNoteValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *MonthNoteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.Service.Delete(id); err != nil {
		if errors.Is(err, services.ErrNoteNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
