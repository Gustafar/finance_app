package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type RecurringExpenseHandler struct {
	Service *services.RecurringExpenseService
}

func NewRecurringExpenseHandler(service *services.RecurringExpenseService) *RecurringExpenseHandler {
	return &RecurringExpenseHandler{Service: service}
}

func badRequestOnValidationError(w http.ResponseWriter, err error) bool {
	if errors.Is(err, services.ErrEmptyRecurringExpenseName) ||
		errors.Is(err, services.ErrInvalidAmount) ||
		errors.Is(err, services.ErrInvalidType) ||
		errors.Is(err, services.ErrInvalidRecurringExpenseDay) ||
		errors.Is(err, services.ErrEmptyCategory) ||
		errors.Is(err, services.ErrEmptyPerson) ||
		errors.Is(err, services.ErrEmptyPaymentMethod) ||
		errors.Is(err, services.ErrEmptyCaixinha) ||
		errors.Is(err, services.ErrCategoryNotFound) ||
		errors.Is(err, services.ErrPersonNotFound) ||
		errors.Is(err, services.ErrPaymentMethodNotFound) ||
		errors.Is(err, services.ErrCaixinhaNotFound) {
		respondError(w, http.StatusBadRequest, err.Error())
		return true
	}
	return false
}

func (h *RecurringExpenseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var recurring models.RecurringExpense

	if err := json.NewDecoder(r.Body).Decode(&recurring); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created, err := h.Service.Create(recurring)
	if err != nil {
		if badRequestOnValidationError(w, err) {
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, created)
}

func (h *RecurringExpenseHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	recurrences, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, recurrences)
}

func (h *RecurringExpenseHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	recurring, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrRecurringExpenseNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, recurring)
}

func (h *RecurringExpenseHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var recurring models.RecurringExpense
	if err := json.NewDecoder(r.Body).Decode(&recurring); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, recurring)
	if err != nil {
		if errors.Is(err, services.ErrRecurringExpenseNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if badRequestOnValidationError(w, err) {
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *RecurringExpenseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.Service.Delete(id); err != nil {
		if errors.Is(err, services.ErrRecurringExpenseNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
