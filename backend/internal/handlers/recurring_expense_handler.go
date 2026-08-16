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
		errors.Is(err, services.ErrEmptyBucket) ||
		errors.Is(err, services.ErrEmptyBank) ||
		errors.Is(err, services.ErrEmptySubcategory) ||
		errors.Is(err, services.ErrCategoryNotFound) ||
		errors.Is(err, services.ErrPersonNotFound) ||
		errors.Is(err, services.ErrPaymentMethodNotFound) ||
		errors.Is(err, services.ErrBucketNotFound) ||
		errors.Is(err, services.ErrBankNotFound) ||
		errors.Is(err, services.ErrSubcategoryNotFound) ||
		errors.Is(err, services.ErrInvalidPlanYear) ||
		errors.Is(err, services.ErrInvalidPlanMonth) {
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

type recurringBulkCreateRequest struct {
	Rows []models.RecurringExpense `json:"rows"`
}

type recurringBulkRowResponse struct {
	Row   int    `json:"row"`
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

type recurringBulkCreateResponse struct {
	Results []recurringBulkRowResponse `json:"results"`
	Created []models.RecurringExpense  `json:"created"`
}

func (h *RecurringExpenseHandler) CreateBulk(w http.ResponseWriter, r *http.Request) {
	var req recurringBulkCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	outcomes := h.Service.CreateBulk(req.Rows)

	results := make([]recurringBulkRowResponse, len(outcomes))
	created := []models.RecurringExpense{}
	for i, outcome := range outcomes {
		if outcome.Err != nil {
			results[i] = recurringBulkRowResponse{Row: outcome.Row, OK: false, Error: outcome.Err.Error()}
			continue
		}
		results[i] = recurringBulkRowResponse{Row: outcome.Row, OK: true}
		created = append(created, outcome.Created)
	}

	respondJSON(w, http.StatusOK, recurringBulkCreateResponse{Results: results, Created: created})
}

func (h *RecurringExpenseHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	year, err := strconv.Atoi(r.URL.Query().Get("plan_year"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid plan_year")
		return
	}

	month, err := strconv.Atoi(r.URL.Query().Get("plan_month"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid plan_month")
		return
	}

	recurrences, err := h.Service.GetAllByMonth(year, month)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, recurrences)
}

func (h *RecurringExpenseHandler) LatestMonthWithData(w http.ResponseWriter, r *http.Request) {
	beforeYear, err := strconv.Atoi(r.URL.Query().Get("before_year"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid before_year")
		return
	}

	beforeMonth, err := strconv.Atoi(r.URL.Query().Get("before_month"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid before_month")
		return
	}

	year, month, found, err := h.Service.LatestMonthWithData(beforeYear, beforeMonth)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if !found {
		respondError(w, http.StatusNotFound, "no earlier month with planning data")
		return
	}

	respondJSON(w, http.StatusOK, map[string]int{"year": year, "month": month})
}

type replaceMonthRequest struct {
	PlanYear  int                       `json:"plan_year"`
	PlanMonth int                       `json:"plan_month"`
	Rows      []models.RecurringExpense `json:"rows"`
}

func (h *RecurringExpenseHandler) ReplaceMonth(w http.ResponseWriter, r *http.Request) {
	var req replaceMonthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created, err := h.Service.ReplaceMonth(req.PlanYear, req.PlanMonth, req.Rows)
	if err != nil {
		if badRequestOnValidationError(w, err) {
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, created)
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
